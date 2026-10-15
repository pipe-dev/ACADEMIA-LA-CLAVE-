'use client';
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Mic, ArrowLeft } from 'lucide-react';
import { audioService } from '../utils/audioService';
import { voicePlayback } from '../utils/voicePlaybackService';
import { emitStreakEligibleAction } from '../utils/streakPrompt';
import { emitQuestEvent } from '../utils/dailyQuestsEngine';
import { VocalRangeModalProps, VocalRangeStep } from './vocal-range/vocalRangeTypes';
import { hzToNoteName, classifyVoice } from './vocal-range/vocalRangeUtils';
import { getEvaluationComparison, recordVocalRangeEvaluation } from '../utils/vocalRangeHelper';
import { VocalRangeIntroStep } from './vocal-range/VocalRangeIntroStep';
import { VocalRangeDetectionStep } from './vocal-range/VocalRangeDetectionStep';
import { VocalRangeResultStep } from './vocal-range/VocalRangeResultStep';

export type { VocalRangeModalProps } from './vocal-range/vocalRangeTypes';

export const VocalRangeModal: React.FC<VocalRangeModalProps> = ({
  isOpen = true,
  onClose,
  onSaveRange,
  isEmbeddedView = false
}) => {
  const [step, setStep] = useState<VocalRangeStep>('intro');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female' | null>(() => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino') return 'male';
      if (saved === 'femenino') return 'female';
    } catch {}
    return null;
  });
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  
  // Real-time pitch tracking
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  
  // Detected Lowest & Highest Hz
  const [lowestHz, setLowestHz] = useState<number | null>(null);
  const [highestHz, setHighestHz] = useState<number | null>(null);
  
  // Hold stability timer for locked note detection
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const stablePitchRef = useRef<{ pitch: number; count: number }>({ pitch: 0, count: 0 });

  useEffect(() => {
    audioService.playOpenSound();
    if (voiceGender) {
      voicePlayback.preloadNotes(voiceGender === 'female' ? 'femenino' : 'masculino');
    }
  }, [voiceGender]);

  const handleClose = () => {
    audioService.stopMicrophone();
    audioService.playCloseSound();
    onClose();
  };

  const startPitchDetection = async (targetMode: 'lowest' | 'highest') => {
    audioService.playClickSound();
    setCurrentPitch(null);
    setHoldProgress(0);
    stablePitchRef.current = { pitch: 0, count: 0 };

    const ok = await audioService.startMicrophone((pitchHz, volume) => {
      setCurrentPitch(pitchHz);

      if (pitchHz > 50 && pitchHz < 1200 && volume > 0.008) {
        if (Math.abs(pitchHz - stablePitchRef.current.pitch) < 8) {
          stablePitchRef.current.count += 1;
        } else {
          stablePitchRef.current.pitch = pitchHz;
          stablePitchRef.current.count = 1;
        }

        const pct = Math.min(100, Math.round((stablePitchRef.current.count / 15) * 100));
        setHoldProgress(pct);

        if (stablePitchRef.current.count >= 15) { // Held for ~1.5 sec
          const confirmedHz = Math.round(stablePitchRef.current.pitch);
          audioService.playSoftDing();

          if (targetMode === 'lowest') {
            setLowestHz(confirmedHz);
            audioService.stopMicrophone();
            setIsListening(false);
            setStep('highest');
          } else if (targetMode === 'highest') {
            setHighestHz(confirmedHz);
            audioService.stopMicrophone();
            setIsListening(false);
            setStep('result');
            
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 }
            });
          }
        }
      } else {
        setHoldProgress(0);
      }
    });

    if (!ok) {
      alert('Se requiere acceso al micrófono para realizar la prueba de tesitura vocal.');
      return;
    }

    setIsListening(true);
  };

  const playLowestGuide = () => {
    const isFemale = voiceGender === 'female';
    if (isFemale) {
      voicePlayback.playVoiceNote({ name: 'La', midi: 57, frequency: 220.00, octave: 3 }, 'femenino', 2.2);
    } else {
      voicePlayback.playVoiceNote({ name: 'Do', midi: 48, frequency: 130.81, octave: 3 }, 'masculino', 2.2);
    }
  };

  const playHighestGuide = () => {
    const isFemale = voiceGender === 'female';
    if (isFemale) {
      voicePlayback.playVoiceNote({ name: 'Do', midi: 72, frequency: 523.25, octave: 5 }, 'femenino', 2.2);
    } else {
      voicePlayback.playVoiceNote({ name: 'Sol', midi: 67, frequency: 392.00, octave: 4 }, 'masculino', 2.2);
    }
  };

  // Calculations for final result step
  const rawLowest = lowestHz || (voiceGender === 'female' ? 196 : 110);
  const rawHighest = highestHz || (voiceGender === 'female' ? 659 : 440);
  const minHzVal = Math.min(rawLowest, rawHighest);
  const maxHzVal = Math.max(rawLowest, rawHighest);

  const lowestNoteInfo = hzToNoteName(minHzVal);
  const highestNoteInfo = hzToNoteName(maxHzVal);
  const octavesRange = (Math.log2(maxHzVal / minHzVal)).toFixed(1);
  const vocalEval = classifyVoice(minHzVal, maxHzVal, voiceGender || 'male');

  const comparison = React.useMemo(() => {
    return getEvaluationComparison(minHzVal, maxHzVal);
  }, [minHzVal, maxHzVal]);

  const handleSaveAndClose = () => {
    if (isSavedSuccess) return;
    audioService.playClickSound();

    const finalGender: 'masculino' | 'femenino' = voiceGender === 'female' ? 'femenino' : 'masculino';

    // Ratchet rule: protect historical best boundary so range only increases, never decreases
    let finalMinHz = minHzVal;
    let finalMaxHz = maxHzVal;
    let finalNoteMin = lowestNoteInfo.fullName;
    let finalNoteMax = highestNoteInfo.fullName;

    try {
      const prevSaved = localStorage.getItem('laclave_vocal_range_saved');
      if (prevSaved) {
        const prev = JSON.parse(prevSaved);
        if (prev.minHz && prev.minHz > 0 && finalMinHz > prev.minHz) {
          finalMinHz = prev.minHz;
          finalNoteMin = prev.noteMin;
        }
        if (prev.maxHz && prev.maxHz > 0 && finalMaxHz < prev.maxHz) {
          finalMaxHz = prev.maxHz;
          finalNoteMax = prev.noteMax;
        }
      }
    } catch {}

    const finalClassification = classifyVoice(finalMinHz, finalMaxHz, voiceGender || 'male').classification;

    const rangeData = {
      minHz: finalMinHz,
      maxHz: finalMaxHz,
      noteMin: finalNoteMin,
      noteMax: finalNoteMax,
      classification: finalClassification,
      gender: finalGender
    };

    recordVocalRangeEvaluation(rangeData);

    if (onSaveRange) {
      onSaveRange(rangeData);
    }

    audioService.playSoftDing();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24']
      });
    } catch {}

    setIsSavedSuccess(true);
    emitStreakEligibleAction();
    emitQuestEvent('VOCAL_RANGE_TESTED', 1);

    setTimeout(() => {
      handleClose();
      setIsSavedSuccess(false);
    }, 1300);
  };

  if (!isOpen && !isEmbeddedView) return null;

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 w-full space-y-5 shadow-md relative border border-slate-100 dark:border-[#1b2b3f] transition-colors">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={handleClose}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato Biométrico
        </span>
      </div>

      {/* Main Title */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-[#4648d4] dark:text-[#c0c1ff] flex items-center justify-center shadow-xs shrink-0">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-extrabold text-[#4648d4] dark:text-[#c0c1ff] uppercase tracking-wider block">
            TEST VOCAL
          </span>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Rango vocal rápido
          </h3>
        </div>
      </div>

      {/* Step 1: Intro */}
      {step === 'intro' && (
        <VocalRangeIntroStep
          voiceGender={voiceGender}
          onSelectGender={(g) => {
            audioService.playClickSound();
            setVoiceGender(g);
            try {
              localStorage.setItem('laclave_voice_gender', g === 'female' ? 'femenino' : 'masculino');
            } catch {}
            voicePlayback.preloadNotes(g === 'female' ? 'femenino' : 'masculino');
          }}
          onStart={() => {
            audioService.playClickSound();
            setStep('lowest');
            startPitchDetection('lowest');
          }}
        />
      )}

      {/* Step 2: Lowest Note */}
      {step === 'lowest' && (
        <VocalRangeDetectionStep
          targetMode="lowest"
          currentPitch={currentPitch}
          holdProgress={holdProgress}
          isListening={isListening}
          voiceGender={voiceGender}
          onStartMic={() => startPitchDetection('lowest')}
          onPlayGuide={playLowestGuide}
          onFallback={() => {
            setLowestHz(110);
            audioService.stopMicrophone();
            setIsListening(false);
            setStep('highest');
          }}
        />
      )}

      {/* Step 3: Highest Note */}
      {step === 'highest' && (
        <VocalRangeDetectionStep
          targetMode="highest"
          currentPitch={currentPitch}
          holdProgress={holdProgress}
          isListening={isListening}
          voiceGender={voiceGender}
          onStartMic={() => startPitchDetection('highest')}
          onPlayGuide={playHighestGuide}
          onFallback={() => {
            setHighestHz(440);
            audioService.stopMicrophone();
            setIsListening(false);
            setStep('result');
          }}
        />
      )}

      {/* Step 4: Result */}
      {step === 'result' && (
        <VocalRangeResultStep
          vocalEval={vocalEval}
          octavesRange={octavesRange}
          lowestNote={lowestNoteInfo.fullName}
          highestNote={highestNoteInfo.fullName}
          isSavedSuccess={isSavedSuccess}
          comparison={comparison}
          onRepeat={() => setStep('intro')}
          onSave={handleSaveAndClose}
        />
      )}
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer" onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        {innerContent}
      </div>
    </div>
  );
};

export default VocalRangeModal;
