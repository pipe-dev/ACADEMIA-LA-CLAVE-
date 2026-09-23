// src/components/unit3-rhythm/DrumCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ActiveSphere, DrumWave, StarSpark, SlicePoint, SeveredPiece, DrumDimple, TrophyCut } from './types';
import { RhythmSphere3D } from './RhythmSphere3D';
import { GoldenTrophyBurst } from './GoldenTrophyBurst';
import { playBladeSwoosh } from './rhythmAudio';

interface DrumCanvasProps {
  spheres?: ActiveSphere[];
  activeSphere?: ActiveSphere | null;
  completedBeats: number; // 0, 1, 2, 3, 4
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

  // Multi-sphere synchronization
  const spheresRef = useRef<ActiveSphere[]>([]);
  const sphereDomRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Rolling rotation is applied on an inner wrapper so it pivots around the center
  const spinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sphereSpinRef = useRef<Map<number, number>>(new Map());

  // Decoupled severed pieces pool (never vanishes when a new sphere appears!)
  const severedPiecesRef = useRef<SeveredPiece[]>([]);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fruit-ninja cuts on the revealed trophy
  const [trophyCuts, setTrophyCuts] = useState<TrophyCut[]>([]);
  const trophyCutsRef = useRef<TrophyCut[]>([]);
  const trophyRevealTimeRef = useRef<number>(0);
  const lastTrophyCutTimeRef = useRef<number>(0);

  const lastBounceCountsRef = useRef<Map<number, number>>(new Map());
  const drumImgRef = useRef<HTMLImageElement | null>(null);

  // Pre-rendered static ambient halo layer, rebuilt only on resize
  const bgSceneRef = useRef<HTMLCanvasElement | null>(null);
  const sceneKeyRef = useRef<string>('');

  // Tactile 3D drum parallax: follows active touch and drag with elastic spring recovery
  const dragPointerRef = useRef<{ x: number; y: number } | null>(null);
  const prevRenderTime = useRef<number>(performance.now());
  const parallaxXRef = useRef(0);
  const parallaxYRef = useRef(0);
  const tiltRef = useRef(0);

  // Parallax tuning constants: subtle tactile response, solid feel, zero edge exposure
  const PARALLAX_X_AMP = 0.020; // fraction of drumW
  const PARALLAX_Y_AMP = 0.012; // fraction of drumH
  const TILT_MAX_RAD = 0.035; // ~2.0 degrees
  const PARALLAX_EASE = 0.14;

  // Reset cut state whenever the trophy reveal toggles (and record when it appears)
  useEffect(() => {
    if (trophyReveal) {
      trophyCutsRef.current = [];
      setTrophyCuts([]);
      trophyRevealTimeRef.current = performance.now();
    } else {
      trophyCutsRef.current = [];
      setTrophyCuts([]);
    }
  }, [trophyReveal]);

  // Preload high-definition 3D drum asset
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

  // Sync active spheres ref
  useEffect(() => {
    if (spheres && spheres.length > 0) {
      spheresRef.current = spheres;
    } else if (activeSphere) {
      spheresRef.current = [activeSphere];
    } else {
      spheresRef.current = [];
    }
  }, [spheres, activeSphere]);

