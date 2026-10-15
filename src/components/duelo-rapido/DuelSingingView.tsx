'use client';
import React from 'react';
import { Flame, Mic } from 'lucide-react';
import { SolfegeNote } from '../../types';
import { DuelMode } from './dueloTypes';

interface DuelSingingViewProps {
  isPlayer1: boolean;
  selectedNote: SolfegeNote;
  selectedOpponentName: string;
  mode: DuelMode;
  p1TimeLeft: number;
  p1CurrentPitch: number | null;
  p1PitchDiff: number | null;
  p1InTuneSeconds: number;
  p2TimeLeft: number;
  p2CurrentPitch: number | null;
  p2InTuneSeconds: number;
  onStartLocalP2Turn: () => void;
}

export const DuelSingingView: React.FC<DuelSingingViewProps> = ({
  isPlayer1,
  selectedNote,
  selectedOpponentName,
  mode,
  p1TimeLeft,
  p1CurrentPitch,
  p1PitchDiff,
  p1InTuneSeconds,
  p2TimeLeft,
  p2CurrentPitch,
  p2InTuneSeconds,
  onStartLocalP2Turn,
}) => {
  if (isPlayer1) {
    return (
      <div className="space-y-5 text-center py-2">
        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-extrabold">
          Tiempo Restante: {p1TimeLeft}s
        </div>

        {/* Large Note Target Visualizer */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

          <span className="text-xs text-slate-400 font-bold block">
            Tono Objetivo: {selectedNote.name}
          </span>
          <div className="font-heading font-black text-5xl tracking-widest text-amber-400">
            {selectedNote.name}
          </div>

          {p1CurrentPitch ? (
            <div className="space-y-1">
              <span
                className={`text-xs font-extrabold ${
                  p1PitchDiff && p1PitchDiff <= 6 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {p1PitchDiff && p1PitchDiff <= 6 ? '¡AFINADO PERFECTO!' : 'Ajustando afinación...'}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 animate-pulse">
              Escuchando tu voz por el micrófono...
            </p>
          )}
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Tiempo en afinación: {p1InTuneSeconds.toFixed(1)} segundos</span>
        </div>
      </div>
    );
  }

  // Player 2 singing / simulated turn
  return (
    <div className="space-y-5 text-center py-2">
      <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold">
        Turno de {selectedOpponentName}: {p2TimeLeft}s
      </div>

      {mode === 'local' ? (
        <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
          <span className="text-xs text-indigo-300 font-bold block">
            Pasa el teléfono a {selectedOpponentName}
          </span>
          <div className="font-heading font-black text-4xl text-indigo-400">
            {selectedNote.name}
          </div>

          {!p2CurrentPitch && (
            <p className="text-xs text-slate-400 animate-pulse">
              ¡Canta cuando estés listo!
            </p>
          )}

          <button
            onClick={onStartLocalP2Turn}
            className="mt-3 py-2.5 px-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs cursor-pointer hover:bg-indigo-700"
          >
            <Mic className="w-4 h-4 inline mr-1" />
            Iniciar Grabación
          </button>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
          <span className="text-xs text-indigo-300 font-bold block">
            {selectedOpponentName} está cantando en vivo...
          </span>
          <div className="font-heading font-black text-5xl text-indigo-400">
            {selectedNote.name}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(p2InTuneSeconds / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
