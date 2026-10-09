'use client';

import React from 'react';
import { CuteCharacterAmarillo } from '../CuteCharacterAmarillo';
import { CuteCharacterBreathe } from '../CuteCharacterBreathe';

export interface CharacterAmarilloProps {
  typing?: boolean;
  shy?: boolean;
  error?: boolean;
  blink?: boolean;
  wink?: boolean;
  className?: string;
}

/** Amarillo standalone: respiracion asincrona + personaje, sin escenario ni canvas. */
export const CharacterAmarillo: React.FC<CharacterAmarilloProps> = ({
  typing = false,
  shy = false,
  error = false,
  blink = false,
  wink = false,
  className,
}) => (
  <CuteCharacterBreathe
    breathDuration={1.85}
    swayDuration={2.7}
    delay={1.3}
    scaleYDelta={0.058}
    scaleXDelta={0.046}
    skewDelta={-2.6}
    yDelta={-4.0}
    className={className}
  >
    <CuteCharacterAmarillo
      typing={typing}
      shy={shy}
      error={error}
      blink={blink}
      wink={wink}
    />
  </CuteCharacterBreathe>
);