'use client';

import React from 'react';
import { CuteCharacterFucsia, CuteCharacterFucsiaRef } from '../CuteCharacterFucsia';
import { CuteCharacterFucsiaAnimated, CuteCharacterFucsiaAnimatedRef } from '../CuteCharacterFucsiaAnimated';
import { CuteCharacterBreathe } from '../CuteCharacterBreathe';

export interface CharacterFucsiaProps {
  error?: boolean;
  blink?: boolean;
  className?: string;
  /** Usa la variante animada (con ref de replay) en lugar del estatico. */
  animate?: boolean;
  animatedRef?: React.Ref<CuteCharacterFucsiaAnimatedRef>;
  fucsiaRef?: React.Ref<CuteCharacterFucsiaRef>;
}

/** Fucsia standalone: respiracion asincrona + personaje, sin escenario ni canvas. */
export const CharacterFucsia: React.FC<CharacterFucsiaProps> = ({
  error = false,
  blink = false,
  className,
  animate = false,
  animatedRef,
  fucsiaRef,
}) => (
  <CuteCharacterBreathe
    breathDuration={2.4}
    swayDuration={3.3}
    delay={0.2}
    scaleYDelta={0.052}
    scaleXDelta={0.042}
    skewDelta={2.2}
    yDelta={-4.5}
    className={className}
  >
    {animate ? (
      <CuteCharacterFucsiaAnimated ref={animatedRef} />
    ) : (
      <CuteCharacterFucsia ref={fucsiaRef} error={error} blink={blink} />
    )}
  </CuteCharacterBreathe>
);

export type { CuteCharacterFucsiaAnimatedRef, CuteCharacterFucsiaRef };