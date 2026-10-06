import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { audioService } from '../../utils/audioService';
import {
  calculateCentsOff,
  DIFFICULTY_PITCH_TOLERANCES,
  FREE_MODE_PITCH_TOLERANCES
} from '../../utils/pitchUtils';
import { Difficulty } from '../../data/tunerLevelsData';
import { ChromaticNoteButtonInfo, NoteInfo, SolfegeButtonInfo } from '../../utils/voicePlaybackService';
import { TunedHistoryItem } from './afinadorTypes';
import { Zap, CheckCircle2, Target } from 'lucide-react';
import { checkAndExpandVocalRange } from '../../utils/vocalRangeHelper';

interface UseAfinadorPitchParams {
  tunerMode: 'libre' | 'niveles';
  selectedNote: ChromaticNoteButtonInfo;
  activeTargetNote: ChromaticNoteButtonInfo | NoteInfo;
  selectedDifficulty: Difficulty;
  difficulty: 'facil' | 'medio' | 'dificil';
  challengeNotes: NoteInfo[];
  challengeIndex: number;
  userLives: number;
  zenMode?: boolean;
  onUpdateQuestProgress?: (notesTunedCount: number) => void;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onNoteCompletedInChallenge: () => void;
  onOpenRecoveryExam?: () => void;
}

