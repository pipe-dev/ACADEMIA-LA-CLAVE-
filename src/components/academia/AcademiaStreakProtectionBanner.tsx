'use client';
import React, { useState, useEffect } from 'react';
import { Flame, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { isStreakLitToday, subscribeStreakEligibleAction } from '../../utils/streakPrompt';
import { audioService } from '../../utils/audioService';
import { triggerHapticFeedback } from '../../utils/pwaFeatures';

interface AcademiaStreakProtectionBannerProps {
  streak: number;
  zenMode?: boolean;
  onActionClick?: () => void;
}

export const AcademiaStreakProtectionBanner: React.FC<AcademiaStreakProtectionBannerProps> = ({
  streak,
  zenMode = false,
  onActionClick,
}) => {
  const [litToday, setLitToday] = useState<boolean>(() => isStreakLitToday());

  useEffect(() => {
    setLitToday(isStreakLitToday());
    const unsubscribe = subscribeStreakEligibleAction(() => {
      setLitToday(isStreakLitToday());
    });

    const handleFocus = () => {
      setLitToday(isStreakLitToday());
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCta = () => {
    audioService.playClickSound();
    triggerHapticFeedback('light');

    if (onActionClick) {
      onActionClick();
      return;
    }

    // Smoothly scroll to the first active/in-progress lesson node
    const unlockedNode =
      document.querySelector('.tour-node-current') ||
      document.querySelector('[id^="node-"]') ||
      document.getElementById('tour-academia-welcome');

    if (unlockedNode) {
      unlockedNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (litToday) {
    return (
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border transition-all select-none flex items-center justify-between gap-3 shadow-2xs ${
          zenMode
            ? 'bg-[#18231c] border-emerald-900/40 text-emerald-300'
            : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-[#0a1e17] dark:via-[#0c241c] dark:to-[#0a1e17] border-emerald-200/80 dark:border-emerald-800/60'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-800 dark:text-emerald-100">
              <span>¡Racha protegida por hoy!</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full">
                {streak} {streak === 1 ? 'día' : 'días'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-snug">
              Ya practicaste hoy. Vuelve mañana para seguir construyendo tu disciplina vocal.
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-black/30 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Completado</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border transition-all relative overflow-hidden shadow-md ${
        zenMode
          ? 'bg-[#251d14] border-amber-900/50 text-[#f5ebd9]'
          : 'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-transparent border-amber-300/80 dark:border-amber-700/60'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 relative z-10">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
            <Flame className="w-6 h-6 fill-white" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Alerta estilo Duolingo</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-heading font-black text-slate-900 dark:text-amber-100 leading-tight">
              {streak > 0
                ? `¡Protege tu racha de ${streak} ${streak === 1 ? 'día' : 'días'}!`
                : '¡Enciende tu racha de práctica hoy!'}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              {streak > 0
                ? 'Tu fuego está esperando por ti. Completa 1 ejercicio o lección antes de las 12:00 AM para no perder tu constancia.'
                : 'Dedica 3 a 5 minutos a tu voz hoy y empieza tu primera racha de entrenamiento.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCta}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 group"
        >
          <span>Practicar ahora</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
