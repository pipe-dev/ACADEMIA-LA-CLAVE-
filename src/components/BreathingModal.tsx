'use client';
import React from 'react';
import { motion } from 'motion/react';
import { BreathingGameCard } from './BreathingGameCard';
import { ArrowLeft } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface BreathingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
  backLabel?: string;
}

export const BreathingModal: React.FC<BreathingModalProps> = ({
  isOpen = true,
  onClose,
  onGrantXp,
  isEmbeddedView = false,
  backLabel
}) => {
  const computedBackLabel = backLabel || (isEmbeddedView ? 'Volver al Afinador' : 'Volver');
  if (!isOpen && !isEmbeddedView) return null;

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] w-full rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-xl space-y-4 relative">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            audioService.playCloseSound();
            onClose();
          }}
          className="py-1.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{computedBackLabel}</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
          Aparato Pulmonar
        </span>
      </div>

      {/* Embed Breathing Exercise Card */}
      <BreathingGameCard onGrantXp={onGrantXp} />
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-default"
      >
        {innerContent}
      </motion.div>
    </div>
  );
};

export default BreathingModal;
