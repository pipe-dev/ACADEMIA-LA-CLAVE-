// src/components/unit3-bomb/types.ts

export type BombCinematicState =
  | 'IDLE'
  | 'DEFUSING'
  | 'MISCUT_PENALTY'
  | 'DEFUSED_SLOWMO'
  | 'PNEUMATIC_RELEASE'
  | 'UNLATCHING'
  | 'HATCH_OPENING'
  | 'TROPHY_REVEAL'
  | 'TIMEOUT_PUFF';

export interface CableCurvePiece {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export interface BombCable {
  id: number;
  label: string;
  name: string;
  color: string;
  strokeColor: string;
  glowColor: string;
  isCut: boolean;
  cutTime?: number;
  cutX?: number;
  cutY?: number;
  // Normalized Y position on canvas (e.g. 0.25, 0.42, 0.58, 0.75)
  anchorY: number;
  // Dynamic Bézier pieces when severed
  leftPiece?: CableCurvePiece;
  rightPiece?: CableCurvePiece;
}

export interface SlicePoint {
  x: number;
  y: number;
  time: number;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
}
