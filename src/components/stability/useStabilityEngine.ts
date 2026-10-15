'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { audioService } from '../../utils/audioService';
import {
  getComfortableChromaticNotes,
  generateUserNotePool,
  voicePlayback,
  ChromaticNoteButtonInfo
} from '../../utils/voicePlaybackService';
import confetti from 'canvas-confetti';
import { emitStreakEligibleAction } from '../../utils/streakPrompt';
import { emitQuestEvent } from '../../utils/dailyQuestsEngine';
import { SavedVocalRangeData, StabilityPhase } from './stabilityTypes';

export interface UseStabilityEngineProps {
  isOpen?: boolean;
  isEmbeddedView?: boolean;
  onGrantXp?: (amount: number) => void;
}

export function useStabilityEngine({
  isOpen = true,
  isEmbeddedView = false,
  onGrantXp
}: UseStabilityEngineProps) {
  const toleranceHz = 3.5; // Tight tolerance range ±3.5 Hz

  const getInitialRangeState = (): SavedVocalRangeData | null => {
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      if (saved) return JSON.parse(saved) as SavedVocalRangeData;
    } catch {}
    return null;
  };

  const getInitialGender = (): 'masculino' | 'femenino' => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
    } catch {}
    return 'femenino';
  };

  const [effectiveRangeData, setEffectiveRangeData] = useState<SavedVocalRangeData | null>(
    getInitialRangeState
  );
  const [gender, setGender] = useState<'masculino' | 'femenino'>(getInitialGender);

  // Sync vocal range when opened
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) return;
    try {
      const savedRange = localStorage.getItem('laclave_vocal_range_saved');
      if (savedRange) setEffectiveRangeData(JSON.parse(savedRange));
    } catch {}
    try {
      const savedGender = localStorage.getItem('laclave_voice_gender');
      if (savedGender === 'masculino' || savedGender === 'femenino') setGender(savedGender);
    } catch {}
  }, [isOpen, isEmbeddedView]);

  // Preload real vocal recordings
  useEffect(() => {
    if (isOpen || isEmbeddedView) voicePlayback.preloadNotes(gender);
  }, [gender, isOpen, isEmbeddedView]);

  const userNotePool = useMemo(
    () => generateUserNotePool(effectiveRangeData, gender),
    [effectiveRangeData, gender]
  );

  const { naturalNotes } = useMemo(
    () => getComfortableChromaticNotes(effectiveRangeData, gender),
    [effectiveRangeData, gender]
  );

  const isNoteInRange = useCallback(
    (note: ChromaticNoteButtonInfo): boolean =>
      userNotePool.some(p => p.midi === note.midi),
    [userNotePool]
  );

  // Selected note initialization and bounds check
  const [selectedNote, setSelectedNote] = useState<ChromaticNoteButtonInfo>(() => {
    const range = getInitialRangeState();
    const voiceGender = getInitialGender();
    const chrom = getComfortableChromaticNotes(range, voiceGender);
    const pool = generateUserNotePool(range, voiceGender);
    const pick = (n: ChromaticNoteButtonInfo) => pool.some(p => p.midi === n.midi);
    return (
      chrom.naturalNotes.find(n => n.semitone === 9 && pick(n)) ||
      chrom.naturalNotes.find(pick) ||
      chrom.naturalNotes[0] ||
      chrom.allNotes[0]
    );
  });

  useEffect(() => {
    if (!isNoteInRange(selectedNote)) {
      const laInRange = naturalNotes.find(n => n.semitone === 9 && isNoteInRange(n));
      setSelectedNote(
        laInRange || naturalNotes.find(isNoteInRange) || naturalNotes[0]
      );
    }
  }, [userNotePool, naturalNotes, selectedNote, isNoteInRange]);

  // Challenge phase: 'setup' | 'singing' | 'results'
  const [phase, setPhase] = useState<StabilityPhase>('setup');

  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [inTuneSeconds, setInTuneSeconds] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [isCurrentlyInTune, setIsCurrentlyInTune] = useState<boolean>(false);

  // Results metrics
  const [finalScore, setFinalScore] = useState<number>(0);
  const [xpMultiplier, setXpMultiplier] = useState<number>(1.0);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  // Performance refs
  const animFrameRef = useRef<number | null>(null);
  const challengeStartTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const inTuneMsRef = useRef<number>(0);
  const latestPitchRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef<number>(0);
  const lastVibeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    audioService.stopMicrophone();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) {
      cleanup();
      setPhase('setup');
      setTimeLeft(10);
      setInTuneSeconds(0);
      setCurrentPitch(null);
      setIsCurrentlyInTune(false);
    }
    return () => cleanup();
  }, [isOpen, isEmbeddedView, cleanup]);

  const finishChallenge = useCallback(
    (heldSeconds: number) => {
      cleanup();
      setPhase('results');
      emitStreakEligibleAction();
      const clampedHeld = Math.min(10, Math.max(0, Number(heldSeconds.toFixed(1))));

      if (clampedHeld >= 3.0) {
        emitQuestEvent('STABILITY_PASSED', 1);
      }

      let mult = 1.0;
      if (clampedHeld >= 8.5) mult = 3.0;
      else if (clampedHeld >= 6.0) mult = 2.0;
      else if (clampedHeld >= 3.0) mult = 1.5;

      const baseAmount = 25;
      const totalGrantedXp = Math.round(baseAmount * mult);

      setFinalScore(clampedHeld);
      setXpMultiplier(mult);
      setEarnedXp(totalGrantedXp);

      if (mult >= 2.0) {
        audioService.playBadgeUnlockedSound();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } else {
        audioService.playSoftDing();
      }

      if (onGrantXp) {
        onGrantXp(totalGrantedXp);
      }
    },
    [cleanup, onGrantXp]
  );

  const startChallenge = async () => {
    audioService.playClickSound();
    cleanup();

    setPhase('singing');
    setTimeLeft(10);
    setInTuneSeconds(0);
    setCurrentPitch(null);
    setIsCurrentlyInTune(false);

    inTuneMsRef.current = 0;
    latestPitchRef.current = null;
    const now = performance.now();
    challengeStartTimeRef.current = now;
    lastFrameTimeRef.current = now;
    lastStateUpdateRef.current = now;

    const targetFreq = selectedNote.frequency;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        latestPitchRef.current = pitchHz;
      } else {
        latestPitchRef.current = null;
      }
    });

    if (!micSuccess) {
      alert('Se requiere acceso al micrófono para el Desafío de Estabilidad.');
      setPhase('setup');
      return;
    }

    const loop = () => {
      const currentTime = performance.now();
      const deltaMs = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      const elapsedSec = (currentTime - challengeStartTimeRef.current) / 1000;
      const remainingSec = Math.max(0, 10 - elapsedSec);

      const pitch = latestPitchRef.current;
      let inTune = false;
      if (pitch !== null) {
        const diff = Math.abs(pitch - targetFreq);
        if (diff <= toleranceHz) {
          inTune = true;
          inTuneMsRef.current += deltaMs;

          if (currentTime - lastVibeRef.current > 1200) {
            audioService.vibrateInTune();
            lastVibeRef.current = currentTime;
          }
        }
      }

      // Check if 10 seconds finished
      if (remainingSec <= 0) {
        const finalHeld = inTuneMsRef.current / 1000;
        finishChallenge(finalHeld);
        return;
      }

      // Throttle React state updates to ~12 FPS (every 80ms) for ultra-smooth UI
      if (currentTime - lastStateUpdateRef.current >= 80) {
        lastStateUpdateRef.current = currentTime;
        setTimeLeft(Math.ceil(remainingSec));
        setInTuneSeconds(Number((inTuneMsRef.current / 1000).toFixed(1)));
        setCurrentPitch(pitch !== null ? Math.round(pitch) : null);
        setIsCurrentlyInTune(inTune);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  return {
    phase,
    setPhase,
    gender,
    naturalNotes,
    selectedNote,
    setSelectedNote,
    isNoteInRange,
    startChallenge,
    cleanup,
    timeLeft,
    inTuneSeconds,
    currentPitch,
    isCurrentlyInTune,
    finalScore,
    xpMultiplier,
    earnedXp
  };
}
