// src/components/unit3-rhythm/DrumCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ActiveSphere, DrumWave, StarSpark, SlicePoint, SeveredPiece, DrumDimple, TrophyCut } from './types';
import { RhythmSphere3D } from './RhythmSphere3D';
import { GoldenTrophyBurst } from './GoldenTrophyBurst';
import { playBladeSwoosh } from './rhythmAudio';
import {
  checkSpheresSwipe,
  checkTrophySwipe,
  createDimpleParticles,
  createSeveredPieces,
  createSparks,
  updateIntactSpheresDOM,
  updateSeveredPieces,
} from './drumPhysics';
import {
  renderAmbientBackground,
  renderBeatDots,
  renderBladeTrail,
  renderDimples,
  renderDrum,
  renderShockwaves,
  renderSparks,
  renderSphereShadows,
} from './drumRenderers';

interface DrumCanvasProps {
  spheres?: ActiveSphere[];
  activeSphere?: ActiveSphere | null;
  completedBeats: number;
  onSliceSphere: (sphere: ActiveSphere, cutCoord: { x: number; y: number }) => void;
  onDrumBounce?: () => void;
  isSlowMo?: boolean;
  trophyReveal?: {
    x: number;
    y: number;
    origin?: { x: number; y: number } | null;
  } | null;
  onContinue?: () => void;
}

