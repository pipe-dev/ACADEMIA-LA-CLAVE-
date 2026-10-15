'use client';
import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface VocalRangeIntroStepProps {
  voiceGender: 'male' | 'female' | null;
  onSelectGender: (gender: 'male' | 'female') => void;
  onStart: () => void;
}

export const VocalRangeIntroStep: React.FC<VocalRangeIntroStepProps> = ({
  voiceGender,
  onSelectGender,
  onStart
}) => {
  const [genderErrorToast, setGenderErrorToast] = useState<string | null>(null);

  const handleStart = () => {
    if (!voiceGender) {
      audioService.vibrate(18);
      setGenderErrorToast('Selecciona si tu voz es Masculina o Femenina para comenzar.');
      setTimeout(() => setGenderErrorToast(null), 3000);
      return;
    }
    onStart();
  };

  return (
    <div className="space-y-4 pt-1 animate-fadeIn">
      {/* Explanation Box */}
      <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h4 className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
          ¿Cómo funciona la prueba?
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Encuentra tu nota más baja y más aguda. El afinador detectará mediante tu micrófono ambas notas con voz firme.
        </p>

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
              1
            </div>
            <span>Cantarás tu nota más grave cómoda (Paso 1).</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
              2
            </div>
            <span>Cantarás tu nota más aguda cómoda (Paso 2).</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
              3
            </div>
            <span>Calcularemos tus octavas y tu clasificación exacta.</span>
          </div>
        </div>
      </div>

      {/* Voice Gender Category Selector */}
      <div className={`p-4 rounded-2xl border-2 transition-all duration-300 space-y-3 ${
        !voiceGender
          ? 'bg-[#eff2fe] dark:bg-[#0b1b30] border-indigo-500 shadow-[0_0_18px_rgba(99,102,241,0.45)]'
          : 'bg-[#eff2fe] dark:bg-[#0b1b30] border-indigo-200/90 dark:border-indigo-800/80 shadow-sm'
      }`}>
        <h4 className="font-heading font-black text-xs sm:text-sm text-[#0b1c30] dark:text-[#d3e4fe] flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 dark:bg-indigo-400"></span>
          </span>
          <span>Paso inicial: Selecciona tu tipo de voz principal</span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectGender('male')}
            className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-black font-heading transition-all cursor-pointer text-center ${
              voiceGender === 'male'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Voz Masculina
          </button>

          <button
            type="button"
            onClick={() => onSelectGender('female')}
            className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-black font-heading transition-all cursor-pointer text-center ${
              voiceGender === 'female'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Voz Femenina
          </button>
        </div>
      </div>

      {genderErrorToast && (
        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 text-center animate-shake px-1">
          {genderErrorToast}
        </p>
      )}

      <button
        onClick={handleStart}
        className={`w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-center transition-all ${
          !voiceGender
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
            : 'tactile-btn-primary cursor-pointer'
        }`}
      >
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
        <span>Comenzar Detección (Nota Grave)</span>
      </button>
    </div>
  );
};
