// src/components/unit4-flappy/Unit4DuelArena.tsx
// Arena multijugador para Carrera Celeste (Unit 4 Flappy Bird) (< 430 líneas)

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
  mode: 'ghost_async' | 'realtime_p2p';
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

  const phaseRef = useRef<Phase>('ready');
  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Estado del jugador local
  const birdRef = useRef<BirdState>({
    birdY: 0,
    vy: 0,
    rot: 0,
    lastFlap: 0,
    wingT: 0,
    floatT: 0,
  });

  // Estado del rival (fantasma asincrono o en vivo WebRTC)
  const rivalBirdRef = useRef<BirdState>({
    birdY: 0,
    vy: 0,
    rot: 0,
    lastFlap: 0,
    wingT: 0,
    floatT: 0,
  });
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
    birdRef.current.birdY = h * 0.5;
    birdRef.current.vy = 0;
    birdRef.current.rot = 0;
    birdRef.current.wingT = 0;
    birdRef.current.floatT = 0;

    rivalBirdRef.current.birdY = h * 0.5 - 20;
    rivalBirdRef.current.vy = 0;
    rivalBirdRef.current.rot = 0;
    rivalBirdRef.current.wingT = 0;
    rivalBirdRef.current.floatT = 0;
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
    setOpponentScore(0);
    setOpponentCrashed(false);
    setShowMatchOverOverlay(false);
    setBannerNotice(null);
    unit4Audio.reset();
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setPhaseBoth('playing');
    unit4Audio.start();
    flap();
  }, [resetGame, flap]);

  const handlePlayerDie = useCallback((cause: 'pipe' | 'floor' = 'pipe') => {
    setPhaseBoth('dead');
    unit4Audio.die(cause, false);
    setPlayerScore(scoreRef.current);
    setOpponentScore(rivalScoreRef.current);
    setTimeout(() => {
      setShowMatchOverOverlay(true);
    }, 900);
  }, []);

  // Control vocal
  const { micActive, ensureMic } = useVoiceGate({
    getPhase: () => phaseRef.current,
    onStart: startGame,
    onFlap: flap,
  });

  const handleScreenTap = () => {
    unit4Audio.unlock();
    ensureMic();
    if (phaseRef.current === 'ready') startGame();
    else if (phaseRef.current === 'playing') flap();
  };

  // Escuchar paquetes WebRTC en modo P2P
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

    return () => {
      p2pDuelService.onPacket = null;
    };
  }, [mode, opponentName]);

  // Bucle de animacion principal (60 FPS)
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

        // SIMULADOR DEL FANTASMA (Modo Asincrono: Vuela hasta su record y choca en su tubo)
        if (mode === 'ghost_async') {
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
            rivalTargetScore: rivalTargetScoreRef.current,
            rivalWorldX: rivalWorldXRef.current,
            obstacles,
            onCrash: (score, winState) => {
              rivalAliveRef.current = false;
              setOpponentCrashed(true);
              setBannerNotice(`¡${opponentName} choco en el tubo ${score}!`);
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
            setBannerNotice(`¡Superaste a ${opponentName}!`);
          }
        }

        // Transmision P2P
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

        // Generacion de obstaculos continuos (avance infinito)
        spawnTimerRef.current -= dt * speedMult(scoreRef.current);
        if (spawnTimerRef.current <= 0) {
          obstacles.push(...spawnObstacles(width, height, scoreRef.current));
          spawnTimerRef.current = interval(scoreRef.current) * speedMult(scoreRef.current);
        }

        // updatePlayingObstacles con disableMilestone: true para evitar la tuberia dorada
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

        // Dibujar Pato del Rival en su posicion en el mundo (sombra hasta donde choco)
        if (rivalPaletteRef.current) {
          const rivalX = rivalWorldXRef.current !== null
            ? rivalWorldXRef.current
            : (pX + (mode === 'ghost_async' ? 25 : 0));

          if (rivalX > -100 && rivalX < width + 100) {
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
                isGhost: mode === 'ghost_async',
                ghostAlpha: 0.65,
                label: `${opponentName} ${mode === 'ghost_async' ? '(Fantasma)' : ''}`,
                customX: rivalX,
              }
            );
          }
        }

        // Dibujar Pato del Jugador
        drawBird(
          ctx,
          bird,
          null,
          phaseRef.current,
          cachesRef.current,
          width,
          height,
          { label: 'TU' }
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
        opponentScore={opponentScore}
        opponentName={opponentName}
        opponentCrashed={opponentCrashed}
        opponentTargetScore={rivalTargetScoreRef.current}
        micActive={micActive}
        bannerNotice={bannerNotice}
        mode={mode}
        showMatchOverOverlay={showMatchOverOverlay}
        p1Won={playerScore > opponentScore}
        onStartGame={handleScreenTap}
        onExit={onExit}
        onFinishDuel={onFinishDuel}
      />
    </div>
  );
};

export default Unit4DuelArena;
