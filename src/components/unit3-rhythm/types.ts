// src/components/unit3-rhythm/types.ts

export type RhythmBeatState =
  | 'IDLE'
  | 'PULSE_1'
  | 'PULSE_2'
  | 'PULSE_3'
  | 'BUILDUP'
  | 'GOLDEN_PULSE'
  | 'SLOWMO_CUT'
  | 'TROPHY_REVEAL';

export interface SphereHemisphere {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export interface SeveredPiece {
  id: number;
  type: 'purple' | 'golden';
  x: number;
  y: number;
  vx: number;
  vy: number;
  cutAngle: number;
  pieceSide: 'top' | 'bottom';
  rotation: number;
  vRot: number;
  alpha: number;
  bouncesLeft: number; // 2 (in air before bounce 1), 1 (between bounce 1 and 2), 0 (exiting screen)
}

export interface ActiveSphere {
  id: number;
  type: 'purple' | 'golden';
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  g: number;
  isCut: boolean;
  birthTime: number;
  peakTime: number; // Cenit exacto en el beat (ms)
  bounceCount: number; // incremented on each drum bounce
  leftPiece?: SphereHemisphere;
  rightPiece?: SphereHemisphere;
}

export interface DrumWave {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface StarSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export interface SlicePoint {
  x: number;
  y: number;
  time: number;
}
