'use client';
import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { RhythmPhase } from './rhythmTypes';

interface RhythmTriggersProps {
  phase: RhythmPhase;
  onTap: (instrument: 'kick' | 'clap') => void;
  onRetry: () => void;
}

export const RhythmTriggers: React.FC<RhythmTriggersProps> = ({
  phase,
  onTap,
  onRetry,
}) => {
  if (phase === 'results') {
    return (
      <div className="flex gap-2 pt-1 w-full">
        <button
          onClick={onRetry}
          className="w-full h-16 rounded-2xl font-heading font-extrabold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_5px_0_0_#3730a3] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reintentar Ritmo</span>
        </button>
      </div>
    );
  }

  const isPlayable = phase === 'playing';

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1 w-full">
      <motion.button
        whileTap={isPlayable ? { scale: 0.96 } : {}}
        disabled={!isPlayable}
        onClick={() => onTap('kick')}
        className={`h-20 sm:h-24 md:h-26 px-4 rounded-2xl sm:rounded-3xl font-heading text-white transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden select-none ${
          isPlayable
            ? 'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 shadow-[0_6px_0_0_#1e3a8a] active:translate-y-1 active:shadow-[0_1px_0_0_#1e3a8a]'
            : 'bg-blue-950/40 border border-blue-900/50 shadow-none cursor-not-allowed opacity-50'
        }`}
      >
        <span className="font-black text-xl sm:text-2xl tracking-wider leading-none">
          BOMBO
        </span>
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-200/80 mt-1">
          {isPlayable ? 'Golpe Grave' : 'Escucha Guía'}
        </span>
      </motion.button>

      <motion.button
        whileTap={isPlayable ? { scale: 0.96 } : {}}
        disabled={!isPlayable}
        onClick={() => onTap('clap')}
        className={`h-20 sm:h-24 md:h-26 px-4 rounded-2xl sm:rounded-3xl font-heading text-white transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden select-none ${
          isPlayable
            ? 'bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 shadow-[0_6px_0_0_#9f1239] active:translate-y-1 active:shadow-[0_1px_0_0_#9f1239]'
            : 'bg-rose-950/40 border border-rose-900/50 shadow-none cursor-not-allowed opacity-50'
        }`}
      >
        <span className="font-black text-xl sm:text-2xl tracking-wider leading-none">
          PALMAS
        </span>
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-rose-200/80 mt-1">
          {isPlayable ? 'Golpe Agudo' : 'Escucha Guía'}
        </span>
      </motion.button>
    </div>
  );
};
