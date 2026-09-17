'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import { voicePlayback } from '../utils/voicePlaybackService';
import { Mic, Volume2, CheckCircle2, RefreshCw, Sparkles, Award, Music, ArrowDown, ArrowUp, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { emitStreakEligibleAction } from '../utils/streakPrompt';

interface VocalRangeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSaveRange?: (rangeData: { minHz: number; maxHz: number; noteMin: string; noteMax: string; classification: string; gender?: 'masculino' | 'femenino' }) => void;
  isEmbeddedView?: boolean;
}

// Convert Hz to Musical Note name + Octave (e.g. 261.6 Hz -> C4 / Do4)
function hzToNoteName(freq: number): { noteName: string; octave: number; fullName: string } {
  if (freq < 30) return { noteName: 'C', octave: 1, fullName: 'Do1' };
  
  const noteNamesEs = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const noteIdx = (midi % 12 + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNamesEs[noteIdx];
  
  return {
    noteName,
    octave,
    fullName: `${noteName}${octave}`
  };
}

// Determine Vocal Classification based on lowest and highest pitch in Hz and voice gender
function classifyVoice(minHz: number, maxHz: number, gender: 'male' | 'female' = 'male'): { classification: string; description: string; tips: string[] } {
  if (gender === 'female') {
    if (minHz >= 200 || maxHz >= 700) {
      return {
        classification: 'Soprano',
        description: 'Voz femenina brillante y aguda, con gran capacidad en el registro superior.',
        tips: [
          'Utiliza el apoyo abdominal constante para proyectar sobreagudos.',
          'Practica vocalizaciones ligadas sin tensionar el cuello.'
        ]
      };
    } else if (minHz >= 155) {
      return {
        classification: 'Mezzosoprano',
        description: 'Voz femenina intermedia muy versátil, con graves cálidos y agudos expresivos.',
        tips: [
          'Desarrolla la voz mixta para transiciones suaves.',
          'Cuida la resonancia de pecho en pasajes medios.'
        ]
      };
    } else {
      return {
        classification: 'Contralto',
        description: 'Voz femenina grave y profunda, de timbre oscuro, cálido y resonante.',
        tips: [
          'Aprovecha la sonoridad de tu registro de pecho.',
          'Mantén el diafragma relajado para dar cuerpo a las notas graves.'
        ]
      };
    }
  } else {
    // Male vocal classifications
    if (minHz < 82) { // Below E2 (< 82 Hz) -> True Bass
      return {
        classification: 'Bajo',
        description: 'Voz masculina muy grave con graves profundos y resonantes en registro inferior.',
        tips: [
          'Mantén el diafragma relajado y profundo.',
          'Cuida la hidratación constante para proteger los pliegues vocales.'
        ]
      };
    } else if (minHz <= 135) { // F2 to C3 (82 Hz - 135 Hz) -> Barítono (includes Fa2, Fa#2, Sol2, La2, Si2, Do3)
      return {
        classification: 'Barítono',
        description: 'La voz masculina más versátil. Equilibrio perfecto entre graves cálidos y medios potentes.',
        tips: [
          'Desarrolla la resonancia en la máscara para facilitar tonos medios sin fatiga.',
          'Evita empujar aire excesivo al buscar notas agudas.'
        ]
      };
    } else { // Above C3 (> 135 Hz) -> Tenor
      return {
        classification: 'Tenor',
        description: 'Voz masculina aguda. Gran flexibilidad en tonos medios-altos y registro agudo.',
        tips: [
          'Mantén la mandíbula relajada en la zona de paso (Fa4 - Sol4).',
          'Usa el apoyo de aire para mantener agudos limpios.'
        ]
      };
    }
  }
}

export const VocalRangeModal: React.FC<VocalRangeModalProps> = ({
  isOpen = true,
  onClose,
  onSaveRange,
  isEmbeddedView = false
}) => {
  const [step, setStep] = useState<'intro' | 'lowest' | 'highest' | 'result'>('intro');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female' | null>(() => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino') return 'male';
      if (saved === 'femenino') return 'female';
    } catch {}
    return null;
  });
  const [genderErrorToast, setGenderErrorToast] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  
  // Real-time pitch tracking
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [_currentVol, setCurrentVol] = useState<number>(0);
  
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
      setCurrentVol(volume);

      if (pitchHz > 50 && pitchHz < 1200 && volume > 0.008) {
        // Track candidate pitch for stability
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

  // Reproduce SIEMPRE la voz real de la carpeta /public/sounds/ correspondiente al género del usuario
  const playLowestGuide = () => {
    const isFemale = voiceGender === 'female';
    if (isFemale) {
      // Guía grave femenina: La3 (220 Hz)
      voicePlayback.playVoiceNote({ name: 'La', midi: 57, frequency: 220.00, octave: 3 }, 'femenino', 2.2);
    } else {
      // Guía grave masculina: Do3 (130.81 Hz)
      voicePlayback.playVoiceNote({ name: 'Do', midi: 48, frequency: 130.81, octave: 3 }, 'masculino', 2.2);
    }
  };

  const playHighestGuide = () => {
    const isFemale = voiceGender === 'female';
    if (isFemale) {
      // Guía aguda femenina: Do5 (523.25 Hz)
      voicePlayback.playVoiceNote({ name: 'Do', midi: 72, frequency: 523.25, octave: 5 }, 'femenino', 2.2);
    } else {
      // Guía aguda masculina: Sol4 (392.00 Hz)
      voicePlayback.playVoiceNote({ name: 'Sol', midi: 67, frequency: 392.00, octave: 4 }, 'masculino', 2.2);
    }
  };

  // Calculations for final result step (Auto-sort min and max Hz to prevent negative octaves if sung in reverse)
  const rawLowest = lowestHz || (voiceGender === 'female' ? 196 : 110);
  const rawHighest = highestHz || (voiceGender === 'female' ? 659 : 440);
  const minHzVal = Math.min(rawLowest, rawHighest);
  const maxHzVal = Math.max(rawLowest, rawHighest);

  const lowestNoteInfo = hzToNoteName(minHzVal);
  const highestNoteInfo = hzToNoteName(maxHzVal);
  const octavesRange = (Math.log2(maxHzVal / minHzVal)).toFixed(1);
  const vocalEval = classifyVoice(minHzVal, maxHzVal, voiceGender || 'male');

  const handleSaveAndClose = () => {
    if (isSavedSuccess) return;
    audioService.playClickSound();

    const finalGender: 'masculino' | 'femenino' = voiceGender === 'female' ? 'femenino' : 'masculino';
    const rangeData = {
      minHz: minHzVal,
      maxHz: maxHzVal,
      noteMin: lowestNoteInfo.fullName,
      noteMax: highestNoteInfo.fullName,
      classification: vocalEval.classification,
      gender: finalGender
    };

    try {
      localStorage.setItem('laclave_vocal_range_saved', JSON.stringify(rangeData));
      localStorage.setItem('laclave_vocal_range_classification', vocalEval.classification);
      localStorage.setItem('laclave_voice_gender', finalGender);
    } catch (e) {
      console.warn('Could not save vocal range:', e);
    }

    if (onSaveRange) {
      onSaveRange(rangeData);
    }

    // Play ding and confetti
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

        {/* STEP 1: Intro / Instructions */}
        {step === 'intro' && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
                ¿Cómo funciona la prueba?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Encuentra tu nota más baja y más aguda. El afinador detectará mediante tu micrófono ambas notas con voz firme.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <span>Cantarás tu nota más grave cómoda (Paso 1).</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <span>Cantarás tu nota más aguda cómoda (Paso 2).</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <span>Calcularemos tus octavas y tu clasificación exacta.</span>
                </div>
              </div>
            </div>

            {/* Voice Gender Category Selector - Prominent Card with Border Glow */}
            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 space-y-3 ${
              !voiceGender
                ? 'bg-[#eff2fe] dark:bg-[#0b1b30] border-indigo-500 shadow-[0_0_18px_rgba(99,102,241,0.45)]'
                : 'bg-[#eff2fe] dark:bg-[#0b1b30] border-indigo-200/90 dark:border-indigo-800/80 shadow-sm'
            }`}>
              <h4 className="font-heading font-black text-xs sm:text-sm text-[#0b1c30] dark:text-[#d3e4fe] flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 dark:bg-indigo-400"></span>
                </span>
                <span>Paso inicial: Selecciona tu tipo de voz principal</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audioService.playClickSound();
                    setVoiceGender('male');
                    try {
                      localStorage.setItem('laclave_voice_gender', 'masculino');
                    } catch {}
                    voicePlayback.preloadNotes('masculino');
                  }}
                  className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-black font-heading transition-all cursor-pointer text-center ${
                    voiceGender === 'male'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Voz Masculina
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioService.playClickSound();
                    setVoiceGender('female');
                    try {
                      localStorage.setItem('laclave_voice_gender', 'femenino');
                    } catch {}
                    voicePlayback.preloadNotes('femenino');
                  }}
                  className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-black font-heading transition-all cursor-pointer text-center ${
                    voiceGender === 'female'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Voz Femenina
                </button>
              </div>
            </div>

            {genderErrorToast && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 text-center animate-shake px-1">
                {genderErrorToast}
              </p>
            )}

            <button
              onClick={() => {
                if (!voiceGender) {
                  audioService.vibrate(18);
                  setGenderErrorToast('Selecciona si tu voz es Masculina o Femenina para comenzar.');
                  setTimeout(() => setGenderErrorToast(null), 3000);
                  return;
                }
                audioService.playClickSound();
                setStep('lowest');
                startPitchDetection('lowest');
              }}
              className={`w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-center transition-all ${
                !voiceGender
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                  : 'tactile-btn-primary cursor-pointer'
              }`}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
              <span>Comenzar Detección (Nota Grave)</span>
            </button>
          </div>
        )}

        {/* STEP 2: Find Lowest Note (Nota Grave) */}
        {step === 'lowest' && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-indigo-100 dark:border-slate-800 text-center space-y-3">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <ArrowDown className="w-4 h-4" /> Paso 1: Tu Nota Más Grave
              </span>

              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                Canta hacia abajo lo más grave que puedas con voz clara y sin carraspear. Sostén la nota 1.5 segundos.
              </p>

              {/* Pitch Display Card */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Nota Detectada
                </span>
                <div className="font-heading font-extrabold text-3xl text-indigo-600 dark:text-indigo-300">
                  {currentPitch ? hzToNoteName(currentPitch).fullName : 'Escuchando tu voz...'}
                </div>
              </div>

              {/* Hold Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Sostén la nota firme...</span>
                  <span>{holdProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-150"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={playLowestGuide}
                className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer text-center"
              >
                <Volume2 className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>Oír Guía ({voiceGender === 'female' ? 'La3' : 'Do3'})</span>
              </button>

              <button
                onClick={() => {
                  setLowestHz(110); // Manual fallback (La2)
                  audioService.stopMicrophone();
                  setIsListening(false);
                  setStep('highest');
                }}
                className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-heading font-bold text-xs hover:bg-indigo-100 cursor-pointer text-center"
              >
                <span>Siguiente (Usar La2)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Find Highest Note (Nota Aguda) */}
        {step === 'highest' && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-purple-100 dark:border-slate-800 text-center space-y-3">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <ArrowUp className="w-4 h-4" /> Paso 2: Tu Nota Más Aguda
              </span>

              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                Ahora canta hacia arriba lo más alto que puedas cómodamente (voz de pecho o cabeza limpia). Sostén 1.5 segundos.
              </p>

              {/* Pitch Display Card */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Nota Detectada
                </span>
                <div className="font-heading font-extrabold text-3xl text-purple-600 dark:text-purple-300">
                  {currentPitch ? hzToNoteName(currentPitch).fullName : 'Escuchando tu voz...'}
                </div>
              </div>

              {/* Hold Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Sostén la nota firme...</span>
                  <span>{holdProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-150"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {!isListening ? (
              <button
                onClick={() => startPitchDetection('highest')}
                className="w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl tactile-btn-primary font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-lg text-center"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
                <span>Activar Micrófono para Nota Aguda</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={playHighestGuide}
                  className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer text-center"
                >
                  <Volume2 className="w-4 h-4 shrink-0 text-purple-500" />
                  <span>Oír Guía ({voiceGender === 'female' ? 'Do5' : 'Sol4'})</span>
                </button>

                <button
                  onClick={() => {
                    setHighestHz(440); // Manual fallback
                    audioService.stopMicrophone();
                    setIsListening(false);
                    setStep('result');
                  }}
                  className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-heading font-bold text-xs hover:bg-purple-100 cursor-pointer text-center"
                >
                  <span>Usar La4</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Final Result & Classification */}
        {step === 'result' && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Header Result Badge */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#0b1828] dark:to-[#171b29] p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 text-center space-y-2">
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 rounded-full inline-block">
                Tu Clasificación Vocal
              </span>

              <h2 className="font-heading font-extrabold text-2xl text-[#0b1c30] dark:text-[#d3e4fe]">
                {vocalEval.classification}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                {vocalEval.description}
              </p>

              {/* Rango en Octavas Pill */}
              <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl shadow-xs mt-1">
                <Music className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Rango: {octavesRange} Octavas
                </span>
              </div>
            </div>

            {/* Notes Breakdown (Grave vs Aguda) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nota Más Grave
                </span>
                <span className="font-heading font-extrabold text-lg text-indigo-600 dark:text-indigo-400 block">
                  {lowestNoteInfo.fullName}
                </span>
              </div>

              <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nota Más Aguda
                </span>
                <span className="font-heading font-extrabold text-lg text-purple-600 dark:text-purple-400 block">
                  {highestNoteInfo.fullName}
                </span>
              </div>
            </div>

            {/* Practical Vocal Tips */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Consejos de Entrenamiento para tu Tesitura:</span>
              </h4>
              <ul className="space-y-1.5 pt-1">
                {vocalEval.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {!isSavedSuccess && (
                <button
                  onClick={() => setStep('intro')}
                  className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-200 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Repetir</span>
                </button>
              )}

              {isSavedSuccess ? (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 350 }}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 400, delay: 0.05 }}
                    className="p-1 bg-white/20 rounded-full"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white stroke-[3]" />
                  </motion.div>
                  <span>¡Rango Sincronizado Con Éxito!</span>
                </motion.div>
              ) : (
                <button
                  onClick={handleSaveAndClose}
                  className="flex-1 py-3.5 rounded-2xl tactile-btn-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Guardar en mi Perfil</span>
                </button>
              )}
            </div>
          </div>
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
