'use client';
import React from 'react';
import { Flame, X, Trophy } from 'lucide-react';

interface StreakRewardsProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak?: number;
  onOpenInventory?: () => void;
}

export const StreakRewards: React.FC<StreakRewardsProps> = ({
  isOpen,
  onClose,
  currentStreak = 0,
  onOpenInventory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/60 border-2 border-orange-400 flex items-center justify-center mx-auto shadow-md">
          <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-bounce" />
        </div>

        <h3 className="font-heading font-extrabold text-2xl text-[#0b1c30] dark:text-[#d3e4fe]">
          Recompensas de Racha
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tienes <strong className="text-orange-500">{currentStreak} días</strong> de racha consecutiva. ¡Sigue así para desbloquear cofres e insignias exclusivas!
        </p>

        <div className="pt-2 flex justify-center gap-2">
          {onOpenInventory && (
            <button
              onClick={() => {
                onClose();
                onOpenInventory();
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading font-bold text-xs cursor-pointer shadow-md"
            >
              Ver Inventario
            </button>
          )}
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-heading font-bold text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
