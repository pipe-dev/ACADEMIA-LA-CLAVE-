'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {CuteCharacterMorado} from './CuteCharacterMorado';
import {CuteCharacterFucsia} from './CuteCharacterFucsia';
import {
  CuteCharacterFucsiaAnimated,
  CuteCharacterFucsiaAnimatedRef,
} from './CuteCharacterFucsiaAnimated';
import {CuteCharacterAmarillo} from './CuteCharacterAmarillo';
import {CuteCharacterNaranja} from './CuteCharacterNaranja';
import {CuteCharacterBreathe} from './CuteCharacterBreathe';
import {CuteCharacterTactileCage} from './CuteCharacterTactileCage';
import {
  JELLY_PRESET_MORADO,
  JELLY_PRESET_FUCSIA,
  JELLY_PRESET_AMARILLO,
  JELLY_PRESET_NARANJA,
} from './useTactileJellyPhysics';
import {CuteTactileCanvas, CuteTactileCanvasRef} from './CuteTactileCanvas';

export type {CuteCharacterFucsiaAnimatedRef};

export interface CuteCharactersStaticProps {
  className?: string;
  excited?: boolean;
  shy?: boolean;
  typing?: boolean;
  typingProgress?: number;
  animateFucsia?: boolean;
  fucsiaRef?: React.Ref<CuteCharacterFucsiaAnimatedRef>;
}

/**
 * CuteCharactersStatic
 * Escenario de los 4 personajes agrupados, cada uno construido con su HTML/CSS
 * original (public/4personajes) sin alterar medidas, gradientes ni sombras.
 * Cada personaje tiene respiracion sinusoidal viva con parametros asincronos.
 */
const DESIGN_WIDTH = 640;
const DESIGN_HEIGHT = 705;
const DEFAULT_SCALE = 420 / DESIGN_WIDTH;

interface CharacterSlot {
  left: number;
  bottom: number;
  zIndex: number;
  scale: number;
  scaleY?: number;
  origin: string;
  character: React.ReactNode;
}

export const CuteCharactersStatic: React.FC<CuteCharactersStaticProps> = ({
  className = '',
  excited = false,
  shy = false,
  typing = false,
  typingProgress = 0,
  animateFucsia = true,
  fucsiaRef,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [look, setLook] = useState({x: 0, y: 0});

  const handleLook = (e: MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    setLook({x, y});
  };

  const tactileCanvasRef = useRef<CuteTactileCanvasRef>(null);

  const handleRippleTrigger = useCallback(
    (clientX: number, clientY: number, intensity: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const currentScale = rect.width / DESIGN_WIDTH;
      const stageX = (clientX - rect.left) / currentScale;
      const stageY = (clientY - rect.top) / currentScale;
      tactileCanvasRef.current?.spawnRipple(stageX, stageY, intensity);
    },
    []
  );

  const handleTouchPress = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const currentScale = rect.width / DESIGN_WIDTH;
      const stageX = (clientX - rect.left) / currentScale;
      const stageY = (clientY - rect.top) / currentScale;
      tactileCanvasRef.current?.setTouchGlow(stageX, stageY, active);
    },
    []
  );

  const characterSlots: CharacterSlot[] = [
    {
      left: 144.375,
      bottom: 0,
      zIndex: 10,
      scale: 1.04534,
      scaleY: 1.5,
      origin: 'bottom right',
      character: (
        <CuteCharacterTactileCage
          config={JELLY_PRESET_MORADO}
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleTouchPress}
        >
          <CuteCharacterBreathe
            breathDuration={3.1}
            swayDuration={4.3}
            delay={0.8}
            scaleYDelta={0.045}
            scaleXDelta={0.038}
            skewDelta={1.8}
            yDelta={-3.5}
          >
            <CuteCharacterMorado
              typing={typing}
              onDropImpact={() => handleRippleTrigger(260, 480, 1.2)}
            />
          </CuteCharacterBreathe>
        </CuteCharacterTactileCage>
      ),
    },
    {
      left: 294,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom left',
      character: (
        <CuteCharacterTactileCage
          config={JELLY_PRESET_FUCSIA}
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleTouchPress}
        >
          <CuteCharacterBreathe
            breathDuration={2.4}
            swayDuration={3.3}
            delay={0.2}
            scaleYDelta={0.052}
            scaleXDelta={0.042}
            skewDelta={2.2}
            yDelta={-4.5}
          >
            {animateFucsia && fucsiaRef ? (
              <CuteCharacterFucsiaAnimated ref={fucsiaRef} />
            ) : (
              <CuteCharacterFucsia />
            )}
          </CuteCharacterBreathe>
        </CuteCharacterTactileCage>
      ),
    },
    {
      left: 440,
      bottom: 35,
      zIndex: 30,
      scale: 1,
      origin: 'bottom left',
      character: (
        <CuteCharacterTactileCage
          config={JELLY_PRESET_AMARILLO}
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleTouchPress}
        >
          <CuteCharacterBreathe
            breathDuration={1.85}
            swayDuration={2.7}
            delay={1.3}
            scaleYDelta={0.058}
            scaleXDelta={0.046}
            skewDelta={-2.6}
            yDelta={-4.0}
          >
            <CuteCharacterAmarillo typing={typing} shy={shy} />
          </CuteCharacterBreathe>
        </CuteCharacterTactileCage>
      ),
    },
    {
      left: -50,
      bottom: 30.56,
      zIndex: 40,
      scale: 1.408,
      scaleY: 1.472,
      origin: 'bottom left',
      character: (
        <CuteCharacterTactileCage
          config={JELLY_PRESET_NARANJA}
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleTouchPress}
        >
          <CuteCharacterBreathe
            breathDuration={3.5}
            swayDuration={4.7}
            delay={0.5}
            scaleYDelta={0.038}
            scaleXDelta={0.032}
            skewDelta={1.4}
            yDelta={-2.8}
          >
            <CuteCharacterNaranja typing={typing} />
          </CuteCharacterBreathe>
        </CuteCharacterTactileCage>
      ),
    },
  ];

  useEffect(() => {
    window.addEventListener('mousemove', handleLook);
    return () => window.removeEventListener('mousemove', handleLook);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setScale(width / DESIGN_WIDTH);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full select-none ${className}`}
      style={{height: DESIGN_HEIGHT * scale}}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ['--look-x']: look.x,
          ['--look-y']: look.y,
          ['--shy']: shy ? 1 : 0,
          ['--excited']: excited && !shy ? 1 : 0,
          ['--typing']: typing ? 1 : 0,
          ['--typing-progress']: typingProgress,
        } as React.CSSProperties}
      >
        {characterSlots.map((slot, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: slot.left,
              bottom: slot.bottom,
              zIndex: slot.zIndex,
              transform: `scale(${slot.scale}, ${slot.scaleY ?? slot.scale})`,
              transformOrigin: slot.origin,
            }}
          >
            {slot.character}
          </div>
        ))}
        <CuteTactileCanvas
          ref={tactileCanvasRef}
          width={DESIGN_WIDTH}
          height={DESIGN_HEIGHT}
        />
      </div>
    </div>
  );
};
