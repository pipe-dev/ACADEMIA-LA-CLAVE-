'use client';

import React, {useEffect, useRef, useState} from 'react';
import {CuteCharacterMorado} from './CuteCharacterMorado';
import {CuteCharacterFucsia} from './CuteCharacterFucsia';
import {
  CuteCharacterFucsiaAnimated,
  CuteCharacterFucsiaAnimatedRef,
} from './CuteCharacterFucsiaAnimated';
import {CuteCharacterAmarillo} from './CuteCharacterAmarillo';
import {CuteCharacterNaranja} from './CuteCharacterNaranja';
import {CuteCharacterBreathe} from './CuteCharacterBreathe';

export type {CuteCharacterFucsiaAnimatedRef};

export interface CuteCharactersStaticProps {
  className?: string;
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
  animateFucsia = true,
  fucsiaRef,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  const characterSlots: CharacterSlot[] = [
    {
      left: 144.375,
      bottom: 0,
      zIndex: 10,
      scale: 1.04534,
      scaleY: 1.5,
      origin: 'bottom right',
      character: (
        <CuteCharacterBreathe
          breathDuration={3.1}
          swayDuration={4.3}
          delay={0.8}
          scaleYDelta={0.016}
          scaleXDelta={0.013}
          skewDelta={0.5}
          yDelta={-1.5}
        >
          <CuteCharacterMorado />
        </CuteCharacterBreathe>
      ),
    },
    {
      left: 294,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom left',
      character: (
        <CuteCharacterBreathe
          breathDuration={2.4}
          swayDuration={3.3}
          delay={0.2}
          scaleYDelta={0.024}
          scaleXDelta={0.020}
          skewDelta={0.8}
          yDelta={-2}
        >
          {animateFucsia && fucsiaRef ? (
            <CuteCharacterFucsiaAnimated ref={fucsiaRef} />
          ) : (
            <CuteCharacterFucsia />
          )}
        </CuteCharacterBreathe>
      ),
    },
    {
      left: 440,
      bottom: 35,
      zIndex: 30,
      scale: 1,
      origin: 'bottom left',
      character: (
        <CuteCharacterBreathe
          breathDuration={1.85}
          swayDuration={2.7}
          delay={1.3}
          scaleYDelta={0.030}
          scaleXDelta={0.025}
          skewDelta={-1.0}
          yDelta={-1.8}
        >
          <CuteCharacterAmarillo />
        </CuteCharacterBreathe>
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
        <CuteCharacterBreathe
          breathDuration={3.5}
          swayDuration={4.7}
          delay={0.5}
          scaleYDelta={0.015}
          scaleXDelta={0.012}
          skewDelta={0.4}
          yDelta={-1.2}
        >
          <CuteCharacterNaranja />
        </CuteCharacterBreathe>
      ),
    },
  ];

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
        }}
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
      </div>
    </div>
  );
};
