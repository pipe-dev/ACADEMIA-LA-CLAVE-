'use client';
import React from 'react';
import { Volume2, User, Mic, Flame, Zap, Radio } from 'lucide-react';
import { SOLFEGE_NOTES } from '../../data/academyData';
import { SolfegeNote } from '../../types';
import { DuelMode } from './dueloTypes';
import { audioService } from '../../utils/audioService';

interface DuelSetupViewProps {
  selectedNote: SolfegeNote;
  onSelectNote: (note: SolfegeNote) => void;
  onPlayReferenceSound: () => void;
  mode: DuelMode;
  onSelectMode: (mode: DuelMode) => void;
  selectedOpponentName: string;
  onStartDuel: () => void;
}

export const DuelSetupView: React.FC<DuelSetupViewProps> = ({
  selectedNote,
  onSelectNote,
  onPlayReferenceSound,
  mode,
  onSelectMode,
  selectedOpponentName,
  onStartDuel,
}) => {
  return (
    <div className="space-y-4">
      {/* Target Note Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            1. Selecciona la Nota del Duelo:
          </label>
          <button
            onClick={onPlayReferenceSound}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Escuchar Nota</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {SOLFEGE_NOTES.map((note) => {
            const isSel = selectedNote.name === note.name;
            return (
              <button
                key={note.name}
                onClick={() => {
                  audioService.playClickSound();
                  onSelectNote(note);
                }}
                className={`p-2.5 rounded-2xl font-heading font-extrabold text-xs text-white flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSel ? 'ring-4 ring-indigo-400 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: note.bgColor }}
              >
                <span>{note.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Picker (Multi-Modo Extensible) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          2. Modalidad de Duelo:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* En Vivo P2P */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectMode('realtime_p2p');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'realtime_p2p'
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[10px] text-center font-extrabold">En Vivo P2P</span>
          </button>

          {/* Modo Fantasma / Asincrono */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectMode('simulated');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'simulated'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] text-center font-extrabold">Fantasma</span>
          </button>

          {/* Pasa el Microfono (Local 2p) */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectMode('local');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'local'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px] text-center font-extrabold">Local (2p)</span>
          </button>
        </div>
      </div>

      {/* Opponent Selection */}
      <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
          Oponente
        </span>
        <div className="flex items-center justify-between">
          <span className="font-heading font-extrabold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
            {selectedOpponentName}
          </span>
          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Listo para cantar
          </span>
        </div>
      </div>

      {/* Launch Button */}
      <button
        onClick={onStartDuel}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-heading font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Zap className="w-5 h-5 fill-white" />
        <span>¡Comenzar Duelo Rápido!</span>
      </button>
    </div>
  );
};
