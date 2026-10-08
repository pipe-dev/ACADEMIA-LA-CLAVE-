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
  mass: 1.2,
  stiffness: 130,
  damping: 9.0,
  volumeFactor: 0.96,
  jiggleFrequency: 20,
  jiggleDamping: 4.8,
  skewFactor: 18,
};

export const JELLY_PRESET_FUCSIA: JellyPhysicsConfig = {
  mass: 0.9,
  stiffness: 150,
  damping: 9.5,
  volumeFactor: 0.98,
  jiggleFrequency: 24,
  jiggleDamping: 5.2,
  skewFactor: 22,
};

export const JELLY_PRESET_AMARILLO: JellyPhysicsConfig = {
  mass: 0.7,
  stiffness: 170,
  damping: 10.0,
  volumeFactor: 0.92,
  jiggleFrequency: 28,
  jiggleDamping: 5.8,
  skewFactor: 16,
};

export const JELLY_PRESET_NARANJA: JellyPhysicsConfig = {
  mass: 1.3,
  stiffness: 140,
  damping: 9.2,
  volumeFactor: 1.02,
  jiggleFrequency: 18,
  jiggleDamping: 4.5,
  skewFactor: 24,
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

      // Jiggle secundario superficial de alta frecuencia con ondulacion de masa
      if (s.jiggleAmp > 0.001) {
        s.jiggleTime += dt;
        s.jiggleAmp *= Math.exp(-config.jiggleDamping * dt);
        const jiggleOffset = s.jiggleAmp * Math.sin(config.jiggleFrequency * s.jiggleTime);
        s.scaleY += jiggleOffset * 0.45;
        s.skewX += jiggleOffset * 4.8;
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
      s.rotate += (0 - s.rotate) * Math.min(1, dt * 16);

      // Condicion de reposo
      const isStillY = Math.abs(s.scaleY - 1) < 0.002 && Math.abs(s.velY) < 0.005;
      const isStillSkew = Math.abs(s.skewX) < 0.04 && Math.abs(s.velSkew) < 0.08;
      const isStillJiggle = s.jiggleAmp < 0.002;
      const isStillRotate = Math.abs(s.rotate) < 0.04;

      if (isStillY && isStillSkew && isStillJiggle && isStillRotate) {
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
        // Hacia abajo: compresion profunda (squash)
        s.scaleY = 1 - Math.tanh(dy / 170) * 0.48;
      } else {
        // Hacia arriba: estiramiento fluido (stretch)
        s.scaleY = 1 + Math.tanh(-dy / 190) * 0.46;
      }

      s.scaleX = 1 + (1 - s.scaleY) * config.volumeFactor;

      const skewFactor = config.skewFactor ?? 20;
      s.skewX = -Math.tanh(dx / 140) * skewFactor;
      s.rotate = Math.tanh(dx / 200) * 4.2;
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

    // Disparar impulso de jiggle vibrante proporcional a la deformacion acumulada
    const deformation = Math.abs(s.scaleY - 1);
    s.jiggleAmp = Math.min(0.42, deformation * 1.5 + 0.14);
    s.jiggleTime = 0;

    // Inercia inicial contraria
    s.velY = (1 - s.scaleY) * 26;
    s.velSkew = -s.skewX * 22;

    startLoop();
  }, [startLoop]);

  const triggerPoke = useCallback(
    (force = 0.25) => {
      const s = stateRef.current;
      s.isDragging = false;
      s.isSettling = true;

      // Impulso de impacto instantaneo con fuerte compresion y temblor gelatinoso
      s.scaleY = Math.max(0.66, 1 - force * 1.3);
      s.scaleX = 1 + force * 1.3 * config.volumeFactor;
      s.velY = -force * 36;
      s.jiggleAmp = force * 1.5;
      s.jiggleTime = 0;

      startLoop();
    },
    [config, startLoop]
  );

  const triggerHover = useCallback((_direction: number) => {}, []);

  const clearHover = useCallback(() => {}, []);

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
