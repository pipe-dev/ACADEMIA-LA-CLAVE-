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
 * Coreografia procedural exacta:
 * 1. Entra a 0° desde arriba.
 * 2. Se queda colgado del techo y se mueve de derecha a izquierda ondulando su cuerpo.
 * 3. Da una vuelta ondulando fuertemente.
 * 4. Cae derecho hacia el suelo.
 * 5. Se asienta y se mueve por la fisica de un lado a otro hasta frenar y quedar recto.
 * Estilo visual 1:1 con personaje_fucsia.html (ojos 20px, pupilas 8px, gradientes de arcilla).
 */
export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>(({ autoPlay = true, onComplete }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCompletedRef = useRef<boolean>(false);

  const CANVAS_WIDTH = 440;
  const CANVAS_HEIGHT = 560;
  const GROUND_Y = 500;
  const BASE_WIDTH = 190;
  const BASE_HEIGHT = 420;

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

    // Pantallas Retina / High-DPI
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
      // COREOGRAFIA PROCEDURAL EXACTA
      // =======================================================================
      let posX = CANVAS_WIDTH / 2;
      let posY = GROUND_Y;
      let rotation = 0; // Radianes (0 rad = 0 grados, cabeza arriba)
      let skewX = 0; // Deformacion lateral por fisica
      let waveAmp = 0; // Amplitud de onda transversal del cuerpo (px)
      let waveFreq = 2.4;
      let squashX = 0;
      let squashY = 0;
      let shadowScale = 1;
      let shadowOpacity = 0.38;

      if (elapsed < 0.3) {
        // PASO 1: Entra en cero grados bajando desde arriba
        const p = elapsed / 0.3;
        const ease = Math.sin((p * Math.PI) / 2);

        // Desciende desde arriba (-100px) hasta el techo de suspension (360px)
        posY = 280 + 80 * ease;
        posX = CANVAS_WIDTH / 2 + 80;
        rotation = 0; // 0 grados estricto
        waveAmp = 12 * p;

        shadowScale = 0.35;
        shadowOpacity = 0.08;
      } else if (elapsed < 1.1) {
        // PASO 2: Se queda colgado del techo y se mueve de derecha a izquierda ondulando su cuerpo
        const p = (elapsed - 0.3) / 0.8;

        // Se desplaza en X de derecha (+80) a izquierda (-65) y retorna al centro (0)
        const waveX = Math.cos(p * Math.PI * 2); // 1 -> -1 -> 1
        posX = CANVAS_WIDTH / 2 + 75 * waveX;
        posY = 360 + 15 * Math.sin(p * Math.PI * 2); // Leve arqueo en Y

        rotation = -0.08 * Math.sin(p * Math.PI * 2); // Leve vaiven natural

        // Ondulacion liquida continua a lo largo del cuerpo
        waveAmp = 30 * Math.sin(p * Math.PI * 3);
        squashY = 0.08 * Math.cos(p * Math.PI * 3);
        squashX = -squashY * 0.8;

        shadowScale = 0.40;
        shadowOpacity = 0.10;
      } else if (elapsed < 1.6) {
        // PASO 3: Da una vuelta en el aire ondulando mucho
        const p = (elapsed - 1.1) / 0.5;

        // Vuelta completa fluida (360° / 2*PI rad)
        const flipEase = (1 - Math.cos(p * Math.PI)) / 2;
        rotation = Math.PI * 2 * flipEase;

        posX = CANVAS_WIDTH / 2 + 10 * Math.sin(p * Math.PI * 2);
        posY = 360 + 20 * Math.sin(p * Math.PI);

        // ONDULANDO MUCHO (amplitud maxima de agua/goma)
        waveAmp = 42 * Math.sin(p * Math.PI * 4);
        squashY = 0.22 * Math.sin(p * Math.PI * 2);
        squashX = -squashY * 0.8;

        shadowScale = 0.45;
        shadowOpacity = 0.12;
      } else if (elapsed < 1.95) {
        // PASO 4: Cae derecho hacia el suelo
        const p = (elapsed - 1.6) / 0.35;

        // Caida vertical recta hacia el suelo
        const fallEase = Math.pow(p, 2.4);
        posY = 360 + (GROUND_Y - 360) * fallEase;
        posX = CANVAS_WIDTH / 2; // Derecho en X
        rotation = 0; // Derecho a 0 grados
        skewX = 0;

        // Estiramiento vertical en caida libre
        squashY = 0.28 * p;
        squashX = -0.20 * p;
        waveAmp = 10 * (1 - p);

        shadowScale = 0.45 + 0.55 * p;
        shadowOpacity = 0.12 + 0.26 * p;
      } else if (elapsed < 3.1) {
        // PASO 5: Impacta en el suelo y se mueve por la fisica de un lado a otro hasta parar
        const tImpact = elapsed - 1.95;
        posY = GROUND_Y;
        rotation = 0; // 0 grados

        // Oscilacion amortiguada: e^(-lambda*t)
        const decay = Math.exp(-3.6 * tImpact);

        // Bamboleo fisico de un lado a otro (izquierda y derecha)
        const sway = Math.sin(15 * tImpact);
        posX = CANVAS_WIDTH / 2 + 22 * decay * sway;
        skewX = (15 * decay * Math.cos(15 * tImpact) * Math.PI) / 180;

        // Aplastamiento y rebote vertical de flan
        const bounce = Math.cos(22 * tImpact);
        squashY = -0.52 * decay * bounce;
        squashX = 0.58 * decay * bounce;
        waveAmp = 14 * decay * Math.sin(18 * tImpact);

        shadowScale = 1.0 + 0.50 * decay * bounce;
        shadowOpacity = 0.38 + 0.20 * decay * bounce;
      } else {
        // FINAL: Se queda parado, completamente recto y quieto en su posicion final
        posX = CANVAS_WIDTH / 2;
        posY = GROUND_Y;
        rotation = 0;
        skewX = 0;
        squashX = 0;
        squashY = 0;
        waveAmp = 0;
        shadowScale = 1.0;
        shadowOpacity = 0.38;

        if (!hasCompletedRef.current && onComplete) {
          hasCompletedRef.current = true;
          onComplete();
        }
      }

      // =======================================================================
      // RENDERIZADO: Sombras en el suelo (1:1 con personaje_fucsia.html)
      // =======================================================================
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, GROUND_Y);
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
      // RENDERIZADO: Masa de arcilla fucsia procedural
      // =======================================================================
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(rotation);
      if (skewX !== 0) {
        ctx.transform(1, 0, Math.tan(skewX), 1, 0, 0);
      }

      const curH = BASE_HEIGHT * (1 + squashY);
      const curW = BASE_WIDTH * (1 + squashX);

      // Calculamos 9 puntos a lo largo de la espina para la deformacion senoidal
      const spinePoints: { x: number; y: number; w: number }[] = [];
      const numSegments = 8;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments; // 0 = base, 1 = coronacion
        const spineY = -curH * t;

        // Onda transversal continua a lo largo del cuerpo
        const waveOffset = waveAmp * Math.sin(t * Math.PI * waveFreq);

        // Curvatura convexa original del cuerpo de Fucsia
        const profileBulge = t > 0.15 && t < 0.85 ? 1.025 : 1.0;
        const spineW = curW * profileBulge;

        spinePoints.push({ x: waveOffset, y: spineY, w: spineW });
      }

      // Sombra arrojada por la masa (.fuchsia-char: drop-shadow(0 16px 20px rgba(80,15,40,0.18)))
      ctx.shadowColor = 'rgba(80, 15, 40, 0.18)';
      ctx.shadowOffsetY = 16;
      ctx.shadowBlur = 20;

      // Construccion del contorno procedural continuo
      ctx.beginPath();

      // Base: esquina inferior izquierda redondeada (radio 10px)
      const basePt = spinePoints[0];
      const baseHalfW = basePt.w / 2;
      ctx.moveTo(basePt.x - baseHalfW + 10, basePt.y);
      ctx.quadraticCurveTo(basePt.x - baseHalfW, basePt.y, basePt.x - baseHalfW, basePt.y - 10);

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

      // Coronacion de la cabeza: esquinas redondeadas firmes (radio 20px)
      const topPt = spinePoints[numSegments];
      const topHalfW = topPt.w / 2;
      ctx.quadraticCurveTo(topPt.x - topHalfW, topPt.y, topPt.x - topHalfW + 20, topPt.y);
      ctx.lineTo(topPt.x + topHalfW - 20, topPt.y);
      ctx.quadraticCurveTo(topPt.x + topHalfW, topPt.y, topPt.x + topHalfW, topPt.y + 20);

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

      // Esquina inferior derecha (radio 10px) y cierre de base plana
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

      // Limpiamos la sombra arrojada para las capas interiores
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Capa de iluminacion cenital y biseles volumetricos (.fuchsia-body::before)
      ctx.save();
      ctx.clip();

      const lightGrad = ctx.createLinearGradient(0, -curH, 0, 0);
      lightGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.42)');
      lightGrad.addColorStop(0.03, 'rgba(255, 255, 255, 0.12)');
      lightGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0.00)');
      lightGrad.addColorStop(0.85, 'rgba(40, 5, 20, 0.00)');
      lightGrad.addColorStop(1.00, 'rgba(40, 5, 20, 0.35)');

      ctx.fillStyle = lightGrad;
      ctx.fill();

      // Rim highlight sutil en el borde izquierdo (.fuchsia-body::after, 6px ancho)
      const rimGrad = ctx.createLinearGradient(0, -curH, 0, 0);
      rimGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.50)');
      rimGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.25)');
      rimGrad.addColorStop(0.90, 'rgba(255, 255, 255, 0.00)');
      rimGrad.addColorStop(1.00, 'rgba(255, 255, 255, 0.00)');

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
      // RENDERIZADO: Ojos exactos de 20px (1:1 con personaje_fucsia.html)
      // .face { top: 40px; } .eyes { gap: 16px; } .eye { 20px x 20px; }
      // =======================================================================
      const headAnchor = spinePoints[numSegments]; // Coronacion
      const eyeCenterY = headAnchor.y + 50; // 40px top + 10px radio
      const eyeCenterX = headAnchor.x;
      const eyeOffset = 18; // 16px gap / 2 + 10px radio
      const eyeRadius = 10; // 20px diametro exacto
      const pupilRadius = 4; // 8px diametro exacto

      // Inercia secundaria en la mirada
      const eyeLagX = -waveAmp * 0.10 - skewX * 12;
      const eyeLagY = -squashY * 12;

      const drawEyeExact = (cx: number, cy: number) => {
        ctx.save();
        ctx.translate(cx, cy);

        // 1. Sombra arrojada del relieve sobre la arcilla: 0 2.5px 4px rgba(0,0,0,0.26)
        ctx.beginPath();
        ctx.arc(0, 2.5, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        ctx.fill();

        // 2. Globo ocular blanco exacto
        ctx.beginPath();
        ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 3. Sombra interna del borde: inset 0 -1px 2px rgba(0,0,0,0.12)
        ctx.beginPath();
        ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Pupila oscura (8px diametro = 4px radio, #111116)
        ctx.beginPath();
        ctx.arc(eyeLagX, eyeLagY, pupilRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#111116';
        ctx.fill();

        // 5. Punto especular exacto (2px diametro = 1px radio, blanco, top: 1px, left: 1px)
        ctx.beginPath();
        ctx.arc(eyeLagX - 1.5, eyeLagY - 1.5, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      };

      drawEyeExact(eyeCenterX - eyeOffset, eyeCenterY);
      drawEyeExact(eyeCenterX + eyeOffset, eyeCenterY);

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
          left: -125, // Centra el canvas de 440px sobre el slot de 190px (220 - 95 = 125)
          bottom: -20, // Situa la base de Fucsia exactamente sobre el suelo
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
