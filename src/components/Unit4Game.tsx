// src/components/Unit4Game.tsx
// Adaptado de brandonplank/flappybird (MIT) - Brandon Plank / ThatcherDev 2019-2022.
// Tubos clásicos verdes dibujados proceduralmente.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { unit4World } from '../utils/unit4WorldState';

import {
  BirdState, Bush, FloorCaches, Obstacle, Phase, WinState,
} from './unit4-flappy/unit4Types';
import {
  BIRD_R, BIRD_X, BASE_INTERVAL, FLAP, FLAP_HOLD, FLAP_ROT, FLOAT_AMP,
  G, MAX_FALL, MILESTONE_SCORE, PEDESTAL_H, PIPE_CAP_H, PIPE_CAP_W, RECORD_KEY, floorY,
} from './unit4-flappy/unit4Config';
import {
  interval, moveSpeed, spawnBush, spawnMilestone, spawnObstacles, speedMult, updateWin,
} from './unit4-flappy/unit4Physics';
import {
  buildCaches, drawBird, drawBush, drawFloor, drawObstacle, drawScore, drawTrophyOutOfPipe,
} from './unit4-flappy/unit4Renderers';
import { useVoiceGate } from './unit4-flappy/useVoiceGate';
import { Unit4CreditsModal } from './unit4-flappy/Unit4CreditsModal';

