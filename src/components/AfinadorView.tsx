'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import {
  voicePlayback,
  generateUserNotePool,
  getComfortableChromaticNotes,
  ChromaticNoteButtonInfo,
  SolfegeButtonInfo,
  NoteInfo
} from '../utils/voicePlaybackService';
import {
  Difficulty,
  ChallengeDifficulty,
  ProgressState,
  difficultySettings,
  difficultyLevels,
  generateChallenge,
  generateIntervalChallenge,
  melodies,
  rhythmPatterns,
  completionPhrases
} from '../data/tunerLevelsData';
import {
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  Sparkles,
  History,
  Music2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Swords,
  Lock,
  Target,
  Trophy,
  Heart,
  Star,
  Play,
  Brain,
  Drum,
  ArrowRight,
  UserCheck,
  X,
  Zap,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioParticleCanvas } from './AudioParticleCanvas';
import { AuraShieldRing } from './AuraShieldRing';
import { PitchStabilityChart } from './PitchStabilityChart';
import { DueloRapidoModal } from './DueloRapidoModal';
import { StabilityChallengeModal } from './StabilityChallengeModal';
import { EscalasModal } from './EscalasModal';
import { BreathingModal } from './BreathingModal';
import { VocalRangeModal } from './VocalRangeModal';
import { VoiceEvalModal } from './VoiceEvalModal';
import { TunerRangeRequiredModal } from './TunerRangeRequiredModal';
import { TunerLevelSelectModal } from './TunerLevelSelectModal';
import { TunerWinModal } from './TunerWinModal';
import { TunerRhythmView } from './TunerRhythmView';
import { emitStreakEligibleAction } from '../utils/streakPrompt';
import { getTimeToNextLife } from '../utils/livesEngine';

interface TunedHistoryItem {
  id: string;
  noteName: string;
  noteColor: string;
  targetFreq: number;
  detectedFreq: number;
  diffHz: number;
  timestamp: string;
}

