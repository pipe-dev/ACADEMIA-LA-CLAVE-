'use client';

import React from 'react';
import { audioService } from '../../utils/audioService';
import { voicePlayback, ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';

export interface StabilitySetupViewProps {
  naturalNotes: ChromaticNoteButtonInfo[];
  selectedNote: ChromaticNoteButtonInfo;
  onSelectNote: (note: ChromaticNoteButtonInfo) => void;
  isNoteInRange: (note: ChromaticNoteButtonInfo) => boolean;
  gender: 'masculino' | 'femenino';
  onStartChallenge: () => void;
}

export const StabilitySetupView: React.FC<StabilitySetupViewProps> = ({
  naturalNotes,
  selectedNote,
  onSelectNote,
  isNoteInRange,
  gender,
  onStartChallenge
}) => {
  return (
    <div className="space-y-4">
      {/* Note Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          Selecciona la nota del desafío:
        </label>

        <div className="grid grid-cols-7 gap-1.5">
          {naturalNotes.map((note) => {
            const isSel = selectedNote.name === note.name;
            const reachable = isNoteInRange(note);
            return (
              <button
                key={note.name}
                disabled={!reachable}
                onClick={() => {
                  if (!reachable) return;
                  audioService.playClickSound();
                  onSelectNote(note);
                  voicePlayback.playVoiceNote(note, gender, 1.5);
                }}
                className={`p-2.5 rounded-2xl font-heading font-extrabold text-xs text-white flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSel
                    ? 'ring-4 ring-indigo-400 scale-105 shadow-md'
                    : 'opacity-80 hover:opacity-100'
                } ${!reachable ? 'opacity-25 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: note.bgColor }}
              >
                <span>{note.name}</span>
                <span className="text-[8px] font-bold leading-none">
                  {reachable ? `Oct ${note.octave}` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Cards on Multiplier Rewards */}
      <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
          Multiplicadores de XP por Retención
        </span>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-300 block">
              3.0s - 5.9s
            </span>
            <span className="text-indigo-600 font-black">1.5x XP</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-300 block">
              6.0s - 8.4s
            </span>
            <span className="text-amber-500 font-black">2.0x XP</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-300 block">
              8.5s - 10s
            </span>
            <span className="text-emerald-500 font-black">3.0x XP</span>
          </div>
        </div>
      </div>

      <button
        onClick={onStartChallenge}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-heading font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>¡Iniciar Desafío (10s)!</span>
      </button>
    </div>
  );
};
