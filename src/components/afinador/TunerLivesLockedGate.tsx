import React from 'react';
import { Lock, Zap, Clock } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface TunerLivesLockedGateProps {
  timeToNextLifeFormatted: string;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
  zenMode?: boolean;
}

export const TunerLivesLockedGate: React.FC<TunerLivesLockedGateProps> = ({
  timeToNextLifeFormatted,
  onOpenRecoveryExam,
  onOpenStore,
  zenMode = false
}) => {
  return (
    <div
      className={`rounded-3xl p-6 shadow-lg border text-center space-y-4 ${
        zenMode
          ? 'bg-[#1f2125] border-[#2e3138]'
          : 'bg-white dark:bg-[#102034] border-rose-200/70 dark:border-rose-900/50'
      }`}
    >
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h2
          className={`text-xl font-heading font-black ${
            zenMode ? 'text-[#ded9cf]' : 'text-slate-800 dark:text-white'
          }`}
        >
          Afinador Bloqueado (0 Vidas)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Tanto el modo libre como los niveles requieren al menos 1 vida para escuchar tu afinación en vivo.
          ¡Los programas de control diafragmático y respiración abajo siguen 100% habilitados!
        </p>
      </div>

      {/* Passive recharge countdown */}
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

      {/* Recovery actions */}
      <div className="space-y-2 pt-1 max-w-xs mx-auto">
        {onOpenRecoveryExam && (
          <button
            onClick={() => {
              audioService.playClickSound();
              onOpenRecoveryExam();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <span>Entrenar para ganar 1 vida (Gratis)</span>
          </button>
        )}

        {onOpenStore && (
          <button
            onClick={() => {
              audioService.playClickSound();
              onOpenStore();
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs border active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              zenMode
                ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Recargar en la Tienda</span>
          </button>
        )}
      </div>
    </div>
  );
};
