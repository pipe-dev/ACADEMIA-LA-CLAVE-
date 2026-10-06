// src/components/unit3-rhythm/Unit3DuelArena.tsx
// Arena de Duelo de Tambor y Ritmo (1 minuto contra reloj) (< 380 lineas)

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveSphere } from './types';
import { DrumCanvas } from './DrumCanvas';
import { Unit3DuelHud } from './Unit3DuelHud';
import {
  getDrumGeometry,
  createDuelSphere,
  updateDuelSpheresPhysics,
  DrumGeometry,
} from './rhythmWaveSim';
import {
  playSphereSlice,
  playGoldenCrashFanfare,
  playBladeSwoosh,
  setRhythmAudioMuted,
} from './rhythmAudio';
import { p2pDuelService } from '../../utils/p2pDuelService';

const MATCH_DURATION_SEC = 60;

interface Unit3DuelArenaProps {
  opponentName: string;
  opponentTargetCuts?: number;
  mode: 'ghost_async' | 'realtime_p2p';
  onFinishDuel: (playerCuts: number, opponentCuts: number, won: boolean) => void;
  onExit: () => void;
}

export const Unit3DuelArena: React.FC<Unit3DuelArenaProps> = ({
  opponentName,
  opponentTargetCuts = 32,
  mode,
  onFinishDuel,
  onExit,
}) => {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [playerCuts, setPlayerCuts] = useState<number>(0);
  const [opponentCuts, setOpponentCuts] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(MATCH_DURATION_SEC);
  const [showMatchOverOverlay, setShowMatchOverOverlay] = useState<boolean>(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const phaseRef = useRef<'ready' | 'playing' | 'finished'>('ready');
  const playerCutsRef = useRef<number>(0);
  const opponentCutsRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(MATCH_DURATION_SEC);
  const activeSpheresRef = useRef<ActiveSphere[]>([]);
  const [renderSpheres, setRenderSpheres] = useState<ActiveSphere[]>([]);

  const geoRef = useRef<DrumGeometry>(getDrumGeometry());
  const lastGoldenSpawnRef = useRef<number>(0);
  const nextRivalCutTimeRef = useRef<number>(0);
  const rivalCutsPlannedRef = useRef<number>(0);
  const lastAdvantageRef = useRef<number>(0);
  const lastP2PSendRef = useRef<number>(0);

  const setPhaseBoth = (p: 'ready' | 'playing' | 'finished') => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Ajuste geometrico responsivo
  useEffect(() => {
    const handleResize = () => {
      geoRef.current = getDrumGeometry(window.innerWidth, window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generador de esferas
  const spawnInitialWave = useCallback(() => {
    const geo = geoRef.current;
    const s1 = createDuelSphere('purple', 'left', geo);
    const s2 = createDuelSphere('purple', 'right', geo, 490);
    activeSpheresRef.current = [s1, s2];
    setRenderSpheres([...activeSpheresRef.current]);
  }, []);

  const replenishSpheres = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const geo = geoRef.current;
    const alive = activeSpheresRef.current.filter((s) => !s.isCut);

    if (alive.length < 2) {
      const now = performance.now();
      const shouldSpawnGolden =
        now - lastGoldenSpawnRef.current > 11000 &&
        playerCutsRef.current > 0 &&
        playerCutsRef.current % 5 === 0;

      let fresh: ActiveSphere;
      if (shouldSpawnGolden) {
        lastGoldenSpawnRef.current = now;
        fresh = createDuelSphere('golden', 'center', geo, 520);
      } else {
        const lane = Math.random() < 0.5 ? 'left' : 'right';
        fresh = createDuelSphere('purple', lane, geo, 440 + Math.random() * 60);
      }

      activeSpheresRef.current = [...alive, fresh];
      setRenderSpheres([...activeSpheresRef.current]);
    }
  }, []);

  // Iniciar partida de 1 minuto
  const handleStartGame = useCallback(() => {
    setRhythmAudioMuted(false);
    playerCutsRef.current = 0;
    opponentCutsRef.current = 0;
    timeLeftRef.current = MATCH_DURATION_SEC;
    lastGoldenSpawnRef.current = performance.now();
    rivalCutsPlannedRef.current = 0;
    nextRivalCutTimeRef.current = performance.now() + 1500;

    setPlayerCuts(0);
    setOpponentCuts(0);
    setTimeLeft(MATCH_DURATION_SEC);
    setShowMatchOverOverlay(false);
    setBannerNotice(null);
    setPhaseBoth('playing');

    spawnInitialWave();
  }, [spawnInitialWave]);

  // Corte de esfera por el jugador
  const handleSliceSphere = useCallback(
    (sphere: ActiveSphere, _cutCoord: { x: number; y: number }) => {
      if (phaseRef.current !== 'playing') return;

      const increment = sphere.type === 'golden' ? 2 : 1;
      playerCutsRef.current += increment;
      setPlayerCuts(playerCutsRef.current);

      if (sphere.type === 'golden') {
        playGoldenCrashFanfare();
        setBannerNotice('¡Esfera Dorada! +2 cortes');
      } else {
        playSphereSlice(playerCutsRef.current);
        playBladeSwoosh(0.9);
      }

      // Reemplazo rapido
      setTimeout(() => {
        replenishSpheres();
      }, 260);
    },
    [replenishSpheres]
  );

  // Escuchar paquetes WebRTC P2P
  useEffect(() => {
    if (mode !== 'realtime_p2p') return;

    p2pDuelService.onPacket = (packet) => {
      if (packet.type === 'rhythm') {
        opponentCutsRef.current = packet.cutCount;
        setOpponentCuts(packet.cutCount);
      }
    };

    return () => {
      p2pDuelService.onPacket = null;
    };
  }, [mode]);

  // Bucle principal de fisica y tiempo (60 FPS)
  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const elapsed = currentTime - lastTime;
      if (elapsed < 14) return;
      const dt = Math.min(elapsed / 1000, 0.05);
      lastTime = currentTime;

      if (phaseRef.current === 'playing') {
        // 1. Descuento del reloj de 1 minuto
        timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
        setTimeLeft(Number(timeLeftRef.current.toFixed(1)));

        // 2. Comprobacion de fin de tiempo
        if (timeLeftRef.current <= 0) {
          setPhaseBoth('finished');
          playGoldenCrashFanfare();
          setTimeout(() => {
            setShowMatchOverOverlay(true);
          }, 800);
          return;
        }

        // 3. Simulador del rival asincrono (corta gradualmente hacia opponentTargetCuts)
        if (mode === 'ghost_async') {
          if (currentTime >= nextRivalCutTimeRef.current) {
            const progress = (MATCH_DURATION_SEC - timeLeftRef.current) / MATCH_DURATION_SEC;
            const targetNow = Math.round(progress * opponentTargetCuts);

            if (opponentCutsRef.current < targetNow || Math.random() < 0.4) {
              const bonus = Math.random() < 0.2 ? 2 : 1;
              opponentCutsRef.current += bonus;
              setOpponentCuts(opponentCutsRef.current);
            }

            // Intervalo organico entre 1.1s y 2.2s por corte
            const avgInterval = (60 / Math.max(10, opponentTargetCuts)) * 1000;
            const variance = (Math.random() - 0.5) * 800;
            nextRivalCutTimeRef.current = currentTime + Math.max(900, avgInterval + variance);
          }

          // Notificacion de ventaja dinamica
          const diff = playerCutsRef.current - opponentCutsRef.current;
          if (diff !== lastAdvantageRef.current) {
            lastAdvantageRef.current = diff;
            if (diff >= 3) {
              setBannerNotice(`¡Ventaja de +${diff} esferas!`);
            } else if (diff === 0 && playerCutsRef.current > 0) {
              setBannerNotice('¡Empatados a cortes!');
            } else if (diff <= -3) {
              setBannerNotice(`${opponentName} lidera por ${Math.abs(diff)}`);
            }
          }
        }

        // 4. Envio de paquete WebRTC P2P
        if (mode === 'realtime_p2p' && currentTime - lastP2PSendRef.current > 70) {
          lastP2PSendRef.current = currentTime;
          p2pDuelService.sendPacket({
            type: 'rhythm',
            score: playerCutsRef.current * 10,
            cutCount: playerCutsRef.current,
            timeLeft: Math.round(timeLeftRef.current),
          });
        }

        // 5. Actualizacion fisica de esferas sobre el tambor
        updateDuelSpheresPhysics(activeSpheresRef.current, dt, geoRef.current);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, opponentName, opponentTargetCuts]);

  const p1Won = playerCuts > opponentCuts;
  const isTie = playerCuts === opponentCuts;

  const handleFinishDuel = () => {
    onFinishDuel(playerCuts, opponentCuts, p1Won);
  };

  return (
    <div className="fixed inset-0 z-[120] select-none touch-none bg-[#0a0f1d] text-white overflow-hidden">
      <DrumCanvas
        spheres={renderSpheres}
        completedBeats={0}
        onSliceSphere={handleSliceSphere}
      />

      <Unit3DuelHud
        phase={phase}
        playerCuts={playerCuts}
        opponentCuts={opponentCuts}
        opponentName={opponentName}
        opponentTargetCuts={opponentTargetCuts}
        timeLeft={timeLeft}
        bannerNotice={bannerNotice}
        mode={mode}
        showMatchOverOverlay={showMatchOverOverlay}
        p1Won={p1Won}
        isTie={isTie}
        onStartGame={handleStartGame}
        onExit={onExit}
        onFinishDuel={handleFinishDuel}
      />
    </div>
  );
};

export default Unit3DuelArena;
