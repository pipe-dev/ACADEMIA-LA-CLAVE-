'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

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
 * Componente envoltorio de animacion de respiracion organica.
 * Aplica deformaciones sinusoidales suaves (Lissajous) en scaleX, scaleY y skewX
 * ancladas estrictamente a 'bottom center' para que los personajes se sientan
 * vivos y suaves sin despegarse del suelo.
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

    const ctx = gsap.context(() => {
      // 1. Ciclo de respiracion sinusoidal (Inhalar / Exhalar)
      gsap.to(el, {
        scaleY: 1 + scaleYDelta,
        scaleX: 1 - scaleXDelta,
        y: yDelta,
        duration: breathDuration,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay,
      });

      // 2. Ciclo de inclinacion lateral asincrono y ondulacion de gelatina (Lissajous)
      if (skewDelta !== 0) {
        gsap.to(el, {
          skewX: skewDelta,
          rotate: skewDelta * 0.32,
          duration: swayDuration,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: delay + 0.3,
        });
      }
    }, containerRef);

    return () => ctx.revert();
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