export const DrumCanvas: React.FC<DrumCanvasProps> = ({
  spheres,
  activeSphere,
  completedBeats,
  onSliceSphere,
  onDrumBounce,
  isSlowMo = false,
  trophyReveal = null,
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerTrailRef = useRef<SlicePoint[]>([]);
  const sparksRef = useRef<StarSpark[]>([]);
  const wavesRef = useRef<DrumWave[]>([]);
  const dimplesRef = useRef<DrumDimple[]>([]);
  const drumSkinOffsetRef = useRef<number>(0);
  const drumSkinVelocityRef = useRef<number>(0);

  const spheresRef = useRef<ActiveSphere[]>([]);
  const sphereDomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sphereSpinRef = useRef<Map<number, number>>(new Map());

  const severedPiecesRef = useRef<SeveredPiece[]>([]);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [trophyCuts, setTrophyCuts] = useState<TrophyCut[]>([]);
  const trophyCutsRef = useRef<TrophyCut[]>([]);
  const trophyRevealTimeRef = useRef<number>(0);
  const lastTrophyCutTimeRef = useRef<number>(0);

  const lastBounceCountsRef = useRef<Map<number, number>>(new Map());
  const drumImgRef = useRef<HTMLImageElement | null>(null);

  const bgSceneRef = useRef<HTMLCanvasElement | null>(null);
  const sceneKeyRef = useRef<string>('');

  const dragPointerRef = useRef<{ x: number; y: number } | null>(null);
  const prevRenderTime = useRef<number>(performance.now());
  const parallaxXRef = useRef(0);
  const parallaxYRef = useRef(0);
  const tiltRef = useRef(0);

  const PARALLAX_X_AMP = 0.020;
  const PARALLAX_Y_AMP = 0.012;
  const TILT_MAX_RAD = 0.035;
  const PARALLAX_EASE = 0.14;

  useEffect(() => {
    trophyCutsRef.current = [];
    setTrophyCuts([]);
    if (trophyReveal) {
      trophyRevealTimeRef.current = performance.now();
    }
  }, [trophyReveal]);

  useEffect(() => {
    const img = new Image();
    img.src = '/images/unit3/drum_3d.png';
    img.onload = () => {
      drumImgRef.current = img;
    };
    if (img.complete) {
      drumImgRef.current = img;
    }
  }, []);

  useEffect(() => {
    if (spheres && spheres.length > 0) {
      spheresRef.current = spheres;
    } else if (activeSphere) {
      spheresRef.current = [activeSphere];
    } else {
      spheresRef.current = [];
    }
  }, [spheres, activeSphere]);

  const triggerDrumImpact = useCallback((impactX: number, impactY: number) => {
    drumSkinOffsetRef.current = 14;
    drumSkinVelocityRef.current = -3;

    wavesRef.current.push({
      id: Date.now() + Math.random(),
      x: impactX,
      y: impactY,
      radius: 12,
      maxRadius: 220,
      alpha: 0.95,
    });

    dimplesRef.current.push({
      id: Date.now() + Math.random(),
      x: impactX,
      y: impactY,
      radius: 10,
      maxRadius: 32,
      depth: 14,
      alpha: 1.0,
      birthTime: performance.now(),
      particles: createDimpleParticles(impactX, impactY),
    });

    if (onDrumBounce) onDrumBounce();
  }, [onDrumBounce]);

  const addSparks = (x: number, y: number, color: string, count = 30) => {
    sparksRef.current.push(...createSparks(x, y, color, count));
  };

  const sliceActiveSphere = useCallback(
    (sphere: ActiveSphere, cutX: number, cutY: number, cutAngle: number) => {
      if (sphere.isCut) return;
      sphere.isCut = true;

      const isGolden = sphere.type === 'golden';
      const { p1, p2 } = createSeveredPieces(sphere, cutAngle);

      if (isGolden) {
        severedPiecesRef.current[6] = p1;
        severedPiecesRef.current[7] = p2;
      } else {
        let s1 = severedPiecesRef.current.findIndex((p, i) => i < 6 && (!p || p.alpha <= 0.05));
        if (s1 === -1) s1 = 0;
        severedPiecesRef.current[s1] = p1;

        let s2 = severedPiecesRef.current.findIndex((p, i) => i < 6 && i !== s1 && (!p || p.alpha <= 0.05));
        if (s2 === -1) s2 = (s1 + 1) % 6;
        severedPiecesRef.current[s2] = p2;
      }

      addSparks(cutX, cutY, isGolden ? '#fbbf24' : '#c084fc', isGolden ? 48 : 32);
      onSliceSphere(sphere, { x: cutX, y: cutY });
    },
    [onSliceSphere]
  );

  const sliceTrophy = useCallback((nearestX: number, nearestY: number, cutAngle: number) => {
    if (!trophyReveal) return;

    const now = performance.now();
    if (now - lastTrophyCutTimeRef.current < 90) return;
    lastTrophyCutTimeRef.current = now;

    const last = trophyCutsRef.current[trophyCutsRef.current.length - 1];
    if (last) {
      const angleDiff = Math.abs(((cutAngle - last.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const distToLast = Math.hypot(nearestX - last.px, nearestY - last.py);
      if (angleDiff < 0.25 && distToLast < 24) return;
    }

    if (trophyCutsRef.current.length >= 70) {
      addSparks(nearestX, nearestY, '#fbbf24', 12);
      return;
    }

    const cut: TrophyCut = { px: nearestX, py: nearestY, angle: cutAngle };
    trophyCutsRef.current = [...trophyCutsRef.current, cut];
    setTrophyCuts(trophyCutsRef.current);

    playBladeSwoosh(1);
    addSparks(nearestX, nearestY, '#fbbf24', 28);
  }, [trophyReveal]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isPointerDownRef.current = true;
    pointerTrailRef.current = [{ x, y, time: performance.now() }];
    dragPointerRef.current = { x, y };

    const cutAngle = -Math.PI / 4;
    spheresRef.current.forEach((sphere) => {
      if (!sphere.isCut && Math.hypot(sphere.x - x, sphere.y - y) <= 56) {
        sliceActiveSphere(sphere, x, y, cutAngle);
      }
    });

    if (
      trophyReveal &&
      performance.now() - trophyRevealTimeRef.current > 1100 &&
      Math.hypot(trophyReveal.x - x, trophyReveal.y - y) <= 60
    ) {
      sliceTrophy(x, y, cutAngle);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isPointerDownRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    dragPointerRef.current = { x, y };
    const trail = pointerTrailRef.current;
    const lastPoint = trail[trail.length - 1];
    trail.push({ x, y, time: now });

    if (lastPoint) {
      const hitSphere = checkSpheresSwipe(spheresRef.current, lastPoint, { x, y, time: now });
      if (hitSphere) {
        sliceActiveSphere(hitSphere.sphere, hitSphere.cutX, hitSphere.cutY, hitSphere.cutAngle);
      }
      const hitTrophy = checkTrophySwipe(trophyReveal, trophyRevealTimeRef.current, lastPoint, { x, y, time: now });
      if (hitTrophy) {
        sliceTrophy(hitTrophy.cutX, hitTrophy.cutY, hitTrophy.cutAngle);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    dragPointerRef.current = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();
      const speedFactor = isSlowMo ? 0.3 : 1.0;
      const dt = Math.min((now - prevRenderTime.current) / 1000, 0.05);
      prevRenderTime.current = now;

      const drumW = width * 1.22;
      const drumH = drumW * (681 / 1024);
      const drumY = height - drumH + 42;
      const drumCenterX = width * 0.5;
      const drumCenterY = drumY + drumH * 0.44;
      const drumRadiusX = drumW * 0.417;
      const drumRadiusY = drumH * 0.284;
      const drumSurfaceY = drumCenterY - drumRadiusY * 0.12;

      const k = 0.18;
      const c = 0.88;
      const force = -k * drumSkinOffsetRef.current;
      drumSkinVelocityRef.current = (drumSkinVelocityRef.current + force) * c;
      drumSkinOffsetRef.current += drumSkinVelocityRef.current;
      const skinDisplacement = drumSkinOffsetRef.current;

      let parallaxX = 0;
      let parallaxY = 0;
      let tilt = 0;
      const drag = dragPointerRef.current;
      if (drag && isPointerDownRef.current) {
        const normX = Math.max(-1, Math.min(1, (drag.x - drumCenterX) / (drumRadiusX || 1)));
        const normY = Math.max(-1, Math.min(1, (drag.y - drumCenterY) / (drumRadiusY || 1)));
        parallaxX = Math.max(-14, Math.min(14, -normX * drumW * PARALLAX_X_AMP));
        parallaxY = Math.max(-6, Math.min(10, -normY * drumH * PARALLAX_Y_AMP));
        tilt = -normX * TILT_MAX_RAD;
      }
      parallaxXRef.current += (parallaxX - parallaxXRef.current) * PARALLAX_EASE;
      parallaxYRef.current += (parallaxY - parallaxYRef.current) * PARALLAX_EASE;
      tiltRef.current += (tilt - tiltRef.current) * PARALLAX_EASE;

      renderAmbientBackground(ctx, bgSceneRef, sceneKeyRef, width, height, dpr, drumCenterX, drumCenterY, drumRadiusY);
      renderDrum(ctx, drumImgRef.current, drumCenterX, drumCenterY, drumRadiusX, drumRadiusY, drumW, drumH, drumY, skinDisplacement, parallaxXRef.current, parallaxYRef.current, tiltRef.current);
      renderDimples(ctx, dimplesRef, now, speedFactor, skinDisplacement, parallaxXRef.current, drumRadiusX, drumRadiusY);
      renderShockwaves(ctx, wavesRef, speedFactor, parallaxXRef.current, skinDisplacement, drumRadiusX, drumRadiusY);
      renderBeatDots(ctx, drumCenterX, drumCenterY, drumRadiusY, completedBeats);
      updateIntactSpheresDOM(spheresRef.current, sphereDomRefs.current, spinRefs.current, sphereSpinRef.current, lastBounceCountsRef.current, triggerDrumImpact, drumSurfaceY, drumCenterY, drumRadiusY, dt, speedFactor);
      renderSphereShadows(ctx, spheresRef.current, height, drumCenterY, drumRadiusY, skinDisplacement);
      updateSeveredPieces(severedPiecesRef.current, pieceRefs.current, triggerDrumImpact, drumSurfaceY, width, height, speedFactor);
      renderSparks(ctx, sparksRef, speedFactor, height);
      renderBladeTrail(ctx, pointerTrailRef, now);

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
        onPointerLeave={handlePointerUp}
      />

      {[0, 1, 2].map((sIdx) => (
        <div
          key={`intact-sphere-${sIdx}`}
          ref={(el) => {
            sphereDomRefs.current[sIdx] = el;
          }}
          style={{ willChange: 'transform', display: 'none', transformOrigin: '50% 100%' }}
          className="absolute top-0 left-0 pointer-events-none z-20"
        >
          <div
            ref={(el) => {
              spinRefs.current[sIdx] = el;
            }}
            className="w-20 h-20"
            style={{ willChange: 'transform' }}
          >
            <RhythmSphere3D
              type={(spheres && spheres[sIdx]?.type) || (activeSphere && activeSphere.type) || 'purple'}
              seed={(spheres && spheres[sIdx]?.seed) || (activeSphere && activeSphere.seed) || sIdx + 1}
            />
          </div>
        </div>
      ))}

      {Array.from({ length: 8 }).map((_, pIdx) => (
        <div
          key={`severed-piece-${pIdx}`}
          ref={(el) => {
            pieceRefs.current[pIdx] = el;
          }}
          style={{ willChange: 'transform, opacity', display: 'none' }}
          className="absolute top-0 left-0 pointer-events-none z-20"
        >
          <RhythmSphere3D type={pIdx >= 6 ? 'golden' : 'purple'} seed={pIdx + 101} />
        </div>
      ))}

      {trophyReveal ? (
        <GoldenTrophyBurst
          origin={trophyReveal.origin}
          x={trophyReveal.x}
          y={trophyReveal.y}
          cuts={trophyCuts}
          onContinue={onContinue}
        />
      ) : null}
    </div>
  );
};
