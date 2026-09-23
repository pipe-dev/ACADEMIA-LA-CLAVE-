// src/components/unit3-rhythm/GoldenTrophyBurst.tsx
'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import { Drum } from 'lucide-react';
import { TrophyPiece, TrophyCut } from './types';

interface GoldenTrophyBurstProps {
  origin?: { x: number; y: number } | null;
  x: number;
  y: number;
  cuts?: TrophyCut[];
  onContinue?: () => void;
}

const BOX_HALF = 64; // trophy box is 128x128, centered at local 0,0

// Sutherland–Hodgman clip: keep polygon vertices on the side n·v >= d (side=1) or n·v <= d (side=-1)
const clipPolygonToHalfPlane = (
  polygon: { x: number; y: number }[],
  nx: number,
  ny: number,
  d: number,
  side: number
): { x: number; y: number }[] => {
  if (polygon.length === 0) return [];
  const output: { x: number; y: number }[] = [];
  const eps = 0.01;

  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    const curVal = (nx * current.x + ny * current.y - d) * side;
    const nextVal = (nx * next.x + ny * next.y - d) * side;

    const curInside = curVal >= -eps;
    const nextInside = nextVal >= -eps;

    if (curInside) output.push(current);

    if (curInside !== nextInside) {
      const t = curVal / (curVal - nextVal);
      output.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }

  return output;
};

const computePieces = (cuts: TrophyCut[], centerX: number, centerY: number): TrophyPiece[] => {
  let pieces: { x: number; y: number }[][] = [
    [
      { x: -BOX_HALF, y: -BOX_HALF },
      { x: BOX_HALF, y: -BOX_HALF },
      { x: BOX_HALF, y: BOX_HALF },
      { x: -BOX_HALF, y: BOX_HALF },
    ],
  ];

  cuts.forEach((cut) => {
    const lx = cut.px - centerX;
    const ly = cut.py - centerY;
    // Perpendicular normal to the swipe direction
    const normAngle = cut.angle + Math.PI / 2;
    const nx = Math.cos(normAngle);
    const ny = Math.sin(normAngle);
    const d = nx * lx + ny * ly;

    const nextPieces: { x: number; y: number }[][] = [];
    pieces.forEach((poly) => {
      const sideA = clipPolygonToHalfPlane(poly, nx, ny, d, 1);
      const sideB = clipPolygonToHalfPlane(poly, nx, ny, d, -1);
      if (sideA.length >= 3) nextPieces.push(sideA);
      if (sideB.length >= 3) nextPieces.push(sideB);
    });
    pieces = nextPieces;
  });

  return pieces.map((polygon) => {
    let cx = 0;
    let cy = 0;
    polygon.forEach((v) => {
      cx += v.x;
      cy += v.y;
    });
    cx /= polygon.length;
    cy /= polygon.length;

    const mag = Math.hypot(cx, cy) || 1;
    const spread = 14; // smooth fruit-ninja separation gap
    return {
      polygon,
      offsetX: (cx / mag) * spread,
      offsetY: (cy / mag) * spread,
    };
  });
};

const polygonToClipPath = (polygon: { x: number; y: number }[]): string => {
  const points = polygon
    .map((v) => {
      const px = ((v.x + BOX_HALF) / (BOX_HALF * 2)) * 100;
      const py = ((v.y + BOX_HALF) / (BOX_HALF * 2)) * 100;
      return `${px.toFixed(2)}% ${py.toFixed(2)}%`;
    })
    .join(', ');
  return `polygon(${points})`;
};

// Golden 3D box face — hasShadow=false when clipped to avoid GPU software blur bottlenecks
const TrophyBoxFace: React.FC<{ animated?: boolean; hasShadow?: boolean }> = ({
  animated = true,
  hasShadow = true,
}) => (
  <div
    className={`relative w-full h-full rounded-[28px] bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1 flex items-center justify-center ${
      hasShadow ? 'shadow-[0_14px_44px_rgba(245,158,11,0.68)]' : ''
    }`}
  >
    <div className="w-full h-full rounded-[24px] bg-gradient-to-br from-amber-700 via-amber-500 to-amber-300 flex items-center justify-center relative overflow-hidden border border-yellow-100/50 shadow-inner">
      {/* Glistening gold core */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,250,205,0.55)_0%,transparent_55%)]" />

      {/* Golden light sweep shimmer */}
      {animated ? (
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.75)_50%,transparent_80%)] animate-gold-shimmer pointer-events-none" />
      ) : null}

      {/* Inner gold rim ring */}
      <div className="absolute inset-2 rounded-2xl border border-yellow-200/40 pointer-events-none" />

      {/* Glowing drumhead behind the icon */}
      {animated ? (
        <div className="absolute w-[4.5rem] h-[4.5rem] rounded-full bg-[radial-gradient(circle,rgba(254,240,138,0.55)_0%,transparent_70%)] animate-pulse" />
      ) : null}

      {/* Drum Icon */}
      <Drum
        className={`relative w-16 h-16 text-white stroke-[2.5] ${
          hasShadow ? 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]' : ''
        }`}
      />
    </div>
  </div>
);

