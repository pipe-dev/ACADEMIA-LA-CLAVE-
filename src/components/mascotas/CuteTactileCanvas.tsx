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

      // 2. Dibujar y actualizar ondas de choque (Shockwave Ripples)
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

      // 3. Condicion de reposo (suspender bucle para 0% uso de CPU)
      if (ripples.length === 0 && !glow.active) {
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

  useImperativeHandle(
    ref,
    () => ({
      spawnRipple,
      setTouchGlow,
    }),
    [spawnRipple, setTouchGlow]
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
