// src/components/Unit3CelebrationModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BombCable, BombCinematicState } from './unit3-bomb/types';
import { CablePhysicsCanvas } from './unit3-bomb/CablePhysicsCanvas';
import { TacticalBriefcase } from './unit3-bomb/TacticalBriefcase';
import { TrophyReveal } from './unit3-bomb/TrophyReveal';
import {
  playTickSound,
  playSnipRelaySound,
  playCircuitBuzzSound,
  playPneumaticReleaseSound,
  playVictoryFanfare,
  playTimeoutPuffSound,
  setBombAudioMuted,
} from '../utils/bombAudio';

export interface Unit3CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
  initialBpm?: number;
  isMuted?: boolean;
  debugForceVictory?: boolean;
  debugForceTimeout?: boolean;
  onTelemetryUpdate?: (info: { lastOffsetMs: number; isOnBeat: boolean; fps: number }) => void;
}

const INITIAL_CABLES: BombCable[] = [
  {
    id: 1,
    name: 'Circuito Alfa',
    label: 'C1-CIAN',
    color: '#00f2fe',
    strokeColor: '#38bdf8',
    glowColor: '#0284c7',
    isCut: false,
    anchorY: 0.22,
  },
  {
    id: 2,
    name: 'Circuito Beta',
    label: 'C2-ROJO',
    color: '#ef4444',
    strokeColor: '#f87171',
    glowColor: '#dc2626',
    isCut: false,
    anchorY: 0.4,
  },
  {
    id: 3,
    name: 'Circuito Gamma',
    label: 'C3-AMBAR',
    color: '#eab308',
    strokeColor: '#facc15',
    glowColor: '#ca8a04',
    isCut: false,
    anchorY: 0.58,
  },
  {
    id: 4,
    name: 'Circuito Omega',
    label: 'C4-MASTER',
    color: '#a855f7',
    strokeColor: '#c084fc',
    glowColor: '#7c3aed',
    isCut: false,
    anchorY: 0.76,
  },
];

