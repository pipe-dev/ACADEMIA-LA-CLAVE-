'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { TunerRhythmViewProps } from './rhythm/rhythmTypes';
import { useRhythmEngine } from './rhythm/useRhythmEngine';
import { RhythmStageArena } from './rhythm/RhythmStageArena';
import { RhythmTriggers } from './rhythm/RhythmTriggers';

export type { TunerRhythmViewProps };

export const TunerRhythmView: React.FC<TunerRhythmViewProps> = ({
  level,
  pattern,
  bpm = 100,
  onSuccess,
  onFail,
  onExit,
  hideExitButton = false,
}) => {
  const {
    phase,
    score,
    floatingTexts,
    combo,
    countInNumber,
    ballControls,
    handleTap,
    startExercise,
  } = useRhythmEngine({
    pattern,
    bpm,
    onSuccess,
    onFail,
  });

  return (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {!hideExitButton && onExit ? (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
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

      {/* Stage Visualizer: Arcade Arena */}
      <RhythmStageArena
        phase={phase}
        countInNumber={countInNumber}
        score={score}
        ballControls={ballControls}
        floatingTexts={floatingTexts}
        combo={combo}
      />

      {/* Control Buttons: 3D Tactile Arcade Triggers */}
      <RhythmTriggers
        phase={phase}
        onTap={handleTap}
        onRetry={startExercise}
      />
    </div>
  );
};

export default TunerRhythmView;
