'use client';

import React from 'react';
import { CuteCharacterNaranja, CuteCharacterNaranjaRef } from '../CuteCharacterNaranja';
import { CuteCharacterBreathe } from '../CuteCharacterBreathe';

export interface CharacterNaranjaProps {
  typing?: boolean;
  error?: boolean;
  blink?: boolean;
  className?: string;
}

/** Naranja standalone: respiracion asincrona + personaje, sin escenario ni canvas. */
export const CharacterNaranja = React.forwardRef<
  CuteCharacterNaranjaRef,
  CharacterNaranjaProps
>(({ typing = false, error = false, blink = false, className }, ref) => (
  <CuteCharacterBreathe
    breathDuration={3.5}
    swayDuration={4.7}
    delay={0.5}
    scaleYDelta={0.038}
    scaleXDelta={0.032}
    skewDelta={1.4}
    yDelta={-2.8}
    className={className}
  >
    <CuteCharacterNaranja ref={ref} typing={typing} error={error} blink={blink} />
  </CuteCharacterBreathe>
));

CharacterNaranja.displayName = 'CharacterNaranja';

export type { CuteCharacterNaranjaRef };