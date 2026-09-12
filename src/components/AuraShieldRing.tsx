'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart } from 'lucide-react';

export function calculateAuraDashOffset(progress: number, radius: number = 52): number {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  return circumference - (clamped / 100) * circumference;
}

export function getBadgeVisibility(progress: number): { showVictory: boolean; showDanger: boolean } {
  return {
    showVictory: progress >= 75,
    showDanger: progress <= 30
  };
}

export interface AuraShieldRingProps {
  progress: number; // 0 to 100
  isActive?: boolean;
  isMatched?: boolean;
  zenMode?: boolean;
  showBadges?: boolean;
  children: React.ReactNode;
}

export const AuraShieldRing: React.FC<AuraShieldRingProps> = ({
  progress,
  isActive = false,
  isMatched = false,
  zenMode = false,
  showBadges = true,
  children
}) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.73
  const strokeDashoffset = calculateAuraDashOffset(progress, radius);
  const { showVictory, showDanger } = getBadgeVisibility(progress);

  const isHighTension = progress >= 50;
  const isCritical = progress <= 20;

  return (
    <div className="relative flex items-center justify-center">
      {/* ─── SVG Concentric Aura Ring ─── */}
      <svg
        className="absolute pointer-events-none -rotate-90 z-10 w-[124px] h-[124px] overflow-visible"
        viewBox="0 0 120 120"
      >
        <defs>
          <linearGradient id="aura-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="aura-danger-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="aura-zen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d56b" />
            <stop offset="100%" stopColor="#e5b83b" />
          </linearGradient>
          <filter id="aura-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          className={
            zenMode
              ? 'stroke-[#2e3138]'
              : 'stroke-slate-200/60 dark:stroke-slate-700/60'
          }
        />

        {/* Dynamic Glowing Tension Arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth={isCritical ? 5 : isMatched ? 4.5 : 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={
            zenMode
              ? 'url(#aura-zen-grad)'
              : isHighTension
              ? 'url(#aura-emerald-grad)'
              : 'url(#aura-danger-grad)'
          }
          filter={isCritical || isMatched ? 'url(#aura-glow)' : undefined}
          className={`transition-all duration-200 ease-out ${
            isCritical ? 'animate-pulse' : ''
          }`}
        />
      </svg>

      {/* ─── Floating Contextual Micro-Badges ─── */}
      {showBadges && (
        <>
          {/* Danger Heart Badge (Left Flank, appears when <= 30%) */}
          <AnimatePresence>
            {showDanger && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: 8 }}
                transition={{ type: 'spring', damping: 18, stiffness: 350 }}
                className="absolute -left-12 sm:-left-14 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/90 text-white shadow-lg backdrop-blur-xs border border-rose-300/40 text-[10px] font-heading font-black tracking-tight whitespace-nowrap animate-pulse"
              >
                <Heart className="w-3 h-3 fill-white text-white" />
                <span>-1 Vida</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Victory Trophy Badge (Right Flank, appears when >= 75%) */}
          <AnimatePresence>
            {showVictory && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: -8 }}
                transition={{ type: 'spring', damping: 18, stiffness: 350 }}
                className="absolute -right-12 sm:-right-14 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-lg backdrop-blur-xs border border-emerald-300/40 text-[10px] font-heading font-black tracking-tight whitespace-nowrap"
              >
                <Trophy className="w-3 h-3 text-white" />
                <span>Victoria</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ─── The Central 3D Sphere ─── */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
