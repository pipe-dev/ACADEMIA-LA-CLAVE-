'use client';

import React from 'react';
import { Wind, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  BreathingTechnique,
  BREATHING_TECHNIQUES
} from './breathing/breathingTypes';
import { useBreathingEngine } from './breathing/useBreathingEngine';
import { BreathingBalloonVisualizer } from './breathing/BreathingBalloonVisualizer';
import { BreathingTechniqueSelector } from './breathing/BreathingTechniqueSelector';

export { BREATHING_TECHNIQUES, type BreathingTechnique };

export interface BreathingGameCardProps {
  onGrantXp?: (amount: number) => void;
}

export const BreathingGameCard: React.FC<BreathingGameCardProps> = ({ onGrantXp }) => {
  const {
    selectedTechId,
    isActive,
    isFinished,
    currentPhase,
    currentTech,
    phaseSecondsLeft,
    completedCycles,
    balloonColor,
    setBalloonColor,
    balloonRef,
    handleToggleActive,
    handleReset,
    handleSelectTechnique
  } = useBreathingEngine(onGrantXp);

  const targetCycles = currentTech.targetCycles || 2;

  return (
    <div
      role="region"
      aria-label="Ejercicios de Respiración y Rehabilitación Pulmonar"
      className="space-y-4 transition-colors relative"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/30 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-sm shadow-pink-500/20 shrink-0">
            <Wind className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-heading font-black text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                Ejercicios de Respiración
              </h3>
              <span className="text-[10px] font-extrabold bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-2 py-0.5 rounded-full shrink-0">
                Globo Terapéutico
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Rehabilitación pulmonar y control de apoyo vocal
            </p>
          </div>
        </div>

        {/* Cycles Badge */}
        <div
          className={`self-start sm:self-center border px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 transition-colors ${
            isFinished
              ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-[#0b1828] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 ${
              isFinished ? 'text-emerald-500 animate-bounce' : 'text-emerald-500'
            }`}
          />
          <span className="text-xs font-bold">
            {completedCycles} / {targetCycles} Reps
          </span>
        </div>
      </div>

      {/* Selector de Técnicas de Respiración */}
      <BreathingTechniqueSelector
        techniques={BREATHING_TECHNIQUES}
        selectedTechId={selectedTechId}
        onSelectTechnique={handleSelectTechnique}
      />

      {/* Visual Canvas of the Latex Balloon */}
      <BreathingBalloonVisualizer
        balloonRef={balloonRef}
        currentPhase={currentPhase}
        phaseSecondsLeft={phaseSecondsLeft}
        currentTech={currentTech}
        balloonColor={balloonColor}
        onSelectBalloonColor={setBalloonColor}
        completedCycles={completedCycles}
        isActive={isActive}
        isFinished={isFinished}
      />

      {/* Control Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleToggleActive}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-heading font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-[0.98] ${
            isFinished
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/40'
              : isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
          }`}
        >
          {isFinished ? (
            <>
              <RotateCcw className="w-5 h-5 shrink-0" />
              <span>¡Completado! Repetir Serie</span>
            </>
          ) : isActive ? (
            <>
              <Pause className="w-5 h-5 fill-white shrink-0" />
              <span>Pausar Ejercicio</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white shrink-0" />
              <span>Iniciar Ejercicio</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Reiniciar Ejercicio"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BreathingGameCard;