export function useAfinadorPitch({
  tunerMode,
  selectedNote,
  activeTargetNote,
  selectedDifficulty,
  difficulty,
  challengeNotes,
  challengeIndex,
  userLives,
  zenMode = false,
  onUpdateQuestProgress,
  onLoseLife,
  onNoteCompletedInChallenge,
  onOpenRecoveryExam
}: UseAfinadorPitchParams) {
  const [isTuningActive, setIsTuningActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [tuningStatusMsg, setTuningStatusMsg] = useState<string>('Escuchando voz...');
  const [isPitchMatched, setIsPitchMatched] = useState<boolean>(false);

  // Tug of war / level progress states
  const [tugOfWarProgress, setTugOfWarProgress] = useState<number>(50);
  const tugOfWarRef = useRef<number>(50);
  const [calentamientoProgress, setCalentamientoProgress] = useState<number>(0);
  const [isLevelFailed, setIsLevelFailed] = useState<boolean>(false);
  const isLevelFailedRef = useRef<boolean>(false);
  const noteTransitionUntilRef = useRef<number>(0);

  // Combo system
  const [comboCount, setComboCount] = useState<number>(0);
  const [showComboAnimation, setShowComboAnimation] = useState<boolean>(false);
  const lastMatchTimeRef = useRef<number>(0);

  // In-tune sustained time tracker
  const inTuneSinceRef = useRef<number | null>(null);
  const lastVibeTimeRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);

  // Play + Tune paired event tracking (Free Mode)
  const lastPlayedReferenceNoteRef = useRef<string | null>(null);
  const lastCountedTunedNoteRef = useRef<string | null>(null);
  const inTuneNoteStartTimeRef = useRef<number | null>(null);

  const registerPlayedNote = useCallback((noteName: string) => {
    lastPlayedReferenceNoteRef.current = noteName.trim().toUpperCase();
  }, []);

  // History state
  const [tunedHistory, setTunedHistory] = useState<TunedHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('laclave_tuned_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic cents tolerances
  const toleranceCents = useMemo(() => {
    if (tunerMode === 'niveles') {
      return DIFFICULTY_PITCH_TOLERANCES[selectedDifficulty]?.toleranceCents ?? 28;
    }
    return FREE_MODE_PITCH_TOLERANCES[difficulty]?.toleranceCents ?? 28;
  }, [tunerMode, selectedDifficulty, difficulty]);

  const nearMissCents = useMemo(() => {
    if (tunerMode === 'niveles') {
      return DIFFICULTY_PITCH_TOLERANCES[selectedDifficulty]?.nearMissCents ?? 45;
    }
    return FREE_MODE_PITCH_TOLERANCES[difficulty]?.nearMissCents ?? 45;
  }, [tunerMode, selectedDifficulty, difficulty]);

  // Keep references updated for audio callback closure
  const selectedNoteRef = useRef(selectedNote);
  const activeTargetNoteRef = useRef(activeTargetNote);
  const toleranceCentsRef = useRef(toleranceCents);
  const nearMissCentsRef = useRef(nearMissCents);
  const onUpdateQuestProgressRef = useRef(onUpdateQuestProgress);
  const tunerModeRef = useRef(tunerMode);
  const challengeNotesRef = useRef(challengeNotes);
  const challengeIndexRef = useRef(challengeIndex);
  const selectedDifficultyRef = useRef(selectedDifficulty);
  const onLoseLifeRef = useRef(onLoseLife);
  const onNoteCompletedRef = useRef(onNoteCompletedInChallenge);

  useEffect(() => { selectedNoteRef.current = selectedNote; }, [selectedNote]);
  useEffect(() => { activeTargetNoteRef.current = activeTargetNote; }, [activeTargetNote]);
  useEffect(() => { toleranceCentsRef.current = toleranceCents; }, [toleranceCents]);
  useEffect(() => { nearMissCentsRef.current = nearMissCents; }, [nearMissCents]);
  useEffect(() => { onUpdateQuestProgressRef.current = onUpdateQuestProgress; }, [onUpdateQuestProgress]);
  useEffect(() => { tunerModeRef.current = tunerMode; }, [tunerMode]);
  useEffect(() => { challengeNotesRef.current = challengeNotes; }, [challengeNotes]);
  useEffect(() => { challengeIndexRef.current = challengeIndex; }, [challengeIndex]);
  useEffect(() => { selectedDifficultyRef.current = selectedDifficulty; }, [selectedDifficulty]);
  useEffect(() => { onLoseLifeRef.current = onLoseLife; }, [onLoseLife]);
  useEffect(() => { onNoteCompletedRef.current = onNoteCompletedInChallenge; }, [onNoteCompletedInChallenge]);

  // Reset match state and calibration timer on target note change
  useEffect(() => {
    setIsPitchMatched(false);
    inTuneSinceRef.current = null;
    inTuneNoteStartTimeRef.current = null;
    setCalentamientoProgress(0);
  }, [activeTargetNote.name, activeTargetNote.frequency]);

  // Listen to audioService playback pause/resume to show clear UI feedback and avoid false pitch mismatch
  useEffect(() => {
    audioService.onMicPauseChange = (isPaused: boolean) => {
      if (isPaused) {
        setDetectedPitch(null);
        setIsPitchMatched(false);
        setTuningStatusMsg('Escuchando nota de referencia...');
        inTuneSinceRef.current = null;
      } else {
        setTuningStatusMsg('Escuchando voz...');
      }
    };
    return () => {
      audioService.onMicPauseChange = undefined;
    };
  }, []);

  const targetFreq = activeTargetNote.frequency;
  const centsOff = (isTuningActive && detectedPitch && detectedPitch > 40 && targetFreq > 0)
    ? calculateCentsOff(detectedPitch, targetFreq)
    : null;
  const absCents = centsOff !== null ? Math.abs(centsOff) : null;
  const pitchDiff = (isTuningActive && detectedPitch && detectedPitch > 40)
    ? Math.abs(detectedPitch - targetFreq)
    : null;

  // Concentric Aura Shield Ring progress
  const ringProgress = useMemo(() => {
    if (tunerMode === 'niveles') {
      if (selectedDifficulty === 'Calentamiento') {
        return calentamientoProgress;
      }
      return tugOfWarProgress;
    }
    if (!isTuningActive || !detectedPitch) return 0;
    if (isPitchMatched) return 100;
    if (absCents !== null) {
      const maxCents = 50;
      const ratio = Math.max(0, Math.min(1, 1 - absCents / maxCents));
      return Math.max(12, Math.round(ratio * 100));
    }
    return 0;
  }, [tunerMode, selectedDifficulty, calentamientoProgress, tugOfWarProgress, isTuningActive, detectedPitch, isPitchMatched, absCents]);

  // Visual sphere styles and badges
  let sphereStyle = zenMode
    ? 'bg-[#22252a] text-[#f0ebe1] border-2 border-[#e5b83b] shadow-[0_0_20px_rgba(229,184,59,0.25)] scale-100 ring-0'
    : 'bg-[#4648d4] dark:bg-[#5356e8] shadow-[#4648d4]/40 scale-100 ring-0';
  let badgeBorderColor = zenMode
    ? 'border-[#2e3138] bg-[#1f2125]'
    : 'border-slate-200/80 dark:border-slate-700';
  let statusTextColor = zenMode ? 'text-[#f0ebe1]' : 'text-slate-800 dark:text-slate-200';
  let statusIcon: React.ReactNode = null;

  if (isPitchMatched) {
    sphereStyle = zenMode
      ? 'bg-[#e5b83b] text-[#161719] shadow-[0_0_40px_rgba(229,184,59,0.9)] scale-110 ring-4 ring-[#f5d56b] animate-pulse'
      : 'bg-emerald-500 dark:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.9)] scale-110 ring-4 ring-emerald-300 dark:ring-emerald-400 animate-pulse';
    badgeBorderColor = zenMode
      ? 'border-[#e5b83b] bg-[#e5b83b]/20'
      : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/90';
    statusTextColor = zenMode ? 'text-[#e5b83b]' : 'text-emerald-800 dark:text-emerald-200';
    statusIcon = <CheckCircle2 className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'} animate-bounce`} />;
  } else if (absCents !== null) {
    if (absCents <= nearMissCents) {
      sphereStyle = zenMode
        ? 'bg-[#d8a728] text-[#161719] shadow-[0_0_30px_rgba(229,184,59,0.7)] scale-105 ring-4 ring-[#f5d56b]'
        : 'bg-amber-500 dark:bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-105 ring-4 ring-amber-300 dark:ring-amber-400/80';
      badgeBorderColor = zenMode
        ? 'border-[#d8a728] bg-[#d8a728]/20'
        : 'border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/90';
      statusTextColor = zenMode ? 'text-[#f5d56b]' : 'text-amber-800 dark:text-amber-200';
      statusIcon = <Zap className={`w-3.5 h-3.5 ${zenMode ? 'text-[#f5d56b]' : 'text-amber-500'} animate-pulse`} />;
    } else {
      sphereStyle = zenMode
        ? 'bg-[#2a2d34] text-[#ded9cf] border-2 border-[#e5b83b]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100 ring-2 ring-[#e5b83b]/30'
        : 'bg-rose-600 dark:bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.8)] scale-100 ring-4 ring-rose-300 dark:ring-rose-500/80';
      badgeBorderColor = zenMode
        ? 'border-[#383c44] bg-[#26292f]'
        : 'border-rose-300 dark:border-rose-700 bg-rose-50/90 dark:bg-rose-950/90';
      statusTextColor = zenMode ? 'text-[#ded9cf]' : 'text-rose-800 dark:text-rose-200';
      statusIcon = <Target className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-rose-500'} animate-ping`} />;
    }
  }

  const startTuningMic = useCallback(async () => {
    if (userLives <= 0) {
      if (onOpenRecoveryExam) onOpenRecoveryExam();
      return false;
    }
    if (isTuningActive) return true;

    const success = await audioService.startMicrophone((pitchHz, vol) => {
      if (audioService.isMicTemporarilyMuted()) {
        setDetectedPitch(null);
        setIsPitchMatched(false);
        setTuningStatusMsg('Escuchando nota de referencia...');
        inTuneSinceRef.current = null;
        return;
      }

      const nowTime = Date.now();
      if (nowTime - lastStateUpdateRef.current < 35) return;
      lastStateUpdateRef.current = nowTime;

      setVolume(vol);
      if (pitchHz > 50 && pitchHz < 1000) {
        setDetectedPitch(Math.round(pitchHz));

        const currTarget = activeTargetNoteRef.current || selectedNoteRef.current;

        const currCentsOff = calculateCentsOff(pitchHz, currTarget.frequency);
        const absCentsVal = Math.abs(currCentsOff);
        const octaveMultiplier = Math.pow(2, Math.round(Math.log2(pitchHz / currTarget.frequency)));
        const effectiveTargetFreq = currTarget.frequency * octaveMultiplier;
        const diffHz = Math.abs(pitchHz - effectiveTargetFreq);
        const isMatched = absCentsVal <= toleranceCentsRef.current;
        setIsPitchMatched(isMatched);

        if (isMatched) {
          setTuningStatusMsg('¡AFINACIÓN PERFECTA!');
          if (nowTime - lastVibeTimeRef.current > 1200) {
            lastVibeTimeRef.current = nowTime;
            audioService.vibrateSuccess();
          }

          // Level mode progression
          if (tunerModeRef.current === 'niveles' && !isLevelFailedRef.current) {
            if (selectedDifficultyRef.current === 'Calentamiento') {
              if (!inTuneSinceRef.current) {
                inTuneSinceRef.current = nowTime;
                setCalentamientoProgress(15);
              } else {
                const elapsed = nowTime - inTuneSinceRef.current;
                const p = Math.min(100, Math.round((elapsed / 650) * 100));
                setCalentamientoProgress(p);
                if (elapsed >= 650) {
                  inTuneSinceRef.current = null;
                  setCalentamientoProgress(0);
                  onNoteCompletedRef.current();
                }
              }
            } else {
              const gain = selectedDifficultyRef.current === 'Fácil'
                ? 3.2
                : selectedDifficultyRef.current === 'Medio'
                ? 2.8
                : selectedDifficultyRef.current === 'Difícil'
                ? 2.4
                : 2.0;
              tugOfWarRef.current = Math.min(100, tugOfWarRef.current + gain);
              setTugOfWarProgress(tugOfWarRef.current);
              if (tugOfWarRef.current >= 100) {
                tugOfWarRef.current = 50;
                setTugOfWarProgress(50);
                inTuneSinceRef.current = null;
                onNoteCompletedRef.current();
              }
            }
          }

          // In Modo Libre, note tuning counts as a paired event:
          // 1) Note was played as reference
          // 2) Note was tuned and sustained >= 450ms
          // 3) Only counts ONCE if staying on the same note without changing
          if (tunerModeRef.current === 'libre') {
            const targetKey = currTarget.name.trim().toUpperCase();
            if (!inTuneNoteStartTimeRef.current) {
              inTuneNoteStartTimeRef.current = nowTime;
            }

            const sustainedMs = nowTime - inTuneNoteStartTimeRef.current;
            if (sustainedMs >= 450) {
              const isReferencePlayed = lastPlayedReferenceNoteRef.current === targetKey;
              const hasNoteChanged = lastCountedTunedNoteRef.current !== targetKey;

              if (isReferencePlayed && hasNoteChanged) {
                lastCountedTunedNoteRef.current = targetKey;
                lastPlayedReferenceNoteRef.current = null;
                if (onUpdateQuestProgressRef.current) {
                  onUpdateQuestProgressRef.current(1);
                }
              }
            }
          }

          // Passive vocal range auto-expansion check
          if (currTarget?.name) {
            checkAndExpandVocalRange(pitchHz, currTarget.name, 'afinador');
          }

          // Debounced history logging
          setTunedHistory(prev => {
            const lastItem = prev[0];
            const isDuplicate = lastItem && lastItem.noteName === currTarget.name && (nowTime - parseInt(lastItem.id, 10) < 3000);
            if (isDuplicate) return prev;

            const newItem: TunedHistoryItem = {
              id: String(nowTime),
              noteName: currTarget.name,
              noteColor: (currTarget as SolfegeButtonInfo).bgColor || '#10b981',
              targetFreq: currTarget.frequency,
              detectedFreq: Math.round(pitchHz),
              diffHz: Math.round(diffHz),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const updated = [newItem, ...prev].slice(0, 5);
            try {
              localStorage.setItem('laclave_tuned_history', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        } else {
          inTuneSinceRef.current = null;
          inTuneNoteStartTimeRef.current = null;
          setCalentamientoProgress(0);
          if (currCentsOff < 0) {
            setTuningStatusMsg('Muy grueso ↑ Sube el tono');
          } else {
            setTuningStatusMsg('Muy delgado ↓ Baja el tono');
          }

          if (tunerModeRef.current === 'niveles' && !isLevelFailedRef.current && selectedDifficultyRef.current !== 'Calentamiento') {
            const isInTransitionGrace = nowTime < noteTransitionUntilRef.current;
            const isNearMiss = absCentsVal <= nearMissCentsRef.current;

            if (!isInTransitionGrace && !isNearMiss) {
              const penalty = selectedDifficultyRef.current === 'Fácil'
                ? 0.35
                : selectedDifficultyRef.current === 'Medio'
                ? 0.50
                : selectedDifficultyRef.current === 'Difícil'
                ? 0.70
                : 0.90;

              tugOfWarRef.current = Math.max(0, tugOfWarRef.current - penalty);
              setTugOfWarProgress(tugOfWarRef.current);
              if (tugOfWarRef.current <= 0) {
                isLevelFailedRef.current = true;
                setIsLevelFailed(true);
                audioService.stopMicrophone();
                setIsTuningActive(false);
                audioService.playSadDefeatSound();
                if (onLoseLifeRef.current) {
                  onLoseLifeRef.current('tuner');
                }
              }
            }
          }
        }
      } else {
        setDetectedPitch(null);
        setIsPitchMatched(false);
        setTuningStatusMsg('Escuchando voz...');
        inTuneSinceRef.current = null;
        inTuneNoteStartTimeRef.current = null;
        setCalentamientoProgress(0);
      }
    });

    if (success) {
      setIsTuningActive(true);
      return true;
    } else {
      setTuningStatusMsg('Permiso de micrófono no otorgado');
      return false;
    }
  }, [userLives, isTuningActive, onOpenRecoveryExam]);

  const stopTuningMic = useCallback(() => {
    audioService.stopMicrophone();
    setIsTuningActive(false);
    setDetectedPitch(null);
    setIsPitchMatched(false);
    setTuningStatusMsg('Micrófono en pausa');
  }, []);

  const toggleTuning = useCallback(() => {
    audioService.playClickSound();
    if (userLives <= 0) {
      if (onOpenRecoveryExam) onOpenRecoveryExam();
      return;
    }
    if (isTuningActive) {
      stopTuningMic();
    } else {
      startTuningMic();
    }
  }, [userLives, isTuningActive, onOpenRecoveryExam, startTuningMic, stopTuningMic]);

  const setGracePeriod = useCallback((ms: number) => {
    noteTransitionUntilRef.current = Date.now() + ms;
  }, []);

  const resetTugOfWar = useCallback((val = 50) => {
    tugOfWarRef.current = val;
    setTugOfWarProgress(val);
  }, []);

  const clearHistory = useCallback(() => {
    setTunedHistory([]);
    try {
      localStorage.removeItem('laclave_tuned_history');
    } catch {}
  }, []);

  return {
    isTuningActive,
    detectedPitch,
    setDetectedPitch,
    volume,
    tuningStatusMsg,
    isPitchMatched,
    setIsPitchMatched,
    tugOfWarProgress,
    setTugOfWarProgress,
    calentamientoProgress,
    setCalentamientoProgress,
    isLevelFailed,
    setIsLevelFailed,
    isLevelFailedRef,
    comboCount,
    setComboCount,
    showComboAnimation,
    setShowComboAnimation,
    lastMatchTimeRef,
    tunedHistory,
    toleranceCents,
    nearMissCents,
    centsOff,
    absCents,
    pitchDiff,
    ringProgress,
    sphereStyle,
    badgeBorderColor,
    statusTextColor,
    statusIcon,
    startTuningMic,
    stopTuningMic,
    toggleTuning,
    setGracePeriod,
    resetTugOfWar,
    clearHistory,
    registerPlayedNote
  };
}
