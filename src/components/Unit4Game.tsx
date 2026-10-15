// src/components/Unit4Game.tsx
// Adaptado de brandonplank/flappybird (MIT) - Brandon Plank / ThatcherDev 2019-2022.
// Tubos clásicos verdes dibujados proceduralmente.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { unit4World } from '../utils/unit4WorldState';

import {
  BirdState, Bush, FloorCaches, Meteor, Obstacle, Phase, WinState,
} from './unit4-flappy/unit4Types';
import {
  BIRD_R, BIRD_X, BASE_INTERVAL, FLAP, FLAP_HOLD, FLAP_ROT, FLOAT_AMP,
  G, MAX_FALL, RECORD_KEY, floorY,
} from './unit4-flappy/unit4Config';
import {
  interval, moveSpeed, spawnBush, spawnMilestone, spawnObstacles, speedMult, updateWin,
} from './unit4-flappy/unit4Physics';
import {
  buildCaches, drawBird, drawBush, drawFloor, drawMeteor, drawObstacle,
  drawScore, drawTrophyOutOfPipe,
} from './unit4-flappy/unit4Renderers';
import {
  updatePlayingObstacles, updateWinningWorld,
} from './unit4-flappy/unit4WorldSim';
import { useVoiceGate } from './unit4-flappy/useVoiceGate';
import { unit4Audio } from './unit4-flappy/unit4Audio';
import { Unit4Hud } from './unit4-flappy/Unit4Hud';

interface Unit4GameProps {
  onExit?: () => void;
}

export const Unit4Game: React.FC<Unit4GameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [finalScore, setFinalScore] = useState(0);
  const [finalRecord, setFinalRecord] = useState(0);
  const [showCredits, setShowCredits] = useState(false);
  const showCreditsRef = useRef(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const deathsRef = useRef(0);

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
  const goldPipeRef = useRef<Obstacle | null>(null);
  const meteorRef = useRef<Meteor | null>(null);
  const meteorAtRef = useRef(0);
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
    unit4Audio.flap(scoreRef.current);
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
    goldPipeRef.current = null;
    meteorRef.current = null;
    meteorAtRef.current = 0;
    winRef.current = null;
    unit4Audio.reset();
    showCreditsRef.current = false;
    setShowCredits(false);
  };

  const startGame = () => {
    reset();
    setPhaseBoth('playing');
    unit4Audio.start();
    flap();
  };

  const die = (cause: 'pipe' | 'floor' = 'pipe') => {
    const curScore = scoreRef.current;
    const newRecord = curScore > recordRef.current;
    if (newRecord) {
      recordRef.current = curScore;
      localStorage.setItem(RECORD_KEY, String(curScore));
    }
    setFinalScore(curScore);
    setFinalRecord(recordRef.current);
    setPhaseBoth('dead');
    unit4Audio.die(cause, newRecord && curScore > 0);
    // Tras 2 derrotas, sugiere el control táctil por si la voz se dificulta.
    deathsRef.current += 1;
    if (deathsRef.current >= 2) setShowTapHint(true);
  };

  const winReached = (p: Obstacle, viaMeteor = false) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : window.innerWidth;
    const h = canvas ? canvas.height : window.innerHeight;
    setPhaseBoth('winning');
    unit4Audio.startWin();
    const holeX = p.x + p.w / 2;
    const holeY = floorY(h) - h * 0.1;
    winRef.current = {
      stage: viaMeteor ? 'down' : 'shake',
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
      facing: viaMeteor ? -1 : 1,
    };
  };

  // Voice gate integration
  const { micActive, ensureMic } = useVoiceGate({
    getPhase: () => phaseRef.current,
    onStart: startGame,
    onFlap: flap,
  });

  const handleTap = () => {
    unit4Audio.unlock();
    if (phaseRef.current === 'ready') {
      startGame();
    } else if (phaseRef.current === 'playing') {
      flap();
    } else if (phaseRef.current === 'dead') {
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
        unit4Audio.unlock();
        ensureMic();
        handleTap();
      } else if (e.code === 'KeyW' && phaseRef.current !== 'winning') {
        winReached(spawnMilestone(width, height));
      }
    };
    window.addEventListener('keydown', handleKey);

    const container = containerRef.current;
    const handlePointer = (e: PointerEvent) => {
      e.preventDefault();
      unit4Audio.unlock();
      ensureMic();
      handleTap();
    };
    container?.addEventListener('pointerdown', handlePointer);

    let raf = 0;
    let last = performance.now();
    // Cap a ~60fps estable: en 120Hz (iPhone ProMotion) evita duplicar carga
    const MIN_FRAME_MS = 14;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed < MIN_FRAME_MS) return;
      // Clamped dt evita saltos o traspaso de geometrías en caídas de fps
      const dt = Math.min(0.033, elapsed / 1000);
      last = now;

      ctx.clearRect(0, 0, width, height);

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
          die('floor');
        }

        if (!milestoneReachedRef.current) {
          spawnTimerRef.current -= dt * speedMult(scoreRef.current);
          if (spawnTimerRef.current <= 0) {
            obstacles.push(...spawnObstacles(width, height, scoreRef.current));
            spawnTimerRef.current =
              interval(scoreRef.current) * speedMult(scoreRef.current);
          }
        }

        updatePlayingObstacles({
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
          onDie: die,
          onWinReached: winReached,
        });
      } else if (phaseRef.current === 'winning' && winRef.current) {
        updateWin(winRef.current, bird, dt, now, height);
        unit4Audio.winStage(winRef.current.stage);

        updateWinningWorld({
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
          onShowCredits: () => setShowCredits(true),
        });
      }

      if (cachesRef.current) {
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
        if (phaseRef.current === 'playing' && meteorRef.current) {
          drawMeteor(ctx, meteorRef.current, now, height);
        }
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
    };

    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeWithCaches);
      window.removeEventListener('keydown', handleKey);
      container?.removeEventListener('pointerdown', handlePointer);
      cancelAnimationFrame(raf);
      unit4Audio.stop();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[110] select-none touch-none"
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      <Unit4Hud
        phase={phase}
        finalScore={finalScore}
        finalRecord={finalRecord}
        micActive={micActive}
        showCredits={showCredits}
        showTapHint={showTapHint}
        onExit={onExit}
        onRestart={() => {
          setPhaseBoth('ready');
          reset();
        }}
      />
    </div>
  );
};