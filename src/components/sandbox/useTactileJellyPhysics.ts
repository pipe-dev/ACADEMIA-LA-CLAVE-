'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

export interface JellyPhysicsConfig {
  mass: number;
  stiffness: number;
  damping: number;
  volumeFactor: number;
  jiggleFrequency: number;
  jiggleDamping: number;
  skewFactor?: number;
}

export interface JellyTransformState {
  scaleX: number;
  scaleY: number;
  skewX: number;
  rotate: number;
  offsetY: number;
  isInteracting: boolean;
  isSettling: boolean;
}

export const JELLY_PRESET_MORADO: JellyPhysicsConfig = {
  mass: 1.35,
  stiffness: 180,
  damping: 14,
  volumeFactor: 0.85,
  jiggleFrequency: 24,
  jiggleDamping: 8,
  skewFactor: 11,
};

export const JELLY_PRESET_FUCSIA: JellyPhysicsConfig = {
  mass: 0.95,
  stiffness: 240,
  damping: 16,
  volumeFactor: 0.88,
  jiggleFrequency: 30,
  jiggleDamping: 9,
  skewFactor: 14,
};

export const JELLY_PRESET_AMARILLO: JellyPhysicsConfig = {
  mass: 0.75,
  stiffness: 280,
  damping: 18,
  volumeFactor: 0.80,
  jiggleFrequency: 36,
  jiggleDamping: 11,
  skewFactor: 10,
};

export const JELLY_PRESET_NARANJA: JellyPhysicsConfig = {
  mass: 1.45,
  stiffness: 200,
  damping: 15,
  volumeFactor: 0.92,
  jiggleFrequency: 22,
  jiggleDamping: 7,
  skewFactor: 16,
};

