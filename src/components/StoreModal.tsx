'use client';
import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { calculateLifePrice, getTimeToNextLife, MAX_LIVES } from '../utils/livesEngine';
import { X, Heart, Shield, Sparkles, Clock, Zap } from 'lucide-react';

interface StoreModalProps {
  userStats: UserStats;
  onClose: () => void;
  onBuyLives: () => void;
  onOpenRecoveryExam?: () => void;
  zenMode?: boolean;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  userStats,
  onClose,
  onBuyLives,
  onOpenRecoveryExam,
  zenMode = false
}) => {
  const [timeToNextLife, setTimeToNextLife] = useState(() => getTimeToNextLife(userStats));

  useEffect(() => {
    audioService.playOpenSound();
  }, []);

  useEffect(() => {
    if ((userStats.lives ?? MAX_LIVES) >= MAX_LIVES) {
      setTimeToNextLife({ remainingMs: 0, formatted: '00:00' });
      return;
    }
    setTimeToNextLife(getTimeToNextLife(userStats));
    const interval = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(interval);
  }, [userStats]);

  const handleClose = () => {
    audioService.playCloseSound();
    onClose();
  };

  const currentLives = userStats.lives ?? MAX_LIVES;
  const isMaxLives = currentLives >= MAX_LIVES;
  const purchaseCount = userStats.lifePurchaseCount ?? 0;
  const cost = calculateLifePrice(purchaseCount);
  const currentXp = userStats.xp ?? 0;
  const canAfford = currentXp >= cost;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={handleClose}
    >
      <div
        className={`rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-5 shadow-2xl relative border transition-colors max-h-[88vh] overflow-y-auto cursor-default ${
          zenMode
            ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
            : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
              zenMode
                ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300'
            }`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                zenMode ? 'text-[#e5b83b]' : 'text-amber-600 dark:text-amber-400'
              }`}>
                Tienda de Recursos
              </span>
              <h3 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
                Academia Store
              </h3>
            </div>
          </div>

          {/* User XP Badge */}
          <div className={`px-3 py-1.5 rounded-full border text-xs font-heading font-bold flex items-center gap-1.5 ${
            zenMode
              ? 'bg-[#26292f] border-[#383c44] text-[#f0ebe1]'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
          }`}>
            <span className="text-[10px] font-normal text-slate-400">Saldo:</span>
            <span>{currentXp} XP</span>
          </div>
        </div>

        {/* Passive Recharge Card */}
        {!isMaxLives && (
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
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
                  Recarga pasiva en curso
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Siguiente vida gratis en {timeToNextLife.formatted}
                </div>
              </div>
            </div>
            <div className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
              {timeToNextLife.formatted}
            </div>
          </div>
        )}

        {/* Store items */}
        <div className="space-y-3">
          {/* Item 1: Buy 1 Life with progressive XP pricing */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-[#f8f9ff] dark:bg-[#0b1828] border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                currentLives === 0
                  ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-500'
              }`}>
                <Heart className={`w-5 h-5 ${currentLives > 0 ? 'fill-rose-500' : ''}`} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-[#0b1c30] dark:text-[#d3e4fe] flex items-center gap-1.5">
                  <span>Recuperar 1 Vida</span>
                  {purchaseCount > 0 && !isMaxLives && (
                    <span className="text-[10px] font-normal text-slate-400">
                      (Nivel {purchaseCount + 1})
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isMaxLives
                    ? `Vidas al máximo (${currentLives}/${MAX_LIVES})`
                    : `Recupera +1 vida al instante (${currentLives}/${MAX_LIVES})`}
                </p>
              </div>
            </div>

            <button
              disabled={isMaxLives || !canAfford}
              onClick={() => {
                audioService.playClickSound();
                onBuyLives();
              }}
              className={`px-3.5 py-1.5 rounded-full font-heading font-bold text-xs transition-all shadow-xs ${
                isMaxLives
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : !canAfford
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95 cursor-pointer'
              }`}
            >
              {isMaxLives ? 'Lleno' : !canAfford ? `${cost} XP` : `${cost} XP`}
            </button>
          </div>

          {/* Item 2: Free Recovery Exam button */}
          {!isMaxLives && onOpenRecoveryExam && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              zenMode
                ? 'bg-[#22252a] border-emerald-500/30'
                : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-emerald-800 dark:text-emerald-200">
                    Entrenamiento Gratuito
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Completa 7 ejercicios y gana 1 vida gratis
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  audioService.playClickSound();
                  onClose();
                  onOpenRecoveryExam();
                }}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                Entrenar
              </button>
            </div>
          )}

          {/* Item 3: Streak Freeze */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-[#f8f9ff] dark:bg-[#0b1828] border-slate-200/80 dark:border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-orange-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-[#0b1c30] dark:text-[#d3e4fe]">
                  Protector de Racha
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Protege tu racha si pierdes un día
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClickSound();
                alert('¡Protector de racha activado para tu siguiente práctica!');
              }}
              className="px-3.5 py-1.5 rounded-full bg-amber-500 text-white font-heading font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              100 XP
            </button>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default StoreModal;
