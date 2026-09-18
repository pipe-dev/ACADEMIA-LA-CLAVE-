// src/components/unit3-bomb/TrophyReveal.tsx
'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Drum, Sparkles, ArrowRight, RotateCcw, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TrophyRevealProps {
  state: 'UNLATCHING' | 'TROPHY_REVEAL' | 'TIMEOUT_PUFF';
  onContinue: () => void;
  onRetry: () => void;
}

export const TrophyReveal: React.FC<TrophyRevealProps> = ({ state, onContinue, onRetry }) => {
  // Fire celebratory confetti when Trophy is revealed
  useEffect(() => {
    if (state === 'TROPHY_REVEAL') {
      try {
        const count = 75;
        const defaults = {
          origin: { y: 0.65 },
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
          colors: ['#38bdf8', '#818cf8', '#ffffff'],
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
          colors: ['#10b981', '#34d399'],
        });
      } catch {
        // Ignored if canvas-confetti is not in DOM yet
      }
    }
  }, [state]);

  if (state === 'TIMEOUT_PUFF') {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md rounded-2xl animate-fade-in text-center">
        {/* Harmless Cartoon Smoke Cloud */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-4">
          <div className="absolute w-24 h-24 bg-slate-600/70 rounded-full animate-ping opacity-30" />
          <div className="absolute w-20 h-20 bg-slate-500/80 rounded-full blur-sm animate-pulse" />
          <div className="relative z-10 w-16 h-16 bg-gradient-to-tr from-slate-400 to-slate-200 rounded-full flex items-center justify-center shadow-lg border border-slate-300">
            <span className="text-2xl font-bold text-slate-700 select-none">💨</span>
          </div>
          <span className="absolute -bottom-1 font-mono text-xs font-bold text-slate-300 tracking-wider">
            *PFFFT!*
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">¡Tiempo Agotado!</h3>
        <p className="text-sm text-slate-300 max-w-xs mb-6">
          El detonador se bloqueó de forma segura sin consecuencias. Afina tu pulso rítmico y vuelve a intentarlo.
        </p>

        <button
          onClick={onRetry}
          className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-[0_6px_0_#b45309] hover:shadow-[0_2px_0_#b45309] hover:translate-y-[2px] transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reintentar Desactivación</span>
        </button>
      </div>
    );
  }

  // Hatch Opening & Lateral Pneumatic Steam Venting
  const isUnlatching = state === 'UNLATCHING';

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden rounded-2xl">
      {/* Lateral Pneumatic Steam Jets */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none transition-opacity duration-500 ${
          isUnlatching ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,rgba(255,255,255,0.7)_0%,transparent_70%)] animate-pulse" />
      </div>
      <div
        className={`absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none transition-opacity duration-500 ${
          isUnlatching ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_right,rgba(255,255,255,0.7)_0%,transparent_70%)] animate-pulse" />
      </div>

      {/* Sliding Armored Hatch (Pneumatic Door) */}
      <div
        className={`absolute inset-0 bg-slate-900 border-2 border-slate-700 z-10 transition-transform duration-700 ease-out flex flex-col items-center justify-center ${
          state === 'TROPHY_REVEAL' ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
        }}
      >
        <div
          className="w-full h-8 mb-4 opacity-75"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #eab308 0, #eab308 14px, #0f172a 14px, #0f172a 28px)',
          }}
        />
        <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm tracking-widest animate-pulse">
          <ShieldCheck className="w-5 h-5" />
          <span>DESPRESURIZANDO PISTONES NEUMÁTICOS...</span>
        </div>
        <div
          className="w-full h-8 mt-4 opacity-75"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, #eab308 0, #eab308 14px, #0f172a 14px, #0f172a 28px)',
          }}
        />
      </div>

      {/* Internal Vault Compartment with Golden Trophy Reveal */}
      <div
        className={`relative z-20 flex flex-col items-center text-center transition-all duration-700 ${
          state === 'TROPHY_REVEAL'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-8'
        }`}
      >
        {/* Rotating Radial Light Beams */}
        <div className="absolute -inset-12 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.35)_0%,transparent_70%)] animate-spin-slow" />
        </div>

        {/* 3D Golden Trophy with Crossed Drumsticks & Drum */}
        <div className="relative mb-3 group">
          {/* Floating Levitation Container */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1 shadow-[0_10px_35px_rgba(245,158,11,0.6)] flex items-center justify-center animate-bounce-slow">
            <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-amber-700 via-amber-500 to-amber-300 flex items-center justify-center relative overflow-hidden border border-yellow-100/50 shadow-inner">
              {/* Shimmer line */}
              <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.7)_50%,transparent_80%)] animate-shimmer pointer-events-none" />

              {/* Drum Icon */}
              <Drum className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] stroke-[2.5]" />
            </div>
          </div>

          {/* Floating Stars */}
          <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-yellow-300 animate-pulse drop-shadow-[0_0_8px_#fde047]" />
          <Award className="absolute -bottom-1 -left-2 w-6 h-6 text-amber-300 animate-bounce" />
        </div>

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          <span>¡BOMBA DESACTIVADA A TIEMPO!</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          Unidad 3 Completada
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-5 leading-snug">
          Has dominado el tempo y la coordinación rítmica. Tu sentido del pulso es quirúrgico y preciso.
        </p>

        {/* Continue to Unit 4 Action Button */}
        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-[0_6px_0_#065f46] hover:shadow-[0_2px_0_#065f46] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>Continuar a la Unidad 4: Expresión, Dicción y Estilo</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
