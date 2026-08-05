'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Activity, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

interface PitchSample {
  time: number; // Date.now() timestamp
  pitch: number | null;
  diffHz: number; // detectedPitch - targetFrequency
}

interface PitchStabilityChartProps {
  isTuningActive: boolean;
  detectedPitch: number | null;
  targetFrequency: number;
  targetNoteName: string;
  tolerance: number; // in Hz
  darkMode?: boolean;
}

export const PitchStabilityChart: React.FC<PitchStabilityChartProps> = React.memo(({
  isTuningActive,
  detectedPitch,
  targetFrequency,
  targetNoteName,
  tolerance,
  darkMode = false
}) => {
  const [samples, setSamples] = useState<PitchSample[]>([]);
  const lastSampleTimeRef = useRef<number>(0);

  // Clear samples when target note changes
  useEffect(() => {
    setSamples([]);
  }, [targetFrequency]);

  // Capture pitch samples into rolling 5-second buffer
  useEffect(() => {
    if (!isTuningActive) return;

    const now = Date.now();
    // Throttle sampling to max ~16 fps (every ~60ms) for ultra-smooth graph rendering
    if (now - lastSampleTimeRef.current < 60) return;
    lastSampleTimeRef.current = now;

    const diffHz = detectedPitch ? detectedPitch - targetFrequency : 0;

    setSamples((prev) => {
      const fiveSecondsAgo = now - 5000;
      const filtered = prev.filter((s) => s.time >= fiveSecondsAgo);
      return [
        ...filtered,
        {
          time: now,
          pitch: detectedPitch,
          diffHz: detectedPitch ? diffHz : 0
        }
      ];
    });
  }, [isTuningActive, detectedPitch, targetFrequency]);

  // Calculate live stability metrics
  const validSamples = samples.filter((s) => s.pitch !== null);
  const tunedSamples = validSamples.filter((s) => Math.abs(s.diffHz) <= tolerance);
  const stabilityPercent = validSamples.length > 0 ? Math.round((tunedSamples.length / validSamples.length) * 100) : 0;
  
  const avgDiff = validSamples.length > 0
    ? (validSamples.reduce((acc, s) => acc + s.diffHz, 0) / validSamples.length).toFixed(1)
    : '0.0';

  // SVG Chart Dimensions
  const width = 360;
  const height = 120;
  const paddingY = 16;
  const maxDiffRange = Math.max(15, tolerance * 3); // Max Hz deviation display range (e.g. ±15Hz to ±30Hz)
  const centerY = height / 2;

  // Convert diffHz to SVG Y position (0 Hz = centerY, +maxDiff = paddingY, -maxDiff = height - paddingY)
  const getY = (diffHz: number) => {
    const clampedDiff = Math.max(-maxDiffRange, Math.min(maxDiffRange, diffHz));
    // Sharp (+) goes UP (smaller Y), Flat (-) goes DOWN (larger Y)
    return centerY - (clampedDiff / maxDiffRange) * (centerY - paddingY);
  };

  // Convert timestamp to SVG X position relative to current time window [now - 5000ms, now]
  const nowTime = Date.now();
  const startTime = nowTime - 5000;

  const getX = (time: number) => {
    const progress = (time - startTime) / 5000;
    return Math.max(0, Math.min(width, progress * width));
  };

  // Build SVG Path points
  let pathD = '';
  let areaD = '';
  if (validSamples.length > 1) {
    const points = validSamples.map((s) => ({
      x: getX(s.time),
      y: getY(s.diffHz)
    }));

    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier curves
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    areaD = `${pathD} L ${lastX} ${centerY} L ${firstX} ${centerY} Z`;
  }

  // Live cursor coordinates (most recent sample)
  const latestSample = validSamples[validSamples.length - 1];
  const latestX = latestSample ? getX(latestSample.time) : width;
  const latestY = latestSample ? getY(latestSample.diffHz) : centerY;
  const isLatestTuned = latestSample ? Math.abs(latestSample.diffHz) <= tolerance : false;

  const toleranceUpperY = getY(tolerance);
  const toleranceLowerY = getY(-tolerance);

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
            </h3>
            <p className="text-[11px] text-slate-400">
              Fluctuación de tono para la nota <span className="font-bold text-indigo-600 dark:text-indigo-400">{targetNoteName}</span>
            </p>
          </div>
        </div>

        {/* Live Stability Percentage Badge */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
          <TrendingUp className={`w-3.5 h-3.5 ${stabilityPercent >= 80 ? 'text-emerald-500' : stabilityPercent >= 50 ? 'text-amber-500' : 'text-slate-400'}`} />
          <div className="text-right">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block leading-none">
              {stabilityPercent}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
              Precisión
            </span>
          </div>
        </div>
      </div>

      {/* Line Chart Container */}
      <div className="bg-gradient-to-b from-[#f8fafc] to-[#eef2ff] dark:from-[#0b1828] dark:to-[#09111c] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/90 relative overflow-hidden">
        
        {/* SVG Graphic Canvas */}
        <div className="relative w-full h-[120px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Corridor Gradient */}
              <linearGradient id="toleranceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.18" />
              </linearGradient>

              {/* Pitch Line Stroke Gradient */}
              <linearGradient id="pitchLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor={isLatestTuned ? '#10b981' : '#f43f5e'} stopOpacity="1" />
              </linearGradient>

              {/* Area Fill Gradient */}
              <linearGradient id="areaFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke={darkMode ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />
            <line x1="0" y1={height - paddingY} x2={width} y2={height - paddingY} stroke={darkMode ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />

            {/* Target 0 Hz Centerline */}
            <line
              x1="0"
              y1={centerY}
              x2={width}
              y2={centerY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              className="opacity-70"
            />

            {/* Green Tolerance Band Corridor */}
            <rect
              x="0"
              y={toleranceUpperY}
              width={width}
              height={Math.max(2, toleranceLowerY - toleranceUpperY)}
              fill="url(#toleranceGradient)"
              rx="4"
            />

            {/* Area Fill under curve */}
            {areaD && (
              <path d={areaD} fill="url(#areaFillGradient)" />
            )}

            {/* Main Pitch Stability Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#pitchLineGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Active Pitch Cursor Head (Current Position) */}
            {isTuningActive && latestSample && (
              <g transform={`translate(${latestX}, ${latestY})`}>
                {/* Ping ring animation */}
                <circle
                  r="7"
                  fill={isLatestTuned ? '#10b981' : '#f43f5e'}
                  className="animate-ping opacity-75"
                />
                {/* Core dot */}
                <circle
                  r="5"
                  fill={isLatestTuned ? '#10b981' : '#f43f5e'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-md"
                />
              </g>
            )}
          </svg>

          {/* Idle / Listening Prompt overlay if no voice data */}
          {(!isTuningActive || validSamples.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] rounded-xl text-center p-2">
              <Sparkles className="w-5 h-5 text-indigo-500 mb-1 animate-bounce" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isTuningActive ? 'Canta o emite una nota para graficar la estabilidad' : 'Activa el afinador para medir la estabilidad de tu voz'}
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
            Precisión Alta
          </span>
        </div>
      </div>
    </div>
  );
});

export default PitchStabilityChart;
