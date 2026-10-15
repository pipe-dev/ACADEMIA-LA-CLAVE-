'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audioService';
import { VocalRangeModal } from './VocalRangeModal';
import { TunerPitchChallengeView } from './TunerPitchChallengeView';
import { TunerRhythmView } from './TunerRhythmView';
import { generateUserNotePool } from '../utils/voicePlaybackService';
import { generateChallenge, rhythmPatterns } from '../data/tunerLevelsData';
import {
  LessonModalProps,
  CLASS_1_QUIZ_QUESTIONS,
  UNIT_1_EXAM_QUESTIONS,
  UNIT_4_EXAM_QUESTIONS
} from './lesson-modal/lessonModalTypes';
import { LessonVideoPlayer, unlockOrientation } from './lesson-modal/LessonVideoPlayer';
import { BalloonExerciseView } from './lesson-modal/BalloonExerciseView';
import { StarResultsView } from './lesson-modal/StarResultsView';
import { QuizQuestionsView } from './lesson-modal/QuizQuestionsView';
import { LessonSuccessView } from './lesson-modal/LessonSuccessView';
import { ExitConfirmModal } from './lesson-modal/ExitConfirmModal';
import { X, Wind, Sparkles, Trophy, Drum, Mic } from 'lucide-react';

export const LessonModal: React.FC<LessonModalProps> = ({
  node,
  userStats,
  onClose,
  onCompleteNode,
  onOpenUnitCelebration,
  onLoseLife,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  const [step, setStep] = useState<'intro' | 'video' | 'practice' | 'vocal_diagnostic' | 'success'>(() => {
    return node.type === 'control' ? 'practice' : 'intro';
  });

  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const userRequestedPlayRef = useRef<boolean>(false);

  // Exam detection
  const isUnit2Exam =
    node.id === 'u2-node20.5' ||
    (node.unitId === 2 && (node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'))));
  const isUnit3Exam =
    node.id === 'u3-node28.5' ||
    (node.unitId === 3 && (node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'))));
  const isExamNode =
    !isUnit2Exam &&
    !isUnit3Exam &&
    (node.type === 'exam' || node.id === 'u1-node12.5' || Boolean(node.title?.toLowerCase().includes('evaluaci')));
  const isUnit4Exam =
    node.id === 'u4-node33.5' ||
    (node.unitId === 4 && (node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'))));
  const isAnyEvaluationNode = node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'));
  const activeQuestions = isExamNode
    ? isUnit4Exam
      ? UNIT_4_EXAM_QUESTIONS
      : UNIT_1_EXAM_QUESTIONS
    : CLASS_1_QUIZ_QUESTIONS;

  // Unit 2 Exam State
  const gender = useMemo<'masculino' | 'femenino'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
    }
    return 'femenino';
  }, []);

  const userNotePool = useMemo(() => {
    return generateUserNotePool(userStats?.vocalRangeData, gender);
  }, [userStats?.vocalRangeData, gender]);

  const unit2ExamNotes = useMemo(() => {
    const pool = userNotePool.length > 0 ? userNotePool : generateUserNotePool(undefined, gender);
    const challenge = generateChallenge(3, pool);
    return challenge.length > 0 ? challenge : pool.slice(0, 3);
  }, [userNotePool, gender]);

  // Unit 3 Exam State
  const UNIT_3_EXAM_LEVELS = [9, 10, 11, 12] as const;
  const [unit3ExamLevelIndex, setUnit3ExamLevelIndex] = useState<number>(0);
  const currentUnit3Level = UNIT_3_EXAM_LEVELS[unit3ExamLevelIndex] ?? 9;
  const currentUnit3Pattern = rhythmPatterns[currentUnit3Level] || rhythmPatterns[9];
  const currentUnit3Bpm = 80 + (currentUnit3Level - 7) * 10;

  // Quiz / Exam State Triggers
  const [examStage, setExamStage] = useState<'questions_part1' | 'balloon' | 'questions_part2'>('questions_part1');
  const [quizQuestionIdx, setQuizQuestionIdx] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(() => new Array(activeQuestions.length).fill(null));
  const [quizResolved, setQuizResolved] = useState<boolean>(false);
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  useEffect(() => {
    audioService.playOpenSound();
  }, []);

  // Fullscreen change listener to unlock orientation on exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        unlockOrientation();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleAttemptClose = () => {
    userRequestedPlayRef.current = false;
    audioService.playCloseSound();
    unlockOrientation();
    onClose();
  };

  const triggerStarRatingResults = useCallback((score: number) => {
    setQuizScore(score);
    setShowQuizResults(true);
  }, []);

  const handleUnit2ExamSuccess = useCallback(() => {
    audioService.playBadgeUnlockedSound();
    audioService.playSuccessBellSound();
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
    triggerStarRatingResults(4);
  }, [triggerStarRatingResults]);

  const handleUnit3ExamSuccess = useCallback(() => {
    audioService.playBadgeUnlockedSound();
    audioService.playSuccessBellSound();
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
    triggerStarRatingResults(4);
  }, [triggerStarRatingResults]);

  const handleUnit3RhythmStepSuccess = useCallback(() => {
    if (unit3ExamLevelIndex < UNIT_3_EXAM_LEVELS.length - 1) {
      audioService.playSuccessBellSound();
      try {
        confetti({ particleCount: 45, spread: 50, origin: { y: 0.6 } });
      } catch {}
      setUnit3ExamLevelIndex((prev) => prev + 1);
    } else {
      handleUnit3ExamSuccess();
    }
  }, [unit3ExamLevelIndex, handleUnit3ExamSuccess]);

  const handleSelectAnswer = (questionIdx: number, optIdx: number) => {
    audioService.playClickSound();
    const updated = [...quizAnswers];
    updated[questionIdx] = optIdx;
    setQuizAnswers(updated);
  };

  const handleNextQuizQuestion = () => {
    audioService.playClickSound();

    if (isExamNode && !isUnit4Exam && quizQuestionIdx === 3 && examStage === 'questions_part1') {
      setExamStage('balloon');
      return;
    }

    if (quizQuestionIdx < activeQuestions.length - 1) {
      setQuizQuestionIdx((prev) => prev + 1);
    } else {
      const score = quizAnswers.reduce<number>((acc, ans, idx) => {
        if (ans === activeQuestions[idx]?.correctAnswer) return acc + 1;
        return acc;
      }, 0);

      const normalizedScore = isUnit4Exam
        ? score >= 5 ? 4 : score >= 4 ? 3 : score >= 3 ? 2 : 0
        : isExamNode
        ? score >= 6 ? 4 : score >= 4 ? 3 : score >= 2 ? 2 : 0
        : score;

      triggerStarRatingResults(normalizedScore);
    }
  };

  const handleClaimLesson = () => {
    audioService.playClickSound();
    unlockOrientation();
    onCompleteNode(node.id, node.xpReward);
    onClose();
  };

  return (
    <>
      {/* 1. Pre-mounted YouTube Video Player */}
      <LessonVideoPlayer
        node={node}
        step={step}
        quizResolved={quizResolved}
        userRequestedPlayRef={userRequestedPlayRef}
        onClose={onClose}
        onCompleteNode={onCompleteNode}
        onTransitionToQuiz={() => setStep('practice')}
        onTransitionToVocalDiagnostic={() => setStep('vocal_diagnostic')}
      />

      {/* 2. Standard Dialog Card (When step !== 'video') */}
      {step !== 'video' && (
        <div
          className={`fixed inset-0 z-50 p-4 bg-black/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto ${
            isAnyEvaluationNode ? 'cursor-default' : 'cursor-pointer'
          } animate-fadeIn`}
          onClick={isAnyEvaluationNode ? undefined : handleAttemptClose}
        >
          <div
            className={`bg-white dark:bg-[#102034] rounded-3xl ${
              (isUnit2Exam || isUnit3Exam) && step === 'practice' && !showQuizResults
                ? 'p-3.5 sm:p-5 max-w-md'
                : 'p-6 max-w-sm'
            } w-full space-y-5 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] cursor-default my-auto transition-all duration-300 max-h-[96vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleAttemptClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Top Header Bar */}
            {step !== 'vocal_diagnostic' &&
              ((!isUnit2Exam && !isUnit3Exam) || step !== 'practice' || showQuizResults) && (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl ${
                      isUnit2Exam || isUnit3Exam
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500'
                        : 'bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff]'
                    } flex items-center justify-center`}
                  >
                    {isUnit2Exam || isUnit3Exam ? (
                      <Trophy className="w-6 h-6 text-amber-500" />
                    ) : node.iconName === 'Drum' || node.unitId === 3 ? (
                      <Drum className="w-6 h-6" />
                    ) : node.iconName === 'Wind' || node.type === 'control' ? (
                      <Wind className="w-6 h-6" />
                    ) : node.iconName === 'Mic' || node.iconName === 'Mic2' ? (
                      <Mic className="w-6 h-6" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[11px] font-extrabold ${
                        isUnit2Exam || isUnit3Exam || isUnit4Exam
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[#4648d4] dark:text-[#c0c1ff]'
                      } uppercase tracking-wider`}
                    >
                      {isUnit4Exam
                        ? 'Evaluación del Módulo 4'
                        : isUnit2Exam || isUnit3Exam
                        ? 'Evaluación de Módulo'
                        : node.type === 'concept'
                        ? 'Lección Teórica'
                        : 'Lección Práctica'}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
                      {node.title}
                    </h3>
                  </div>
                </div>
              )}

            {/* Step: Intro */}
            {step === 'intro' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-[#c6c5d7] leading-relaxed bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  {isUnit3Exam
                    ? '¡Bienvenido a la Evaluación Práctica del Módulo 3! Pondrás a prueba tu tempo, coordinación y oído rítmico a través de 4 rondas progresivas (Nivel 9 al 12 del Modo Fácil, de 100 a 130 BPM). Sigue el pulso del metrónomo y pulsa Bombo y Palmas con precisión.'
                    : node.instructions ||
                      'Sigue las instrucciones para dominar el control diafragmático y mejorar tu tono vocal.'}
                </p>

                <button
                  onClick={() => {
                    audioService.playClickSound();
                    if (node.youtubeId) {
                      userRequestedPlayRef.current = true;
                      try {
                        const el = document.documentElement;
                        if (el.requestFullscreen) {
                          el.requestFullscreen().catch(() => {});
                        } else if ((el as any).webkitRequestFullscreen) {
                          (el as any).webkitRequestFullscreen();
                        }
                      } catch {}

                      try {
                        if (window.screen?.orientation && (window.screen.orientation as any).lock) {
                          (window.screen.orientation as any).lock('landscape').catch(() => {});
                        }
                      } catch {}

                      setStep('video');
                    } else {
                      setStep('practice');
                    }
                  }}
                  className="w-full py-3.5 rounded-full tactile-btn-primary font-heading font-bold text-sm cursor-pointer shadow-md"
                >
                  Comenzar Ejercicio
                </button>
              </div>
            )}

            {/* Step: Vocal Diagnostic Tool */}
            {step === 'vocal_diagnostic' && (
              <div className="py-2 animate-fadeIn">
                <VocalRangeModal
                  isOpen={true}
                  isEmbeddedView={true}
                  onClose={() => {
                    unlockOrientation();
                    onClose();
                  }}
                  onSaveRange={() => {
                    unlockOrientation();
                    onCompleteNode(node.id, node.xpReward);
                    triggerStarRatingResults(4);
                  }}
                />
              </div>
            )}

            {/* Step: Practice */}
            {step === 'practice' && (
              <div className="space-y-4 text-center">
                {isUnit2Exam && !showQuizResults ? (
                  <div className="space-y-3.5 text-left animate-fadeIn">
                    <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 py-1.5 px-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 max-w-[calc(100%-3rem)]">
                      <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-heading font-black text-amber-800 dark:text-amber-200 uppercase tracking-wider truncate">
                        Evaluación del Módulo 2
                      </span>
                    </div>

                    <TunerPitchChallengeView
                      difficultyLabel="Fácil"
                      levelNumber={1}
                      subtitle="Afinación de 3 notas"
                      notes={unit2ExamNotes}
                      toleranceCents={45}
                      gender={gender}
                      vocalRangeData={userStats?.vocalRangeData}
                      onSuccess={handleUnit2ExamSuccess}
                    />
                  </div>
                ) : isUnit3Exam && !showQuizResults ? (
                  <div className="space-y-3 text-left animate-fadeIn">
                    <div className="flex items-center justify-between gap-2 pr-9">
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 py-1.5 px-2.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 min-w-0">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-heading font-black text-amber-800 dark:text-amber-200 uppercase tracking-wider truncate">
                          Evaluación Módulo 3
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                        Ronda {unit3ExamLevelIndex + 1} de 4
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      {UNIT_3_EXAM_LEVELS.map((lvl, idx) => {
                        const isPassed = idx < unit3ExamLevelIndex;
                        const isCurrent = idx === unit3ExamLevelIndex;
                        const bpm = 80 + (lvl - 7) * 10;
                        return (
                          <div
                            key={lvl}
                            className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                              isPassed
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                                : isCurrent
                                ? 'bg-[#4648d4] text-white shadow-sm font-black ring-2 ring-indigo-300/40'
                                : 'bg-slate-200/40 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-medium'
                            }`}
                          >
                            <span className="text-[10px] uppercase tracking-wider font-bold">Nivel {lvl}</span>
                            <span className={`text-[9px] ${isCurrent ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                              {bpm} BPM
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <TunerRhythmView
                      key={`u3-exam-rhythm-lvl-${currentUnit3Level}`}
                      level={currentUnit3Level}
                      pattern={currentUnit3Pattern}
                      bpm={currentUnit3Bpm}
                      hideExitButton={true}
                      onSuccess={handleUnit3RhythmStepSuccess}
                      onFail={() => {
                        if (onLoseLife) onLoseLife('tuner');
                      }}
                    />
                  </div>
                ) : (node.type === 'control' || (isExamNode && examStage === 'balloon')) && !showQuizResults ? (
                  <BalloonExerciseView
                    isExamBalloon={isExamNode && examStage === 'balloon'}
                    onComplete={() => {
                      if (isExamNode && examStage === 'balloon') {
                        setExamStage('questions_part2');
                        setQuizQuestionIdx(4);
                      } else {
                        triggerStarRatingResults(4);
                      }
                    }}
                  />
                ) : showQuizResults ? (
                  <StarResultsView
                    quizScore={quizScore}
                    isExamNode={isExamNode}
                    isUnit2Exam={isUnit2Exam}
                    isUnit3Exam={isUnit3Exam}
                    isUnit4Exam={isUnit4Exam}
                    node={node}
                    userStats={userStats}
                    onContinue={() => {
                      audioService.playClickSound();
                      setQuizResolved(true);
                      unlockOrientation();
                      onClose();
                      if (isExamNode && onOpenUnitCelebration) {
                        onOpenUnitCelebration();
                      } else {
                        onCompleteNode(node.id, node.xpReward);
                      }
                    }}
                    onRetry={() => {
                      audioService.playClickSound();
                      setQuizQuestionIdx(0);
                      setQuizAnswers(new Array(activeQuestions.length).fill(null));
                      setUnit3ExamLevelIndex(0);
                      setShowQuizResults(false);
                    }}
                    onOpenRecoveryExam={onOpenRecoveryExam}
                    onOpenStore={onOpenStore}
                    onLoseLife={onLoseLife}
                  />
                ) : (
                  <QuizQuestionsView
                    activeQuestions={activeQuestions}
                    quizQuestionIdx={quizQuestionIdx}
                    quizAnswers={quizAnswers}
                    isExamNode={isExamNode}
                    isUnit4Exam={isUnit4Exam}
                    onSelectAnswer={handleSelectAnswer}
                    onNextQuestion={handleNextQuizQuestion}
                  />
                )}
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <LessonSuccessView node={node} onClaimLesson={handleClaimLesson} />
            )}
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onContinuePracticing={() => setShowExitConfirm(false)}
        onConfirmExit={() => {
          unlockOrientation();
          onClose();
        }}
      />
    </>
  );
};

export default LessonModal;
