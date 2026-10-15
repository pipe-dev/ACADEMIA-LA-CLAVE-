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

export function useBreathingEngine() {
  const [selectedTechId, setSelectedTechId] = useState<string>('pursed-lips');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [balloonColor, setBalloonColor] = useState<BalloonColor>('red');

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

  // Smooth scroll to balloon
  const scrollToBalloon = useCallback(() => {
    setTimeout(() => {
      const el = balloonRef.current;
      if (!el) return;

      const startY = window.scrollY;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // Centra el globo de forma óptima en el viewport dejando espacio a los controles inferiores
      const targetRaw =
        startY + rect.top - Math.max(20, (viewportH - el.offsetHeight) / 2) + 115;
      const maxY = Math.max(
        0,
        (document.documentElement.scrollHeight || document.body.scrollHeight) -
          viewportH
      );
      const endY = Math.min(Math.max(0, targetRaw), maxY);

      if (Math.abs(endY - startY) < 2) return;

      const duration = 500;
      const t0 = performance.now();
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      let rafId: number | null = null;
      const cancelAnimation = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        window.removeEventListener('wheel', cancelAnimation);
        window.removeEventListener('touchstart', cancelAnimation);
      };

      window.addEventListener('wheel', cancelAnimation, { passive: true });
      window.addEventListener('touchstart', cancelAnimation, { passive: true });

      const step = (now: number) => {
        const progress = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, startY + (endY - startY) * easeOutCubic(progress));
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          cancelAnimation();
        }
      };

      rafId = requestAnimationFrame(step);
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
          return totalDuration;
        }

        const timeInCycle = next % cycleDuration;
        if (phaseBoundaries.includes(timeInCycle)) {
          audioService.playSoftDing();
          audioService.vibrate([25]);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, totalDuration, cycleDuration, phaseBoundaries]);

  const handleToggleActive = useCallback(() => {
    audioService.playClickSound();
    if (isFinished) {
      setElapsedSeconds(0);
      setIsActive(true);
    } else {
      setIsActive((prev) => !prev);
    }
  }, [isFinished]);

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
