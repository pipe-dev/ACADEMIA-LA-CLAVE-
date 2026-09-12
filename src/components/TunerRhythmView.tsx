'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Drum, Play, RotateCcw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { voicePlayback } from '../utils/voicePlaybackService';
import { audioService } from '../utils/audioService';

interface TunerRhythmViewProps {
  level: number;
  pattern: { time: number; instrument: 'clap' | 'kick' }[];
  bpm?: number;
  onSuccess: (score: number) => void;
  onFail?: () => void;
  onExit?: () => void;
  hideExitButton?: boolean;
}

export const TunerRhythmView: React.FC<TunerRhythmViewProps> = ({
  level,
  pattern,
  bpm = 100,
  onSuccess,
  onFail,
  onExit,
  hideExitButton = false
}) => {
  const [phase, setPhase] = useState<'guide' | 'playing' | 'results'>('guide');
  const [score, setScore] = useState<number>(0);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; color: string; side: 'left' | 'right' }[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [activeButton, setActiveButton] = useState<'kick' | 'clap' | null>(null);

  const ballControls = useAnimationControls();
  const [sphereTarget, setSphereTarget] = useState<'center' | 'kick' | 'clap'>('center');

  // Track exact ball coordinates to prevent abrupt snaps
  const currentYRef = useRef<number>(-90);
  const currentXRef = useRef<number>(0);

  const floatingIdRef = useRef(0);
  const userTapsRef = useRef<{ time: number; instrument: 'clap' | 'kick'; pulseIndex?: number; deviationMs?: number }[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const evaluateTapsRef = useRef<() => void>(() => {});

  const addFloating = (text: string, color: string, side: 'left' | 'right') => {
    const id = ++floatingIdRef.current;
    setFloatingTexts(prev => [...prev.slice(-3), { id, text, color, side }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 900);
  };

  // Smooth sinusoidal ball jump & organic bounce physics
  const triggerBallJump = useCallback(
    (target: 'center' | 'kick' | 'clap') => {
      setSphereTarget(target);

      if (target === 'center') {
        currentYRef.current = -90;
        currentXRef.current = 0;

        // Gentle breathing in center: x glides once and NEVER loops!
        ballControls.start({
          x: 0,
          y: [-94, -86, -94],
          scaleX: [1, 1.025, 1],
          scaleY: [1, 0.975, 1],
          rotate: 0,
          transition: {
            x: { duration: 0.35, ease: [0.25, 1, 0.5, 1] }, // Single smooth glide to 0, no repeat
            rotate: { duration: 0.3 },
            y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            scaleX: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            scaleY: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
          }
        });
        return;
      }

      const targetX = target === 'kick' ? -105 : 105;
      const tilt = target === 'kick' ? -8 : 8;
      const startY = currentYRef.current;
      currentYRef.current = 0;
      currentXRef.current = targetX;

      // Ultra-smooth sinusoidal arc: continuous curve with soft organic floor squash
      ballControls.start({
        x: targetX,
        y: [startY, -155, 4, -4, 0],
        scaleX: [1, 0.94, 1.18, 0.97, 1],
        scaleY: [1, 1.10, 0.82, 1.04, 1],
        rotate: [0, tilt, 0],
        transition: {
          x: { duration: 0.52, ease: [0.35, 0, 0.25, 1] }, // Smooth sinusoidal horizontal travel
          y: {
            duration: 0.52,
            times: [0, 0.42, 0.72, 0.86, 1],
            ease: ['easeInOut', 'easeIn', 'easeOut', 'easeInOut']
          },
          scaleX: {
            duration: 0.52,
            times: [0, 0.42, 0.72, 0.86, 1],
            ease: 'easeInOut'
          },
          scaleY: {
            duration: 0.52,
            times: [0, 0.42, 0.72, 0.86, 1],
            ease: 'easeInOut'
          },
          rotate: { duration: 0.52, ease: 'easeInOut' }
        }
      });
    },
    [ballControls]
  );

  const [countInNumber, setCountInNumber] = useState<number | null>(null);
  const isRunningRef = useRef(false);
  const currentBeatRef = useRef(0);
  const exerciseStartTimeRef = useRef(0);
  const playPhaseStartTimeRef = useRef(0);
  const metronomeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guideScheduleTimersRef = useRef<NodeJS.Timeout[]>([]);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishExerciseRef = useRef<() => void>(() => {});

  const beatMs = (60 / bpm) * 1000;
  const maxPatternTime = pattern.length > 0 ? Math.max(...pattern.map(p => p.time), 1000) : 2000;
  const patternBars = Math.max(1, Math.ceil((maxPatternTime + beatMs * 0.5) / (4 * beatMs)));

  // Continuous steady metronome engine: ticks on EVERY single beat until exercise completes!
  const startExercise = useCallback(() => {
    // 1. Clean previous timers
    isRunningRef.current = false;
    if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    guideScheduleTimersRef.current.forEach(clearTimeout);
    guideScheduleTimersRef.current = [];
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // 2. Reset state
    setPhase('guide');
    setCountInNumber(1);
    setScore(0);
    setCombo(0);
    setFloatingTexts([]);
    userTapsRef.current = [];
    triggerBallJump('center');

    const countInBeats = 4; // 1 full 4-beat bar of count-in
    const guideBeats = patternBars * 4; // Guide demonstration bars
    const playStartBeat = countInBeats + guideBeats;

    isRunningRef.current = true;
    currentBeatRef.current = 0;
    exerciseStartTimeRef.current = Date.now();

    const leapLeadMs = 374; // Impact occurs at 72% of 0.52s = 374ms

    // Pre-schedule guide demonstration leaps ahead of the beat, so landing and audio hit occur on the exact downbeat!
    pattern.forEach(hit => {
      const audioTime = (countInBeats * beatMs) + hit.time;
      const launchTime = audioTime - leapLeadMs;

      // Leap launch in the air ahead of the beat
      const leapTimer = setTimeout(() => {
        if (!isRunningRef.current) return;
        triggerBallJump(hit.instrument);
      }, launchTime);
      guideScheduleTimersRef.current.push(leapTimer);

      // Floor impact audio hit (synchronized with ball reaching floor at 374ms and metronome tick)
      const hitTimer = setTimeout(() => {
        if (!isRunningRef.current) return;
        if (hit.instrument === 'kick') {
          voicePlayback.playKick();
          setActiveButton('kick');
        } else {
          voicePlayback.playClap();
          setActiveButton('clap');
        }
        setTimeout(() => setActiveButton(null), 120);
      }, audioTime);
      guideScheduleTimersRef.current.push(hitTimer);
    });

    const tickBeat = () => {
      if (!isRunningRef.current) return;
      const beat = currentBeatRef.current;

      // Steady audible metronome tick on EVERY beat indefinitely
      voicePlayback.playMetronomeTick();

      // Phase 1: Count-in (beats 0..3)
      if (beat < countInBeats) {
        setCountInNumber(beat + 1);
        // Subtle hop in center for beats 0, 1, 2 (beat 3 launches leap to hit 0)
        if (beat < countInBeats - 1) {
          ballControls.start({
            x: 0,
            y: [-90, -112, -90],
            scaleX: [1, 0.96, 1.03, 1],
            scaleY: [1, 1.06, 0.97, 1],
            rotate: 0,
            transition: { duration: 0.28, ease: 'easeInOut' }
          });
        }
      }
      // Phase 2: Guide demonstration starts on beat 4
      else if (beat === countInBeats) {
        setCountInNumber(null);
      }
      // Phase 3: Active Play phase begins on downbeat
      else if (beat === playStartBeat) {
        setPhase('playing');
        playPhaseStartTimeRef.current = Date.now();
        triggerBallJump('center');
        audioService.playSoftDing();
      }

      // Metronome runs indefinitely, NEVER cutting off on a timer!
      // The exercise ONLY ends when the user finishes tapping the pattern.
      currentBeatRef.current++;
      const nextTime = exerciseStartTimeRef.current + currentBeatRef.current * beatMs;
      const delay = Math.max(0, nextTime - Date.now());
      metronomeTimerRef.current = setTimeout(tickBeat, delay);
    };

    // Launch first beat immediately
    tickBeat();
  }, [bpm, pattern, patternBars, beatMs, triggerBallJump, ballControls]);

  const finishExercise = useCallback(() => {
    // Cease metronome engine and clear active timers
    isRunningRef.current = false;
    if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    guideScheduleTimersRef.current.forEach(clearTimeout);
    guideScheduleTimersRef.current = [];

    setPhase('results');
    setCountInNumber(null);

    const taps = userTapsRef.current;
    if (taps.length === 0) {
      setScore(0);
      ballControls.start({
        x: 0,
        y: -90,
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.3 }
      });
      return;
    }

    // ─── Evaluación Musical: Desviación Respecto a Cada Pulso ───
    let totalPrecision = 0;

    pattern.forEach((expected, idx) => {
      const userTap = taps[idx];
      if (!userTap) return;

      if (userTap.instrument === expected.instrument) {
        const devMs = userTap.deviationMs ?? Math.abs(userTap.time - (Math.round(userTap.time / beatMs) * beatMs));
        let hitScore = 0;
        if (devMs <= 50) {
          hitScore = 100;
        } else if (devMs <= 220) {
          hitScore = Math.max(15, 100 - ((devMs - 50) / 170) * 85);
        } else {
          hitScore = 10;
        }
        totalPrecision += hitScore;
      } else {
        totalPrecision += 0;
      }
    });

    const rawScore = Math.round(totalPrecision / pattern.length);
    const finalScore = Math.max(0, Math.min(100, rawScore));
    setScore(finalScore);

    if (finalScore >= 80) {
      // Single smooth celebratory jump that lands calmly: NO infinite loop, NO 360 spin
      ballControls.start({
        x: 0,
        y: [-90, -135, -90],
        rotate: 0,
        scaleX: [1, 0.95, 1.05, 1],
        scaleY: [1, 1.08, 0.96, 1],
        transition: { duration: 0.6, ease: 'easeInOut' }
      });
      setTimeout(() => onSuccess(finalScore), 750);
    } else {
      // Settle calmly at center without looping
      ballControls.start({
        x: 0,
        y: -90,
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.35, ease: 'easeOut' }
      });
      audioService.playSadDefeatSound();
      if (onFail) {
        onFail();
      }
    }
  }, [pattern, ballControls, onSuccess, onFail]);

  finishExerciseRef.current = finishExercise;

  useEffect(() => {
    startExercise();
    return () => {
      isRunningRef.current = false;
      if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      guideScheduleTimersRef.current.forEach(clearTimeout);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [startExercise]);

  // ─── Control de Pulsación del Usuario ───
  const handleTap = (instrument: 'kick' | 'clap') => {
    if (phase !== 'playing' || !isRunningRef.current) return;
    if (userTapsRef.current.length >= pattern.length) return; // Ignore extra taps once pattern count is reached

    // Trigger exact sinusoidal leap with bottom squash
    triggerBallJump(instrument);

    if (instrument === 'kick') {
      voicePlayback.playKick();
    } else {
      voicePlayback.playClap();
    }

    const now = Date.now();
    const tapTime = now - playPhaseStartTimeRef.current;

    // ─── Desviación respecto a cada pulso del metrónomo ───
    const nearestPulseIndex = Math.round(tapTime / beatMs);
    const nearestPulseTime = nearestPulseIndex * beatMs;
    const deviationMs = Math.abs(tapTime - nearestPulseTime);

    const currentTapIndex = userTapsRef.current.length;
    const expectedHit = pattern[currentTapIndex];
    const isCorrectInstrument = expectedHit && instrument === expectedHit.instrument;

    userTapsRef.current.push({ time: tapTime, instrument, pulseIndex: nearestPulseIndex, deviationMs });

    const side = instrument === 'kick' ? 'left' : 'right';
    const roundedDiff = Math.round(deviationMs);

    if (!isCorrectInstrument) {
      const expectedName = expectedHit?.instrument === 'kick' ? 'Bombo' : 'Palmas';
      addFloating(`¡Era ${expectedName}!`, 'text-rose-400', side);
      setCombo(0);
    } else if (deviationMs <= 60) {
      addFloating(`¡Perfecto! ±${roundedDiff}ms`, 'text-emerald-400', side);
      setCombo(prev => prev + 1);
    } else if (deviationMs <= 150) {
      addFloating(`¡Bien! ±${roundedDiff}ms`, 'text-amber-400', side);
      setCombo(prev => prev + 1);
    } else if (deviationMs <= 220) {
      addFloating(`¡A tiempo! ±${roundedDiff}ms`, 'text-sky-400', side);
    } else {
      addFloating(`¡A destiempo! ±${roundedDiff}ms`, 'text-rose-400', side);
      setCombo(0);
    }

    // EL EJERCICIO SOLO ACABA CUANDO EL USUARIO HAYA HECHO LA MISMA CANTIDAD DE GOLPES QUE EL RITMO DE PRUEBA
    if (userTapsRef.current.length === pattern.length) {
      setTimeout(() => {
        finishExerciseRef.current();
      }, 400);
    }
  };

  // Physical keyboard listeners (Left/A = Kick, Right/D = Clap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handleTap('kick');
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleTap('clap');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!hideExitButton && onExit ? (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Afinador</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            Nivel {level} • {bpm} BPM
          </span>
        </div>
      </div>

      {/* Stage Visualizer: Spacious Arcade Arena */}
      <div className="relative min-h-[310px] sm:min-h-[350px] rounded-3xl bg-[#e9f0ff] dark:bg-[#0b1828] border border-blue-100 dark:border-slate-800 flex flex-col items-center justify-between pt-4 px-4 pb-0 overflow-hidden shadow-inner">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />

        {/* Phase Status Banner at the Top */}
        <div className="relative z-10 w-full flex items-center justify-center pt-1">
          {phase === 'guide' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-heading font-extrabold text-xs shadow-xs backdrop-blur-xs">
              <Drum className="w-4 h-4 animate-bounce text-indigo-500" />
              <span>{countInNumber !== null ? `Conteo: ${countInNumber} de 4` : 'Escucha la guía con atención...'}</span>
            </div>
          )}
          {phase === 'playing' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-heading font-extrabold text-xs shadow-xs backdrop-blur-xs animate-pulse">
              <Play className="w-4 h-4 text-emerald-500" />
              <span>¡Ahora tú! Sigue el ritmo</span>
            </div>
          )}
          {phase === 'results' && (
            <div className="space-y-1 text-center bg-white/95 dark:bg-slate-900/95 px-6 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-xs">
              <div className="text-lg font-heading font-black text-slate-900 dark:text-white">
                Precisión: {score}%
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {score >= 80 ? '¡Excelente compás! Nivel Aprobado' : 'Necesitas al menos 80% para aprobar'}
              </p>
            </div>
          )}
        </div>

        {/* Main Jump Arena: Stage with Baseline Plunging to Buttons */}
        <div className="relative w-full flex-1 min-h-[230px] flex items-end justify-center pb-0 overflow-visible">
          {/* 3D Ball with Spherical Shaders: Hardware GPU accelerated */}
          <motion.div
            initial={{ x: 0, y: -90, scaleX: 1, scaleY: 1, rotate: 0 }}
            animate={ballControls}
            style={{
              transformOrigin: '50% 100%',
              willChange: 'transform',
              background:
                'radial-gradient(circle at 45% 40%, #e0e7ff 0%, #a5b4fc 20%, #6366f1 45%, #4338ca 70%, #1e1b4b 90%, #0c0a2a 100%)',
              boxShadow:
                'inset -8px -10px 22px rgba(10, 8, 38, 0.95), inset 5px 6px 14px rgba(255, 255, 255, 0.45), inset 0 -3px 8px rgba(165, 180, 252, 0.35), 0 16px 30px -4px rgba(15, 23, 42, 0.45)'
            }}
            className="w-20 h-20 rounded-full relative z-20 cursor-default overflow-hidden border border-white/20 transform-gpu"
          >
            {/* 3D Specular Highlight Bulb (Glass sheen) */}
            <div className="absolute top-2.5 left-4 w-6 h-3.5 rounded-full bg-gradient-to-b from-white/80 via-white/35 to-transparent blur-[0.6px] pointer-events-none transform -rotate-12" />
            <div className="absolute top-3 left-5.5 w-2 h-1.5 rounded-full bg-white/95 blur-[0.3px] pointer-events-none" />

            {/* Central 3D Volume Light Bloom */}
            <div className="absolute inset-2.5 rounded-full bg-gradient-to-tr from-transparent via-indigo-100/20 to-white/25 blur-[1.5px] pointer-events-none" />

            {/* Floor Ambient Bounce Light on bottom edge */}
            <div className="absolute bottom-1 left-3.5 right-3.5 h-2 rounded-full bg-indigo-200/25 blur-[1px] pointer-events-none" />
          </motion.div>
        </div>

        {/* Floating Feedback & Combo Counter */}
        {floatingTexts.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.15 }}
            transition={{ duration: 0.8 }}
            className={`absolute top-14 ${
              f.side === 'left' ? 'left-8 sm:left-12' : 'right-8 sm:right-12'
            } font-heading font-black text-lg drop-shadow-md z-30 ${f.color}`}
          >
            {f.text}
          </motion.div>
        ))}

        {combo >= 2 && (
          <div className="relative z-10 text-sm font-heading font-black text-amber-500 animate-bounce pb-0.5">
            ⚡ Combo x{combo}
          </div>
        )}
      </div>

      {/* Control Buttons: 3D Tactile Arcade Triggers */}
      {phase !== 'results' ? (
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={phase !== 'playing'}
            onClick={() => handleTap('kick')}
            className={`py-6 px-4 rounded-2xl font-heading font-black text-white text-xl tracking-wider shadow-[0_6px_0_0_#1d4ed8] active:translate-y-1.5 active:shadow-[0_1px_0_0_#1d4ed8] transition-all cursor-pointer flex items-center justify-center relative overflow-hidden ${
              phase === 'playing'
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500'
                : 'bg-blue-400/50 cursor-not-allowed opacity-60'
            }`}
          >
            <span>BOMBO</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={phase !== 'playing'}
            onClick={() => handleTap('clap')}
            className={`py-6 px-4 rounded-2xl font-heading font-black text-white text-xl tracking-wider shadow-[0_6px_0_0_#b91c1c] active:translate-y-1.5 active:shadow-[0_1px_0_0_#b91c1c] transition-all cursor-pointer flex items-center justify-center relative overflow-hidden ${
              phase === 'playing'
                ? 'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500'
                : 'bg-rose-400/50 cursor-not-allowed opacity-60'
            }`}
          >
            <span>PALMAS</span>
          </motion.button>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          <button
            onClick={startExercise}
            className="flex-1 py-4 rounded-2xl font-heading font-extrabold text-base text-white bg-[#4648d4] shadow-[0_5px_0_0_#2c2abc] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reintentar Ritmo</span>
          </button>
        </div>
      )}
    </div>
  );
};
