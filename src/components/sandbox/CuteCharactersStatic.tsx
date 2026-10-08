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
 * El grupo se dibuja en un lienzo de 640x705 y se escala al ancho disponible.
 * Escalas por personaje (desde la base, sin mover a los demas):
 * Morado ancho x1.04534 (borde izq. alineado al ojo izq. del Naranja, anclado a la
 * derecha) y alto x1.5, Naranja ancho x1.408 y alto x1.472 (z al frente,
 * anclado izquierda a -50 para que pise lo menos posible a Fucsia/Amarillo),
 * Fucsia y Amarillo x1.
 * Bases alineadas: cada slot lleva un `bottom` en unidades de diseño que compensa
 * (padding-bottom de su .stage) x (scaleY) para que la base plana de los 4 quede
 * a la misma altura del lienzo.
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
    {left: 144.375, bottom: 0, zIndex: 10, scale: 1.04534, scaleY: 1.5, origin: 'bottom right', character: <CuteCharacterMorado />},
    {
      left: 294,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom left',
      character: animateFucsia ? (
        <CuteCharacterFucsiaAnimated ref={fucsiaRef} />
      ) : (
        <CuteCharacterFucsia />
      ),
    },
    {left: 440, bottom: 35, zIndex: 30, scale: 1, origin: 'bottom left', character: <CuteCharacterAmarillo />},
    {left: -50, bottom: 30.56, zIndex: 40, scale: 1.408, scaleY: 1.472, origin: 'bottom left', character: <CuteCharacterNaranja />},
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
