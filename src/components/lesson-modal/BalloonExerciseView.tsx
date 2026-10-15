'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../../utils/audioService';
import { BALLOON_COLOR_THEMES, BalloonColorTheme } from './lessonModalTypes';
import { CheckCircle2, Zap, Play, Pause, RotateCcw } from 'lucide-react';

interface BalloonExerciseViewProps {
  isExamBalloon: boolean;
  onComplete: () => void;
}

export const BalloonExerciseView: React.FC<BalloonExerciseViewProps> = ({
  isExamBalloon,
  onComplete
}) => {
  const [balloonThemeIdx, setBalloonThemeIdx] = useState<number>(0);
  const currentBalloonTheme: BalloonColorTheme =
    BALLOON_COLOR_THEMES[balloonThemeIdx] || BALLOON_COLOR_THEMES[0];

  const [balloonActive, setBalloonActive] = useState<boolean>(true);
  const [balloonTotalSecs, setBalloonTotalSecs] = useState<number>(0);

  // Compute exact balloon phase, remaining seconds, scale, and repetition number
  const currentBalloonState = useMemo(() => {
    if (isExamBalloon) {
      // Labios Fruncidos: 4s Inhale + 8s Exhale = 12s per cycle. 24s total for 2 loops.
      const maxSecs = 24;
      const totalSecs = Math.min(maxSecs, Math.max(0, balloonTotalSecs));
      const cycleIdx = totalSecs < 12 ? 0 : 1;
      const timeInCycle = totalSecs >= maxSecs ? 11 : totalSecs % 12;

      let type: 'inhale' | 'hold_full' | 'exhale' = 'inhale';
      let label = 'Inhala por la nariz (4s)';
      let phaseSecsLeft = 4;
      let scale = 1.0;

      if (timeInCycle < 4) {
        type = 'inhale';
        label = 'Inhala por la nariz (4s)';
        phaseSecsLeft = 4 - timeInCycle;
        scale = 0.65 + (timeInCycle / 4) * 0.55;
      } else {
        type = 'exhale';
        label = 'Exhala con labios fruncidos (8s)';
        phaseSecsLeft = 12 - timeInCycle;
        const exhaleProgress = (timeInCycle - 4) / 8;
        scale = 1.2 - exhaleProgress * 0.55;
      }

      return {
        cycleNum: cycleIdx,
        completedCycles: totalSecs >= 24 ? 2 : totalSecs >= 12 ? 1 : 0,
        type,
        label,
        phaseSecsLeft,
        scale
      };
    }

    // Default Control Balloon: 5s Inhale + 5s Hold + 10s Exhale = 20s per cycle (40s total)
    const totalSecs = Math.min(40, Math.max(0, balloonTotalSecs));
    const cycleIdx = totalSecs < 20 ? 0 : 1;
    const timeInCycle = totalSecs >= 40 ? 19 : totalSecs % 20;

    let type: 'inhale' | 'hold_full' | 'exhale' = 'inhale';
    let label = 'Inhala en 5s';
    let phaseSecsLeft = 5;
    let scale = 1.0;

    if (timeInCycle < 5) {
      type = 'inhale';
      label = 'Inhala en 5s';
      phaseSecsLeft = 5 - timeInCycle;
      scale = 0.65 + (timeInCycle / 5) * 0.55;
    } else if (timeInCycle < 10) {
      type = 'hold_full';
      label = 'Retén en 5s';
      phaseSecsLeft = 10 - timeInCycle;
      scale = 1.2;
    } else {
      type = 'exhale';
      label = 'Exhala en 10s';
      phaseSecsLeft = 20 - timeInCycle;
      const exhaleProgress = (timeInCycle - 10) / 10;
      scale = 1.2 - exhaleProgress * 0.55;
    }

    return {
      cycleNum: cycleIdx,
      completedCycles: totalSecs >= 40 ? 2 : totalSecs >= 20 ? 1 : 0,
      type,
      label,
      phaseSecsLeft,
      scale
    };
  }, [balloonTotalSecs, isExamBalloon]);

  const balloonSecsLeft = currentBalloonState.phaseSecsLeft;
  const balloonCycles = currentBalloonState.completedCycles;
  const balloonScale = currentBalloonState.scale;

  // Single timeline timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (balloonActive) {
      const targetSecsLimit = isExamBalloon ? 24 : 40;

      interval = setInterval(() => {
        setBalloonTotalSecs((prevSecs) => {
          const nextSecs = prevSecs + 1;

          if (isExamBalloon) {
            const timeInCycle = nextSecs % 12;
            if (timeInCycle === 0 || timeInCycle === 4) {
              audioService.playSoftDing();
            }
          } else {
            const timeInCycle = nextSecs % 20;
            if (timeInCycle === 0 || timeInCycle === 5 || timeInCycle === 10) {
              audioService.playSoftDing();
            }
          }

          if (nextSecs >= targetSecsLimit) {
            setBalloonActive(false);
            audioService.playLessonCompleteSound();
            audioService.vibrate([40, 60, 40]);

            setTimeout(() => {
              onComplete();
            }, 600);
            return targetSecsLimit;
          }

          return nextSecs;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [balloonActive, isExamBalloon, onComplete]);

  return (
    <div className="space-y-4 text-center animate-fadeIn">
      {isExamBalloon && (
        <div className="bg-indigo-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-200 dark:border-slate-700 text-left space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest block">
              ETAPA INTERMEDIA DE EVALUACIÓN: LABIOS FRUNCIDOS
            </span>
            <span className="text-[10px] font-extrabold bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
              Rehabilitación y Presión Positiva
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
            Inhala por la nariz profundo y lento. Luego, exhala por la boca con los labios fruncidos como soplando suavemente una vela sin apagarla. Realiza 2 repeticiones completas.
          </p>
        </div>
      )}

      {/* 3D Sunken Socket Outer Frame */}
      <div className="w-full p-1.5 sm:p-[6px] rounded-[2.5rem] bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800">
        <div className="w-full p-2 flex flex-col items-center justify-center rounded-[2rem] bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
          
          {/* Embedded 3D Card Stage */}
          <div className="w-full bg-gradient-to-b from-[#ffffff] to-[#f1f5f9] dark:from-[#0b1828] dark:to-[#09111c] rounded-3xl p-6 border border-white/80 dark:border-white/10 flex flex-col items-center justify-center relative min-h-[320px] shadow-[0px_6px_0px_0px_rgba(180,190,210,0.8)] dark:shadow-[0px_6px_0px_0px_rgba(10,15,30,0.9)] overflow-hidden">
            
            {/* Vertical Color Selector Palette */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg z-30 animate-fadeIn">
              {BALLOON_COLOR_THEMES.map((theme, idx) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    audioService.playClickSound();
                    setBalloonThemeIdx(idx);
                  }}
                  className={`w-5 h-5 rounded-full transition-all duration-300 press-effect cursor-pointer ${theme.bgCircle} ${
                    balloonThemeIdx === idx
                      ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                      : 'opacity-60 hover:opacity-100 hover:scale-110'
                  }`}
                  title={theme.name}
                />
              ))}
            </div>

            {/* Top Phase Pill */}
            <div className="bg-blue-100/90 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border border-blue-300/80 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-xs flex items-center gap-2 mb-3 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentBalloonState.label}</span>
              <span className="opacity-70">({balloonSecsLeft}s)</span>
            </div>

            {/* Balloon Stage */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Glow ring */}
              <div
                className="absolute rounded-full transition-all duration-700 ease-out pointer-events-none"
                style={{
                  width: `${160 * balloonScale}px`,
                  height: `${200 * balloonScale}px`,
                  backgroundColor:
                    currentBalloonState.type === 'inhale'
                      ? 'rgba(244,63,94,0.35)'
                      : currentBalloonState.type === 'hold_full'
                      ? 'rgba(168,85,247,0.35)'
                      : 'rgba(16,185,129,0.35)',
                  filter: 'blur(20px)'
                }}
              />

              {/* Balloon Body */}
              <div
                className="relative transition-transform duration-500 ease-out flex flex-col items-center justify-center"
                style={{
                  transform: `scale(${balloonScale})`,
                  filter: `drop-shadow(0 15px 25px ${currentBalloonTheme.glowRgb})`
                }}
              >
                <div
                  className={`w-36 h-44 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] bg-gradient-to-tr ${currentBalloonTheme.gradient} relative overflow-hidden flex items-center justify-center shadow-inner transition-all duration-500`}
                >
                  <div className="absolute top-3 left-4 w-12 h-16 bg-white/40 rounded-full blur-[2px] transform -rotate-25" />
                  <div className="absolute top-5 left-7 w-4 h-6 bg-white/70 rounded-full blur-[1px] transform -rotate-25" />

                  <div className="z-10 text-center drop-shadow-md text-white">
                    <span className="font-heading font-black text-4xl block leading-none">
                      {balloonSecsLeft}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 mt-1">
                      {currentBalloonState.type === 'inhale'
                        ? 'INHALAR'
                        : currentBalloonState.type === 'hold_full'
                        ? 'RETENER'
                        : 'EXHALAR'}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-3 rounded-b-md -mt-0.5 ${currentBalloonTheme.knotColor} shadow-xs transition-colors duration-500`}
                />
                <svg className="w-12 h-10 -mt-0.5 overflow-visible" viewBox="0 0 50 40">
                  <path
                    d="M 25 0 Q 15 15 25 25 T 25 40"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    className="opacity-70"
                  />
                </svg>
              </div>
            </div>

            {/* Cycle Repetition Badges */}
            <div className="mt-3 flex items-center justify-center gap-3">
              {[0, 1].map((dotIdx) => (
                <div
                  key={dotIdx}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
                    balloonCycles > dotIdx
                      ? 'bg-emerald-500 text-white scale-105 shadow-xs'
                      : balloonCycles === dotIdx && balloonActive
                      ? 'bg-pink-500 text-white scale-105 shadow-xs animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-60 scale-95'
                  }`}
                >
                  {balloonCycles > dotIdx ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Repetición {dotIdx + 1} de 2</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => {
            audioService.playClickSound();
            setBalloonActive(!balloonActive);
          }}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-black text-sm flex items-center justify-center gap-2 shadow-lg press-effect cursor-pointer"
        >
          {balloonActive ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          <span>{balloonActive ? 'Pausar Ejercicio' : 'Iniciar Ejercicio'}</span>
        </button>

        <button
          onClick={() => {
            audioService.playClickSound();
            setBalloonActive(false);
            setBalloonTotalSecs(0);
          }}
          className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 press-effect shrink-0 cursor-pointer"
          title="Reiniciar Ejercicio"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
