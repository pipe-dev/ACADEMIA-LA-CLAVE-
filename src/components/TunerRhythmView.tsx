'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Drum, Play, RotateCcw, CheckCircle2, AlertCircle, ArrowLeft, Music2 } from 'lucide-react';
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

  // Purple sphere bounce & impact states
  const [sphereTarget, setSphereTarget] = useState<'center' | 'kick' | 'clap'>('center');
  const [impactEffect, setImpactEffect] = useState<'kick' | 'clap' | null>(null);
  const [isSquashing, setIsSquashing] = useState<boolean>(false);
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);

  const floatingIdRef = useRef(0);
  const patternStartTimeRef = useRef(0);
  const userTapsRef = useRef<{ time: number; instrument: 'clap' | 'kick' }[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const addFloating = (text: string, color: string, side: 'left' | 'right') => {
    const id = ++floatingIdRef.current;
    setFloatingTexts(prev => [...prev.slice(-3), { id, text, color, side }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 900);
  };

  const startGuidePhase = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setPhase('guide');
    setCombo(0);
    setFloatingTexts([]);
    userTapsRef.current = [];
    setSphereTarget('center');
    setImpactEffect(null);
    setIsSquashing(false);
    setIsCelebrating(false);

    const beatMs = (60 / bpm) * 1000;
    const patternDuration = pattern.length > 0 ? pattern[pattern.length - 1].time + beatMs * 2 : 3000;

    // Play metronome ticks for 2 count-in bars (4 beats) with micro center bounce
    const countInTicks = 4;
    for (let i = 0; i < countInTicks; i++) {
      const t = setTimeout(() => {
        voicePlayback.playMetronomeTick();
        setSphereTarget('center');
        setIsSquashing(true);
        setTimeout(() => setIsSquashing(false), 120);
      }, i * beatMs);
      timeoutsRef.current.push(t);
    }

    const startPatternTime = countInTicks * beatMs;
    const leapLeadMs = Math.min(220, Math.round(beatMs * 0.55));

    // Schedule pattern guide sounds, parabolic leaps and impact animations
    pattern.forEach(hit => {
      // 1. Launch leap in parabola ahead of the beat
      const leapTimer = setTimeout(() => {
        setSphereTarget(hit.instrument);
      }, Math.max(0, startPatternTime + hit.time - leapLeadMs));
      timeoutsRef.current.push(leapTimer);

      // 2. Landing impact, sound, squash and color flash exactly on beat
      const hitTimer = setTimeout(() => {
        if (hit.instrument === 'kick') {
          voicePlayback.playKick();
          setActiveButton('kick');
        } else {
          voicePlayback.playClap();
          setActiveButton('clap');
        }
        setIsSquashing(true);
        setImpactEffect(hit.instrument);
        setTimeout(() => {
          setActiveButton(null);
          setIsSquashing(false);
          setImpactEffect(null);
        }, 140);
      }, startPatternTime + hit.time);
      timeoutsRef.current.push(hitTimer);
    });

    // Switch to playing phase
    const endGuideTime = startPatternTime + patternDuration;
    const transitionTimer = setTimeout(() => {
      setPhase('playing');
      setSphereTarget('center');
      patternStartTimeRef.current = Date.now();
      audioService.playSoftDing();
    }, endGuideTime);
    timeoutsRef.current.push(transitionTimer);
  }, [bpm, pattern]);

  useEffect(() => {
    startGuidePhase();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [startGuidePhase]);

  const evaluateTaps = () => {
    const taps = userTapsRef.current;
    if (taps.length === 0) {
      setScore(0);
      setPhase('results');
      setSphereTarget('center');
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
    setSphereTarget('center');

    if (finalScore >= 80) {
      setIsCelebrating(true);
      setTimeout(() => onSuccess(finalScore), 800);
    }
  };

  const handleTap = (instrument: 'kick' | 'clap') => {
    if (phase !== 'playing') return;

    // Trigger instant parabolic leap & squash impact on user tap
    setSphereTarget(instrument);
    setIsSquashing(true);
    setImpactEffect(instrument);
    setTimeout(() => {
      setIsSquashing(false);
      setImpactEffect(null);
    }, 140);

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

      {/* Stage Visualizer */}
      <div className="relative min-h-[170px] rounded-2xl bg-[#e9f0ff] dark:bg-[#0b1828] border border-blue-100 dark:border-slate-800 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
        {/* Dynamic Purple Bouncing Sphere Stage */}
        <div className="relative w-full h-28 flex items-center justify-center overflow-visible mb-1">
          {/* Floor Guide Path (Subtle arc track indicator) */}
          <div className="absolute bottom-2 inset-x-12 h-0.5 border-b border-dashed border-indigo-200/50 dark:border-indigo-800/40 pointer-events-none" />

          {/* Left / Right Target Ground Markers */}
          <div
            className={`absolute bottom-1 -translate-x-20 w-8 h-2 rounded-full transition-all duration-200 pointer-events-none ${
              sphereTarget === 'kick'
                ? 'bg-blue-400/50 scale-125 blur-2xs'
                : 'bg-slate-300/30 dark:bg-slate-700/30'
            }`}
          />
          <div
            className={`absolute bottom-1 translate-x-20 w-8 h-2 rounded-full transition-all duration-200 pointer-events-none ${
              sphereTarget === 'clap'
                ? 'bg-rose-400/50 scale-125 blur-2xs'
                : 'bg-slate-300/30 dark:bg-slate-700/30'
            }`}
          />

          {/* Ground shadow that moves horizontally with the sphere */}
          <motion.div
            animate={{
              x: sphereTarget === 'kick' ? -80 : sphereTarget === 'clap' ? 80 : 0,
              scale: isSquashing ? 1.35 : 0.85,
              opacity: isSquashing ? 0.65 : 0.3
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="absolute bottom-1 w-12 h-3 bg-slate-900/25 dark:bg-black/50 rounded-full blur-xs pointer-events-none"
          />

          {/* Impact Micro-Ripple */}
          {impactEffect && (
            <motion.div
              key={`ripple-${Date.now()}`}
              initial={{ scale: 0.6, opacity: 0.95 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className={`absolute bottom-0 w-14 h-4 rounded-full border-2 pointer-events-none ${
                impactEffect === 'kick'
                  ? 'border-blue-400 bg-blue-400/20'
                  : 'border-rose-400 bg-rose-400/20'
              }`}
              style={{
                left:
                  sphereTarget === 'kick'
                    ? 'calc(50% - 80px - 28px)'
                    : 'calc(50% + 80px - 28px)'
              }}
            />
          )}

          {/* Purple Sphere with Sinusoidal Parabolic Trajectory + Squash/Stretch */}
          <motion.div
            animate={{
              x: sphereTarget === 'kick' ? -80 : sphereTarget === 'clap' ? 80 : 0,
              y: isCelebrating ? [0, -50, 0, -25, 0] : isSquashing ? 4 : [0, -48, 0],
              scaleX: isSquashing ? 1.3 : isCelebrating ? 1.05 : [0.92, 1.05, 1],
              scaleY: isSquashing ? 0.72 : isCelebrating ? 1.05 : [1.18, 0.95, 1],
              rotate: isCelebrating ? [0, 360] : 0
            }}
            transition={{
              x: { type: 'spring', stiffness: 380, damping: 27 },
              y: isCelebrating
                ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.28, ease: [0.33, 1, 0.68, 1] },
              scaleX: { duration: 0.22 },
              scaleY: { duration: 0.22 },
              rotate: isCelebrating ? { duration: 1.2, repeat: Infinity, ease: 'linear' } : undefined
            }}
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-[#6366f1] via-[#4648d4] to-[#2c2abc] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(70,72,212,0.45)] border-t border-white/35 relative z-20 cursor-default transition-all duration-150 ${
              impactEffect === 'kick'
                ? 'ring-4 ring-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.85)]'
                : impactEffect === 'clap'
                ? 'ring-4 ring-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.85)]'
                : 'ring-2 ring-indigo-300/30'
            }`}
          >
            <Music2 className="w-6 h-6 text-white/90 drop-shadow-xs" />
          </motion.div>
        </div>

        {/* Phase Status Banner */}
        <div className="text-center space-y-1">
          {phase === 'guide' && (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-heading font-extrabold text-sm">
              <Drum className="w-4 h-4 animate-bounce" />
              <span>Escucha la guía con atención...</span>
            </div>
          )}
          {phase === 'playing' && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-heading font-extrabold text-sm animate-pulse">
              <Play className="w-4 h-4" />
              <span>¡Ahora tú! Sigue el ritmo</span>
            </div>
          )}
          {phase === 'results' && (
            <div className="space-y-1">
              <div className="text-base font-heading font-black text-slate-900 dark:text-white">
                Precisión: {score}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {score >= 80 ? '¡Excelente compás! Aprobado' : 'Necesitas al menos 80% para aprobar'}
              </p>
            </div>
          )}
        </div>

        {/* Floating texts */}
        {floatingTexts.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -35, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className={`absolute top-4 ${f.side === 'left' ? 'left-6' : 'right-6'} font-heading font-black text-base drop-shadow-md ${f.color}`}
          >
            {f.text}
          </motion.div>
        ))}

        {combo >= 2 && (
          <div className="absolute bottom-2 text-xs font-heading font-black text-amber-500 animate-bounce">
            ⚡ Combo x{combo}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      {phase !== 'results' ? (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={phase !== 'playing'}
            onClick={() => handleTap('kick')}
            className={`py-5 px-4 rounded-2xl font-heading font-extrabold text-white text-base shadow-[0_5px_0_0_#1d4ed8] active:translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              phase === 'playing'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-blue-400/60 cursor-not-allowed opacity-60'
            }`}
          >
            <span>BOMBO (Kick)</span>
            <span className="text-[10px] font-normal opacity-80">Tecla ← o A</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={phase !== 'playing'}
            onClick={() => handleTap('clap')}
            className={`py-5 px-4 rounded-2xl font-heading font-extrabold text-white text-base shadow-[0_5px_0_0_#b91c1c] active:translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              phase === 'playing'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-rose-400/60 cursor-not-allowed opacity-60'
            }`}
          >
            <span>PALMAS (Clap)</span>
            <span className="text-[10px] font-normal opacity-80">Tecla → o D</span>
          </motion.button>
        </div>
      ) : (
        <div className="flex gap-2 pt-1">
          <button
            onClick={startGuidePhase}
            className="flex-1 py-3.5 rounded-2xl font-heading font-extrabold text-sm text-white bg-[#4648d4] shadow-[0_4px_0_0_#2c2abc] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reintentar Ritmo</span>
          </button>
        </div>
      )}
    </div>
  );
};
