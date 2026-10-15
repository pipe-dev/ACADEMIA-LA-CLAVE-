import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserStats } from '../../types';
import {
  Difficulty,
  ChallengeDifficulty,
  ProgressState,
  difficultySettings,
  difficultyLevels,
  generateChallenge,
  generateIntervalChallenge,
  melodies
} from '../../data/tunerLevelsData';
import { NoteInfo, voicePlayback } from '../../utils/voicePlaybackService';
import { audioService } from '../../utils/audioService';
import { emitStreakEligibleAction } from '../../utils/streakPrompt';
import { emitQuestEvent } from '../../utils/dailyQuestsEngine';

interface UseAfinadorLevelsParams {
  userNotePool: NoteInfo[];
  gender: 'masculino' | 'femenino';
  userStats: UserStats;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
  onOpenRecoveryExam?: () => void;
  onTuningStart: () => void;
  onTuningStop: () => void;
  resetTugOfWar: (val?: number) => void;
  setGracePeriod: (ms: number) => void;
  setIsLevelFailed: (failed: boolean) => void;
  setTunerMode: (mode: 'libre' | 'niveles') => void;
  setDifficulty: (diff: 'facil' | 'medio' | 'dificil') => void;
}

export function useAfinadorLevels({
  userNotePool,
  gender,
  userStats,
  onUpdateStats,
  onOpenRecoveryExam,
  onTuningStart,
  onTuningStop,
  resetTugOfWar,
  setGracePeriod,
  setIsLevelFailed,
  setTunerMode,
  setDifficulty
}: UseAfinadorLevelsParams) {
  const [comboCount, setComboCount] = useState<number>(0);
  const [showComboAnimation, setShowComboAnimation] = useState<boolean>(false);
  const lastMatchTimeRef = useRef<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Fácil');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>([]);
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [completedChallengeNotes, setCompletedChallengeNotes] = useState<Set<number>>(new Set());

  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [winStars, setWinStars] = useState<number>(3);
  const [winXp, setWinXp] = useState<number>(25);
  const [showEasyWinVideo, setShowEasyWinVideo] = useState<boolean>(false);

  const [levelProgress, setLevelProgress] = useState<ProgressState>(() => {
    const fallback: ProgressState = { Fácil: {}, Medio: {}, Difícil: {}, Maestro: {} };
    try {
      const saved = localStorage.getItem('laclave_tuner_progress_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            Fácil: parsed['Fácil'] || {},
            Medio: parsed['Medio'] || {},
            Difícil: parsed['Difícil'] || {},
            Maestro: parsed['Maestro'] || {}
          };
        }
      }
    } catch {}
    return fallback;
  });

  const challengeNotesRef = useRef(challengeNotes);
  const challengeIndexRef = useRef(challengeIndex);
  const selectedDifficultyRef = useRef(selectedDifficulty);
  const currentLevelRef = useRef(currentLevel);

  useEffect(() => { challengeNotesRef.current = challengeNotes; }, [challengeNotes]);
  useEffect(() => { challengeIndexRef.current = challengeIndex; }, [challengeIndex]);
  useEffect(() => { selectedDifficultyRef.current = selectedDifficulty; }, [selectedDifficulty]);
  useEffect(() => { currentLevelRef.current = currentLevel; }, [currentLevel]);

  const handleLevelVictory = useCallback(
    (calculatedScore = 100) => {
      onTuningStop();
      emitStreakEligibleAction();
      emitQuestEvent('LEVEL_COMPLETED', 1);

      const starsEarned = calculatedScore >= 95 ? 3 : calculatedScore >= 80 ? 2 : 1;
      const xp = starsEarned * 15;
      setWinStars(starsEarned);
      setWinXp(xp);
      setIsWinModalOpen(true);

      const activeDiff = selectedDifficultyRef.current;
      const activeLvl = currentLevelRef.current;

      if (activeDiff !== 'Calentamiento') {
        const challengeDiff = activeDiff as ChallengeDifficulty;
        setLevelProgress(prev => {
          const currentBest = prev[challengeDiff]?.[activeLvl] || 0;
          const newProgress = {
            ...prev,
            [challengeDiff]: {
              ...prev[challengeDiff],
              [activeLvl]: Math.max(currentBest, starsEarned)
            }
          };
          try {
            localStorage.setItem('laclave_tuner_progress_v2', JSON.stringify(newProgress));
          } catch {}
          return newProgress;
        });
      }

      if (onUpdateStats) {
        onUpdateStats({
          xp: (userStats.xp || 0) + xp,
          lessonsCompleted: (userStats.lessonsCompleted || 0) + 1
        });
      }
    },
    [onTuningStop, onUpdateStats, userStats.xp, userStats.lessonsCompleted]
  );

  const handleNoteCompletedInChallenge = useCallback(() => {
    voicePlayback.playCompletionChime();
    emitQuestEvent('NOTE_TUNED', 1);
    setCompletedChallengeNotes(prev => new Set(prev).add(challengeIndexRef.current));
    resetTugOfWar(50);
    setGracePeriod(1400);

    const now = Date.now();
    if (now - lastMatchTimeRef.current < 4500) {
      setComboCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          setShowComboAnimation(true);
          setTimeout(() => setShowComboAnimation(false), 2000);
        }
        return next;
      });
    } else {
      setComboCount(1);
    }
    lastMatchTimeRef.current = now;

    const nextIdx = challengeIndexRef.current + 1;
    if (nextIdx < challengeNotesRef.current.length) {
      setChallengeIndex(nextIdx);
      challengeIndexRef.current = nextIdx;
      setTimeout(() => {
        const nextNote = challengeNotesRef.current[nextIdx];
        if (nextNote) {
          voicePlayback.playVoiceNote(nextNote, gender, 1.5);
        }
      }, 500);
    } else {
      handleLevelVictory();
    }
  }, [gender, handleLevelVictory, lastMatchTimeRef, resetTugOfWar, setComboCount, setGracePeriod, setShowComboAnimation]);

  const startLevel = useCallback(
    (diff: Difficulty, lvl: number) => {
      if ((userStats.lives ?? 1) <= 0) {
        if (onOpenRecoveryExam) onOpenRecoveryExam();
        return;
      }
      setTunerMode('niveles');
      setSelectedDifficulty(diff);
      selectedDifficultyRef.current = diff;
      if (diff === 'Fácil') setDifficulty('facil');
      else if (diff === 'Medio') setDifficulty('medio');
      else if (diff === 'Difícil' || diff === 'Maestro') setDifficulty('dificil');

      setCurrentLevel(lvl);
      currentLevelRef.current = lvl;
      setIsLevelSelectOpen(false);
      setIsWinModalOpen(false);
      setCompletedChallengeNotes(new Set());
      setChallengeIndex(0);
      challengeIndexRef.current = 0;
      resetTugOfWar(50);
      setIsLevelFailed(false);
      setGracePeriod(1500);

      const diffArray = difficultyLevels[diff as ChallengeDifficulty];
      const isRhythm = diff !== 'Calentamiento' && diffArray && diffArray[lvl - 1] === 0;

      if (isRhythm) {
        audioService.stopMicrophone();
        onTuningStop();
        return;
      }

      let notes: NoteInfo[] = [];
      if (diff === 'Medio' && (lvl === 1 || lvl % 2 === 0)) {
        notes = generateIntervalChallenge(lvl, userNotePool);
      } else if (diff === 'Fácil' && (lvl === 4 || lvl === 6)) {
        const melodyKey = lvl === 4 ? 'twinkle' : 'maryHadALamb';
        const m = melodies[melodyKey] || melodies.twinkle;
        const baseMidi = userNotePool[Math.floor(userNotePool.length / 2)]?.midi || 60;
        notes = m.map(item => {
          const midi = baseMidi + (item.midi - 60);
          const name = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'][midi % 12];
          const letter = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
          const octave = Math.floor(midi / 12) - 1;
          const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
          return { name, letter, octave, frequency, fullName: `${name}${octave}`, midi };
        });
      } else {
        const noteCount = diff === 'Calentamiento' ? 4 : (diffArray ? diffArray[lvl - 1] || 4 : 4);
        notes = generateChallenge(noteCount, userNotePool);
      }

      setChallengeNotes(notes);
      challengeNotesRef.current = notes;
      onTuningStart();

      if (diff === 'Difícil' && lvl % 3 === 0 && notes.length > 0) {
        notes.forEach((n, idx) => {
          setTimeout(() => {
            voicePlayback.playVoiceNote(n, gender, 1.2);
          }, idx * 1400);
        });
        setTimeout(() => {
          audioService.playSoftDing();
        }, notes.length * 1400 + 400);
      } else if (notes.length > 0) {
        setTimeout(() => {
          voicePlayback.playVoiceNote(notes[0], gender, 1.8);
        }, 350);
      }
    },
    [userStats.lives, onOpenRecoveryExam, setTunerMode, setDifficulty, resetTugOfWar, setIsLevelFailed, setGracePeriod, onTuningStop, userNotePool, onTuningStart, gender]
  );

  const handleNextLevel = useCallback(() => {
    const activeDiff = selectedDifficultyRef.current;
    const activeLvl = currentLevelRef.current;
    const maxLvl = difficultySettings[activeDiff]?.levelCount || 12;

    if (activeDiff === 'Fácil' && activeLvl >= maxLvl) {
      setShowEasyWinVideo(true);
      setIsWinModalOpen(false);
      return;
    }
    setIsWinModalOpen(false);
    if (activeLvl < maxLvl) {
      startLevel(activeDiff, activeLvl + 1);
    } else {
      setIsLevelSelectOpen(true);
    }
  }, [startLevel]);

  return {
    selectedDifficulty,
    setSelectedDifficulty,
    currentLevel,
    setCurrentLevel,
    currentLevelRef,
    selectedDifficultyRef,
    challengeNotes,
    challengeIndex,
    completedChallengeNotes,
    comboCount,
    setComboCount,
    showComboAnimation,
    setShowComboAnimation,
    lastMatchTimeRef,
    isLevelSelectOpen,
    setIsLevelSelectOpen,
    isWinModalOpen,
    setIsWinModalOpen,
    winStars,
    winXp,
    showEasyWinVideo,
    setShowEasyWinVideo,
    levelProgress,
    startLevel,
    handleNoteCompletedInChallenge,
    handleLevelVictory,
    handleNextLevel
  };
}
