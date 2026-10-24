'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { audioService } from '../../utils/audioService';
import confetti from 'canvas-confetti';
import { emitStreakEligibleAction } from '../../utils/streakPrompt';
import { emitQuestEvent } from '../../utils/dailyQuestsEngine';
import {
  BreathingTechnique,
  BREATHING_TECHNIQUES,
  BalloonColor
} from './breathingTypes';

export function useBreathingEngine(onGrantXp?: (amount: number) => void) {
  const [selectedTechId, setSelectedTechId] = useState<string>('diafragmatico-426');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [balloonColor, setBalloonColorState] = useState<BalloonColor>(() => {
    try {
      const saved = localStorage.getItem('laclave_breathing_balloon_color');
      if (saved && ['red', 'blue', 'purple', 'emerald', 'amber', 'pink', 'cyan'].includes(saved)) {
        return saved as BalloonColor;
      }
    } catch {}
    return 'red';
  });

  const setBalloonColor = useCallback((color: BalloonColor) => {
    setBalloonColorState(color);
    try {
      localStorage.setItem('laclave_breathing_balloon_color', color);
    } catch {}
  }, []);

  const balloonRef = useRef<HTMLDivElement | null>(null);

  const currentTech = useMemo(
    () =>
      BREATHING_TECHNIQUES.find((t) => t.id === selectedTechId) ||
      BREATHING_TECHNIQUES[0],
    [selectedTechId]
  );

  const targetCycles = currentTech.targetCycles || 2;
  const cycleDuration = useMemo(
    () => currentTech.phases.reduce((sum, p) => sum + p.duration, 0),
    [currentTech]
  );
  const totalDuration = cycleDuration * targetCycles;

  const isFinished = elapsedSeconds >= totalDuration;

  const completedCycles = Math.min(
    targetCycles,
    Math.floor(elapsedSeconds / cycleDuration)
  );

  // Time elapsed in current cycle
  const timeInCurrentCycle = isFinished
    ? cycleDuration
    : elapsedSeconds % cycleDuration;

  // Compute active phase and remaining seconds
  const { currentPhase, phaseSecondsLeft } = useMemo(() => {
    let accum = 0;
    for (let i = 0; i < currentTech.phases.length; i++) {
      const phase = currentTech.phases[i];
      accum += phase.duration;
      if (timeInCurrentCycle < accum || i === currentTech.phases.length - 1) {
        return {
          currentPhase: phase,
          phaseSecondsLeft: isFinished ? 0 : Math.max(1, accum - timeInCurrentCycle)
        };
      }
    }
    return {
      currentPhase: currentTech.phases[0],
      phaseSecondsLeft: currentTech.phases[0].duration
    };
  }, [currentTech, timeInCurrentCycle, isFinished]);

  // Phase transition boundaries within a cycle
  const phaseBoundaries = useMemo(() => {
    const boundaries = [0];
    let accum = 0;
    for (let i = 0; i < currentTech.phases.length - 1; i++) {
      accum += currentTech.phases[i].duration;
      boundaries.push(accum);
    }
    return boundaries;
  }, [currentTech]);

  // Smooth scroll to balloon (adaptive for modals and window)
  const scrollToBalloon = useCallback(() => {
    setTimeout(() => {
      const el = balloonRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }, []);

  // Reset progress when technique changes
  useEffect(() => {
    setIsActive(false);
    setElapsedSeconds(0);
  }, [selectedTechId]);

  // Single rock-solid timeline timer
  useEffect(() => {
    if (!isActive) return;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;

        if (next >= totalDuration) {
          setIsActive(false);
          audioService.playLessonCompleteSound();
          audioService.vibrate([40, 60, 40]);
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 }
          });
          emitStreakEligibleAction();
          emitQuestEvent('BREATHING_SESSION', 1);

          // Update breathing completed count for badge_5 ("Respiración consciente")
          try {
            const currentCount = parseInt(localStorage.getItem('laclave_breathing_completed_count') || '0', 10) || 0;
            localStorage.setItem('laclave_breathing_completed_count', String(currentCount + 1));
          } catch {}

          if (onGrantXp) {
            onGrantXp(20);
          }

          return totalDuration;
        }

        const timeInCycle = next % cycleDuration;
        if (phaseBoundaries.includes(timeInCycle)) {
          // Identify the exact phase starting at this second boundary
          let accum = 0;
          let startingPhase = currentTech.phases[0];
          for (let i = 0; i < currentTech.phases.length; i++) {
            if (accum === timeInCycle) {
              startingPhase = currentTech.phases[i];
              break;
            }
            accum += currentTech.phases[i].duration;
          }
          audioService.playBreathCue(startingPhase.type);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, totalDuration, cycleDuration, phaseBoundaries, currentTech, onGrantXp]);

  const handleToggleActive = useCallback(() => {
    if (isFinished) {
      audioService.playBreathCue(currentTech.phases[0].type);
      setElapsedSeconds(0);
      setIsActive(true);
    } else {
      setIsActive((prev) => {
        const nextState = !prev;
        if (nextState) {
          // Play initial cue for the currently visible phase when starting
          audioService.playBreathCue(currentPhase.type);
        } else {
          audioService.playClickSound();
        }
        return nextState;
      });
    }
  }, [isFinished, currentTech, currentPhase]);

  const handleReset = useCallback(() => {
    audioService.playClickSound();
    setIsActive(false);
    setElapsedSeconds(0);
  }, []);

  const handleSelectTechnique = useCallback(
    (techId: string) => {
      audioService.playClickSound();
      setSelectedTechId(techId);
      setIsActive(false);
      setElapsedSeconds(0);
      scrollToBalloon();
    },
    [scrollToBalloon]
  );

  return {
    selectedTechId,
    isActive,
    isFinished,
    currentPhase,
    currentTech,
    phaseSecondsLeft,
    completedCycles,
    balloonColor,
    setBalloonColor,
    balloonRef,
    handleToggleActive,
    handleReset,
    handleSelectTechnique
  };
}
