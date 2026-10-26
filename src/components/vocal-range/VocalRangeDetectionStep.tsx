'use client';
import React from 'react';
import { Mic, Volume2, ArrowDown, ArrowUp } from 'lucide-react';
import { hzToNoteName } from './vocalRangeUtils';

interface VocalRangeDetectionStepProps {
  targetMode: 'lowest' | 'highest';
  currentPitch: number | null;
  holdProgress: number;
  isListening: boolean;
  voiceGender: 'male' | 'female' | null;
  onStartMic: () => void;
  onPlayGuide: () => void;
  onFallback: () => void;
}

export const VocalRangeDetectionStep: React.FC<VocalRangeDetectionStepProps> = ({
  targetMode,
  currentPitch,
  holdProgress,
  isListening,
  voiceGender,
  onStartMic,
  onPlayGuide,
  onFallback
}) => {
  const isLowest = targetMode === 'lowest';
  const isFemale = voiceGender === 'female';

  const guideNoteLabel = isLowest 
    ? (isFemale ? 'La3' : 'Do3')
    : (isFemale ? 'Do5' : 'Sol4');

  const fallbackLabel = isLowest
    ? (isFemale ? 'Siguiente (Usar Sol3)' : 'Siguiente (Usar La2)')
    : (isFemale ? 'Usar Mi5' : 'Usar La4');

  const themeClasses = isLowest
    ? {
        border: 'border-indigo-100 dark:border-slate-800',
        badge: 'text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-600 dark:text-indigo-300',
        progress: 'bg-indigo-600',
        guideIcon: 'text-indigo-500',
        fallbackBg: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
      }
    : {
        border: 'border-purple-100 dark:border-slate-800',
        badge: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-600 dark:text-purple-300',
        progress: 'bg-purple-600',
        guideIcon: 'text-purple-500',
        fallbackBg: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
      };

  return (
    <div className="space-y-4 pt-1 animate-fadeIn">
      <div className={`bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border ${themeClasses.border} text-center space-y-3`}>
        <span className={`text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${themeClasses.badge}`}>
          {isLowest ? (
            <>
              <ArrowDown className="w-4 h-4" /> Paso 1: Tu Nota Más Grave
            </>
          ) : (
            <>
              <ArrowUp className="w-4 h-4" /> Paso 2: Tu Nota Más Aguda
            </>
          )}
        </span>

        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
          {isLowest
            ? 'Canta hacia abajo lo más grave que puedas con voz clara y sin carraspear. Sostén la nota 1.5 segundos.'
            : 'Ahora canta hacia arriba lo más alto que puedas cómodamente (voz de pecho o cabeza limpia). Sostén 1.5 segundos.'}
        </p>

        {/* Pitch Display Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Nota Detectada
          </span>
          <div className={`font-heading font-extrabold text-3xl ${themeClasses.text}`}>
            {currentPitch
              ? hzToNoteName(currentPitch).fullName
              : isListening
              ? 'Escuchando tu voz...'
              : 'Micrófono en pausa'}
          </div>
        </div>

        {/* Hold Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>Sostén la nota firme...</span>
            <span>{holdProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-150 ${themeClasses.progress}`}
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        </div>
      </div>

      {!isListening ? (
        <div className="space-y-2">
          <button
            onClick={onStartMic}
            className="w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl tactile-btn-primary font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-lg text-center"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
            <span>{isLowest ? 'Activar Micrófono para Nota Grave' : 'Activar Micrófono para Nota Aguda'}</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={onPlayGuide}
              className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer text-center"
            >
              <Volume2 className={`w-4 h-4 shrink-0 ${themeClasses.guideIcon}`} />
              <span>Oír Guía ({guideNoteLabel})</span>
            </button>

            <button
              onClick={onFallback}
              className={`flex-1 py-2.5 sm:py-3 px-3 rounded-2xl font-heading font-bold text-xs cursor-pointer text-center ${themeClasses.fallbackBg}`}
            >
              <span>{fallbackLabel}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={onPlayGuide}
            className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer text-center"
          >
            <Volume2 className={`w-4 h-4 shrink-0 ${themeClasses.guideIcon}`} />
            <span>Oír Guía ({guideNoteLabel})</span>
          </button>

          <button
            onClick={onFallback}
            className={`flex-1 py-2.5 sm:py-3 px-3 rounded-2xl font-heading font-bold text-xs cursor-pointer text-center ${themeClasses.fallbackBg}`}
          >
            <span>{fallbackLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};
