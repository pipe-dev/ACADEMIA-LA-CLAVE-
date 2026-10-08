'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { CuteCharacterFucsia } from './CuteCharacterFucsia';
import { CuteCharacterBreathe } from './CuteCharacterBreathe';

export interface CuteCharacterFucsiaAnimatedRef {
  replay: () => void;
}

interface CuteCharacterFucsiaAnimatedProps {
  autoPlay?: boolean;
  onComplete?: () => void;
}

export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    replay: () => {
      // Animacion de entrada eliminada segun peticion del usuario
    },
  }));

  return (
    <CuteCharacterBreathe
      breathDuration={2.4}
      swayDuration={3.3}
      delay={0.2}
      scaleYDelta={0.024}
      scaleXDelta={0.020}
      skewDelta={0.8}
      yDelta={-2}
    >
      <CuteCharacterFucsia />
    </CuteCharacterBreathe>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
