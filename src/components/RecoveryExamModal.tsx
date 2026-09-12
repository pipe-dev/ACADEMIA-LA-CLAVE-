'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { voicePlayback, generateUserNotePool, NoteInfo } from '../utils/voicePlaybackService';
import {
  Difficulty,
  ChallengeDifficulty,
  difficultyLevels,
  rhythmPatterns,
  generateChallenge,
  generateIntervalChallenge,
  melodies
} from '../data/tunerLevelsData';
import { VOCAL_THEORY_QUESTIONS, TheoryQuestion } from '../data/academyData';
import { usePitchDetection } from '../hooks/use-pitch-detection';
import { TunerRhythmView } from './TunerRhythmView';
import {
  X,
  Heart,
  Zap,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Drum,
  Music
} from 'lucide-react';

interface RecoveryExamModalProps {
  userStats: UserStats;
  onClose: () => void;
  onGainLife: () => void;
  zenMode?: boolean;
}

type StepType = 'pitch' | 'question' | 'rhythm';

interface StepConfig {
  id: number;
  type: StepType;
  title: string;
}

const TOTAL_STEPS = 7;

interface PitchChallenge {
  difficulty: ChallengeDifficulty;
  level: number;
  notes: NoteInfo[];
  subtitle: string;
  toleranceCents: number;
}

interface RhythmChallenge {
  difficulty: ChallengeDifficulty;
  level: number;
  bpm: number;
  pattern: { time: number; instrument: 'clap' | 'kick' }[];
}

function generateExamPitchChallenge(
  pool: NoteInfo[],
  preferredDiff?: ChallengeDifficulty
): PitchChallenge {
  const diffs: ChallengeDifficulty[] = ['Fácil', 'Medio', 'Difícil', 'Maestro'];
  const diff = preferredDiff || diffs[Math.floor(Math.random() * diffs.length)];

  let lvl = 1;
  if (diff === 'Fácil') lvl = Math.floor(Math.random() * 6) + 1; // 1 to 6
  else if (diff === 'Medio') lvl = Math.floor(Math.random() * 12) + 1; // 1 to 12
  else if (diff === 'Difícil') lvl = Math.floor(Math.random() * 12) + 1; // 1 to 12
  else lvl = Math.floor(Math.random() * 6) + 1; // 1 to 6

  let notes: NoteInfo[] = [];
  let subtitle = '';

  if (diff === 'Medio' && (lvl === 1 || lvl % 2 === 0)) {
    notes = generateIntervalChallenge(lvl, pool);
    subtitle = 'Arpegio / Intervalos';
  } else if (diff === 'Fácil' && (lvl === 4 || lvl === 6)) {
    const melodyKey = lvl === 4 ? 'twinkle' : 'maryHadALamb';
    const m = melodies[melodyKey] || melodies.twinkle;
    const baseMidi = pool[Math.floor(pool.length / 2)]?.midi || 60;
    notes = m.map(item => {
      const midi = baseMidi + (item.midi - 60);
      const name = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'][midi % 12];
      const letter = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
      const octave = Math.floor(midi / 12) - 1;
      const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
      return { name, letter, octave, frequency, fullName: `${name}${octave}`, midi };
    });
    subtitle = lvl === 4 ? 'Melodía: Estrellita' : 'Melodía: Mary Had A Lamb';
  } else {
    const count = diff === 'Maestro'
      ? [3, 4, 4, 5, 5, 6][lvl - 1] || 4
      : diff === 'Difícil'
        ? [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8][lvl - 1] || 4
        : difficultyLevels[diff][lvl - 1] || 4;
    notes = generateChallenge(count, pool);
    subtitle = `${notes.length} notas en escala`;
  }

  if (notes.length === 0) {
    notes = generateChallenge(3, pool);
    subtitle = '3 notas en escala';
  }

  const toleranceCents = diff === 'Maestro' ? 25 : diff === 'Difícil' ? 35 : 45;

  return {
    difficulty: diff,
    level: lvl,
    notes,
    subtitle,
    toleranceCents
  };
}

