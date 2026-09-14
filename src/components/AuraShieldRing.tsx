'use client';

import React from 'react';

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

  const isCritical = progress <= 20;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* ─── Ultra-Sleek Sci-Fi Neon Ring ─── */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 w-[132px] h-[132px] overflow-visible"
        viewBox="0 0 132 132"
      >
        <defs>
          <linearGradient id="aura-victory-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="aura-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
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
        </defs>

        {/* Subtle Semi-Transparent Guide Rail Track */}
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          className={
            zenMode
              ? 'stroke-[#ded9cf]/15 dark:stroke-[#33373f]/60'
              : 'stroke-slate-300/40 dark:stroke-slate-700/50'
          }
        />

        {/* Dynamic Glowing Neon Tension Arc */}
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          strokeWidth={isMatched ? 3.5 : isCritical ? 3.5 : 3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 66 66)"
          stroke={
            zenMode
              ? 'url(#aura-zen-grad)'
              : isMatched
              ? 'url(#aura-victory-grad)'
              : progress >= 75
              ? 'url(#aura-victory-grad)'
              : progress <= 30
              ? 'url(#aura-danger-grad)'
              : 'url(#aura-active-grad)'
          }
          style={{
            transition: 'stroke-dashoffset 140ms cubic-bezier(0.4, 0, 0.2, 1), stroke 250ms ease',
            filter: zenMode
              ? 'drop-shadow(0 0 4px rgba(229,184,59,0.7))'
              : isMatched
              ? 'drop-shadow(0 0 6px rgba(16,185,129,0.85))'
              : progress >= 75
              ? 'drop-shadow(0 0 5px rgba(6,182,212,0.8))'
              : progress <= 30
              ? 'drop-shadow(0 0 6px rgba(244,63,94,0.85))'
              : 'drop-shadow(0 0 4px rgba(99,102,241,0.7))'
          }}
          className={isCritical ? 'animate-pulse' : ''}
        />
      </svg>

      {/* ─── The Central 3D Sphere ─── */}
      <div className="relative z-20 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
