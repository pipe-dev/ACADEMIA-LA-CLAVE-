// src/components/unit3-bomb/CablePhysicsCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { BombCable, SlicePoint, SparkParticle, CableCurvePiece } from './types';
import { playSwooshSound } from '../../utils/bombAudio';

interface CablePhysicsCanvasProps {
  cables: BombCable[];
  onCableSliceAttempt: (cableIndex: number, cutCoord: { x: number; y: number }) => void;
  scannerX: number; // 0 to 1 normalized horizontal laser scanner position
  disabled?: boolean;
}

// Subdivides cubic Bézier at parameter t using De Casteljau's algorithm
function splitCubicBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): { left: [ [number, number], [number, number], [number, number], [number, number] ]; right: [ [number, number], [number, number], [number, number], [number, number] ] } {
  const lerp = (a: [number, number], b: [number, number], val: number): [number, number] => [
    a[0] + (b[0] - a[0]) * val,
    a[1] + (b[1] - a[1]) * val,
  ];

  const p01 = lerp(p0, p1, t);
  const p12 = lerp(p1, p2, t);
  const p23 = lerp(p2, p3, t);

  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);

  const p0123 = lerp(p012, p123, t);

  return {
    left: [p0, p01, p012, p0123],
    right: [p0123, p123, p23, p3],
  };
}

// Check intersection between two 2D line segments
function checkLineIntersection(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): { intersect: boolean; x: number; y: number; t: number } | null {
  const x1 = p1[0], y1 = p1[1];
  const x2 = p2[0], y2 = p2[1];
  const x3 = p3[0], y3 = p3[1];
  const x4 = p4[0], y4 = p4[1];

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      intersect: true,
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
      t: ua,
    };
  }
  return null;
}

