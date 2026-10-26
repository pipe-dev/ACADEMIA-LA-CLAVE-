'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { audioService } from '../../utils/audioService';
import { calculateCentsOff } from '../../utils/pitchUtils';
import {
  getComfortableChromaticNotes,
  generateUserNotePool,
  voicePlayback,
  ChromaticNoteButtonInfo
} from '../../utils/voicePlaybackService';
import confetti from 'canvas-confetti';
import { emitStreakEligibleAction } from '../../utils/streakPrompt';
import { emitQuestEvent } from '../../utils/dailyQuestsEngine';
import { SavedVocalRangeData, StabilityPhase, StabilityTrailPoint } from './stabilityTypes';

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
  // Tolerancia acústica pedagógica estándar: ±25 cents (1/4 semitono)
  const STABILITY_TOLERANCE_CENTS = 25;

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
  const [selectedOctave, setSelectedOctave] = useState<number | null>(null);

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

  // Chromatic data with active octave support
  const chromaticData = useMemo(
    () => getComfortableChromaticNotes(effectiveRangeData, gender, selectedOctave ?? undefined),
    [effectiveRangeData, gender, selectedOctave]
  );

  const { naturalNotes, sharpNotes, allNotes, availableOctaves, currentOctave } = chromaticData;

  const isNoteInRange = useCallback(
    (note: ChromaticNoteButtonInfo): boolean =>
      userNotePool.some(p => p.midi === note.midi),
    [userNotePool]
  );

  // Selected note initialization
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

  // When changing octave, ensure selected note belongs to the current octave
  const handleSelectOctave = useCallback((oct: number) => {
    audioService.playClickSound();
    setSelectedOctave(oct);
    const targetNotes = getComfortableChromaticNotes(effectiveRangeData, gender, oct);
    const matchingNote = targetNotes.allNotes.find(n => n.name.toUpperCase() === selectedNote.name.toUpperCase()) ||
      targetNotes.naturalNotes[0] ||
      targetNotes.allNotes[0];
    if (matchingNote) {
      setSelectedNote(matchingNote);
      voicePlayback.playVoiceNote(
        { name: matchingNote.displayName || matchingNote.name, midi: matchingNote.midi, frequency: matchingNote.frequency, octave: matchingNote.octave },
        gender,
        2.0
      );
    }
  }, [effectiveRangeData, gender, selectedNote.name]);

  const handleSelectNote = useCallback((note: ChromaticNoteButtonInfo) => {
    audioService.playClickSound();
    setSelectedNote(note);
    setSelectedOctave(note.octave);
    voicePlayback.playVoiceNote(
      { name: note.displayName || note.name, midi: note.midi, frequency: note.frequency, octave: note.octave },
      gender,
      2.0
    );
  }, [gender]);

  // Challenge phase: 'setup' | 'singing' | 'results'
  const [phase, setPhase] = useState<StabilityPhase>('setup');

  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [inTuneSeconds, setInTuneSeconds] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [centsOff, setCentsOff] = useState<number>(0);
  const [isCurrentlyInTune, setIsCurrentlyInTune] = useState<boolean>(false);
  const [trailPoints, setTrailPoints] = useState<StabilityTrailPoint[]>([]);

  // Results metrics
  const [finalScore, setFinalScore] = useState<number>(0);
  const [xpMultiplier, setXpMultiplier] = useState<number>(1.0);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [stabilityPercent, setStabilityPercent] = useState<number>(0);

  // Performance refs
  const animFrameRef = useRef<number | null>(null);
  const challengeStartTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const inTuneMsRef = useRef<number>(0);
  const latestPitchRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef<number>(0);
  const lastPointTimeRef = useRef<number>(0);
  const lastVibeRef = useRef<number>(0);
  const trailPointsRef = useRef<StabilityTrailPoint[]>([]);

  const cleanup = useCallback(() => {
    audioService.stopMicrophone();
    voicePlayback.stopActiveSound();
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
      setCentsOff(0);
      setIsCurrentlyInTune(false);
      setTrailPoints([]);
    }
    return () => cleanup();
  }, [isOpen, isEmbeddedView, cleanup]);

  const finishChallenge = useCallback(
    (heldSeconds: number) => {
      cleanup();
      setPhase('results');
      emitStreakEligibleAction();
      const clampedHeld = Math.min(10, Math.max(0, Number(heldSeconds.toFixed(1))));
      const percent = Math.min(100, Math.round((clampedHeld / 10) * 100));
      setStabilityPercent(percent);

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
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch {}
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
    setCentsOff(0);
    setIsCurrentlyInTune(false);
    trailPointsRef.current = [];
    setTrailPoints([]);

    inTuneMsRef.current = 0;
    latestPitchRef.current = null;
    const now = performance.now();
    challengeStartTimeRef.current = now;
    lastFrameTimeRef.current = now;
    lastStateUpdateRef.current = now;
    lastPointTimeRef.current = now;

    const targetFreq = selectedNote.frequency;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 55 && pitchHz < 1200) {
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
      let currentCents = 0;

      if (pitch !== null && pitch > 0) {
        // Cálculo logarítmico acústico con equivalencia de octava
        currentCents = calculateCentsOff(pitch, targetFreq, true);
        if (Math.abs(currentCents) <= STABILITY_TOLERANCE_CENTS) {
          inTune = true;
          inTuneMsRef.current += deltaMs;

          if (currentTime - lastVibeRef.current > 1000) {
            audioService.vibrateInTune();
            lastVibeRef.current = currentTime;
          }
        }
      }

      // Grabar puntos de la curva de estabilidad cada ~75ms
      if (currentTime - lastPointTimeRef.current >= 75) {
        lastPointTimeRef.current = currentTime;
        trailPointsRef.current.push({
          time: Number(elapsedSec.toFixed(2)),
          centsOff: Math.max(-50, Math.min(50, Math.round(currentCents))),
          inTune: inTune && pitch !== null
        });
        if (trailPointsRef.current.length > 135) {
          trailPointsRef.current.shift();
        }
      }

      // Check if 10 seconds finished
      if (remainingSec <= 0) {
        const finalHeld = inTuneMsRef.current / 1000;
        finishChallenge(finalHeld);
        return;
      }

      // Throttle React state updates to ~15 FPS (every 65ms) for ultra-smooth UI
      if (currentTime - lastStateUpdateRef.current >= 65) {
        lastStateUpdateRef.current = currentTime;
        setTimeLeft(Math.ceil(remainingSec));
        setInTuneSeconds(Number((inTuneMsRef.current / 1000).toFixed(1)));
        setCurrentPitch(pitch !== null ? Math.round(pitch) : null);
        setCentsOff(Math.max(-50, Math.min(50, Math.round(currentCents))));
        setIsCurrentlyInTune(inTune);
        setTrailPoints([...trailPointsRef.current]);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handleRetry = () => {
    startChallenge();
  };

  const handleChangeNote = () => {
    cleanup();
    setPhase('setup');
    setTimeLeft(10);
    setInTuneSeconds(0);
    setCurrentPitch(null);
    setCentsOff(0);
    setIsCurrentlyInTune(false);
  };

  return {
    phase,
    setPhase,
    gender,
    effectiveRangeData,
    availableOctaves,
    currentOctave,
    selectedOctave,
    setSelectedOctave: handleSelectOctave,
    naturalNotes,
    sharpNotes,
    allNotes,
    selectedNote,
    setSelectedNote: handleSelectNote,
    isNoteInRange,
    startChallenge,
    handleRetry,
    handleChangeNote,
    cleanup,
    timeLeft,
    inTuneSeconds,
    currentPitch,
    centsOff,
    isCurrentlyInTune,
    trailPoints,
    toleranceCents: STABILITY_TOLERANCE_CENTS,
    finalScore,
    xpMultiplier,
    earnedXp,
    stabilityPercent
  };
}