export const GoldenTrophyBurst: React.FC<GoldenTrophyBurstProps> = memo((
  { origin, x, y, cuts = [], onContinue }
) => {
  const [settled, setSettled] = useState(false);

  // Let the first frame render at the slice point, then travel to the drum center
  useEffect(() => {
    setSettled(true);
  }, []);

  const fromX = origin ? origin.x : x;
  const fromY = origin ? origin.y : y;

  const pieces = useMemo(() => {
    const raw = computePieces(cuts, x, y);
    return raw.map((piece) => ({
      ...piece,
      clip: polygonToClipPath(piece.polygon),
    }));
  }, [cuts, x, y]);

  const isCut = pieces.length > 1;

  return (
    <>
      <div
        className="absolute top-0 left-0 z-30 pointer-events-none"
        style={{
          transform: `translate3d(${settled ? x - 64 : fromX - 64}px, ${settled ? y - 64 : fromY - 64}px, 0)`,
          transition: 'transform 0.95s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {/* Rotating golden light rays behind the trophy — hardware-accelerated radial burst */}
        <div
          className="absolute -inset-16 -z-10 animate-rays-spin pointer-events-none opacity-85"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(245,158,11,0.22) 0deg, transparent 30deg, rgba(254,240,138,0.25) 60deg, transparent 90deg, rgba(245,158,11,0.22) 120deg, transparent 150deg, rgba(254,240,138,0.25) 180deg, transparent 210deg, rgba(245,158,11,0.22) 240deg, transparent 270deg, rgba(254,240,138,0.25) 300deg, transparent 330deg, rgba(245,158,11,0.22) 360deg)',
            borderRadius: '50%',
            willChange: 'transform',
          }}
        />

        {/* Floating 3D trophy box */}
        <div className="animate-trophy-float">
          <div className="w-32 h-32 relative animate-trophy-pop-in">
            {/* Expanding golden ring as the trophy grows out of the cut */}
            {!isCut ? (
              <div className="absolute inset-0 rounded-full border-[3px] border-amber-300/70 shadow-[0_0_18px_rgba(253,224,71,0.5)] animate-trophy-growth-ring pointer-events-none" />
            ) : null}

            {/* Gold Rim Ring behind the box */}
            {!isCut ? (
              <div className="absolute -inset-3 rounded-[36px] border-[3px] border-amber-300/60 shadow-[0_0_22px_rgba(245,158,11,0.55)] animate-pulse" />
            ) : null}

            {/* Intact face OR cut pieces separated around the cut lines */}
            {!isCut ? (
              <TrophyBoxFace animated={true} hasShadow={true} />
            ) : (
              <div className="absolute inset-0">
                {/* Single unclipped ambient shadow behind all pieces — computed ONCE by GPU */}
                <div className="absolute inset-0 rounded-[28px] shadow-[0_14px_44px_rgba(245,158,11,0.68)] pointer-events-none" />

                {pieces.map((piece, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-0"
                    style={{
                      clipPath: piece.clip,
                      transform: `translate3d(${piece.offsetX}px, ${piece.offsetY}px, 0)`,
                      transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                      willChange: 'transform',
                    }}
                  >
                    {/* Zero blur/shadows inside the clip-path: 100% GPU composited */}
                    <TrophyBoxFace animated={false} hasShadow={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue button: centered below the trophy */}
      <div
        className="fixed left-1/2 z-40 -translate-x-1/2 pointer-events-auto w-[min(24rem,calc(100vw-3rem))] px-4"
        style={{
          top: y + 148,
          opacity: settled ? 1 : 0,
          transition: 'opacity 0.5s ease 0.2s',
        }}
      >
        <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800">
          <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
            <button
              onClick={onContinue}
              className="w-full flex items-center justify-center px-6 py-3.5 rounded-full transition-all duration-75 relative border border-transparent btn-3d bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-0.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-200 drop-shadow-sm leading-tight">
                  UNIDAD 4
                </span>
                <span className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                  CONTINUAR A LA UNIDAD 4
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
});