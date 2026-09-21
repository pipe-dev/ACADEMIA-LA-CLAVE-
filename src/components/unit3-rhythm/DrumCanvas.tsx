// src/components/unit3-rhythm/DrumCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { ActiveSphere, DrumWave, StarSpark, SlicePoint, SphereHemisphere } from './types';
import { RhythmSphere3D } from './RhythmSphere3D';

interface DrumCanvasProps {
  activeSphere: ActiveSphere | null;
  completedBeats: number; // 0, 1, 2, 3, 4
  onSliceSphere: (sphere: ActiveSphere, cutCoord: { x: number; y: number }) => void;
  onDrumBounce?: () => void;
  isSlowMo?: boolean;
}

export const DrumCanvas: React.FC<DrumCanvasProps> = ({
  activeSphere,
  completedBeats,
  onSliceSphere,
  onDrumBounce,
  isSlowMo = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerTrailRef = useRef<SlicePoint[]>([]);
  const sparksRef = useRef<StarSpark[]>([]);
  const wavesRef = useRef<DrumWave[]>([]);
  const drumSkinOffsetRef = useRef<number>(0);
  const drumSkinVelocityRef = useRef<number>(0);
  const sphereRef = useRef<ActiveSphere | null>(activeSphere);
  const prevSphereYRef = useRef<number>(0);
  const sphereDomRef = useRef<HTMLDivElement | null>(null);
  const leftPieceDomRef = useRef<HTMLDivElement | null>(null);
  const rightPieceDomRef = useRef<HTMLDivElement | null>(null);

  // Sync active sphere ref
  useEffect(() => {
    sphereRef.current = activeSphere;
  }, [activeSphere]);

  // Trigger drum bounce ripple and elastic dip
  const triggerDrumImpact = useCallback((impactX: number, impactY: number) => {
    drumSkinOffsetRef.current = 14; // Dip down 14px
    drumSkinVelocityRef.current = -2;

    wavesRef.current.push({
      id: Date.now() + Math.random(),
      x: impactX,
      y: impactY,
      radius: 8,
      maxRadius: 180,
      alpha: 0.85,
    });

    if (onDrumBounce) {
      onDrumBounce();
    }
  }, [onDrumBounce]);

  // Add sparks burst upon slicing
  const addSparks = (x: number, y: number, color: string, count = 28) => {
    const newSparks: StarSpark[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.0;
      newSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1.0,
        color: Math.random() > 0.35 ? color : '#ffffff',
        size: 1.5 + Math.random() * 3.0,
      });
    }
    sparksRef.current.push(...newSparks);
  };

  // Slice sphere into two hemispheres — explosive Fruit Ninja physics
  const sliceActiveSphere = useCallback((sphere: ActiveSphere, cutX: number, cutY: number) => {
    if (sphere.isCut) return;

    sphere.isCut = true;

    // Left hemisphere — flies hard left and up with fast spin
    const leftPiece: SphereHemisphere = {
      x: sphere.x - 4,
      y: sphere.y,
      vx: -12 - Math.random() * 6,   // fast horizontal separation
      vy: -8 - Math.random() * 5,     // pop upward first
      rotation: 0,
      vRot: -0.18 - Math.random() * 0.12, // fast spin
      alpha: 1.0,
    };

    // Right hemisphere — flies hard right and up with fast spin
    const rightPiece: SphereHemisphere = {
      x: sphere.x + 4,
      y: sphere.y,
      vx: 12 + Math.random() * 6,     // fast horizontal separation
      vy: -8 - Math.random() * 5,     // pop upward first
      rotation: 0,
      vRot: 0.18 + Math.random() * 0.12, // fast spin
      alpha: 1.0,
    };

    sphere.leftPiece = leftPiece;
    sphere.rightPiece = rightPiece;

    const sparkColor = sphere.type === 'golden' ? '#fbbf24' : '#c084fc';
    addSparks(cutX, cutY, sparkColor, sphere.type === 'golden' ? 45 : 28);

    onSliceSphere(sphere, { x: cutX, y: cutY });
  }, [onSliceSphere]);

  // Check swipe intersection with sphere
  const checkSwipeCollision = useCallback(
    (ptA: SlicePoint, ptB: SlicePoint) => {
      const sphere = sphereRef.current;
      if (!sphere || sphere.isCut) return;

      const dx = ptB.x - ptA.x;
      const dy = ptB.y - ptA.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) return;

      // Distance from sphere center to line segment ptA -> ptB
      const u = Math.max(
        0,
        Math.min(1, ((sphere.x - ptA.x) * dx + (sphere.y - ptA.y) * dy) / (dist * dist))
      );
      const nearestX = ptA.x + u * dx;
      const nearestY = ptA.y + u * dy;
      const distanceToCenter = Math.hypot(sphere.x - nearestX, sphere.y - nearestY);

      if (distanceToCenter <= 58) {
        sliceActiveSphere(sphere, nearestX, nearestY);
      }
    },
    [sliceActiveSphere]
  );

  // Pointer event listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

    // Direct touch slice support
    const sphere = sphereRef.current;
    if (sphere && !sphere.isCut && Math.hypot(sphere.x - x, sphere.y - y) <= 58) {
      sliceActiveSphere(sphere, x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
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
      checkSwipeCollision(lastPoint, { x, y, time: now });
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

  // Main Render & Physics RAF Loop
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
      const speedFactor = isSlowMo ? 0.3 : 1.0;

      // 1. Drum Geometry Calculations (Bottom of screen)
      const drumCenterX = width * 0.5;
      const drumCenterY = height * 0.90;
      const drumRadiusX = width * 0.62;
      const drumRadiusY = height * 0.24;

      // Elastic drum skin harmonic oscillation: F = -k*x - c*v
      const k = 0.18; // spring stiffness
      const c = 0.88; // damping
      const force = -k * drumSkinOffsetRef.current;
      drumSkinVelocityRef.current = (drumSkinVelocityRef.current + force) * c;
      drumSkinOffsetRef.current += drumSkinVelocityRef.current;

      const skinDisplacement = drumSkinOffsetRef.current;

      // 2. Draw Subtle Ambient Lighting Halo Behind Drum
      const ambientGlow = ctx.createRadialGradient(
        drumCenterX,
        drumCenterY - drumRadiusY * 0.5,
        20,
        drumCenterX,
        drumCenterY - drumRadiusY * 0.2,
        width * 0.75
      );
      ambientGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      ambientGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.08)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Concert Drum Outer Wooden Counterhoop (Rim)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(drumCenterX, drumCenterY, drumRadiusX + 16, drumRadiusY + 12, 0, 0, Math.PI * 2);
      const woodGrad = ctx.createLinearGradient(0, drumCenterY - drumRadiusY - 12, 0, height);
      woodGrad.addColorStop(0, '#542616'); // rich mahogany / walnut
      woodGrad.addColorStop(0.3, '#351409');
      woodGrad.addColorStop(0.7, '#1f0a04');
      woodGrad.addColorStop(1, '#0c0402');
      ctx.fillStyle = woodGrad;
      ctx.fill();

      // Outer gold/brass rim highlight ring
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Inner bevel groove
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(drumCenterX, drumCenterY, drumRadiusX + 2, drumRadiusY + 1, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. Draw Drum Membrane (Parchment Ivory Surface with elastic dip)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY + skinDisplacement,
        drumRadiusX,
        drumRadiusY,
        0,
        0,
        Math.PI * 2
      );
      const skinGrad = ctx.createRadialGradient(
        drumCenterX,
        drumCenterY + skinDisplacement - 30,
        40,
        drumCenterX,
        drumCenterY + skinDisplacement,
        drumRadiusX
      );
      skinGrad.addColorStop(0, '#ffffff'); // bright clean parchment center
      skinGrad.addColorStop(0.65, '#f1f5f9');
      skinGrad.addColorStop(0.9, '#cbd5e1');
      skinGrad.addColorStop(1, '#94a3b8'); // shaded contact edge
      ctx.fillStyle = skinGrad;
      ctx.fill();

      // Soft perimeter inner shadow
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();

      // 5. Draw Drum Head Tension Claws (Brass Claws sitting on the wood rim)
      const clawCount = 9;
      for (let i = 0; i < clawCount; i++) {
        const angle = (Math.PI / (clawCount - 1)) * i;
        const clawX = drumCenterX - Math.cos(angle) * (drumRadiusX + 8);
        const clawY = drumCenterY - Math.sin(angle) * (drumRadiusY * 0.95);

        ctx.save();
        // Brass casing
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(clawX, clawY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner chrome bolt
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(clawX, clawY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Draw Drum Membrane Ripples / Shockwaves
      const aliveWaves: DrumWave[] = [];
      wavesRef.current.forEach((wave) => {
        wave.radius += 5.0 * speedFactor;
        wave.alpha -= 0.025 * speedFactor;

        if (wave.alpha > 0.05 && wave.radius < wave.maxRadius) {
          aliveWaves.push(wave);
          ctx.save();
          ctx.beginPath();
          // Deformed ellipse matching drum perspective
          ctx.ellipse(
            wave.x,
            wave.y + skinDisplacement * 0.6,
            wave.radius,
            wave.radius * (drumRadiusY / drumRadiusX),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(251, 191, 36, ${wave.alpha})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.restore();
        }
      });
      wavesRef.current = aliveWaves;

      // 7. Draw 4 Minimalist Beat Indicator Dots (Floating above drum)
      const dotSpacing = 32;
      const dotStartX = drumCenterX - (dotSpacing * 1.5);
      const dotY = drumCenterY - drumRadiusY - 26;

      for (let i = 0; i < 4; i++) {
        const dotX = dotStartX + i * dotSpacing;
        const isLit = completedBeats > i;
        const isCurrent = completedBeats === i;

        ctx.save();
        ctx.beginPath();
        ctx.arc(dotX, dotY, isLit || isCurrent ? 5.5 : 4, 0, Math.PI * 2);

        if (isLit) {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.fill();
        } else if (isCurrent) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 6;
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Update & Draw Active Sphere
      const sphere = sphereRef.current;
      if (sphere) {
        // Detect impact on drum surface
        const drumSurfaceY = drumCenterY - drumRadiusY * 0.4;
        if (
          sphere.y >= drumSurfaceY - 5 &&
          prevSphereYRef.current < sphere.y &&
          sphere.vy > 0 &&
          !sphere.isCut
        ) {
          triggerDrumImpact(sphere.x, drumSurfaceY);
        }
        prevSphereYRef.current = sphere.y;

        const altitude = Math.max(0, drumSurfaceY - sphere.y);

        if (!sphere.isCut) {
          // Subtle physical deformation at drum contact (bottom sinks smoothly, realistic ball physics)
          let scaleX = 1;
          let scaleY = 1;

          if (altitude < 18) {
            // Elastic compression only at the base
            const compression = Math.max(0, 1 - altitude / 18);
            scaleX = 1 + 0.05 * compression; // max 1.05 width
            scaleY = 1 - 0.08 * compression; // max 0.92 height (bottom depresses slightly)
          } else if (altitude < 70 && sphere.vy < -150) {
            // Very subtle aerodynamic elongation on upward surge
            scaleX = 0.98;
            scaleY = 1.03;
          }

          if (sphereDomRef.current) {
            sphereDomRef.current.style.display = 'block';
            sphereDomRef.current.style.transform = `translate3d(${sphere.x - 40}px, ${sphere.y - 40}px, 0) scale(${scaleX}, ${scaleY})`;
            sphereDomRef.current.style.transformOrigin = '50% 100%';
          }
          if (leftPieceDomRef.current) leftPieceDomRef.current.style.display = 'none';
          if (rightPieceDomRef.current) rightPieceDomRef.current.style.display = 'none';

          // Drop Shadow onto the drum surface
          const shadowScale = Math.max(0.4, (1 - altitude / (height * 0.6)) * scaleX);
          const shadowAlpha = Math.max(0.08, 0.35 * shadowScale);

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            sphere.x,
            drumSurfaceY + skinDisplacement * 0.5,
            sphere.radius * shadowScale,
            sphere.radius * shadowScale * 0.35,
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * 1.5})`;
          ctx.fill();
          ctx.restore();
        } else {
          // Sphere is CUT: Hide unbroken sphere, animate and reveal the two 3D half-spheres
          if (sphereDomRef.current) sphereDomRef.current.style.display = 'none';

          if (sphere.leftPiece && leftPieceDomRef.current) {
            sphere.leftPiece.vy += 1.2 * speedFactor; // strong gravity pulls it down fast
            sphere.leftPiece.x += sphere.leftPiece.vx * speedFactor;
            sphere.leftPiece.y += sphere.leftPiece.vy * speedFactor;
            sphere.leftPiece.rotation += sphere.leftPiece.vRot * speedFactor;
            sphere.leftPiece.alpha = Math.max(0, sphere.leftPiece.alpha - 0.035 * speedFactor);

            const scaleL = Math.max(0.3, sphere.leftPiece.alpha); // shrinks as it fades
            leftPieceDomRef.current.style.display = sphere.leftPiece.alpha > 0.02 ? 'block' : 'none';
            leftPieceDomRef.current.style.opacity = `${sphere.leftPiece.alpha}`;
            leftPieceDomRef.current.style.transform = `translate3d(${sphere.leftPiece.x - 40}px, ${sphere.leftPiece.y - 40}px, 0) rotate(${sphere.leftPiece.rotation}rad) scale(${scaleL})`;
          }

          if (sphere.rightPiece && rightPieceDomRef.current) {
            sphere.rightPiece.vy += 1.2 * speedFactor; // strong gravity
            sphere.rightPiece.x += sphere.rightPiece.vx * speedFactor;
            sphere.rightPiece.y += sphere.rightPiece.vy * speedFactor;
            sphere.rightPiece.rotation += sphere.rightPiece.vRot * speedFactor;
            sphere.rightPiece.alpha = Math.max(0, sphere.rightPiece.alpha - 0.035 * speedFactor);

            const scaleR = Math.max(0.3, sphere.rightPiece.alpha); // shrinks as it fades
            rightPieceDomRef.current.style.display = sphere.rightPiece.alpha > 0.02 ? 'block' : 'none';
            rightPieceDomRef.current.style.opacity = `${sphere.rightPiece.alpha}`;
            rightPieceDomRef.current.style.transform = `translate3d(${sphere.rightPiece.x - 40}px, ${sphere.rightPiece.y - 40}px, 0) rotate(${sphere.rightPiece.rotation}rad) scale(${scaleR})`;
          }
        }
      }

      // 9. Update and Draw Star Sparks
      const aliveSparks: StarSpark[] = [];
      sparksRef.current.forEach((spark) => {
        spark.x += spark.vx * speedFactor;
        spark.y += spark.vy * speedFactor;
        spark.vy += 0.2 * speedFactor;
        spark.alpha -= 0.028 * speedFactor;

        if (spark.alpha > 0.05 && spark.y < height) {
          aliveSparks.push(spark);
          ctx.save();
          ctx.globalAlpha = spark.alpha;
          ctx.fillStyle = spark.color;
          ctx.shadowColor = spark.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      sparksRef.current = aliveSparks;

      // 10. Draw Fluid Luminous Blade Swipe Trail (Fruit Ninja)
      const trail = pointerTrailRef.current;
      const validTrail = trail.filter((pt) => now - pt.time < 120);
      pointerTrailRef.current = validTrail;

      if (validTrail.length >= 2) {
        ctx.save();
        for (let i = 1; i < validTrail.length; i++) {
          const ptA = validTrail[i - 1];
          const ptB = validTrail[i];
          const age = now - ptB.time;
          const factor = Math.max(0, 1 - age / 120);

          // Pure white blade edge
          ctx.strokeStyle = `rgba(255, 255, 255, ${factor * 0.95})`;
          ctx.lineWidth = 3.8 * factor;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.stroke();

          // Golden energy aura
          ctx.strokeStyle = `rgba(251, 191, 36, ${factor * 0.55})`;
          ctx.lineWidth = 9.0 * factor;
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
  }, [isSlowMo, triggerDrumImpact, completedBeats]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none z-10"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Intact 3D Sphere – position & squash/stretch driven by sphereDomRef at 60fps */}
      <div
        ref={sphereDomRef}
        style={{
          willChange: 'transform',
          display: 'none',
        }}
        className="absolute top-0 left-0 pointer-events-none z-20"
      >
        <RhythmSphere3D type={activeSphere?.type} />
      </div>

      {/* Left Half-Sphere (post-slice) – clipPath cuts left 50% */}
      <div
        ref={leftPieceDomRef}
        style={{
          willChange: 'transform',
          display: 'none',
          clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)',
        }}
        className="absolute top-0 left-0 pointer-events-none z-20"
      >
        <RhythmSphere3D type={activeSphere?.type} />
      </div>

      {/* Right Half-Sphere (post-slice) – clipPath cuts right 50% */}
      <div
        ref={rightPieceDomRef}
        style={{
          willChange: 'transform',
          display: 'none',
          clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
        }}
        className="absolute top-0 left-0 pointer-events-none z-20"
      >
        <RhythmSphere3D type={activeSphere?.type} />
      </div>
    </div>
  );
};
