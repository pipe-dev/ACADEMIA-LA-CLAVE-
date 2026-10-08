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
 * Motor procedural 2D para fisica de fluidos y cuerpo blando (soft-body).
 * Calcula en tiempo real ondas sinusoidales continuas a lo largo de la espina
 * del personaje y resuelve oscilaciones armonicas amortiguadas para el impacto.
 */
export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>(({ autoPlay = true, onComplete }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(autoPlay);
  const hasCompletedRef = useRef<boolean>(false);

  const CANVAS_WIDTH = 440;
  const CANVAS_HEIGHT = 520;
  const GROUND_Y = 465;
  const BASE_WIDTH = 190;
  const BASE_HEIGHT = 420;

  useImperativeHandle(ref, () => ({
    replay: () => {
      startTimeRef.current = performance.now();
      isPlayingRef.current = true;
      hasCompletedRef.current = false;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Soporte para pantallas Retina / High-DPI
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    startTimeRef.current = performance.now();

    const render = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000; // Segundos transcurridos

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // =======================================================================
      // FISICA PROCEDURAL: Calculo de trayectoria, rotacion y ondas sinusoidales
      // =======================================================================
      let posX = CANVAS_WIDTH / 2;
      let posY = GROUND_Y;
      let rotation = 0; // Radianes
      let waveAmp = 0; // Amplitud de onda transversal (px)
      let waveFreq = 2.8; // Frecuencia espacial
      let squashX = 0; // Deformacion de ancho (-1 a 1)
      let squashY = 0; // Deformacion de altura (-1 a 1)
      let shadowScale = 1;
      let shadowOpacity = 0.38;

      if (elapsed < 0.8) {
        // FASE 1: Colgado del techo invertido, balanceo hacia la izquierda en onda senoidal
        const progress = elapsed / 0.8;
        const sineT = Math.sin((progress * Math.PI) / 2);

        // Movimiento pendular
        posX = CANVAS_WIDTH / 2 + 110 - 180 * sineT; // 110 -> -70
        posY = 65 + 35 * Math.sin(progress * Math.PI); // Arco vertical
        rotation = Math.PI + 0.32 - 0.65 * sineT; // Invertido (~180deg) oscilando

        // Onda senoidal viajera a lo largo de la masa
        waveAmp = 34 * Math.sin(progress * Math.PI);
        squashY = 0.15 * Math.sin(progress * Math.PI * 2);
        squashX = -squashY * 0.85; // Conservacion de volumen

        shadowScale = 0.35;
        shadowOpacity = 0.08;
      } else if (elapsed < 1.45) {
        // FASE 2: Retorno pendular hacia el centro de desprendimiento
        const progress = (elapsed - 0.8) / 0.65;
        const sineT = (1 - Math.cos(progress * Math.PI)) / 2;

        posX = CANVAS_WIDTH / 2 - 70 + 70 * sineT; // -70 -> 0
        posY = 65 + 25 * Math.sin(progress * Math.PI);
        rotation = Math.PI - 0.33 + 0.50 * sineT;

        // Onda inversa reactiva
        waveAmp = -32 * Math.sin(progress * Math.PI);
        squashY = 0.14 * Math.sin(progress * Math.PI * 2);
        squashX = -squashY * 0.85;

        shadowScale = 0.40;
        shadowOpacity = 0.10;
      } else if (elapsed < 1.95) {
        // FASE 3: Desprendimiento, voltereta de 180° y caida libre acelerada
        const progress = (elapsed - 1.45) / 0.5;

        // Caida gravitacional acelerada
        const fallEase = Math.pow(progress, 2.5);
        posY = 65 + (GROUND_Y - 65) * fallEase;

        // Bamboleo senoidal en X durante la caida
        posX = CANVAS_WIDTH / 2 + 18 * Math.sin(progress * Math.PI * 2);

        // Voltereta de 180° fluida hacia 360° (0 rad)
        const flipEase = (1 - Math.cos(progress * Math.PI)) / 2;
        rotation = Math.PI + 0.17 + (Math.PI - 0.17) * flipEase;

        // Estiramiento vertical hidrodinamico de gota en caida libre
        squashY = 0.36 * progress;
        squashX = -0.26 * progress;
        waveAmp = 16 * Math.sin(progress * Math.PI * 3);

        shadowScale = 0.4 + 0.45 * progress;
        shadowOpacity = 0.10 + 0.20 * progress;
      } else {
        // FASE 4: Impacto balistico y oscilacion armonica amortiguada de gelatina
        const tImpact = elapsed - 1.95;
        posX = CANVAS_WIDTH / 2;
        posY = GROUND_Y;
        rotation = 0;

        if (tImpact < 0.8) {
          // Ecuacion diferencial del oscilador armonico amortiguado: e^(-lambda*t) * cos(omega*t)
          const decay = Math.exp(-4.8 * tImpact);
          const oscillation = Math.cos(24 * tImpact);

          // Squash extremo inicial y sucesivos rebotes de flan
          squashY = -0.58 * decay * oscillation;
          squashX = 0.65 * decay * oscillation;
          waveAmp = 14 * decay * Math.sin(20 * tImpact);

          shadowScale = 1.0 + 0.65 * decay * oscillation;
          shadowOpacity = 0.38 + 0.25 * decay * oscillation;
        } else {
          // FASE 5: Respiracion sinusoidal continua en reposo (Idle organico vivo)
          const idleTime = tImpact - 0.8;
          squashY = 0.025 * Math.sin(idleTime * 2.8);
          squashX = -0.025 * Math.sin(idleTime * 2.8);
          waveAmp = 2.2 * Math.sin(idleTime * 2.2);

          shadowScale = 1.0 + 0.04 * Math.sin(idleTime * 2.8);
          shadowOpacity = 0.38;

          if (!hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            onComplete();
          }
        }
      }

      // =======================================================================
      // RENDERIZADO: Sombra en el suelo
      // =======================================================================
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, GROUND_Y);
      ctx.scale(Math.max(0.1, shadowScale), Math.max(0.1, shadowScale * 0.16));

      // Sombra ambiental difusa
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60, 10, 30, ${shadowOpacity * 0.45})`;
      ctx.fill();

      // Sombra de contacto oclusiva
      ctx.beginPath();
      ctx.arc(0, 0, 78, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 8, 22, ${shadowOpacity})`;
      ctx.fill();
      ctx.restore();

      // =======================================================================
      // RENDERIZADO: Masa de arcilla fucsia procedural
      // =======================================================================
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(rotation);

      // Dimensiones dinamicas con conservacion de masa
      const curH = BASE_HEIGHT * (1 + squashY);
      const curW = BASE_WIDTH * (1 + squashX);

      // Calculamos 9 puntos a lo largo de la espina para la deformacion senoidal
      const spinePoints: { x: number; y: number; w: number }[] = [];
      const numSegments = 8;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments; // 0 = base, 1 = cabeza
        const spineY = -curH * t;

        // Onda sinusoidal transversal viajera
        const waveOffset = waveAmp * Math.sin(t * Math.PI * waveFreq);

        // Curvatura original del cuerpo de Fucsia (ligeramente ensanchado arriba)
        const profileBulge = 1 + 0.05 * Math.sin(t * Math.PI);
        const spineW = curW * profileBulge;

        spinePoints.push({ x: waveOffset, y: spineY, w: spineW });
      }

      // Construccion del trazado del contorno exterior continuo
      ctx.beginPath();

      // Base redondeada (arco inferior)
      const basePt = spinePoints[0];
      const baseHalfW = basePt.w / 2;
      ctx.moveTo(basePt.x - baseHalfW + 16, basePt.y);
      ctx.quadraticCurveTo(basePt.x - baseHalfW, basePt.y, basePt.x - baseHalfW, basePt.y - 16);

      // Borde izquierdo con curvas spline suaves a traves de la onda
      for (let i = 1; i <= numSegments; i++) {
        const prev = spinePoints[i - 1];
        const curr = spinePoints[i];
        const prevLeftX = prev.x - prev.w / 2;
        const currLeftX = curr.x - curr.w / 2;
        const midX = (prevLeftX + currLeftX) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prevLeftX, prev.y, midX, midY);
      }

      // Coronacion de la cabeza (arco superior redondeado)
      const topPt = spinePoints[numSegments];
      const topHalfW = topPt.w / 2;
      ctx.quadraticCurveTo(topPt.x - topHalfW, topPt.y, topPt.x, topPt.y);
      ctx.quadraticCurveTo(topPt.x + topHalfW, topPt.y, topPt.x + topHalfW, topPt.y + 16);

      // Borde derecho de regreso hacia la base
      for (let i = numSegments - 1; i >= 0; i--) {
        const next = spinePoints[i + 1];
        const curr = spinePoints[i];
        const nextRightX = next.x + next.w / 2;
        const currRightX = curr.x + curr.w / 2;
        const midX = (nextRightX + currRightX) / 2;
        const midY = (next.y + curr.y) / 2;
        ctx.quadraticCurveTo(nextRightX, next.y, midX, midY);
      }

      // Esquina inferior derecha
      ctx.quadraticCurveTo(basePt.x + baseHalfW, basePt.y, basePt.x + baseHalfW - 16, basePt.y);
      ctx.closePath();

      // Gradiente cilindrico transversal exacto de Fucsia (92deg)
      const charGrad = ctx.createLinearGradient(-curW / 2, 0, curW / 2, 0);
      charGrad.addColorStop(0.00, '#d85292');
      charGrad.addColorStop(0.14, '#d04583');
      charGrad.addColorStop(0.40, '#c73773');
      charGrad.addColorStop(0.68, '#c3326d');
      charGrad.addColorStop(0.96, '#a82155');
      charGrad.addColorStop(1.00, '#9b1b4c');

      ctx.fillStyle = charGrad;
      ctx.fill();

      // Iluminacion cenital volumetrica y bisel de arcilla
      const lightGrad = ctx.createLinearGradient(0, -curH, 0, 0);
      lightGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.42)');
      lightGrad.addColorStop(0.03, 'rgba(255, 255, 255, 0.12)');
      lightGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0.00)');
      lightGrad.addColorStop(0.85, 'rgba(40, 5, 20, 0.00)');
      lightGrad.addColorStop(1.00, 'rgba(40, 5, 20, 0.35)');

      ctx.fillStyle = lightGrad;
      ctx.fill();

      // Rim highlight suave en el borde curvo izquierdo
      ctx.save();
      ctx.clip(); // Limitar al cuerpo
      ctx.beginPath();
      ctx.moveTo(basePt.x - baseHalfW, basePt.y);
      for (let i = 1; i <= numSegments; i++) {
        const curr = spinePoints[i];
        ctx.lineTo(curr.x - curr.w / 2, curr.y);
      }
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.stroke();
      ctx.restore();

      // =======================================================================
      // RENDERIZADO: Ojos con relieve y pupila (anclados a la cabeza)
      // =======================================================================
      const headAnchor = spinePoints[7]; // Cerca de la parte superior
      const eyeCenterY = headAnchor.y + 40;
      const eyeCenterX = headAnchor.x;
      const eyeDistance = 16;
      const eyeRadius = 10;
      const pupilRadius = 4;

      // Inercia secundaria en la mirada (lag fisico)
      const eyeLagX = -waveAmp * 0.12;
      const eyeLagY = -squashY * 18;

      const drawEye = (x: number, y: number) => {
        ctx.save();
        ctx.translate(x, y);

        // Sombra de relieve arrojada sobre la arcilla
        ctx.beginPath();
        ctx.arc(0, 2.5, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.fill();

        // Globo ocular blanco
        ctx.beginPath();
        ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Sombra interna del borde del ojo
        ctx.beginPath();
        ctx.arc(0, -1, eyeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Pupila oscura con inercia
        ctx.beginPath();
        ctx.arc(eyeLagX, eyeLagY, pupilRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#111116';
        ctx.fill();

        // Brillo especular
        ctx.beginPath();
        ctx.arc(eyeLagX - 1.4, eyeLagY - 1.4, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      };

      drawEye(eyeCenterX - eyeDistance, eyeCenterY);
      drawEye(eyeCenterX + eyeDistance, eyeCenterY);

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
        height: 420,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: -125, // Centra el canvas de 440px sobre el slot de 190px
          bottom: -15, // Ajusta la linea de tierra al borde inferior exacto
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