export const CablePhysicsCanvas: React.FC<CablePhysicsCanvasProps> = ({
  cables,
  onCableSliceAttempt,
  scannerX,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerTrailRef = useRef<SlicePoint[]>([]);
  const sparksRef = useRef<SparkParticle[]>([]);
  const cablesRef = useRef<BombCable[]>(cables);
  const lastSliceTimeRef = useRef<number>(0);

  // Keep cablesRef in sync
  useEffect(() => {
    // Merge new isCut flags while preserving animation physics pieces
    cablesRef.current = cables.map((newCable, idx) => {
      const prev = cablesRef.current[idx];
      if (newCable.isCut && (!prev || !prev.isCut)) {
        // If cable just transitioned to cut without local slice physics, initialize them
        return {
          ...newCable,
          leftPiece: prev?.leftPiece || newCable.leftPiece,
          rightPiece: prev?.rightPiece || newCable.rightPiece,
        };
      }
      return {
        ...newCable,
        leftPiece: prev?.leftPiece,
        rightPiece: prev?.rightPiece,
      };
    });
  }, [cables]);

  const addSparks = (x: number, y: number, color: string, count = 22) => {
    const newSparks: SparkParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6.5;
      newSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: Math.random() > 0.4 ? color : '#ffffff',
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 1.5 + Math.random() * 2.5,
      });
    }
    sparksRef.current.push(...newSparks);
  };

  const cutCableAt = useCallback(
    (cableIndex: number, cutX: number, cutY: number, width: number, height: number) => {
      const cable = cablesRef.current[cableIndex];
      if (!cable || cable.isCut) return;

      const yBase = cable.anchorY * height;
      const sag = 26 + (cable.id % 2) * 14;

      const p0: [number, number] = [34, yBase];
      const p1: [number, number] = [width * 0.32, yBase + sag];
      const p2: [number, number] = [width * 0.68, yBase + sag];
      const p3: [number, number] = [width - 34, yBase];

      // Approximate t parameter from cutX
      const t = Math.max(0.1, Math.min(0.9, (cutX - 34) / (width - 68)));
      const { left, right } = splitCubicBezier(p0, p1, p2, p3, t);

      cable.isCut = true;
      cable.cutX = cutX;
      cable.cutY = cutY;
      cable.cutTime = performance.now();

      // Recoil & Gravity physics piece
      cable.leftPiece = {
        p0: left[0],
        p1: left[1],
        p2: left[2],
        p3: left[3],
        vx: -1.5 - Math.random() * 2.0,
        vy: -0.8 + Math.random() * 1.2,
        rotation: 0,
        vRot: -0.04,
        alpha: 1.0,
      };

      cable.rightPiece = {
        p0: right[0],
        p1: right[1],
        p2: right[2],
        p3: right[3],
        vx: 1.5 + Math.random() * 2.0,
        vy: -0.8 + Math.random() * 1.2,
        rotation: 0,
        vRot: 0.04,
        alpha: 1.0,
      };

      addSparks(cutX, cutY, cable.glowColor, 30);
      onCableSliceAttempt(cableIndex, { x: cutX, y: cutY });
    },
    [onCableSliceAttempt]
  );

  // Check collision between pointer slice segment and intact cables
  const checkSliceCollision = useCallback(
    (pA: SlicePoint, pB: SlicePoint, width: number, height: number) => {
      if (disabled) return;

      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Math.max(1, pB.time - pA.time);
      const speed = dist / dt; // px per ms

      // Fast enough swipe
      if (speed < 0.22 && dist < 18) return;

      // Play blade whoosh occasionally
      const now = performance.now();
      if (now - lastSliceTimeRef.current > 180 && speed > 0.4) {
        lastSliceTimeRef.current = now;
        playSwooshSound();
      }

      cablesRef.current.forEach((cable, idx) => {
        if (cable.isCut) return;

        const yBase = cable.anchorY * height;
        const sag = 26 + (cable.id % 2) * 14;

        const p0: [number, number] = [34, yBase];
        const p1: [number, number] = [width * 0.32, yBase + sag];
        const p2: [number, number] = [width * 0.68, yBase + sag];
        const p3: [number, number] = [width - 34, yBase];

        // Sample Bézier in 20 segments to test line-line collision
        const STEPS = 22;
        let prevPoint: [number, number] = p0;

        for (let s = 1; s <= STEPS; s++) {
          const t = s / STEPS;
          const oneMinusT = 1 - t;
          const bx =
            oneMinusT * oneMinusT * oneMinusT * p0[0] +
            3 * oneMinusT * oneMinusT * t * p1[0] +
            3 * oneMinusT * t * t * p2[0] +
            t * t * t * p3[0];
          const by =
            oneMinusT * oneMinusT * oneMinusT * p0[1] +
            3 * oneMinusT * oneMinusT * t * p1[1] +
            3 * oneMinusT * t * t * p2[1] +
            t * t * t * p3[1];

          const currPoint: [number, number] = [bx, by];
          const hit = checkLineIntersection([pA.x, pA.y], [pB.x, pB.y], prevPoint, currPoint);

          if (hit) {
            cutCableAt(idx, hit.x, hit.y, width, height);
            break;
          }
          prevPoint = currPoint;
        }
      });
    },
    [cutCableAt, disabled]
  );

  // Pointer event listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isPointerDownRef.current = true;
    pointerTrailRef.current = [{ x, y, time: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    const trail = pointerTrailRef.current;
    const lastPoint = trail[trail.length - 1];

    trail.push({ x, y, time: now });

    if (lastPoint) {
      checkSliceCollision(lastPoint, { x, y, time: now }, rect.width, rect.height);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  // Main rendering & physics RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();

      // 1. Draw Terminal Mounts (Left and Right Metallic Sockets)
      cablesRef.current.forEach((cable) => {
        const yBase = cable.anchorY * height;

        // Left socket
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(14, yBase - 9, 20, 18);
        ctx.fill();
        ctx.stroke();

        // Hex bolt in socket
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(24, yBase, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Right socket
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.rect(width - 34, yBase - 9, 20, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(width - 24, yBase, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Cables (Intact or Severed Pieces)
      cablesRef.current.forEach((cable) => {
        const yBase = cable.anchorY * height;
        const sag = 26 + (cable.id % 2) * 14;

        if (!cable.isCut) {
          const p0: [number, number] = [34, yBase];
          const p1: [number, number] = [width * 0.32, yBase + sag];
          const p2: [number, number] = [width * 0.68, yBase + sag];
          const p3: [number, number] = [width - 34, yBase];

          // Ambient drop shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 7;

          // Outer rubber coating (matte black)
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 9;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
          ctx.stroke();
          ctx.restore();

          // Colored insulation core
          ctx.save();
          ctx.strokeStyle = cable.strokeColor;
          ctx.lineWidth = 5.5;
          ctx.lineCap = 'round';
          ctx.shadowColor = cable.glowColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
          ctx.stroke();

          // Specular reflection highlight on top edge
          ctx.strokeStyle = 'rgba(255,255,255,0.65)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1] - 1.5);
          ctx.bezierCurveTo(p1[0], p1[1] - 1.5, p2[0], p2[1] - 1.5, p3[0], p3[1] - 1.5);
          ctx.stroke();
          ctx.restore();

          // Cable ID tag in center
          ctx.save();
          const midX = width * 0.5;
          const midY = yBase + sag * 0.75;
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(midX - 22, midY - 8, 44, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = cable.glowColor;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cable.label, midX, midY);
          ctx.restore();
        } else {
          // Severed Cable Physics Animation
          const drawPiece = (piece: CableCurvePiece, isLeft: boolean) => {
            // Update physics
            piece.vy += 0.22; // Gravity
            piece.vx *= 0.98; // Air damping
            piece.vy *= 0.98;

            // Shift free end
            if (isLeft) {
              piece.p3[0] += piece.vx;
              piece.p3[1] += piece.vy;
              piece.p2[0] += piece.vx * 0.7;
              piece.p2[1] += piece.vy * 0.7;
            } else {
              piece.p0[0] += piece.vx;
              piece.p0[1] += piece.vy;
              piece.p1[0] += piece.vx * 0.7;
              piece.p1[1] += piece.vy * 0.7;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0.2, piece.alpha);

            // Outer rubber
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(piece.p0[0], piece.p0[1]);
            ctx.bezierCurveTo(piece.p1[0], piece.p1[1], piece.p2[0], piece.p2[1], piece.p3[0], piece.p3[1]);
            ctx.stroke();

            // Core glow
            ctx.strokeStyle = cable.strokeColor;
            ctx.lineWidth = 4.5;
            ctx.shadowColor = cable.glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(piece.p0[0], piece.p0[1]);
            ctx.bezierCurveTo(piece.p1[0], piece.p1[1], piece.p2[0], piece.p2[1], piece.p3[0], piece.p3[1]);
            ctx.stroke();

            // Exposed frayed copper wires at the severed tip
            const tip = isLeft ? piece.p3 : piece.p0;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(tip[0], tip[1], 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          };

          if (cable.leftPiece) drawPiece(cable.leftPiece, true);
          if (cable.rightPiece) drawPiece(cable.rightPiece, false);
        }
      });

      // 3. Draw Laser Scanner reflection across cables
      const laserPixelX = 34 + scannerX * (width - 68);
      ctx.save();
      const laserGrad = ctx.createLinearGradient(laserPixelX - 16, 0, laserPixelX + 16, 0);
      laserGrad.addColorStop(0, 'rgba(34, 197, 94, 0)');
      laserGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.45)');
      laserGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = laserGrad;
      ctx.fillRect(laserPixelX - 16, 0, 32, height);

      // Bright laser core ray
      ctx.strokeStyle = 'rgba(187, 247, 208, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(laserPixelX, 0);
      ctx.lineTo(laserPixelX, height);
      ctx.stroke();
      ctx.restore();

      // 4. Update and Draw Sparks
      const aliveSparks: SparkParticle[] = [];
      sparksRef.current.forEach((spark) => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.18; // Spark gravity
        spark.alpha -= spark.decay;

        if (spark.alpha > 0.05 && spark.y < height) {
          aliveSparks.push(spark);
          ctx.save();
          ctx.globalAlpha = spark.alpha;
          ctx.fillStyle = spark.color;
          ctx.shadowColor = spark.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      sparksRef.current = aliveSparks;

      // 5. Draw Blade Trail (Fruit Ninja Swipe)
      const trail = pointerTrailRef.current;
      // Filter out points older than 130ms
      const validTrail = trail.filter((pt) => now - pt.time < 130);
      pointerTrailRef.current = validTrail;

      if (validTrail.length >= 2) {
        ctx.save();
        for (let i = 1; i < validTrail.length; i++) {
          const ptA = validTrail[i - 1];
          const ptB = validTrail[i];
          const age = now - ptB.time;
          const factor = Math.max(0, 1 - age / 130);

          // Glowing blade edge
          ctx.strokeStyle = `rgba(255, 255, 255, ${factor * 0.95})`;
          ctx.lineWidth = 3.5 * factor;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.stroke();

          // Outer aura glow
          ctx.strokeStyle = `rgba(56, 189, 248, ${factor * 0.5})`;
          ctx.lineWidth = 9 * factor;
          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cutCableAt, scannerX]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none z-20"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};
