'use client';
import React, { useEffect } from 'react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { X, Heart, Shield, Sparkles } from 'lucide-react';

interface StoreModalProps {
  userStats: UserStats;
  onClose: () => void;
  onBuyLives: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  userStats,
  onClose,
  onBuyLives
}) => {
  useEffect(() => {
    audioService.playOpenSound();
  }, []);

  const handleClose = () => {
    audioService.playCloseSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer" onClick={handleClose}>
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-5 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] transition-colors max-h-[88vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="organic-shape w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Tienda de Recursos
            </span>
            <h3 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
              Academia Store
            </h3>
          </div>
        </div>

        {/* Store items */}
        <div className="space-y-3">
          {/* Item 1: Refill Hearts */}
          <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-500">
                <Heart className="w-5 h-5 fill-red-500" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-[#0b1c30] dark:text-[#d3e4fe]">
                  Recargar Energía
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Rellena tus vidas al máximo (Tienes {userStats.lives}/{userStats.maxLives})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClickSound();
                onBuyLives();
              }}
              className="px-3.5 py-1.5 rounded-full bg-red-600 text-white font-heading font-bold text-xs hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              50 XP
            </button>
          </div>

          {/* Item 2: Streak Freeze */}
          <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-orange-500">
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
