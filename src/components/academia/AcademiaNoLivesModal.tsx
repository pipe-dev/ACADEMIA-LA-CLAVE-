'use client';
import React, { useState, useEffect } from 'react';
import { UserStats } from '../../types';
import { audioService } from '../../utils/audioService';
import { getTimeToNextLife, MAX_LIVES } from '../../utils/livesEngine';
import { X, Heart, Clock, Zap, ShoppingBag } from 'lucide-react';

interface AcademiaNoLivesModalProps {
  isOpen: boolean;
  userStats: UserStats;
  zenMode?: boolean;
  onClose: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export const AcademiaNoLivesModal: React.FC<AcademiaNoLivesModalProps> = ({
  isOpen,
  userStats,
  zenMode = false,
  onClose,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  const [timeToNextLife, setTimeToNextLife] = useState(() => getTimeToNextLife(userStats));

  useEffect(() => {
    if (!isOpen || (userStats.lives ?? MAX_LIVES) >= MAX_LIVES) return;
    setTimeToNextLife(getTimeToNextLife(userStats));
    const timer = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, userStats]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl relative border text-center space-y-4 ${
          zenMode
            ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
            : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-slate-800 text-[#0b1c30] dark:text-[#d3e4fe]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
          <Heart className="w-8 h-8 fill-transparent text-rose-500 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="font-heading font-black text-lg sm:text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            ¡Te has quedado sin vidas!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para acceder a las lecciones y exámenes de la Academia necesitas al menos 1 vida.
          </p>
        </div>

        {/* Passive timer */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Recarga pasiva en
            </span>
          </div>
          <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">
            {timeToNextLife.formatted}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-2 pt-1">
          {onOpenRecoveryExam && (
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

          {onOpenStore && (
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
        </div>
      </div>
    </div>
  );
};
