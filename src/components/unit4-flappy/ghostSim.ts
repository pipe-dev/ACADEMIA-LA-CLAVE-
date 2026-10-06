// src/components/unit4-flappy/ghostSim.ts
// Logica de simulacion y desplazamiento del fantasma en modo asincrono (< 130 lineas)

import { BirdState, Obstacle, WinState } from './unit4Types';
import { BIRD_R, FLAP, FLAP_HOLD, FLAP_ROT, G, MAX_FALL } from './unit4Config';

export interface UpdateGhostParams {
  dt: number;
  now: number;
  height: number;
  fy: number;
  pX: number;
  sp: number;
  rival: BirdState;
  rivalAlive: boolean;
  rivalScore: number;
  rivalTargetScore: number;
  rivalWorldX: number | null;
  obstacles: Obstacle[];
  onCrash: (score: number, winState: WinState) => void;
  onScoreIncrement: () => void;
}

export function updateGhostSimulation({
  dt,
  now,
  height,
  fy,
  pX,
  sp,
  rival,
  rivalAlive,
  rivalScore,
  rivalTargetScore,
  rivalWorldX,
  obstacles,
  onCrash,
  onScoreIncrement,
}: UpdateGhostParams): { newWorldX: number | null } {
  if (rivalAlive) {
    rival.wingT += dt;
    rival.vy += G(height) * dt;
    if (rival.vy > MAX_FALL(height)) rival.vy = MAX_FALL(height);
    rival.birdY += rival.vy * dt;

    const nextPipe = obstacles.find((o) => o.type === 'bottom' && o.x + o.w > pX - 30);

    if (nextPipe) {
      const distToPipe = nextPipe.x - pX;
      const topPipe = obstacles.find((o) => o.type === 'top' && Math.abs(o.x - nextPipe.x) < 5);
      const gapCenter = topPipe ? (nextPipe.gapY + topPipe.gapY) / 2 : nextPipe.gapY - height * 0.15;

      if (rivalScore < rivalTargetScore) {
        if (distToPipe < 230 && distToPipe > -50) {
          if (rival.birdY > gapCenter + 10 && rival.vy > -120) {
            rival.vy = FLAP(height) * 0.96;
            rival.lastFlap = now / 1000;
            rival.rot = FLAP_ROT;
          }
        }
      } else {
        // En el tubo de su record, deja de aletear y colisiona
        if (distToPipe <= 40 && distToPipe >= -25) {
          const winState: WinState = {
            stage: 'shake',
            t0: performance.now(),
            sx: pX + 25,
            sy: rival.birdY,
            ex: pX + 25,
            ey: fy,
            x: pX + 25,
            scale: 1,
            alpha: 1,
            trophy: 0,
            tx: 0,
            tScale: 1,
            facing: 1,
          };
          onCrash(rivalScore, winState);
          return { newWorldX: pX + 25 };
        }
      }
    } else {
      if (rival.birdY > height * 0.52 && rival.vy > 0) {
        rival.vy = FLAP(height) * 0.8;
        rival.rot = FLAP_ROT * 0.8;
      }
    }

    const rivalHeld = now / 1000 - rival.lastFlap < FLAP_HOLD;
    const rivalTargetRot = rivalHeld ? FLAP_ROT : Math.min(Math.max(rival.vy * 0.0012, -1.5), 0.6);
    rival.rot += (rivalTargetRot - rival.rot) * 0.15;

    obstacles.forEach((ob) => {
      if (ob.type === 'bottom' && !ob.scored && ob.x + ob.w < pX) {
        onScoreIncrement();
      }
    });

    return { newWorldX: null };
  } else {
    // El fantasma ya choco: se desplaza hacia la izquierda con el mundo
    let nextWorldX = rivalWorldX;
    if (nextWorldX !== null) {
      nextWorldX -= sp * dt;
    }
    if (rival.birdY + BIRD_R(height) < fy) {
      rival.vy += G(height) * dt * 1.5;
      rival.birdY += rival.vy * dt;
      rival.rot = Math.min(Math.PI * 0.45, rival.rot + dt * 4);
    } else {
      rival.birdY = fy - BIRD_R(height);
      rival.vy = 0;
    }
    return { newWorldX: nextWorldX };
  }
}
