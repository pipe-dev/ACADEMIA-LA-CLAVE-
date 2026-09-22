// src/components/Unit3CelebrationModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveSphere, RhythmBeatState } from './unit3-rhythm/types';
import { DrumCanvas } from './unit3-rhythm/DrumCanvas';
import { TrophyCelebration } from './unit3-rhythm/TrophyCelebration';
import {
  playBassDrum,
  playSphereSlice,
  playDrumRollBuildup,
  playGoldenCrashFanfare,
  playDullBounce,
  setRhythmAudioMuted,
} from './unit3-rhythm/rhythmAudio';

export interface Unit3CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
  bpm?: number;
  isMuted?: boolean;
  testStartBeat?: number; // 1, 2, 3, or 4 for testing
  testShowTrophy?: boolean;
}

export const Unit3CelebrationModal: React.FC<Unit3CelebrationModalProps> = ({
  isOpen,
  onContinue,
  bpm = 120,
  isMuted = false,
  testStartBeat = 1,
  testShowTrophy = false,
}) => {
  const [gameState, setGameState] = useState<RhythmBeatState>('PULSE_1');
  const [completedBeats, setCompletedBeats] = useState<number>(0);
  const [activeSpheres, setActiveSpheres] = useState<ActiveSphere[]>([]);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [showTrophy, setShowTrophy] = useState<boolean>(false);

  const beatIntervalMs = 60000 / bpm; // 500ms at 120 BPM
  const gameStateRef = useRef<RhythmBeatState>('PULSE_1');
  const completedBeatsRef = useRef<number>(0);
  const activeSpheresRef = useRef<ActiveSphere[]>([]);
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    setRhythmAudioMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    completedBeatsRef.current = completedBeats;
  }, [completedBeats]);

  const getDrumGeometry = () => {
    const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 430;
    const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 932;
    const drumW = canvasWidth * 1.15;
    const drumH = drumW * (681 / 1024);
    const drumY = canvasHeight - drumH + 14;
    const drumCenterY = drumY + drumH * 0.44;
    const drumRadiusY = drumH * 0.284;
    const drumSurfaceY = drumCenterY - drumRadiusY * 0.12;
    return { canvasWidth, canvasHeight, drumSurfaceY };
  };

  // Create a sphere configured for its lane
  const createSphere = useCallback(
    (type: 'purple' | 'golden', lane: 'left' | 'right' | 'center', startDelayMs = 0): ActiveSphere => {
      const isGolden = type === 'golden';
      const now = performance.now() + startDelayMs;
      const halfFlightTime = beatIntervalMs;

      const { canvasWidth, canvasHeight, drumSurfaceY } = getDrumGeometry();

      let startX = canvasWidth * 0.5;
      if (lane === 'left') {
        startX = canvasWidth * 0.36 + (Math.random() - 0.5) * 30;
      } else if (lane === 'right') {
        startX = canvasWidth * 0.64 + (Math.random() - 0.5) * 30;
      }

      const startY = drumSurfaceY;
      const peakRatio = isGolden
        ? 0.28
        : lane === 'left'
        ? 0.30 + Math.random() * 0.05
        : 0.34 + Math.random() * 0.05;
      const peakY = canvasHeight * peakRatio;

      const tApex = halfFlightTime / 1000;
      const deltaY = startY - peakY;
      const g = (2 * deltaY) / (tApex * tApex);
      const vy0 = -g * tApex;

      return {
        id: Date.now() + Math.random(),
        type,
        x: startX,
        y: startY,
        radius: isGolden ? 42 : 32,
        vx:
          lane === 'left'
            ? 20 + Math.random() * 25
            : lane === 'right'
            ? -(20 + Math.random() * 25)
            : (Math.random() - 0.5) * 30,
        vy: vy0,
        g,
        isCut: false,
        birthTime: now,
        peakTime: now + halfFlightTime,
        bounceCount: 0,
      };
    },
    [beatIntervalMs]
  );

  // Launch spheres for the active beat
  const launchSpheres = useCallback(
    (beatIndex: number) => {
      if (beatIndex === 4) {
        // Grand Golden Sphere in center
        const golden = createSphere('golden', 'center');
        activeSpheresRef.current = [golden];
        setActiveSpheres([golden]);
        playBassDrum(true);
      } else {
        // 2 simultaneous bouncing spheres on the drum!
        const s1 = createSphere('purple', 'left');
        const s2 = createSphere('purple', 'right', 60);
        activeSpheresRef.current = [s1, s2];
        setActiveSpheres([s1, s2]);
        playBassDrum(false);
      }
    },
    [createSphere]
  );

  // Reset sequence cleanly
  const resetToBeatOne = useCallback(() => {
    if (isTransitioningRef.current) return;
    setCompletedBeats(0);
    completedBeatsRef.current = 0;
    setGameState('PULSE_1');
    gameStateRef.current = 'PULSE_1';
    setIsSlowMo(false);
    setShowTrophy(false);
    launchSpheres(1);
  }, [launchSpheres]);

  // Slice sphere callback from DrumCanvas
  const handleSliceSphere = useCallback(
    (sphere: ActiveSphere, _cutCoord: { x: number; y: number }) => {
      const currentBeat = completedBeatsRef.current + 1;

      if (sphere.type === 'golden') {
        // Grand Final Beat Sliced!
        setIsSlowMo(true);
        playGoldenCrashFanfare();
        setCompletedBeats(4);
        completedBeatsRef.current = 4;
        setGameState('SLOWMO_CUT');
        gameStateRef.current = 'SLOWMO_CUT';

        setTimeout(() => {
          setGameState('TROPHY_REVEAL');
          gameStateRef.current = 'TROPHY_REVEAL';
          setShowTrophy(true);
        }, 650);
      } else {
        // Regular purple sphere 1, 2, 3 sliced
        playSphereSlice(currentBeat);
        setCompletedBeats(currentBeat);
        completedBeatsRef.current = currentBeat;

        // Replenish so 2 spheres continue bouncing until beat 3 is done!
        if (currentBeat < 3) {
          setTimeout(() => {
            if (gameStateRef.current !== 'TROPHY_REVEAL' && gameStateRef.current !== 'BUILDUP') {
              setGameState((`PULSE_${currentBeat + 1}`) as RhythmBeatState);
              const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 430;
              const lane = sphere.x < canvasWidth * 0.5 ? 'left' : 'right';
              const fresh = createSphere('purple', lane);
              const remaining = activeSpheresRef.current.filter((s) => s.id !== sphere.id && !s.isCut);
              activeSpheresRef.current = [...remaining, fresh];
              setActiveSpheres([...activeSpheresRef.current]);
            }
          }, 350);
        } else if (currentBeat === 3) {
          // Buildup to Golden Sphere
          setGameState('BUILDUP');
          gameStateRef.current = 'BUILDUP';
          playDrumRollBuildup();

          setTimeout(() => {
            if (gameStateRef.current !== 'TROPHY_REVEAL') {
              setGameState('GOLDEN_PULSE');
              gameStateRef.current = 'GOLDEN_PULSE';
              launchSpheres(4);
            }
          }, 400);
        }
      }
    },
    [launchSpheres, createSphere]
  );

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      isTransitioningRef.current = false;
      if (testShowTrophy) {
        setCompletedBeats(4);
        completedBeatsRef.current = 4;
        setGameState('TROPHY_REVEAL');
        gameStateRef.current = 'TROPHY_REVEAL';
        setShowTrophy(true);
      } else if (testStartBeat === 4) {
        setCompletedBeats(3);
        completedBeatsRef.current = 3;
        setGameState('GOLDEN_PULSE');
        gameStateRef.current = 'GOLDEN_PULSE';
        setIsSlowMo(false);
        setShowTrophy(false);
        launchSpheres(4);
      } else {
        resetToBeatOne();
      }
    }
  }, [isOpen, testShowTrophy, testStartBeat, resetToBeatOne, launchSpheres]);

  // Physics animation loop for sphere positions
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const spheres = activeSpheresRef.current;
      let hasUpdate = false;

      const { canvasWidth, canvasHeight, drumSurfaceY } = getDrumGeometry();

      spheres.forEach((sphere) => {
        if (sphere.isCut || gameStateRef.current === 'TROPHY_REVEAL') return;
        hasUpdate = true;

        const speedMultiplier = isSlowMo ? 0.3 : 1.0;
        const g = sphere.g * speedMultiplier;
        sphere.vy += g * dt;
        sphere.y += sphere.vy * dt * speedMultiplier;
        sphere.x += sphere.vx * dt * speedMultiplier;

        // Keep inside screen bounds (bounce off side walls)
        const margin = 45;
        if (sphere.x <= margin) {
          sphere.x = margin;
          sphere.vx = Math.abs(sphere.vx) || 50;
        } else if (sphere.x >= canvasWidth - margin) {
          sphere.x = canvasWidth - margin;
          sphere.vx = -(Math.abs(sphere.vx) || 50);
        }

        // Drum membrane bounce — energetic perpetual jump!
        if (sphere.y >= drumSurfaceY && sphere.vy > 0) {
          sphere.y = drumSurfaceY;

          const randomPeakRatio =
            sphere.type === 'golden'
              ? 0.28 + Math.random() * 0.06
              : 0.30 + Math.random() * 0.08;
          const peakY = canvasHeight * randomPeakRatio;
          const deltaY = drumSurfaceY - peakY;
          sphere.vy = -Math.sqrt(2 * sphere.g * deltaY);

          const center = canvasWidth * 0.5;
          if (sphere.x < center - 60) {
            sphere.vx = 35 + Math.random() * 65;
          } else if (sphere.x > center + 60) {
            sphere.vx = -(35 + Math.random() * 65);
          } else {
            sphere.vx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 55);
          }

          playBassDrum(sphere.type === 'golden');
          sphere.bounceCount++;
        }
      });

      if (hasUpdate) {
        setActiveSpheres([...spheres]);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isSlowMo, resetToBeatOne]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e9f0ff] select-none overflow-hidden animate-fade-in">
      {/* Technical Grid Background copied directly from AfinadorView */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f15_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />

      {/* Main 3D Drum & Spheres Canvas */}
      <DrumCanvas
        spheres={activeSpheres}
        completedBeats={completedBeats}
        onSliceSphere={handleSliceSphere}
        isSlowMo={isSlowMo}
      />

      {/* Trophy Reveal View (Zero Text Clutter, Pure Celebration) */}
      <TrophyCelebration isOpen={showTrophy} onContinue={onContinue} />
    </div>
  );
};
