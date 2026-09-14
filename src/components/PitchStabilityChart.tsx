'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

interface PitchStabilityChartProps {
  isTuningActive: boolean;
  detectedPitch: number | null;
  targetFrequency: number;
  targetNoteName: string;
  tolerance?: number; // in cents
  toleranceCents?: number; // in cents
  darkMode?: boolean;
}

interface TrailPoint {
  time: number;
  y: number;
  inTune: boolean;
  active: boolean;
}

export const PitchStabilityChart: React.FC<PitchStabilityChartProps> = React.memo(({
  isTuningActive,
  detectedPitch,
  targetFrequency,
  targetNoteName,
  tolerance = 28,
  toleranceCents,
  darkMode = false
}) => {
  const effectiveToleranceCents = toleranceCents ?? tolerance ?? 28;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Live pitch target & smoothed position refs (pure 60 FPS, no React lag)
  const targetDiffHzRef = useRef<number | null>(null);
  const smoothYRef = useRef<number>(60);
  const isCurrentlyTunedRef = useRef<boolean>(false);
  const trailRef = useRef<TrailPoint[]>([]);
  const lastRecordTimeRef = useRef<number>(0);
  const lastMetricsUpdateRef = useRef<number>(0);

  const [stabilityPercent, setStabilityPercent] = useState<number>(0);

  // Reset when target note changes or tuner stops
  useEffect(() => {
    trailRef.current = [];
    targetDiffHzRef.current = null;
    setStabilityPercent(0);
  }, [targetFrequency, isTuningActive]);

  // Update target frequency diff smoothly in cents without re-rendering component
  useEffect(() => {
    if (!isTuningActive || detectedPitch === null || detectedPitch <= 40 || targetFrequency <= 0) {
      targetDiffHzRef.current = null;
      isCurrentlyTunedRef.current = false;
      return;
    }

    const cents = 1200 * Math.log2(detectedPitch / targetFrequency);
    targetDiffHzRef.current = cents;
    isCurrentlyTunedRef.current = Math.abs(cents) <= effectiveToleranceCents;
  }, [detectedPitch, targetFrequency, effectiveToleranceCents, isTuningActive]);

  // 60 FPS Continuous Canvas Drawing Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const paddingY = 16;
    const centerY = height / 2;
    // Exact corridor percentage: Fácil (>=25¢) 40%, Medio (>=18¢) 30%, Difícil/Maestro 20%
    const bandPercent = effectiveToleranceCents >= 25 ? 0.40 : effectiveToleranceCents >= 18 ? 0.30 : 0.20;
    const halfBand = (height * bandPercent) / 2;

    const getY = (cents: number) => {
      const maxOffset = centerY - paddingY;
      const offset = (cents / effectiveToleranceCents) * halfBand;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
      return centerY - clampedOffset;
    };

    const now = performance.now();

    // ─── 1. Liquid Smooth Y-Interpolation (LERP 0.18) ───
    const targetY = targetDiffHzRef.current !== null
      ? getY(targetDiffHzRef.current)
      : centerY;

    // Smooth exponential gliding: zero jerky steps or sudden snapping
    smoothYRef.current += (targetY - smoothYRef.current) * 0.18;

    // ─── 2. Fixed Anchor for Active Drawing Dot (Head X) ───
    // Anchored steadily at the right edge: never drifts backward, never jumps forward!
    const headX = width - 18;
    const durationMs = 4500; // 4.5 second smooth rolling window

    // ─── 3. Record trail point every ~25ms ───
    const isSinging = targetDiffHzRef.current !== null;
    if (now - lastRecordTimeRef.current >= 25 && isTuningActive) {
      lastRecordTimeRef.current = now;
      trailRef.current.push({
        time: now,
        y: smoothYRef.current,
        inTune: isCurrentlyTunedRef.current,
        active: isSinging
      });

      // Prune points older than rolling duration
      const cutoff = now - durationMs;
      while (trailRef.current.length > 0 && trailRef.current[0].time < cutoff) {
        trailRef.current.shift();
      }

      // Throttle stability metric calculation to ~3 times per second (every 300ms)
      if (now - lastMetricsUpdateRef.current > 300) {
        lastMetricsUpdateRef.current = now;
        const activeSamples = trailRef.current.filter(p => p.active);
        if (activeSamples.length > 0) {
          const tunedCount = activeSamples.filter(p => p.inTune).length;
          setStabilityPercent(Math.round((tunedCount / activeSamples.length) * 100));
        } else {
          setStabilityPercent(0);
        }
      }
    }

    // ─── 4. Grid Lines & Target Corridor ───
    // Grid Lines
    ctx.strokeStyle = darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(0, paddingY);
    ctx.lineTo(width, paddingY);
    ctx.moveTo(0, height - paddingY);
    ctx.lineTo(width, height - paddingY);
    ctx.stroke();

    // Green Tolerance Band Corridor
    const tolTop = getY(effectiveToleranceCents);
    const tolBottom = getY(-effectiveToleranceCents);
    const bandHeight = Math.max(4, tolBottom - tolTop);

    ctx.setLineDash([]);
    ctx.fillStyle = darkMode ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.20)';
    ctx.fillRect(0, tolTop, width, bandHeight);

    // Corridor top & bottom border lines
    ctx.strokeStyle = darkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, tolTop);
    ctx.lineTo(width, tolTop);
    ctx.moveTo(0, tolBottom);
    ctx.lineTo(width, tolBottom);
    ctx.stroke();

    // Center Target 0 Hz Line
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ─── 5. Draw Fluid Flowing Waveform ───
    const trail = trailRef.current;
    if (trail.length > 0 && isTuningActive) {
      // Calculate smooth pixel coordinates for all historical points
      const points = trail.map(p => {
        const age = now - p.time;
        const px = headX - (age / durationMs) * (headX - 10);
        return { x: px, y: p.y, inTune: p.inTune, active: p.active };
      });

      // Seamlessly connect the latest point into the live drawing head at (headX, smoothY)
      points.push({
        x: headX,
        y: smoothYRef.current,
        inTune: isCurrentlyTunedRef.current,
        active: isSinging
      });

      // Filter visible points (x >= 0)
      const visible = points.filter(pt => pt.x >= 0);

      if (visible.length > 1) {
        // Area Fill under the curve
        ctx.beginPath();
        ctx.moveTo(visible[0].x, visible[0].y);
        for (let i = 1; i < visible.length; i++) {
          const prev = visible[i - 1];
          const curr = visible[i];
          const cpX = (prev.x + curr.x) / 2;
          ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
        }
        ctx.lineTo(visible[visible.length - 1].x, centerY);
        ctx.lineTo(visible[0].x, centerY);
        ctx.closePath();

        const areaGrad = ctx.createLinearGradient(0, paddingY, 0, height - paddingY);
        areaGrad.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
        areaGrad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Stroke Line
        ctx.beginPath();
        ctx.moveTo(visible[0].x, visible[0].y);
        for (let i = 1; i < visible.length; i++) {
          const prev = visible[i - 1];
          const curr = visible[i];
          const cpX = (prev.x + curr.x) / 2;
          ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
        }

        const lineGrad = ctx.createLinearGradient(0, 0, width, 0);
        lineGrad.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        lineGrad.addColorStop(0.65, 'rgba(129, 140, 248, 0.85)');
        lineGrad.addColorStop(1, isCurrentlyTunedRef.current ? '#10b981' : '#f43f5e');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // ─── 6. The Drawing Dot (Puntico) at (headX, smoothY) ───
      const dotY = smoothYRef.current;
      const isTuned = isCurrentlyTunedRef.current;
      const dotColor = isTuned ? '#10b981' : '#f43f5e';

      // Soft pulsating glow aura
      const auraRadius = 6 + (Math.sin(now / 140) + 1) * 2.5;
      ctx.beginPath();
      ctx.arc(headX, dotY, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = isTuned ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)';
      ctx.fill();

      // Solid inner core with white border
      ctx.beginPath();
      ctx.arc(headX, dotY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(draw);
  }, [effectiveToleranceCents, darkMode, isTuningActive]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  const hasData = isTuningActive && trailRef.current.length > 0;

  return (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3.5 transition-colors">
      {/* Header & Metrics Summary */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe] flex items-center gap-1.5">
              Estabilidad Vocal
              <span className="text-[10px] font-normal text-slate-400">({targetNoteName} • {targetFrequency} Hz)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mantén tu afinación estable dentro del corredor verde
            </p>
          </div>
        </div>
      </div>

      {/* 60 FPS Fluid Waveform Canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-50/80 dark:bg-[#08121f] border border-slate-200/60 dark:border-slate-800/80">
        <canvas
          ref={canvasRef}
          className="w-full h-[120px] block"
          style={{ width: '100%', height: '120px' }}
        />

        {/* Realtime Target Note HUD Overlay */}
        <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            {targetNoteName}
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {targetFrequency} Hz
          </span>
        </div>

        {/* Empty state helper if not singing */}
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <TrendingUp className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1 animate-bounce" />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {isTuningActive ? 'Canta hacia el micrófono para trazar tu estabilidad' : 'Activa el afinador para ver tu estabilidad'}
            </p>
            <p className="text-[10px] text-slate-400">
              Mantiene la línea dentro de la franja verde
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Footer stats */}
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200/60 dark:border-slate-800/80 pt-2">
        <span>Estabilidad: <strong className="text-slate-700 dark:text-slate-200">{stabilityPercent}%</strong></span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {effectiveToleranceCents >= 25 ? 'Permisivo (±28¢)' : effectiveToleranceCents >= 18 ? 'Medio (±20¢)' : 'Estricto (±10¢)'}
        </span>
      </div>
    </div>
  );
});

export default PitchStabilityChart;