interface AfinadorViewProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  onUpdateQuestProgress?: (notesTunedCount: number) => void;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export const AfinadorView: React.FC<AfinadorViewProps> = ({
  userStats,
  darkMode = false,
  zenMode = false,
  onUpdateQuestProgress,
  onUpdateStats,
  onLoseLife,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  // ─── 1. Vocal Range Calibration State ──────────────────────────────
  const [effectiveRangeData, setEffectiveRangeData] = useState(() => {
    if (userStats.vocalRangeData) return userStats.vocalRangeData;
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [gender, setGender] = useState<'masculino' | 'femenino'>(() => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
    } catch {}
    return 'femenino';
  });

  const [isRangeRequiredModalOpen, setIsRangeRequiredModalOpen] = useState<boolean>(!effectiveRangeData);

  // Preload voice notes into browser cache
  useEffect(() => {
    voicePlayback.preloadNotes(gender);
  }, [gender]);

  // Sync state if userStats prop updates
  useEffect(() => {
    if (userStats.vocalRangeData) {
      setEffectiveRangeData(userStats.vocalRangeData);
      setIsRangeRequiredModalOpen(false);
    }
  }, [userStats.vocalRangeData]);

    // ─── 2. Adaptive Note Pool & 12 Chromatic Notes ──────────────────
  const userNotePool = useMemo(() => {
    return generateUserNotePool(effectiveRangeData, gender);
  }, [effectiveRangeData, gender]);

  const chromaticData = useMemo(() => {
    return getComfortableChromaticNotes(effectiveRangeData, gender);
  }, [effectiveRangeData, gender]);

  const { allNotes, naturalNotes, sharpNotes } = chromaticData;

  const blackKeyPositions = useMemo(() => [
    { note: sharpNotes[0], left: '14.2857%' }, // DO#
    { note: sharpNotes[1], left: '28.5714%' }, // RE#
    { note: sharpNotes[2], left: '57.1428%' }, // FA#
    { note: sharpNotes[3], left: '71.4285%' }, // SOL#
    { note: sharpNotes[4], left: '85.7142%' }, // LA#
  ], [sharpNotes]);

  // ─── 3. Tuner Mode (Libre vs. Niveles) ────────────────────────────
  const [tunerMode, setTunerMode] = useState<'libre' | 'niveles'>('libre');
  const [selectedNote, setSelectedNote] = useState<ChromaticNoteButtonInfo>(() => naturalNotes[0] || allNotes[0]);

  useEffect(() => {
    if (allNotes.length > 0) {
      setSelectedNote(prev => {
        const matching = allNotes.find(b => b.name === prev.name);
        return matching || naturalNotes[0] || allNotes[0];
      });
    }
  }, [allNotes, naturalNotes]);

  // ─── 4. Real-Time Pitch & Microphone State ───────────────────────
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [isTuningActive, setIsTuningActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [tuningStatusMsg, setTuningStatusMsg] = useState<string>('Escuchando voz...');
  const [isPitchMatched, setIsPitchMatched] = useState<boolean>(false);
  const [isExtraToolsOpen, setIsExtraToolsOpen] = useState<boolean>(false);

  // Sub-view modal inside Afinador
  const [activeSubView, setActiveSubView] = useState<'escalas' | 'respiracion' | 'estabilidad' | 'duelo' | 'tesitura' | 'evaluacion' | null>(null);

  // Al acceder a cualquier herramienta, siempre se muestra desde arriba
  useEffect(() => {
    if (activeSubView) {
      window.scrollTo(0, 0);
    }
  }, [activeSubView]);

  // Tolerance in Hz
  const tolerance = difficulty === 'facil' ? 15 : difficulty === 'medio' ? 8 : 4;

  // ─── 5. Gamified Levels State ─────────────────────────────────────
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Fácil');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [winStars, setWinStars] = useState<number>(3);
  const [winXp, setWinXp] = useState<number>(25);
  const [showEasyWinVideo, setShowEasyWinVideo] = useState<boolean>(false);

  const [levelProgress, setLevelProgress] = useState<ProgressState>(() => {
    const fallback: ProgressState = { 'Fácil': {}, 'Medio': {}, 'Difícil': {}, 'Maestro': {} };
    try {
      const saved = localStorage.getItem('laclave_tuner_progress_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            'Fácil': parsed['Fácil'] || {},
            'Medio': parsed['Medio'] || {},
            'Difícil': parsed['Difícil'] || {},
            'Maestro': parsed['Maestro'] || {}
          };
        }
      }
    } catch {}
    return fallback;
  });

  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>([]);
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [completedChallengeNotes, setCompletedChallengeNotes] = useState<Set<number>>(new Set());

  // Simon Says / Memory mode state
  const [isSimonPlayback, setIsSimonPlayback] = useState<boolean>(false);
  const [simonActiveNote, setSimonActiveNote] = useState<NoteInfo | null>(null);

  // Combo system
  const [comboCount, setComboCount] = useState<number>(0);
  const [showComboAnimation, setShowComboAnimation] = useState<boolean>(false);
  const lastMatchTimeRef = useRef<number>(0);

  // In-tune sustained time tracker (requires ~0.75s in pitch to validate)
  const inTuneSinceRef = useRef<number | null>(null);

  // ─── 6. History State ─────────────────────────────────────────────
  const [tunedHistory, setTunedHistory] = useState<TunedHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('laclave_tuned_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const lastVibeTimeRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);

  // Refs for real-time callbacks
  const selectedNoteRef = useRef<SolfegeButtonInfo>(selectedNote);
  const toleranceRef = useRef<number>(tolerance);
  const onUpdateQuestProgressRef = useRef(onUpdateQuestProgress);
  const tunerModeRef = useRef(tunerMode);
  const challengeNotesRef = useRef(challengeNotes);
  const challengeIndexRef = useRef(challengeIndex);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { selectedNoteRef.current = selectedNote; }, [selectedNote]);
  useEffect(() => { toleranceRef.current = tolerance; }, [tolerance]);
  useEffect(() => { onUpdateQuestProgressRef.current = onUpdateQuestProgress; }, [onUpdateQuestProgress]);
  useEffect(() => { tunerModeRef.current = tunerMode; }, [tunerMode]);
  useEffect(() => { challengeNotesRef.current = challengeNotes; }, [challengeNotes]);
  useEffect(() => { challengeIndexRef.current = challengeIndex; }, [challengeIndex]);

  // ─── Tug-of-War Precision Bar State (Level Modes) ─────────────────
  const [tugOfWarProgress, setTugOfWarProgress] = useState<number>(50);
  const tugOfWarRef = useRef<number>(50);
  const [isLevelFailed, setIsLevelFailed] = useState<boolean>(false);
  const isLevelFailedRef = useRef<boolean>(false);
  const selectedDifficultyRef = useRef<Difficulty>(selectedDifficulty);
  const onLoseLifeRef = useRef(onLoseLife);

  useEffect(() => { selectedDifficultyRef.current = selectedDifficulty; }, [selectedDifficulty]);
  useEffect(() => { onLoseLifeRef.current = onLoseLife; }, [onLoseLife]);

  // Passive countdown for 0 lives
  const [timeToNextLife, setTimeToNextLife] = useState<{ remainingMs: number; formatted: string }>(() =>
    getTimeToNextLife(userStats)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(timer);
  }, [userStats]);

  // Turn off mic if lives reach 0
  useEffect(() => {
    if ((userStats.lives ?? 1) <= 0 && isTuningActive) {
      audioService.stopMicrophone();
      setIsTuningActive(false);
    }
  }, [userStats.lives, isTuningActive]);

  // Current Target Note and Frequency
  const activeTargetNote = tunerMode === 'libre'
    ? selectedNote
    : (challengeNotes[challengeIndex] || selectedNote);

  const targetFreq = activeTargetNote.frequency;

  // Compute pitch difference
  const pitchDiff = (isTuningActive && detectedPitch && detectedPitch > 40) ? Math.abs(detectedPitch - targetFreq) : null;

  // Visual sphere colors and badge styling
  let sphereStyle = zenMode
    ? 'bg-[#22252a] text-[#f0ebe1] border-2 border-[#e5b83b] shadow-[0_0_20px_rgba(229,184,59,0.25)] scale-100 ring-0'
    : 'bg-[#4648d4] dark:bg-[#5356e8] shadow-[#4648d4]/40 scale-100 ring-0';
  let badgeBorderColor = zenMode
    ? 'border-[#2e3138] bg-[#1f2125]'
    : 'border-slate-200/80 dark:border-slate-700';
  let statusTextColor = zenMode ? 'text-[#f0ebe1]' : 'text-slate-800 dark:text-slate-200';
  let statusIcon = <Sparkles className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500 dark:text-indigo-400'} animate-pulse`} />;

  if (isPitchMatched) {
    sphereStyle = zenMode
      ? 'bg-[#e5b83b] text-[#161719] shadow-[0_0_40px_rgba(229,184,59,0.9)] scale-110 ring-4 ring-[#f5d56b] animate-pulse'
      : 'bg-emerald-500 dark:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.9)] scale-110 ring-4 ring-emerald-300 dark:ring-emerald-400 animate-pulse';
    badgeBorderColor = zenMode
      ? 'border-[#e5b83b] bg-[#e5b83b]/20'
      : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/90';
    statusTextColor = zenMode ? 'text-[#e5b83b]' : 'text-emerald-800 dark:text-emerald-200';
    statusIcon = <CheckCircle2 className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'} animate-bounce`} />;
  } else if (pitchDiff !== null) {
    if (pitchDiff <= tolerance * 2.5) {
      sphereStyle = zenMode
        ? 'bg-[#d8a728] text-[#161719] shadow-[0_0_30px_rgba(229,184,59,0.7)] scale-105 ring-4 ring-[#f5d56b]'
        : 'bg-amber-500 dark:bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-105 ring-4 ring-amber-300 dark:ring-amber-400/80';
      badgeBorderColor = zenMode
        ? 'border-[#d8a728] bg-[#d8a728]/20'
        : 'border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/90';
      statusTextColor = zenMode ? 'text-[#f5d56b]' : 'text-amber-800 dark:text-amber-200';
      statusIcon = <Sparkles className={`w-3.5 h-3.5 ${zenMode ? 'text-[#f5d56b]' : 'text-amber-500'} animate-pulse`} />;
    } else {
      sphereStyle = zenMode
        ? 'bg-[#2a2d34] text-[#ded9cf] border-2 border-[#e5b83b]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100 ring-2 ring-[#e5b83b]/30'
        : 'bg-rose-600 dark:bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.8)] scale-100 ring-4 ring-rose-300 dark:ring-rose-500/80';
      badgeBorderColor = zenMode
        ? 'border-[#383c44] bg-[#26292f]'
        : 'border-rose-300 dark:border-rose-700 bg-rose-50/90 dark:bg-rose-950/90';
      statusTextColor = zenMode ? 'text-[#ded9cf]' : 'text-rose-800 dark:text-rose-200';
      statusIcon = <Sparkles className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-rose-500'} animate-ping`} />;
    }
  }

  // ─── 7. Microphone & Tuning Handler ──────────────────────────────
  const startTuningMic = async () => {
    if ((userStats.lives ?? 1) <= 0) {
      if (onOpenRecoveryExam) onOpenRecoveryExam();
      return false;
    }
    if (isTuningActive) return true;
    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const nowTime = Date.now();
      if (nowTime - lastStateUpdateRef.current < 35) return;
      lastStateUpdateRef.current = nowTime;

      setVolume(vol);
      if (pitchHz > 50 && pitchHz < 1000) {
        setDetectedPitch(Math.round(pitchHz));

        const currTarget = tunerModeRef.current === 'libre'
          ? selectedNoteRef.current
          : (challengeNotesRef.current[challengeIndexRef.current] || selectedNoteRef.current);

        const diff = Math.abs(pitchHz - currTarget.frequency);
        const isMatched = diff <= toleranceRef.current;
        setIsPitchMatched(isMatched);

        if (isMatched) {
          setTuningStatusMsg('¡AFINACIÓN PERFECTA!');
          if (nowTime - lastVibeTimeRef.current > 1200) {
            lastVibeTimeRef.current = nowTime;
            audioService.vibrateSuccess();
          }

          // In Level Mode: Tug-of-War or sustained hold
          if (tunerModeRef.current === 'niveles' && !isLevelFailedRef.current) {
            if (selectedDifficultyRef.current === 'Calentamiento') {
              if (!inTuneSinceRef.current) {
                inTuneSinceRef.current = nowTime;
              } else if (nowTime - inTuneSinceRef.current >= 650) {
                inTuneSinceRef.current = null;
                handleNoteCompletedInChallenge();
              }
            } else {
              // 4 Modes: In-pitch pushes Tug-of-War towards 100%
              tugOfWarRef.current = Math.min(100, tugOfWarRef.current + 2.5);
              setTugOfWarProgress(tugOfWarRef.current);
              if (tugOfWarRef.current >= 100) {
                tugOfWarRef.current = 50;
                setTugOfWarProgress(50);
                inTuneSinceRef.current = null;
                handleNoteCompletedInChallenge();
              }
            }
          }

          // Advance quest progress
          if (onUpdateQuestProgressRef.current) {
            onUpdateQuestProgressRef.current(1);
          }

          // Save to history (debounced 3s)
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
              diffHz: Math.round(diff),
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
          if (pitchHz < currTarget.frequency) {
            setTuningStatusMsg('Muy grueso ↑ Sube el tono');
          } else {
            setTuningStatusMsg('Muy delgado ↓ Baja el tono');
          }

          // In Level Mode: off-pitch penalty in 4 modes (Calentamiento is exempt)
          if (tunerModeRef.current === 'niveles' && !isLevelFailedRef.current && selectedDifficultyRef.current !== 'Calentamiento') {
            tugOfWarRef.current = Math.max(0, tugOfWarRef.current - 1.2);
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
      } else {
        setDetectedPitch(null);
        setIsPitchMatched(false);
        setTuningStatusMsg('Escuchando voz...');
        inTuneSinceRef.current = null;
      }
    });

    if (success) {
      setIsTuningActive(true);
      return true;
    } else {
      setTuningStatusMsg('Permiso de micrófono no otorgado');
      return false;
    }
  };

  const toggleTuning = () => {
    audioService.playClickSound();
    if ((userStats.lives ?? 1) <= 0) {
      if (onOpenRecoveryExam) onOpenRecoveryExam();
      return;
    }
    if (isTuningActive) {
      audioService.stopMicrophone();
      setIsTuningActive(false);
      setDetectedPitch(null);
      setIsPitchMatched(false);
      setTuningStatusMsg('Micrófono en pausa');
    } else {
      startTuningMic();
    }
  };

  // ─── 8. Note Selection & Real Human Voice Playback ────────────────
  const handleSelectNote = (note: ChromaticNoteButtonInfo) => {
    // In Level Mode: ONLY allow playing the active target note to recall its pitch
    if (tunerMode === 'niveles') {
      const isTarget = activeTargetNote.name.toUpperCase() === note.name.toUpperCase();
      if (!isTarget) {
        return; // Only the active target note can sound during level challenges
      }
      voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
      return;
    }

    setSelectedNote(note);
    setIsPitchMatched(false);
    setDetectedPitch(null);

    // Libre mode: play the key's default octave
    voicePlayback.playVoiceNote(
      { name: note.displayName || note.name, midi: note.midi, frequency: note.frequency, octave: note.octave },
      gender,
      2.0
    );
  };

  // ─── 9. Level Challenge Mechanics ─────────────────────────────────
  const startLevel = useCallback((diff: Difficulty, lvl: number) => {
    if ((userStats.lives ?? 1) <= 0) {
      if (onOpenRecoveryExam) onOpenRecoveryExam();
      return;
    }
    setTunerMode('niveles');
    setSelectedDifficulty(diff);
    if (diff === 'Fácil') setDifficulty('facil');
    else if (diff === 'Medio') setDifficulty('medio');
    else if (diff === 'Difícil' || diff === 'Maestro') setDifficulty('dificil');

    setCurrentLevel(lvl);
    setIsLevelSelectOpen(false);
    setIsWinModalOpen(false);
    setCompletedChallengeNotes(new Set());
    setChallengeIndex(0);
    inTuneSinceRef.current = null;
    setTugOfWarProgress(50);
    tugOfWarRef.current = 50;
    setIsLevelFailed(false);
    isLevelFailedRef.current = false;

    const diffArray = difficultyLevels[diff as ChallengeDifficulty];
    const isRhythm = diff !== 'Calentamiento' && diffArray && diffArray[lvl - 1] === 0;

    if (isRhythm) {
      audioService.stopMicrophone();
      setIsTuningActive(false);
      return;
    }

    // Generate notes based on mode and user vocal range pool
    let notes: NoteInfo[] = [];
    if (diff === 'Medio' && (lvl === 1 || lvl % 2 === 0)) {
      // Arpeggio challenge
      notes = generateIntervalChallenge(lvl, userNotePool);
    } else if (diff === 'Fácil' && (lvl === 4 || lvl === 6)) {
      // Melody challenge
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
      // Standard note pool challenge
      const noteCount = diff === 'Calentamiento' ? 4 : (diffArray ? diffArray[lvl - 1] || 4 : 4);
      notes = generateChallenge(noteCount, userNotePool);
    }

    setChallengeNotes(notes);
    startTuningMic();

    // In Simon Says mode (or if melody), play sequence for the user to hear
    if (diff === 'Difícil' && lvl % 3 === 0 && notes.length > 0) {
      setIsSimonPlayback(true);
      notes.forEach((n, idx) => {
        setTimeout(() => {
          setSimonActiveNote(n);
          voicePlayback.playVoiceNote(n, gender, 1.2);
        }, idx * 1400);
      });
      setTimeout(() => {
        setIsSimonPlayback(false);
        setSimonActiveNote(null);
        audioService.playSoftDing();
      }, notes.length * 1400 + 400);
    }
  }, [userNotePool, gender]);

  const handleNoteCompletedInChallenge = () => {
    voicePlayback.playCompletionChime();
    setCompletedChallengeNotes(prev => new Set(prev).add(challengeIndexRef.current));
    setTugOfWarProgress(50);
    tugOfWarRef.current = 50;

    // Handle combo
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

    // Advance to next note or finish level
    const nextIdx = challengeIndexRef.current + 1;
    if (nextIdx < challengeNotesRef.current.length) {
      setChallengeIndex(nextIdx);
      // Play reference of next note
      setTimeout(() => {
        const nextNote = challengeNotesRef.current[nextIdx];
        if (nextNote) {
          voicePlayback.playVoiceNote(nextNote, gender, 1.5);
        }
      }, 500);
    } else {
      // Level completed!
      handleLevelVictory();
    }
  };

  const handleLevelVictory = (calculatedScore = 100) => {
    audioService.stopMicrophone();
    setIsTuningActive(false);
    emitStreakEligibleAction();

    const starsEarned = calculatedScore >= 95 ? 3 : calculatedScore >= 80 ? 2 : 1;
    const xp = starsEarned * 15;
    setWinStars(starsEarned);
    setWinXp(xp);
    setIsWinModalOpen(true);

    // Save progress in state and localStorage
    if (selectedDifficulty !== 'Calentamiento') {
      const challengeDiff = selectedDifficulty as ChallengeDifficulty;
      setLevelProgress(prev => {
        const currentBest = prev[challengeDiff]?.[currentLevel] || 0;
        const newProgress = {
          ...prev,
          [challengeDiff]: {
            ...prev[challengeDiff],
            [currentLevel]: Math.max(currentBest, starsEarned)
          }
        };
        try {
          localStorage.setItem('laclave_tuner_progress_v2', JSON.stringify(newProgress));
        } catch {}
        return newProgress;
      });
    }

    // Award XP
    if (onUpdateStats) {
      onUpdateStats({
        xp: (userStats.xp || 0) + xp,
        lessonsCompleted: (userStats.lessonsCompleted || 0) + 1
      });
    }
  };

  const handleNextLevel = () => {
    // Show video cinematic for last level of Easy mode after clicking next
    if (selectedDifficulty === 'Fácil' && currentLevel === difficultySettings['Fácil'].levelCount) {
      setShowEasyWinVideo(true);
      // Don't open level select here - let the video component handle it
      setIsWinModalOpen(false);
      return; // Exit early, video component will open level select after closing
    }
    setIsWinModalOpen(false);
    const maxLvl = difficultySettings[selectedDifficulty]?.levelCount || 12;
    if (currentLevel < maxLvl) {
      startLevel(selectedDifficulty, currentLevel + 1);
    } else {
      setIsLevelSelectOpen(true);
    }
  };

  // Switch to Level mode on mount if requested
  const isRhythmActive = tunerMode === 'niveles' && selectedDifficulty !== 'Calentamiento' &&
    difficultyLevels[selectedDifficulty as ChallengeDifficulty]?.[currentLevel - 1] === 0;

  // ─── 10. Manual Range Preset Handler ──────────────────────────────
  const handleSaveManualRange = (data: { classification: string; noteMin: string; noteMax: string; minHz: number; maxHz: number; gender: 'masculino' | 'femenino' }) => {
    const rangeData = {
      classification: data.classification,
      noteMin: data.noteMin,
      noteMax: data.noteMax,
      minHz: data.minHz,
      maxHz: data.maxHz
    };
    setEffectiveRangeData(rangeData);
    setGender(data.gender);
    setIsRangeRequiredModalOpen(false);

    try {
      localStorage.setItem('laclave_vocal_range_saved', JSON.stringify(rangeData));
      localStorage.setItem('laclave_vocal_range_classification', data.classification);
      localStorage.setItem('laclave_voice_gender', data.gender);
    } catch {}

    if (onUpdateStats) {
      onUpdateStats({
        vocalRange: data.classification,
        vocalRangeData: rangeData
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.stopMicrophone();
      voicePlayback.stopActiveSound();
    };
  }, []);

  // ─── 11. Early Returns for Sub-Views ──────────────────────────────
  if (activeSubView === 'escalas') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <EscalasModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
          onSelectNote={(note) => {
            setActiveSubView(null);
            const found = allNotes.find(b => b.name.toUpperCase() === note.name.toUpperCase() || b.displayName.toUpperCase() === note.name.toUpperCase());
            if (found) handleSelectNote(found);
          }}
        />
      </div>
    );
  }

  if (activeSubView === 'respiracion') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <BreathingModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  if (activeSubView === 'estabilidad') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <StabilityChallengeModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
          onGrantXp={(amount) => {
            if (onUpdateStats) {
              onUpdateStats({ xp: (userStats.xp || 0) + amount });
            }
          }}
        />
      </div>
    );
  }

  if (activeSubView === 'duelo') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <DueloRapidoModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  if (activeSubView === 'tesitura') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <VocalRangeModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
          onSaveRange={(rangeData) => {
            setEffectiveRangeData(rangeData);
            setIsRangeRequiredModalOpen(false);
            if (onUpdateStats) {
              onUpdateStats({
                vocalRange: rangeData.classification,
                vocalRangeData: rangeData
              });
            }
          }}
        />
      </div>
    );
  }

  if (activeSubView === 'evaluacion') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <VoiceEvalModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  // ─── 12. Main View Render ─────────────────────────────────────────
  return (
    <div className="pb-24 pt-0 px-2 sm:px-4 max-w-md mx-auto space-y-2 sm:space-y-2.5 animate-fadeIn relative -mt-4 sm:-mt-3">
      {/* ─── Mandatory Calibration Modal ─── */}
      <TunerRangeRequiredModal
        isOpen={isRangeRequiredModalOpen}
        onStartAssessment={() => {
          setIsRangeRequiredModalOpen(false);
          setActiveSubView('tesitura');
        }}
        onManualSelect={handleSaveManualRange}
      />

      {/* ─── Level Selection Modal ─── */}
      <TunerLevelSelectModal
        isOpen={isLevelSelectOpen}
        onClose={() => setIsLevelSelectOpen(false)}
        selectedDifficulty={selectedDifficulty}
        onSelectDifficulty={setSelectedDifficulty}
        onStartLevel={startLevel}
        progress={levelProgress}
        userStreak={userStats.streak || 0}
      />

      {/* ─── Level Win Celebration Modal ─── */}
      <TunerWinModal
        isOpen={isWinModalOpen}
        level={currentLevel}
        difficulty={selectedDifficulty}
        stars={winStars}
        xpEarned={winXp}
        onNextLevel={handleNextLevel}
        onReplay={() => startLevel(selectedDifficulty, currentLevel)}
        onClose={() => setIsWinModalOpen(false)}
      />

      {/* ─── Level Defeat Modal (Tug-of-War reached 0) ─── */}
      {isLevelFailed && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-3xl p-6 max-w-sm w-full space-y-4 border shadow-2xl text-center ${
            zenMode
              ? 'bg-[#1f2125] border-[#2e3138]'
              : 'bg-white dark:bg-[#102034] border-rose-200 dark:border-rose-900/60'
          }`}>
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
              <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white">
                ¡Nivel Fracasado!
              </h3>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                -1 Vida descontada
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Has desafinado repetidamente la nota del reto y la barra de precisión llegó al límite.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {(userStats.lives ?? 1) > 0 ? (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setIsLevelFailed(false);
                    startLevel(selectedDifficulty, currentLevel);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reintentar Nivel</span>
                </button>
              ) : (
                <>
                  {onOpenRecoveryExam && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setIsLevelFailed(false);
                        setTunerMode('libre');
                        onOpenRecoveryExam();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                      <span>Entrenar para ganar 1 vida (Gratis)</span>
                    </button>
                  )}
                  {onOpenStore && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setIsLevelFailed(false);
                        setTunerMode('libre');
                        onOpenStore();
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs border active:scale-98 transition-all cursor-pointer ${
                        zenMode
                          ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Recargar en la Tienda
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  audioService.playClickSound();
                  setIsLevelFailed(false);
                  setTunerMode('libre');
                }}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Salir a Modo Libre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Easy Mode Win Video ─── */}
      {showEasyWinVideo && (
        <div className="fixed inset-0 bg-black z-99 flex flex-col items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-md aspect-square">
            <video
              ref={videoRef}
              src="/Duck Win.mp4"
              autoPlay
              muted={false}
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            size="lg"
            onClick={() => {
              setShowEasyWinVideo(false);
              setIsLevelSelectOpen(true);
            }}
            className={`absolute bottom-16 z-80 h-20 px-8 text-xl sm:text-2xl font-black rounded-full transition-all ${
              zenMode
                ? 'bg-[#e5b83b] text-[#161719] shadow-[0_4px_0_0_#9a7212] hover:translate-y-1'
                : 'bg-[#4648d4] text-white shadow-[0_4px_0_0_rgba(30,30,120,1)] hover:translate-y-1 hover:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)]'
            }`}
          >
            Siguiente Reto <ArrowRight className="ml-2 w-8 h-8 sm:w-10 sm:h-10" />
          </Button>
        </div>
      )}

{effectiveRangeData && (
        <div className="flex items-center justify-between px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${zenMode ? 'bg-[#e5b83b]' : 'bg-indigo-500'}`} />
            <span>
              Tesitura: <strong className="font-bold text-slate-700 dark:text-slate-300">{effectiveRangeData.classification}</strong>{' '}
              <span className="opacity-75">({effectiveRangeData.noteMin} - {effectiveRangeData.noteMax})</span>
            </span>
          </div>
          <button
            onClick={() => setActiveSubView('tesitura')}
            className={`text-[10px] font-bold hover:underline transition-colors cursor-pointer ${
              zenMode ? 'text-[#e5b83b] hover:text-[#f5d56b]' : 'text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            Recalibrar
          </button>
        </div>
      )}

      {/* ─── 0-Lives Locked Gate or Active Tuner/Rhythm View ─── */}
      {(userStats.lives ?? 1) <= 0 ? (
        <div className={`rounded-3xl p-6 shadow-lg border text-center space-y-4 ${
          zenMode
            ? 'bg-[#1f2125] border-[#2e3138]'
            : 'bg-white dark:bg-[#102034] border-rose-200/70 dark:border-rose-900/50'
        }`}>
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className={`text-xl font-heading font-black ${
              zenMode ? 'text-[#ded9cf]' : 'text-slate-800 dark:text-white'
            }`}>
              Afinador Bloqueado (0 Vidas)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Tanto el modo libre como los niveles requieren al menos 1 vida para escuchar tu afinación en vivo.
              ¡Los programas de control diafragmático y respiración abajo siguen 100% habilitados!
            </p>
          </div>

          {/* Passive recharge countdown */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left max-w-xs mx-auto ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Recarga pasiva en
              </span>
            </div>
            <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
              {timeToNextLife.formatted}
            </span>
          </div>

          {/* Recovery actions */}
          <div className="space-y-2 pt-1 max-w-xs mx-auto">
            {onOpenRecoveryExam && (
              <button
                onClick={() => {
                  audioService.playClickSound();
                  onOpenRecoveryExam();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                <span>Entrenar para ganar 1 vida (Gratis)</span>
              </button>
            )}

            {onOpenStore && (
              <button
                onClick={() => {
                  audioService.playClickSound();
                  onOpenStore();
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs border active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  zenMode
                    ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>Recargar en la Tienda</span>
              </button>
            )}
          </div>
        </div>
      ) : isRhythmActive ? (
        <TunerRhythmView
          level={currentLevel}
          pattern={rhythmPatterns[currentLevel] || rhythmPatterns[7]}
          bpm={80 + (currentLevel - 7) * 10}
          onSuccess={(score) => handleLevelVictory(score)}
          onFail={() => {
            if (onLoseLife) {
              onLoseLife('tuner');
            }
          }}
          onExit={() => setTunerMode('libre')}
        />
      ) : (
        <>
          {/* ─── Tuner Visualizer Card ─── */}
          <div id="tour-tuner-card" className={`rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3.5 transition-colors border ${
            zenMode
              ? 'bg-[#1f2125] border-[#2e3138]'
              : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f]'
          }`}>
            {/* Header: Title on left, Escuchar & EN VIVO on right, dynamic subtitle below */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {tunerMode === 'libre' && (
                    <h2 className={`font-heading font-bold text-lg whitespace-nowrap truncate ${
                      zenMode ? 'text-[#f0ebe1]' : 'text-[#2c2abc] dark:text-[#c0c1ff]'
                    }`}>
                      Afinador Vocal
                    </h2>
                  )}
                  {tunerMode === 'niveles' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-[10px] font-heading font-extrabold shrink-0">
                      {selectedDifficulty} • Nv {currentLevel}
                    </span>
                  )}
                  {tunerMode === 'niveles' && comboCount >= 2 && (
                    <span className="flex items-center gap-0.5 text-xs font-heading font-black text-amber-500 dark:text-amber-400 animate-bounce shrink-0">
                      <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      x{comboCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                      zenMode
                        ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border border-[#383c44]'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    title="Escuchar audio de la nota"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
                    <span>Escuchar</span>
                  </button>

                  {isTuningActive ? (
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold whitespace-nowrap border ${
                      zenMode
                        ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-ping ${zenMode ? 'bg-[#e5b83b]' : 'bg-emerald-500'}`} />
                      <span>EN VIVO</span>
                    </div>
                  ) : (
                    <button
                      onClick={toggleTuning}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                        zenMode
                          ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30 hover:bg-[#2e323a]'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200/50 dark:border-indigo-800/50'
                      }`}
                      title="Activar micrófono para afinar"
                    >
                      <Mic className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
                      <span>Activar</span>
                    </button>
                  )}

                  {tunerMode === 'niveles' && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        audioService.stopMicrophone();
                        setIsTuningActive(false);
                        setTunerMode('libre');
                      }}
                      className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                      title="Volver a Modo Libre"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {tunerMode === 'libre' ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {!isTuningActive
                    ? 'Activa el micrófono abajo para evaluar tu voz'
                    : detectedPitch
                    ? `Detectando tu voz • ${tuningStatusMsg}`
                    : `Escuchando en vivo... Canta ${activeTargetNote.name}`}
                </p>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Nota {challengeIndex + 1} de {challengeNotes.length}
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                      {challengeNotes.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx < challengeIndex
                              ? 'bg-emerald-500 shadow-xs'
                              : idx === challengeIndex
                              ? 'bg-indigo-600 dark:bg-indigo-400 scale-125 shadow-2xs ring-2 ring-indigo-300 dark:ring-indigo-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {isTuningActive && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {detectedPitch ? `${detectedPitch} Hz` : 'Canta ahora...'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Calentamiento banner (Solo en niveles cuando está en calentamiento) */}
            {tunerMode === 'niveles' && selectedDifficulty === 'Calentamiento' && (
              <div className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs font-bold ${
                zenMode
                  ? 'bg-[#22252a] border-[#2e3138] text-[#ded9cf]'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Calentamiento (Zona Segura • Sin perder vidas)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-heading font-extrabold">
                  Libre
                </span>
              </div>
            )}

            {/* Gauge Display with Particles & Dynamic Central Sphere */}
            <div
              id="tour-tuner-gauge"
              className={`bg-[#e9f0ff] dark:bg-[#0b1828] ${zenMode ? 'zen-mode:bg-[#131d2a]' : ''} rounded-2xl p-4 border border-blue-100 dark:border-slate-800 relative min-h-[190px] flex flex-col justify-between overflow-hidden shadow-inner`}
            >
              {/* Technical Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none" />

              {/* Audio Particle Canvas */}
              <AudioParticleCanvas
                isTuningActive={isTuningActive}
                detectedPitch={detectedPitch}
                volume={volume}
                isPitchMatched={isPitchMatched}
                selectedNoteName={activeTargetNote.name}
                targetFrequency={targetFreq}
                darkMode={darkMode}
                zenMode={zenMode}
              />

              {/* Floating Combo Big Text */}
              <AnimatePresence>
                {showComboAnimation && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 10 }}
                    animate={{ scale: 1.2, opacity: 1, y: -10 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-x-0 top-2 z-30 flex justify-center pointer-events-none"
                  >
                    <span className="text-2xl sm:text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 drop-shadow-lg">
                      ¡COMBO x{comboCount}! ⚡
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Center Sphere with Concentric Aura Shield Ring */}
              <div className="relative z-10 flex flex-col items-center my-2">
                {tunerMode === 'niveles' && selectedDifficulty !== 'Calentamiento' ? (
                  <AuraShieldRing
                    progress={tugOfWarProgress}
                    isActive={isTuningActive}
                    isMatched={isPitchMatched}
                    zenMode={zenMode}
                    showBadges={true}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
                      }}
                      title="Toca para escuchar voz real"
                      className={`w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative cursor-pointer ${sphereStyle}`}
                      style={{
                        transform: isTuningActive && volume > 0.02 ? `scale(${1 + Math.min(0.18, volume * 1.5)})` : undefined
                      }}
                    >
                      <span className="font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm">
                        {activeTargetNote.name}
                      </span>
                      <span className="text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                        <Volume2 className="w-3 h-3 opacity-80" />
                        {detectedPitch ? `${detectedPitch} Hz` : `${targetFreq} Hz`}
                      </span>
                    </motion.button>
                  </AuraShieldRing>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
                    }}
                    title="Toca para escuchar voz real"
                    className={`w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative cursor-pointer ${sphereStyle}`}
                    style={{
                      transform: isTuningActive && volume > 0.02 ? `scale(${1 + Math.min(0.18, volume * 1.5)})` : undefined
                    }}
                  >
                    <span className="font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm">
                      {activeTargetNote.name}
                    </span>
                    <span className="text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                      <Volume2 className="w-3 h-3 opacity-80" />
                      {detectedPitch ? `${detectedPitch} Hz` : `${targetFreq} Hz`}
                    </span>
                  </motion.button>
                )}

                {/* State Badge */}
                {isTuningActive ? (
                  <div className={`mt-2.5 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-md border transition-all duration-300 ${badgeBorderColor} ${statusTextColor}`}>
                    {statusIcon}
                    <span>{tuningStatusMsg}</span>
                  </div>
                ) : (
                  <button
                    onClick={toggleTuning}
                    className={`mt-2 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-102 ${
                      zenMode
                        ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/40 hover:bg-[#2e323a]'
                        : 'bg-white/95 dark:bg-[#102034]/95 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 hover:bg-indigo-50 dark:hover:bg-[#15273e]'
                    }`}
                  >
                    <Mic className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'} animate-pulse`} />
                    <span>Toca para activar micrófono y afinar</span>
                  </button>
                )}
              </div>

              {/* Equalizer Waveform Bars (Restored to original h-12 w-6 size) */}
              <div className="relative z-10 flex items-end justify-center gap-2 h-12 pt-2">
                {[40, 65, 85, 45, 75, 95, 60].map((baseHeight, i) => {
                  const dynamicHeight = isTuningActive && volume > 0.01
                    ? Math.min(100, Math.max(20, baseHeight * (volume * 15)))
                    : baseHeight * 0.4;
                  return (
                    <div
                      key={i}
                      className={`w-6 rounded-t-md transition-all duration-150 ${
                        zenMode
                          ? (isPitchMatched ? 'bg-[#e5b83b]' : 'bg-[#383c44]')
                          : (isPitchMatched ? 'bg-emerald-400' : 'bg-[#98a5f5]')
                      }`}
                      style={{ height: `${dynamicHeight}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Standard Unified Teclado Vocal (Modo Libre + Niveles) ─── */}
          <div id="tour-tuner-reference" className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 sm:space-y-3.5">
            <div className="flex items-center justify-between pb-1 sm:pb-1.5">
              <div className="flex flex-col gap-0.5">
                <span className="font-heading font-black text-xs sm:text-[13px] text-slate-800 dark:text-white leading-tight">
                  Teclado Vocal
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {tunerMode === 'libre'
                    ? 'Toca una tecla para escuchar su tono de referencia'
                    : 'Toca la tecla activa para recordar su tono de referencia'}
                </span>
              </div>
            </div>

            {/* 🎹 Piano Touch Strip (7 Natural White Keys + 5 Sharp Black Keys) */}
            <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
              {/* 7 White Keys Container */}
              <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
                {naturalNotes.map((note) => {
                  const isLevelMode = tunerMode === 'niveles';
                  const isInChallenge = isLevelMode && challengeNotes.some(cn => cn.name.toUpperCase() === note.name.toUpperCase());
                  const isCurrentTarget = isLevelMode
                    ? activeTargetNote.name.toUpperCase() === note.name.toUpperCase()
                    : selectedNote.name === note.name;
                  const isCompleted = isLevelMode && challengeNotes.some((cn, idx) =>
                    completedChallengeNotes.has(idx) &&
                    cn.name.toUpperCase() === note.name.toUpperCase() &&
                    idx < challengeIndex
                  );
                  const isUnused = isLevelMode && !isInChallenge;

                  return (
                    <motion.button
                      key={note.name}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectNote(note)}
                      className={`flex-1 h-full rounded-b-xl sm:rounded-b-2xl transition-all flex flex-col justify-end items-center pb-1.5 relative border ${
                        isCurrentTarget
                          ? (zenMode
                              ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-[0_4px_0_0_#9a7212] ring-2 ring-[#f5d56b] z-0 cursor-pointer animate-pulse font-black'
                              : 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80 z-0 cursor-pointer animate-pulse')
                          : isCompleted
                          ? (zenMode
                              ? 'bg-[#9ba2b0] text-[#141619] border-[#e5b83b]/60 shadow-[0_4px_0_0_#6c7380] cursor-pointer'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80 shadow-[0_4px_0_0_#059669] dark:shadow-[0_4px_0_0_#064e3b] cursor-pointer')
                          : isInChallenge
                          ? (zenMode
                              ? 'bg-[#e2e6ed] text-[#141619] hover:bg-[#edf1f8] border-[#e5b83b] ring-1 ring-[#e5b83b]/60 shadow-[0_4px_0_0_#9ba2b0] cursor-pointer'
                              : 'bg-white dark:bg-[#152336] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-indigo-200/90 dark:border-indigo-800/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] ring-1 ring-indigo-400/30 cursor-pointer')
                          : (zenMode
                              ? 'bg-[#c8ccd4] text-[#141619] hover:bg-[#d8dce4] border-[#aeb4c0] shadow-[0_4px_0_0_#8e94a0] cursor-pointer'
                              : 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer')
                      }`}
                      title={isLevelMode ? (isCurrentTarget ? `Tocar ${note.displayName} (recordar tono)` : `Nota ${note.displayName}`) : `Tocar ${note.displayName}`}
                    >
                      {/* Top Indicator for Level Challenge (Check or Active Dot) */}
                      {isLevelMode && !isUnused && (
                        <div className="absolute top-1 inset-x-0 flex justify-center">
                          {isCompleted ? (
                            <span className={`text-[8px] font-black leading-none ${zenMode ? 'text-[#141619]' : 'text-emerald-500'}`}>✓</span>
                          ) : isCurrentTarget ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          ) : (
                            <span className={`w-1 h-1 rounded-full ${zenMode ? 'bg-[#7a580a]' : 'bg-indigo-400/70'}`} />
                          )}
                        </div>
                      )}

                      <span className={`font-heading font-black text-xs sm:text-sm leading-none ${
                        zenMode && isCurrentTarget ? 'text-[#161719]' : zenMode ? 'text-[#141619]' : ''
                      }`}>
                        {note.name}
                      </span>
                      <span className={`text-[10px] font-bold mt-0.5 leading-none ${
                        zenMode
                          ? (isCurrentTarget ? 'text-[#161719]' : isCompleted ? 'text-[#7a580a]' : 'text-[#4b5260]')
                          : (isCurrentTarget ? 'text-indigo-100' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500')
                      }`}>
                        {note.letter}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* 5 Black Keys (Overlapping) */}
              {blackKeyPositions.map(({ note, left }) => {
                if (!note) return null;
                const isLevelMode = tunerMode === 'niveles';
                const isInChallenge = isLevelMode && challengeNotes.some(cn => cn.name.toUpperCase() === note.name.toUpperCase());
                const isCurrentTarget = isLevelMode
                  ? activeTargetNote.name.toUpperCase() === note.name.toUpperCase()
                  : selectedNote.name === note.name;
                const isCompleted = isLevelMode && challengeNotes.some((cn, idx) =>
                  completedChallengeNotes.has(idx) &&
                  cn.name.toUpperCase() === note.name.toUpperCase() &&
                  idx < challengeIndex
                );
                const isUnused = isLevelMode && !isInChallenge;

                return (
                  <motion.button
                    key={note.name}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleSelectNote(note)}
                    style={{ left }}
                    className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] sm:w-[11%] h-12 sm:h-13 rounded-b-lg sm:rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 border ${
                      isCurrentTarget
                        ? (zenMode
                            ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-[0_3px_0_0_#9a7212] ring-2 ring-[#f5d56b] scale-105 z-20 cursor-pointer animate-pulse font-black'
                            : 'bg-gradient-to-b from-violet-500 to-purple-700 text-white border-violet-400 shadow-[0_3px_0_0_#3b0764] ring-2 ring-violet-300 scale-105 z-20 cursor-pointer animate-pulse')
                        : isCompleted
                        ? (zenMode
                            ? 'bg-[#2a2d34] text-[#f0ebe1] border-[#383c44] shadow-[0_3px_0_0_#141619] z-10 cursor-pointer'
                            : 'bg-emerald-800 dark:bg-emerald-900 text-emerald-100 border-emerald-600 shadow-[0_3px_0_0_#064e3b] z-10 cursor-pointer')
                        : isInChallenge
                        ? (zenMode
                            ? 'bg-[#141619] text-white hover:bg-[#1f2125] border-[#e5b83b]/40 shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                            : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-purple-400/70 shadow-[0_3px_0_0_#020617] ring-1 ring-violet-400/40 cursor-pointer')
                        : (zenMode
                            ? 'bg-[#141619] text-[#ded9cf] hover:bg-[#1f2125] border-[#2e3138] shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                            : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer')
                    }`}
                    title={isLevelMode ? (isCurrentTarget ? `Tocar ${note.displayName} (recordar tono)` : `Nota ${note.displayName}`) : `Tocar ${note.displayName}`}
                  >
                    {/* Top Indicator for Level Challenge (Check or Active Dot) */}
                    {isLevelMode && !isUnused && (
                      <div className="absolute top-0.5 inset-x-0 flex justify-center">
                        {isCompleted ? (
                          <span className={`text-[7.5px] font-black leading-none ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-400'}`}>✓</span>
                        ) : isCurrentTarget ? (
                          <span className={`w-1.5 h-1.5 rounded-full animate-ping ${zenMode ? 'bg-[#161719]' : 'bg-violet-200'}`} />
                        ) : (
                          <span className={`w-1 h-1 rounded-full ${zenMode ? 'bg-[#e5b83b]/70' : 'bg-violet-400/80'}`} />
                        )}
                      </div>
                    )}

                    <span className={`font-heading font-black text-[9px] sm:text-[10px] leading-none drop-shadow-xs ${
                      isCurrentTarget && zenMode ? 'text-[#161719]' : 'text-white'
                    }`}>
                      {note.name}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] font-bold mt-0.5 leading-none ${
                      zenMode
                        ? (isCurrentTarget ? 'text-[#161719]' : isCompleted ? 'text-[#e5b83b]' : 'text-[#99958d]')
                        : (isCurrentTarget ? 'text-violet-200' : isCompleted ? 'text-emerald-300' : 'text-slate-400')
                    }`}>
                      {note.letter}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Controls Group: Mode Selector + Mic Button */}
            <div className="pt-2 sm:pt-2.5 space-y-2">
              {/* Difficulty / Mode Selector Pill - Slim & Discrete */}
              <div className={`p-0.5 rounded-full flex items-center justify-between max-w-[310px] mx-auto w-full border ${
                zenMode
                  ? 'bg-[#191b1f] border-[#2e3138]'
                  : 'bg-[#eff4ff]/80 dark:bg-[#0b1828]/80 border-slate-200/70 dark:border-slate-800'
              }`}>
                {(['facil', 'medio', 'dificil'] as const).map(d => {
                  const targetDiff: Difficulty = d === 'facil' ? 'Fácil' : d === 'medio' ? 'Medio' : 'Difícil';
                  const hzText = d === 'facil' ? '±15Hz' : d === 'medio' ? '±8Hz' : '±4Hz';
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        audioService.playClickSound();
                        if ((userStats.lives ?? 1) <= 0) {
                          if (onOpenRecoveryExam) onOpenRecoveryExam();
                          return;
                        }
                        setDifficulty(d);
                        setSelectedDifficulty(targetDiff);
                        setIsLevelSelectOpen(true);
                      }}
                      className={`flex-1 py-0.5 px-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer capitalize flex items-center justify-center gap-1 leading-normal ${
                        difficulty === d
                          ? (zenMode
                              ? 'bg-[#e5b83b] text-[#161719] shadow-2xs border border-[#f5d56b] font-black'
                              : 'bg-white dark:bg-[#102034] text-[#2c2abc] dark:text-[#c0c1ff] shadow-2xs border border-slate-200/80 dark:border-slate-700')
                          : (zenMode
                              ? 'text-[#99958d] hover:text-[#ded9cf]'
                              : 'text-slate-500 dark:text-[#a0a5ba] hover:text-slate-800 dark:hover:text-white')
                      }`}
                      title={`Ver niveles en modo ${targetDiff}`}
                    >
                      <span>{targetDiff}</span>
                      <span className={`text-[8.5px] font-normal ${zenMode && difficulty === d ? 'text-[#161719]/80' : 'opacity-60'}`}>({hzText})</span>
                    </button>
                  );
                })}
              </div>

              {/* Toggle Mic Button - Small, compact & centered (Pyramid: Pequeño -> Mediano -> Grande) */}
              <div className="flex justify-center">
                <button
                  onClick={toggleTuning}
                  className={`w-full max-w-[210px] sm:max-w-[220px] py-1.5 sm:py-2 px-4 rounded-full font-heading font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
                    isTuningActive
                      ? (zenMode ? 'bg-[#2a2d34] text-[#e5b83b] border border-[#e5b83b] shadow-[0_2px_0_0_#141619]' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_2px_0_0_#991b1b]')
                      : (zenMode ? 'bg-[#e5b83b] text-[#161719] shadow-[0_3px_0_0_#9a7212] font-black' : 'tactile-btn-primary')
                  }`}
                >
                  {isTuningActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isTuningActive ? 'Pausar Micrófono' : 'Activar Micrófono'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Pitch Stability Chart ─── */}
          <PitchStabilityChart
            isTuningActive={isTuningActive}
            detectedPitch={detectedPitch}
            targetFrequency={targetFreq}
            targetNoteName={activeTargetNote.name}
            tolerance={tolerance}
            darkMode={darkMode}
          />
        </>
      )}

      {/* ─── Accordion: Practice Apparatus & Tools ─── */}
      <div id="tour-tuner-apparatus" className="space-y-4 pt-1">
        <button
          onClick={() => {
            audioService.playClickSound();
            setIsExtraToolsOpen(prev => !prev);
          }}
          className={`w-full py-4 px-5 rounded-3xl border shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer min-h-[56px] ${
            zenMode
              ? 'bg-[#1f2125] border-[#2e3138]'
              : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-[#1b2b3f]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl shadow-inner ${
              zenMode
                ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
                : 'bg-indigo-50 dark:bg-indigo-950/70 text-[#4648d4] dark:text-[#c0c1ff]'
            }`}>
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className={`font-heading font-bold text-sm ${
                  zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                }`}>
                  Aparatos y Programas de Práctica
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}>
                  6 Herramientas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Test vocal, escalas, respiración, duelos y diagnóstico
              </p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {isExtraToolsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {/* Collapsible Tools Grid */}
        <div className={`space-y-5 transition-all duration-300 ${isExtraToolsOpen ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tool 1: Tesitura Vocal */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('tesitura');
              }}
              className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
                zenMode
                  ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-md'
              }`}
            >
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-purple-200'
                }`}>
                  TEST VOCAL
                </span>
                <h4 className="text-base font-heading font-black">Rango vocal en vivo</h4>
                <p className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-purple-100/90'
                }`}>
                  Encuentra tu nota más baja y más aguda
                </p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                <Mic className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Tool 2: Ejercicios de Respiración */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('respiracion');
              }}
              className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
                zenMode
                  ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white shadow-md'
              }`}
            >
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-indigo-200'
                }`}>
                  Control Diafragmático
                </span>
                <h4 className="text-base font-heading font-black">Ejercicios de Respiración</h4>
                <p className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-emerald-100/90'
                }`}>
                  Visualizador diafragmático 4-4-4
                </p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                <RotateCcw className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Tool 3: Desafío de Estabilidad 10s */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('estabilidad');
              }}
              className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
                zenMode
                  ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white shadow-md'
              }`}
            >
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-cyan-200'
                }`}>
                  Desafío de Retención
                </span>
                <h4 className="text-base font-heading font-black">Desafío de Estabilidad (10s)</h4>
                <p className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-fuchsia-100/90'
                }`}>
                  Retén la nota fija y multiplica tu XP
                </p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                <Target className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Tool 4: Evaluación Inteligente */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('evaluacion');
              }}
              className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
                zenMode
                  ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                  : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 text-white shadow-md'
              }`}
            >
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-emerald-200'
                }`}>
                  Diagnóstico IA
                </span>
                <h4 className="text-base font-heading font-black">Evaluación de Precisión</h4>
                <p className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-indigo-100/90'
                }`}>
                  Puntuación y reseña técnica de tu tono
                </p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Tool 5: Escalas Rápidas */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('escalas');
              }}
              className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
                zenMode
                  ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                  : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md'
              }`}
            >
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-fuchsia-200'
                }`}>
                  Solfeo y Audición
                </span>
                <h4 className="text-base font-heading font-black">Escalas Rápidas Vocales</h4>
                <p className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-cyan-100/90'
                }`}>
                  Referencia auditiva para solfeo
                </p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                <Music2 className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Tool 6: Duelo Rápido Vocal (próximamente) */}
            <div className={`p-4 rounded-3xl text-left flex items-center justify-between relative overflow-hidden cursor-not-allowed select-none transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-md'
            }`}>
              {/* Cinta de seguridad diagonal: de arriba-izquierda a abajo-derecha */}
              <div
                className="absolute -left-14 top-1 w-[160%] -rotate-[18deg] py-1.5 flex items-center justify-center shadow-md"
                style={{ backgroundImage: zenMode ? 'repeating-linear-gradient(45deg, #0a0a0a 0px, #0a0a0a 9px, #e5b83b 9px, #e5b83b 18px)' : 'repeating-linear-gradient(45deg, #0a0a0a 0px, #0a0a0a 9px, #facc15 9px, #facc15 18px)' }}
              >
                <span className="bg-black/80 text-yellow-300 text-[10px] font-black uppercase tracking-widest px-4 py-0.5 rounded-sm shadow-md flex items-center gap-1 -ml-30">
                  <Lock className="w-3 h-3" />
                  Disponible Pronto
                </span>
              </div>
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-amber-200'
                }`}>
                  Competencia Vocal
                </span>
                <h4 className="text-base font-heading font-black">Duelo Rápido Vocal</h4>
                <p className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-amber-100/90'
                }`}>
                  Desafía a un amigo o a la IA
                </p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 opacity-60 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                <Swords className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ─── Precision History Section ─── */}
          <div id="sec-historial" className={`rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors ${
            zenMode
              ? 'bg-[#1b1c1e] border border-[#2e3138]'
              : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-heading font-bold text-base ${
                    zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                  }`}>
                    Historial de Precisión
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Últimas 5 notas afinadas con éxito
                  </p>
                </div>
              </div>
              {tunedHistory.length > 0 && (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setTunedHistory([]);
                    try { localStorage.removeItem('laclave_tuned_history'); } catch {}
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {tunedHistory.length === 0 ? (
              <div className={`p-4 rounded-2xl border border-dashed text-center space-y-1 ${
                zenMode
                  ? 'bg-[#161719] border-[#2e3138]'
                  : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800'
              }`}>
                <p className={`text-xs font-bold ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  Sin notas afinadas aún en este historial
                </p>
                <p className="text-[11px] text-slate-400">
                  Activa el micrófono y canta una nota con precisión para registrar tus logros.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tunedHistory.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      zenMode
                        ? 'bg-[#22252a] border-[#2e3138] hover:border-[#e5b83b]/40'
                        : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-100 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl font-heading font-extrabold text-xs flex items-center justify-center shadow-xs ${
                          zenMode
                            ? 'bg-[#2e3138] text-[#e5b83b] border border-[#e5b83b]/30'
                            : 'text-white'
                        }`}
                        style={{ backgroundColor: zenMode ? undefined : item.noteColor }}
                      >
                        {item.noteName}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            zenMode ? 'text-[#ded9cf]' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {item.detectedFreq} Hz
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            (Meta: {item.targetFreq} Hz)
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 block">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                      zenMode
                        ? 'bg-[#26292f] border-[#e5b83b]/40 text-[#e5b83b]'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                      <span>{item.diffHz === 0 ? 'Perfecto' : `±${item.diffHz} Hz`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
