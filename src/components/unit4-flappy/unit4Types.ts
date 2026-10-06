// src/components/unit4-flappy/unit4Types.ts

export type Phase = 'ready' | 'playing' | 'dead' | 'winning';
export type ObType = 'top' | 'bottom';

export interface Obstacle {
  type: ObType;
  x: number;
  len: number; // longitud del tubo (px)
  w: number; // ancho del cuerpo (px)
  gapY: number; // borde que mira al hueco (top del tubo bajo / fondo del tubo alto)
  scores: boolean;
  scored: boolean;
  rivalScored?: boolean;
  alpha: number;
  trophy?: boolean; // pedestal con trofeo (meta de nivel)
}

export interface Bush {
  x: number;
  scale: number;
  sx: number; // estiramiento horizontal (formas variadas)
  seed: number;
  tone: string; // color plano 2D del arbusto
  dark: boolean; // 5% de arbustos más oscuros
  front: boolean; // en frente de los tubos (profundidad) vs detrás
  blobs: { cx: number; cy: number; r: number }[]; // bultos (forma abstracta)
}

export interface BirdState {
  birdY: number;
  vy: number;
  rot: number;
  lastFlap: number;
  wingT: number;
  floatT: number;
}

export interface WinState {
  stage: 'down' | 'return' | 'shake' | 'fly' | 'enter' | 'trophy' | 'hold' | 'center' | 'pan';
  t0: number; // performance.now() al iniciar la etapa
  sx: number; // x del pato al empezar el vuelo
  sy: number; // y del pato al empezar el vuelo
  ex: number; // x del hueco (centro del pedestal)
  ey: number; // y del hueco (base de la columna)
  x: number; // x animada del pato durante la cinemática
  scale: number; // 1..0 al entrar
  alpha: number; // 1..0 al desaparecer
  trophy: number; // 0..1 emergencia del trofeo por la boca superior
  tx: number; // 0..1 avance del trofeo hacia el centro de la pantalla
  tScale: number; // escala del trofeo (1 en la boca → CENTER_SCALE en el centro)
  facing: number; // 1 = mira a la derecha, -1 = mira a la izquierda (volver)
}

export interface FloorSpeck {
  fx: number;
  fy: number;
  w: number;
  h: number;
  dark: boolean;
}

export interface FloorBlade {
  bx0: number;
  len: number;
  lean0: number;
  sway: number;
  tone: string;
}

export interface FloorCaches {
  floorSoilGrad: CanvasGradient | null;
  floorGrassGrad: CanvasGradient | null;
  birdBodyGrad: CanvasGradient | null;
  birdWingGrad: CanvasGradient | null;
  birdBillGrad: CanvasGradient | null;
  floorSpecks: FloorSpeck[];
  floorBlades: FloorBlade[];
}

export interface Meteor {
  x: number;
  y: number;
  vy: number;
}
