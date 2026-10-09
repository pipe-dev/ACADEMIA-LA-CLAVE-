'use client';

import React, {useCallback, useRef} from 'react';
import {
  JellyPhysicsConfig,
  useTactileJellyPhysics,
} from './useTactileJellyPhysics';
import styles from './CuteCharacterTactileCage.module.css';

export interface TactileWaveState {
  waveAmp: number;
  wavePhase: number;
  isInteracting: boolean;
  stretch: number;
}

export const TactileWaveContext = React.createContext<TactileWaveState>({
  waveAmp: 0,
  wavePhase: 0,
  isInteracting: false,
  stretch: 0,
});

export const useTactileWave = () => React.useContext(TactileWaveContext);

export interface CuteCharacterTactileCageProps {
  children: React.ReactNode;
  config: JellyPhysicsConfig;
  onRippleTrigger?: (originX: number, originY: number, intensity: number) => void;
  onTouchPress?: (x: number, y: number, active: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CuteCharacterTactileCage: React.FC<CuteCharacterTactileCageProps> = ({
  children,
  config,
  onRippleTrigger,
  onTouchPress,
  className = '',
  style = {},
}) => {
  const cageRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{x: number; y: number; time: number} | null>(null);

  const {
    state,
    startDrag,
    updateDrag,
    releaseDrag,
    triggerPoke,
    triggerHover,
    clearHover,
  } = useTactileJellyPhysics(config);

  const getLocalCoords = useCallback((clientX: number, clientY: number) => {
    const el = cageRef.current;
    if (!el) return {x: 0, y: 0, width: 0, height: 0};
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Evitar propagacion para aislar al personaje seleccionado
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignorar si no soporta captura de puntero
      }

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
      };

      startDrag(e.clientX, e.clientY);
      onTouchPress?.(e.clientX, e.clientY, true);
    },
    [startDrag, onTouchPress]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const coords = getLocalCoords(e.clientX, e.clientY);

      if (dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        updateDrag(dx, dy);
        onTouchPress?.(e.clientX, e.clientY, true);
      } else if (coords.width > 0) {
        // Hover: direccion normalizada de -1 (izq) a 1 (der)
        const dir = (coords.x - coords.width / 2) / (coords.width / 2);
        triggerHover(dir);
      }
    },
    [getLocalCoords, updateDrag, triggerHover, onTouchPress]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignorar
      }

      onTouchPress?.(e.clientX, e.clientY, false);

      if (dragStartRef.current) {
        const duration = performance.now() - dragStartRef.current.time;
        const dist = Math.hypot(
          e.clientX - dragStartRef.current.x,
          e.clientY - dragStartRef.current.y
        );

        if (duration < 240 && dist < 14) {
          // Tap / Poke directo
          triggerPoke(0.24);
          onRippleTrigger?.(e.clientX, e.clientY, 1.0);
        } else {
          // Suelta de arrastre elastico
          releaseDrag();
          if (dist > 18) {
            const intensity = Math.min(1.4, Math.max(0.4, dist / 90));
            onRippleTrigger?.(e.clientX, e.clientY, intensity);
          }
        }
      } else {
        releaseDrag();
      }

      dragStartRef.current = null;
    },
    [onTouchPress, triggerPoke, releaseDrag, onRippleTrigger]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragStartRef.current = null;
      const coords = getLocalCoords(e.clientX, e.clientY);
      onTouchPress?.(coords.x, coords.y, false);
      releaseDrag();
    },
    [getLocalCoords, onTouchPress, releaseDrag]
  );

  const handlePointerLeave = useCallback(() => {
    if (!dragStartRef.current) {
      clearHover();
    }
  }, [clearHover]);

  const isActive = state.isInteracting || state.isSettling;
  const transformStyle: React.CSSProperties = isActive
    ? {
        transform: `translate3d(0, ${state.offsetY}px, 0) scale3d(${state.scaleX}, ${state.scaleY}, 1) skewX(${state.skewX}deg) rotateZ(${state.rotate}deg)`,
        transformOrigin: '50% 100%',
        willChange: 'transform',
      }
    : {
        transformOrigin: '50% 100%',
      };

  return (
    <div
      ref={cageRef}
      className={`${styles.cage} ${className}`}
      style={{...style, ...transformStyle}}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
    >
      <TactileWaveContext.Provider
        value={{
          waveAmp: state.waveAmp ?? 0,
          wavePhase: state.wavePhase ?? 0,
          isInteracting: state.isInteracting,
          stretch: state.scaleY - 1,
        }}
      >
        {children}
      </TactileWaveContext.Provider>
    </div>
  );
};
