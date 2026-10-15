'use client';

import React from 'react';
import { CuteCharacterMorado } from '../CuteCharacterMorado';
import { CuteCharacterBreathe } from '../CuteCharacterBreathe';

export interface CharacterMoradoProps {
  typing?: boolean;
  error?: boolean;
  blink?: boolean;
  className?: string;
}

/** Morado standalone: respiracion asincrona + personaje, sin escenario ni canvas. */
export const CharacterMorado: React.FC<CharacterMoradoProps> = ({
  typing = false,
  error = false,
  blink = false,
  className,
}) => (
  <CuteCharacterBreathe
    breathDuration={3.1}
    swayDuration={4.3}
    delay={0.8}
    scaleYDelta={0.045}
    scaleXDelta={0.038}
    skewDelta={1.8}
    yDelta={-3.5}
    className={className}
  >
    <CuteCharacterMorado typing={typing} error={error} blink={blink} />
  </CuteCharacterBreathe>
);