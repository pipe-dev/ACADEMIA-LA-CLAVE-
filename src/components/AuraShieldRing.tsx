'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart } from 'lucide-react';

export function calculateAuraDashOffset(progress: number, radius: number = 64): number {
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
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  const strokeDashoffset = calculateAuraDashOffset(progress, radius);
  const { showVictory, showDanger } = getBadgeVisibility(progress);

  const isHighTension = progress >= 50;
  const isCritical = progress <= 20;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* ─── SVG Concentric Aura Ring ─── */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 w-[160px] h-[160px] overflow-visible"
        viewBox="0 0 160 160"
      >
        <defs>
          <linearGradient id="aura-emerald-grad" gradientUnits="userSpaceOnUse" x1="80" y1="16" x2="80" y2="144">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="aura-danger-grad" gradientUnits="userSpaceOnUse" x1="80" y1="16" x2="80" y2="144">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="aura-zen-grad" gradientUnits="userSpaceOnUse" x1="80" y1="16" x2="80" y2="144">
            <stop offset="0%" stopColor="#f5d56b" />
            <stop offset="100%" stopColor="#e5b83b" />
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="6"
          className={
            zenMode
              ? 'stroke-[#33373f]'
              : 'stroke-slate-200/90 dark:stroke-slate-700/80'
          }
        />

        {/* 50% Neutral Midpoint Marker (6 o'clock bottom dot) */}
        <circle
          cx="80"
          cy="144"
          r="3"
          className={
            zenMode
              ? 'fill-[#ded9cf]/40'
              : 'fill-slate-400 dark:fill-slate-500'
          }
        />

        {/* Dynamic Glowing Tension Arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth={isCritical ? 8 : isMatched ? 7.5 : 7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 80 80)"
          stroke={
            zenMode
              ? 'url(#aura-zen-grad)'
              : isHighTension
              ? 'url(#aura-emerald-grad)'
              : 'url(#aura-danger-grad)'
          }
          style={{
            transition: 'stroke-dashoffset 120ms ease-out, stroke 200ms ease, stroke-width 150ms ease',
            filter: isCritical
              ? 'drop-shadow(0 0 8px rgba(244,63,94,0.8))'
              : isMatched
              ? 'drop-shadow(0 0 8px rgba(16,185,129,0.8))'
              : isHighTension
              ? 'drop-shadow(0 0 4px rgba(16,185,129,0.4))'
              : 'drop-shadow(0 0 4px rgba(244,63,94,0.4))'
          }}
          className={isCritical ? 'animate-pulse' : ''}
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
                className="absolute -left-12 sm:-left-14 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/95 text-white shadow-lg backdrop-blur-xs border border-rose-300/50 text-[10px] font-heading font-black tracking-tight whitespace-nowrap animate-pulse"
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
                className="absolute -right-12 sm:-right-14 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/95 text-white shadow-lg backdrop-blur-xs border border-emerald-300/50 text-[10px] font-heading font-black tracking-tight whitespace-nowrap"
              >
                <Trophy className="w-3 h-3 text-white" />
                <span>Victoria</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ─── The Central 3D Sphere ─── */}
      <div className="relative z-20 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
