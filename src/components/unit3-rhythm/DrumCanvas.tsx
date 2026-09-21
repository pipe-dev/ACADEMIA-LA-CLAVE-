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
      const drumCenterX = width * 0.5;
      const maxRadiusX = Math.min(width * 0.43, 270);
      const drumRadiusX = Math.max(140, maxRadiusX);
      const drumRadiusY = drumRadiusX * 0.51; // Classic 30° acoustic drum perspective tilt
      const drumCenterY = Math.min(height * 0.68, height - drumRadiusY - 85);
      const drumSurfaceY = drumCenterY - drumRadiusY * 0.15; // Sweet bounce zone on the drumhead

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

      // =========================================================================
      // CAJA DEL TAMBOR (3 NIVELES EN PERSPECTIVA) + 6 REMACHES DE AFINACIÓN
      // Posiciones exactas del reloj: 1pm, 3pm, 5pm, 7pm, 9pm, 11pm
      // =========================================================================

      // --- PASO 1: Remaches traseros a las 11 pm y 1 pm (Asomando por detrás del aro) ---
      const rearClaws = [
        { hour: 11, angle: -(2 / 3) * Math.PI }, // 11 pm (-120°)
        { hour: 1,  angle: -(1 / 3) * Math.PI }, // 1 pm (-60°)
      ];

      rearClaws.forEach(({ angle }) => {
        const clawX = drumCenterX + Math.cos(angle) * (drumRadiusX + 5);
        const clawY = drumCenterY + Math.sin(angle) * (drumRadiusY + 3);

        ctx.save();
        // Abrazadera dorada superior abrazando el aro desde atrás
        const hookGrad = ctx.createLinearGradient(0, clawY - 9, 0, clawY + 3);
        hookGrad.addColorStop(0.0, '#fef08a');
        hookGrad.addColorStop(0.5, '#eab308');
        hookGrad.addColorStop(1.0, '#854d0e');
        ctx.fillStyle = hookGrad;
        ctx.beginPath();
        ctx.roundRect(clawX - 8, clawY - 9, 16, 11, [3, 3, 0, 0]);
        ctx.fill();

        // Cabeza cuadrada del tornillo de afinación plateado
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.fillRect(clawX - 3, clawY - 15, 6, 6);
        ctx.strokeRect(clawX - 3, clawY - 15, 6, 6);

        // Arandela metálica plana
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(clawX - 4.5, clawY - 9.5, 9, 2);
        ctx.restore();
      });

      // --- PASO 2: ANILLO 3 - Caja de madera gruesa (Shell / Diafragma ancho frontal) ---
      ctx.save();
      const shellTopY = drumCenterY + 12;
      const shellBottomY = height + 40;

      ctx.beginPath();
      ctx.moveTo(drumCenterX - drumRadiusX - 12, shellTopY);
      ctx.ellipse(
        drumCenterX,
        shellTopY,
        drumRadiusX + 12,
        drumRadiusY + 12,
        0,
        0,
        Math.PI,
        false
      );
      ctx.lineTo(drumCenterX + drumRadiusX + 18, shellBottomY);
      ctx.lineTo(drumCenterX - drumRadiusX - 18, shellBottomY);
      ctx.closePath();

      // Gradiente cilíndrico de madera de arce cálido ("honey maple")
      const shellGrad = ctx.createLinearGradient(
        drumCenterX - drumRadiusX,
        0,
        drumCenterX + drumRadiusX,
        0
      );
      shellGrad.addColorStop(0.0, '#2b0e04'); // borde oscuro sombreado
      shellGrad.addColorStop(0.12, '#66270c');
      shellGrad.addColorStop(0.26, '#b45309'); // ámbar cálido
      shellGrad.addColorStop(0.38, '#d97706'); // arce miel brillante
      shellGrad.addColorStop(0.52, '#f59e0b'); // reflejo dorado de barniz
      shellGrad.addColorStop(0.68, '#b45309');
      shellGrad.addColorStop(0.86, '#66270c');
      shellGrad.addColorStop(1.0, '#220803');
      ctx.fillStyle = shellGrad;
      ctx.fill();

      // Franja de brillo especular vertical (barniz brillante como en la foto)
      const sheenGrad = ctx.createLinearGradient(
        drumCenterX - drumRadiusX * 0.45,
        0,
        drumCenterX - drumRadiusX * 0.12,
        0
      );
      sheenGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.4, 'rgba(255, 245, 225, 0.22)');
      sheenGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.45)');
      sheenGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fill();

      // Vetas verticales sutiles de la madera
      ctx.strokeStyle = 'rgba(60, 24, 8, 0.14)';
      ctx.lineWidth = 1.2;
      for (let gx = -drumRadiusX * 0.88; gx <= drumRadiusX * 0.88; gx += 18) {
        ctx.beginPath();
        ctx.moveTo(drumCenterX + gx, shellTopY);
        ctx.lineTo(drumCenterX + gx * 1.04, shellBottomY);
        ctx.stroke();
      }
      ctx.restore();

      // --- PASO 3: ANILLO 2 - Anillo de metal plateado intermedio (Sub-Hoop frontal) ---
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY + 11,
        drumRadiusX + 8,
        drumRadiusY + 8,
        0,
        0,
        Math.PI
      );
      ctx.lineWidth = 6.5;
      const chromeGrad = ctx.createLinearGradient(
        drumCenterX - drumRadiusX,
        0,
        drumCenterX + drumRadiusX,
        0
      );
      chromeGrad.addColorStop(0.0, '#334155');
      chromeGrad.addColorStop(0.2, '#94a3b8');
      chromeGrad.addColorStop(0.42, '#f8fafc'); // brillo central plateado
      chromeGrad.addColorStop(0.58, '#e2e8f0');
      chromeGrad.addColorStop(0.8, '#64748b');
      chromeGrad.addColorStop(1.0, '#1e293b');
      ctx.strokeStyle = chromeGrad;
      ctx.stroke();

      // Línea de bisel superior brillante del anillo plateado
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY + 8.5,
        drumRadiusX + 8,
        drumRadiusY + 8,
        0,
        0,
        Math.PI
      );
      ctx.stroke();
      ctx.restore();

      // --- PASO 4: ANILLO 1 - Elipse superior de madera (Counterhoop de nogal oscuro) ---
      // Pared frontal descendente del aro de madera
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY + 10,
        drumRadiusX + 12,
        drumRadiusY + 10,
        0,
        0,
        Math.PI,
        false
      );
      ctx.ellipse(
        drumCenterX,
        drumCenterY,
        drumRadiusX + 12,
        drumRadiusY + 10,
        0,
        Math.PI,
        0,
        true
      );
      ctx.closePath();
      const hoopWallGrad = ctx.createLinearGradient(0, drumCenterY, 0, drumCenterY + 14);
      hoopWallGrad.addColorStop(0.0, '#5a2715'); // Nogal noble
      hoopWallGrad.addColorStop(0.5, '#3a170c');
      hoopWallGrad.addColorStop(1.0, '#1c0803');
      ctx.fillStyle = hoopWallGrad;
      ctx.fill();
      ctx.restore();

      // Aro elíptico superior horizontal
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY,
        drumRadiusX + 14,
        drumRadiusY + 11,
        0,
        0,
        Math.PI * 2
      );
      const hoopTopGrad = ctx.createRadialGradient(
        drumCenterX,
        drumCenterY - drumRadiusY * 0.3,
        drumRadiusX * 0.5,
        drumCenterX,
        drumCenterY,
        drumRadiusX + 16
      );
      hoopTopGrad.addColorStop(0.0, '#652d19');
      hoopTopGrad.addColorStop(0.7, '#421a0e');
      hoopTopGrad.addColorStop(0.92, '#2b1007');
      hoopTopGrad.addColorStop(1.0, '#140501');
      ctx.fillStyle = hoopTopGrad;
      ctx.fill();

      // Bisel de luz superior del aro
      ctx.strokeStyle = 'rgba(255, 235, 215, 0.35)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Ranura interior oscura de encaje
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY,
        drumRadiusX + 1,
        drumRadiusY + 1,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();

      // --- PASO 5: Membrana / Parche de Marfil (Parchment Drumhead con rebote elástico) ---
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
        drumCenterX * 0.98,
        drumCenterY + skinDisplacement - drumRadiusY * 0.25,
        drumRadiusX * 0.15,
        drumCenterX,
        drumCenterY + skinDisplacement,
        drumRadiusX
      );
      skinGrad.addColorStop(0.0, '#ffffff'); // Centro limpio y brillante
      skinGrad.addColorStop(0.35, '#fbf8ee');
      skinGrad.addColorStop(0.70, '#f0e6d0');
      skinGrad.addColorStop(0.92, '#dfcfad');
      skinGrad.addColorStop(1.0, '#bfa880'); // Borde sombreado de contacto
      ctx.fillStyle = skinGrad;
      ctx.fill();

      // Sombra interior profunda proyectada por el aro de madera
      ctx.strokeStyle = 'rgba(45, 18, 7, 0.55)';
      ctx.lineWidth = 4.0;
      ctx.stroke();

      // Bisel fino de luz en el borde del parche
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        drumCenterX,
        drumCenterY + skinDisplacement + 1.5,
        drumRadiusX - 1.5,
        drumRadiusY - 1.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // --- DIANA GRABADA EN EL PARCHE (Engraved Target Crosshair de la foto de referencia) ---
      const targetX = drumCenterX + drumRadiusX * 0.10;
      const targetY = drumCenterY + skinDisplacement - drumRadiusY * 0.05;
      const targetRx = drumRadiusX * 0.36;
      const targetRy = drumRadiusY * 0.36;

      ctx.save();
      ctx.strokeStyle = '#ab906e';
      ctx.lineWidth = 2.2;
      ctx.fillStyle = '#ab906e';

      // 1. Círculo exterior de la diana
      ctx.beginPath();
      ctx.ellipse(targetX, targetY, targetRx, targetRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Punto circular central
      ctx.beginPath();
      ctx.ellipse(targetX, targetY, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Las 4 líneas de cruz (tick marks) que cruzan el anillo exterior
      ctx.beginPath();
      // Tick superior (12 horas)
      ctx.moveTo(targetX, targetY - targetRy - 7);
      ctx.lineTo(targetX, targetY - targetRy + 7);
      // Tick inferior (6 horas)
      ctx.moveTo(targetX, targetY + targetRy - 7);
      ctx.lineTo(targetX, targetY + targetRy + 7);
      // Tick izquierdo (9 horas)
      ctx.moveTo(targetX - targetRx - 8, targetY);
      ctx.lineTo(targetX - targetRx + 8, targetY);
      // Tick derecho (3 horas)
      ctx.moveTo(targetX + targetRx - 8, targetY);
      ctx.lineTo(targetX + targetRx + 8, targetY);
      ctx.stroke();
      ctx.restore();

      // --- HOYUELOS DE IMPACTO ESTÁTICOS (Textura táctil suave del parche en la foto) ---
      const ambientDimples = [
        { x: drumCenterX - drumRadiusX * 0.42, y: drumCenterY + skinDisplacement - drumRadiusY * 0.28, rx: 16, ry: 9 },
        { x: drumCenterX - drumRadiusX * 0.55, y: drumCenterY + skinDisplacement + drumRadiusY * 0.22, rx: 18, ry: 10 },
      ];

      ambientDimples.forEach((d) => {
        ctx.save();
        const aGrad = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, d.rx);
        aGrad.addColorStop(0.0, 'rgba(175, 145, 115, 0.45)');
        aGrad.addColorStop(0.6, 'rgba(200, 175, 145, 0.2)');
        aGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = aGrad;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Reflejo blanco en el borde superior del hoyuelo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y - 1, d.rx * 0.85, d.ry * 0.85, 0, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();
        ctx.restore();
      });

      // --- HOYUELOS DE IMPACTO DINÁMICOS (Geiser de luz y partículas al golpear esferas) ---
      const currentDimples: DrumDimple[] = [];
      dimplesRef.current.forEach((dimple) => {
        const age = now - dimple.birthTime;
        const maxAge = 1200; // 1.2s de vida
        if (age < maxAge) {
          const lifeRatio = 1 - age / maxAge;
          dimple.alpha = lifeRatio;
          dimple.radius = Math.min(dimple.maxRadius, dimple.radius + 0.35 * speedFactor);
          currentDimples.push(dimple);

          ctx.save();
          const craterY = dimple.y + skinDisplacement * 0.5;

          // 1. Depresión cónica del cráter en perspectiva
          const dimpleGrad = ctx.createRadialGradient(
            dimple.x,
            craterY,
            2,
            dimple.x,
            craterY,
            dimple.radius
          );
          dimpleGrad.addColorStop(0.0, `rgba(168, 141, 108, ${0.60 * dimple.alpha})`);
          dimpleGrad.addColorStop(0.55, `rgba(195, 170, 138, ${0.35 * dimple.alpha})`);
          dimpleGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

          ctx.beginPath();
          ctx.ellipse(
            dimple.x,
            craterY,
            dimple.radius,
            dimple.radius * (drumRadiusY / drumRadiusX),
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = dimpleGrad;
          ctx.fill();

          // 2. Borde especular brillante en la cresta del hoyuelo
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * dimple.alpha})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(
            dimple.x,
            craterY - 1,
            dimple.radius * 0.9,
            dimple.radius * 0.9 * (drumRadiusY / drumRadiusX),
            0,
            Math.PI * 0.9,
            Math.PI * 2.1
          );
          ctx.stroke();

          // 3. Haz de luz cónico vertical ascendente
          const beamGrad = ctx.createLinearGradient(0, craterY, 0, craterY - 65);
          beamGrad.addColorStop(0.0, `rgba(56, 189, 248, ${0.28 * dimple.alpha})`);
          beamGrad.addColorStop(0.6, `rgba(251, 191, 36, ${0.14 * dimple.alpha})`);
          beamGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(dimple.x - 6, craterY);
          ctx.lineTo(dimple.x + 6, craterY);
          ctx.lineTo(dimple.x + 16, craterY - 65);
          ctx.lineTo(dimple.x - 16, craterY - 65);
          ctx.closePath();
          ctx.fill();

          // 4. Partículas de colores que brotan hacia arriba (cyan, yellow, purple, green, orange)
          dimple.particles.forEach((p) => {
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;
            p.vy -= 0.04 * speedFactor; // leve aceleración hacia arriba
            p.alpha = Math.max(0, p.alpha - 0.018 * speedFactor);

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

      ctx.restore();

      // --- PASO 6: Los 4 Remaches Frontales y Laterales (3pm, 5pm, 7pm, 9pm) ---
      // Con abrazadera superior dorada, tornillo plateado con cabeza cuadrada, cuerpo estriado y bellota inferior en el shell
      const frontClaws = [
        { hour: 9, angle: Math.PI,             side: 'left' },  // 9 pm (180° - lateral izquierdo)
        { hour: 7, angle: (2 / 3) * Math.PI,   side: 'front' }, // 7 pm (120° - frente izquierdo)
        { hour: 5, angle: (1 / 3) * Math.PI,   side: 'front' }, // 5 pm (60° - frente derecho)
        { hour: 3, angle: 0,                   side: 'right' }, // 3 pm (0° - lateral derecho)
      ];

      frontClaws.forEach(({ hour, angle, side }) => {
        let clawX = drumCenterX + Math.cos(angle) * (drumRadiusX + 4);
        let clawY = drumCenterY + Math.sin(angle) * (drumRadiusY + 3);

        ctx.save();

        if (side === 'front') {
          // ==========================================
          // REMACHES FRONTALES (7 pm y 5 pm)
          // ==========================================
          const lugY = clawY + 36; // Posición de la parte inferior en la caja gruesa

          // A. Sombra arrojada de todo el remache
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 9;
          ctx.shadowOffsetY = 4;

          // B. PARTE INFERIOR DEL REMACHE: Pieza de metal dorado fijada a la caja más gruesa
          const lugGrad = ctx.createLinearGradient(clawX - 8, 0, clawX + 8, 0);
          lugGrad.addColorStop(0.0, '#854d0e');
          lugGrad.addColorStop(0.25, '#ca8a04');
          lugGrad.addColorStop(0.55, '#fef08a');
          lugGrad.addColorStop(0.85, '#eab308');
          lugGrad.addColorStop(1.0, '#78350f');
          ctx.fillStyle = lugGrad;
          ctx.beginPath();
          ctx.roundRect(clawX - 8, lugY, 16, 18, 4);
          ctx.fill();

          // Orificio cilíndrico donde entra el tornillo plateado
          ctx.fillStyle = 'rgba(30, 15, 5, 0.8)';
          ctx.beginPath();
          ctx.ellipse(clawX, lugY + 2, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // C. CUERPO ESTRIADO DEL TORNILLO PLATEADO (Baja desde la abrazadera hasta la pieza inferior)
          const rodStartY = clawY + 12;
          const rodHeight = Math.max(10, lugY - rodStartY + 2);
          const rodGrad = ctx.createLinearGradient(clawX - 2.5, 0, clawX + 2.5, 0);
          rodGrad.addColorStop(0.0, '#64748b');
          rodGrad.addColorStop(0.35, '#f1f5f9');
          rodGrad.addColorStop(0.75, '#cbd5e1');
          rodGrad.addColorStop(1.0, '#475569');
          ctx.fillStyle = rodGrad;
          ctx.fillRect(clawX - 2.5, rodStartY, 5, rodHeight);

          // Estrías de la rosca del tornillo
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
          ctx.lineWidth = 1.0;
          for (let ry = rodStartY + 2; ry < lugY; ry += 3.5) {
            ctx.beginPath();
            ctx.moveTo(clawX - 2.5, ry);
            ctx.lineTo(clawX + 2.5, ry);
            ctx.stroke();
          }

          // D. ABRAZADERA SUPERIOR DE METAL DORADO (Sujeta la elipse principal de madera)
          const clampGrad = ctx.createLinearGradient(clawX - 10, 0, clawX + 10, 0);
          clampGrad.addColorStop(0.0, '#78350f');
          clampGrad.addColorStop(0.25, '#ca8a04');
          clampGrad.addColorStop(0.52, '#fef08a');
          clampGrad.addColorStop(0.8, '#eab308');
          clampGrad.addColorStop(1.0, '#713f12');
          ctx.fillStyle = clampGrad;
          ctx.beginPath();
          ctx.roundRect(clawX - 10, clawY - 2, 20, 17, [2, 2, 4, 4]);
          ctx.fill();

          // Labio superior curvado de la abrazadera que dobla sobre la elipse de madera
          const hookGrad = ctx.createLinearGradient(0, clawY - 8, 0, clawY);
          hookGrad.addColorStop(0.0, '#fef08a');
          hookGrad.addColorStop(0.5, '#eab308');
          hookGrad.addColorStop(1.0, '#a16207');
          ctx.fillStyle = hookGrad;
          ctx.beginPath();
          ctx.roundRect(clawX - 9, clawY - 8, 18, 8, [3, 3, 0, 0]);
          ctx.fill();

          // E. TORNILLO DE AFINACIÓN SUPERIOR (Cabeza cuadrada cromada + arandela)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.fillRect(clawX - 3.5, clawY - 14, 7, 7);
          ctx.strokeRect(clawX - 3.5, clawY - 14, 7, 7);

          // Arandela metálica plana debajo de la cabeza del tornillo
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(clawX - 5, clawY - 9, 10, 2);

        } else {
          // ==========================================
          // REMACHES LATERALES (9 pm y 3 pm en perfil)
          // ==========================================
          const isLeft = side === 'left';
          const lugY = clawY + 28;

          // Sombra lateral
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 8;

          // Parte inferior de metal dorado en la caja gruesa
          const lugGrad = ctx.createLinearGradient(clawX - 5, 0, clawX + 5, 0);
          lugGrad.addColorStop(0.0, '#854d0e');
          lugGrad.addColorStop(0.5, '#fef08a');
          lugGrad.addColorStop(1.0, '#78350f');
          ctx.fillStyle = lugGrad;
          ctx.beginPath();
          ctx.roundRect(isLeft ? clawX - 8 : clawX, lugY, 8, 16, 3);
          ctx.fill();

          // Varilla plateada estriada
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(isLeft ? clawX - 5 : clawX + 2, clawY + 8, 3.5, 22);

          // Abrazadera dorada en el lateral del aro
          const clampGrad = ctx.createLinearGradient(0, clawY - 6, 0, clawY + 12);
          clampGrad.addColorStop(0.0, '#fef08a');
          clampGrad.addColorStop(0.5, '#eab308');
          clampGrad.addColorStop(1.0, '#78350f');
          ctx.fillStyle = clampGrad;
          ctx.beginPath();
          ctx.roundRect(isLeft ? clawX - 9 : clawX + 1, clawY - 6, 8, 16, 3);
          ctx.fill();

          // Tornillo plateado superior
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(isLeft ? clawX - 6 : clawX + 3, clawY - 11, 4.5, 5);
        }

        ctx.restore();
      });

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

      // 8. Update & Draw Active Spheres
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
