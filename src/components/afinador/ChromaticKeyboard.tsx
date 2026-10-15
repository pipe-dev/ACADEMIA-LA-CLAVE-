import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';
import { ChromaticNoteButtonInfo, NoteInfo } from '../../utils/voicePlaybackService';
import { Difficulty } from '../../data/tunerLevelsData';

interface ChromaticKeyboardProps {
  tunerMode: 'libre' | 'niveles';
  selectedNote: ChromaticNoteButtonInfo;
  activeTargetNote: ChromaticNoteButtonInfo | NoteInfo;
  naturalNotes: ChromaticNoteButtonInfo[];
  blackKeyPositions: { note: ChromaticNoteButtonInfo | undefined; left: string }[];
  challengeNotes: NoteInfo[];
  completedChallengeNotes: Set<number>;
  challengeIndex: number;
  onSelectNote: (note: ChromaticNoteButtonInfo) => void;
  difficulty: 'facil' | 'medio' | 'dificil';
  onSelectDifficulty: (diff: 'facil' | 'medio' | 'dificil', targetDiff: Difficulty) => void;
  isTuningActive: boolean;
  onToggleTuning: () => void;
  zenMode?: boolean;
}

export const ChromaticKeyboard: React.FC<ChromaticKeyboardProps> = ({
  tunerMode,
  selectedNote,
  activeTargetNote,
  naturalNotes,
  blackKeyPositions,
  challengeNotes,
  completedChallengeNotes,
  challengeIndex,
  onSelectNote,
  difficulty,
  onSelectDifficulty,
  isTuningActive,
  onToggleTuning,
  zenMode = false
}) => {
  return (
    <div
      id="tour-tuner-reference"
      className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 sm:space-y-3.5"
    >
      <div className="flex items-center justify-between pb-1 sm:pb-1.5">
        <div className="flex flex-col gap-0.5">
          <span className="font-heading font-black text-xs sm:text-[13px] text-slate-800 dark:text-white leading-tight">
            Teclado Vocal
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            {tunerMode === 'libre'
              ? 'Toca una tecla para escuchar su tono de referencia'
              : 'Toca la tecla activa para recordar su tono de referencia'}
          </span>
        </div>
      </div>

      {/* 🎹 Piano Touch Strip (7 Natural White Keys + 5 Sharp Black Keys) */}
      <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
        {/* 7 White Keys Container */}
        <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
          {naturalNotes.map((note) => {
            const isLevelMode = tunerMode === 'niveles';
            const isInChallenge =
              isLevelMode &&
              challengeNotes.some(
                cn => cn.name.toUpperCase() === note.name.toUpperCase()
              );
            const isCurrentTarget = isLevelMode
              ? activeTargetNote.name.toUpperCase() === note.name.toUpperCase()
              : selectedNote.name === note.name;
            const isCompleted =
              isLevelMode &&
              challengeNotes.some(
                (cn, idx) =>
                  completedChallengeNotes.has(idx) &&
                  cn.name.toUpperCase() === note.name.toUpperCase() &&
                  idx < challengeIndex
              );
            const isUnused = isLevelMode && !isInChallenge;

            return (
              <motion.button
                key={note.name}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectNote(note)}
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
                      ? 'bg-[#e2e6ed] text-[#141619] hover:bg-[#edf1f8] border-[#e5b83b] ring-1 ring-[#e5b83b]/60 shadow-[0_4px_0_0_#9ba2b0] cursor-pointer'
                      : 'bg-white dark:bg-[#152336] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-indigo-200/90 dark:border-indigo-800/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] ring-1 ring-indigo-400/30 cursor-pointer'
                    : zenMode
                    ? 'bg-[#c8ccd4] text-[#141619] hover:bg-[#d8dce4] border-[#aeb4c0] shadow-[0_4px_0_0_#8e94a0] cursor-pointer'
                    : 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                }`}
                title={
                  isLevelMode
                    ? isCurrentTarget
                      ? `Tocar ${note.displayName} (recordar tono)`
                      : `Nota ${note.displayName}`
                    : `Tocar ${note.displayName}`
                }
              >
                {/* Top Indicator for Level Challenge (Check or Active Dot) */}
                {isLevelMode && !isUnused && (
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

        {/* 5 Black Keys (Overlapping) */}
        {blackKeyPositions.map(({ note, left }) => {
          if (!note) return null;
          const isLevelMode = tunerMode === 'niveles';
          const isInChallenge =
            isLevelMode &&
            challengeNotes.some(
              cn => cn.name.toUpperCase() === note.name.toUpperCase()
            );
          const isCurrentTarget = isLevelMode
            ? activeTargetNote.name.toUpperCase() === note.name.toUpperCase()
            : selectedNote.name === note.name;
          const isCompleted =
            isLevelMode &&
            challengeNotes.some(
              (cn, idx) =>
                completedChallengeNotes.has(idx) &&
                cn.name.toUpperCase() === note.name.toUpperCase() &&
                idx < challengeIndex
            );
          const isUnused = isLevelMode && !isInChallenge;

          return (
            <motion.button
              key={note.name}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelectNote(note)}
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
                    ? 'bg-[#141619] text-white hover:bg-[#1f2125] border-[#e5b83b]/40 shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                    : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-purple-400/70 shadow-[0_3px_0_0_#020617] ring-1 ring-violet-400/40 cursor-pointer'
                  : zenMode
                  ? 'bg-[#141619] text-[#ded9cf] hover:bg-[#1f2125] border-[#2e3138] shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                  : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer'
              }`}
              title={
                isLevelMode
                  ? isCurrentTarget
                    ? `Tocar ${note.displayName} (recordar tono)`
                    : `Nota ${note.displayName}`
                  : `Tocar ${note.displayName}`
              }
            >
              {/* Top Indicator for Level Challenge (Check or Active Dot) */}
              {isLevelMode && !isUnused && (
                <div className="absolute top-0.5 inset-x-0 flex justify-center">
                  {isCompleted ? (
                    <span
                      className={`text-[7.5px] font-black leading-none ${
                        zenMode ? 'text-[#e5b83b]' : 'text-emerald-400'
                      }`}
                    >
                      ✓
                    </span>
                  ) : isCurrentTarget ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-ping ${
                        zenMode ? 'bg-[#161719]' : 'bg-violet-200'
                      }`}
                    />
                  ) : (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        zenMode ? 'bg-[#e5b83b]/70' : 'bg-violet-400/80'
                      }`}
                    />
                  )}
                </div>
              )}

              <span
                className={`font-heading font-black text-[9px] sm:text-[10px] leading-none drop-shadow-xs ${
                  isCurrentTarget && zenMode ? 'text-[#161719]' : 'text-white'
                }`}
              >
                {note.name}
              </span>
              <span
                className={`text-[8px] sm:text-[9px] font-bold mt-0.5 leading-none ${
                  zenMode
                    ? isCurrentTarget
                      ? 'text-[#161719]'
                      : isCompleted
                      ? 'text-[#e5b83b]'
                      : 'text-[#99958d]'
                    : isCurrentTarget
                    ? 'text-violet-200'
                    : isCompleted
                    ? 'text-emerald-300'
                    : 'text-slate-400'
                }`}
              >
                {note.letter}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Controls Group: Mode Selector + Mic Button */}
      <div className="pt-2 sm:pt-2.5 space-y-2">
        {/* Difficulty / Mode Selector Pill - Slim & Discrete */}
        <div
          className={`p-0.5 rounded-full flex items-center justify-between max-w-[310px] mx-auto w-full border ${
            zenMode
              ? 'bg-[#191b1f] border-[#2e3138]'
              : 'bg-[#eff4ff]/80 dark:bg-[#0b1828]/80 border-slate-200/70 dark:border-slate-800'
          }`}
        >
          {(['facil', 'medio', 'dificil'] as const).map(d => {
            const targetDiff: Difficulty =
              d === 'facil' ? 'Fácil' : d === 'medio' ? 'Medio' : 'Difícil';
            const centsText =
              d === 'facil' ? '±28¢' : d === 'medio' ? '±18¢' : '±10¢';
            return (
              <button
                key={d}
                onClick={() => onSelectDifficulty(d, targetDiff)}
                className={`flex-1 py-0.5 px-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer capitalize flex items-center justify-center gap-1 leading-normal ${
                  difficulty === d
                    ? zenMode
                      ? 'bg-[#e5b83b] text-[#161719] shadow-2xs border border-[#f5d56b] font-black'
                      : 'bg-white dark:bg-[#102034] text-[#2c2abc] dark:text-[#c0c1ff] shadow-2xs border border-slate-200/80 dark:border-slate-700'
                    : zenMode
                    ? 'text-[#99958d] hover:text-[#ded9cf]'
                    : 'text-slate-500 dark:text-[#a0a5ba] hover:text-slate-800 dark:hover:text-white'
                }`}
                title={`Ver niveles en modo ${targetDiff}`}
              >
                <span>{targetDiff}</span>
                <span
                  className={`text-[8.5px] font-normal ${
                    zenMode && difficulty === d
                      ? 'text-[#161719]/80'
                      : 'opacity-60'
                  }`}
                >
                  ({centsText})
                </span>
              </button>
            );
          })}
        </div>

        {/* Toggle Mic Button - Small, compact & centered */}
        <div className="flex justify-center">
          <button
            onClick={onToggleTuning}
            className={`w-full max-w-[210px] sm:max-w-[220px] py-1.5 sm:py-2 px-4 rounded-full font-heading font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
              isTuningActive
                ? zenMode
                  ? 'bg-[#2a2d34] text-[#e5b83b] border border-[#e5b83b] shadow-[0_2px_0_0_#141619]'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_2px_0_0_#991b1b]'
                : zenMode
                ? 'bg-[#e5b83b] text-[#161719] shadow-[0_3px_0_0_#9a7212] font-black'
                : 'tactile-btn-primary'
            }`}
          >
            {isTuningActive ? (
              <MicOff className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
            <span>
              {isTuningActive ? 'Pausar Micrófono' : 'Activar Micrófono'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
