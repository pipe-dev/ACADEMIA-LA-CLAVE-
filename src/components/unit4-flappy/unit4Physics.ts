// src/components/unit4-flappy/unit4Physics.ts

import { Bush, ObType, Obstacle } from './unit4Types';
import {
  BASE_CROSS_TIME,
  BASE_INTERVAL,
  BIRD_R,
  BUSH_TONES,
  CENTER_DUR,
  CENTER_SCALE,
  DOWN_DUR,
  DOWN_FALL,
  ENTER_DUR,
  FLY_DUR,
  INTERVAL_STEP,
  MIN_INTERVAL,
  PEDESTAL_W,
  PIPE_BODY_W,
  PROGRESS_EVERY,
  SHAKE_DUR,
  SHOW_DUR,
  SPAWN_MARGIN,
  TROPHY_DUR,
  floorY,
} from './unit4Config';

export const speedMult = (score: number) => {
  const step = Math.floor(score / PROGRESS_EVERY);
  return Math.pow(step >= 1 ? 1.07 : 1.05, step);
};

export const interval = (score: number) =>
  Math.max(
    MIN_INTERVAL,
    BASE_INTERVAL - INTERVAL_STEP * Math.floor(score / PROGRESS_EVERY)
  );

export const moveSpeed = (width: number, height: number, score: number) =>
  ((width + 40 + 0.35 * height) / BASE_CROSS_TIME) * speedMult(score);

export const gapShrink = (score: number) =>
  Math.min(0.06, Math.floor(score / PROGRESS_EVERY) * 0.02);

export const wobAt = (
  x: number,
  t: number,
  width: number,
  groundScroll: number
) => {
  const px = ((x + groundScroll) % width + width) % width;
  const k = (2 * Math.PI) / width;
  return (
    Math.sin(px * k * 1 + t * 1.2) * 4 +
    Math.sin(px * k * 3 + t * 0.7) * 5 +
    Math.sin(px * k * 6 + t * 2.1) * 3.5
  );
};

export const spawnBush = (initialX: number): Bush => {
  const seed = Math.floor(Math.random() * 100000);
  let sseed = seed;
  const rnd = () => {
    sseed = (sseed * 16807) % 2147483647;
    return sseed / 2147483647;
  };
  const n = 3 + Math.floor(rnd() * 4); // 3..6 bultos → cada forma es distinta
  const blobs: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    blobs.push({
      cx: 0.12 + rnd() * 0.76,
      cy: -(0.15 + rnd() * 0.35),
      r: 0.22 + rnd() * 0.22,
    });
  }
  return {
    x: initialX,
    scale: (0.4 + Math.random() * 0.6) * 0.85 * 0.85, // otro 15% más pequeños
    sx: 0.8 + Math.random() * 0.5,
    seed,
    tone: BUSH_TONES[Math.floor(rnd() * BUSH_TONES.length)],
    dark: Math.random() < 0.05, // 5% más oscuros vs 95% normales
    front: Math.random() < 0.18, // evento raro (~18%), no una mezcla constante
    blobs,
  };
};

export const makeObstacle = (
  t: ObType,
  x: number,
  len: number,
  gapY: number,
  height: number
): Obstacle => {
  return {
    type: t,
    x,
    len,
    w: PIPE_BODY_W(height),
    gapY,
    scores: t === 'bottom',
    scored: false,
    rivalScored: false,
    alpha: 0,
  };
};

export const spawnObstacles = (
  width: number,
  height: number,
  score: number
): Obstacle[] => {
  const x = width + SPAWN_MARGIN;
  const gap = height * (0.36 - gapShrink(score) + Math.random() * 0.12);
  const gapCenter = height * (0.4 + Math.random() * 0.2); // 0.40..0.60 H
  const gapTop = gapCenter - gap / 2;
  const gapBottom = gapCenter + gap / 2;

  return [
    makeObstacle('bottom', x, floorY(height) - gapBottom, gapBottom, height),
    makeObstacle('top', x, gapTop, gapTop, height),
  ];
};

export const spawnMilestone = (width: number, height: number): Obstacle => {
  return {
    type: 'bottom',
    x: width + SPAWN_MARGIN,
    len: 0,
    w: PEDESTAL_W(height),
    gapY: 0,
    scores: false,
    scored: false,
    alpha: 0,
    trophy: true,
  };
};

