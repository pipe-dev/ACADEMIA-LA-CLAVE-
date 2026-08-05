'use client';
import React, { useEffect, useState } from 'react';
import { Sparkles, Moon, Star } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface ZenOverlayProps {
  show: boolean;
  onFinished: () => void;
}

export const ZenOverlay: React.FC<ZenOverlayProps> = ({ show, onFinished }) => {
  const [animState, setAnimState] = useState<'idle' | 'enter' | 'exit'>('idle');

  useEffect(() => {
    if (show) {
      setAnimState('enter');
      audioService.playZenChimeSound();

      // Hold transition for 2.2 seconds then exit smoothly
      const timer = setTimeout(() => {
        setAnimState('exit');
        const finishTimer = setTimeout(() => {
          setAnimState('idle');
          onFinished();
        }, 600);
        return () => clearTimeout(finishTimer);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setAnimState('idle');
    }
  }, [show, onFinished]);

  if (animState === 'idle') return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0a121e]/95 backdrop-blur-xl transition-all duration-700 ease-out ${
        animState === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Radial Glow Orbs */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }} />

      {/* Floating Sparkles & Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Star className="absolute top-1/4 left-1/6 w-4 h-4 text-amber-300/40 animate-ping" style={{ animationDuration: '3s' }} />
        <Sparkles className="absolute top-1/3 right-1/5 w-6 h-6 text-indigo-300/40 animate-bounce" style={{ animationDuration: '4s' }} />
        <Star className="absolute bottom-1/4 right-1/4 w-5 h-5 text-amber-200/30 animate-pulse" style={{ animationDuration: '2.5s' }} />
        <Moon className="absolute bottom-1/3 left-1/5 w-6 h-6 text-amber-400/20" />
      </div>

      {/* Main Content Box */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-sm">
        {/* Soft Glowing Emblem */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-indigo-600/30 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-bounce" style={{ animationDuration: '2s' }}>
          <Moon className="w-10 h-10 text-amber-300 fill-amber-300/30" />
        </div>

        {/* Large Typography: MODO ZEN */}
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400/90 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Enfoque Nocturno
          </span>
          <h1 className="font-heading font-black text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-indigo-200 tracking-wider drop-shadow-sm">
            MODO ZEN
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300/80 font-medium max-w-xs leading-relaxed">
          Sintonizando contrastes suaves y música Zen ambiental de Solfeggio en directo (<span className="text-amber-300 font-bold">432 Hz</span>).
        </p>

        {/* Progress indicator bar */}
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden mt-2 border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-amber-400 to-indigo-400 rounded-full animate-[progress_2s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  );
};
