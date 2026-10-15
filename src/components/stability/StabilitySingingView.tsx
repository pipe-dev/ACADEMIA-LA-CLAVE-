'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';

export interface StabilitySingingViewProps {
  timeLeft: number;
  isCurrentlyInTune: boolean;
  selectedNote: ChromaticNoteButtonInfo;
  currentPitch: number | null;
  inTuneSeconds: number;
}

export const StabilitySingingView: React.FC<StabilitySingingViewProps> = ({
  timeLeft,
  isCurrentlyInTune,
  selectedNote,
  currentPitch,
  inTuneSeconds
}) => {
  return (
    <div className="space-y-5 text-center py-1">
      {/* Visual Countdown Badge */}
      <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-sm font-extrabold shadow-2xs border border-indigo-100 dark:border-indigo-900/60">
        <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
        <span>Tiempo Restante: {timeLeft}s</span>
      </div>

      {/* Visual Stability Card */}
      <div
        className={`p-6 rounded-3xl text-white space-y-4 relative overflow-hidden transition-colors duration-200 border-2 ${
          isCurrentlyInTune
            ? 'bg-gradient-to-b from-emerald-600 to-teal-700 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            : 'bg-slate-900 border-slate-700/80'
        }`}
      >
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
            <span
              className={
                isCurrentlyInTune
                  ? 'text-emerald-300 font-extrabold'
                  : 'text-slate-400'
              }
            >
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
                  isCurrentlyInTune
                    ? 'bg-emerald-400 scale-110'
                    : 'bg-rose-500'
                }`}
                style={{
                  transform: `translateX(${Math.max(
                    -120,
                    Math.min(
                      120,
                      ((currentPitch - selectedNote.frequency) / 12) * 50
                    )
                  )}px)`
                }}
              />
            )}
          </div>
        </div>

        <div className="pt-1">
          <span
            className={`inline-block text-xs font-black px-3.5 py-1 rounded-full transition-colors duration-150 ${
              isCurrentlyInTune
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}
          >
            {isCurrentlyInTune
              ? '¡DENTRO DEL RANGO PERFECTO!'
              : currentPitch
              ? 'Ajustando afinación...'
              : 'Canta hacia el micrófono...'}
          </span>
        </div>

        {/* Progress Bar for Held Time */}
        <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden mt-3">
          <div
            className="bg-white h-full transition-[width] duration-150 ease-out"
            style={{
              width: `${Math.min(100, (inTuneSeconds / 10) * 100)}%`
            }}
          />
        </div>
        <span className="text-[11px] font-bold text-white/90 block">
          Tiempo Estable: {inTuneSeconds.toFixed(1)}s / 10s
        </span>
      </div>
    </div>
  );
};
