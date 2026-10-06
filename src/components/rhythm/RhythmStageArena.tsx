'use client';
import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Drum, Play, Zap } from 'lucide-react';
import { RhythmPhase, FloatingFeedbackText } from './rhythmTypes';

interface RhythmStageArenaProps {
  phase: RhythmPhase;
  countInNumber: number | null;
  score: number;
  ballControls: ReturnType<typeof useAnimationControls>;
  floatingTexts: FloatingFeedbackText[];
  combo: number;
}

export const RhythmStageArena: React.FC<RhythmStageArenaProps> = ({
  phase,
  countInNumber,
  score,
  ballControls,
  floatingTexts,
  combo,
}) => {
  return (
    <div className="relative w-full h-full flex-1 min-h-[310px] rounded-3xl bg-gradient-to-b from-[#0f1f38] via-[#0b172a] to-[#070f1c] border border-blue-900/40 flex flex-col items-center justify-between pt-3 sm:pt-4 px-4 pb-2 overflow-hidden shadow-2xl">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a5f25_1px,transparent_1px),linear-gradient(to_bottom,#1e3a5f25_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0%,transparent_75%)] pointer-events-none" />

      {/* Phase Status Banner at the Top */}
      <div className="relative z-10 w-full flex items-center justify-center pt-1">
        {phase === 'guide' && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-700/80 text-indigo-300 font-heading font-extrabold text-xs shadow-md backdrop-blur-xs">
            <Drum className="w-4 h-4 animate-bounce text-indigo-400" />
            <span>
              {countInNumber !== null
                ? `Conteo: ${countInNumber} de 4`
                : 'Escucha la guía con atención...'}
            </span>
          </div>
        )}
        {phase === 'playing' && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-600/80 text-emerald-300 font-heading font-extrabold text-xs shadow-md backdrop-blur-xs animate-pulse">
            <Play className="w-4 h-4 text-emerald-400" />
            <span>¡Ahora tú! Sigue el ritmo</span>
          </div>
        )}
        {phase === 'results' && (
          <div className="space-y-1 text-center bg-slate-900/95 px-6 py-2 rounded-2xl border border-slate-700 shadow-md backdrop-blur-xs">
            <div className="text-lg font-heading font-black text-white">
              Precisión: {score}%
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {score >= 80
                ? '¡Excelente compás! Nivel Aprobado'
                : 'Necesitas al menos 80% para aprobar'}
            </p>
          </div>
        )}
      </div>

      {/* Main Jump Arena: Stage with Baseline Plunging to Buttons */}
      <div className="relative w-full flex-1 min-h-[220px] flex items-end justify-center pb-3 overflow-visible">
        {/* Left & Right Target Landing Indicators matching kick (-105px) and clap (+105px) */}
        <div
          style={{ transform: 'translateX(-105px)' }}
          className="absolute bottom-2 w-20 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 blur-[1px] pointer-events-none flex items-center justify-center"
        >
          <span className="text-[8px] font-black text-blue-400 tracking-wider">BOMBO</span>
        </div>
        <div
          style={{ transform: 'translateX(105px)' }}
          className="absolute bottom-2 w-20 h-5 rounded-full bg-rose-500/15 border border-rose-500/30 blur-[1px] pointer-events-none flex items-center justify-center"
        >
          <span className="text-[8px] font-black text-rose-400 tracking-wider">PALMAS</span>
        </div>
        <div className="absolute bottom-2 w-16 h-4 rounded-full bg-indigo-500/20 border border-indigo-400/40 blur-[1px] pointer-events-none" />

        {/* 3D Ball with Spherical Shaders: Hardware GPU accelerated */}
        <motion.div
          initial={{ x: 0, y: -90, scaleX: 1, scaleY: 1, rotate: 0 }}
          animate={ballControls}
          style={{
            transformOrigin: '50% 100%',
            willChange: 'transform',
            background:
              'radial-gradient(circle at 45% 40%, #e0e7ff 0%, #a5b4fc 20%, #6366f1 45%, #4338ca 70%, #1e1b4b 90%, #0c0a2a 100%)',
            boxShadow:
              'inset -8px -10px 22px rgba(10, 8, 38, 0.95), inset 5px 6px 14px rgba(255, 255, 255, 0.45), inset 0 -3px 8px rgba(165, 180, 252, 0.35), 0 16px 30px -4px rgba(15, 23, 42, 0.45)',
          }}
          className="w-20 h-20 sm:w-22 sm:h-22 rounded-full relative z-20 cursor-default overflow-hidden border border-white/20 transform-gpu"
        >
          {/* 3D Specular Highlight Bulb (Glass sheen) */}
          <div className="absolute top-2.5 left-4 w-6 h-3.5 rounded-full bg-gradient-to-b from-white/80 via-white/35 to-transparent blur-[0.6px] pointer-events-none transform -rotate-12" />
          <div className="absolute top-3 left-5.5 w-2 h-1.5 rounded-full bg-white/95 blur-[0.3px] pointer-events-none" />

          {/* Central 3D Volume Light Bloom */}
          <div className="absolute inset-2.5 rounded-full bg-gradient-to-tr from-transparent via-indigo-100/20 to-white/25 blur-[1.5px] pointer-events-none" />

          {/* Floor Ambient Bounce Light on bottom edge */}
          <div className="absolute bottom-1 left-3.5 right-3.5 h-2 rounded-full bg-indigo-200/25 blur-[1px] pointer-events-none" />
        </motion.div>
      </div>

      {/* Floating Feedback & Combo Counter */}
      {floatingTexts.map((f) => (
        <motion.div
          key={f.id}
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -45, scale: 1.15 }}
          transition={{ duration: 0.8 }}
          className={`absolute top-14 ${
            f.side === 'left' ? 'left-8 sm:left-14' : 'right-8 sm:right-14'
          } font-heading font-black text-xl drop-shadow-md z-30 ${f.color}`}
        >
          {f.text}
        </motion.div>
      ))}

      {combo >= 2 && (
        <div className="relative z-10 text-sm font-heading font-black text-amber-400 flex items-center gap-1 animate-bounce pb-0.5">
          <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>Combo x{combo}</span>
        </div>
      )}
    </div>
  );
};
