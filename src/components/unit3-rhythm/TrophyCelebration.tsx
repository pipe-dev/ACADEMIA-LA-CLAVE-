// src/components/unit3-rhythm/TrophyCelebration.tsx
'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Drum, Sparkles, ArrowRight, Award } from 'lucide-react';

interface TrophyCelebrationProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const TrophyCelebration: React.FC<TrophyCelebrationProps> = ({ isOpen, onContinue }) => {
  // Trigger golden confetti burst when trophy is revealed
  useEffect(() => {
    if (isOpen) {
      try {
        const count = 75;
        const defaults = {
          origin: { y: 0.62 },
          zIndex: 100,
        };

        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, {
          spread: 26,
          startVelocity: 45,
          colors: ['#f59e0b', '#fbbf24', '#fef08a'],
        });
        fire(0.2, {
          spread: 60,
          colors: ['#a855f7', '#c084fc', '#ffffff'],
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
          colors: ['#eab308', '#ca8a04', '#ffffff'],
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          colors: ['#38bdf8', '#818cf8'],
        });
      } catch {
        // Ignored
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-center">
      {/* Rotating Radial Sunburst Halo */}
      <div className="absolute -inset-16 -z-10 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.28)_0%,transparent_70%)] animate-spin-slow" />
      </div>

      {/* Floating 3D Golden Trophy Box */}
      <div className="relative mb-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1 shadow-[0_12px_40px_rgba(245,158,11,0.55)] flex items-center justify-center animate-bounce-slow">
          <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-amber-700 via-amber-500 to-amber-300 flex items-center justify-center relative overflow-hidden border border-yellow-100/50 shadow-inner">
            {/* Shimmer light pass */}
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.7)_50%,transparent_80%)] animate-shimmer pointer-events-none" />

            {/* Drum Icon */}
            <Drum className="w-14 h-14 sm:w-16 sm:h-16 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] stroke-[2.5]" />
          </div>
        </div>

        {/* Floating Sparkles & Award Icons */}
        <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_#fde047]" />
        <Award className="absolute -bottom-2 -left-2 w-7 h-7 text-amber-300 animate-bounce" />
      </div>

      {/* Minimalist Unit 4 Advance Button (Zero text clutter) */}
      <button
        onClick={onContinue}
        className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-[0_6px_0_#065f46] hover:shadow-[0_2px_0_#065f46] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
      >
        <span>Continuar a la Unidad 4</span>
        <ArrowRight className="w-5 h-5 stroke-[3]" />
      </button>
    </div>
  );
};
