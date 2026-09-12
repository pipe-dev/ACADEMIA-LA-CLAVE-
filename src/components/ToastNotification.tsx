'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, CheckCircle2, Award, Sparkles, X, Zap, Heart, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audioService';

export interface ToastItem {
  id: string;
  type: 'level' | 'quest' | 'badge' | 'xp' | 'heart' | 'warning';
  title: string;
  description: string;
  xpReward?: number;
  levelNumber?: number;
  badgeName?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 2).map((toast) => (
          <SingleToast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4500;

  useEffect(() => {
    // Play celebratory sound & effects
    if (toast.type === 'level') {
      audioService.playLevelUpSound();
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.12 },
          colors: ['#f59e0b', '#fbbf24', '#4648d4', '#10b981']
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    } else if (toast.type === 'quest' || toast.type === 'badge') {
      audioService.playBadgeUnlockedSound();
    } else {
      audioService.playSoftDing();
    }

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  // Color & Icon configs based on toast type
  const getConfig = () => {
    switch (toast.type) {
      case 'level':
        return {
          bg: 'bg-gradient-to-r from-[#1e1302]/95 via-[#2a1b04]/95 to-[#0b1c30]/95 dark:from-[#211502]/95 dark:to-[#071322]/95',
          border: 'border-amber-400/80 dark:border-amber-500/80',
          shadow: 'shadow-[0_12px_36px_rgba(245,158,11,0.35)]',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-400/40',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black',
          progressColor: 'bg-gradient-to-r from-amber-400 to-yellow-300',
          Icon: Trophy,
          tagText: toast.levelNumber ? `NIVEL ${toast.levelNumber}` : '¡NIVEL UP!'
        };
      case 'quest':
        return {
          bg: 'bg-gradient-to-r from-[#031e12]/95 via-[#062c1a]/95 to-[#0b1c30]/95 dark:from-[#032013]/95 dark:to-[#071322]/95',
          border: 'border-emerald-400/80 dark:border-emerald-500/80',
          shadow: 'shadow-[0_12px_36px_rgba(16,185,129,0.35)]',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40',
          badgeBg: 'bg-emerald-500 text-white font-bold',
          progressColor: 'bg-gradient-to-r from-emerald-400 to-teal-300',
          Icon: Target,
          tagText: toast.xpReward ? `+${toast.xpReward} XP` : 'MISIÓN COMPLETADA'
        };
      case 'badge':
        return {
          bg: 'bg-gradient-to-r from-[#1a082b]/95 via-[#250d3d]/95 to-[#0b1c30]/95 dark:from-[#1b082e]/95 dark:to-[#071322]/95',
          border: 'border-purple-400/80 dark:border-purple-500/80',
          shadow: 'shadow-[0_12px_36px_rgba(168,85,247,0.35)]',
          iconBg: 'bg-purple-500/20 text-purple-300 border border-purple-400/40',
          badgeBg: 'bg-purple-500 text-white font-bold',
          progressColor: 'bg-gradient-to-r from-purple-400 to-indigo-300',
          Icon: Award,
          tagText: 'NUEVA INSIGNIA'
        };
      case 'heart':
        return {
          bg: 'bg-gradient-to-r from-[#28080c]/95 via-[#3b0d14]/95 to-[#0b1c30]/95 dark:from-[#2d090f]/95 dark:to-[#071322]/95',
          border: 'border-rose-400/80 dark:border-rose-500/80',
          shadow: 'shadow-[0_12px_36px_rgba(244,63,94,0.35)]',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-400/40',
          badgeBg: 'bg-rose-500 text-white font-bold',
          progressColor: 'bg-gradient-to-r from-rose-400 to-red-400',
          Icon: Heart,
          tagText: 'VIDAS'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-[#261503]/95 via-[#351e05]/95 to-[#0b1c30]/95 dark:from-[#2a1705]/95 dark:to-[#071322]/95',
          border: 'border-amber-400/80 dark:border-amber-500/80',
          shadow: 'shadow-[0_12px_36px_rgba(245,158,11,0.35)]',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-400/40',
          badgeBg: 'bg-amber-500 text-black font-bold',
          progressColor: 'bg-gradient-to-r from-amber-400 to-yellow-300',
          Icon: AlertCircle,
          tagText: 'ALERTA'
        };
      case 'xp':
      default:
        return {
          bg: 'bg-gradient-to-r from-[#101438]/95 via-[#161c4d]/95 to-[#0b1c30]/95',
          border: 'border-indigo-400/80 dark:border-indigo-500/80',
          shadow: 'shadow-[0_12px_36px_rgba(70,72,212,0.35)]',
          iconBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40',
          badgeBg: 'bg-indigo-500 text-white font-bold',
          progressColor: 'bg-gradient-to-r from-indigo-400 to-purple-300',
          Icon: Zap,
          tagText: toast.xpReward ? `+${toast.xpReward} XP` : '¡RECOMPENSA!'
        };
    }
  };

  const { bg, border, shadow, iconBg, badgeBg, progressColor, Icon, tagText } = getConfig();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -28, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${border} ${bg} ${shadow} backdrop-blur-xl p-3.5 text-white flex items-center justify-between gap-3`}
    >
      {/* Icon & Details */}
      <div className="flex items-center gap-3 shrink min-w-0">
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0 flex items-center justify-center shadow-inner`}>
          <Icon className="w-5 h-5 animate-pulse" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-sm tracking-tight text-white drop-shadow-xs truncate">
              {toast.title}
            </span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${badgeBg}`}>
              {tagText}
            </span>
          </div>

          <p className="text-xs text-slate-200/90 font-medium leading-tight truncate">
            {toast.description}
          </p>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0 cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Animated Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`h-full ${progressColor}`}
        />
      </div>
    </motion.div>
  );
};
