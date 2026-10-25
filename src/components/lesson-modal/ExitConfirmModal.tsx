'use client';
import React from 'react';
import { audioService } from '../../utils/audioService';
import { AlertTriangle } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onContinuePracticing: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onContinuePracticing,
  onConfirmExit
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
      onClick={onContinuePracticing}
    >
      <div
        className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl border border-red-100 dark:border-red-950 text-center animate-scaleIn cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h4 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
            ¿Salir de la lección?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Si abandonas ahora, perderás el progreso de esta lección o ejercicio en curso.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              audioService.playClickSound();
              onContinuePracticing();
            }}
            className="w-full py-3 rounded-full tactile-btn-primary font-heading font-bold text-xs cursor-pointer"
          >
            Continuar practicando
          </button>

          <button
            onClick={() => {
              audioService.playCloseSound();
              onConfirmExit();
            }}
            className="w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-heading font-bold text-xs transition-colors cursor-pointer"
          >
            Abandonar lección
          </button>
        </div>
      </div>
    </div>
  );
};
