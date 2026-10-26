'use client';

import React from 'react';
import { Trophy, RotateCcw, ArrowLeft, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { audioService } from '../../utils/audioService';
import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';

export interface StabilityResultsViewProps {
  selectedNote: ChromaticNoteButtonInfo;
  finalScore: number;
  xpMultiplier: number;
  earnedXp: number;
  stabilityPercent: number;
  onRetry: () => void;
  onChangeNote: () => void;
}

export const StabilityResultsView: React.FC<StabilityResultsViewProps> = ({
  selectedNote,
  finalScore,
  xpMultiplier,
  earnedXp,
  stabilityPercent,
  onRetry,
  onChangeNote
}) => {
  const isMaster = finalScore >= 8.5;
  const isAdvanced = finalScore >= 6.0 && finalScore < 8.5;
  const isIntermediate = finalScore >= 3.0 && finalScore < 6.0;

  const feedbackText = isMaster
    ? '¡Columna de aire impecable! Tu soporte diafragmático mantuvo la afinación fija con precisión de conservatorio.'
    : isAdvanced
    ? '¡Gran estabilidad vocal! Afinación consistente y afinada, con mínimas micro-oscilaciones naturales.'
    : isIntermediate
    ? 'Buen esfuerzo. Mantén el abdomen firme y constante para evitar caídas en la presión de aire.'
    : 'El tono osciló fuera del centro. Escucha la nota de referencia y exhala con apoyo uniforme.';

  return (
    <div className="space-y-4 text-center">
      {/* ─── Hero Banner ─── */}
      <div
        className={`p-5 rounded-3xl text-white space-y-2 border ${
          isMaster
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 border-emerald-400 shadow-xl'
            : isAdvanced
            ? 'bg-gradient-to-r from-indigo-600 to-purple-700 border-purple-400 shadow-lg'
            : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto shadow-md">
          {isMaster ? (
            <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
          ) : isAdvanced ? (
            <Award className="w-7 h-7 text-amber-300" />
          ) : (
            <CheckCircle2 className="w-7 h-7 text-indigo-300" />
          )}
        </div>

        <h4 className="font-heading font-black text-xl text-white">
          {isMaster ? '¡Estabilidad Maestra Conquistada!' : '¡Desafío Completado!'}
        </h4>

        <p className="text-xs text-white/90 font-medium max-w-xs mx-auto">
          Mantuviste la nota <strong>{selectedNote.displayName} ({selectedNote.octave})</strong> estable durante{' '}
          <strong>{finalScore}s</strong> ({stabilityPercent}% de retención continua).
        </p>

        {/* Pedagogical Feedback */}
        <div className="pt-1">
          <p className="text-[11px] bg-black/20 p-2 rounded-xl text-white/95 leading-relaxed font-medium">
            💡 {feedbackText}
          </p>
        </div>
      </div>

      {/* ─── Score Stats Grid ─── */}
      <div className="grid grid-cols-2 gap-2.5 text-left">
        <div className="p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 space-y-0.5">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Multiplicador
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-black text-2xl text-amber-500">
              {xpMultiplier.toFixed(1)}x
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            Bonus de Precisión
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 space-y-0.5">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block tracking-wider">
            XP Ganada
          </span>
          <span className="font-heading font-black text-2xl text-emerald-500 block">
            +{earnedXp} XP
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            Agregada a tu progreso
          </span>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => {
            audioService.playClickSound();
            onRetry();
          }}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-heading font-black text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>¡Intentar de Nuevo en {selectedNote.name}!</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioService.playClickSound();
            onChangeNote();
          }}
          className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cambiar de Nota u Octava</span>
        </button>
      </div>
    </div>
  );
};
