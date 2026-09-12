'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { voicePlayback, NoteInfo } from '../utils/voicePlaybackService';
import { rhythmPatterns } from '../data/tunerLevelsData';
import { VOCAL_THEORY_QUESTIONS, TheoryQuestion } from '../data/academyData';
import { usePitchDetection } from '../hooks/use-pitch-detection';
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
  Award
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

// Central comfortable notes for pitch matching
const RECOVERY_TUNING_NOTES = [
  { name: 'DO', octave: 4, frequency: 261.63, label: 'Do4 (261.6 Hz)' },
  { name: 'RE', octave: 4, frequency: 293.66, label: 'Re4 (293.7 Hz)' },
  { name: 'MI', octave: 4, frequency: 329.63, label: 'Mi4 (329.6 Hz)' },
  { name: 'FA', octave: 4, frequency: 349.23, label: 'Fa4 (349.2 Hz)' },
  { name: 'SOL', octave: 4, frequency: 392.00, label: 'Sol4 (392.0 Hz)' },
  { name: 'LA', octave: 4, frequency: 440.00, label: 'La4 (440.0 Hz)' }
];

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
    { id: 1, type: 'pitch', title: 'Afinación de Precisión' },
    { id: 2, type: 'question', title: 'Pregunta de Solfeo' },
    { id: 3, type: 'rhythm', title: 'Coordinación Rítmica' },
    { id: 4, type: 'question', title: 'Pregunta de Técnica Vocal' },
    { id: 5, type: 'pitch', title: 'Afinación de Precisión' },
    { id: 6, type: 'question', title: 'Pregunta de Fisiología' },
    { id: 7, type: 'rhythm', title: 'Coordinación Rítmica Final' }
  ], []);

  // Preselected randomized content for this exam session
  const examContent = useMemo(() => {
    // 3 Random questions without duplicates
    const shuffledQuestions = [...VOCAL_THEORY_QUESTIONS].sort(() => 0.5 - Math.random());
    const q1 = shuffledQuestions[0] || VOCAL_THEORY_QUESTIONS[0];
    const q2 = shuffledQuestions[1] || VOCAL_THEORY_QUESTIONS[1];
    const q3 = shuffledQuestions[2] || VOCAL_THEORY_QUESTIONS[2];

    // 2 Random pitch targets
    const shuffledNotes = [...RECOVERY_TUNING_NOTES].sort(() => 0.5 - Math.random());
    const n1 = shuffledNotes[0];
    const n2 = shuffledNotes[1] || shuffledNotes[0];

    // 2 Random rhythm patterns (levels 7 to 12)
    const rhythmKeys = [7, 8, 9, 10, 11, 12];
    const r1Key = rhythmKeys[Math.floor(Math.random() * rhythmKeys.length)];
    const r2Key = rhythmKeys[(Math.floor(Math.random() * rhythmKeys.length) + 1) % rhythmKeys.length];

    return {
      note1: n1,
      note2: n2,
      question1: q1,
      question2: q2,
      question3: q3,
      rhythm1: { key: r1Key, pattern: rhythmPatterns[r1Key] || rhythmPatterns[7] },
      rhythm2: { key: r2Key, pattern: rhythmPatterns[r2Key] || rhythmPatterns[8] }
    };
  }, []);

  const currentStep = stepsPlan[currentStepIndex];

  // ─── Pitch Matching Sub-State ──────────────────────────────────────
  const { isDetecting, frequency, rms, start, stop } = usePitchDetection();
  const [pitchProgress, setPitchProgress] = useState<number>(0);
  const targetNote = currentStepIndex === 0 ? examContent.note1 : examContent.note2;
  const inTuneRef = useRef<number | null>(null);

  // Stop mic when leaving pitch steps or closing
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Pitch matching detection loop
  useEffect(() => {
    if (currentStep.type !== 'pitch' || !isDetecting || isCompleted) return;

    if (!frequency || rms < 0.015) {
      inTuneRef.current = null;
      setPitchProgress(prev => Math.max(0, prev - 3));
      return;
    }

    const cents = 1200 * Math.log2(frequency / targetNote.frequency);
    const isClose = Math.abs(cents) <= 45; // 45 cents tolerance

    if (isClose) {
      if (!inTuneRef.current) inTuneRef.current = Date.now();
      const elapsed = Date.now() - inTuneRef.current;
      const progress = Math.min(100, Math.floor((elapsed / 1200) * 100));
      setPitchProgress(progress);

      if (progress >= 100) {
        audioService.playSuccessBellSound();
        handleStepSuccess();
      }
    } else {
      inTuneRef.current = null;
      setPitchProgress(prev => Math.max(0, prev - 4));
    }
  }, [frequency, rms, isDetecting, targetNote, currentStep.type, isCompleted]);

  // Play reference note
  const handlePlayReferenceNote = () => {
    audioService.playClickSound();
    voicePlayback.playVoiceNote({ frequency: targetNote.frequency, name: targetNote.name, octave: targetNote.octave }, 'femenino', 2.0);
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
  const activeRhythm = currentStepIndex === 2 ? examContent.rhythm1 : examContent.rhythm2;
  const [rhythmPhase, setRhythmPhase] = useState<'intro' | 'listening' | 'tapping' | 'evaluating'>('intro');
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [rhythmScore, setRhythmScore] = useState<number | null>(null);
  const rhythmStartTimeRef = useRef<number>(0);
  const rhythmTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearRhythmTimeouts = () => {
    rhythmTimeoutsRef.current.forEach(clearTimeout);
    rhythmTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearRhythmTimeouts();
  }, []);

  const handleStartRhythmDemo = () => {
    clearRhythmTimeouts();
    setRhythmPhase('listening');
    audioService.playClickSound();

    const pattern = activeRhythm.pattern;
    const maxDuration = pattern[pattern.length - 1]?.time + 1200 || 3000;

    pattern.forEach(p => {
      const t = setTimeout(() => {
        if (p.instrument === 'kick') {
          voicePlayback.playKick();
        } else {
          voicePlayback.playClap();
        }
      }, p.time);
      rhythmTimeoutsRef.current.push(t);
    });

    const endTimer = setTimeout(() => {
      setRhythmPhase('tapping');
      setUserTaps([]);
      rhythmStartTimeRef.current = Date.now();
    }, maxDuration);
    rhythmTimeoutsRef.current.push(endTimer);
  };

  const handleUserTap = () => {
    audioService.vibrate(12);
    voicePlayback.playMetronomeTick();
    const tapOffset = Date.now() - rhythmStartTimeRef.current;
    const nextTaps = [...userTaps, tapOffset];
    setUserTaps(nextTaps);

    const pattern = activeRhythm.pattern;
    if (nextTaps.length >= pattern.length) {
      // Evaluate accuracy
      let matches = 0;
      pattern.forEach((expected, i) => {
        const actual = nextTaps[i];
        if (actual !== undefined && Math.abs(actual - expected.time) <= 350) {
          matches++;
        }
      });

      const accuracy = Math.round((matches / pattern.length) * 100);
      setRhythmScore(accuracy);
      setRhythmPhase('evaluating');

      if (accuracy >= 65) {
        audioService.playSuccessBellSound();
      } else {
        audioService.playRetrySound();
      }
    }
  };

  // ─── Step Transition & Completion ──────────────────────────────────
  const handleStepSuccess = () => {
    stop();
    clearRhythmTimeouts();
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
      // Reset step sub-states
      setPitchProgress(0);
      inTuneRef.current = null;
      setSelectedAnswer(null);
      setHasAnswered(false);
      setRhythmPhase('intro');
      setUserTaps([]);
      setRhythmScore(null);
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
        className={`rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-5 shadow-2xl relative border transition-all max-h-[92vh] overflow-y-auto cursor-default ${
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
            {/* 1. AFINACIÓN STEP */}
            {currentStep.type === 'pitch' && (
              <div className="space-y-4 text-center py-2">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Canta y sostén la nota objetivo
                  </div>
                  <div className="text-3xl font-heading font-black text-[#0b1c30] dark:text-[#d3e4fe]">
                    {targetNote.label}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Escucha el tono de referencia y sostén la afinación durante 1.2 segundos.
                  </p>
                </div>

                {/* Audio reference playback button */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handlePlayReferenceNote}
                    className="py-2.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Escuchar Nota</span>
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

                {/* Precision Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold px-1 text-slate-500 dark:text-slate-400">
                    <span>Progreso de Afinación</span>
                    <span>{pitchProgress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150 rounded-full"
                      style={{ width: `${pitchProgress}%` }}
                    />
                  </div>
                  {frequency > 0 && isDetecting && (
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                      Detectado: {Math.round(frequency)} Hz
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PREGUNTA STEP */}
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

            {/* 3. RITMO STEP */}
            {currentStep.type === 'rhythm' && (
              <div className="space-y-4 text-center py-2">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Patrón Rítmico #{activeRhythm.key}
                  </div>
                  <div className="font-heading font-black text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                    Escucha el compás y pulsa al ritmo
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rhythmPhase === 'intro' && 'Presiona "Escuchar Patrón" para oír la demostración.'}
                    {rhythmPhase === 'listening' && 'Escuchando el pulso... Prepárate para tocar.'}
                    {rhythmPhase === 'tapping' && `¡Toca el botón ${activeRhythm.pattern.length} veces siguiendo el tiempo!`}
                    {rhythmPhase === 'evaluating' && `Precisión obtenida: ${rhythmScore}%`}
                  </p>
                </div>

                {rhythmPhase === 'intro' && (
                  <button
                    onClick={handleStartRhythmDemo}
                    className="py-3 px-5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-heading font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Drum className="w-4 h-4" />
                    <span>Escuchar Patrón</span>
                  </button>
                )}

                {rhythmPhase === 'listening' && (
                  <div className="py-6 flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center animate-ping">
                      <Volume2 className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {rhythmPhase === 'tapping' && (
                  <div className="py-4 space-y-3">
                    <button
                      onClick={handleUserTap}
                      className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-heading font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all mx-auto flex flex-col items-center justify-center cursor-pointer border-4 border-white dark:border-slate-800"
                    >
                      <Drum className="w-6 h-6 mb-1" />
                      <span>¡TOCA!</span>
                    </button>
                    <div className="text-xs font-bold text-slate-400">
                      Pulsos registrados: {userTaps.length} de {activeRhythm.pattern.length}
                    </div>
                  </div>
                )}

                {rhythmPhase === 'evaluating' && rhythmScore !== null && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <div className={`p-3 rounded-2xl border text-xs ${
                      rhythmScore >= 65
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}>
                      <span className="font-bold block mb-0.5">
                        {rhythmScore >= 65 ? '¡Excelente precisión rítmica!' : 'Ritmo fuera de tiempo'}
                      </span>
                      <span>
                        {rhythmScore >= 65
                          ? `Lograste un ${rhythmScore}% de acierto sobre el patrón temporal.`
                          : `Obtuviste un ${rhythmScore}%. Necesitas al menos 65% para aprobar este paso.`}
                      </span>
                    </div>

                    {rhythmScore >= 65 ? (
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
                          setRhythmPhase('intro');
                          setUserTaps([]);
                          setRhythmScore(null);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reintentar ejercicio rítmico</span>
                      </button>
                    )}
                  </div>
                )}
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
                Completaste los 7 pasos de afinación, ritmo y teoría. Tu corazón ha sido restaurado sin costo de XP.
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
