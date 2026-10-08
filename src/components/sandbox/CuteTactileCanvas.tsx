'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import styles from './CuteTactileCanvas.module.css';

export interface CuteTactileCanvasRef {
  spawnRipple: (x: number, y: number, intensity?: number) => void;
  setTouchGlow: (x: number, y: number, active: boolean) => void;
  setPinchPull: (
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    active: boolean,
    color?: string,
    highlightColor?: string
  ) => void;
}

export interface CuteTactileCanvasProps {
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  decay: number;
  thickness: number;
}

interface PinchState {
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  active: boolean;
  color: string;
  highlightColor: string;
  snapProgress: number;
  snapTargetX: number;
  snapTargetY: number;
}

export const CuteTactileCanvas = forwardRef<
  CuteTactileCanvasRef,
  CuteTactileCanvasProps
>(({width, height, className = '', style = {}}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const touchGlowRef = useRef<{x: number; y: number; active: boolean}>({
    x: 0,
    y: 0,
    active: false,
  });

  const pinchRef = useRef<PinchState>({
    originX: 0,
    originY: 0,
    targetX: 0,
    targetY: 0,
    active: false,
    color: 'rgba(255, 255, 255, 0.45)',
    highlightColor: 'rgba(255, 255, 255, 0.85)',
    snapProgress: 0,
    snapTargetX: 0,
    snapTargetY: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const startLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const draw = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = null;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = null;
        return;
      }

      const last = lastTimeRef.current ?? now;
      const dt = Math.min((now - last) / 1000, 0.033);
      lastTimeRef.current = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Dibujar depresion de contacto (Touch Glow)
      const glow = touchGlowRef.current;
      if (glow.active) {
        const grad = ctx.createRadialGradient(glow.x, glow.y, 4, glow.x, glow.y, 42);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
        grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.16)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(glow.x, glow.y, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Dibujar cono de piel elástica / pellizco (Pinch Tent)
      const pinch = pinchRef.current;
      if (pinch.active || pinch.snapProgress > 0.01) {
        let currentTx = pinch.targetX;
        let currentTy = pinch.targetY;

        if (!pinch.active && pinch.snapProgress > 0) {
          // Retroceso rapido amortiguado (snap-back)
          pinch.snapProgress *= Math.exp(-dt * 26);
          currentTx = pinch.originX + (pinch.snapTargetX - pinch.originX) * pinch.snapProgress;
          currentTy = pinch.originY + (pinch.snapTargetY - pinch.originY) * pinch.snapProgress;
          if (pinch.snapProgress <= 0.01) {
            pinch.snapProgress = 0;
          }
        }

        const dx = currentTx - pinch.originX;
        const dy = currentTy - pinch.originY;
        const dist = Math.hypot(dx, dy);

        if (dist > 3) {
          ctx.save();
          const angle = Math.atan2(dy, dx);
          const perpAngle = angle + Math.PI / 2;

          const baseWidth = Math.min(54, 16 + dist * 0.3);
          const p1x = pinch.originX + Math.cos(perpAngle) * baseWidth;
          const p1y = pinch.originY + Math.sin(perpAngle) * baseWidth;
          const p2x = pinch.originX - Math.cos(perpAngle) * baseWidth;
          const p2y = pinch.originY - Math.sin(perpAngle) * baseWidth;

          // Puntos de control concavos (silueta hiperbolica de tenting de piel)
          const midX = (pinch.originX + currentTx) * 0.5;
          const midY = (pinch.originY + currentTy) * 0.5;
          const waistWidth = baseWidth * 0.34;
          const cp1x = midX + Math.cos(perpAngle) * waistWidth;
          const cp1y = midY + Math.sin(perpAngle) * waistWidth;
          const cp2x = midX - Math.cos(perpAngle) * waistWidth;
          const cp2y = midY - Math.sin(perpAngle) * waistWidth;

          // Gradiente de piel elastica estirada con tonos del personaje
          const tentGrad = ctx.createLinearGradient(
            pinch.originX,
            pinch.originY,
            currentTx,
            currentTy
          );
          tentGrad.addColorStop(0, pinch.color);
          tentGrad.addColorStop(0.72, pinch.highlightColor);
          tentGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

          // Relleno de la membrana conica
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.quadraticCurveTo(cp1x, cp1y, currentTx, currentTy);
          ctx.quadraticCurveTo(cp2x, cp2y, p2x, p2y);
          ctx.closePath();
          ctx.fillStyle = tentGrad;
          ctx.fill();

          // Bordes de tension elastica
          ctx.strokeStyle = pinch.highlightColor;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Lineas de estrias de tension superficial internas
          if (dist > 15) {
            ctx.beginPath();
            ctx.moveTo(pinch.originX, pinch.originY);
            ctx.lineTo(currentTx, currentTy);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(p1x * 0.65 + pinch.originX * 0.35, p1y * 0.65 + pinch.originY * 0.35);
            ctx.quadraticCurveTo(cp1x * 0.7 + midX * 0.3, cp1y * 0.7 + midY * 0.3, currentTx, currentTy);
            ctx.moveTo(p2x * 0.65 + pinch.originX * 0.35, p2y * 0.65 + pinch.originY * 0.35);
            ctx.quadraticCurveTo(cp2x * 0.7 + midX * 0.3, cp2y * 0.7 + midY * 0.3, currentTx, currentTy);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }

          // Cuspide del pellizco (pliegue de piel concentrada en la punta de los dedos)
          ctx.save();
          ctx.translate(currentTx, currentTy);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, 5.8, 4.2, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.restore();

          ctx.restore();
        }
      }

      // 3. Dibujar y actualizar ondas de choque (Shockwave Ripples)
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed * dt * 60;
        r.speed *= 0.94; // Desaceleracion radial
        r.alpha -= r.decay * dt * 60;

        if (r.alpha <= 0.005 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        // Anillo de cresta primario
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, r.alpha * 0.75)})`;
        ctx.lineWidth = r.thickness;
        ctx.stroke();

        // Anillo secundario interno de rebote fluido
        if (r.radius > 16) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.74, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, r.alpha * 0.38)})`;
          ctx.lineWidth = r.thickness * 0.65;
          ctx.stroke();
        }

        ctx.restore();
      }

      // 4. Condicion de reposo (suspender bucle para 0% uso de CPU)
      const isPinchActive = pinch.active || pinch.snapProgress > 0.01;
      if (ripples.length === 0 && !glow.active && !isPinchActive) {
        ctx.clearRect(0, 0, width, height);
        animFrameRef.current = null;
        lastTimeRef.current = null;
        return;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
  }, [width, height]);

  const spawnRipple = useCallback(
    (x: number, y: number, intensity = 1.0) => {
      const clampedIntensity = Math.min(1.8, Math.max(0.4, intensity));
      ripplesRef.current.push({
        x,
        y,
        radius: 10,
        maxRadius: 130 * clampedIntensity,
        speed: 3.8 * clampedIntensity,
        alpha: 0.36 * clampedIntensity,
        decay: 0.018 / clampedIntensity,
        thickness: 3.5 * clampedIntensity,
      });

      startLoop();
    },
    [startLoop]
  );

  const setTouchGlow = useCallback(
    (x: number, y: number, active: boolean) => {
      touchGlowRef.current = {x, y, active};
      if (active) {
        startLoop();
      }
    },
    [startLoop]
  );

  const setPinchPull = useCallback(
    (
      originX: number,
      originY: number,
      targetX: number,
      targetY: number,
      active: boolean,
      color = 'rgba(255, 255, 255, 0.45)',
      highlightColor = 'rgba(255, 255, 255, 0.85)'
    ) => {
      const p = pinchRef.current;
      if (active) {
        p.originX = originX;
        p.originY = originY;
        p.targetX = targetX;
        p.targetY = targetY;
        p.active = true;
        p.color = color;
        p.highlightColor = highlightColor;
        p.snapProgress = 0;
      } else {
        if (p.active) {
          p.active = false;
          p.snapProgress = 1;
          p.snapTargetX = targetX;
          p.snapTargetY = targetY;
        }
      }
      startLoop();
    },
    [startLoop]
  );

  useImperativeHandle(
    ref,
    () => ({
      spawnRipple,
      setTouchGlow,
      setPinchPull,
    }),
    [spawnRipple, setTouchGlow, setPinchPull]
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${styles.canvas} ${className}`}
      style={style}
    />
  );
});

CuteTactileCanvas.displayName = 'CuteTactileCanvas';