function generateExamRhythmChallenge(preferredModeGroup?: 'easy_medium' | 'hard_master'): RhythmChallenge {
  const diffs: { diff: ChallengeDifficulty; levels: number[] }[] = [
    { diff: 'Fácil', levels: [7, 8, 9, 10, 11, 12] },
    { diff: 'Medio', levels: [13, 14, 15, 16] },
    { diff: 'Difícil', levels: [17, 18, 19, 20] },
    { diff: 'Maestro', levels: [21, 22, 23, 24] }
  ];

  let selectedGroup = diffs;
  if (preferredModeGroup === 'easy_medium') {
    selectedGroup = [diffs[0], diffs[1]];
  } else if (preferredModeGroup === 'hard_master') {
    selectedGroup = [diffs[2], diffs[3]];
  }

  const randomGroup = selectedGroup[Math.floor(Math.random() * selectedGroup.length)];
  const randomLevel = randomGroup.levels[Math.floor(Math.random() * randomGroup.levels.length)];
  const pattern = rhythmPatterns[randomLevel] || rhythmPatterns[7];
  const bpm = 80 + (randomLevel - 7) * 10;

  return {
    difficulty: randomGroup.diff,
    level: randomLevel,
    bpm,
    pattern
  };
}

export const RecoveryExamModal: React.FC<RecoveryExamModalProps> = ({
  userStats,
  onClose,
  onGainLife,
  zenMode = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Step 1 to 7 sequence definition: Afinación -> Pregunta -> Ritmo -> Pregunta -> Afinación -> Pregunta -> Ritmo
  const stepsPlan: StepConfig[] = useMemo(() => [
    { id: 1, type: 'pitch', title: 'Afinación de Niveles' },
    { id: 2, type: 'question', title: 'Pregunta de Solfeo' },
    { id: 3, type: 'rhythm', title: 'Coordinación Rítmica de Niveles' },
    { id: 4, type: 'question', title: 'Pregunta de Técnica Vocal' },
    { id: 5, type: 'pitch', title: 'Afinación de Niveles' },
    { id: 6, type: 'question', title: 'Pregunta de Fisiología' },
    { id: 7, type: 'rhythm', title: 'Coordinación Rítmica Final' }
  ], []);

  // Adapt to user's vocal range pool & gender
  const gender = useMemo<'masculino' | 'femenino'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
    }
    return 'femenino';
  }, []);

  const userNotePool = useMemo(() => {
    return generateUserNotePool(userStats.vocalRangeData, gender);
  }, [userStats.vocalRangeData, gender]);

  // Preselected randomized content for this exam session across all 4 modes
  const examContent = useMemo(() => {
    // 3 Random theory questions without duplicates
    const shuffledQuestions = [...VOCAL_THEORY_QUESTIONS].sort(() => 0.5 - Math.random());
    const q1 = shuffledQuestions[0] || VOCAL_THEORY_QUESTIONS[0];
    const q2 = shuffledQuestions[1] || VOCAL_THEORY_QUESTIONS[1];
    const q3 = shuffledQuestions[2] || VOCAL_THEORY_QUESTIONS[2];

    // 2 Pitch challenges from any of the 4 modes
    const p1 = generateExamPitchChallenge(userNotePool, 'Fácil');
    const p2 = generateExamPitchChallenge(userNotePool, 'Medio');

    // 2 Rhythm challenges from any of the 4 modes (Fácil/Medio for Step 3, Difícil/Maestro for Step 7)
    const r1 = generateExamRhythmChallenge('easy_medium');
    const r2 = generateExamRhythmChallenge('hard_master');

    return {
      pitch1: p1,
      pitch2: p2,
      question1: q1,
      question2: q2,
      question3: q3,
      rhythm1: r1,
      rhythm2: r2
    };
  }, [userNotePool]);

  const currentStep = stepsPlan[currentStepIndex];

  // ─── Pitch Challenge Sub-State ─────────────────────────────────────
  const { isDetecting, frequency, rms, start, stop } = usePitchDetection();
  const activePitchChallenge: PitchChallenge =
    currentStepIndex === 0 ? examContent.pitch1 : examContent.pitch2;

  const [pitchNoteIndex, setPitchNoteIndex] = useState<number>(0);
  const [completedPitchNotes, setCompletedPitchNotes] = useState<Set<number>>(new Set());
  const [tugOfWarProgress, setTugOfWarProgress] = useState<number>(50);
  const [pitchStatusMsg, setPitchStatusMsg] = useState<string>('Canta en el micrófono para afinar');
  const [isNoteMatched, setIsNoteMatched] = useState<boolean>(false);

  const activeTargetNote = activePitchChallenge.notes[pitchNoteIndex] || activePitchChallenge.notes[0];

  // Reset pitch progress on step change
  useEffect(() => {
    setPitchNoteIndex(0);
    setCompletedPitchNotes(new Set());
    setTugOfWarProgress(50);
    setIsNoteMatched(false);
    setPitchStatusMsg('Canta en el micrófono para afinar');
  }, [currentStepIndex]);

  // Turn on/off mic based on current step
  useEffect(() => {
    if (currentStep.type === 'pitch' && !isDetecting && !isCompleted) {
      start();
    } else if (currentStep.type !== 'pitch' && isDetecting) {
      stop();
    }
    return () => {
      stop();
    };
  }, [currentStep.type, isCompleted, isDetecting, start, stop]);

  // Pitch matching loop with Tug-of-War bar
  useEffect(() => {
    if (currentStep.type !== 'pitch' || !isDetecting || isCompleted || !activeTargetNote) return;

    if (!frequency || rms < 0.012) {
      setIsNoteMatched(false);
      setPitchStatusMsg('Escuchando voz... Sostén la nota');
      return;
    }

    const cents = 1200 * Math.log2(frequency / activeTargetNote.frequency);
    const isClose = Math.abs(cents) <= activePitchChallenge.toleranceCents;
    setIsNoteMatched(isClose);

    if (isClose) {
      setPitchStatusMsg('¡Afinación Perfecta! Empujando al 100%');
      setTugOfWarProgress(prev => {
        const next = Math.min(100, prev + 3.2);
        if (next >= 100) {
          // Note completed!
          audioService.playSoftDing();
          audioService.vibrateSuccess();

          const nextIndex = pitchNoteIndex + 1;
          setCompletedPitchNotes(old => new Set(old).add(pitchNoteIndex));

          if (nextIndex < activePitchChallenge.notes.length) {
            setPitchNoteIndex(nextIndex);
            return 50;
          } else {
            // All notes in level completed!
            audioService.playSuccessBellSound();
            setTimeout(() => handleStepSuccess(), 450);
            return 100;
          }
        }
        return next;
      });
    } else {
      if (frequency < activeTargetNote.frequency) {
        setPitchStatusMsg('Muy grave ↑ Sube el tono');
      } else {
        setPitchStatusMsg('Muy agudo ↓ Baja el tono');
      }
      setTugOfWarProgress(prev => Math.max(15, prev - 1.1));
    }
  }, [frequency, rms, isDetecting, activeTargetNote, currentStep.type, isCompleted, activePitchChallenge, pitchNoteIndex]);

  // Play reference note
  const handlePlayReferenceNote = () => {
    audioService.playClickSound();
    voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
  };

  // ─── Question Sub-State ───────────────────────────────────────────
  const activeQuestion: TheoryQuestion =
    currentStepIndex === 1 ? examContent.question1 :
    currentStepIndex === 3 ? examContent.question2 : examContent.question3;

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const handleSelectAnswer = (idx: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(idx);
    setHasAnswered(true);

    if (idx === activeQuestion.correctAnswer) {
      audioService.playSoftDing();
      audioService.vibrate([30, 40]);
    } else {
      audioService.playHeartLostSound();
      audioService.vibrate([70, 50, 70]);
    }
  };

  // ─── Rhythm Sub-State ─────────────────────────────────────────────
  const activeRhythm: RhythmChallenge =
    currentStepIndex === 2 ? examContent.rhythm1 : examContent.rhythm2;

  // ─── Step Transition & Completion ──────────────────────────────────
  const handleStepSuccess = () => {
    stop();
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    if (currentStepIndex + 1 >= TOTAL_STEPS) {
      // Final Celebration!
      setIsCompleted(true);
      audioService.playBadgeUnlockedSound();
      audioService.playHeartGainedSound();
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.35 },
          colors: ['#ef4444', '#f43f5e', '#10b981', '#fbbf24']
        });
      } catch {}
    } else {
      // Advance to next step
      setCurrentStepIndex(prev => prev + 1);
      // Reset question sub-states
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  const handleFinalClaim = () => {
    audioService.playHeartGainedSound();
    onGainLife();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative border transition-all max-h-[94vh] overflow-y-auto cursor-default ${
          zenMode
            ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
            : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title and Step Progress */}
        <div className="pr-8 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4 fill-emerald-500" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Entrenamiento de Recuperación
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
              {isCompleted ? '¡Examen Completado!' : `Paso ${currentStepIndex + 1} de ${TOTAL_STEPS}: ${currentStep.title}`}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {completedSteps.size}/{TOTAL_STEPS}
            </span>
          </div>

          {/* 7-Step Progress Segment Bar */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {stepsPlan.map((s, idx) => {
              const isDone = completedSteps.has(idx);
              const isCurrent = currentStepIndex === idx && !isCompleted;
              return (
                <div
                  key={s.id}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : isCurrent
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  title={`Paso ${s.id}: ${s.title}`}
                />
              );
            })}
          </div>
        </div>

        {/* ─── Main Interactive Body ───────────────────────────────────── */}
        {!isCompleted ? (
          <div className="space-y-4">
            {/* 1. AFINACIÓN STEP (Copiado de los niveles de afinación de los 4 modos) */}
            {currentStep.type === 'pitch' && (
              <div className="space-y-4 text-center py-1">
                {/* Level and Mode Header Badge */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      activePitchChallenge.difficulty === 'Fácil'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : activePitchChallenge.difficulty === 'Medio'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : activePitchChallenge.difficulty === 'Difícil'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    }`}>
                      Modo {activePitchChallenge.difficulty} • Nivel {activePitchChallenge.level}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {activePitchChallenge.subtitle}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Nota {pitchNoteIndex + 1} de {activePitchChallenge.notes.length}
                  </span>
                </div>

                {/* Notes Sequence Strip */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap py-1">
                  {activePitchChallenge.notes.map((n, idx) => {
                    const isDone = completedPitchNotes.has(idx);
                    const isCurrent = idx === pitchNoteIndex;
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/50'
                            : isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-105 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{n.fullName || n.name}</span>
                        {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>

                {/* Target Note Display Box */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1.5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Nota a Entonar
                  </div>
                  <div className="text-4xl font-heading font-black text-[#0b1c30] dark:text-[#d3e4fe]">
                    {activeTargetNote.fullName || activeTargetNote.name}
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    Frecuencia: {activeTargetNote.frequency} Hz
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 pt-1">
                    {pitchStatusMsg}
                  </p>
                </div>

                {/* Audio reference & mic buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handlePlayReferenceNote}
                    className="py-2.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Escuchar Tono</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isDetecting) stop();
                      else start();
                    }}
                    className={`py-2.5 px-4 rounded-full font-heading font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${
                      isDetecting
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isDetecting ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    <span>{isDetecting ? 'Micrófono Activo' : 'Activar Micrófono'}</span>
                  </button>
                </div>

                {/* Tug-of-War Precision Gauge Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold px-1 text-slate-500 dark:text-slate-400">
                    <span>Fuerza de Afinación (Tug-of-War)</span>
                    <span className={tugOfWarProgress >= 90 ? 'text-emerald-500 font-extrabold' : ''}>
                      {Math.round(tugOfWarProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative shadow-inner">
                    {/* Center 50% marker */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400/40 z-10" />
                    <div
                      className={`h-full transition-all duration-150 rounded-full ${
                        tugOfWarProgress >= 80
                          ? 'bg-gradient-to-r from-teal-400 to-emerald-500'
                          : tugOfWarProgress >= 45
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                      style={{ width: `${tugOfWarProgress}%` }}
                    />
                  </div>
                  {frequency > 0 && isDetecting && (
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                      Voz detectada: {Math.round(frequency)} Hz
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PREGUNTA STEP (Pregunta teórica con opciones) */}
            {currentStep.type === 'question' && (
              <div className="space-y-4 py-1">
                <div className="p-4 rounded-2xl bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200/80 dark:border-slate-800">
                  <h4 className="font-heading font-bold text-sm sm:text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                    {activeQuestion.question}
                  </h4>
                </div>

                <div className="space-y-2">
                  {activeQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === activeQuestion.correctAnswer;
                    const showSuccess = hasAnswered && isCorrect;
                    const showError = hasAnswered && isSelected && !isCorrect;

                    return (
                      <button
                        key={idx}
                        disabled={hasAnswered}
                        onClick={() => handleSelectAnswer(idx)}
                        className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-medium border transition-all flex items-start gap-3 cursor-pointer ${
                          showSuccess
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                            : showError
                              ? 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200'
                              : isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                                : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          showSuccess
                            ? 'bg-emerald-500 text-white'
                            : showError
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-snug">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation and Next Button */}
                {hasAnswered && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <div className={`p-3 rounded-2xl border text-xs ${
                      selectedAnswer === activeQuestion.correctAnswer
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}>
                      <span className="font-bold block mb-0.5">
                        {selectedAnswer === activeQuestion.correctAnswer ? '¡Correcto!' : 'Respuesta incorrecta'}
                      </span>
                      <span>{activeQuestion.explanation}</span>
                    </div>

                    {selectedAnswer === activeQuestion.correctAnswer ? (
                      <button
                        onClick={handleStepSuccess}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Avanzar al siguiente paso</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAnswer(null);
                          setHasAnswered(false);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Intentar de nuevo esta pregunta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. RITMO STEP (Copiado directamente de los niveles de ritmo con TunerRhythmView) */}
            {currentStep.type === 'rhythm' && (
              <div className="space-y-3 py-1">
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    activeRhythm.difficulty === 'Fácil'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : activeRhythm.difficulty === 'Medio'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                        : activeRhythm.difficulty === 'Difícil'
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}>
                    Modo {activeRhythm.difficulty} • Nivel {activeRhythm.level}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Alcanza $\ge 80\%$ de precisión
                  </span>
                </div>

                {/* TunerRhythmView Component integrado de forma limpia */}
                <TunerRhythmView
                  key={`exam-rhythm-${currentStepIndex}-${activeRhythm.level}`}
                  level={activeRhythm.level}
                  pattern={activeRhythm.pattern}
                  bpm={activeRhythm.bpm}
                  hideExitButton={true}
                  onSuccess={(score) => {
                    if (score >= 80) {
                      audioService.playSuccessBellSound();
                      handleStepSuccess();
                    }
                  }}
                  onFail={() => {}}
                  onExit={() => {}}
                />
              </div>
            )}
          </div>
        ) : (
          /* ─── Final Celebratory Screen ─────────────────────────────── */
          <div className="py-6 text-center space-y-4 animate-fadeIn">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xl">
                <Heart className="w-10 h-10 fill-white text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                ¡Misión Cumplida!
              </span>
              <h3 className="text-2xl font-heading font-black text-[#0b1c30] dark:text-[#d3e4fe]">
                ¡Has recuperado 1 vida!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Completaste los 7 pasos de afinación, ritmo y teoría de los modos. Tu corazón ha sido restaurado sin costo de XP.
              </p>
            </div>

            <button
              onClick={handleFinalClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-sm shadow-xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Reclamar Vida y Continuar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryExamModal;