  // Trigger drum bounce ripple, elastic dip, and tactile dimple with particle cone
  const triggerDrumImpact = useCallback((impactX: number, impactY: number) => {
    drumSkinOffsetRef.current = 14; // Dip down 14px
    drumSkinVelocityRef.current = -3;

    wavesRef.current.push({
      id: Date.now() + Math.random(),
      x: impactX,
      y: impactY,
      radius: 12,
      maxRadius: 220,
      alpha: 0.95,
    });

    // Create colorful rising particles for the impact dimple geyser (cyan, yellow, purple, orange, green)
    const colors = ['#38bdf8', '#fbbf24', '#c084fc', '#4ade80', '#fb923c', '#ffffff'];
    const particles = Array.from({ length: 14 }).map(() => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      const speed = 1.4 + Math.random() * 3.6;
      return {
        x: impactX + (Math.random() - 0.5) * 14,
        y: impactY + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.2 + Math.random() * 2.8,
        alpha: 1.0,
      };
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
      particles,
    });

    if (onDrumBounce) {
      onDrumBounce();
    }
  }, [onDrumBounce]);

  // Add sparks burst upon slicing
  const addSparks = (x: number, y: number, color: string, count = 30) => {
    const newSparks: StarSpark[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 8.0;
      newSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.0,
        alpha: 1.0,
        color: Math.random() > 0.3 ? color : '#ffffff',
        size: 1.5 + Math.random() * 3.5,
      });
    }
    sparksRef.current.push(...newSparks);
  };

  // Slice sphere along the EXACT swipe angle into two decoupled tumbling pieces
  const sliceActiveSphere = useCallback(
    (sphere: ActiveSphere, cutX: number, cutY: number, cutAngle: number) => {
      if (sphere.isCut) return;
      sphere.isCut = true;

      // Normal vector perpendicular to the cut direction
      const normalAngle = cutAngle + Math.PI / 2;
      const isGolden = sphere.type === 'golden';

      // Piece 1: Slow parabolic arc towards left drum edge
      const p1: SeveredPiece = {
        id: Date.now() + Math.random(),
        type: sphere.type,
        x: sphere.x,
        y: sphere.y,
        vx: -2.6 - Math.random() * 1.2, // slow parabolic drift left
        vy: -2.8 - Math.random() * 1.2, // gentle upward pop
        cutAngle,
        pieceSide: 'top',
        rotation: 0,
        vRot: -0.04 - Math.random() * 0.02, // slow realistic spin
        alpha: 1.0,
        bouncesLeft: 2,
      };

      // Piece 2: Slow parabolic arc towards right drum edge
      const p2: SeveredPiece = {
        id: Date.now() + Math.random() + 1,
        type: sphere.type,
        x: sphere.x,
        y: sphere.y,
        vx: 2.6 + Math.random() * 1.2, // slow parabolic drift right
        vy: -2.8 - Math.random() * 1.2, // gentle upward pop
        cutAngle,
        pieceSide: 'bottom',
        rotation: 0,
        vRot: 0.04 + Math.random() * 0.02, // slow realistic spin
        alpha: 1.0,
        bouncesLeft: 2,
      };

      if (isGolden) {
        severedPiecesRef.current[6] = p1;
        severedPiecesRef.current[7] = p2;
      } else {
        // Find two available / faded slots among 0..5
        let s1 = severedPiecesRef.current.findIndex((p, i) => i < 6 && (!p || p.alpha <= 0.05));
        if (s1 === -1) s1 = 0;
        severedPiecesRef.current[s1] = p1;

        let s2 = severedPiecesRef.current.findIndex((p, i) => i < 6 && i !== s1 && (!p || p.alpha <= 0.05));
        if (s2 === -1) s2 = (s1 + 1) % 6;
        severedPiecesRef.current[s2] = p2;
      }

      const sparkColor = isGolden ? '#fbbf24' : '#c084fc';
      addSparks(cutX, cutY, sparkColor, isGolden ? 48 : 32);

      onSliceSphere(sphere, { x: cutX, y: cutY });
    },
    [onSliceSphere]
  );

  // Slice the revealed trophy along the swipe line (fruit-ninja): fragments separate slightly
  const sliceTrophy = useCallback((nearestX: number, nearestY: number, cutAngle: number) => {
    if (!trophyReveal) return;

    // Throttle cut registrations to avoid multiple cuts during a single fast swipe
    const now = performance.now();
    if (now - lastTrophyCutTimeRef.current < 90) return;
    lastTrophyCutTimeRef.current = now;

    // Avoid duplicate registrations from consecutive swipe segments
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

  // Check swipe intersection across ALL active spheres
  const checkSwipeCollision = useCallback(
    (ptA: SlicePoint, ptB: SlicePoint) => {
      const spheres = spheresRef.current;
      if (!spheres || spheres.length === 0) return;

      const dx = ptB.x - ptA.x;
      const dy = ptB.y - ptA.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) return;

      // Exact angle of the slice path
      const cutAngle = Math.atan2(dy, dx);

      spheres.forEach((sphere) => {
        if (sphere.isCut) return;

        // Distance from sphere center to line segment ptA -> ptB
        const u = Math.max(
          0,
          Math.min(1, ((sphere.x - ptA.x) * dx + (sphere.y - ptA.y) * dy) / (dist * dist))
        );
        const nearestX = ptA.x + u * dx;
        const nearestY = ptA.y + u * dy;
        const distanceToCenter = Math.hypot(sphere.x - nearestX, sphere.y - nearestY);

        if (distanceToCenter <= 56) {
          sliceActiveSphere(sphere, nearestX, nearestY, cutAngle);
        }
      });

      // Also allow fruit-ninja cuts on the settled trophy
      if (trophyReveal && performance.now() - trophyRevealTimeRef.current > 1100) {
        const uT = Math.max(
          0,
          Math.min(1, ((trophyReveal.x - ptA.x) * dx + (trophyReveal.y - ptA.y) * dy) / (dist * dist))
        );
        const nearestX = ptA.x + uT * dx;
        const nearestY = ptA.y + uT * dy;
        if (Math.hypot(trophyReveal.x - nearestX, trophyReveal.y - nearestY) <= 60) {
          sliceTrophy(nearestX, nearestY, cutAngle);
        }
      }
    },
    [sliceActiveSphere, sliceTrophy, trophyReveal]
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
    dragPointerRef.current = { x, y };

    // Direct touch / click slice support (natural 45-degree slash)
    const cutAngle = -Math.PI / 4;
    spheresRef.current.forEach((sphere) => {
      if (!sphere.isCut && Math.hypot(sphere.x - x, sphere.y - y) <= 56) {
        sliceActiveSphere(sphere, x, y, cutAngle);
      }
    });

    // Direct touch / click slice on the settled trophy
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
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    // Tactile 3D parallax: strictly active during active touch / drag interaction, never on hover
    if (!isPointerDownRef.current) return;

    dragPointerRef.current = { x, y };

    const trail = pointerTrailRef.current;
    const lastPoint = trail[trail.length - 1];

    trail.push({ x, y, time: now });

    if (lastPoint) {
      checkSwipeCollision(lastPoint, { x, y, time: now });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    dragPointerRef.current = null;
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

    // Dev-only FPS meter (?perf=1) to validate cinematic performance
    const showPerf =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('perf') === '1';
    let perfFrames = 0;
    let perfLast = performance.now();
    let perfEl: HTMLDivElement | null = null;
    if (showPerf) {
      perfEl = document.createElement('div');
      perfEl.style.cssText =
        'position:absolute;top:6px;right:6px;z-index:60;font:10px/1.4 monospace;background:rgba(0,0,0,0.55);color:#7dd3fc;padding:4px 6px;border-radius:6px;pointer-events:none;';
      if (canvas.parentElement) canvas.parentElement.appendChild(perfEl);
    }

    const render = () => {
      // Skip heavy rendering while the tab is hidden (RAF stays alive, just idles)
      if (typeof document !== 'undefined' && document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (showPerf && perfEl) {
        perfFrames++;
        const t = performance.now();
        if (t - perfLast >= 500) {
          perfEl.textContent = `fps ${Math.round((perfFrames * 1000) / (t - perfLast))}`;
          perfFrames = 0;
          perfLast = t;
        }
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

      // 1. Drum Geometry Calculations (Full unclipped perspective view)
      const drumW = width * 1.22;
      const drumH = drumW * (681 / 1024);
      const drumX = (width - drumW) * 0.5;
      const drumY = height - drumH + 42;
      const drumCenterX = width * 0.5;
      const drumCenterY = drumY + drumH * 0.44;
      const drumRadiusX = drumW * 0.417;
      const drumRadiusY = drumH * 0.284;
      const drumSurfaceY = drumCenterY - drumRadiusY * 0.12; // Sweet bounce zone on drumhead

      // Elastic drum skin harmonic oscillation: F = -k*x - c*v
      const k = 0.18; // spring stiffness
      const c = 0.88; // damping
      const force = -k * drumSkinOffsetRef.current;
      drumSkinVelocityRef.current = (drumSkinVelocityRef.current + force) * c;
      drumSkinOffsetRef.current += drumSkinVelocityRef.current;

      const skinDisplacement = drumSkinOffsetRef.current;

      // Tactile 3D parallax: strictly on active touch/drag (retreats to 0 on release)
      let parallaxX = 0;
      let parallaxY = 0;
      let tilt = 0;
      const drag = dragPointerRef.current;
      if (drag && isPointerDownRef.current) {
        const normX = Math.max(-1, Math.min(1, (drag.x - drumCenterX) / (drumRadiusX || 1)));
        const normY = Math.max(-1, Math.min(1, (drag.y - drumCenterY) / (drumRadiusY || 1)));
        // Clamped tightly so drum never reveals screen boundaries or white margins
        parallaxX = Math.max(-14, Math.min(14, -normX * drumW * PARALLAX_X_AMP));
        parallaxY = Math.max(-6, Math.min(10, -normY * drumH * PARALLAX_Y_AMP));
        tilt = -normX * TILT_MAX_RAD;
      }
      parallaxXRef.current += (parallaxX - parallaxXRef.current) * PARALLAX_EASE;
      parallaxYRef.current += (parallaxY - parallaxYRef.current) * PARALLAX_EASE;
      tiltRef.current += (tilt - tiltRef.current) * PARALLAX_EASE;
      const easedParallaxX = parallaxXRef.current;
      const easedParallaxY = parallaxYRef.current;
      const easedTilt = tiltRef.current;

      // 2. Pre-rendered static ambient halo layer (rebuilt only on resize/DPR change)
      const sceneKey = `${width}x${height}@${dpr}`;
      if (sceneKeyRef.current !== sceneKey) {
        sceneKeyRef.current = sceneKey;

        bgSceneRef.current = document.createElement('canvas');
        bgSceneRef.current.width = Math.floor(width * dpr);
        bgSceneRef.current.height = Math.floor(height * dpr);
        const bctx = bgSceneRef.current.getContext('2d');
        if (bctx) {
          bctx.scale(dpr, dpr);
          const ambientGlow = bctx.createRadialGradient(
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
          bctx.fillStyle = ambientGlow;
          bctx.fillRect(0, 0, width, height);
        }
      }

      // Ambient halo: cheap fullscreen blit of the pre-rendered gradient
      if (bgSceneRef.current) {
        ctx.drawImage(bgSceneRef.current, 0, 0, width, height);
      }

      // 3. Render 3D Concert Drum directly with parallax & tilt (zero edge cropping, no white spaces!)
      if (drumImgRef.current && drumImgRef.current.complete) {
        ctx.save();
        ctx.translate(drumCenterX + easedParallaxX, drumCenterY + easedParallaxY);
        ctx.rotate(easedTilt);

        // Ground shadow beneath the drum base
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          0,
          drumRadiusY * 0.54,
          drumRadiusX * 0.98,
          drumRadiusY * 0.68,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
        ctx.fill();
        ctx.restore();

        // High-definition 3D drum drawing with full margins — no canvas clipping!
        const localX = -drumW * 0.5;
        const localY = (drumY - drumCenterY) + skinDisplacement * 0.25;
        ctx.drawImage(drumImgRef.current, localX, localY, drumW, drumH);
        ctx.restore();

        // Moving specular highlight that follows the drag (light appears glued to the finger side)
        if (Math.abs(easedParallaxX) > 0.2 || Math.abs(easedParallaxY) > 0.2) {
          ctx.save();
          const specX = drumCenterX + easedParallaxX * 2.2;
          const specY = drumCenterY + easedParallaxY * 2.4;
          const specGlow = ctx.createRadialGradient(
            specX,
            specY,
            4,
            specX,
            specY,
            drumRadiusX * 0.85
          );
          specGlow.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
          specGlow.addColorStop(0.4, 'rgba(147, 197, 253, 0.05)');
          specGlow.addColorStop(1, 'rgba(147, 197, 253, 0)');
          ctx.fillStyle = specGlow;
          ctx.beginPath();
          ctx.ellipse(
            drumCenterX + easedParallaxX,
            drumCenterY + easedParallaxY,
            drumRadiusX,
            drumRadiusY,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Draw Dynamic Impact Dimples (Hyperrealistic 3D physical membrane crater & celebration particles)
      const currentDimples: DrumDimple[] = [];
      const aspectY = drumRadiusY / drumRadiusX;

      dimplesRef.current.forEach((dimple) => {
        const age = now - dimple.birthTime;
        const maxAge = 480; // Snappy physical elastic recoil (~480ms)
        if (age < maxAge) {
          const progress = age / maxAge;
          // Elastic recovery curve: fast initial indentation, then damped spring rebound
          const depthFactor = Math.max(0, (1 - progress) * Math.cos(progress * Math.PI * 0.7));
          dimple.alpha = depthFactor;
          const currentRadius = 12 + (dimple.maxRadius - 12) * Math.sin(progress * Math.PI * 0.5);
          currentDimples.push(dimple);

          ctx.save();
          const craterY = dimple.y + skinDisplacement * 0.5;
          // Follow the drum's tactile 3D parallax so the crater stays glued to the skin
          const craterX = dimple['x'] + easedParallaxX;

          if (depthFactor > 0.02) {
            // A. Asymmetric Inner Cavity Shadow (Upper slope tilted away from overhead ambient light)
            const shadowOffsetY = -currentRadius * aspectY * 0.35;
            const innerShadowGrad = ctx.createRadialGradient(
              craterX,
              craterY + shadowOffsetY,
              1,
              craterX,
              craterY,
              currentRadius
            );
            innerShadowGrad.addColorStop(0.0, `rgba(28, 14, 6, ${0.82 * depthFactor})`);
            innerShadowGrad.addColorStop(0.42, `rgba(58, 32, 14, ${0.52 * depthFactor})`);
            innerShadowGrad.addColorStop(0.80, `rgba(100, 68, 38, ${0.20 * depthFactor})`);
            innerShadowGrad.addColorStop(1.0, 'rgba(100, 68, 38, 0)');

            ctx.beginPath();
            ctx.ellipse(
              craterX,
              craterY,
              currentRadius,
              currentRadius * aspectY,
              0,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = innerShadowGrad;
            ctx.fill();

            // B. Focal Impact Pinpoint (Maximum depth occlusion at center of sphere contact)
            const focalRadius = currentRadius * 0.38;
            const focalGrad = ctx.createRadialGradient(
              craterX,
              craterY,
              0,
              craterX,
              craterY,
              focalRadius
            );
            focalGrad.addColorStop(0.0, `rgba(16, 8, 3, ${0.90 * depthFactor})`);
            focalGrad.addColorStop(0.65, `rgba(32, 16, 7, ${0.45 * depthFactor})`);
            focalGrad.addColorStop(1.0, 'rgba(32, 16, 7, 0)');

            ctx.beginPath();
            ctx.ellipse(
              craterX,
              craterY,
              focalRadius,
              focalRadius * aspectY,
              0,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = focalGrad;
            ctx.fill();

            // C. Specular Catch-Light Rim (Lower front slope tilted directly toward ambient light)
            ctx.beginPath();
            ctx.ellipse(
              craterX,
              craterY + 1.2,
              currentRadius * 0.92,
              currentRadius * 0.92 * aspectY,
              0,
              Math.PI * 0.12,
              Math.PI * 0.88
            );
            ctx.strokeStyle = `rgba(255, 252, 240, ${0.60 * depthFactor})`;
            ctx.lineWidth = 1.6 * depthFactor;
            ctx.stroke();

            // D. Outer Perimeter Tension Crease Ring
            ctx.beginPath();
            ctx.ellipse(
              craterX,
              craterY,
              currentRadius * 1.14,
              currentRadius * 1.14 * aspectY,
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(165, 130, 95, ${0.22 * depthFactor})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }

          // E. Colorful rising celebration particles (cyan, yellow, purple, green, orange)
          dimple.particles.forEach((p) => {
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;
            p.vy -= 0.04 * speedFactor;
            p.alpha = Math.max(0, p.alpha - 0.024 * speedFactor);

            if (p.alpha > 0.05) {
              ctx.save();
              ctx.fillStyle = p.color;
              // Soft outer halo + bright core (glow without shadowBlur)
              ctx.globalAlpha = p.alpha * 0.35;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = p.alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          });

          ctx.restore();
        }
      });
      dimplesRef.current = currentDimples;

      // 5. Draw Soft Drum Membrane Ripples / Shockwaves
      const aliveWaves: DrumWave[] = [];
      wavesRef.current.forEach((wave) => {
        wave.radius += 4.5 * speedFactor;
        wave.alpha -= 0.025 * speedFactor;

        if (wave.alpha > 0.05 && wave.radius < wave.maxRadius) {
          aliveWaves.push(wave);
          // Ripples ride the drum surface, so follow the tactile 3D parallax too
          const waveX = wave.x + easedParallaxX;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            waveX,
            wave.y + skinDisplacement * 0.5,
            wave.radius,
            wave.radius * (drumRadiusY / drumRadiusX),
            0,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(251, 191, 36, ${wave.alpha * 0.65})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.restore();
        }
      });
      wavesRef.current = aliveWaves;

      // 6. Draw 4 Minimalist Beat Indicator Dots (Floating above drum)
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
          // Soft glow halo + bright core (same look, no shadowBlur rasterization)
          ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (isCurrent) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Update & Draw Active Spheres
      const spheres = spheresRef.current;

      // Reset all intact sphere DOM slots first
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const domEl = sphereDomRefs.current[sIdx];
        if (domEl) domEl.style.display = 'none';
      }

      spheres.forEach((sphere, sIdx) => {
        if (sIdx >= 3) return;
        const domEl = sphereDomRefs.current[sIdx];

        if (!sphere.isCut) {
          const currentSurfaceY = sphere.surfaceY ?? drumSurfaceY;

          // Check bounce on drum membrane
          const lastBounce = lastBounceCountsRef.current.get(sphere.id) ?? -1;
          if (sphere.bounceCount !== lastBounce) {
            lastBounceCountsRef.current.set(sphere.id, sphere.bounceCount);
            triggerDrumImpact(sphere.x, currentSurfaceY);
          }

          const altitude = Math.max(0, currentSurfaceY - sphere.y);

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

          // 2.5D Perspective depth scaling: noticeably bigger when closer to viewer (+Y), smaller when further (-Y)
          const depthRatio = (currentSurfaceY - drumCenterY) / (drumRadiusY || 1);
          const perspectiveScale = Math.max(0.84, Math.min(1.16, 1.0 + depthRatio * 0.24));

          if (domEl) {
            domEl.style.display = 'block';
            domEl.style.transform = `translate3d(${sphere.x - 40}px, ${sphere.y - 40}px, 0) scale(${scaleX * perspectiveScale}, ${scaleY * perspectiveScale})`;
            domEl.style.transformOrigin = '50% 100%';
          }

          // Rolling 3D rotation: spins as the sphere travels so it looks like a real round object
          let spin = sphereSpinRef.current.get(sphere.id) ?? 0;
          spin += (sphere.vx / (sphere.radius || 40)) * dt * speedFactor;
          sphereSpinRef.current.set(sphere.id, spin);
          const spinEl = spinRefs.current[sIdx];
          if (spinEl) spinEl.style.transform = `rotate(${spin}rad)`;

          // Drop Shadow onto the drum surface at the sphere's specific 2.5D depth
          const shadowScale = Math.max(0.35, (1 - altitude / (height * 0.6)) * scaleX * perspectiveScale);
          const shadowAlpha = Math.max(0.06, 0.32 * shadowScale);

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            sphere.x,
            currentSurfaceY + skinDisplacement * 0.5,
            sphere.radius * shadowScale,
            sphere.radius * shadowScale * 0.35,
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * 1.5})`;
          ctx.fill();
          ctx.restore();
        }
      });

      // Update & Render Severed 3D Pieces (Slow parabolic fall towards drum, 2 bounces on membrane, then exit)
      for (let pIdx = 0; pIdx < 8; pIdx++) {
        const piece = severedPiecesRef.current[pIdx];
        const pieceEl = pieceRefs.current[pIdx];
        if (!pieceEl) continue;

        if (piece && piece.alpha > 0.02 && piece.y < height + 100) {
          // Slow, floaty parabolic gravity
          const pieceGravity = 0.22 * speedFactor;
          piece.vy += pieceGravity;
          piece.x += piece.vx * speedFactor;
          piece.y += piece.vy * speedFactor;
          piece.rotation += piece.vRot * speedFactor;

          // Check contact with the drum membrane
          const contactY = drumSurfaceY - 6;

          if (piece.y >= contactY && piece.vy > 0) {
            if (piece.bouncesLeft === 2) {
              // Bounce 1: Rebounds inside the drum membrane, arcs towards edge
              piece.y = contactY;
              piece.vy = -4.8 * speedFactor;
              piece.vx = (piece.vx > 0 ? 1 : -1) * (Math.abs(piece.vx) * 1.15 + 0.4);
              piece.bouncesLeft = 1;
              triggerDrumImpact(piece.x, drumSurfaceY);
            } else if (piece.bouncesLeft === 1) {
              // Bounce 2: Rebounds near the rim and catapults outward off-screen!
              piece.y = contactY;
              piece.vy = -3.8 * speedFactor;
              piece.vx = (piece.vx > 0 ? 1 : -1) * (Math.abs(piece.vx) + 2.8);
              piece.bouncesLeft = 0;
              triggerDrumImpact(piece.x, drumSurfaceY);
            }
          }

          // Fade out only after completing the 2 bounces on the drum and flying outward
          if (piece.bouncesLeft === 0) {
            if (piece.x < 35 || piece.x > width - 35 || piece.y > drumSurfaceY) {
              piece.alpha = Math.max(0, piece.alpha - 0.02 * speedFactor);
            }
          }

          pieceEl.style.display = 'block';
          pieceEl.style.opacity = `${piece.alpha}`;

          // Exact cut along the slice path (top or bottom half relative to slash angle):
          const clip =
            piece.pieceSide === 'top'
              ? 'polygon(-25% -25%, 125% -25%, 125% 50%, -25% 50%)'
              : 'polygon(-25% 50%, 125% 50%, 125% 125%, -25% 125%)';
          pieceEl.style.clipPath = clip;

          const totalRotation = piece.cutAngle + piece.rotation;
          pieceEl.style.transform = `translate3d(${piece.x - 40}px, ${piece.y - 40}px, 0) rotate(${totalRotation}rad)`;
        } else {
          pieceEl.style.display = 'none';
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
          ctx.fillStyle = spark.color;
          // Soft outer halo + bright core (glow without shadowBlur)
          ctx.globalAlpha = spark.alpha * 0.35;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.size * 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = spark.alpha;
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
        ctx.lineCap = 'round';
        for (let i = 1; i < validTrail.length; i++) {
          const ptA = validTrail[i - 1];
          const ptB = validTrail[i];
          const age = now - ptB.time;
          const factor = Math.max(0, 1 - age / 120);

          // Soft golden outer halo (replaces the shadowBlur glow, cheaper: layered strokes)
          ctx.strokeStyle = `rgba(251, 191, 36, ${factor * 0.28})`;
          ctx.lineWidth = 15.0 * factor;
          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.stroke();

          // Pure white blade edge
          ctx.strokeStyle = `rgba(255, 255, 255, ${factor * 0.95})`;
          ctx.lineWidth = 3.8 * factor;
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
        onPointerLeave={handlePointerUp}
      />

      {/* Intact 3D Spheres (Up to 3 simultaneous bouncing spheres) */}
      {[0, 1, 2].map((sIdx) => (
        <div
          key={`intact-sphere-${sIdx}`}
          ref={(el) => {
            sphereDomRefs.current[sIdx] = el;
          }}
          style={{
            willChange: 'transform',
            display: 'none',
            transformOrigin: '50% 100%',
          }}
          className="absolute top-0 left-0 pointer-events-none z-20"
        >
          {/* Inner spin layer: rolls around its own center so it spins even while squashing at the base */}
          <div
            ref={(el) => {
              spinRefs.current[sIdx] = el;
            }}
            className="w-20 h-20"
            style={{ willChange: 'transform' }}
          >
            <RhythmSphere3D
              type={
                (spheres && spheres[sIdx]?.type) ||
                (activeSphere && activeSphere.type) ||
                'purple'
              }
              seed={
                (spheres && spheres[sIdx]?.seed) ||
                (activeSphere && activeSphere.seed) ||
                sIdx + 1
              }
            />
          </div>
        </div>
      ))}

      {/* Decoupled Severed 3D Pieces (Exploding along slash angle, slots 0..5 purple, 6..7 golden) */}
      {Array.from({ length: 8 }).map((_, pIdx) => (
        <div
          key={`severed-piece-${pIdx}`}
          ref={(el) => {
            pieceRefs.current[pIdx] = el;
          }}
          style={{
            willChange: 'transform, opacity',
            display: 'none',
          }}
          className="absolute top-0 left-0 pointer-events-none z-20"
        >
          <RhythmSphere3D type={pIdx >= 6 ? 'golden' : 'purple'} seed={pIdx + 101} />
        </div>
      ))}

      {/* Golden Trophy emerging from the slice point into the scene */}
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
