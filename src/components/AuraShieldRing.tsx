'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart } from 'lucide-react';

export function calculateAuraDashOffset(progress: number, radius: number = 68): number {
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
  const radius = 68;
  const circumference = 2 * Math.PI * radius; // ~427.25
  const strokeDashoffset = calculateAuraDashOffset(progress, radius);
  const { showVictory, showDanger } = getBadgeVisibility(progress);

  const isHighTension = progress >= 50;
  const isCritical = progress <= 20;

  // Calculate comet tip angle and coordinates (starts at 12 o'clock, rotates clockwise)
  const tipAngleDeg = -90 + (Math.max(0, Math.min(100, progress)) / 100) * 360;
  const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
  const tipX = 88 + radius * Math.cos(tipAngleRad);
  const tipY = 88 + radius * Math.sin(tipAngleRad);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* ─── SVG Concentric Aura Ring ─── */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 w-[176px] h-[176px] overflow-visible"
        viewBox="0 0 176 176"
      >
        <defs>
          <linearGradient id="aura-emerald-grad" gradientUnits="userSpaceOnUse" x1="88" y1="20" x2="88" y2="156">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="aura-danger-grad" gradientUnits="userSpaceOnUse" x1="88" y1="20" x2="88" y2="156">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="aura-zen-grad" gradientUnits="userSpaceOnUse" x1="88" y1="20" x2="88" y2="156">
            <stop offset="0%" stopColor="#f5d56b" />
            <stop offset="100%" stopColor="#e5b83b" />
          </linearGradient>
        </defs>

        {/* Atmospheric Ambient Aura Halo (Soft outer glow) */}
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          strokeWidth="14"
          stroke={
            zenMode
              ? 'rgba(229, 184, 59, 0.15)'
              : isHighTension
              ? 'rgba(6, 182, 212, 0.16)'
              : 'rgba(244, 63, 94, 0.16)'
          }
          className="transition-all duration-300 pointer-events-none"
        />

        {/* High-Contrast Background Track Circle */}
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          strokeWidth="5.5"
          className={
            zenMode
              ? 'stroke-[#33373f]'
              : 'stroke-slate-300 dark:stroke-slate-700/80'
          }
        />

        {/* 50% Neutral Midpoint Marker (6 o'clock bottom dot: 88, 156) */}
        <circle
          cx="88"
          cy={88 + radius}
          r="3.5"
          className={
            zenMode
              ? 'fill-[#ded9cf]/80'
              : 'fill-slate-500 dark:fill-slate-400'
          }
        />

        {/* Dynamic Glowing Tension Arc */}
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          strokeWidth={isCritical ? 8 : isMatched ? 7.5 : 6.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 88 88)"
          stroke={
            zenMode
              ? 'url(#aura-zen-grad)'
              : isMatched
              ? 'url(#aura-emerald-grad)'
              : isHighTension
              ? 'url(#aura-emerald-grad)'
              : 'url(#aura-danger-grad)'
          }
          style={{
            transition: 'stroke-dashoffset 120ms ease-out, stroke 200ms ease, stroke-width 150ms ease',
            filter: isCritical
              ? 'drop-shadow(0 0 10px rgba(244,63,94,0.95))'
              : isMatched
              ? 'drop-shadow(0 0 12px rgba(16,185,129,0.95))'
              : isHighTension
              ? 'drop-shadow(0 0 8px rgba(6,182,212,0.85))'
              : 'drop-shadow(0 0 8px rgba(244,63,94,0.85))'
          }}
          className={isCritical ? 'animate-pulse' : ''}
        />

        {/* Glowing Comet Tip Dot Indicator */}
        {progress > 1 && (
          <circle
            cx={tipX}
            cy={tipY}
            r={isCritical ? 5 : 4}
            fill="#ffffff"
            style={{
              filter: isCritical
                ? 'drop-shadow(0 0 6px rgba(244,63,94,1))'
                : isHighTension
                ? 'drop-shadow(0 0 6px rgba(6,182,212,1))'
                : 'drop-shadow(0 0 6px rgba(244,63,94,1))'
            }}
            className={isCritical ? 'animate-pulse' : ''}
          />
        )}
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
                className="absolute -left-13 sm:-left-15 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/95 text-white shadow-xl backdrop-blur-xs border border-rose-300/60 text-[10px] font-heading font-black tracking-tight whitespace-nowrap animate-pulse"
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
                className="absolute -right-13 sm:-right-15 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/95 text-white shadow-xl backdrop-blur-xs border border-emerald-300/60 text-[10px] font-heading font-black tracking-tight whitespace-nowrap"
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
