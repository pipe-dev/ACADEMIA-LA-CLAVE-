// src/components/unit4-flappy/Unit4DuelArena.tsx
// Arena multijugador para Carrera Celeste (Unit 4 Flappy Bird) (< 460 lineas)

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BirdState, Bush, FloorCaches, Obstacle, Phase, WinState } from './unit4Types';
import {
  BIRD_R, BIRD_X, BASE_INTERVAL, FLAP, FLAP_HOLD, FLAP_ROT, FLOAT_AMP,
  G, MAX_FALL, floorY,
} from './unit4Config';
import {
  interval, moveSpeed, spawnBush, spawnObstacles, speedMult,
} from './unit4Physics';
import {
  buildCaches, buildRivalBirdPalette, drawBird, drawBush, drawFloor,
  drawObstacle, drawScore, BirdPalette,
} from './unit4Renderers';
import { updatePlayingObstacles } from './unit4WorldSim';
import { useVoiceGate } from './useVoiceGate';
import { unit4Audio } from './unit4Audio';
import { p2pDuelService } from '../../utils/p2pDuelService';
import { Unit4DuelHud } from './Unit4DuelHud';
import { updateGhostSimulation } from './ghostSim';

interface Unit4DuelArenaProps {
  opponentName: string;
  opponentAvatar?: string;
  opponentTargetScore?: number;
  mode: 'ghost_async' | 'realtime_p2p' | 'local';
  onFinishDuel: (playerScore: number, opponentScore: number, won: boolean) => void;
  onExit: () => void;
}

