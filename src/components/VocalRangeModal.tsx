'use client';
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Mic, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { audioService } from '../utils/audioService';
import { voicePlayback } from '../utils/voicePlaybackService';
import { calculateRawCentsOff } from '../utils/pitchUtils';
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
  isEmbeddedView = false,
  backLabel
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
  const currentTargetModeRef = useRef<'lowest' | 'highest'>('lowest');
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const stablePitchRef = useRef<{ basePitch: number; smoothedPitch: number; startTime: number }>({
    basePitch: 0,
    smoothedPitch: 0,
    startTime: 0
  });

  useEffect(() => {
    audioService.playOpenSound();
    if (voiceGender) {
      voicePlayback.preloadNotes(voiceGender === 'female' ? 'femenino' : 'masculino');
    }
    return () => {
      audioService.stopMicrophone();
    };
  }, [voiceGender]);

  const handleClose = () => {
    audioService.stopMicrophone();
    audioService.playCloseSound();
    setIsListening(false);
    onClose();
  };

  const startPitchDetection = async (targetMode: 'lowest' | 'highest') => {
    audioService.playClickSound();
    currentTargetModeRef.current = targetMode;
    setMicPermissionDenied(false);
    setCurrentPitch(null);
    setHoldProgress(0);
    stablePitchRef.current = { basePitch: 0, smoothedPitch: 0, startTime: 0 };

    const ok = await audioService.startMicrophone((pitchHz, volume) => {
      setCurrentPitch(pitchHz);

      // Filter plausible human singing frequencies and minimum volume
      if (pitchHz > 50 && pitchHz < 1200 && volume > 0.008) {
        const nowTime = performance.now();

        if (stablePitchRef.current.basePitch === 0) {
          stablePitchRef.current = {
            basePitch: pitchHz,
            smoothedPitch: pitchHz,
            startTime: nowTime
          };
          setHoldProgress(0);
        } else {
          // Both anchor distance (prevents glissando drift) and local distance (allows natural vibrato)
          const centsFromBase = Math.abs(calculateRawCentsOff(pitchHz, stablePitchRef.current.basePitch));
          const centsFromSmoothed = Math.abs(calculateRawCentsOff(pitchHz, stablePitchRef.current.smoothedPitch));

          if (centsFromBase <= 45 && centsFromSmoothed <= 45) {
            // Exponential moving average captures the true sustained pitch rather than the first frame
            stablePitchRef.current.smoothedPitch =
              stablePitchRef.current.smoothedPitch * 0.85 + pitchHz * 0.15;
            const elapsedMs = nowTime - stablePitchRef.current.startTime;
            const HOLD_DURATION_MS = 1500; // Exactly 1.5s as stated in user instructions
            const pct = Math.min(100, Math.round((elapsedMs / HOLD_DURATION_MS) * 100));
            setHoldProgress(pct);

            if (elapsedMs >= HOLD_DURATION_MS) {
              const confirmedHz = Math.round(stablePitchRef.current.smoothedPitch);
              audioService.playSoftDing();

              if (currentTargetModeRef.current === 'lowest') {
                setLowestHz(confirmedHz);
                audioService.stopMicrophone();
                setIsListening(false);
                setStep('highest');
              } else if (currentTargetModeRef.current === 'highest') {
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
            // User shifted or glided to a different pitch -> restart anchor and hold timer
            stablePitchRef.current = {
              basePitch: pitchHz,
              smoothedPitch: pitchHz,
              startTime: nowTime
            };
            setHoldProgress(0);
          }
        }
      } else {
        // Silence or invalid pitch resets hold progress
        stablePitchRef.current = { basePitch: 0, smoothedPitch: 0, startTime: 0 };
        setHoldProgress(0);
      }
    });

    if (!ok) {
      setIsListening(false);
      if (audioService.lastMicError === 'denied') {
        setMicPermissionDenied(true);
      }
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

  // Canonical fallback defaults by gender: Sol3 (196 Hz) / Mi5 (659 Hz) for female, La2 (110 Hz) / La4 (440 Hz) for male
  const fallbackLowest = voiceGender === 'female' ? 196 : 110;
  const fallbackHighest = voiceGender === 'female' ? 659 : 440;

  // Calculations for final result step: REAL TEST MEASUREMENTS
  const rawLowest = lowestHz || fallbackLowest;
  const rawHighest = highestHz || fallbackHighest;
  const minHzVal = Math.min(rawLowest, rawHighest);
  const maxHzVal = Math.max(rawLowest, rawHighest);

  // Real momentary evaluation of the current test session (does NOT overwrite with historical record)
  const evaluatedRange = React.useMemo(() => {
    const vocalEval = classifyVoice(minHzVal, maxHzVal, voiceGender || 'male');
    const octavesRange = (Math.log2(maxHzVal / minHzVal)).toFixed(1);
    const lowestNote = hzToNoteName(minHzVal).fullName;
    const highestNote = hzToNoteName(maxHzVal).fullName;

    return {
      minHz: minHzVal,
      maxHz: maxHzVal,
      lowestNote,
      highestNote,
      vocalEval,
      octavesRange
    };
  }, [minHzVal, maxHzVal, voiceGender]);

  // Consolidated range applying the ratchet rule so the operational profile (piano, tuner pool) never shrinks
  const consolidatedRange = React.useMemo(() => {
    let finalMinHz = minHzVal;
    let finalMaxHz = maxHzVal;
    let finalNoteMin = hzToNoteName(minHzVal).fullName;
    let finalNoteMax = hzToNoteName(maxHzVal).fullName;

    try {
      const prevSaved = localStorage.getItem('laclave_vocal_range_saved');
      if (prevSaved) {
        const prev = JSON.parse(prevSaved);
        if (prev.minHz && prev.minHz > 0 && finalMinHz > prev.minHz) {
          finalMinHz = prev.minHz;
          finalNoteMin = prev.noteMin || hzToNoteName(prev.minHz).fullName;
        }
        if (prev.maxHz && prev.maxHz > 0 && finalMaxHz < prev.maxHz) {
          finalMaxHz = prev.maxHz;
          finalNoteMax = prev.noteMax || hzToNoteName(prev.maxHz).fullName;
        }
      }
    } catch {}

    const vocalEval = classifyVoice(finalMinHz, finalMaxHz, voiceGender || 'male');
    const octavesRange = (Math.log2(finalMaxHz / finalMinHz)).toFixed(1);

    return {
      minHz: finalMinHz,
      maxHz: finalMaxHz,
      lowestNote: finalNoteMin,
      highestNote: finalNoteMax,
      vocalEval,
      octavesRange
    };
  }, [minHzVal, maxHzVal, voiceGender]);

  const comparison = React.useMemo(() => {
    return getEvaluationComparison(minHzVal, maxHzVal);
  }, [minHzVal, maxHzVal]);

  const handleSaveAndClose = () => {
    if (isSavedSuccess) return;
    audioService.playClickSound();

    const finalGender: 'masculino' | 'femenino' = voiceGender === 'female' ? 'femenino' : 'masculino';

    const currentEvalData = {
      minHz: evaluatedRange.minHz,
      maxHz: evaluatedRange.maxHz,
      noteMin: evaluatedRange.lowestNote,
      noteMax: evaluatedRange.highestNote,
      classification: evaluatedRange.vocalEval.classification,
      gender: finalGender
    };

    const protectedProfileData = {
      minHz: consolidatedRange.minHz,
      maxHz: consolidatedRange.maxHz,
      noteMin: consolidatedRange.lowestNote,
      noteMax: consolidatedRange.highestNote,
      classification: consolidatedRange.vocalEval.classification,
      gender: finalGender
    };

    recordVocalRangeEvaluation(currentEvalData, protectedProfileData);

    if (onSaveRange) {
      onSaveRange(protectedProfileData);
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

  const computedBackLabel = backLabel || (isEmbeddedView ? 'Volver al Afinador' : 'Volver');

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 w-full space-y-5 shadow-md relative border border-slate-100 dark:border-[#1b2b3f] transition-colors">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={handleClose}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{computedBackLabel}</span>
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

      {/* Mic Permission Guidance Banner */}
      {micPermissionDenied && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-black text-sm text-slate-800 dark:text-slate-100">
                Acceso al Micrófono Bloqueado
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                El navegador o tu teléfono tiene bloqueado el micrófono para esta app. Sigue estos pasos para activarlo:
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 font-medium">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-600 dark:text-amber-400">• iPhone (Safari):</span>
              <span>Toca el icono <strong className="font-bold">aA</strong> en la barra superior → Configuración del sitio web → Micrófono → Permitir.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-600 dark:text-amber-400">• Android (Chrome):</span>
              <span>Toca el icono de candado o ajustes en la barra web → Permisos → Micrófono → Permitir.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-600 dark:text-amber-400">• App Instalada (PWA):</span>
              <span>Ajustes del teléfono → AfinApp → Permisos → Micrófono → Permitir.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => startPitchDetection(step === 'highest' ? 'highest' : 'lowest')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ya lo activé, reintentar</span>
            </button>
            <button
              type="button"
              onClick={() => setMicPermissionDenied(false)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

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
            setLowestHz(fallbackLowest);
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
            setHighestHz(fallbackHighest);
            audioService.stopMicrophone();
            setIsListening(false);
            setStep('result');
          }}
        />
      )}

      {/* Step 4: Result */}
      {step === 'result' && (
        <VocalRangeResultStep
          vocalEval={evaluatedRange.vocalEval}
          octavesRange={evaluatedRange.octavesRange}
          lowestNote={evaluatedRange.lowestNote}
          highestNote={evaluatedRange.highestNote}
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer" onClick={handleClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        {innerContent}
      </div>
    </div>
  );
};

export default VocalRangeModal;
