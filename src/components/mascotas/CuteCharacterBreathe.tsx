'use client';

import React, { useEffect, useRef } from 'react';
import { animate } from 'motion/react';

export interface CuteCharacterBreatheProps {
  children: React.ReactNode;
  breathDuration?: number; // Tiempo del ciclo de inhalacion/exhalacion en segundos
  swayDuration?: number;   // Tiempo del ciclo de bamboleo lateral en segundos
  delay?: number;          // Desfase inicial de inicio para asincronia
  scaleYDelta?: number;    // Amplitud de expansion vertical
  scaleXDelta?: number;    // Amplitud de contraccion horizontal (conservacion de volumen)
  skewDelta?: number;      // Amplitud de inclinacion organica en grados
  yDelta?: number;         // Micro-elevacion durante la inhalacion en pixeles
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CuteCharacterBreathe
 * Componente envoltorio de animacion de respiracion organica para mascotas.
 * Aplica deformaciones sinusoidales suaves (Lissajous) en scaleX, scaleY y skewX
 * ancladas a 'bottom center' con motion/react nativo.
 */
export const CuteCharacterBreathe: React.FC<CuteCharacterBreatheProps> = ({
  children,
  breathDuration = 2.4,
  swayDuration = 3.3,
  delay = 0,
  scaleYDelta = 0.024,
  scaleXDelta = 0.020,
  skewDelta = 0.8,
  yDelta = -2,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const anim1 = animate(
      el,
      {
        scaleY: [1, 1 + scaleYDelta],
        scaleX: [1, 1 - scaleXDelta],
        y: [0, yDelta],
      },
      {
        duration: breathDuration,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
        delay,
      }
    );

    let anim2: { stop: () => void } | null = null;
    if (skewDelta !== 0) {
      anim2 = animate(
        el,
        {
          skewX: [0, skewDelta],
          rotate: [0, skewDelta * 0.32],
        },
        {
          duration: swayDuration,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
          delay: delay + 0.3,
        }
      );
    }

    return () => {
      anim1.stop();
      anim2?.stop();
    };
  }, [breathDuration, swayDuration, delay, scaleYDelta, scaleXDelta, skewDelta, yDelta]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transformOrigin: 'bottom center',
        willChange: 'transform',
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
