'use client';
import React from 'react';
import { Mic, Clock, X, ArrowRight } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface VocalRangeCadencePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEvaluation: () => void;
  onSnooze: () => void;
  zenMode?: boolean;
}

export const VocalRangeCadencePrompt: React.FC<VocalRangeCadencePromptProps> = ({
  isOpen,
  onClose,
  onStartEvaluation,
  onSnooze,
  zenMode = false,
}) => {
  if (!isOpen) return null;

  const handleStart = () => {
    audioService.playClickSound();
    onStartEvaluation();
  };

  const handleSnooze = () => {
    audioService.playClickSound();
    onSnooze();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
      onClick={handleSnooze}
    >
      <div 
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 cursor-default relative transition-colors ${
          zenMode
            ? 'bg-[#1b1c1e] border border-[#2e3138] text-[#ded9cf]'
            : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f] text-slate-800 dark:text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close / Snooze Button */}
        <button
          onClick={handleSnooze}
          className={`absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full shadow-xs cursor-pointer active:scale-90 transition-transform ${
            zenMode
              ? 'bg-[#26292f] border border-[#2e3138] text-rose-400'
              : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/70 text-rose-500 dark:text-rose-400'
          }`}
          title="Posponer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Icon Pill */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
              : 'bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300'
          }`}>
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
              zenMode
                ? 'bg-[#26292f] text-[#e5b83b]'
                : 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            }`}>
              Calibración cada 6 días
            </span>
            <h3 className={`font-heading font-black text-lg leading-tight mt-0.5 ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              ¡Momento de calibrar tu voz!
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Han pasado 6 días desde tu última medición de rango vocal. Veamos si tus cuerdas vocales han ganado nuevas notas con tus prácticas recientes.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleStart}
            className={`w-full py-3 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 ${
              zenMode
                ? 'bg-[#e5b83b]  text-[#161719] shadow-[0_4px_0_0_#9a7212] font-black'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600   text-white '
            }`}
          >
            <span>Evaluar mi Rango Ahora</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            onClick={handleSnooze}
            className={`w-full py-2.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              zenMode
                ? 'text-[#8e95a5]'
                : 'text-slate-500 dark:text-slate-400    '
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recordarme Mañana</span>
          </button>
        </div>
      </div>
    </div>
  );
};
