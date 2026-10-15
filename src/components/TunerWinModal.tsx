'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Star, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audioService';

interface TunerWinModalProps {
  isOpen: boolean;
  level: number;
  difficulty: string;
  stars: number;
  xpEarned: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onClose: () => void;
}

export const TunerWinModal: React.FC<TunerWinModalProps> = ({
  isOpen,
  level,
  difficulty,
  stars,
  xpEarned,
  onNextLevel,
  onReplay,
  onClose
}) => {
  const [mounted, setMounted] = useState(false);
  const [revealedStars, setRevealedStars] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setRevealedStars(0);
      return;
    }

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#4648d4', '#ec4899']
      });
    } catch {}

    // Animate stars sequentially
    const timeouts: NodeJS.Timeout[] = [];
    for (let i = 1; i <= stars; i++) {
      const t = setTimeout(() => {
        setRevealedStars(i);
        audioService.playSoftDing();
      }, i * 450);
      timeouts.push(t);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isOpen, stars]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#102034] rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-[#1b2b3f] text-center space-y-5 relative overflow-hidden"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-600" />

        {/* Icon and Title */}
        <div className="space-y-1 pt-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center text-amber-500 shadow-inner">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white">
            ¡Nivel Completado!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {difficulty} — Nivel {level}
          </p>
        </div>

        {/* Stars Display */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[1, 2, 3].map(s => {
            const isRevealed = s <= revealedStars;
            return (
              <motion.div
                key={s}
                initial={false}
                animate={isRevealed ? { scale: [0.5, 1.3, 1], rotate: [0, 15, 0] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Star
                  className={`w-12 h-12 transition-colors ${
                    isRevealed
                      ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              </motion.div>
            );
          })}
        </div>

        {/* XP Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-4 py-1.5 rounded-full text-emerald-700 dark:text-emerald-300 text-sm font-heading font-extrabold shadow-xs">
          <span>+{xpEarned} XP Ganados</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              audioService.playClickSound();
              onNextLevel();
            }}
            className="w-full py-3.5 px-4 rounded-2xl font-heading font-extrabold text-sm text-white bg-gradient-to-r from-[#4648d4] to-emerald-500 shadow-[0_4px_0_0_#2c2abc] hover:shadow-[0_2px_0_0_#2c2abc] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Siguiente Nivel</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                audioService.playClickSound();
                onReplay();
              }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repetir</span>
            </button>
            <button
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Menú de Niveles
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
