// src/components/unit4-flappy/unit4WorldSim.ts
// Lógica de simulación del mundo: colisiones de tubos, meteorito y cinemática de victoria.
// Extraído de Unit4Game para modularizar y garantizar un código limpio y < 500 líneas.

import type { MutableRefObject } from 'react';
import {
  BirdState,
  Bush,
  Meteor,
  Obstacle,
  WinState,
} from './unit4Types';
import {
  BIRD_R,
  BIRD_X,
  METEOR_DELAY,
  METEOR_FALL,
  MILESTONE_SCORE,
  PEDESTAL_H,
  PIPE_CAP_H,
  PIPE_CAP_W,
  RETURN_SPEED_MULT,
  floorY,
} from './unit4Config';
import { moveSpeed, spawnBush, spawnMilestone } from './unit4Physics';
import { unit4Audio } from './unit4Audio';

export interface SimObstaclesParams {
  width: number;
  height: number;
  sp: number;
  dt: number;
  now: number;
  bird: BirdState;
  obstacles: Obstacle[];
  scoreRef: MutableRefObject<number>;
  milestoneReachedRef: MutableRefObject<boolean>;
  goldPipeRef: MutableRefObject<Obstacle | null>;
  meteorRef: MutableRefObject<Meteor | null>;
  meteorAtRef: MutableRefObject<number>;
  onDie: (cause: 'pipe' | 'floor') => void;
  onWinReached: (p: Obstacle, viaMeteor?: boolean) => void;
  disableMilestone?: boolean;
}

export const updatePlayingObstacles = ({
  width,
  height,
  sp,
  dt,
  now,
  bird,
  obstacles,
  scoreRef,
  milestoneReachedRef,
  goldPipeRef,
  meteorRef,
  meteorAtRef,
  onDie,
  onWinReached,
  disableMilestone = false,
}: SimObstaclesParams) => {
  const bx = BIRD_X(width);
  const br = BIRD_R(height);
  const capW = PIPE_CAP_W(height);
  const capH = PIPE_CAP_H(height);
  const fy = floorY(height);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.x -= sp * dt;

    let boxX = ob.x;
    let boxW = capW;
    let boxTop = ob.type === 'bottom' ? ob.gapY - capH : 0;
    let boxBottom = ob.type === 'bottom' ? fy : ob.gapY + capH;
    if (ob.trophy) {
      boxX = ob.x;
      boxW = ob.w;
      boxTop = fy - PEDESTAL_H(height);
      boxBottom = fy;
    }

    if (!ob.scored && ob.scores && ob.x + capW < bx - br) {
      ob.scored = true;
      scoreRef.current += 1;
      unit4Audio.point(
        scoreRef.current,
        ob.gapY - (bird.birdY + br) < height * 0.07
      );
      if (
        !disableMilestone &&
        scoreRef.current >= MILESTONE_SCORE &&
        !milestoneReachedRef.current
      ) {
        milestoneReachedRef.current = true;
        obstacles.length = 0;
        obstacles.push(spawnMilestone(width, height));
        unit4Audio.goldenPipe();
        break;
      }
    }

    if (
      ob.trophy &&
      !ob.scored &&
      !goldPipeRef.current &&
      ob.x + ob.w < bx - br
    ) {
      ob.scored = true;
      goldPipeRef.current = ob;
      meteorAtRef.current = now + METEOR_DELAY * 1000;
    }

    if (
      bx + br > boxX &&
      bx - br < boxX + boxW &&
      bird.birdY + br > boxTop &&
      bird.birdY - br < boxBottom
    ) {
      if (ob.trophy) {
        onWinReached(ob);
      } else {
        onDie('pipe');
      }
      break;
    }

    if (!ob.trophy && ob.x + boxW < -boxW) {
      obstacles.splice(i, 1);
    }
  }

  // Meteorito
  if (
    goldPipeRef.current &&
    !meteorRef.current &&
    now >= meteorAtRef.current
  ) {
    meteorRef.current = {
      x: bx,
      y: -height * 0.2,
      vy: METEOR_FALL * height,
    };
    unit4Audio.meteorFall();
  }
  if (meteorRef.current) {
    const m = meteorRef.current;
    m.y += m.vy * dt;
    if (m.y >= bird.birdY - br * 0.6) {
      meteorRef.current = null;
      unit4Audio.meteorImpact();
      if (goldPipeRef.current) onWinReached(goldPipeRef.current, true);
    }
  }
};

export interface SimWinParams {
  width: number;
  height: number;
  dt: number;
  now: number;
  obstacles: Obstacle[];
  bushes: Bush[];
  groundScrollRef: MutableRefObject<number>;
  scoreRef: MutableRefObject<number>;
  goldPipeRef: MutableRefObject<Obstacle | null>;
  winRef: MutableRefObject<WinState | null>;
  showCreditsRef: MutableRefObject<boolean>;
  onShowCredits: () => void;
}

export const updateWinningWorld = ({
  width,
  height,
  dt,
  now,
  obstacles,
  bushes,
  groundScrollRef,
  scoreRef,
  goldPipeRef,
  winRef,
  showCreditsRef,
  onShowCredits,
}: SimWinParams) => {
  const win = winRef.current;
  if (!win) return;

  if (win.stage === 'return') {
    const target = goldPipeRef.current;
    const returnSp =
      moveSpeed(width, height, scoreRef.current) * RETURN_SPEED_MULT;
    groundScrollRef.current -= returnSp * dt;
    for (const ob of obstacles) ob.x += returnSp * dt;
    for (const b of bushes) {
      b.x += returnSp * 0.6 * (b.dark ? 0.5 : 1) * dt;
      if (b.x > width + 250) {
        const nb = spawnBush(-60 - Math.random() * 320);
        b.x = nb.x;
        b.scale = nb.scale;
        b.sx = nb.sx;
        b.seed = nb.seed;
        b.tone = nb.tone;
        b.dark = nb.dark;
        b.front = nb.front;
        b.blobs = nb.blobs;
      }
    }
    if (target && target.x + target.w / 2 >= BIRD_X(width)) {
      win.stage = 'enter';
      win.t0 = now;
      win.ex = BIRD_X(width);
    }
  } else if (win.stage === 'pan') {
    if (obstacles.some((ob) => ob.trophy && ob.x + ob.w > -20)) {
      const panSp = moveSpeed(width, height, scoreRef.current);
      groundScrollRef.current += panSp * dt;
      for (const ob of obstacles) ob.x -= panSp * dt;
      for (const b of bushes) {
        b.x -= panSp * 0.6 * (b.dark ? 0.5 : 1) * dt;
        if (b.x < -250) {
          const nb = spawnBush(width + 60 + Math.random() * 320);
          b.x = nb.x;
          b.scale = nb.scale;
          b.sx = nb.sx;
          b.seed = nb.seed;
          b.tone = nb.tone;
          b.dark = nb.dark;
          b.front = Math.random() < 0.4 ? b.front : nb.front;
          b.blobs = nb.blobs;
        }
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].x + obstacles[i].w < -20) {
          obstacles.splice(i, 1);
        }
      }
    } else {
      if (!showCreditsRef.current) {
        showCreditsRef.current = true;
        onShowCredits();
        unit4Audio.credits();
      }
    }
  }
};
