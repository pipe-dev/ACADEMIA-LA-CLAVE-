'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  voicePlayback,
  NoteInfo,
  ChromaticNoteButtonInfo,
  getComfortableChromaticNotes
} from '../../utils/voicePlaybackService';

export interface PitchChallengeKeyboardProps {
  notes: NoteInfo[];
  challengeIndex: number;
  completedChallengeNotes: Set<number>;
  activeTargetNote: NoteInfo;
  vocalRangeData?: any;
  gender?: 'masculino' | 'femenino';
  zenMode?: boolean;
  darkMode?: boolean;
}

export const PitchChallengeKeyboard: React.FC<PitchChallengeKeyboardProps> = ({
  notes,
  challengeIndex,
  completedChallengeNotes,
  activeTargetNote,
  vocalRangeData,
  gender = 'femenino',
  zenMode = false
}) => {
  const chromaticData = useMemo(() => {
    return getComfortableChromaticNotes(vocalRangeData, gender);
  }, [vocalRangeData, gender]);

  const { naturalNotes, sharpNotes } = chromaticData;

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

  const handleKeyClick = (note: ChromaticNoteButtonInfo) => {
    if (activeTargetNote && activeTargetNote.name.toUpperCase() === note.name.toUpperCase()) {
      voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
    }
  };

  return (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex flex-col gap-0.5">
          <span className="font-heading font-black text-xs sm:text-[13px] text-slate-800 dark:text-white leading-tight">
            Teclado Vocal
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Toca la tecla activa para recordar su tono de referencia
          </span>
        </div>
      </div>

      {/* 🎹 Piano Touch Strip */}
      <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
        {/* 7 White Keys */}
        <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
          {naturalNotes.map((note) => {
            const isInChallenge = notes.some(
              cn => cn.name.toUpperCase() === note.name.toUpperCase()
            );
            const isCurrentTarget =
              activeTargetNote.name.toUpperCase() === note.name.toUpperCase();
            const isCompleted = notes.some(
              (cn, idx) =>
                completedChallengeNotes.has(idx) &&
                cn.name.toUpperCase() === note.name.toUpperCase() &&
                idx < challengeIndex
            );
            const isUnused = !isInChallenge;

            return (
              <motion.button
                key={note.name}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleKeyClick(note)}
                className={`flex-1 h-full rounded-b-xl sm:rounded-b-2xl transition-all flex flex-col justify-end items-center pb-1.5 relative border ${
                  isCurrentTarget
                    ? zenMode
                      ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-[0_4px_0_0_#9a7212] ring-2 ring-[#f5d56b] z-0 cursor-pointer animate-pulse font-black'
                      : 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80 z-0 cursor-pointer animate-pulse'
                    : isCompleted
                    ? zenMode
                      ? 'bg-[#9ba2b0] text-[#141619] border-[#e5b83b]/60 shadow-[0_4px_0_0_#6c7380] cursor-pointer'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80 shadow-[0_4px_0_0_#059669] dark:shadow-[0_4px_0_0_#064e3b] cursor-pointer'
                    : isInChallenge
                    ? zenMode
                      ? 'bg-[#e2e6ed] text-[#141619]  border-[#e5b83b] ring-1 ring-[#e5b83b]/60 shadow-[0_4px_0_0_#9ba2b0] cursor-pointer'
                      : 'bg-white dark:bg-[#152336] text-slate-800 dark:text-slate-100   border-indigo-200/90 dark:border-indigo-800/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] ring-1 ring-indigo-400/30 cursor-pointer'
                    : zenMode
                    ? 'bg-[#c8ccd4] text-[#141619]  border-[#aeb4c0] shadow-[0_4px_0_0_#8e94a0] cursor-pointer'
                    : 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200   border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                }`}
                title={
                  isCurrentTarget
                    ? `Tocar ${note.displayName} (recordar tono)`
                    : `Nota ${note.displayName}`
                }
              >
                {/* Top Indicator */}
                {!isUnused && (
                  <div className="absolute top-1 inset-x-0 flex justify-center">
                    {isCompleted ? (
                      <span
                        className={`text-[8px] font-black leading-none ${
                          zenMode ? 'text-[#141619]' : 'text-emerald-500'
                        }`}
                      >
                        ✓
                      </span>
                    ) : isCurrentTarget ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    ) : (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          zenMode ? 'bg-[#7a580a]' : 'bg-indigo-400/70'
                        }`}
                      />
                    )}
                  </div>
                )}

                <span
                  className={`font-heading font-black text-xs sm:text-sm leading-none ${
                    zenMode && isCurrentTarget
                      ? 'text-[#161719]'
                      : zenMode
                      ? 'text-[#141619]'
                      : ''
                  }`}
                >
                  {note.name}
                </span>
                <span
                  className={`text-[10px] font-bold mt-0.5 leading-none ${
                    zenMode
                      ? isCurrentTarget
                        ? 'text-[#161719]'
                        : isCompleted
                        ? 'text-[#7a580a]'
                        : 'text-[#4b5260]'
                      : isCurrentTarget
                      ? 'text-indigo-100'
                      : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {note.letter}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* 5 Black Keys */}
        {blackKeyPositions.map(({ note, left }) => {
          if (!note) return null;
          const isInChallenge = notes.some(
            cn => cn.name.toUpperCase() === note.name.toUpperCase()
          );
          const isCurrentTarget =
            activeTargetNote.name.toUpperCase() === note.name.toUpperCase();
          const isCompleted = notes.some(
            (cn, idx) =>
              completedChallengeNotes.has(idx) &&
              cn.name.toUpperCase() === note.name.toUpperCase() &&
              idx < challengeIndex
          );
          const isUnused = !isInChallenge;

          return (
            <motion.button
              key={note.name}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleKeyClick(note)}
              style={{ left }}
              className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] sm:w-[11%] h-12 sm:h-13 rounded-b-lg sm:rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 border ${
                isCurrentTarget
                  ? zenMode
                    ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-[0_3px_0_0_#9a7212] ring-2 ring-[#f5d56b] scale-105 z-20 cursor-pointer animate-pulse font-black'
                    : 'bg-gradient-to-b from-violet-500 to-purple-700 text-white border-violet-400 shadow-[0_3px_0_0_#3b0764] ring-2 ring-violet-300 scale-105 z-20 cursor-pointer animate-pulse'
                  : isCompleted
                  ? zenMode
                    ? 'bg-[#2a2d34] text-[#f0ebe1] border-[#383c44] shadow-[0_3px_0_0_#141619] z-10 cursor-pointer'
                    : 'bg-emerald-800 dark:bg-emerald-900 text-emerald-100 border-emerald-600 shadow-[0_3px_0_0_#064e3b] z-10 cursor-pointer'
                  : isInChallenge
                  ? zenMode
                    ? 'bg-[#141619] text-white  border-[#e5b83b]/40 shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                    : 'bg-slate-900 dark:bg-[#070d18] text-white   border-purple-400/70 shadow-[0_3px_0_0_#020617] ring-1 ring-violet-400/40 cursor-pointer'
                  : zenMode
                  ? 'bg-[#141619] text-[#ded9cf]  border-[#2e3138] shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                  : 'bg-slate-900 dark:bg-[#070d18] text-white   border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer'
              }`}
              title={
                isCurrentTarget
                  ? `Tocar ${note.displayName} (recordar tono)`
                  : `Nota ${note.displayName}`
              }
            >
              {!isUnused && (
                <div className="absolute top-1 inset-x-0 flex justify-center">
                  {isCompleted ? (
                    <span className="text-[7px] font-black text-emerald-300 leading-none">
                      ✓
                    </span>
                  ) : isCurrentTarget ? (
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-purple-400/70" />
                  )}
                </div>
              )}
              <span className="font-heading font-black text-[9px] sm:text-[10px] text-white leading-none">
                {note.displayName}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
