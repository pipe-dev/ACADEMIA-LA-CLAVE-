'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Drum, Play, RotateCcw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { voicePlayback } from '../utils/voicePlaybackService';
import { audioService } from '../utils/audioService';

interface TunerRhythmViewProps {
  level: number;
  pattern: { time: number; instrument: 'clap' | 'kick' }[];
  bpm?: number;
  onSuccess: (score: number) => void;
  onExit: () => void;
}

export const TunerRhythmView: React.FC<TunerRhythmViewProps> = ({
  level,
  pattern,
  bpm = 100,
  onSuccess,
  onExit
}) => {
  const [phase, setPhase] = useState<'guide' | 'playing' | 'results'>('guide');
  const [score, setScore] = useState<number>(0);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; color: string; side: 'left' | 'right' }[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [activeButton, setActiveButton] = useState<'kick' | 'clap' | null>(null);

  // Purple sphere bounce, jump & squash deformation states
  const [sphereTarget, setSphereTarget] = useState<'center' | 'kick' | 'clap'>('center');
  const [isAirborne, setIsAirborne] = useState<boolean>(false);
  const [isSquashing, setIsSquashing] = useState<boolean>(false);
  const [impactEffect, setImpactEffect] = useState<'kick' | 'clap' | null>(null);
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);

  const floatingIdRef = useRef(0);
  const patternStartTimeRef = useRef(0);
  const userTapsRef = useRef<{ time: number; instrument: 'clap' | 'kick' }[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const jumpTimersRef = useRef<NodeJS.Timeout[]>([]);

  const addFloating = (text: string, color: string, side: 'left' | 'right') => {
    const id = ++floatingIdRef.current;
    setFloatingTexts(prev => [...prev.slice(-3), { id, text, color, side }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 900);
  };

  // Coordinated physical jump: High airborne parabolic flight -> Slam landing & Squash deformation -> Elastic recovery
  const triggerBallJump = useCallback((target: 'center' | 'kick' | 'clap', flightMs = 240) => {
    jumpTimersRef.current.forEach(clearTimeout);
    jumpTimersRef.current = [];

    // 1. Takeoff & Launch: rises high (-115px) and stretches vertically
    setSphereTarget(target);
    setIsAirborne(true);
    setIsSquashing(false);
    setImpactEffect(null);

    // 2. Landing: Ball plunges to the floor and squashes flat (scaleX: 1.55, scaleY: 0.50)
    const tImpact = setTimeout(() => {
      setIsAirborne(false);
      setIsSquashing(true);
      if (target !== 'center') {
        setImpactEffect(target);
      }
    }, flightMs);
    jumpTimersRef.current.push(tImpact);

    // 3. Recovery: Rebounds elastically back to normal round shape
    const tRecover = setTimeout(() => {
      setIsSquashing(false);
      setImpactEffect(null);
    }, flightMs + 180);
    jumpTimersRef.current.push(tRecover);
  }, []);

  const startGuidePhase = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    jumpTimersRef.current.forEach(clearTimeout);
    jumpTimersRef.current = [];

    setPhase('guide');
    setCombo(0);
    setFloatingTexts([]);
    userTapsRef.current = [];
    setSphereTarget('center');
    setIsAirborne(false);
    setIsSquashing(false);
    setImpactEffect(null);
    setIsCelebrating(false);

    const beatMs = (60 / bpm) * 1000;
    const patternDuration = pattern.length > 0 ? pattern[pattern.length - 1].time + beatMs * 2 : 3000;

    // Play metronome ticks for 2 count-in bars (4 beats) with pronounced center hops
    const countInTicks = 4;
    for (let i = 0; i < countInTicks; i++) {
      const t = setTimeout(() => {
        voicePlayback.playMetronomeTick();
        triggerBallJump('center', 160);
      }, i * beatMs);
      timeoutsRef.current.push(t);
    }

    const startPatternTime = countInTicks * beatMs;
    const leapLeadMs = Math.min(240, Math.round(beatMs * 0.55));

    // Schedule pattern guide sounds: leap launches ahead, lands and squashes exactly on beat
    pattern.forEach(hit => {
      // 1. Launch high airborne leap ahead of the beat
      const leapTimer = setTimeout(() => {
        triggerBallJump(hit.instrument, leapLeadMs);
      }, Math.max(0, startPatternTime + hit.time - leapLeadMs));
      timeoutsRef.current.push(leapTimer);

      // 2. Audio hit synchronized with landing
      const hitTimer = setTimeout(() => {
        if (hit.instrument === 'kick') {
          voicePlayback.playKick();
          setActiveButton('kick');
        } else {
          voicePlayback.playClap();
          setActiveButton('clap');
        }
        setTimeout(() => setActiveButton(null), 140);
      }, startPatternTime + hit.time);
      timeoutsRef.current.push(hitTimer);
    });

    // Switch to playing phase
    const endGuideTime = startPatternTime + patternDuration;
    const transitionTimer = setTimeout(() => {
      setPhase('playing');
      triggerBallJump('center', 200);
      patternStartTimeRef.current = Date.now();
      audioService.playSoftDing();
    }, endGuideTime);
    timeoutsRef.current.push(transitionTimer);
  }, [bpm, pattern, triggerBallJump]);

  useEffect(() => {
    startGuidePhase();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      jumpTimersRef.current.forEach(clearTimeout);
    };
  }, [startGuidePhase]);

  const evaluateTaps = () => {
    const taps = userTapsRef.current;
    if (taps.length === 0) {
      setScore(0);
      setPhase('results');
      triggerBallJump('center', 200);
      return;
    }

    let correctHits = 0;
    const toleranceMs = 220;

    pattern.forEach(expected => {
      const match = taps.find(
        t => t.instrument === expected.instrument && Math.abs(t.time - expected.time) <= toleranceMs
      );
      if (match) correctHits++;
    });

    const finalScore = Math.min(100, Math.round((correctHits / pattern.length) * 100));
    setScore(finalScore);
    setPhase('results');
    triggerBallJump('center', 200);

    if (finalScore >= 80) {
      setIsCelebrating(true);
      setTimeout(() => onSuccess(finalScore), 800);
    }
  };

  const handleTap = (instrument: 'kick' | 'clap') => {
    if (phase !== 'playing') return;

    // Trigger instant high leap and floor squash towards tapped button
    triggerBallJump(instrument, 200);

    const tapTime = Date.now() - patternStartTimeRef.current;
    userTapsRef.current.push({ time: tapTime, instrument });

    if (instrument === 'kick') {
      voicePlayback.playKick();
    } else {
      voicePlayback.playClap();
    }

    // Check accuracy against nearest expected hit
    const targetHit = pattern.find(p => p.instrument === instrument && Math.abs(p.time - tapTime) < 300);
    const diff = targetHit ? Math.abs(targetHit.time - tapTime) : 999;

    if (diff <= 80) {
      addFloating('¡Perfecto!', 'text-emerald-400', instrument === 'kick' ? 'left' : 'right');
      setCombo(prev => prev + 1);
    } else if (diff <= 180) {
      addFloating('¡Bien!', 'text-amber-400', instrument === 'kick' ? 'left' : 'right');
    } else {
      addFloating('¡Fuera de compás!', 'text-rose-400', instrument === 'kick' ? 'left' : 'right');
      setCombo(0);
    }

    // Check if user has tapped enough times to end the pattern
    if (userTapsRef.current.length >= pattern.length) {
      setTimeout(evaluateTaps, 400);
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
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Afinador</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            Nivel {level} • {bpm} BPM
          </span>
        </div>
      </div>

      {/* Stage Visualizer: Spacious Arcade Arena */}
      <div className="relative min-h-[310px] sm:min-h-[350px] rounded-3xl bg-[#e9f0ff] dark:bg-[#0b1828] border border-blue-100 dark:border-slate-800 flex flex-col items-center justify-between p-4 sm:p-5 overflow-hidden shadow-inner">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />

        {/* Phase Status Banner at the Top */}
        <div className="relative z-10 w-full flex items-center justify-center pt-1">
          {phase === 'guide' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-heading font-extrabold text-xs shadow-xs backdrop-blur-xs">
              <Drum className="w-4 h-4 animate-bounce text-indigo-500" />
              <span>Escucha la guía con atención...</span>
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

        {/* Main Jump Arena: Minimalist Clean Stage with Direct Plunge to Buttons */}
        <div className="relative w-full h-56 sm:h-64 flex items-center justify-center overflow-visible my-auto">
          {/* Moving Ground Shadow */}
          <motion.div
            animate={{
              x: sphereTarget === 'kick' ? -105 : sphereTarget === 'clap' ? 105 : 0,
              y: isSquashing ? 84 : 80,
              scale: isAirborne ? 0.45 : isSquashing ? 1.65 : 0.9,
              opacity: isAirborne ? 0.12 : isSquashing ? 0.85 : 0.35
            }}
            transition={{
              x: { type: 'spring', stiffness: 320, damping: 25 },
              scale: { duration: 0.16 },
              opacity: { duration: 0.16 }
            }}
            className="absolute bottom-6 w-18 h-4 bg-slate-900/40 dark:bg-black/70 rounded-full blur-xs pointer-events-none z-10"
          />

          {/* Expanding Impact Micro-Ripple near bottom edge */}
          {impactEffect && (
            <motion.div
              key={`ripple-${Date.now()}`}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className={`absolute bottom-4 w-20 h-7 rounded-full border-2 pointer-events-none z-10 ${
                impactEffect === 'kick'
                  ? 'border-blue-400 bg-blue-400/30 shadow-[0_0_24px_rgba(59,130,246,0.8)]'
                  : 'border-rose-400 bg-rose-400/30 shadow-[0_0_24px_rgba(244,63,94,0.8)]'
              }`}
              style={{
                left:
                  sphereTarget === 'kick'
                    ? 'calc(50% - 105px - 40px)'
                    : 'calc(50% + 105px - 40px)'
              }}
            />
          )}

          {/* Pure Full-Size Purple Sphere: Pronounced High Leap + Dramatic Ground Squash Deformation */}
          <motion.div
            animate={{
              x: sphereTarget === 'kick' ? -105 : sphereTarget === 'clap' ? 105 : 0,
              y: isCelebrating
                ? [0, -75, 0, -35, 0]
                : isAirborne
                ? -118 // High airborne leap!
                : isSquashing
                ? 78 // Deep against the ground on landing!
                : sphereTarget === 'center'
                ? -20
                : 70,
              scaleX: isSquashing
                ? 1.55 // Pronounced squash: 55% wider!
                : isAirborne
                ? 0.76 // Pronounced stretch in flight: thinner
                : 1,
              scaleY: isSquashing
                ? 0.48 // Pronounced squash: compressed to half height!
                : isAirborne
                ? 1.34 // Pronounced stretch in flight: 34% taller!
                : 1,
              rotate: isCelebrating ? [0, 360] : 0
            }}
            transition={{
              x: { type: 'spring', stiffness: 320, damping: 25 },
              y: isCelebrating
                ? { duration: 0.85, repeat: Infinity, ease: 'easeInOut' }
                : isAirborne
                ? { duration: 0.22, ease: [0.15, 0.85, 0.35, 1.2] } // Punchy launch up
                : isSquashing
                ? { duration: 0.12, ease: 'easeIn' } // Heavy slam into floor squash
                : { type: 'spring', stiffness: 340, damping: 20 }, // Smooth recovery
              scaleX: { duration: 0.14, ease: 'easeOut' },
              scaleY: { duration: 0.14, ease: 'easeOut' },
              rotate: isCelebrating ? { duration: 1.2, repeat: Infinity, ease: 'linear' } : undefined
            }}
            className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#6366f1] via-[#4648d4] to-[#2c2abc] shadow-[0_12px_28px_rgba(70,72,212,0.5)] border-t-2 border-white/40 relative z-20 cursor-default transition-all duration-150 ${
              impactEffect === 'kick'
                ? 'ring-4 ring-blue-400 shadow-[0_0_35px_rgba(37,99,235,0.95)]'
                : impactEffect === 'clap'
                ? 'ring-4 ring-rose-400 shadow-[0_0_35px_rgba(225,29,72,0.95)]'
                : 'ring-2 ring-indigo-300/40'
            }`}
          />
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
            className={`py-6 px-4 rounded-2xl font-heading font-black text-white text-lg tracking-wide shadow-[0_6px_0_0_#1d4ed8] active:translate-y-1.5 active:shadow-[0_1px_0_0_#1d4ed8] transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
              phase === 'playing'
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500'
                : 'bg-blue-400/50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>BOMBO</span>
              <span className="text-xs font-normal opacity-85 px-2 py-0.5 rounded-md bg-black/20">
                Kick
              </span>
            </div>
            <span className="text-[11px] font-medium opacity-80">Tecla ← o A</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={phase !== 'playing'}
            onClick={() => handleTap('clap')}
            className={`py-6 px-4 rounded-2xl font-heading font-black text-white text-lg tracking-wide shadow-[0_6px_0_0_#b91c1c] active:translate-y-1.5 active:shadow-[0_1px_0_0_#b91c1c] transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
              phase === 'playing'
                ? 'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500'
                : 'bg-rose-400/50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>PALMAS</span>
              <span className="text-xs font-normal opacity-85 px-2 py-0.5 rounded-md bg-black/20">
                Clap
              </span>
            </div>
            <span className="text-[11px] font-medium opacity-80">Tecla → o D</span>
          </motion.button>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          <button
            onClick={startGuidePhase}
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
