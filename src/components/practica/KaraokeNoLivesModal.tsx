import React from 'react';
import { Lock, Clock, Zap } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface KaraokeNoLivesModalProps {
  isOpen: boolean;
  timeToNextLifeFormatted: string;
  onClose: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
  zenMode?: boolean;
}

export const KaraokeNoLivesModal: React.FC<KaraokeNoLivesModalProps> = ({
  isOpen,
  timeToNextLifeFormatted,
  onClose,
  onOpenRecoveryExam,
  onOpenStore,
  zenMode = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`rounded-3xl p-6 max-w-sm w-full space-y-4 border shadow-2xl text-center ${
          zenMode
            ? 'bg-[#1f2125] border-[#2e3138]'
            : 'bg-white dark:bg-[#102034] border-rose-200 dark:border-rose-900/60'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white">
            Sin Vidas para Cantar
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Has agotado tu canción de cortesía. Para seguir cantando en el karaoke, requieres al menos 1 vida.
          </p>
        </div>

        {/* Passive timer countdown */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left max-w-xs mx-auto ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Recarga pasiva en
            </span>
          </div>
          <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
            {timeToNextLifeFormatted}
          </span>
        </div>

        <div className="space-y-2 pt-2">
          {onOpenRecoveryExam && (
            <button
              onClick={() => {
                audioService.playClickSound();
                onClose();
                onOpenRecoveryExam();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              <span>Entrenar para ganar 1 vida (Gratis)</span>
            </button>
          )}

          {onOpenStore && (
            <button
              onClick={() => {
                audioService.playClickSound();
                onClose();
                onOpenStore();
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs border active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                zenMode
                  ? 'bg-[#26292f] text-[#ded9cf]  border-[#383c44]'
                  : 'bg-slate-100 dark:bg-slate-800   text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Recargar en la Tienda</span>
            </button>
          )}

          <button
            onClick={() => {
              audioService.playClickSound();
              onClose();
            }}
            className="w-full py-2 text-xs font-bold text-slate-400 transition-colors cursor-pointer"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    </div>
  );
};
