// src/components/unit3-rhythm/RhythmSphere3D.tsx
'use client';

import React from 'react';

interface RhythmSphere3DProps {
  type?: 'purple' | 'golden';
  seed?: number;
  className?: string;
}

// Deterministic PRNG so every sphere keeps a stable, unique lighting profile
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const RhythmSphere3D: React.FC<RhythmSphere3DProps> = ({
  type = 'purple',
  seed = 1,
  className = '',
}) => {
  const isGolden = type === 'golden';
  const rnd = mulberry32(Math.floor(seed) || 1);

  // 1. Main light direction (center of the radial gradient) — unique per sphere
  const lightX = 30 + rnd() * 30; // 30..60%
  const lightY = 26 + rnd() * 30; // 26..56%

  // 2. Specular bulb (glass sheen) — random placement, size and tilt
  const bulbTop = 3 + rnd() * 15;
  const bulbLeft = 7 + rnd() * 26;
  const bulbW = 18 + rnd() * 14;
  const bulbH = 10 + rnd() * 8;
  const bulbRot = -24 + rnd() * 22;
  const coreDot = rnd() > 0.4; // bright pin glint dot

  // 3. Shading weight — inset shadows, rim, floor bounce and outer drop
  const darkInset = 0.82 + rnd() * 0.18;
  const whiteInset = 0.35 + rnd() * 0.3;
  const darkInsetW = 6 + rnd() * 4;
  const darkInsetH = 8 + rnd() * 6;
  const rimAlpha = 0.12 + rnd() * 0.2;
  const floorAmp = 0.16 + rnd() * 0.2;
  const dropAlpha = 0.35 + rnd() * 0.28;
  const dropBlur = 20 + rnd() * 18;
  const dropY = 10 + rnd() * 12;

  // 4. Layering — two internal rings that spin at different speeds/directions
  const dur1 = 7 + rnd() * 11;
  const dur2 = 10 + rnd() * 13;
  const spinDir1 = rnd() > 0.5;
  const spinDir2 = rnd() > 0.5;
  const ring1Alpha = 0.10 + rnd() * 0.12;
  const ring2Alpha = 0.06 + rnd() * 0.10;

  // 5. Glint spark (destello) — random position, size and flicker delay
  const glintX = 12 + rnd() * 62;
  const glintY = 8 + rnd() * 46;
  const glintSize = 2.6 + rnd() * 2.6;
  const glintDelay = rnd() * 1.6;

  // Slight tone variation between purple/violet spheres
  const purplePalette =
    rnd() > 0.5
      ? {
          hi: '#e0e7ff',
          midHi: '#a5b4fc',
          mid: '#6366f1',
          lo: '#4338ca',
          dk: '#1e1b4b',
        }
      : {
          hi: '#ede9fe',
          midHi: '#c4b5fd',
          mid: '#8b5cf6',
          lo: '#6d28d9',
          dk: '#2e1065',
        };

  const colors = isGolden
    ? { hi: '#fffbeb', midHi: '#fef08a', mid: '#eab308', lo: '#ca8a04', dk: '#451a03' }
    : purplePalette;

  return (
    <div
      style={{
        transformOrigin: '50% 100%',
        willChange: 'transform',
        background: `radial-gradient(circle at ${lightX}% ${lightY}%, ${colors.hi} 0%, ${colors.midHi} 20%, ${colors.mid} 45%, ${colors.lo} 70%, ${colors.dk} 90%, rgba(0,0,0,1) 100%)`,
        boxShadow: `inset -${darkInsetW}px -${darkInsetH}px ${22}px rgba(8, 6, 32, ${darkInset}), inset 5px 6px 14px rgba(255, 255, 255, ${whiteInset}), inset 0 -3px 8px rgba(255, 255, 255, 0.3), 0 ${dropY}px ${dropBlur}px -4px rgba(15, 23, 42, ${dropAlpha})`,
      }}
      className={`w-20 h-20 rounded-full relative z-20 cursor-default overflow-hidden border border-white/20 transform-gpu ${className}`}
    >
      {/* 3D Specular Highlight Bulb (Glass sheen) — unique per sphere */}
      <div
        className="absolute rounded-full bg-gradient-to-b from-white/80 via-white/35 to-transparent blur-[0.6px] pointer-events-none"
        style={{
          top: bulbTop,
          left: bulbLeft,
          width: bulbW,
          height: bulbH,
          transform: `rotate(${bulbRot}deg)`,
        }}
      />
      {coreDot ? (
        <div
          className="absolute w-2 h-1.5 rounded-full bg-white/95 blur-[0.3px] pointer-events-none"
          style={{ top: bulbTop + bulbH * 0.3, left: bulbLeft + bulbW * 0.15 }}
        />
      ) : null}

      {/* Central 3D Volume Light Bloom */}
      <div
        className="absolute pointer-events-none rounded-full blur-[1.5px]"
        style={{
          inset: 8,
          background: `radial-gradient(circle at ${lightX + 4}% ${lightY - 3}%, rgba(255,255,255,0.28) 0%, transparent 55%)`,
        }}
      />

      {/* Internal spinning layerings → layered volume, not a flat image */}
      <div
        className="absolute inset-1 rounded-full pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,${ring1Alpha}) 40deg, transparent 90deg, rgba(255,255,255,${ring1Alpha}) 150deg, transparent 220deg, rgba(0,0,0,${ring1Alpha * 0.8}) 300deg, transparent 360deg)`,
          animation: `sphereLayerSpin ${dur1}s linear infinite ${spinDir1 ? 'reverse' : 'normal'}`,
          willChange: 'transform',
        }}
      />
      <div
        className="absolute inset-2 rounded-full pointer-events-none"
        style={{
          background: `linear-gradient(115deg, transparent 35%, rgba(255,255,255,${ring2Alpha}) 50%, transparent 65%)`,
          animation: `sphereLayerSpin ${dur2}s linear infinite ${spinDir2 ? 'reverse' : 'normal'}`,
          willChange: 'transform',
        }}
      />

      {/* Floor Ambient Bounce Light on bottom edge */}
      <div
        className="absolute bottom-1 blur-[1px] rounded-full bg-indigo-200/25 pointer-events-none"
        style={{ left: 12, right: 12, height: 2 + 6 * floorAmp, opacity: 0.5 + floorAmp }}
      />

      {/* Subtle inner rim ring glint */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 72%, rgba(255,255,255,${rimAlpha}) 80%, transparent 88%)`,
        }}
      />

      {/* Glint spark (destello) */}
      <div
        className="absolute pointer-events-none animate-glint"
        style={{
          top: `${glintY}%`,
          left: `${glintX}%`,
          width: glintSize,
          height: glintSize,
          animationDelay: `${glintDelay}s`,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: isGolden ? '#fde047' : '#ffffff',
            clipPath:
              'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
            filter: isGolden
              ? 'drop-shadow(0 0 3px rgba(253,224,71,0.9))'
              : 'drop-shadow(0 0 3px rgba(255,255,255,0.9))',
          }}
        />
      </div>
    </div>
  );
};