export const Unit4DuelArena: React.FC<Unit4DuelArenaProps> = ({
  opponentName,
  opponentTargetScore = 10,
  mode,
  onFinishDuel,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>('ready');
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentCrashed, setOpponentCrashed] = useState(false);
  const [showMatchOverOverlay, setShowMatchOverOverlay] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Estados modo local 2 jugadores
  const [localTurn, setLocalTurn] = useState<1 | 2>(1);
  const [p1LocalScore, setP1LocalScore] = useState<number>(0);
  const [showLocalTransitionOverlay, setShowLocalTransitionOverlay] = useState(false);

  const localTurnRef = useRef<1 | 2>(1);
  const p1LocalScoreRef = useRef<number>(0);

  const phaseRef = useRef<Phase>('ready');
  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const birdRef = useRef<BirdState>({ birdY: 0, vy: 0, rot: 0, lastFlap: 0, wingT: 0, floatT: 0 });
  const rivalBirdRef = useRef<BirdState>({ birdY: 0, vy: 0, rot: 0, lastFlap: 0, wingT: 0, floatT: 0 });
  const rivalAliveRef = useRef(true);
  const rivalScoreRef = useRef(0);
  const rivalPaletteRef = useRef<BirdPalette | null>(null);
  const rivalWinRef = useRef<WinState | null>(null);
  const rivalTargetScoreRef = useRef(Math.max(3, opponentTargetScore));
  const rivalWorldXRef = useRef<number | null>(null);
  const hasPassedRivalRef = useRef(false);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const spawnTimerRef = useRef(BASE_INTERVAL);
  const milestoneReachedRef = useRef(false);
  const goldPipeRef = useRef<Obstacle | null>(null);
  const groundScrollRef = useRef(0);
  const bushesRef = useRef<Bush[]>([]);
  const cachesRef = useRef<FloorCaches | null>(null);
  const lastP2PSendRef = useRef(0);

  const flap = useCallback(() => {
    const canvas = canvasRef.current;
    const h = canvas ? canvas.height : window.innerHeight;
    birdRef.current.vy = FLAP(h);
    birdRef.current.lastFlap = performance.now() / 1000;
    birdRef.current.rot = FLAP_ROT;
    unit4Audio.flap(scoreRef.current);
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    const h = canvas ? canvas.height : window.innerHeight;
    birdRef.current = { birdY: h * 0.5, vy: 0, rot: 0, wingT: 0, floatT: 0, lastFlap: 0 };
    rivalBirdRef.current = { birdY: h * 0.5 - 20, vy: 0, rot: 0, wingT: 0, floatT: 0, lastFlap: 0 };
    rivalAliveRef.current = true;
    rivalScoreRef.current = 0;
    rivalWinRef.current = null;
    rivalWorldXRef.current = null;
    hasPassedRivalRef.current = false;

    obstaclesRef.current = [];
    scoreRef.current = 0;
    spawnTimerRef.current = BASE_INTERVAL;
    milestoneReachedRef.current = false;
    goldPipeRef.current = null;

    setPlayerScore(0);
    setOpponentScore(mode === 'local' && localTurnRef.current === 2 ? p1LocalScoreRef.current : 0);
    setOpponentCrashed(false);
    setShowMatchOverOverlay(false);
    setBannerNotice(null);
    unit4Audio.reset();
  }, [mode]);

  const startGame = useCallback(() => {
    resetGame();
    setPhaseBoth('playing');
    unit4Audio.start();
    flap();
  }, [resetGame, flap]);

  const handlePlayerDie = useCallback((cause: 'pipe' | 'floor' = 'pipe') => {
    setPhaseBoth('dead');
    unit4Audio.die(cause, false);
    const finalScore = scoreRef.current;
    setPlayerScore(finalScore);

    if (mode === 'local' && localTurnRef.current === 1) {
      p1LocalScoreRef.current = finalScore;
      setP1LocalScore(finalScore);
      setTimeout(() => setShowLocalTransitionOverlay(true), 900);
      return;
    }

    setOpponentScore(mode === 'local' ? p1LocalScoreRef.current : rivalScoreRef.current);
    setTimeout(() => setShowMatchOverOverlay(true), 900);
  }, [mode]);

  const handleStartLocalTurn2 = useCallback(() => {
    localTurnRef.current = 2;
    setLocalTurn(2);
    setShowLocalTransitionOverlay(false);
    rivalTargetScoreRef.current = p1LocalScoreRef.current;
    resetGame();
    setPhaseBoth('ready');
  }, [resetGame]);

  const { micActive, ensureMic } = useVoiceGate({
    getPhase: () => phaseRef.current,
    onStart: startGame,
    onFlap: flap,
  });

  const handleScreenTap = () => {
    if (showLocalTransitionOverlay) return;
    unit4Audio.unlock();
    ensureMic();
    if (phaseRef.current === 'ready') startGame();
    else if (phaseRef.current === 'playing') flap();
  };

  useEffect(() => {
    if (mode !== 'realtime_p2p') return;
    p2pDuelService.onPacket = (packet) => {
      if (packet.type === 'sky_run') {
        rivalBirdRef.current.birdY = packet.height;
        if (typeof packet.rot === 'number') rivalBirdRef.current.rot = packet.rot;
        rivalScoreRef.current = packet.score;
        setOpponentScore(packet.score);
        if (!packet.alive && rivalAliveRef.current) {
          rivalAliveRef.current = false;
          setOpponentCrashed(true);
          setBannerNotice(`${opponentName} choco en ${packet.score} pts`);
        }
      }
    };
    return () => { p2pDuelService.onPacket = null; };
  }, [mode, opponentName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cachesRef.current = buildCaches(ctx, width, height);
      rivalPaletteRef.current = buildRivalBirdPalette(ctx, height);
    };
    resize();
    window.addEventListener('resize', resize);

    bushesRef.current = [];
    for (let i = 0; i < 4; i++) {
      bushesRef.current.push(spawnBush(Math.random() * (width + 200) - 100));
    }
    resetGame();

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed < 14) return;
      const dt = Math.min(0.033, elapsed / 1000);
      last = now;

      ctx.clearRect(0, 0, width, height);
      const sp = moveSpeed(width, height, scoreRef.current);
      const bushes = bushesRef.current;
      const obstacles = obstaclesRef.current;
      const bird = birdRef.current;
      const rival = rivalBirdRef.current;
      const pX = BIRD_X(width);
      const fy = floorY(height);

      if (phaseRef.current === 'ready' || phaseRef.current === 'playing') {
        groundScrollRef.current += sp * dt;
        for (const b of bushes) {
          b.x -= sp * 0.6 * (b.dark ? 0.5 : 1) * dt;
          if (b.x < -250) {
            const nb = spawnBush(width + 60 + Math.random() * 320);
            b.x = nb.x;
            b.scale = nb.scale;
            b.blobs = nb.blobs;
          }
        }
      }

      if (phaseRef.current === 'ready') {
        bird.wingT += dt;
        bird.floatT += dt;
        bird.birdY = height * 0.5 + Math.sin(bird.floatT * Math.PI * 0.5) * FLOAT_AMP(height);

        rival.wingT += dt;
        rival.floatT += dt + 0.5;
        rival.birdY = height * 0.5 - 20 + Math.sin(rival.floatT * Math.PI * 0.5) * FLOAT_AMP(height);
      }

      if (phaseRef.current === 'playing') {
        bird.wingT += dt;
        bird.vy += G(height) * dt;
        if (bird.vy > MAX_FALL(height)) bird.vy = MAX_FALL(height);
        bird.birdY += bird.vy * dt;

        const held = now / 1000 - bird.lastFlap < FLAP_HOLD;
        const targetRot = held ? FLAP_ROT : Math.min(Math.max(bird.vy * 0.0012, -1.5), 0.6);
        bird.rot += (targetRot - bird.rot) * 0.15;

        if (bird.birdY - BIRD_R(height) < -BIRD_R(height) * 0.5) {
          bird.birdY = -BIRD_R(height) * 0.5 + BIRD_R(height);
          bird.vy = 0;
        }
        if (bird.birdY + BIRD_R(height) >= fy) {
          bird.birdY = fy - BIRD_R(height);
          bird.vy = Math.min(bird.vy, 0);
          handlePlayerDie('floor');
        }

        const runGhost = mode === 'ghost_async' || (mode === 'local' && localTurnRef.current === 2);
        if (runGhost) {
          const ghostTarget = mode === 'local' ? p1LocalScoreRef.current : rivalTargetScoreRef.current;
          const ghostName = mode === 'local' ? 'Jugador 1' : opponentName;
          const { newWorldX } = updateGhostSimulation({
            dt,
            now,
            height,
            fy,
            pX,
            sp,
            rival,
            rivalAlive: rivalAliveRef.current,
            rivalScore: rivalScoreRef.current,
            rivalTargetScore: ghostTarget,
            rivalWorldX: rivalWorldXRef.current,
            obstacles,
            onCrash: (score, winState) => {
              rivalAliveRef.current = false;
              setOpponentCrashed(true);
              setBannerNotice(`${ghostName} cayo en el tubo ${score}`);
              rivalWinRef.current = winState;
            },
            onScoreIncrement: () => {
              rivalScoreRef.current += 1;
              setOpponentScore(rivalScoreRef.current);
            },
          });

          rivalWorldXRef.current = newWorldX;

          if (!rivalAliveRef.current && scoreRef.current > rivalScoreRef.current && !hasPassedRivalRef.current) {
            hasPassedRivalRef.current = true;
            setBannerNotice(`¡Superaste la marca de ${ghostName}!`);
          }
        }

        if (mode === 'realtime_p2p' && now - lastP2PSendRef.current > 40) {
          lastP2PSendRef.current = now;
          p2pDuelService.sendPacket({
            type: 'sky_run',
            height: bird.birdY,
            rot: bird.rot,
            score: scoreRef.current,
            alive: true,
          });
        }

        spawnTimerRef.current -= dt * speedMult(scoreRef.current);
        if (spawnTimerRef.current <= 0) {
          obstacles.push(...spawnObstacles(width, height, scoreRef.current));
          spawnTimerRef.current = interval(scoreRef.current) * speedMult(scoreRef.current);
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
          meteorRef: { current: null },
          meteorAtRef: { current: 0 },
          onDie: handlePlayerDie,
          onWinReached: () => handlePlayerDie('pipe'),
          disableMilestone: true,
        });

        setPlayerScore(scoreRef.current);
      }

      if (cachesRef.current) {
        for (const b of bushes) if (!b.front) drawBush(ctx, b, height);
        for (const ob of obstacles) drawObstacle(ctx, ob, height);
        for (const b of bushes) if (b.front) drawBush(ctx, b, height);

        drawFloor(ctx, cachesRef.current, groundScrollRef.current, width, height, now / 1000);

        const showRival = mode !== 'local' || localTurnRef.current === 2;
        if (rivalPaletteRef.current && showRival) {
          const rivalX = rivalWorldXRef.current !== null
            ? rivalWorldXRef.current
            : (pX + (mode === 'ghost_async' || mode === 'local' ? 25 : 0));

          if (rivalX > -100 && rivalX < width + 100) {
            const isGhost = mode === 'ghost_async' || mode === 'local';
            const ghostTag = mode === 'local' ? 'J1 (Fantasma)' : `${opponentName} ${isGhost ? '(Fantasma)' : ''}`;
            drawBird(
              ctx,
              rival,
              rivalWinRef.current,
              rivalAliveRef.current ? 'playing' : 'dead',
              cachesRef.current,
              width,
              height,
              {
                palette: rivalPaletteRef.current,
                isGhost,
                ghostAlpha: 0.65,
                label: ghostTag,
                customX: rivalX,
              }
            );
          }
        }

        const playerLabel = mode === 'local' ? (localTurnRef.current === 1 ? 'J1' : 'J2') : 'TU';
        drawBird(
          ctx,
          bird,
          null,
          phaseRef.current,
          cachesRef.current,
          width,
          height,
          { label: playerLabel }
        );

        if (phaseRef.current === 'playing') {
          drawScore(ctx, scoreRef.current, width, height);
        }
      }
    };

    raf = requestAnimationFrame(loop);
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleScreenTap();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(raf);
      unit4Audio.stop();
    };
  }, [mode, opponentName, startGame, flap, handlePlayerDie, resetGame]);

  const p1WonLocal = mode === 'local' ? p1LocalScore > playerScore : playerScore > opponentScore;

  const handleFinish = () => {
    if (mode === 'local') {
      onFinishDuel(p1LocalScore, playerScore, p1LocalScore > playerScore);
    } else {
      onFinishDuel(playerScore, opponentScore, playerScore > opponentScore);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleScreenTap}
      className="fixed inset-0 z-[120] select-none touch-none bg-[#102034] text-white overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      <Unit4DuelHud
        phase={phase}
        playerScore={playerScore}
        opponentScore={mode === 'local' && localTurn === 2 ? p1LocalScore : opponentScore}
        opponentName={opponentName}
        opponentCrashed={opponentCrashed}
        opponentTargetScore={mode === 'local' ? p1LocalScore : rivalTargetScoreRef.current}
        micActive={micActive}
        bannerNotice={bannerNotice}
        mode={mode}
        localTurn={localTurn}
        p1LocalScore={p1LocalScore}
        showLocalTransitionOverlay={showLocalTransitionOverlay}
        showMatchOverOverlay={showMatchOverOverlay}
        p1Won={p1WonLocal}
        onStartGame={handleScreenTap}
        onExit={onExit}
        onStartLocalTurn2={handleStartLocalTurn2}
        onFinishDuel={handleFinish}
      />
    </div>
  );
};

export default Unit4DuelArena;