export const Unit4Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [finalScore, setFinalScore] = useState(0);
  const [finalRecord, setFinalRecord] = useState(0);
  const [showCredits, setShowCredits] = useState(false);
  const showCreditsRef = useRef(false);

  const phaseRef = useRef<Phase>('ready');
  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // State refs used inside the 60 FPS animation loop
  const birdRef = useRef<BirdState>({
    birdY: 0,
    vy: 0,
    rot: 0,
    lastFlap: 0,
    wingT: 0,
    floatT: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const spawnTimerRef = useRef(BASE_INTERVAL);
  const milestoneReachedRef = useRef(false);
  const groundScrollRef = useRef(0);
  const winRef = useRef<WinState | null>(null);
  const recordRef = useRef(0);
  const bushesRef = useRef<Bush[]>([]);
  const cachesRef = useRef<FloorCaches | null>(null);

  const flap = () => {
    const canvas = canvasRef.current;
    const h = canvas ? canvas.height : window.innerHeight;
    birdRef.current.vy = FLAP(h);
    birdRef.current.lastFlap = performance.now() / 1000;
    birdRef.current.rot = FLAP_ROT;
  };

  const reset = () => {
    const canvas = canvasRef.current;
    const h = canvas ? canvas.height : window.innerHeight;
    birdRef.current.birdY = h * 0.5;
    birdRef.current.vy = 0;
    birdRef.current.rot = 0;
    birdRef.current.lastFlap = 0;
    birdRef.current.wingT = 0;
    birdRef.current.floatT = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    spawnTimerRef.current = BASE_INTERVAL;
    milestoneReachedRef.current = false;
    winRef.current = null;
    showCreditsRef.current = false;
    setShowCredits(false);
  };

  const startGame = () => {
    reset();
    setPhaseBoth('playing');
    flap();
  };

  const die = () => {
    const curScore = scoreRef.current;
    if (curScore > recordRef.current) {
      recordRef.current = curScore;
      localStorage.setItem(RECORD_KEY, String(curScore));
    }
    setFinalScore(curScore);
    setFinalRecord(recordRef.current);
    setPhaseBoth('dead');
  };

  const winReached = (p: Obstacle) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : window.innerWidth;
    const h = canvas ? canvas.height : window.innerHeight;
    setPhaseBoth('winning');
    const holeX = p.x + p.w / 2;
    const holeY = floorY(h) - h * 0.1;
    winRef.current = {
      stage: 'shake',
      t0: performance.now(),
      sx: BIRD_X(w),
      sy: birdRef.current.birdY,
      ex: holeX,
      ey: holeY,
      x: BIRD_X(w),
      scale: 1,
      alpha: 1,
      trophy: 0,
      tx: 0,
      tScale: 1,
    };
  };

  // Voice gate integration
  const { micActive, ensureMic } = useVoiceGate({
    getPhase: () => phaseRef.current,
    onStart: startGame,
    onFlap: flap,
  });

  const handleTap = () => {
    if (phaseRef.current === 'ready') {
      startGame();
    } else if (phaseRef.current === 'playing') {
      flap();
    } else if (phaseRef.current === 'winning') {
      setPhaseBoth('ready');
      reset();
    } else {
      setPhaseBoth('ready');
      reset();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    recordRef.current =
      parseInt(localStorage.getItem(RECORD_KEY) || '0', 10) || 0;

    const resizeWithCaches = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cachesRef.current = buildCaches(ctx, width, height);
    };
    resizeWithCaches();
    window.addEventListener('resize', resizeWithCaches);

    // Initial bushes
    bushesRef.current = [];
    for (let i = 0; i < 4; i++) {
      bushesRef.current.push(spawnBush(Math.random() * (width + 200) - 100));
    }
    reset();

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        ensureMic();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKey);

    const container = containerRef.current;
    const handlePointer = (e: PointerEvent) => {
      e.preventDefault();
      ensureMic();
      handleTap();
    };
    container?.addEventListener('pointerdown', handlePointer);

    let raf = 0;
    let last = performance.now();
    let frameEMA = 16;
    let frameCount = 0;
    let drawEvery = 1;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frameCount++;
      frameEMA = frameEMA * 0.9 + dt * 1000 * 0.1;
      if (frameEMA > 28 && drawEvery === 1) drawEvery = 2;
      else if (frameEMA < 15 && drawEvery === 2) drawEvery = 1;
      const shouldDraw = frameCount % drawEvery === 0;
      if (shouldDraw) ctx.clearRect(0, 0, width, height);

      unit4World.phase = phaseRef.current;
      unit4World.score = scoreRef.current;

      const sp = moveSpeed(width, height, scoreRef.current);
      const bushes = bushesRef.current;
      const obstacles = obstaclesRef.current;
      const bird = birdRef.current;

      if (phaseRef.current === 'ready' || phaseRef.current === 'playing') {
        groundScrollRef.current += sp * dt;
        for (const b of bushes) {
          b.x -= sp * 0.6 * (b.dark ? 0.5 : 1) * dt;
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
      }

      if (phaseRef.current === 'ready' || phaseRef.current === 'dead') {
        bird.wingT += dt;
        bird.floatT += dt;
        if (phaseRef.current === 'ready') {
          bird.birdY =
            height * 0.5 +
            Math.sin(bird.floatT * Math.PI * 0.5) * FLOAT_AMP(height);
        }
      } else if (phaseRef.current === 'playing') {
        bird.wingT += dt;
        bird.vy += G(height) * dt;
        if (bird.vy > MAX_FALL(height)) bird.vy = MAX_FALL(height);
        bird.birdY += bird.vy * dt;

        const held = now / 1000 - bird.lastFlap < FLAP_HOLD;
        const target = held
          ? FLAP_ROT
          : Math.min(Math.max(bird.vy * 0.0012, -1.5), 0.6);
        bird.rot += (target - bird.rot) * 0.15;

        if (bird.birdY - BIRD_R(height) < -BIRD_R(height) * 0.5) {
          bird.birdY = -BIRD_R(height) * 0.5 + BIRD_R(height);
          bird.vy = 0;
        }
        const fy = floorY(height);
        if (bird.birdY + BIRD_R(height) >= fy) {
          bird.birdY = fy - BIRD_R(height);
          bird.vy = Math.min(bird.vy, 0);
          die();
        }

        if (!milestoneReachedRef.current) {
          spawnTimerRef.current -= dt * speedMult(scoreRef.current);
          if (spawnTimerRef.current <= 0) {
            obstacles.push(...spawnObstacles(width, height, scoreRef.current));
            spawnTimerRef.current =
              interval(scoreRef.current) * speedMult(scoreRef.current);
          }
        }

        const bx = BIRD_X(width);
        const br = BIRD_R(height);
        const capW = PIPE_CAP_W(height);
        const capH = PIPE_CAP_H(height);

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

          if (
            !ob.scored &&
            ob.scores &&
            ob.x + capW < bx - br
          ) {
            ob.scored = true;
            scoreRef.current += 1;
            if (
              scoreRef.current >= MILESTONE_SCORE &&
              !milestoneReachedRef.current
            ) {
              milestoneReachedRef.current = true;
              obstacles.length = 0;
              obstacles.push(spawnMilestone(width, height));
              break;
            }
          }

          if (
            bx + br > boxX &&
            bx - br < boxX + boxW &&
            bird.birdY + br > boxTop &&
            bird.birdY - br < boxBottom
          ) {
            if (ob.trophy) {
              winReached(ob);
            } else {
              die();
            }
            break;
          }

          if (ob.x + boxW < -boxW) {
            obstacles.splice(i, 1);
          }
        }
      } else if (phaseRef.current === 'winning' && winRef.current) {
        updateWin(winRef.current, bird, dt, now, height);

        // Fase 'pan': el mundo se corre hacia la izquierda hasta que la
        // tubería dorada desaparece y sólo queda el trofeo en el centro.
        if (winRef.current.stage === 'pan') {
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
            // El pedestal ya salió y la copa flota estática en el centro: lanzar créditos
            if (!showCreditsRef.current) {
              showCreditsRef.current = true;
              setShowCredits(true);
            }
          }
        }
      }

      if (shouldDraw && cachesRef.current) {
        for (const b of bushes) if (!b.front) drawBush(ctx, b, height);
        for (const ob of obstacles) drawObstacle(ctx, ob, height);
        for (const b of bushes) if (b.front) drawBush(ctx, b, height);
        drawFloor(
          ctx,
          cachesRef.current,
          groundScrollRef.current,
          width,
          height,
          now / 1000
        );
        drawBird(
          ctx,
          bird,
          winRef.current,
          phaseRef.current,
          cachesRef.current,
          width,
          height
        );
        if (
          phaseRef.current === 'winning' &&
          winRef.current &&
          winRef.current.trophy > 0.02
        ) {
          drawTrophyOutOfPipe(ctx, winRef.current, width, height);
        }
        if (phaseRef.current === 'playing') {
          drawScore(ctx, scoreRef.current, width, height);
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeWithCaches);
      window.removeEventListener('keydown', handleKey);
      container?.removeEventListener('pointerdown', handlePointer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[110] select-none touch-none"
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {phase === 'ready' && (
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-[200] pointer-events-none select-none text-center text-white">
          <div className="text-2xl font-black tracking-wide drop-shadow-[0_2px_0_rgba(69,26,3,0.45)] whitespace-nowrap">
            Grítale al pato
          </div>
          <div className="text-xl font-bold tracking-wide drop-shadow-[0_2px_0_rgba(69,26,3,0.45)] opacity-90 whitespace-nowrap">
            para hacerlo volar
          </div>
        </div>
      )}

      {phase === 'dead' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none bg-amber-950/40">
          <div className="text-6xl font-black text-white drop-shadow-[0_3px_0_rgba(69,26,3,0.85)]">
            ¡Chocaste!
          </div>
          <div className="flex items-center gap-6 px-6 py-4 rounded-3xl bg-amber-900/80 text-amber-50 shadow-xl">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider opacity-70">
                Puntos
              </div>
              <div className="text-4xl font-black text-amber-300">
                {finalScore}
              </div>
            </div>
            <div className="w-px h-12 bg-white/25" />
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider opacity-70">
                Récord
              </div>
              <div className="text-4xl font-black text-amber-300">
                {finalRecord}
              </div>
            </div>
          </div>
        </div>
      )}

      {micActive && phase !== 'ready' && (
        <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2 rounded-full bg-amber-950/60 px-3 py-1.5 text-amber-100 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <Mic className="w-4 h-4" />
        </div>
      )}

      {showCredits && (
        <Unit4CreditsModal
          onRestart={() => {
            setPhaseBoth('ready');
            reset();
          }}
        />
      )}
    </div>
  );
};