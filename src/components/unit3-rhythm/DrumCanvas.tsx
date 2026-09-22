// src/components/unit3-rhythm/DrumCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { ActiveSphere, DrumWave, StarSpark, SlicePoint, SeveredPiece, DrumDimple } from './types';
import { RhythmSphere3D } from './RhythmSphere3D';

interface DrumCanvasProps {
  spheres?: ActiveSphere[];
  activeSphere?: ActiveSphere | null;
  completedBeats: number; // 0, 1, 2, 3, 4
  onSliceSphere: (sphere: ActiveSphere, cutCoord: { x: number; y: number }) => void;
  onDrumBounce?: () => void;
  isSlowMo?: boolean;
}

export const DrumCanvas: React.FC<DrumCanvasProps> = ({
  spheres,
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
  const dimplesRef = useRef<DrumDimple[]>([]);
  const drumSkinOffsetRef = useRef<number>(0);
  const drumSkinVelocityRef = useRef<number>(0);

  // Multi-sphere synchronization
  const spheresRef = useRef<ActiveSphere[]>([]);
  const sphereDomRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Decoupled severed pieces pool (never vanishes when a new sphere appears!)
  const severedPiecesRef = useRef<SeveredPiece[]>([]);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lastBounceCountsRef = useRef<Map<number, number>>(new Map());
  const drumImgRef = useRef<HTMLImageElement | null>(null);

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

    // Spawn dual ripple wavefronts (lead shockwave + trailing harmonic echo)
    const now = performance.now();
    wavesRef.current.push(
      {
        id: now + Math.random(),
        x: impactX,
        y: impactY,
        radius: 8,
        maxRadius: 260,
        alpha: 1.0,
      },
      {
        id: now + Math.random() + 1,
        x: impactX,
        y: impactY,
        radius: 2,
        maxRadius: 210,
        alpha: 0.72,
      }
    );

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
      id: now + Math.random() + 2,
      x: impactX,
      y: impactY,
      radius: 14,
      maxRadius: 36,
      depth: 22,
      alpha: 1.0,
      birthTime: now,
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

    // Direct touch / click slice support (natural 45-degree slash)
    const cutAngle = -Math.PI / 4;
    spheresRef.current.forEach((sphere) => {
      if (!sphere.isCut && Math.hypot(sphere.x - x, sphere.y - y) <= 56) {
        sliceActiveSphere(sphere, x, y, cutAngle);
      }
    });
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

      // 1. Drum Geometry Calculations (In full glorious perspective view matching reference)
      const drumW = width * 1.15;
      const drumH = drumW * (681 / 1024);
      const drumX = (width - drumW) * 0.5;
      const drumY = height - drumH + 14;
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

      // 3. Render 3D Concert Drum (Directly from the user's high-definition reference image!)
      if (drumImgRef.current && drumImgRef.current.complete) {
        ctx.save();
        const renderY = drumY + skinDisplacement * 0.25;

        // Soft ground occlusion shadow beneath the drum
        ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 16;

        ctx.drawImage(drumImgRef.current, drumX, renderY, drumW, drumH);
        ctx.restore();
      }

      // 4. Draw Realistic Membrane Deformation at Impact Points (Physical 3D crater indentation)
      const currentDimples: DrumDimple[] = [];
      const membraneAspect = drumRadiusY / drumRadiusX;

      dimplesRef.current.forEach((dimple) => {
        const age = now - dimple.birthTime;
        const maxAge = 550; // 550ms: fast realistic drumhead elastic response
        if (age < maxAge) {
          const progress = age / maxAge;
          // Damped spring physics: instant deep punch, rapid rebound, subtle second micro-vibration
          const springDepth = Math.sin(progress * Math.PI * 1.5) * Math.exp(-progress * 4.2);
          const currentDepth = Math.max(0, springDepth);
          dimple.alpha = Math.max(0, 1 - progress);

          // Crater spreads from impact point up to sphere footprint
          const craterRx = 14 + (dimple.maxRadius - 14) * Math.min(1, progress * 3.0);
          const craterRy = craterRx * membraneAspect;
          currentDimples.push(dimple);

          ctx.save();
          // Clip to drumhead parchment ellipse so deformation stays strictly on the membrane
          ctx.beginPath();
          ctx.ellipse(
            drumCenterX,
            drumCenterY + skinDisplacement * 0.5,
            drumRadiusX * 0.94,
            drumRadiusY * 0.94,
            0,
            0,
            Math.PI * 2
          );
          ctx.clip();

          const craterY = dimple.y + skinDisplacement * 0.5;

          if (currentDepth > 0.02) {
            // A. Deep Interior Bowl Shadow (bottom/lower side of crater curved away from overhead light)
            const shadowGrad = ctx.createRadialGradient(
              dimple.x,
              craterY + craterRy * 0.25,
              1,
              dimple.x,
              craterY,
              craterRx
            );
            shadowGrad.addColorStop(0.0, `rgba(45, 24, 10, ${0.75 * currentDepth})`);
            shadowGrad.addColorStop(0.4, `rgba(75, 42, 18, ${0.48 * currentDepth})`);
            shadowGrad.addColorStop(0.75, `rgba(110, 70, 35, ${0.20 * currentDepth})`);
            shadowGrad.addColorStop(1.0, 'rgba(110, 70, 35, 0)');

            ctx.beginPath();
            ctx.ellipse(dimple.x, craterY + craterRy * 0.1, craterRx, craterRy, 0, 0, Math.PI * 2);
            ctx.fillStyle = shadowGrad;
            ctx.fill();

            // B. Upper Wall Specular Highlight (sloped inner wall facing overhead illumination)
            const sheenGrad = ctx.createRadialGradient(
              dimple.x,
              craterY - craterRy * 0.35,
              1,
              dimple.x,
              craterY - craterRy * 0.1,
              craterRx * 0.85
            );
            sheenGrad.addColorStop(0.0, `rgba(255, 253, 245, ${0.60 * currentDepth})`);
            sheenGrad.addColorStop(0.5, `rgba(255, 250, 235, ${0.25 * currentDepth})`);
            sheenGrad.addColorStop(1.0, 'rgba(255, 250, 235, 0)');

            ctx.beginPath();
            ctx.ellipse(dimple.x, craterY - craterRy * 0.2, craterRx * 0.85, craterRy * 0.55, 0, 0, Math.PI * 2);
            ctx.fillStyle = sheenGrad;
            ctx.fill();

            // C. Outer Tension Ridge (stretched skin lip catching grazing ambient light)
            ctx.beginPath();
            ctx.ellipse(
              dimple.x,
              craterY,
              craterRx * 0.98,
              craterRy * 0.98,
              0,
              Math.PI * 0.9,
              Math.PI * 2.1
            );
            ctx.strokeStyle = `rgba(255, 255, 250, ${0.45 * currentDepth})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }

          // D. Colorful rising particles (subtle celebratory energy)
          dimple.particles.forEach((p) => {
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;
            p.vy -= 0.04 * speedFactor;
            p.alpha = Math.max(0, p.alpha - 0.022 * speedFactor);

            if (p.alpha > 0.05) {
              ctx.save();
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.alpha * dimple.alpha;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 6;
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

      // 5. Draw Physical Membrane Ripple Waves (dual-tone: shadow trough + crest highlight)
      const aliveWaves: DrumWave[] = [];
      wavesRef.current.forEach((wave) => {
        wave.radius += 4.2 * speedFactor;
        wave.alpha -= 0.022 * speedFactor;

        if (wave.alpha > 0.04 && wave.radius < wave.maxRadius) {
          aliveWaves.push(wave);
          const waveY = wave.y + skinDisplacement * 0.5;
          const waveRx = wave.radius;
          const waveRy = wave.radius * membraneAspect;

          ctx.save();
          // Clip to drum membrane so ripples stay strictly on parchment
          ctx.beginPath();
          ctx.ellipse(
            drumCenterX,
            drumCenterY + skinDisplacement * 0.5,
            drumRadiusX * 0.94,
            drumRadiusY * 0.94,
            0,
            0,
            Math.PI * 2
          );
          ctx.clip();

          // A. Wave Trough (depressed ring: warm umber shadow on drum skin)
          ctx.beginPath();
          ctx.ellipse(wave.x, waveY, waveRx, waveRy, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(65, 38, 16, ${wave.alpha * 0.42})`;
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // B. Wave Crest (elevated ripple peak: bright parchment highlight catching overhead light)
          if (waveRx > 4) {
            ctx.beginPath();
            ctx.ellipse(
              wave.x,
              waveY - 1.2,
              Math.max(1, waveRx - 2.0),
              Math.max(0.6, (waveRx - 2.0) * membraneAspect),
              0,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(255, 253, 242, ${wave.alpha * 0.60})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }

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
          // Check bounce on drum membrane
          const lastBounce = lastBounceCountsRef.current.get(sphere.id) ?? -1;
          if (sphere.bounceCount !== lastBounce) {
            lastBounceCountsRef.current.set(sphere.id, sphere.bounceCount);
            triggerDrumImpact(sphere.x, drumSurfaceY);
          }

          const altitude = Math.max(0, drumSurfaceY - sphere.y);

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

          if (domEl) {
            domEl.style.display = 'block';
            domEl.style.transform = `translate3d(${sphere.x - 40}px, ${sphere.y - 40}px, 0) scale(${scaleX}, ${scaleY})`;
            domEl.style.transformOrigin = '50% 100%';
          }

          // Drop Shadow onto the drum surface
          const shadowScale = Math.max(0.35, (1 - altitude / (height * 0.6)) * scaleX);
          const shadowAlpha = Math.max(0.06, 0.32 * shadowScale);

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
          <RhythmSphere3D
            type={
              (spheres && spheres[sIdx]?.type) ||
              (activeSphere && activeSphere.type) ||
              'purple'
            }
          />
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
          <RhythmSphere3D type={pIdx >= 6 ? 'golden' : 'purple'} />
        </div>
      ))}
    </div>
  );
};
