'use client';

import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { generateUserNotePool, NoteInfo } from '../utils/voicePlaybackService';
import {
  ChallengeDifficulty,
  rhythmPatterns,
  generateChallenge,
  melodies
} from '../data/tunerLevelsData';
import { VOCAL_THEORY_QUESTIONS, TheoryQuestion } from '../data/academyData';
import { TunerPitchChallengeView } from './TunerPitchChallengeView';
import { TunerRhythmView } from './TunerRhythmView';
import {
  X,
  Heart,
  Zap,
  ArrowRight,
  RotateCcw
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

/**
 * Generates specifically level 4, 5, or 6 of Modo Fácil
 */
function getFacilPitchLevel(lvl: 4 | 5 | 6, pool: NoteInfo[]): PitchChallenge {
  let notes: NoteInfo[] = [];
  let subtitle = '';

  if (lvl === 4) {
    // Modo Fácil • Nivel 4: Melodía Estrellita (Twinkle)
    const m = melodies.twinkle;
    const baseMidi = pool[Math.floor(pool.length / 2)]?.midi || 60;
    notes = m.map(item => {
      const midi = baseMidi + (item.midi - 60);
      const name = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'][midi % 12];
      const letter = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
      const octave = Math.floor(midi / 12) - 1;
      const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
      return { name, letter, octave, frequency, fullName: `${name}${octave}`, midi };
    });
    subtitle = 'Melodía: Estrellita';
  } else if (lvl === 5) {
    // Modo Fácil • Nivel 5: Reto de 5 notas en escala
    notes = generateChallenge(5, pool);
    subtitle = 'Escala de 5 Notas';
  } else {
    // Modo Fácil • Nivel 6: Melodía Mary Had a Little Lamb
    const m = melodies.maryHadALamb;
    const baseMidi = pool[Math.floor(pool.length / 2)]?.midi || 60;
    notes = m.map(item => {
      const midi = baseMidi + (item.midi - 60);
      const name = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'][midi % 12];
      const letter = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
      const octave = Math.floor(midi / 12) - 1;
      const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
      return { name, letter, octave, frequency, fullName: `${name}${octave}`, midi };
    });
    subtitle = 'Melodía: Mary Had A Lamb';
  }

  if (notes.length === 0) {
    notes = generateChallenge(3, pool);
    subtitle = '3 notas en escala';
  }

  return {
    difficulty: 'Fácil',
    level: lvl,
    notes,
    subtitle,
    toleranceCents: 45
  };
}

/**
 * Generates a rhythm challenge from Modo Fácil (levels 7 to 12)
 */
function getFacilRhythmChallenge(preferredLevel?: number): RhythmChallenge {
  const rhythmLevels = [7, 8, 9, 10, 11, 12];
  const level = preferredLevel ?? rhythmLevels[Math.floor(Math.random() * rhythmLevels.length)];
  const pattern = rhythmPatterns[level] || rhythmPatterns[7];
  const bpm = 80 + (level - 7) * 10;

  return {
    difficulty: 'Fácil',
    level,
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

  // 7-Step Plan: afinación, pregunta, ritmo, pregunta, afinación, pregunta, ritmo
  const stepsPlan: StepConfig[] = useMemo(() => [
    { id: 1, type: 'pitch', title: 'Afinación • Modo Fácil (Estrellita)' },
    { id: 2, type: 'question', title: 'Pregunta de Solfeo y Lectura' },
    { id: 3, type: 'rhythm', title: 'Ritmo • Coordinación Rítmica 1' },
    { id: 4, type: 'question', title: 'Pregunta de Técnica Vocal' },
    { id: 5, type: 'pitch', title: 'Afinación • Modo Fácil (Mary Had A Lamb)' },
    { id: 6, type: 'question', title: 'Pregunta de Fisiología y Salud' },
    { id: 7, type: 'rhythm', title: 'Ritmo • Coordinación Rítmica Final' }
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

  // Content for this exam session: 2 pitch (niveles 4 y 6), 3 questions, 2 rhythm
  const examContent = useMemo(() => {
    // 3 Random theory questions without duplicates
    const shuffledQuestions = [...VOCAL_THEORY_QUESTIONS].sort(() => 0.5 - Math.random());
    const q1 = shuffledQuestions[0] || VOCAL_THEORY_QUESTIONS[0];
    const q2 = shuffledQuestions[1] || VOCAL_THEORY_QUESTIONS[1];
    const q3 = shuffledQuestions[2] || VOCAL_THEORY_QUESTIONS[2];

    // Pitch moments: Paso 1 (Nivel 4 Estrellita) y Paso 5 (Nivel 6 Mary Had A Lamb)
    const p1 = getFacilPitchLevel(4, userNotePool);
    const p2 = getFacilPitchLevel(6, userNotePool);

    // Rhythm moments: Paso 3 (Rhythm 1) y Paso 7 (Rhythm 2)
    const rhythmLevels = [7, 8, 9, 10, 11, 12].sort(() => 0.5 - Math.random());
    const r1 = getFacilRhythmChallenge(rhythmLevels[0] || 7);
    const r2 = getFacilRhythmChallenge(rhythmLevels[1] || 10);

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

  // Active pitch challenge based on step index (Step 1 is index 0, Step 5 is index 4)
  const activePitchChallenge: PitchChallenge =
    currentStepIndex === 0 ? examContent.pitch1 : examContent.pitch2;

  // Active rhythm challenge based on step index (Step 3 is index 2, Step 7 is index 6)
  const activeRhythmChallenge: RhythmChallenge =
    currentStepIndex === 2 ? examContent.rhythm1 : examContent.rhythm2;

  // ─── Question Sub-State ───────────────────────────────────────────
  // Active question based on step index (Step 2 is index 1, Step 4 is index 3, Step 6 is index 5)
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

  // ─── Step Transition & Completion ──────────────────────────────────
  const handleStepSuccess = () => {
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-3.5 shadow-2xl relative border transition-all max-h-[96vh] overflow-y-auto cursor-default ${
          zenMode
            ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
            : 'bg-[#f8f9ff] dark:bg-[#071322] border-slate-100 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title and Step Progress */}
        <div className="pr-8 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-3.5 h-3.5 fill-emerald-500" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Entrenamiento de Recuperación
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-base sm:text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
              {isCompleted ? '¡Examen Completado!' : `Paso ${currentStepIndex + 1} de ${TOTAL_STEPS}: ${currentStep.title}`}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {completedSteps.size}/{TOTAL_STEPS}
            </span>
          </div>

          {/* 7-Step Progress Segment Bar */}
          <div className="grid grid-cols-7 gap-1.5 pt-0.5">
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
          <div className="space-y-3">
            {/* 1. AFINACIÓN STEP: Exact Tuner View with Sphere, AudioParticleCanvas, Tug-of-War and Teclado Vocal */}
            {currentStep.type === 'pitch' && (
              <TunerPitchChallengeView
                key={`pitch-step-${currentStepIndex}-${activePitchChallenge.level}`}
                difficultyLabel="Fácil"
                levelNumber={activePitchChallenge.level}
                subtitle={activePitchChallenge.subtitle}
                notes={activePitchChallenge.notes}
                toleranceCents={activePitchChallenge.toleranceCents}
                gender={gender}
                vocalRangeData={userStats.vocalRangeData}
                zenMode={zenMode}
                onSuccess={() => {
                  handleStepSuccess();
                }}
              />
            )}

            {/* 2. PREGUNTA STEP */}
            {currentStep.type === 'question' && (
              <div className="space-y-3.5 py-1">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-slate-800 shadow-xs">
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
                                : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 shadow-2xs'
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
                  <div className="space-y-3 pt-1 animate-fadeIn">
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
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Intentar de nuevo esta pregunta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. RITMO STEP: Exact TunerRhythmView Component */}
            {currentStep.type === 'rhythm' && (
              <div className="space-y-2.5 py-1">
                <TunerRhythmView
                  key={`exam-rhythm-${currentStepIndex}-${activeRhythmChallenge.level}`}
                  level={activeRhythmChallenge.level}
                  pattern={activeRhythmChallenge.pattern}
                  bpm={activeRhythmChallenge.bpm}
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
                Superaste los niveles 4, 5 y 6 del Modo Fácil, las preguntas teóricas y el examen rítmico. Tu corazón ha sido restaurado sin costo de XP.
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
