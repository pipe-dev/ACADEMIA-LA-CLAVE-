'use client';

import React, { useEffect, useRef } from 'react';
import { Activity, Radio, CheckCircle2 } from 'lucide-react';
import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';
import { StabilityTrailPoint } from './stabilityTypes';

export interface StabilitySingingViewProps {
  timeLeft: number;
  isCurrentlyInTune: boolean;
  selectedNote: ChromaticNoteButtonInfo;
  currentPitch: number | null;
  centsOff: number;
  inTuneSeconds: number;
  trailPoints: StabilityTrailPoint[];
  toleranceCents?: number;
}

export const StabilitySingingView: React.FC<StabilitySingingViewProps> = ({
  timeLeft,
  isCurrentlyInTune,
  selectedNote,
  currentPitch,
  centsOff,
  inTuneSeconds,
  trailPoints,
  toleranceCents = 25
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render dynamic live stability ribbon curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Center target line (0 cents)
    const centerY = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sweet spot band (±toleranceCents)
    const bandHeight = (toleranceCents / 50) * (height / 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(0, centerY - bandHeight, width, bandHeight * 2);

    if (trailPoints.length < 2) return;

    // Draw continuous stability ribbon line
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pointsCount = trailPoints.length;
    for (let i = 1; i < pointsCount; i++) {
      const pPrev = trailPoints[i - 1];
      const pCurr = trailPoints[i];

      // X coordinate relative to 10 seconds total width
      const x1 = (pPrev.time / 10) * width;
      const x2 = (pCurr.time / 10) * width;

      // Y coordinate based on cents deviation (-50 to +50)
      const y1 = centerY - (pPrev.centsOff / 50) * (height / 2 - 4);
      const y2 = centerY - (pCurr.centsOff / 50) * (height / 2 - 4);

      ctx.strokeStyle = pCurr.inTune ? '#10b981' : Math.abs(pCurr.centsOff) <= 38 ? '#f59e0b' : '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }, [trailPoints, toleranceCents]);

  // Cents needle position: clamp between 0% and 100%
  const needlePercent = Math.max(0, Math.min(100, ((centsOff + 50) / 100) * 100));

  return (
    <div className="space-y-4 text-center py-1">
      {/* ─── Top Timer & In-Tune Stats ─── */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-black shadow-2xs border border-purple-100 dark:border-purple-900/60">
          <Activity className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
          <span>Tiempo Restante: {timeLeft}s</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black shadow-2xs border border-emerald-100 dark:border-emerald-900/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Estable: {inTuneSeconds.toFixed(1)}s / 10s</span>
        </div>
      </div>

      {/* ─── Main Visual Stability Card ─── */}
      <div
        className={`p-5 rounded-3xl text-white space-y-3.5 relative overflow-hidden transition-all duration-200 border-2 ${
          isCurrentlyInTune
            ? 'bg-gradient-to-b from-emerald-600 to-teal-700 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
            : currentPitch
            ? Math.abs(centsOff) <= 38
              ? 'bg-gradient-to-b from-amber-900/90 to-slate-900 border-amber-500/80'
              : 'bg-gradient-to-b from-rose-950 to-slate-900 border-rose-600/70'
            : 'bg-slate-900 border-slate-700/80'
        }`}
      >
        {/* Header with target frequency vs detected */}
        <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
          <span>Tono Objetivo: {selectedNote.displayName}</span>
          <span className="text-purple-200 font-mono">
            {selectedNote.frequency.toFixed(1)} Hz {currentPitch ? `(Voz: ${currentPitch} Hz)` : ''}
          </span>
        </div>

        {/* Big Note Badge */}
        <div className="font-heading font-black text-6xl tracking-wider text-white drop-shadow-md py-1">
          {selectedNote.name}
          <span className="text-2xl font-bold opacity-80 ml-1">{selectedNote.octave}</span>
        </div>

        {/* ─── Precision Cents Gauge (-50¢ to +50¢) ─── */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-300/80 px-1 font-mono">
            <span>-50¢ Grave</span>
            <span className={isCurrentlyInTune ? 'text-emerald-300 font-black' : 'text-slate-400'}>
              Centro (±{toleranceCents}¢)
            </span>
            <span>Agudo +50¢</span>
          </div>

          {/* Meter track */}
          <div className="relative w-full h-4 bg-black/40 rounded-full overflow-hidden flex items-center justify-center p-0.5">
            {/* Center target green sweet spot (covers ±toleranceCents = 50% width) */}
            <div className="w-1/2 h-full bg-emerald-500/40 rounded-full border border-emerald-400/50" />

            {/* Indicator needle dot */}
            {currentPitch && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-75 ease-out ${
                  isCurrentlyInTune
                    ? 'bg-emerald-400 scale-120'
                    : Math.abs(centsOff) <= 38
                    ? 'bg-amber-400 scale-105'
                    : 'bg-rose-500'
                }`}
                style={{
                  left: `calc(${needlePercent}% - 8px)`
                }}
              />
            )}
          </div>
        </div>

        {/* Status Text Badge */}
        <div>
          <span
            className={`inline-block text-xs font-black px-4 py-1.5 rounded-full transition-colors duration-150 ${
              isCurrentlyInTune
                ? 'bg-white text-emerald-800 shadow-md animate-pulse'
                : currentPitch
                ? Math.abs(centsOff) <= 38
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-rose-950/90 text-rose-200 border border-rose-700 font-bold'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isCurrentlyInTune
              ? `¡DENTRO DEL RANGO! (${centsOff >= 0 ? `+${centsOff}` : centsOff}¢)`
              : currentPitch
              ? centsOff < 0
                ? `${centsOff}¢ • Muy grave (Sube un poco)`
                : `+${centsOff}¢ • Muy agudo (Baja un poco)`
              : 'Canta hacia el micrófono...'}
          </span>
        </div>

        {/* ─── Live Stability Ribbon Waveform ─── */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-purple-400" />
              Trazo de Estabilidad Continua (10s)
            </span>
            <span>{Math.min(100, Math.round((inTuneSeconds / 10) * 100))}% estable</span>
          </div>

          <div className="w-full h-16 bg-black/40 rounded-2xl overflow-hidden p-1 border border-white/10">
            <canvas
              ref={canvasRef}
              width={340}
              height={56}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Overall 10s Time Held Progress Bar */}
        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-white h-full transition-[width] duration-150 ease-out rounded-full shadow-[0_0_8px_white]"
            style={{
              width: `${Math.min(100, (inTuneSeconds / 10) * 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};