export const Unit3CelebrationModal: React.FC<Unit3CelebrationModalProps> = ({
  isOpen,
  onContinue,
  initialBpm = 120,
  isMuted = false,
  debugForceVictory = false,
  debugForceTimeout = false,
  onTelemetryUpdate,
}) => {
  const [state, setState] = useState<BombCinematicState>('DEFUSING');
  const [timeLeftMs, setTimeLeftMs] = useState<number>(8000);
  const [cables, setCables] = useState<BombCable[]>(INITIAL_CABLES);
  const [scannerX, setScannerX] = useState<number>(0.5);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  const timeLeftMsRef = useRef<number>(8000);
  const stateRef = useRef<BombCinematicState>('DEFUSING');
  const cablesRef = useRef<BombCable[]>(INITIAL_CABLES);
  const lastTickSecondRef = useRef<number>(8);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcRef = useRef<number>(0);

  // Sync mute setting
  useEffect(() => {
    setBombAudioMuted(isMuted);
  }, [isMuted]);

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    cablesRef.current = cables;
  }, [cables]);

  useEffect(() => {
    timeLeftMsRef.current = timeLeftMs;
  }, [timeLeftMs]);

  // Reset state when modal opens or closes
  const resetGame = useCallback(() => {
    setState('DEFUSING');
    stateRef.current = 'DEFUSING';
    setTimeLeftMs(8000);
    timeLeftMsRef.current = 8000;
    lastTickSecondRef.current = 8;
    setScreenShake(false);
    setCables(INITIAL_CABLES.map((c) => ({ ...c, isCut: false, leftPiece: undefined, rightPiece: undefined })));
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen, resetGame]);

  // Handle debug overrides
  useEffect(() => {
    if (debugForceVictory) {
      setState('DEFUSED_SLOWMO');
      setTimeLeftMs(1000);
      timeLeftMsRef.current = 1000;
      setCables((prev) => prev.map((c) => ({ ...c, isCut: true })));
      setTimeout(() => setState('UNLATCHING'), 400);
      setTimeout(() => setState('TROPHY_REVEAL'), 900);
    }
  }, [debugForceVictory]);

  useEffect(() => {
    if (debugForceTimeout) {
      setState('TIMEOUT_PUFF');
      setTimeLeftMs(0);
      timeLeftMsRef.current = 0;
    }
  }, [debugForceTimeout]);

  // Trigger Victory Sequence
  const triggerVictorySequence = useCallback(() => {
    setState('DEFUSED_SLOWMO');
    stateRef.current = 'DEFUSED_SLOWMO';
    setTimeLeftMs(1000); // 00:01.00
    timeLeftMsRef.current = 1000;

    setTimeout(() => {
      setState('UNLATCHING');
      stateRef.current = 'UNLATCHING';
      playPneumaticReleaseSound();

      setTimeout(() => {
        setState('HATCH_OPENING');
        stateRef.current = 'HATCH_OPENING';

        setTimeout(() => {
          setState('TROPHY_REVEAL');
          stateRef.current = 'TROPHY_REVEAL';
          playVictoryFanfare();
        }, 500);
      }, 700);
    }, 600);
  }, []);

  // Handle slice attempt on a cable
  const handleCableSliceAttempt = useCallback(
    (cableIndex: number, _cutCoord: { x: number; y: number }) => {
      if (stateRef.current !== 'DEFUSING') return;

      const currentCables = cablesRef.current;
      const targetCable = currentCables[cableIndex];
      if (!targetCable || targetCable.isCut) return;

      // Evaluate rhythmic tempo accuracy
      const now = performance.now();
      const beatInterval = 60000 / initialBpm; // e.g. 500ms for 120 BPM
      const phase = now % beatInterval;
      // Distance to nearest beat pulse
      const distToBeat = Math.min(phase, beatInterval - phase);
      const isOnBeat = distToBeat <= 135; // ±135ms tolerance window

      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          lastOffsetMs: Math.round(distToBeat),
          isOnBeat,
          fps: 60,
        });
      }

      if (isOnBeat) {
        // Success: cut the cable on-beat
        playSnipRelaySound();

        const updated = currentCables.map((c, idx) => (idx === cableIndex ? { ...c, isCut: true } : c));
        setCables(updated);
        cablesRef.current = updated;

        // Check if all 4 are cut
        const allCut = updated.every((c) => c.isCut);
        if (allCut) {
          triggerVictorySequence();
        }
      } else {
        // Penalty: off-beat strike
        playCircuitBuzzSound();
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 200);

        // Deduct 1.00s penalty
        const penalizedTime = Math.max(0, timeLeftMsRef.current - 1000);
        timeLeftMsRef.current = penalizedTime;
        setTimeLeftMs(penalizedTime);

        if (penalizedTime <= 0) {
          setState('TIMEOUT_PUFF');
          stateRef.current = 'TIMEOUT_PUFF';
          playTimeoutPuffSound();
        }
      }
    },
    [initialBpm, onTelemetryUpdate, triggerVictorySequence]
  );

  // Main RAF loop for clock countdown & laser sweep
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;

    const loop = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const dt = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Telemetry FPS calc
      frameCountRef.current++;
      if (timestamp - lastFpsCalcRef.current > 1000) {
        lastFpsCalcRef.current = timestamp;
        frameCountRef.current = 0;
      }

      const beatInterval = 60000 / initialBpm;

      // Laser scanner position: smooth sinusoidal sweep synchronized to beats
      const laserCycle = (timestamp % (beatInterval * 2)) / (beatInterval * 2);
      const laserNormalized = 0.5 + 0.44 * Math.sin(laserCycle * Math.PI * 2);
      setScannerX(laserNormalized);

      // Countdown timer logic while in DEFUSING state
      if (stateRef.current === 'DEFUSING') {
        const nextTime = Math.max(0, timeLeftMsRef.current - dt);
        timeLeftMsRef.current = nextTime;
        setTimeLeftMs(nextTime);

        // Tick sound logic on full seconds
        const currentSec = Math.ceil(nextTime / 1000);
        if (currentSec < lastTickSecondRef.current && nextTime > 0) {
          lastTickSecondRef.current = currentSec;
          playTickSound(nextTime <= 3000);
        }

        if (nextTime <= 0) {
          setState('TIMEOUT_PUFF');
          stateRef.current = 'TIMEOUT_PUFF';
          playTimeoutPuffSound();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, initialBpm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto">
        <TacticalBriefcase
          timeLeftMs={timeLeftMs}
          cables={cables}
          scannerProgress={scannerX}
          screenShake={screenShake}
          isSlowMoFrozen={state !== 'DEFUSING' && state !== 'TIMEOUT_PUFF'}
        >
          {/* Cable Physics & Fruit Ninja Blade Layer */}
          <CablePhysicsCanvas
            cables={cables}
            onCableSliceAttempt={handleCableSliceAttempt}
            scannerX={scannerX}
            disabled={state !== 'DEFUSING'}
          />

          {/* Overlay Reveal Hatch & Golden Drum Trophy */}
          {state !== 'DEFUSING' && (
            <TrophyReveal
              state={
                state === 'TIMEOUT_PUFF'
                  ? 'TIMEOUT_PUFF'
                  : state === 'TROPHY_REVEAL'
                  ? 'TROPHY_REVEAL'
                  : 'UNLATCHING'
              }
              onContinue={onContinue}
              onRetry={resetGame}
            />
          )}
        </TacticalBriefcase>
      </div>
    </div>
  );
};
