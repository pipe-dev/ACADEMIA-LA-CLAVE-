'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface CuteCharacterFucsiaAnimatedRef {
  replay: () => void;
}

interface CuteCharacterFucsiaAnimatedProps {
  autoPlay?: boolean;
  onComplete?: () => void;
}

/**
 * CuteCharacterFucsiaAnimated
 * Coreografia exacta confirmada por el usuario:
 * 1. Entra a 0 grados cayendo desde arriba y se queda colgado del techo.
 * 2. Se mueve de derecha a izquierda colgado del techo ondulando con su cuerpo en ondas senoidales.
 * 3. Gira sobre si mismo 180 grados ondulando mucho para corregir orientacion y quedar recto.
 * 4. Cae derecho hacia el suelo (caida vertical recta con aceleracion).
 * 5. Se asienta y se bambolea como un tentetieso de un lado a otro con base fija en el piso
 *    hasta frenar por fisica y quedarse recto.
 * Estilo visual 1:1 con personaje_fucsia.html (ojos 20px, pupilas 8px, gradientes a 92deg).
 */
export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>(({ autoPlay = true, onComplete }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCompletedRef = useRef<boolean>(false);

  // Dimensiones del canvas con suficiente holgura superior para que el personaje
  // no se corte jamas al entrar o estar colgado del techo
  const CANVAS_WIDTH = 520;
  const CANVAS_HEIGHT = 800;
  const CENTER_X = CANVAS_WIDTH / 2; // 260
  const GROUND_Y = 770; // 30px desde la base del canvas, coincide 1:1 con el stage estatico
  const BASE_WIDTH = 190;
  const BASE_HEIGHT = 420;
  const CEILING_Y = 490; // Posicion Y de la base cuando esta colgado del techo (cabeza en Y=70)

  useImperativeHandle(ref, () => ({
    replay: () => {
      startTimeRef.current = performance.now();
      hasCompletedRef.current = false;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    startTimeRef.current = performance.now();

    const render = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // =======================================================================
      // PARAMETROS DE FISICA Y CINEMATICA SEGUN LA FASE ACTIVA
      // =======================================================================
      let posX = CENTER_X;
      let posY = GROUND_Y;
      let rotation = 0; // Rotacion de cuerpo / tentetieso (rad)
      let bodySpin = 1; // Giro 3D sobre eje Y (-1 a 1)
      let waveAmp = 0; // Amplitud de onda transversal (px)
      let waveSpeed = 8.0; // Velocidad de propagacion de onda
      let waveFreq = 2.5; // Frecuencia espacial a lo largo del cuerpo
      let squashX = 0;
      let squashY = 0;
      let shadowScale = 1.0;
      let shadowOpacity = 0.38;

      if (elapsed < 0.65) {
        // FASE 1: Entra a 0 grados desde arriba y se queda colgado del techo
        const p = Math.min(1, elapsed / 0.65);
        const ease = 1 - Math.pow(1 - p, 3); // Desaceleracion suave al anclarse

        // Entra desde arriba (posY: 280, cabeza en -140 fuera de escena) hasta CEILING_Y (490)
        posY = 280 + (CEILING_Y - 280) * ease;
        posX = CENTER_X + 70; // Entra recargado a la derecha
        rotation = 0; // 0 grados estricto
        bodySpin = 1;

        waveAmp = 14 * Math.sin(p * Math.PI);
        shadowScale = 0.35 + 0.05 * p;
        shadowOpacity = 0.08;
      } else if (elapsed < 1.85) {
        // FASE 2: Colgado del techo se mueve de derecha a izquierda ondulando en ondas senoidales
        const p = (elapsed - 0.65) / 1.20;

        // Trayectoria pendular de derecha a izquierda y retorno
        const travelCos = Math.cos(p * Math.PI * 2);
        posX = CENTER_X + 70 * travelCos;
        posY = CEILING_Y + 14 * Math.sin(p * Math.PI * 2);

        rotation = -0.05 * Math.sin(p * Math.PI * 2);
        bodySpin = 1;

        // Onda senoidal viajera que recorre el cuerpo como agua
        waveAmp = 28 * Math.sin(p * Math.PI);
        squashY = 0.06 * Math.cos(p * Math.PI * 4);
        squashX = -squashY * 0.75;

        shadowScale = 0.40;
        shadowOpacity = 0.10;
      } else if (elapsed < 2.45) {
        // FASE 3: Gira sobre si mismo 180 grados ondulando mucho para corregirse y quedar recto
        const p = (elapsed - 1.85) / 0.60;

        // Giro sobre si mismo: rotacion continua de 360 grados en eje Y que termina frontal
        bodySpin = Math.cos(p * Math.PI * 2);

        // Se reubica suavemente al centro vertical y horizontal
        posX = CENTER_X;
        posY = CEILING_Y + 16 * Math.sin(p * Math.PI);
        rotation = 0;

        // ONDULANDO MUCHO: amplitud maxima de deformacion fluida
        waveAmp = 40 * Math.sin(p * Math.PI);
        waveFreq = 3.2;
        waveSpeed = 14.0;
        squashY = 0.14 * Math.sin(p * Math.PI * 2);
        squashX = -squashY * 0.8;

        shadowScale = 0.45;
        shadowOpacity = 0.12;
      } else if (elapsed < 2.80) {
        // FASE 4: Cae derecho hacia el suelo (caida vertical recta acelerada)
        const p = (elapsed - 2.45) / 0.35;
        const fallEase = Math.pow(p, 2.4);

        posY = CEILING_Y + (GROUND_Y - CEILING_Y) * fallEase;
        posX = CENTER_X; // Rigurosamente recto y centrado
        rotation = 0;
        bodySpin = 1;

        // Estiramiento aerodinamico en el aire
        squashY = 0.20 * p;
        squashX = -0.15 * p;
        waveAmp = 8 * (1 - p);

        shadowScale = 0.45 + 0.55 * p;
        shadowOpacity = 0.12 + 0.26 * p;
      } else if (elapsed < 4.40) {
        // FASE 5: Toca el suelo y se bambolea como un TENTETIESO con base fija
        const tImpact = elapsed - 2.80;
        posY = GROUND_Y;
        posX = CENTER_X;
        bodySpin = 1;

        // Disipacion exponencial del bamboleo
        const decay = Math.exp(-2.8 * tImpact);

        // Oscilacion pendular invertida (tentetieso: base fija, oscila de lado a lado)
        const swayAngle = 0.36 * decay * Math.sin(12.5 * tImpact);
        rotation = swayAngle;

        // Arrastre e inercia elastica en el cuerpo
        waveAmp = 16 * decay * Math.sin(15 * tImpact);
        squashY = -0.16 * Math.exp(-14 * tImpact) * Math.cos(22 * tImpact);
        squashX = -squashY * 0.75;

        shadowScale = 1.0 + 0.30 * decay * Math.cos(12.5 * tImpact);
        shadowOpacity = 0.38;
      } else {
        // ESTADO FINAL: Firme, perfectamente recto y estatico en su posicion final
        posX = CENTER_X;
        posY = GROUND_Y;
        rotation = 0;
        bodySpin = 1;
        waveAmp = 0;
        squashX = 0;
        squashY = 0;
        shadowScale = 1.0;
        shadowOpacity = 0.38;

        if (!hasCompletedRef.current && onComplete) {
          hasCompletedRef.current = true;
          onComplete();
        }
      }

      // =======================================================================
      // SOMBRAS EN EL SUELO (1:1 con personaje_fucsia.html)
      // =======================================================================
      ctx.save();
      ctx.translate(CENTER_X, GROUND_Y);
      const sScale = Math.max(0.1, shadowScale);

      // 1. Sombra ambiental difusa (.shadow-ambient: 220px x 26px)
      ctx.save();
      ctx.scale(sScale, sScale);
      const ambGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 110);
      ambGrad.addColorStop(0.00, `rgba(60, 10, 30, ${shadowOpacity * 0.58})`);
      ambGrad.addColorStop(0.55, `rgba(60, 10, 30, ${shadowOpacity * 0.14})`);
      ambGrad.addColorStop(0.75, 'rgba(60, 10, 30, 0)');
      ambGrad.addColorStop(1.00, 'rgba(60, 10, 30, 0)');
      ctx.fillStyle = ambGrad;
      ctx.beginPath();
      ctx.ellipse(0, 8, 110, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Sombra de contacto oclusiva (.shadow-contact: 175px x 10px)
      ctx.save();
      ctx.scale(sScale, sScale);
      ctx.fillStyle = `rgba(45, 8, 22, ${shadowOpacity})`;
      ctx.beginPath();
      ctx.ellipse(0, 1, 87.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // =======================================================================
      // RENDERIZADO DEL CUERPO PROCEDURAL
      // Base fija como pivote de tentetieso, espina con ondas senoidales viajeras
      // =======================================================================
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(rotation); // Rotacion angular anclada a la base
      ctx.scale(bodySpin, 1); // Giro 3D en eje Y

      const curH = BASE_HEIGHT * (1 + squashY);
      const curW = BASE_WIDTH * (1 + squashX);

      // Muestreamos 16 segmentos en la espina para una curvatura suave y continua
      const spinePoints: { x: number; y: number; w: number }[] = [];
      const numSegments = 16;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments; // 0 = base fija en el suelo, 1 = coronacion
        const spineY = -curH * t;

        // Onda senoidal continua que viaja a lo largo del cuerpo como fluido
        const travelPhase = elapsed * waveSpeed;
        const waveOffset = waveAmp * Math.sin(t * Math.PI * waveFreq - travelPhase) * Math.sin(t * Math.PI * 0.85);

        // Curvatura convexa del torso original de Fucsia
        const profileBulge = t > 0.15 && t < 0.85 ? 1.025 : 1.0;
        const spineW = curW * profileBulge;

        spinePoints.push({ x: waveOffset, y: spineY, w: spineW });
      }

      // Sombra proyectada por la masa (.fuchsia-char: drop-shadow(0 16px 20px rgba(80,15,40,0.18)))
      ctx.shadowColor = 'rgba(80, 15, 40, 0.18)';
      ctx.shadowOffsetY = 16;
      ctx.shadowBlur = 20;

      // Construccion del contorno spline continuo
      ctx.beginPath();

      // Base plana con esquinas redondeadas de 10px
      const basePt = spinePoints[0];
      const baseHalfW = basePt.w / 2;
      ctx.moveTo(basePt.x - baseHalfW + 10, basePt.y);
      ctx.quadraticCurveTo(basePt.x - baseHalfW, basePt.y, basePt.x - baseHalfW, basePt.y - 10);

      // Borde izquierdo ascendente con splines cuadraticas
      for (let i = 1; i <= numSegments; i++) {
        const prev = spinePoints[i - 1];
        const curr = spinePoints[i];
        const prevLeftX = prev.x - prev.w / 2;
        const currLeftX = curr.x - curr.w / 2;
        const midX = (prevLeftX + currLeftX) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prevLeftX, prev.y, midX, midY);
      }

      // Coronacion superior de la cabeza con esquinas de 20px
      const topPt = spinePoints[numSegments];
      const topHalfW = topPt.w / 2;
      ctx.quadraticCurveTo(topPt.x - topHalfW, topPt.y, topPt.x - topHalfW + 20, topPt.y);
      ctx.lineTo(topPt.x + topHalfW - 20, topPt.y);
      ctx.quadraticCurveTo(topPt.x + topHalfW, topPt.y, topPt.x + topHalfW, topPt.y + 20);

      // Borde derecho descendente hacia la base
      for (let i = numSegments - 1; i >= 0; i--) {
        const next = spinePoints[i + 1];
        const curr = spinePoints[i];
        const nextRightX = next.x + next.w / 2;
        const currRightX = curr.x + curr.w / 2;
        const midX = (nextRightX + currRightX) / 2;
        const midY = (next.y + curr.y) / 2;
        ctx.quadraticCurveTo(nextRightX, next.y, midX, midY);
      }

      // Cierre de esquina inferior derecha
      ctx.quadraticCurveTo(basePt.x + baseHalfW, basePt.y, basePt.x + baseHalfW - 10, basePt.y);
      ctx.closePath();

      // Gradiente cilindrico transversal exacto a 92deg (#d85292 -> #9b1b4c)
      const charGrad = ctx.createLinearGradient(-curW / 2, 0, curW / 2, 0);
      charGrad.addColorStop(0.00, '#d85292');
      charGrad.addColorStop(0.14, '#d04583');
      charGrad.addColorStop(0.40, '#c73773');
      charGrad.addColorStop(0.68, '#c3326d');
      charGrad.addColorStop(0.96, '#a82155');
      charGrad.addColorStop(1.00, '#9b1b4c');

      ctx.fillStyle = charGrad;
      ctx.fill();

      // Limpieza de sombras para las capas internas de luz
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Mascara de recorte interna para capas de iluminacion
      ctx.save();
      ctx.clip();

      // Bisel de luz cenital superior (.fuchsia-body::before)
      const lightGrad = ctx.createLinearGradient(0, -curH, 0, 0);
      lightGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.42)');
      lightGrad.addColorStop(0.03, 'rgba(255, 255, 255, 0.12)');
      lightGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0.00)');
      lightGrad.addColorStop(0.85, 'rgba(40, 5, 20, 0.00)');
      lightGrad.addColorStop(1.00, 'rgba(40, 5, 20, 0.35)');
      ctx.fillStyle = lightGrad;
      ctx.fill();

      // Rim highlight en el borde curvo izquierdo (.fuchsia-body::after, 6px ancho)
      const rimGrad = ctx.createLinearGradient(0, -curH, 0, 0);
      rimGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.50)');
      rimGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.25)');
      rimGrad.addColorStop(0.90, 'rgba(255, 255, 255, 0.00)');
      rimGrad.addColorStop(1.00, 'rgba(40, 5, 20, 0.00)');

      ctx.beginPath();
      ctx.moveTo(basePt.x - baseHalfW, basePt.y);
      for (let i = 1; i <= numSegments; i++) {
        const curr = spinePoints[i];
        ctx.lineTo(curr.x - curr.w / 2, curr.y);
      }
      ctx.lineWidth = 6;
      ctx.strokeStyle = rimGrad;
      ctx.stroke();

      ctx.restore();

      // =======================================================================
      // ROSTRO Y OJOS (1:1 con personaje_fucsia.html)
      // Visibles cuando el personaje esta de frente (bodySpin > 0)
      // =======================================================================
      if (bodySpin > 0.05) {
        const headAnchor = spinePoints[numSegments];
        const eyeCenterY = headAnchor.y + 50; // top: 40px + radio 10px
        const eyeCenterX = headAnchor.x;
        const eyeOffset = 18; // 16px gap / 2 + radio 10px
        const eyeRadius = 10; // 20px diametro
        const pupilRadius = 4; // 8px diametro

        // Inercia fisica en la mirada
        const eyeLagX = -waveAmp * 0.10 - rotation * 14;
        const eyeLagY = -squashY * 12;

        const drawEyeExact = (cx: number, cy: number) => {
          ctx.save();
          ctx.translate(cx, cy);

          // 1. Relieve sobre la arcilla: box-shadow: 0 2.5px 4px rgba(0,0,0,0.26)
          ctx.beginPath();
          ctx.arc(0, 2.5, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
          ctx.fill();

          // 2. Globo ocular blanco
          ctx.beginPath();
          ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // 3. Sombra interna: inset 0 -1px 2px rgba(0,0,0,0.12)
          ctx.beginPath();
          ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 4. Pupila oscura (#111116)
          ctx.beginPath();
          ctx.arc(eyeLagX, eyeLagY, pupilRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#111116';
          ctx.fill();

          // 5. Destello especular blanco de 2px
          ctx.beginPath();
          ctx.arc(eyeLagX - 1.5, eyeLagY - 1.5, 1, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.restore();
        };

        drawEyeExact(eyeCenterX - eyeOffset, eyeCenterY);
        drawEyeExact(eyeCenterX + eyeOffset, eyeCenterY);
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'relative',
        width: 190,
        height: 450, // 420px de Fucsia + 30px de padding inferior del stage estatico
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: -165, // Centra el lienzo de 520px sobre el slot de 190px ((520 - 190) / 2 = 165)
          bottom: 0, // GROUND_Y=770 queda exactamente a 30px del suelo del stage
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
