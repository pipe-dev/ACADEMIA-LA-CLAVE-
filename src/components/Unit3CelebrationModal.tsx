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
  const [activeSphere, setActiveSphere] = useState<ActiveSphere | null>(null);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [showTrophy, setShowTrophy] = useState<boolean>(false);

  const beatIntervalMs = 60000 / bpm; // 500ms at 120 BPM
  const gameStateRef = useRef<RhythmBeatState>('PULSE_1');
  const completedBeatsRef = useRef<number>(0);
  const currentSphereRef = useRef<ActiveSphere | null>(null);
  const lastBeatTimeRef = useRef<number>(0);
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

  // Launch a new sphere from the drum surface
  const launchSphere = useCallback((beatIndex: number) => {
    const isGolden = beatIndex === 4;
    const now = performance.now();
    const halfFlightTime = beatIntervalMs; // reach peak at exactly beatIntervalMs
    const totalFlightTime = beatIntervalMs * 2;

    const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 430;
    const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 932;

    const startX = canvasWidth * 0.5 + (Math.random() - 0.5) * 60;
    const startY = canvasHeight * 0.82;
    const peakY = canvasHeight * (isGolden ? 0.38 : 0.44);

    // Initial velocity to reach peakY in halfFlightTime with gravity g:
    // peakY = startY + vy0*t + 0.5*g*t^2, and at peak vy = 0 -> vy0 = -g*t
    // peakY = startY - 0.5 * g * t^2 -> g = 2 * (startY - peakY) / (t^2)
    const tApex = halfFlightTime / 1000; // in seconds
    const deltaY = startY - peakY;
    const g = (2 * deltaY) / (tApex * tApex); // exact gravity to reach peak in halfFlightTime
    const vy0 = -g * tApex; // exact initial velocity

    const newSphere: ActiveSphere = {
      id: Date.now() + Math.random(),
      type: isGolden ? 'golden' : 'purple',
      x: startX,
      y: startY,
      radius: isGolden ? 42 : 32,
      vx: (Math.random() - 0.5) * 30,
      vy: vy0,
      g,
      isCut: false,
      birthTime: now,
      peakTime: now + halfFlightTime,
      bounceCount: 0,
    };

    currentSphereRef.current = newSphere;
    setActiveSphere(newSphere);
    playBassDrum(isGolden);
  }, [beatIntervalMs]);

  // Reset sequence cleanly
  const resetToBeatOne = useCallback(() => {
    if (isTransitioningRef.current) return;
    setCompletedBeats(0);
    completedBeatsRef.current = 0;
    setGameState('PULSE_1');
    gameStateRef.current = 'PULSE_1';
    setIsSlowMo(false);
    setShowTrophy(false);
    launchSphere(1);
  }, [launchSphere]);

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

        // Schedule next beat
        if (currentBeat < 3) {
          setTimeout(() => {
            if (gameStateRef.current !== 'TROPHY_REVEAL') {
              setGameState((`PULSE_${currentBeat + 1}`) as RhythmBeatState);
              launchSphere(currentBeat + 1);
            }
          }, 420);
        } else if (currentBeat === 3) {
          // Buildup to Golden Sphere
          setGameState('BUILDUP');
          gameStateRef.current = 'BUILDUP';
          playDrumRollBuildup();

          setTimeout(() => {
            if (gameStateRef.current !== 'TROPHY_REVEAL') {
              setGameState('GOLDEN_PULSE');
              gameStateRef.current = 'GOLDEN_PULSE';
              launchSphere(4);
            }
          }, 320);
        }
      }
    },
    [launchSphere]
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
        launchSphere(4);
      } else {
        resetToBeatOne();
      }
    }
  }, [isOpen, testShowTrophy, testStartBeat, resetToBeatOne, launchSphere]);

  // Physics animation loop for sphere position
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000; // in seconds
      lastTime = currentTime;

      const sphere = currentSphereRef.current;
      if (sphere && !sphere.isCut && gameStateRef.current !== 'TROPHY_REVEAL') {
        // Physics update
        const speedMultiplier = isSlowMo ? 0.3 : 1.0;
        const g = sphere.g * speedMultiplier; // calibrated gravity
        sphere.vy += g * dt;
        sphere.y += sphere.vy * dt * speedMultiplier;
        sphere.x += sphere.vx * dt * speedMultiplier;

        const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 430;
        const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 932;
        const drumSurfaceY = canvasHeight * 0.81;

        // 1. Keep sphere strictly inside visible screen (bounce off side walls)
        const margin = 45;
        if (sphere.x <= margin) {
          sphere.x = margin;
          sphere.vx = Math.abs(sphere.vx) || 50;
        } else if (sphere.x >= canvasWidth - margin) {
          sphere.x = canvasWidth - margin;
          sphere.vx = -(Math.abs(sphere.vx) || 50);
        }

        // 2. Perpetual, energetic bounce off the drum membrane — NEVER loses momentum!
        if (sphere.y >= drumSurfaceY && sphere.vy > 0) {
          sphere.y = drumSurfaceY;

          // Randomized peak height (between 34% and 44% of canvas height)
          const randomPeakRatio = sphere.type === 'golden'
            ? 0.34 + Math.random() * 0.08
            : 0.37 + Math.random() * 0.10;
          const peakY = canvasHeight * randomPeakRatio;
          const deltaY = drumSurfaceY - peakY;

          // Fresh full impulse so the jump is always crisp and high
          sphere.vy = -Math.sqrt(2 * sphere.g * deltaY);

          // Randomized horizontal velocity within bounds: steer towards center if drifting
          const center = canvasWidth * 0.5;
          if (sphere.x < center - 60) {
            // Steer back towards center-right
            sphere.vx = 45 + Math.random() * 65;
          } else if (sphere.x > center + 60) {
            // Steer back towards center-left
            sphere.vx = -(45 + Math.random() * 65);
          } else {
            // Around center: pick random direction
            sphere.vx = (Math.random() > 0.5 ? 1 : -1) * (35 + Math.random() * 60);
          }

          playBassDrum(sphere.type === 'golden');
          sphere.bounceCount++;
        }

        setActiveSphere({ ...sphere });
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
        activeSphere={activeSphere}
        completedBeats={completedBeats}
        onSliceSphere={handleSliceSphere}
        isSlowMo={isSlowMo}
      />

      {/* Trophy Reveal View (Zero Text Clutter, Pure Celebration) */}
      <TrophyCelebration isOpen={showTrophy} onContinue={onContinue} />
    </div>
  );
};
