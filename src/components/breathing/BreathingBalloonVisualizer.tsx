'use client';

import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { audioService } from '../../utils/audioService';
import {
  BreathingPhase,
  BreathingTechnique,
  BalloonColor,
  BALLOON_COLOR_THEMES
} from './breathingTypes';

export interface BreathingBalloonVisualizerProps {
  balloonRef: React.Ref<HTMLDivElement>;
  currentPhase: BreathingPhase;
  phaseSecondsLeft: number;
  currentTech: BreathingTechnique;
  balloonColor: BalloonColor;
  onSelectBalloonColor: (color: BalloonColor) => void;
  completedCycles?: number;
  isActive?: boolean;
  isFinished?: boolean;
}

export const BreathingBalloonVisualizer: React.FC<BreathingBalloonVisualizerProps> = ({
  balloonRef,
  currentPhase,
  phaseSecondsLeft,
  currentTech,
  balloonColor,
  onSelectBalloonColor,
  completedCycles = 0,
  isActive = false,
  isFinished = false
}) => {
  // Normalize color ID to find the active theme
  const activeColorId =
    balloonColor === 'pink' ? 'red' : balloonColor === 'cyan' ? 'blue' : balloonColor;
  const currentBalloonTheme =
    BALLOON_COLOR_THEMES.find((t) => t.id === activeColorId) || BALLOON_COLOR_THEMES[0];

  // Calculate smooth scale factor matching BalloonExerciseView (0.65 to 1.2)
  const phaseTotal = currentPhase.duration;
  const phaseElapsed = phaseTotal - phaseSecondsLeft;
  const progressRatio = phaseTotal > 0 ? phaseElapsed / phaseTotal : 0;

  let balloonScale = 0.65;
  if (currentPhase.type === 'inhale') {
    balloonScale = 0.65 + progressRatio * 0.55; // 0.65 -> 1.2
  } else if (currentPhase.type === 'hold_full') {
    balloonScale = 1.2;
  } else if (currentPhase.type === 'exhale') {
    balloonScale = 1.2 - progressRatio * 0.55; // 1.2 -> 0.65
  } else if (currentPhase.type === 'hold_empty') {
    balloonScale = 0.65;
  }

  return (
    <div className="space-y-3">
      {/* 3D Sunken Socket Outer Frame */}
      <div
        ref={balloonRef}
        className="w-full p-1.5 sm:p-[6px] rounded-[2.5rem] bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800 animate-fadeIn"
      >
        <div className="w-full p-2 flex flex-col items-center justify-center rounded-[2rem] bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
          {/* Embedded 3D Card Stage */}
          <div className="w-full bg-gradient-to-b from-[#ffffff] to-[#f1f5f9] dark:from-[#0b1828] dark:to-[#09111c] rounded-3xl p-6 border border-white/80 dark:border-white/10 flex flex-col items-center justify-center relative min-h-[320px] shadow-[0px_6px_0px_0px_rgba(180,190,210,0.8)] dark:shadow-[0px_6px_0px_0px_rgba(10,15,30,0.9)] overflow-hidden">
            {/* Vertical Color Selector Palette on the Right */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg z-30 animate-fadeIn">
              {BALLOON_COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    audioService.playClickSound();
                    onSelectBalloonColor(theme.id as BalloonColor);
                  }}
                  className={`w-5 h-5 rounded-full transition-all duration-300 press-effect cursor-pointer ${theme.bgCircle} ${
                    activeColorId === theme.id
                      ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                      : 'opacity-60 hover:opacity-100 hover:scale-110'
                  }`}
                  title={theme.name}
                />
              ))}
            </div>

            {/* Top Phase Pill */}
            {isFinished ? (
              <div className="bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-xs flex items-center gap-2 mb-3 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>¡Serie de Ejercicio Completada!</span>
              </div>
            ) : (
              <div className="bg-blue-100/90 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border border-blue-300/80 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-xs flex items-center gap-2 mb-3 animate-pulse">
                <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{currentPhase.label}</span>
                <span className="opacity-70">({phaseSecondsLeft}s)</span>
              </div>
            )}

            {/* The Latex Balloon Stage */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* External Ripple Glow Ring */}
              <div
                className="absolute rounded-full transition-all duration-700 ease-out pointer-events-none"
                style={{
                  width: `${160 * balloonScale}px`,
                  height: `${200 * balloonScale}px`,
                  backgroundColor: currentBalloonTheme.glowRgb,
                  filter: 'blur(20px)'
                }}
              />

              {/* Balloon Container with Scale transform */}
              <div
                className="relative transition-transform duration-500 ease-out flex flex-col items-center justify-center"
                style={{
                  transform: `scale(${balloonScale})`,
                  filter: `drop-shadow(0 15px 25px ${currentBalloonTheme.glowRgb})`
                }}
              >
                {/* Balloon Body (3D Latex Spherical Gradient) */}
                <div
                  className={`w-36 h-44 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] bg-gradient-to-tr ${currentBalloonTheme.gradient} relative overflow-hidden flex items-center justify-center shadow-inner transition-all duration-500`}
                >
                  {/* Glossy Specular Highlights */}
                  <div className="absolute top-3 left-4 w-12 h-16 bg-white/40 rounded-full blur-[2px] transform -rotate-25" />
                  <div className="absolute top-5 left-7 w-4 h-6 bg-white/70 rounded-full blur-[1px] transform -rotate-25" />

                  {/* Countdown Number / Completed icon inside Balloon */}
                  {isFinished ? (
                    <div className="z-10 text-center drop-shadow-md text-white animate-fadeIn flex flex-col items-center">
                      <CheckCircle2 className="w-10 h-10 text-white stroke-[2.5]" />
                      <span className="text-[10px] font-black uppercase tracking-widest block opacity-95 mt-1">
                        ¡COMPLETADO!
                      </span>
                    </div>
                  ) : (
                    <div className="z-10 text-center drop-shadow-md text-white">
                      <span className="font-heading font-black text-4xl block leading-none">
                        {phaseSecondsLeft}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 mt-1">
                        {currentPhase.type === 'inhale'
                          ? 'INHALAR'
                          : currentPhase.type === 'hold_full'
                          ? 'RETENER'
                          : currentPhase.type === 'exhale'
                          ? 'EXHALAR'
                          : 'PAUSA'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Balloon Knot */}
                <div
                  className={`w-5 h-3 rounded-b-md -mt-0.5 ${currentBalloonTheme.knotColor} shadow-xs transition-colors duration-500`}
                />

                {/* Hanging String */}
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

              {/* Exhale airflow particles effect */}
              {currentPhase.type === 'exhale' && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 animate-bounce">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-emerald-300 opacity-90 animate-ping delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80 animate-ping delay-150" />
                </div>
              )}
            </div>

            {/* Cycle Repetition Badges matching the reference modal (Adaptive Anti-Crowding) */}
            {(() => {
              const totalReps = currentTech.targetCycles || 2;
              const repArray = Array.from({ length: totalReps }, (_, i) => i);
              const currentRepNum = Math.min(totalReps, completedCycles + 1);

              return (
                <div className="mt-3 flex flex-col items-center gap-1.5 w-full">
                  {/* Context subtitle */}
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isFinished
                      ? `¡Serie de ${totalReps} repeticiones completada!`
                      : isActive
                      ? `Repetición ${currentRepNum} de ${totalReps}`
                      : `${completedCycles} completadas • Meta: ${totalReps}`}
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full">
                    {repArray.map((dotIdx) => {
                      const isCompleted = isFinished || completedCycles > dotIdx;
                      const isCurrent = !isFinished && isActive && completedCycles === dotIdx;

                      // 1. Exactly 2 Reps: Full spacious pill
                      if (totalReps === 2) {
                        return (
                          <div
                            key={dotIdx}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white scale-105 shadow-xs'
                                : isCurrent
                                ? 'bg-pink-500 text-white scale-105 shadow-xs animate-pulse'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-60 scale-95'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            <span>Repetición {dotIdx + 1} de 2</span>
                          </div>
                        );
                      }

                      // 2. Exactly 3 Reps: Clear text pill "Repetición 1", "Repetición 2", "Repetición 3"
                      if (totalReps === 3) {
                        return (
                          <div
                            key={dotIdx}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                              isCompleted
                                ? 'bg-emerald-500 text-white scale-105 shadow-xs'
                                : isCurrent
                                ? 'bg-pink-500 text-white scale-105 shadow-xs animate-pulse'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-60 scale-95'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>Repetición {dotIdx + 1}</span>
                          </div>
                        );
                      }

                      // 3. 4 or more Reps: Compact labeled capsule
                      return (
                        <div
                          key={dotIdx}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white scale-105 shadow-xs'
                              : isCurrent
                              ? 'bg-pink-500 text-white scale-105 shadow-xs animate-pulse'
                              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-60 scale-95'
                          }`}
                          title={`Repetición ${dotIdx + 1} de ${totalReps}`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          <span>Rep. {dotIdx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Technique Detail Tip below the socket */}
      <div className="text-center max-w-sm mx-auto space-y-0.5 animate-fadeIn">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {currentPhase.detail}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {currentTech.instructions}
        </p>
      </div>
    </div>
  );
};
