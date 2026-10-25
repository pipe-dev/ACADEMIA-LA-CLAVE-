'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { audioService } from '../../utils/audioService';
import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';

export interface StabilityResultsViewProps {
  selectedNote: ChromaticNoteButtonInfo;
  finalScore: number;
  xpMultiplier: number;
  earnedXp: number;
  onRetry: () => void;
}

export const StabilityResultsView: React.FC<StabilityResultsViewProps> = ({
  selectedNote,
  finalScore,
  xpMultiplier,
  earnedXp,
  onRetry
}) => {
  return (
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
          onRetry();
        }}
        className="w-full py-3 rounded-2xl bg-[#4648d4] text-white font-heading font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
      >
        ¡Intentar de Nuevo!
      </button>
    </div>
  );
};