export const easeInOut = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

export const updateWin = (
  win: import('./unit4Types').WinState,
  bird: import('./unit4Types').BirdState,
  dt: number,
  now: number,
  height: number
) => {
  bird.wingT += dt * 1.7;
  const st = (now - win.t0) / 1000;

  if (win.stage === 'down') {
    // El meteorito tumbó al pato: cae al piso y se queda aturdido viendo
    // estrellas (igual que al chocar con la tubería) antes de levantarse.
    const restY = floorY(height) - BIRD_R(height);
    const pf = Math.min(1, st / DOWN_FALL);
    bird.birdY = win.sy + (restY - win.sy) * pf * pf; // caída con gravedad
    bird.rot += (0 - bird.rot) * Math.min(1, dt * 10);
    win.facing = -1;
    if (st >= DOWN_DUR) {
      win.stage = 'return';
      win.t0 = now;
    }
  } else if (win.stage === 'return') {
    // El mundo lo mueve la componente (la cámara sigue al pato de vuelta a la
    // tubería dorada). Aquí el pato se endereza con una voltereta y se alinea
    // con la boca para entrar.
    const targetY = win.ey - height * 0.03;
    bird.birdY += (targetY - bird.birdY) * Math.min(1, dt * 4);
    bird.rot += (-Math.PI * 2 - bird.rot) * Math.min(1, dt * 2.2);
    win.facing = -1; // regresa mirando a la izquierda
  } else if (win.stage === 'shake') {
    bird.birdY = win.sy + Math.sin(now * 0.038) * height * 0.013;
    win.x = win.sx + Math.sin(now * 0.057) * height * 0.008;
    bird.rot = Math.sin(now * 0.03) * 0.55 + Math.sin(now * 0.11) * 0.18;
    if (st >= SHAKE_DUR) {
      win.stage = 'fly';
      win.t0 = now;
      win.sx = win.x;
      win.sy = bird.birdY;
    }
  } else if (win.stage === 'fly') {
    const e = easeInOut(Math.min(1, st / FLY_DUR));
    win.x = win.sx + (win.ex - win.sx) * e;
    bird.birdY =
      win.sy +
      (win.ey - win.sy) * e +
      Math.sin(Math.PI * Math.min(1, st / FLY_DUR)) * height * 0.045;
    bird.rot = 0.35 * (1 - e) - 0.18 * e;
    if (st >= FLY_DUR) {
      win.stage = 'enter';
      win.t0 = now;
    }
  } else if (win.stage === 'enter') {
    const p = Math.min(1, st / ENTER_DUR);
    win.facing = 1; // ya girado, entra mirando a la derecha
    win.scale = 1 - p;
    win.alpha = 1 - p;
    win.x = win.ex + height * 0.012 * p;
    bird.birdY = win.ey - height * 0.004;
    bird.rot = -0.1;
    if (st >= ENTER_DUR) {
      win.stage = 'trophy';
      win.t0 = now;
    }
  } else if (win.stage === 'trophy') {
    const p = Math.min(1, st / TROPHY_DUR);
    win.trophy = easeOutBack(p);
    if (st >= TROPHY_DUR) {
      win.stage = 'hold';
      win.t0 = now;
      win.trophy = 1;
    }
  } else if (win.stage === 'hold') {
    // La copa se queda ~1s descansando sobre la boca superior
    win.trophy = 1;
    if (st >= SHOW_DUR) {
      win.stage = 'center';
      win.t0 = now;
    }
  } else if (win.stage === 'center') {
    // Viaja al centro creciendo; el mundo empieza a correr al llegar
    win.trophy = 1;
    const e = easeInOut(Math.min(1, st / CENTER_DUR));
    win.tx = e;
    win.tScale = 1 + (CENTER_SCALE - 1) * e;
    if (st >= CENTER_DUR) {
      win.tx = 1;
      win.tScale = CENTER_SCALE;
      win.stage = 'pan';
      win.t0 = now;
    }
  } else if (win.stage === 'pan') {
    // El mundo se corre (lo maneja el componente) hasta que la tubería se va;
    // el trofeo ya está quieto en el centro, crecido y flotando.
    win.trophy = 1;
    win.tx = 1;
    win.tScale = CENTER_SCALE;
  }
};

