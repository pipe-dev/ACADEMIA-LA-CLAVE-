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
