'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Play, LogOut } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface KaraokeExitConfirmModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onConfirmExit: () => void;
  zenMode?: boolean;
}

export const KaraokeExitConfirmModal: React.FC<KaraokeExitConfirmModalProps> = ({
  isOpen,
  onContinue,
  onConfirmExit,
  zenMode = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop sólido sin glassmorphism */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            audioService.playClickSound();
            onContinue();
          }}
          className="absolute inset-0 bg-black/60 cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center select-none ${
            zenMode
              ? 'bg-[#191b1f] border-[#2e3138] text-white'
              : 'bg-white dark:bg-[#10141d] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
          }`}
        >
          {/* Badge de Alerta */}
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h3 className="font-heading font-black text-lg mb-2">
            ¿Salir de la canción?
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Tu sesión de canto actual se pausará y volverás al catálogo. ¿Deseas continuar cantando o salir?
          </p>

          <div className="space-y-2.5">
            {/* Opción 1: Continuar cantando */}
            <button
              onClick={() => {
                audioService.playClickSound();
                onContinue();
              }}
              className={`w-full py-3.5 px-5 rounded-full font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all ${
                zenMode
                  ? 'bg-[#e5b83b] text-slate-950 hover:bg-[#d4a72a]'
                  : 'bg-[#6063EE] text-white hover:bg-[#4f52d9]'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continuar cantando</span>
            </button>

            {/* Opción 2: Salir al catálogo */}
            <button
              onClick={() => {
                audioService.playClickSound();
                onConfirmExit();
              }}
              className="w-full py-3 px-5 rounded-full font-heading font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 active:scale-98 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir al catálogo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
