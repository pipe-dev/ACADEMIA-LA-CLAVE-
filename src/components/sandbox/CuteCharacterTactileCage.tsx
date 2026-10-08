'use client';

import React, {useCallback, useRef} from 'react';
import {
  JellyPhysicsConfig,
  useTactileJellyPhysics,
} from './useTactileJellyPhysics';
import styles from './CuteCharacterTactileCage.module.css';

export interface PinchEventData {
  originClientX: number;
  originClientY: number;
  currentClientX: number;
  currentClientY: number;
  localOriginX: number;
  localOriginY: number;
  localCurrentX: number;
  localCurrentY: number;
}

export interface CuteCharacterTactileCageProps {
  children: React.ReactNode;
  config: JellyPhysicsConfig;
  onRippleTrigger?: (originX: number, originY: number, intensity: number) => void;
  onTouchPress?: (x: number, y: number, active: boolean) => void;
  onPinchMove?: (data: PinchEventData) => void;
  onPinchRelease?: (data: PinchEventData) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CuteCharacterTactileCage: React.FC<CuteCharacterTactileCageProps> = ({
  children,
  config,
  onRippleTrigger,
  onTouchPress,
  onPinchMove,
  onPinchRelease,
  className = '',
  style = {},
}) => {
  const cageRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    localX: number;
    localY: number;
    time: number;
  } | null>(null);

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

      const coords = getLocalCoords(e.clientX, e.clientY);
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        localX: coords.x,
        localY: coords.y,
        time: performance.now(),
      };

      startDrag(e.clientX, e.clientY);
      onTouchPress?.(e.clientX, e.clientY, true);
    },
    [getLocalCoords, startDrag, onTouchPress]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const coords = getLocalCoords(e.clientX, e.clientY);

      if (dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.clientX;
        const dy = e.clientY - dragStartRef.current.clientY;
        updateDrag(dx, dy);
        onTouchPress?.(e.clientX, e.clientY, true);
        onPinchMove?.({
          originClientX: dragStartRef.current.clientX,
          originClientY: dragStartRef.current.clientY,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
          localOriginX: dragStartRef.current.localX,
          localOriginY: dragStartRef.current.localY,
          localCurrentX: coords.x,
          localCurrentY: coords.y,
        });
      } else if (coords.width > 0) {
        // Hover: direccion normalizada de -1 (izq) a 1 (der)
        const dir = (coords.x - coords.width / 2) / (coords.width / 2);
        triggerHover(dir);
      }
    },
    [getLocalCoords, updateDrag, triggerHover, onTouchPress, onPinchMove]
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
      const coords = getLocalCoords(e.clientX, e.clientY);

      if (dragStartRef.current) {
        const duration = performance.now() - dragStartRef.current.time;
        const dist = Math.hypot(
          e.clientX - dragStartRef.current.clientX,
          e.clientY - dragStartRef.current.clientY
        );

        onPinchRelease?.({
          originClientX: dragStartRef.current.clientX,
          originClientY: dragStartRef.current.clientY,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
          localOriginX: dragStartRef.current.localX,
          localOriginY: dragStartRef.current.localY,
          localCurrentX: coords.x,
          localCurrentY: coords.y,
        });

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
    [
      getLocalCoords,
      onTouchPress,
      onPinchRelease,
      triggerPoke,
      releaseDrag,
      onRippleTrigger,
    ]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const coords = getLocalCoords(e.clientX, e.clientY);
      if (dragStartRef.current) {
        onPinchRelease?.({
          originClientX: dragStartRef.current.clientX,
          originClientY: dragStartRef.current.clientY,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
          localOriginX: dragStartRef.current.localX,
          localOriginY: dragStartRef.current.localY,
          localCurrentX: coords.x,
          localCurrentY: coords.y,
        });
      }
      dragStartRef.current = null;
      onTouchPress?.(coords.x, coords.y, false);
      releaseDrag();
    },
    [getLocalCoords, onPinchRelease, onTouchPress, releaseDrag]
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
      {children}
    </div>
  );
};
