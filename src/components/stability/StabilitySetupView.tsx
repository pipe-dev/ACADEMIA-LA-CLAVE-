'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Volume2, Sparkles, Music } from 'lucide-react';
import { ChromaticNoteButtonInfo, getOctaveIndicator } from '../../utils/voicePlaybackService';
import { SavedVocalRangeData } from './stabilityTypes';

export interface StabilitySetupViewProps {
  naturalNotes: ChromaticNoteButtonInfo[];
  sharpNotes: ChromaticNoteButtonInfo[];
  availableOctaves: number[];
  currentOctave: number;
  selectedOctave: number | null;
  onSelectOctave: (oct: number) => void;
  selectedNote: ChromaticNoteButtonInfo;
  onSelectNote: (note: ChromaticNoteButtonInfo) => void;
  isNoteInRange: (note: ChromaticNoteButtonInfo) => boolean;
  gender: 'masculino' | 'femenino';
  effectiveRangeData: SavedVocalRangeData | null;
  toleranceCents?: number;
  onStartChallenge: () => void;
}

export const StabilitySetupView: React.FC<StabilitySetupViewProps> = ({
  naturalNotes,
  sharpNotes,
  availableOctaves,
  currentOctave,
  onSelectOctave,
  selectedNote,
  onSelectNote,
  isNoteInRange,
  gender,
  effectiveRangeData,
  toleranceCents = 25,
  onStartChallenge
}) => {
  // 5 Black Keys layout for standard 12-semitone chromatic piano
  const blackKeyPositions = useMemo(
    () => [
      { note: sharpNotes[0], left: '14.2857%' }, // DO#
      { note: sharpNotes[1], left: '28.5714%' }, // RE#
      { note: sharpNotes[2], left: '57.1428%' }, // FA#
      { note: sharpNotes[3], left: '71.4285%' }, // SOL#
      { note: sharpNotes[4], left: '85.7142%' }  // LA#
    ],
    [sharpNotes]
  );

  return (
    <div className="space-y-4">
      {/* ─── Tesitura Mini Header (Exacto al Afinador) ─── */}
      {effectiveRangeData && (
        <div className="flex items-center justify-between px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>
              Tesitura:{' '}
              <strong className="font-bold text-slate-700 dark:text-slate-300">
                {effectiveRangeData.classification}
              </strong>{' '}
              <span className="opacity-75">({effectiveRangeData.noteMin} - {effectiveRangeData.noteMax})</span>
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-500 uppercase">
            {gender === 'masculino' ? 'Voz Masculina' : 'Voz Femenina'}
          </span>
        </div>
      )}

      {/* ─── Teclado Vocal con Selector de Octava (Copia Exacta del Afinador Principal) ─── */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 sm:space-y-3.5">
        <div className="flex items-center justify-between pb-1 sm:pb-1.5 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-black text-xs sm:text-[13px] text-slate-800 dark:text-white leading-tight">
              Teclado Vocal
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Toca una tecla para escuchar su tono de referencia
            </span>
          </div>

          {/* Selector de Octava exacto del Afinador */}
          {availableOctaves && availableOctaves.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#152336] p-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              {availableOctaves.map((oct) => {
                const indicator = getOctaveIndicator(oct, gender);
                const isCurrent = currentOctave === oct;
                return (
                  <button
                    key={oct}
                    type="button"
                    onClick={() => onSelectOctave?.(oct)}
                    title={`Octava ${oct} (${indicator === 'down' ? 'Grave' : indicator === 'up' ? 'Aguda' : 'Media'})`}
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300'
                    } cursor-pointer`}
                  >
                    <span className="flex items-center gap-0.5">
                      {indicator === 'down' && <span className="text-[9px]">▼</span>}
                      {indicator === 'up' && <span className="text-[9px]">▲</span>}
                      <span>{oct}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 🎹 Piano Touch Strip (7 Natural White Keys + 5 Sharp Black Keys) */}
        <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
          {/* 7 White Keys Container */}
          <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
            {naturalNotes.map((note) => {
              const isCurrentTarget =
                selectedNote.midi != null && note.midi != null
                  ? selectedNote.midi === note.midi
                  : selectedNote.name.toUpperCase() === note.name.toUpperCase() && selectedNote.octave === note.octave;
              const isReachable = isNoteInRange(note);

              return (
                <motion.button
                  key={`${note.name}-${note.octave}`}
                  whileTap={isReachable ? { scale: 0.96 } : undefined}
                  type="button"
                  disabled={!isReachable}
                  onClick={() => {
                    if (!isReachable) return;
                    onSelectNote(note);
                  }}
                  className={`flex-1 h-full rounded-b-xl sm:rounded-b-2xl transition-all flex flex-col justify-end items-center pb-1.5 relative border ${
                    isCurrentTarget
                      ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80 z-0 cursor-pointer animate-pulse font-black'
                      : isReachable
                      ? 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200/60 dark:border-slate-800/60 shadow-[0_4px_0_0_#e2e8f0] dark:shadow-[0_4px_0_0_#0a111c] cursor-not-allowed opacity-50'
                  }`}
                  title={
                    isReachable
                      ? `Tocar ${note.fullName}`
                      : `Fuera de tu rango vocal actual`
                  }
                >
                  {/* Top Indicator for Current Target */}
                  {isCurrentTarget && (
                    <div className="absolute top-1 inset-x-0 flex justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </div>
                  )}

                  {(() => {
                    const keyArrow = isCurrentTarget
                      ? (selectedNote.octaveArrow ?? getOctaveIndicator(selectedNote.octave, gender))
                      : (note.octaveArrow ?? getOctaveIndicator(note.octave, gender));
                    return (
                      <span
                        className={`font-heading font-black text-xs sm:text-sm leading-none ${
                          isCurrentTarget ? 'text-white' : ''
                        }`}
                      >
                        {note.name}
                        {keyArrow && (
                          <span
                            className={`ml-[1px] align-super text-[8px] sm:text-[9px] font-black ${
                              isCurrentTarget
                                ? keyArrow === 'up'
                                  ? 'text-amber-300'
                                  : 'text-sky-300'
                                : 'opacity-70'
                            }`}
                          >
                            {keyArrow === 'up' ? '▲' : '▼'}
                          </span>
                        )}
                      </span>
                    );
                  })()}

                  <span
                    className={`text-[10px] font-bold mt-0.5 leading-none ${
                      isCurrentTarget ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {note.letter}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 5 Black Keys (Overlapping) */}
          {blackKeyPositions.map(({ note, left }) => {
            if (!note) return null;
            const isCurrentTarget =
              selectedNote.midi != null && note.midi != null
                ? selectedNote.midi === note.midi
                : selectedNote.name.toUpperCase() === note.name.toUpperCase() && selectedNote.octave === note.octave;
            const isReachable = isNoteInRange(note);

            return (
              <motion.button
                key={`${note.name}-${note.octave}`}
                whileTap={isReachable ? { scale: 0.93 } : undefined}
                type="button"
                disabled={!isReachable}
                onClick={() => {
                  if (!isReachable) return;
                  onSelectNote(note);
                }}
                style={{ left }}
                className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] sm:w-[11%] h-12 sm:h-13 rounded-b-lg sm:rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 border ${
                  isCurrentTarget
                    ? 'bg-gradient-to-b from-indigo-600 to-indigo-800 text-white border-indigo-400 shadow-[0_3px_0_0_#1e1b4b] ring-2 ring-indigo-300 scale-105 z-20 cursor-pointer animate-pulse font-black'
                    : isReachable
                    ? 'bg-slate-900 text-white border-slate-700 shadow-[0_3px_0_0_#0f172a] hover:bg-slate-800 z-10 cursor-pointer'
                    : 'bg-slate-700 text-slate-500 border-slate-600/60 shadow-[0_3px_0_0_#334155] cursor-not-allowed opacity-50 z-10'
                }`}
                title={
                  isReachable
                    ? `Tocar ${note.fullName}`
                    : `Fuera de tu rango vocal actual`
                }
              >
                {/* Top Indicator */}
                {isCurrentTarget && (
                  <div className="absolute top-0.5 inset-x-0 flex justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                )}

                {(() => {
                  const keyArrow = isCurrentTarget
                    ? (selectedNote.octaveArrow ?? getOctaveIndicator(selectedNote.octave, gender))
                    : (note.octaveArrow ?? getOctaveIndicator(note.octave, gender));
                  return (
                    <span className="font-heading font-black text-[9px] sm:text-[10px] leading-none drop-shadow-xs text-white">
                      {note.name}
                      {keyArrow && (
                        <span
                          className={`ml-[1px] align-super text-[7px] sm:text-[8px] font-black ${
                            isCurrentTarget
                              ? keyArrow === 'up'
                                ? 'text-amber-300'
                                : 'text-sky-300'
                              : 'opacity-70'
                          }`}
                        >
                          {keyArrow === 'up' ? '▲' : '▼'}
                        </span>
                      )}
                    </span>
                  );
                })()}

                <span
                  className={`text-[8px] sm:text-[9px] font-bold mt-0.5 leading-none ${
                    isCurrentTarget ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {note.letter}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── Selected Note Target Banner ─── */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-white font-heading font-black shadow-md shrink-0 bg-indigo-600"
          >
            <span className="text-sm leading-tight">{selectedNote.displayName}</span>
            <span className="text-[9px] font-bold opacity-80 leading-none">{selectedNote.octave}</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
                Nota {selectedNote.displayName} ({selectedNote.octave})
              </span>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded">
                {selectedNote.frequency.toFixed(1)} Hz
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
              Tolerancia acústica: ±{toleranceCents}¢ (1/4 semitono)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectNote(selectedNote)}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-transform active:scale-90 cursor-pointer"
          title="Escuchar tono de referencia"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Multiplier Rewards ─── */}
      <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Multiplicadores de XP por Retención (10s)
          </span>
          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Hasta 3.0x XP
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-300 block text-[11px]">
              3.0s - 5.9s
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs">+1.5x XP</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-300 block text-[11px]">
              6.0s - 8.4s
            </span>
            <span className="text-amber-500 font-black text-xs">+2.0x XP</span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-300 block text-[11px]">
              8.5s - 10s
            </span>
            <span className="text-emerald-500 font-black text-xs">+3.0x XP</span>
          </div>
        </div>
      </div>

      {/* ─── Start Challenge Button ─── */}
      <button
        type="button"
        onClick={onStartChallenge}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-black text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Music className="w-4 h-4" />
        <span>¡Iniciar Desafío (10s)!</span>
      </button>
    </div>
  );
};
