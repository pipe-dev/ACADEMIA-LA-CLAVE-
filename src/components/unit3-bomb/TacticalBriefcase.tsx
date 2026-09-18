// src/components/unit3-bomb/TacticalBriefcase.tsx
'use client';

import React from 'react';
import { BombCable } from './types';
import { ShieldAlert, Cpu, Radio, Sparkles } from 'lucide-react';

interface TacticalBriefcaseProps {
  timeLeftMs: number;
  cables: BombCable[];
  scannerProgress: number; // 0 to 1 beat scanner cycle
  screenShake: boolean;
  isSlowMoFrozen: boolean;
  children?: React.ReactNode;
}

// Format milliseconds to 00:SS.cc
function formatClock(ms: number): { seconds: string; centiseconds: string } {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const centiseconds = Math.floor((clamped % 1000) / 10);

  const secStr = totalSeconds.toString().padStart(2, '0');
  const csStr = centiseconds.toString().padStart(2, '0');

  return { seconds: secStr, centiseconds: csStr };
}

export const TacticalBriefcase: React.FC<TacticalBriefcaseProps> = ({
  timeLeftMs,
  cables,
  scannerProgress,
  screenShake,
  isSlowMoFrozen,
  children,
}) => {
  const { seconds, centiseconds } = formatClock(timeLeftMs);
  const isCritical = timeLeftMs <= 3000 && !isSlowMoFrozen;

  return (
    <div
      className={`relative w-full max-w-xl mx-auto rounded-3xl p-3 sm:p-5 transition-transform duration-75 select-none ${
        screenShake ? 'translate-x-1 -translate-y-1 rotate-1 scale-[0.99]' : ''
      }`}
      style={{
        background: 'linear-gradient(145deg, #1f242d 0%, #111419 60%, #0c0e12 100%)',
        boxShadow:
          '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -3px 8px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Top Heavy Tactical Handle */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-36 h-6 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-xl border-t border-x border-slate-600 shadow-md flex items-center justify-center">
        <div className="w-24 h-2 bg-slate-950 rounded-full border border-slate-700" />
      </div>

      {/* 4 Corner Titanium Reinforcement Brackets */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-slate-500 rounded-tl flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-inner" />
      </div>
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-slate-500 rounded-tr flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-inner" />
      </div>
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-slate-500 rounded-bl flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-inner" />
      </div>
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-slate-500 rounded-br flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-inner" />
      </div>

      {/* Top HUD Console */}
      <div className="relative z-10 bg-slate-950/80 rounded-2xl p-3 sm:p-4 border border-slate-800 backdrop-blur-md mb-3 shadow-inner">
        <div className="flex items-center justify-between gap-2">
          {/* Status Telemetry */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                DETONADOR MK-III
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-mono text-slate-400">
                TEMPO: <strong className="text-amber-400 font-bold">120 BPM</strong>
              </span>
            </div>
          </div>

          {/* 7-Segment Digital Countdown Display */}
          <div
            className={`flex items-baseline px-4 py-1.5 rounded-xl border font-mono tracking-wider transition-colors duration-200 ${
              isSlowMoFrozen
                ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : isCritical
                ? 'bg-red-950/60 border-red-600/70 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-red-950/30 border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
            }`}
          >
            <span
              className={`text-2xl sm:text-4xl font-extrabold ${
                isSlowMoFrozen
                  ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]'
                  : 'text-red-500 drop-shadow-[0_0_14px_rgba(239,68,68,0.9)]'
              }`}
            >
              00:{seconds}
            </span>
            <span
              className={`text-lg sm:text-2xl font-bold ml-1 ${
                isSlowMoFrozen
                  ? 'text-cyan-400/80 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                  : 'text-red-400/80 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
              }`}
            >
              .{centiseconds}
            </span>
          </div>

          {/* 4 Status LEDs for Cables */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[9px] font-mono text-slate-400 tracking-wider">CIRCUITOS</span>
            <div className="flex items-center gap-1.5">
              {cables.map((cable) => (
                <div key={cable.id} className="flex flex-col items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                      cable.isCut
                        ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_#34d399]'
                        : 'bg-red-600 border-red-400 shadow-[0_0_6px_#ef4444] animate-pulse'
                    }`}
                  />
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">{cable.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Laser Sync Bar Guide */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1 text-emerald-400">
            <Sparkles className="w-3 h-3" />
            <span>Corta con swipe cuando el láser ilumine el cable</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>VENTANA:</span>
            <span className="text-emerald-300 font-bold">±120ms</span>
          </div>
        </div>
      </div>

      {/* Main Recessed Cable Chamber */}
      <div
        className="relative w-full h-[290px] sm:h-[340px] rounded-2xl overflow-hidden border-2 border-slate-800/90 shadow-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, #131b26 0%, #090c12 100%)',
        }}
      >
        {/* Subtle Hazard Top & Bottom Stripes */}
        <div
          className="absolute top-0 left-0 right-0 h-2 opacity-35 z-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #eab308 0, #eab308 10px, transparent 10px, transparent 20px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 opacity-35 z-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #eab308 0, #eab308 10px, transparent 10px, transparent 20px)',
          }}
        />

        {/* Ambient Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />

        {/* Cable Canvas Mount Slot */}
        {children}
      </div>

      {/* Bottom Protective Trim & Warning */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 px-2">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-amber-500/80" />
          <span>ALERTA: CORTE ERRÓNEO RESTA 1.00s</span>
        </div>
        <div className="tracking-widest uppercase text-slate-600">
          PROYECTO LA CLAVE • SEGURIDAD NIVEL 3
        </div>
      </div>
    </div>
  );
};