export function useTactileJellyPhysics(config: JellyPhysicsConfig) {
  const [transform, setTransform] = useState<JellyTransformState>({
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    rotate: 0,
    offsetY: 0,
    isInteracting: false,
    isSettling: false,
  });

  const stateRef = useRef({
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    rotate: 0,
    offsetY: 0,
    velY: 0,
    velSkew: 0,
    jiggleAmp: 0,
    jiggleTime: 0,
    isDragging: false,
    isSettling: false,
    hoverLean: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const startLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const last = lastTimeRef.current ?? now;
      const dt = Math.min((now - last) / 1000, 0.033);
      lastTimeRef.current = now;

      const s = stateRef.current;

      if (s.isDragging) {
        // En arrastre activo: la transformacion ya fue calculada en updateDrag
        setTransform({
          scaleX: s.scaleX,
          scaleY: s.scaleY,
          skewX: s.skewX,
          rotate: s.rotate,
          offsetY: s.offsetY,
          isInteracting: true,
          isSettling: false,
        });
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Simulacion de oscilador armonico amortiguado (resorte de segundo orden)
      const displacementY = s.scaleY - 1;
      const springForceY = -config.stiffness * displacementY;
      const dampingForceY = -config.damping * s.velY;
      const accelY = (springForceY + dampingForceY) / config.mass;

      s.velY += accelY * dt;
      s.scaleY += s.velY * dt;

      // Jiggle secundario superficial de alta frecuencia
      if (s.jiggleAmp > 0.001) {
        s.jiggleTime += dt;
        s.jiggleAmp *= Math.exp(-config.jiggleDamping * dt);
        const jiggleOffset = s.jiggleAmp * Math.sin(config.jiggleFrequency * s.jiggleTime);
        s.scaleY += jiggleOffset * 0.25;
      }

      // Compensacion volumetrica con desfase de masa (oleaje fluido asincrono)
      const targetScaleX = 1 + (1 - s.scaleY) * config.volumeFactor;
      s.scaleX += (targetScaleX - s.scaleX) * Math.min(1, dt * 28);

      // Oscilacion lateral (skew / cizallamiento)
      const springForceSkew = -config.stiffness * 0.7 * s.skewX;
      const dampingForceSkew = -config.damping * 1.1 * s.velSkew;
      const accelSkew = (springForceSkew + dampingForceSkew) / config.mass;

      s.velSkew += accelSkew * dt;
      s.skewX += s.velSkew * dt;

      // Retorno suave de rotacion
      s.rotate += (s.hoverLean - s.rotate) * Math.min(1, dt * 14);

      // Condicion de reposo
      const isStillY = Math.abs(s.scaleY - 1) < 0.002 && Math.abs(s.velY) < 0.005;
      const isStillSkew = Math.abs(s.skewX) < 0.04 && Math.abs(s.velSkew) < 0.08;
      const isStillJiggle = s.jiggleAmp < 0.002;
      const isStillHover = Math.abs(s.rotate - s.hoverLean) < 0.04;

      if (isStillY && isStillSkew && isStillJiggle && isStillHover && s.hoverLean === 0) {
        s.scaleX = 1;
        s.scaleY = 1;
        s.skewX = 0;
        s.rotate = 0;
        s.offsetY = 0;
        s.velY = 0;
        s.velSkew = 0;
        s.jiggleAmp = 0;
        s.isSettling = false;

        setTransform({
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          rotate: 0,
          offsetY: 0,
          isInteracting: false,
          isSettling: false,
        });

        animFrameRef.current = null;
        lastTimeRef.current = null;
        return;
      }

      setTransform({
        scaleX: s.scaleX,
        scaleY: s.scaleY,
        skewX: s.skewX,
        rotate: s.rotate,
        offsetY: s.offsetY,
        isInteracting: false,
        isSettling: true,
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [config]);

  const startDrag = useCallback(
    (_x: number, _y: number) => {
      const s = stateRef.current;
      s.isDragging = true;
      s.isSettling = false;
      s.velY = 0;
      s.velSkew = 0;
      s.jiggleAmp = 0;
      startLoop();
    },
    [startLoop]
  );

  const updateDrag = useCallback(
    (dx: number, dy: number) => {
      const s = stateRef.current;
      if (!s.isDragging) return;

      // Resistencia elastica no lineal (rubber-band)
      if (dy > 0) {
        // Hacia abajo: compresion (squash)
        s.scaleY = 1 - Math.tanh(dy / 220) * 0.42;
      } else {
        // Hacia arriba: estiramiento (stretch)
        s.scaleY = 1 + Math.tanh(-dy / 260) * 0.38;
      }

      s.scaleX = 1 + (1 - s.scaleY) * config.volumeFactor;

      const skewFactor = config.skewFactor ?? 12;
      s.skewX = -Math.tanh(dx / 180) * skewFactor;
      s.rotate = Math.tanh(dx / 240) * 3.5;
      s.offsetY = dy * 0.08;
    },
    [config]
  );

  const releaseDrag = useCallback(() => {
    const s = stateRef.current;
    if (!s.isDragging) return;

    s.isDragging = false;
    s.isSettling = true;
    s.offsetY = 0;

    // Disparar impulso de jiggle proporcional a la deformacion acumulada
    const deformation = Math.abs(s.scaleY - 1);
    s.jiggleAmp = Math.min(0.22, deformation * 0.75 + 0.04);
    s.jiggleTime = 0;

    // Inercia inicial contraria
    s.velY = (1 - s.scaleY) * 22;
    s.velSkew = -s.skewX * 18;

    startLoop();
  }, [startLoop]);

  const triggerPoke = useCallback(
    (force = 0.22) => {
      const s = stateRef.current;
      s.isDragging = false;
      s.isSettling = true;

      // Impulso de impacto instantaneo hacia abajo
      s.scaleY = Math.max(0.72, 1 - force);
      s.scaleX = 1 + force * config.volumeFactor;
      s.velY = -force * 28;
      s.jiggleAmp = force * 0.85;
      s.jiggleTime = 0;

      startLoop();
    },
    [config, startLoop]
  );

  const triggerHover = useCallback(
    (direction: number) => {
      const s = stateRef.current;
      if (s.isDragging) return;
      s.hoverLean = Math.max(-2, Math.min(2, direction * 1.8));
      startLoop();
    },
    [startLoop]
  );

  const clearHover = useCallback(() => {
    const s = stateRef.current;
    s.hoverLean = 0;
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    state: transform,
    startDrag,
    updateDrag,
    releaseDrag,
    triggerPoke,
    triggerHover,
    clearHover,
  };
}
