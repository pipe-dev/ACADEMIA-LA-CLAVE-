import React from 'react';
import { motion } from 'motion/react';
import { Target, Volume2, History, Mic } from 'lucide-react';
import { ChromaticNoteButtonInfo, voicePlayback } from '../../utils/voicePlaybackService';

interface VoiceEvalPianoSelectorProps {
  naturalNotes: ChromaticNoteButtonInfo[];
  blackKeyPositions: { note: ChromaticNoteButtonInfo; left: string }[];
  selectedTargetNote: ChromaticNoteButtonInfo;
  onSelectNote: (note: ChromaticNoteButtonInfo) => void;
  isNoteInRange: (note: ChromaticNoteButtonInfo) => boolean;
  effectiveRangeData: { noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string } | null;
  gender: 'masculino' | 'femenino';
  miniPianoWhiteKeys: ChromaticNoteButtonInfo[];
  miniBlackKeyPositions: { note: ChromaticNoteButtonInfo; left: string }[];
  totalTuned: number;
  biasTrend: 'agudo' | 'grave' | 'equilibrado';
  mostPracticedNote: string;
  onStartTest: () => void;
}

export const VoiceEvalPianoSelector: React.FC<VoiceEvalPianoSelectorProps> = ({
  naturalNotes,
  blackKeyPositions,
  selectedTargetNote,
  onSelectNote,
  isNoteInRange,
  effectiveRangeData,
  gender,
  miniPianoWhiteKeys,
  miniBlackKeyPositions,
  totalTuned,
  biasTrend,
  mostPracticedNote,
  onStartTest,
}) => {
  return (
    <div className="space-y-4 pt-1">
      {/* Target Note Selector */}
      <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-[#d3e4fe] flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
            Selecciona la nota a evaluar:
          </label>
        </div>

        {/* 🎹 Piano Touch Strip (7 Natural White Keys + 5 Sharp Black Keys) */}
        <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
          {/* 7 White Keys Container */}
          <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
            {naturalNotes.map((note) => {
              const isCurrentTarget = selectedTargetNote.name === note.name;
              const isReachable = isNoteInRange(note);

              return (
                <motion.button
                  key={note.name}
                  whileTap={isReachable ? { scale: 0.96 } : undefined}
                  disabled={!isReachable}
                  onClick={() => {
                    if (!isReachable) return;
                    onSelectNote(note);
                    voicePlayback.playVoiceNote(note, gender, 1.2);
                  }}
                  className={`flex-1 h-full rounded-b-xl sm:rounded-b-2xl transition-all flex flex-col justify-end items-center pb-1.5 relative border ${
                    isCurrentTarget
                      ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80 z-0 cursor-pointer animate-pulse'
                      : isReachable
                      ? 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                      : 'bg-slate-200/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200/60 dark:border-slate-800/60 shadow-[0_4px_0_0_#e2e8f0] dark:shadow-[0_4px_0_0_#0a111c] cursor-not-allowed opacity-60'
                  }`}
                  title={
                    isReachable
                      ? (isCurrentTarget ? `Voz real: ${note.fullName} (evaluar tono)` : `Cantar ${note.fullName} (voz real en tu rango)`)
                      : `Fuera de tu rango vocal actual`
                  }
                >
                  {/* Top Indicator for Current Target */}
                  {isCurrentTarget && (
                    <div className="absolute top-1 inset-x-0 flex justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </div>
                  )}

                  <span className="font-heading font-black text-xs sm:text-sm leading-none">
                    {note.displayName}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 leading-none ${
                    isCurrentTarget
                      ? 'text-indigo-100'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {note.letter}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 5 Black Keys (Overlapping) */}
          {blackKeyPositions.map(({ note, left }) => {
            if (!note) return null;
            const isCurrentTarget = selectedTargetNote.name === note.name;
            const isReachable = isNoteInRange(note);

            return (
              <motion.button
                key={note.name}
                whileTap={isReachable ? { scale: 0.93 } : undefined}
                disabled={!isReachable}
                onClick={() => {
                  if (!isReachable) return;
                  onSelectNote(note);
                  voicePlayback.playVoiceNote(note, gender, 1.2);
                }}
                style={{ left }}
                className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] sm:w-[11%] h-12 sm:h-13 rounded-b-lg sm:rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 border ${
                  isCurrentTarget
                    ? 'bg-gradient-to-b from-violet-500 to-purple-700 text-white border-violet-400 shadow-[0_3px_0_0_#3b0764] ring-2 ring-violet-300 scale-105 z-20 cursor-pointer animate-pulse'
                    : isReachable
                    ? 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer'
                    : 'bg-slate-700/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-600 border-slate-600/70 dark:border-slate-800 shadow-[0_3px_0_0_#1e293b] dark:shadow-[0_3px_0_0_#020617] cursor-not-allowed opacity-50'
                }`}
                title={
                  isReachable
                    ? (isCurrentTarget ? `Voz real: ${note.fullName} (evaluar tono)` : `Cantar ${note.fullName} (voz real en tu rango)`)
                    : `Fuera de tu rango vocal actual`
                }
              >
                {/* Top Indicator for Current Target */}
                {isCurrentTarget && (
                  <div className="absolute top-0.5 inset-x-0 flex justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-200 animate-ping" />
                  </div>
                )}

                <span className="font-heading font-black text-[9px] sm:text-[10px] text-white leading-none drop-shadow-xs">
                  {note.displayName}
                </span>
                <span className={`text-[8px] sm:text-[9px] font-bold mt-0.5 leading-none ${
                  isCurrentTarget
                    ? 'text-violet-200'
                    : 'text-slate-400'
                }`}>
                  {note.letter}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Rango vocal usado para filtrar las voces */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Voces filtradas por tu rango:
          </span>
          <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60">
            {effectiveRangeData?.classification ?? (gender === 'masculino' ? 'Barítono' : 'Mezzosoprano')} · {effectiveRangeData?.noteMin ?? (gender === 'masculino' ? 'La2' : 'La3')} – {effectiveRangeData?.noteMax ?? (gender === 'masculino' ? 'Sol4' : 'La5')}
          </span>
        </div>

        {/* Mini Piano: continúa el principal con Do...Mi una octava arriba */}
        <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-600 dark:text-[#c0c1ff] uppercase tracking-wider flex items-center gap-1.5">
              Mini Piano Superior · amplía tu rango
            </span>
          </div>

          <div className="relative w-full mx-auto select-none pt-1 pb-1">
            {/* 3 White Keys: Do, Re, Mi */}
            <div className="flex gap-1 w-full h-12">
              {miniPianoWhiteKeys.map((note) => {
                const isCurrentTarget = selectedTargetNote.name === note.name;

                return (
                  <motion.button
                    key={note.name}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelectNote(note);
                      voicePlayback.playVoiceNote(note, gender, 1.5);
                    }}
                    className={`flex-1 h-full rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 relative border ${
                      isCurrentTarget
                        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-[0_4px_0_0_#064e3b] ring-2 ring-emerald-400/80 z-0 cursor-pointer animate-pulse'
                        : 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                    }`}
                    title={`Nota superior: ${note.fullName}`}
                  >
                    {isCurrentTarget && (
                      <div className="absolute top-0.5 inset-x-0 flex justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </div>
                    )}
                    <span className="font-heading font-black text-xs leading-none">
                      {note.displayName}
                    </span>
                    <span className={`text-[9px] font-bold mt-0.5 leading-none ${
                      isCurrentTarget
                        ? 'text-emerald-100'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {note.letter}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* 2 Black Keys: Do#, Re# */}
            {miniBlackKeyPositions.map(({ note, left }) => {
              if (!note) return null;
              const isCurrentTarget = selectedTargetNote.name === note.name;

              return (
                <motion.button
                  key={note.name}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    onSelectNote(note);
                    voicePlayback.playVoiceNote(note, gender, 1.5);
                  }}
                  style={{ left }}
                  className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] h-7 rounded-b-lg transition-all flex flex-col justify-end items-center pb-0.5 border ${
                    isCurrentTarget
                      ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white border-emerald-300 shadow-[0_3px_0_0_#065f46] ring-2 ring-emerald-300 scale-105 z-20 cursor-pointer animate-pulse'
                      : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer'
                  }`}
                  title={`Nota superior: ${note.fullName}`}
                >
                  <span className="font-heading font-black text-[8px] text-white leading-none drop-shadow-xs">
                    {note.displayName}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
            Continúan justo donde termina el piano principal: practícalas despacio para ir ampliando tu tesitura hacia arriba (calienta la voz antes).
          </p>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
          Sostén la nota <strong className="text-indigo-600 dark:text-indigo-400">{selectedTargetNote.name}</strong> durante 5 segundos de forma limpia e ininterrumpida.
        </p>
      </div>

      {/* Tuner History Summary Box */}
      {totalTuned > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Contexto de tu Afinador Vocal
            </span>
            <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">
              {totalTuned} entradas
            </span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
            Sesgo en afinador: <strong>{biasTrend === 'agudo' ? 'tendencia a sobreagudar' : biasTrend === 'grave' ? 'tendencia a sobrequebrarse' : 'afinación neutra'}</strong>. Nota más practicada: <strong>{mostPracticedNote}</strong>.
          </p>
        </div>
      )}

      {/* Start test CTA button */}
      <button
        onClick={onStartTest}
        className="w-full py-3.5 px-4 rounded-2xl tactile-btn-primary font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all text-center whitespace-nowrap"
      >
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
        <span>Iniciar Grabación (5s - {selectedTargetNote.name})</span>
      </button>
    </div>
  );
};
