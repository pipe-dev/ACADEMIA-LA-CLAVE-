'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import {
  getComfortableChromaticNotes,
  generateUserNotePool,
  voicePlayback,
  ChromaticNoteButtonInfo
} from '../utils/voicePlaybackService';
import { 
  Target, Mic, Trophy, Activity, ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { emitStreakEligibleAction } from '../utils/streakPrompt';

interface StabilityChallengeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
}

export const StabilityChallengeModal: React.FC<StabilityChallengeModalProps> = ({
  isOpen = true,
  onClose,
  onGrantXp,
  isEmbeddedView = false
}) => {
  const toleranceHz = 3.5; // Tight tolerance range ±3.5 Hz

  const getInitialRangeState = () => {
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      if (saved) return JSON.parse(saved) as { noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string } | null;
    } catch {}
    return null;
  };

  const getInitialGender = (): 'masculino' | 'femenino' => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
    } catch {}
    return 'femenino';
  };

  // Rango vocal + género guardados en la app: delimitan la octava y qué voces reales suenan
  const [effectiveRangeData, setEffectiveRangeData] = useState<{ noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string } | null>(getInitialRangeState);
  const [gender, setGender] = useState<'masculino' | 'femenino'>(getInitialGender);

  // Re-lee el rango calibrado cada vez que se abre el reto para estar sincronizado
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) return;
    try {
      const savedRange = localStorage.getItem('laclave_vocal_range_saved');
      if (savedRange) setEffectiveRangeData(JSON.parse(savedRange));
    } catch {}
    try {
      const savedGender = localStorage.getItem('laclave_voice_gender');
      if (savedGender === 'masculino' || savedGender === 'femenino') setGender(savedGender);
    } catch {}
  }, [isOpen, isEmbeddedView]);

  // Precarga las grabaciones reales de /public/sounds para el género del usuario
  useEffect(() => {
    if (isOpen || isEmbeddedView) voicePlayback.preloadNotes(gender);
  }, [gender, isOpen, isEmbeddedView]);

  // Pool completo de notas dentro del rango vocal detectado del usuario
  const userNotePool = useMemo(
    () => generateUserNotePool(effectiveRangeData, gender),
    [effectiveRangeData, gender]
  );

  // Octava cómoda del teclado (7 blancas + 5 negras) dentro del rango del usuario
  const { naturalNotes } = useMemo(
    () => getComfortableChromaticNotes(effectiveRangeData, gender),
    [effectiveRangeData, gender]
  );

  const isNoteInRange = (note: ChromaticNoteButtonInfo): boolean =>
    userNotePool.some(p => p.midi === note.midi);

  // Nota por defecto: LA si está en rango, si no la primera nota alcanzable
  const [selectedNote, setSelectedNote] = useState<ChromaticNoteButtonInfo>(() => {
    const range = getInitialRangeState();
    const voiceGender = getInitialGender();
    const chrom = getComfortableChromaticNotes(range, voiceGender);
    const pool = generateUserNotePool(range, voiceGender);
    const pick = (n: ChromaticNoteButtonInfo) => pool.some(p => p.midi === n.midi);
    return (
      chrom.naturalNotes.find(n => n.semitone === 9 && pick(n)) ||
      chrom.naturalNotes.find(pick) ||
      chrom.naturalNotes[0] ||
      chrom.allNotes[0]
    );
  });

  // Si el rango cambió y la nota ya no se alcanza, se re-ajusta solo
  useEffect(() => {
    if (!isNoteInRange(selectedNote)) {
      const laInRange = naturalNotes.find(n => n.semitone === 9 && isNoteInRange(n));
      setSelectedNote(
        laInRange || naturalNotes.find(isNoteInRange) || naturalNotes[0]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNotePool, naturalNotes]);

  // Challenge phase: 'setup' | 'singing' | 'results'
  const [phase, setPhase] = useState<'setup' | 'singing' | 'results'>('setup');

  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [inTuneSeconds, setInTuneSeconds] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [isCurrentlyInTune, setIsCurrentlyInTune] = useState<boolean>(false);

  // Results metrics
  const [finalScore, setFinalScore] = useState<number>(0);
  const [xpMultiplier, setXpMultiplier] = useState<number>(1.0);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  // Performance refs
  const animFrameRef = useRef<number | null>(null);
  const challengeStartTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const inTuneMsRef = useRef<number>(0);
  const latestPitchRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef<number>(0);
  const lastVibeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    audioService.stopMicrophone();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) {
      cleanup();
      setPhase('setup');
      setTimeLeft(10);
      setInTuneSeconds(0);
      setCurrentPitch(null);
      setIsCurrentlyInTune(false);
    }
    return () => cleanup();
  }, [isOpen, isEmbeddedView, cleanup]);

  const finishChallenge = (heldSeconds: number) => {
    cleanup();
    setPhase('results');
    emitStreakEligibleAction();
    const clampedHeld = Math.min(10, Math.max(0, Number(heldSeconds.toFixed(1))));

    let mult = 1.0;
    if (clampedHeld >= 8.5) mult = 3.0;
    else if (clampedHeld >= 6.0) mult = 2.0;
    else if (clampedHeld >= 3.0) mult = 1.5;

    const baseAmount = 25;
    const totalGrantedXp = Math.round(baseAmount * mult);

    setFinalScore(clampedHeld);
    setXpMultiplier(mult);
    setEarnedXp(totalGrantedXp);

    if (mult >= 2.0) {
      audioService.playBadgeUnlockedSound();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } else {
      audioService.playSoftDing();
    }

    if (onGrantXp) {
      onGrantXp(totalGrantedXp);
    }
  };

  const startChallenge = async () => {
    audioService.playClickSound();
    cleanup();

    setPhase('singing');
    setTimeLeft(10);
    setInTuneSeconds(0);
    setCurrentPitch(null);
    setIsCurrentlyInTune(false);

    inTuneMsRef.current = 0;
    latestPitchRef.current = null;
    const now = performance.now();
    challengeStartTimeRef.current = now;
    lastFrameTimeRef.current = now;
    lastStateUpdateRef.current = now;

    const targetFreq = selectedNote.frequency;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        latestPitchRef.current = pitchHz;
      } else {
        latestPitchRef.current = null;
      }
    });

    if (!micSuccess) {
      alert('Se requiere acceso al micrófono para el Desafío de Estabilidad.');
      setPhase('setup');
      return;
    }

    const loop = () => {
      const currentTime = performance.now();
      const deltaMs = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      const elapsedSec = (currentTime - challengeStartTimeRef.current) / 1000;
      const remainingSec = Math.max(0, 10 - elapsedSec);

      const pitch = latestPitchRef.current;
      let inTune = false;
      if (pitch !== null) {
        const diff = Math.abs(pitch - targetFreq);
        if (diff <= toleranceHz) {
          inTune = true;
          inTuneMsRef.current += deltaMs;

          if (currentTime - lastVibeRef.current > 1200) {
            audioService.vibrateInTune();
            lastVibeRef.current = currentTime;
          }
        }
      }

      // Check if 10 seconds finished
      if (remainingSec <= 0) {
        const finalHeld = inTuneMsRef.current / 1000;
        finishChallenge(finalHeld);
        return;
      }

      // Throttle React state updates to ~12 FPS (every 80ms) for ultra-smooth UI
      if (currentTime - lastStateUpdateRef.current >= 80) {
        lastStateUpdateRef.current = currentTime;
        setTimeLeft(Math.ceil(remainingSec));
        setInTuneSeconds(Number((inTuneMsRef.current / 1000).toFixed(1)));
        setCurrentPitch(pitch !== null ? Math.round(pitch) : null);
        setIsCurrentlyInTune(inTune);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] w-full rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-md space-y-5 relative">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            audioService.playCloseSound();
            cleanup();
            onClose();
          }}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato de Estabilidad
        </span>
      </div>

      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 shrink-0">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Desafío de Estabilidad Vocal
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Sostén la nota elegida fija durante 10s con estricta precisión de afinación
          </p>
        </div>
      </div>

      {/* PHASE: SETUP */}
      {phase === 'setup' && (
        <div className="space-y-4">
          {/* Note Selector */}
          <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Selecciona la nota del desafío:
              </label>

            <div className="grid grid-cols-7 gap-1.5">
              {naturalNotes.map((note) => {
                const isSel = selectedNote.name === note.name;
                const reachable = isNoteInRange(note);
                return (
                  <button
                    key={note.name}
                    disabled={!reachable}
                    onClick={() => {
                      if (!reachable) return;
                      audioService.playClickSound();
                      setSelectedNote(note);
                      voicePlayback.playVoiceNote(note, gender, 1.5);
                    }}
                    className={`p-2.5 rounded-2xl font-heading font-extrabold text-xs text-white flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSel ? 'ring-4 ring-indigo-400 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                    } ${!reachable ? 'opacity-25 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: note.bgColor }}
                  >
                    <span>{note.name}</span>
                    <span className="text-[8px] font-bold leading-none">{reachable ? `Oct ${note.octave}` : '—'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Cards on Multiplier Rewards */}
          <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Multiplicadores de XP por Retención
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-600 dark:text-slate-300 block">3.0s - 5.9s</span>
                <span className="text-indigo-600 font-black">1.5x XP</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-600 dark:text-slate-300 block">6.0s - 8.4s</span>
                <span className="text-amber-500 font-black">2.0x XP</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-600 dark:text-slate-300 block">8.5s - 10s</span>
                <span className="text-emerald-500 font-black">3.0x XP</span>
              </div>
            </div>
          </div>

          <button
            onClick={startChallenge}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-heading font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>¡Iniciar Desafío (10s)!</span>
          </button>
        </div>
      )}

      {/* PHASE: SINGING / COUNTDOWN */}
      {phase === 'singing' && (
        <div className="space-y-5 text-center py-1">
          {/* Visual Countdown Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-sm font-extrabold shadow-2xs border border-indigo-100 dark:border-indigo-900/60">
            <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>Tiempo Restante: {timeLeft}s</span>
          </div>

          {/* Visual Stability Card */}
          <div className={`p-6 rounded-3xl text-white space-y-4 relative overflow-hidden transition-colors duration-200 border-2 ${
            isCurrentlyInTune 
              ? 'bg-gradient-to-b from-emerald-600 to-teal-700 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : 'bg-slate-900 border-slate-700/80'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-2">
              <span>Tono Objetivo: {selectedNote.name}</span>
              <span className="text-indigo-300">{selectedNote.frequency} Hz</span>
            </div>

            <div className="font-heading font-black text-6xl tracking-widest text-white drop-shadow-sm">
              {selectedNote.name}
            </div>

            {/* Real-time Pitch Deviation Gauge */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300/80 px-1">
                <span>◀ Grave (Bajo)</span>
                <span className={isCurrentlyInTune ? 'text-emerald-300 font-extrabold' : 'text-slate-400'}>
                  Centro (±3.5 Hz)
                </span>
                <span>Agudo (Alto) ▶</span>
              </div>

              {/* Meter track */}
              <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden flex items-center justify-center">
                {/* Target green sweet spot zone */}
                <div className="w-16 h-full bg-emerald-500/50 rounded-full" />

                {/* Indicator needle dot */}
                {currentPitch && (
                  <div
                    className={`absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-transform duration-75 ease-out ${
                      isCurrentlyInTune ? 'bg-emerald-400 scale-110' : 'bg-rose-500'
                    }`}
                    style={{
                      transform: `translateX(${Math.max(-120, Math.min(120, ((currentPitch - selectedNote.frequency) / 12) * 50))}px)`
                    }}
                  />
                )}
              </div>
            </div>

            <div className="pt-1">
              <span className={`inline-block text-xs font-black px-3.5 py-1 rounded-full transition-colors duration-150 ${
                isCurrentlyInTune 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}>
                {isCurrentlyInTune ? '¡DENTRO DEL RANGO PERFECTO!' : currentPitch ? 'Ajustando afinación...' : 'Canta hacia el micrófono...'}
              </span>
            </div>

            {/* Progress Bar for Held Time */}
            <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-white h-full transition-[width] duration-150 ease-out" 
                style={{ width: `${Math.min(100, (inTuneSeconds / 10) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-white/90 block">
              Tiempo Estable: {inTuneSeconds.toFixed(1)}s / 10s
            </span>
          </div>
        </div>
      )}

      {/* PHASE: RESULTS */}
      {phase === 'results' && (
        <div className="space-y-5 text-center">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white space-y-2">
            <Trophy className="w-10 h-10 text-amber-300 mx-auto animate-bounce" />
            <h4 className="font-heading font-black text-xl">
              ¡Desafío Completado!
            </h4>
            <p className="text-xs text-indigo-100">
              Mantuviste la nota {selectedNote.name} estable durante {finalScore}s
            </p>
          </div>

          {/* Score Stats */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Multiplicador Conquistado
              </span>
              <span className="font-heading font-black text-2xl text-amber-500 block">
                {xpMultiplier.toFixed(1)}x XP
              </span>
              <span className="text-xs font-bold text-slate-500">
                Bonus de Precisión
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                XP Ganada
              </span>
              <span className="font-heading font-black text-2xl text-emerald-500 block">
                +{earnedXp} XP
              </span>
              <span className="text-xs font-bold text-slate-500">
                Agregada a tu perfil
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClickSound();
              setPhase('setup');
            }}
            className="w-full py-3 rounded-2xl bg-[#4648d4] hover:bg-indigo-600 text-white font-heading font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
          >
            ¡Intentar de Nuevo!
          </button>
        </div>
      )}
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer" onClick={() => { cleanup(); onClose(); }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-default"
      >
        {innerContent}
      </motion.div>
    </div>
  );
};

export default StabilityChallengeModal;
