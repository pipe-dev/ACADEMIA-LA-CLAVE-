'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface PitchGaugeProps {
  centsOff: number;
  isActive: boolean;
  size?: number;
}

export const PitchGauge = memo(function PitchGauge({ centsOff, isActive, size = 140 }: PitchGaugeProps) {
  const safeCents = isNaN(centsOff) ? 0 : centsOff;
  const clampedCents = Math.max(-50, Math.min(50, safeCents));
  const absCents = Math.abs(clampedCents);
  const isInTune = absCents < 25;
  const isClose = absCents < 40;

  // SVG dimensions
  const w = size;
  const h = size * 0.65;
  const cx = w / 2;
  const cy = h * 0.85;
  const R = size * 0.42; // main arc radius
  const needleLen = R * 0.82;

  // Needle angle: -90° (left/flat) to +90° (right/sharp), 0° = center/in-tune
  // Map cents (-50..+50) to angle (-80°..+80°) to keep needle within the arc
  const needleAngleDeg = (clampedCents / 50) * 80;
  const needleAngleRad = ((needleAngleDeg - 90) * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(needleAngleRad);
  const ny = cy + needleLen * Math.sin(needleAngleRad);

  // Helper to compute arc point
  const arcPoint = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Arc segments (in degrees from -80 to +80)
  // Red(-80 to -35), Yellow(-35 to -12), Green(-12 to +12), Yellow(+12 to +35), Red(+35 to +80)
  const zones = [
    { start: -80, end: -56, color: '#ef4444' },
    { start: -56, end: -40, color: '#f59e0b' },
    { start: -40, end: 40,  color: '#22c55e' },
    { start: 40,  end: 56,  color: '#f59e0b' },
    { start: 56,  end: 80,  color: '#ef4444' },
  ];

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const s = arcPoint(startDeg, r);
    const e = arcPoint(endDeg, r);
    const sweep = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep} 1 ${e.x} ${e.y}`;
  };

  // Tick marks every 10°
  const ticks: { angle: number; major: boolean }[] = [];
  for (let a = -80; a <= 80; a += 10) {
    ticks.push({ angle: a, major: a === 0 || a === -80 || a === 80 || a === -40 || a === 40 });
  }

  // Color the needle tip and pivot based on zone
  const needleColor = isInTune ? '#22c55e' : isClose ? '#f59e0b' : '#ef4444';

  // Labels
  const flatLabel = arcPoint(-75, R + 16);
  const sharpLabel = arcPoint(75, R + 16);

  if (!isActive) {
    return (
      <div style={{ width: w }} className="flex flex-col items-center gap-1 opacity-25">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
          <path d={arcPath(-80, 80, R)} fill="none" stroke="currentColor" strokeWidth="6" opacity="0.15" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="4" fill="currentColor" opacity="0.2" />
        </svg>
        {/* Placeholder for status label height */}
        <div className="h-4" />
      </div>
    );
  }

  return (
    <div style={{ width: w }} className="flex flex-col items-center gap-1">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" style={{ willChange: 'transform' }}>
        {/* Background track */}
        <path d={arcPath(-80, 80, R)} fill="none" stroke="currentColor" strokeWidth="8" opacity="0.06" strokeLinecap="round" />

        {/* Color zone arcs */}
        {zones.map((z, i) => (
          <path
            key={i}
            d={arcPath(z.start, z.end, R)}
            fill="none"
            stroke={z.color}
            strokeWidth={z.color === '#22c55e' ? '8' : '6'}
            opacity={z.color === '#22c55e' && isInTune ? '1.0' : z.color === '#22c55e' ? '0.7' : '0.35'}
            strokeLinecap="round"
          />
        ))}

        {/* Inner thin arc for depth */}
        <path d={arcPath(-80, 80, R * 0.82)} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />

        {/* Tick marks */}
        {ticks.map(t => {
          const innerR = t.major ? R * 0.85 : R * 0.9;
          const outerR = R * 1.05;
          const p1 = arcPoint(t.angle, innerR);
          const p2 = arcPoint(t.angle, outerR);
          return (
            <line
              key={t.angle}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke="currentColor"
              strokeWidth={t.major ? '2' : '1'}
              opacity={t.angle === 0 ? '0.5' : t.major ? '0.3' : '0.12'}
              strokeLinecap="round"
            />
          );
        })}

        {/* Labels: ♭ and ♯ */}
        <text x={flatLabel.x} y={flatLabel.y} textAnchor="middle" fill="currentColor" opacity="0.3" fontSize="10" fontWeight="bold">♭</text>
        <text x={sharpLabel.x} y={sharpLabel.y} textAnchor="middle" fill="currentColor" opacity="0.3" fontSize="10" fontWeight="bold">♯</text>

        {/* Needle glow trail */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke={needleColor}
          strokeWidth="6"
          opacity="0.12"
          strokeLinecap="round"
          style={{ transition: 'all 0.12s ease-out' }}
        />

        {/* Main needle */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke={needleColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: 'all 0.12s ease-out' }}
        />

        {/* Needle tip dot */}
        <circle
          cx={nx} cy={ny} r="3.5"
          fill={needleColor}
          style={{ transition: 'all 0.12s ease-out' }}
        />

        {/* Center pivot - outer ring */}
        <circle cx={cx} cy={cy} r="7" fill="none" stroke={needleColor} strokeWidth="1.5" opacity="0.4" style={{ transition: 'stroke 0.12s ease-out' }} />
        {/* Center pivot - filled */}
        <circle cx={cx} cy={cy} r="4.5" fill={needleColor} style={{ transition: 'fill 0.12s ease-out' }} />
        <circle cx={cx} cy={cy} r="2" fill="hsl(var(--background))" />
      </svg>
      
      {/* Status label without overlap */}
      <div className="text-center h-4 mt-1">
        <span 
          className="font-mono text-[10px] sm:text-xs font-bold tracking-wider block"
          style={{ color: needleColor, transition: 'color 0.12s ease-out' }}
        >
          {isInTune ? '✓ AFINADO' : centsOff <= -50 ? 'MUY GRAVE' : centsOff >= 50 ? 'MUY AGUDO' : clampedCents < 0 ? `${clampedCents.toFixed(0)}¢ GRAVE` : `+${clampedCents.toFixed(0)}¢ AGUDO`}
        </span>
      </div>
    </div>
  );
});
