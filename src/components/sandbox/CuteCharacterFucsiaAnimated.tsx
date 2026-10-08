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
 * Motor procedural 2D en Canvas que replica 1:1 el diseno original de Fucsia
 * (gradientes cilindricos a 92°, biseles de arcilla, ojos de 20px y sombras)
 * mientras calcula en tiempo real ondas sinusoidales continuas de fluidos
 * y deformacion elastica de cuerpo blando (soft-body jelly physics).
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
  const CANVAS_HEIGHT = 520;
  const GROUND_Y = 470;
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

    // Soporte para pantallas Retina y pantallas de alta densidad
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
      // FISICA PROCEDURAL: Calculo de trayectoria, rotacion y ondas sinusoidales
      // =======================================================================
      let posX = CANVAS_WIDTH / 2;
      let posY = GROUND_Y;
      let rotation = 0; // Radianes
      let waveAmp = 0; // Amplitud de la onda senoidal (px)
      let waveFreq = 2.4; // Frecuencia espacial
      let squashX = 0; // Deformacion lateral de masa
      let squashY = 0; // Deformacion vertical de masa
      let shadowScale = 1;
      let shadowOpacity = 0.38;

      if (elapsed < 0.75) {
        // FASE 1: Colgado del techo invertido, balanceo pendular hacia la izquierda
        const progress = elapsed / 0.75;
        const sineT = Math.sin((progress * Math.PI) / 2);

        posX = CANVAS_WIDTH / 2 + 85 - 150 * sineT; // 85 -> -65
        posY = 65 + 28 * Math.sin(progress * Math.PI); // Arco pendular
        rotation = Math.PI + 0.28 - 0.58 * sineT; // Invertido (~180°) oscilando

        // Onda senoidal continua que viaja a lo largo de la columna de liquido
        waveAmp = 32 * Math.sin(progress * Math.PI);
        squashY = 0.14 * Math.sin(progress * Math.PI * 2);
        squashX = -squashY * 0.85;

        shadowScale = 0.35;
        shadowOpacity = 0.08;
      } else if (elapsed < 1.35) {
        // FASE 2: Retorno pendular hacia el centro de desprendimiento
        const progress = (elapsed - 0.75) / 0.60;
        const sineT = (1 - Math.cos(progress * Math.PI)) / 2;

        posX = CANVAS_WIDTH / 2 - 65 + 65 * sineT; // -65 -> 0
        posY = 65 + 22 * Math.sin(progress * Math.PI);
        rotation = Math.PI - 0.30 + 0.46 * sineT;

        // Onda reactiva inversa
        waveAmp = -28 * Math.sin(progress * Math.PI);
        squashY = 0.12 * Math.sin(progress * Math.PI * 2);
        squashX = -squashY * 0.85;

        shadowScale = 0.38;
        shadowOpacity = 0.10;
      } else if (elapsed < 1.85) {
        // FASE 3: Desprendimiento, voltereta de 180° y caida acelerada tipo lagrima
        const progress = (elapsed - 1.35) / 0.50;

        // Caida balistica acelerada hacia el suelo
        const fallEase = Math.pow(progress, 2.4);
        posY = 65 + (GROUND_Y - 65) * fallEase;

        // Bamboleo senoidal en X durante el descenso
        posX = CANVAS_WIDTH / 2 + 16 * Math.sin(progress * Math.PI * 2);

        // Giro de 180° hacia la vertical neutral
        const flipEase = (1 - Math.cos(progress * Math.PI)) / 2;
        rotation = Math.PI + 0.16 + (Math.PI - 0.16) * flipEase;

        // Estiramiento hidrodinamico de gota de agua
        squashY = 0.34 * progress;
        squashX = -0.24 * progress;
        waveAmp = 14 * Math.sin(progress * Math.PI * 3);

        shadowScale = 0.38 + 0.52 * progress;
        shadowOpacity = 0.10 + 0.24 * progress;
      } else {
        // FASE 4: Impacto balistico y temblor armonico amortiguado de gelatina
        const tImpact = elapsed - 1.85;
        posX = CANVAS_WIDTH / 2;
        posY = GROUND_Y;
        rotation = 0;

        if (tImpact < 0.75) {
          // Oscilador armonico amortiguado puro: e^(-lambda*t) * cos(omega*t)
          const decay = Math.exp(-5.2 * tImpact);
          const oscillation = Math.cos(25 * tImpact);

          squashY = -0.58 * decay * oscillation;
          squashX = 0.64 * decay * oscillation;
          waveAmp = 12 * decay * Math.sin(20 * tImpact);

          shadowScale = 1.0 + 0.65 * decay * oscillation;
          shadowOpacity = 0.38 + 0.25 * decay * oscillation;
        } else {
          // FASE 5: Respiracion continua en reposo (Idle organico vivo)
          const idleTime = tImpact - 0.75;
          squashY = 0.022 * Math.sin(idleTime * 2.6);
          squashX = -0.022 * Math.sin(idleTime * 2.6);
          waveAmp = 1.8 * Math.sin(idleTime * 2.0);

          shadowScale = 1.0 + 0.03 * Math.sin(idleTime * 2.6);
          shadowOpacity = 0.38;

          if (!hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            onComplete();
          }
        }
      }

      // =======================================================================
      // RENDERIZADO: Sombras en el suelo (1:1 con personaje_fucsia.html)
      // =======================================================================
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, GROUND_Y);
      const sScale = Math.max(0.1, shadowScale);

      // 1. Sombra ambiental difusa (.shadow-ambient: 220px x 26px, blur suave)
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
      // RENDERIZADO: Masa de arcilla fucsia procedural con contorno exacto
      // =======================================================================
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(rotation);

      const curH = BASE_HEIGHT * (1 + squashY);
      const curW = BASE_WIDTH * (1 + squashX);

      // Calculamos 9 puntos a lo largo de la espina para la deformacion senoidal
      const spinePoints: { x: number; y: number; w: number }[] = [];
      const numSegments = 8;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments; // 0 = base, 1 = coronacion
        const spineY = -curH * t;

        // Onda transversal viajera a traves de la masa
        const waveOffset = waveAmp * Math.sin(t * Math.PI * waveFreq);

        // Curvatura convexa original del cuerpo (abultamiento del torso de Fucsia)
        const profileBulge = (t > 0.15 && t < 0.85) ? 1.025 : 1.0;
        const spineW = curW * profileBulge;

        spinePoints.push({ x: waveOffset, y: spineY, w: spineW });
      }

      // 1. Sombra arrojada por la masa (.fuchsia-char: drop-shadow(0 16px 20px rgba(80,15,40,0.18)))
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

      // 2. Capa de iluminacion cenital y biseles volumetricos (.fuchsia-body::before)
      ctx.save();
      ctx.clip(); // Restringir exactamente al cuerpo deformado

      const lightGrad = ctx.createLinearGradient(0, -curH, 0, 0);
      lightGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.42)');
      lightGrad.addColorStop(0.03, 'rgba(255, 255, 255, 0.12)');
      lightGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0.00)');
      lightGrad.addColorStop(0.85, 'rgba(40, 5, 20, 0.00)');
      lightGrad.addColorStop(1.00, 'rgba(40, 5, 20, 0.35)');

      ctx.fillStyle = lightGrad;
      ctx.fill();

      // 3. Rim highlight sutil en el borde izquierdo (.fuchsia-body::after, 6px ancho)
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

      ctx.restore(); // Fin del clip

      // =======================================================================
      // RENDERIZADO: Ojos exactos de 20px (1:1 con personaje_fucsia.html)
      // .face { top: 40px; } .eyes { gap: 16px; } .eye { 20px x 20px; }
      // =======================================================================
      const headAnchor = spinePoints[numSegments]; // Punto en la coronacion
      const eyeCenterY = headAnchor.y + 50; // 40px top + 10px radio
      const eyeCenterX = headAnchor.x;
      const eyeOffset = 18; // 16px gap / 2 + 10px radio = 18px del centro
      const eyeRadius = 10; // 20px diametro exacto
      const pupilRadius = 4; // 8px diametro exacto

      // Inercia secundaria en la mirada (los ojos responden al movimiento)
      const eyeLagX = -waveAmp * 0.10;
      const eyeLagY = -squashY * 14;

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

        // 4. Pupila oscura (.pupil: 8px diametro = 4px radio, #111116)
        ctx.beginPath();
        ctx.arc(eyeLagX, eyeLagY, pupilRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#111116';
        ctx.fill();

        // 5. Punto especular exacto (.pupil::after: 2px diametro = 1px radio, blanco, top: 1px, left: 1px)
        ctx.beginPath();
        ctx.arc(eyeLagX - 1.5, eyeLagY - 1.5, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      };

      // Ojo izquierdo y derecho con separacion exacta de 16px
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
