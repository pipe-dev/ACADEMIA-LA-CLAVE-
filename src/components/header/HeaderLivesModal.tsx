'use client';
import React, { useState, useEffect } from 'react';
import { Heart, X, CheckCircle2, Clock, Zap, ShoppingBag } from 'lucide-react';
import { UserStats } from '../../types';
import { audioService } from '../../utils/audioService';
import { getTimeToNextLife, MAX_LIVES } from '../../utils/livesEngine';

interface HeaderLivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  zenMode?: boolean;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export const HeaderLivesModal: React.FC<HeaderLivesModalProps> = ({
  isOpen,
  onClose,
  userStats,
  zenMode = false,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  const [timeToNextLife, setTimeToNextLife] = useState(() => getTimeToNextLife(userStats));

  useEffect(() => {
    if (!isOpen || (userStats.lives ?? MAX_LIVES) >= MAX_LIVES) {
      if ((userStats.lives ?? MAX_LIVES) >= MAX_LIVES) {
        setTimeToNextLife({ remainingMs: 0, formatted: '00:00' });
      }
      return;
    }
    setTimeToNextLife(getTimeToNextLife(userStats));
    const interval = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, userStats]);

  if (!isOpen) return null;

  const currentLives = userStats.lives ?? MAX_LIVES;
  const isFullLives = currentLives >= MAX_LIVES;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl relative border transition-all ${
          zenMode
            ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
            : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-slate-800 text-[#0b1c30] dark:text-[#d3e4fe]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full shadow-xs cursor-pointer active:scale-90 transition-transform ${
            zenMode
              ? 'bg-[#26292f] border border-[#2e3138] text-rose-400'
              : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/70 text-rose-500 dark:text-rose-400'
          }`}
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visual Icon and Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/10 border border-rose-500/30 flex items-center justify-center">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
          </div>

          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
              {isFullLives ? 'Vidas al Máximo' : 'Tus Vidas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFullLives
                ? 'Tienes tus 5 vidas completas para entrenar'
                : `Tienes ${userStats.lives ?? 0} de ${MAX_LIVES} vidas disponibles`}
            </p>
          </div>

          {/* Visual 5-Hearts Row */}
          <div className="flex items-center gap-2 py-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => {
              const isFilled = i < currentLives;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                    isFilled
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFilled ? 'fill-rose-500 text-rose-500' : 'fill-transparent'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Passive Timer Card (if lives < MAX_LIVES) */}
          {!isFullLives ? (
            <div className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left ${
              zenMode
                ? 'bg-[#22252a] border-[#2e3138]'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Recarga pasiva
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Siguiente vida en {timeToNextLife.formatted}
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">
                {timeToNextLife.formatted}
              </div>
            </div>
          ) : (
            <div className={`w-full p-3 rounded-2xl border flex items-center gap-2.5 text-left ${
              zenMode
                ? 'bg-[#22252a] border-[#2e3138]'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
            }`}>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Tus vidas están completamente recargadas.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2 pt-2">
            {!isFullLives && onOpenRecoveryExam && (
              <button
                onClick={() => {
                  audioService.playClickSound();
                  onClose();
                  onOpenRecoveryExam();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                <span>Entrenar para ganar 1 vida (Gratis)</span>
              </button>
            )}

            {!isFullLives && onOpenStore && (
              <button
                onClick={() => {
                  audioService.playClickSound();
                  onClose();
                  onOpenStore();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                  zenMode
                    ? 'bg-[#26292f] text-[#ded9cf]  border-[#383c44]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200   border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                <span>Recargar en la Tienda</span>
              </button>
            )}

            {isFullLives && (
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#4648d4] text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
