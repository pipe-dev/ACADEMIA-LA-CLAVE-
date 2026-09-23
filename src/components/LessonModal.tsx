'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import YouTube, { YouTubeProps } from 'react-youtube';
import { LessonNode, UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { VocalRangeModal } from './VocalRangeModal';
import { TunerPitchChallengeView } from './TunerPitchChallengeView';
import { TunerRhythmView } from './TunerRhythmView';
import { generateUserNotePool } from '../utils/voicePlaybackService';
import { generateChallenge, rhythmPatterns } from '../data/tunerLevelsData';
import { X, CheckCircle2, Wind, Sparkles, Trophy, AlertTriangle, Play, Pause, ArrowLeft, RotateCcw, RotateCw, Zap, Star, Drum, Mic } from 'lucide-react';

interface LessonModalProps {
  node: LessonNode;
  userStats?: UserStats;
  onClose: () => void;
  onCompleteNode: (nodeId: string, xpReward: number) => void;
  onOpenUnitCelebration?: () => void;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export interface BalloonColorTheme {
  id: string;
  name: string;
  gradient: string;
  glowRgb: string;
  knotColor: string;
  bgCircle: string;
}

// Persistent map storing playback positions across node views
const nodeVideoPlaybackTimes = new Map<string, number>();

const BALLOON_COLOR_THEMES: BalloonColorTheme[] = [
  {
    id: 'red',
    name: 'Rojo Carmesí',
    gradient: 'from-pink-400 via-rose-500 to-red-600',
    glowRgb: 'rgba(244, 63, 94, 0.4)',
    knotColor: 'bg-[#e11d48]',
    bgCircle: 'bg-rose-500'
  },
  {
    id: 'blue',
    name: 'Azul Eléctrico',
    gradient: 'from-cyan-300 via-blue-500 to-indigo-600',
    glowRgb: 'rgba(59, 130, 246, 0.4)',
    knotColor: 'bg-[#2563eb]',
    bgCircle: 'bg-blue-500'
  },
  {
    id: 'purple',
    name: 'Púrpura Mágico',
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-700',
    glowRgb: 'rgba(168, 85, 247, 0.4)',
    knotColor: 'bg-[#9333ea]',
    bgCircle: 'bg-purple-500'
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    gradient: 'from-emerald-300 via-teal-500 to-emerald-700',
    glowRgb: 'rgba(16, 185, 129, 0.4)',
    knotColor: 'bg-[#059669]',
    bgCircle: 'bg-emerald-500'
  },
  {
    id: 'amber',
    name: 'Dorado Solar',
    gradient: 'from-yellow-300 via-amber-400 to-orange-500',
    glowRgb: 'rgba(245, 158, 11, 0.4)',
    knotColor: 'bg-[#d97706]',
    bgCircle: 'bg-amber-400'
  }
];

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

  const [balloonThemeIdx, setBalloonThemeIdx] = useState<number>(0);
  const currentBalloonTheme = BALLOON_COLOR_THEMES[balloonThemeIdx] || BALLOON_COLOR_THEMES[0];
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Sostén' | 'Exhala'>('Inhala');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Custom Video Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const playerRef = useRef<any>(null);
  const userRequestedPlayRef = useRef<boolean>(false);

  // Loop Repetition Logic for Exercise Videos
  const getTargetLoopCount = (): number => {
    if (node.id === 'u1-node6' || node.title?.includes('Apoyo y Estabilidad')) return 2;
    if (node.id === 'u1-node3' || node.title?.includes('Capacidad Pulmonar')) return 3;
    if (typeof node.loopCount === 'number') return node.loopCount;
    if (node.instructions?.includes('2 repeticiones') || node.instructions?.includes('2 veces')) return 2;
    if (node.instructions?.includes('3 repeticiones') || node.instructions?.includes('3 veces')) return 3;
    if (node.instructions?.includes('4 repeticiones') || node.instructions?.includes('4 veces')) return 4;
    return 1;
  };

  const targetLoopCount = getTargetLoopCount();
  const [currentLoop, setCurrentLoop] = useState<number>(1);
  const [loopToastMsg, setLoopToastMsg] = useState<string | null>(null);

  // Auto-hide controls timer
  const [showControls, setShowControls] = useState<boolean>(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isPlaying]);

  // Class 1 Quiz questions exact copy from screenshots
  const CLASS_1_QUIZ_QUESTIONS = [
    {
      id: 1,
      question: '¿Cuál es la postura correcta?',
      options: [
        'Estar lo más rígido y tenso posible con los hombros levantados.',
        'Flexionar el cuello hacia adelante y sentarse encorvado.',
        'Hombros y piernas a la misma anchura y todo el cuerpo relajado, sin tensión excesiva.',
        'Mantener los brazos cruzados y las rodillas bloqueadas.'
      ],
      correctAnswer: 2,
      explanation: 'Tener los hombros y las piernas a la misma anchura con el cuerpo relajado ayuda a cantar de forma cómoda y sin tensiones.'
    },
    {
      id: 2,
      question: '¿Qué tipo de respiración es fundamental en el canto?',
      options: [
        'Respiración clavicular o de pecho alto.',
        'Respiración diafragmática.',
        'Respiración rápida por la boca.',
        'Respiración conteniendo el aire en la garganta.'
      ],
      correctAnswer: 1,
      explanation: 'La respiración diafragmática es la base del apoyo para cantar de manera sana y sostenida.'
    },
    {
      id: 3,
      question: '¿Cuáles son las zonas más comunes del cuerpo donde acumulamos tensión que perjudica la afinación?',
      options: [
        'La mandíbula, el cuello, la lengua y los hombros.',
        'Las rodillas y los talones del pie.',
        'Los dedos de las manos y las muñecas.',
        'La espalda baja y los omóplatos únicamente.'
      ],
      correctAnswer: 0,
      explanation: 'La mandíbula, el cuello, la lengua y los hombros son los principales acumuladores de tensión vocal.'
    },
    {
      id: 4,
      question: 'Para cantar frases largas sin sentir que te falta el aire, ¿cómo debes respirar correctamente?',
      options: [
        'Empujando todo el aire con fuerza de golpe al iniciar la frase.',
        'Reteniendo el aire en el pecho sin dejarlo salir.',
        'Respirando muy rápido después de cada palabra.',
        'Regulando el flujo de aire gastando solo el aire necesario y sin tensionar excesivamente la garganta.'
      ],
      correctAnswer: 3,
      explanation: 'Dosificar y regular el aire gastando solo lo necesario y sin tensar la garganta te permite sostener notas largas cómodamente.'
    }
  ];

  // Unit 1 Evaluation Exam Questions (7 questions: 4 from Class 1 + 3 from User Screenshots)
  const UNIT_1_EXAM_QUESTIONS = [
    {
      id: 1,
      question: '¿Cuál es la postura correcta?',
      options: [
        'Estar lo más rígido y tenso posible con los hombros levantados.',
        'Flexionar el cuello hacia adelante y sentarse encorvado.',
        'Hombros y piernas a la misma anchura y todo el cuerpo relajado, sin tensión excesiva.',
        'Mantener los brazos cruzados y las rodillas bloqueadas.'
      ],
      correctAnswer: 2,
      explanation: 'Tener los hombros y las piernas a la misma anchura con el cuerpo relajado ayuda a cantar de forma cómoda y sin tensiones.'
    },
    {
      id: 2,
      question: '¿Qué tipo de respiración es fundamental en el canto?',
      options: [
        'Respiración clavicular o de pecho alto.',
        'Respiración diafragmática.',
        'Respiración rápida por la boca.',
        'Respiración conteniendo el aire en la garganta.'
      ],
      correctAnswer: 1,
      explanation: 'La respiración diafragmática es la base del apoyo para cantar de manera sana y sostenida.'
    },
    {
      id: 3,
      question: '¿Cuáles son las zonas más comunes del cuerpo donde acumulamos tensión que perjudica la afinación?',
      options: [
        'La mandíbula, el cuello, la lengua y los hombros.',
        'Las rodillas y los talones del pie.',
        'Los dedos de las manos y las muñecas.',
        'La espalda baja y los omóplatos únicamente.'
      ],
      correctAnswer: 0,
      explanation: 'La mandíbula, el cuello, la lengua y los hombros son los principales acumuladores de tensión vocal.'
    },
    {
      id: 4,
      question: 'Para cantar frases largas sin sentir que te falta el aire, ¿cómo debes respirar correctamente?',
      options: [
        'Empujando todo el aire con fuerza de golpe al iniciar la frase.',
        'Reteniendo el aire en el pecho sin dejarlo salir.',
        'Respirando muy rápido después de cada palabra.',
        'Regulando el flujo de aire gastando solo el aire necesario y sin tensionar excesivamente la garganta.'
      ],
      correctAnswer: 3,
      explanation: 'Dosificar y regular el aire gastando solo lo necesario y sin tensar la garganta te permite sostener notas largas cómodamente.'
    },
    {
      id: 5,
      question: 'Si durante el calentamiento sientes dolor o tensión excesiva en la garganta, ¿cuál es el paso correcto a seguir?',
      options: [
        'Continuar con más intensidad para que el músculo se acostumbre.',
        'Detenerse, relajar, revisar la técnica de respiración y hacer ejercicios más suaves como sirenas de labio.',
        'Tomar una bebida muy fría para desinflamar al instante y seguir.',
        'Cantar canciones agudas directamente para forzar la apertura de la laringe.'
      ],
      correctAnswer: 1,
      explanation: 'El dolor o tensión es un indicador de que algo anda mal. Detenerse y reiniciar con ejercicios suaves asegura que no lastimes tu voz antes de empezar.'
    },
    {
      id: 6,
      question: '¿Dónde se ubican exactamente las cuerdas vocales?',
      options: [
        'En el paladar blando, cerca de la campanilla.',
        'En la laringe (la caja de la voz), detrás del cartílago tiroides.',
        'Dentro de la tráquea, justo antes de los pulmones.',
        'En la cavidad nasal, para resonar el aire.'
      ],
      correctAnswer: 1,
      explanation: "Las cuerdas (o pliegues) vocales están protegidas dentro de la laringe, ubicadas horizontalmente justo detrás del cartílago tiroides (la 'manzana de Adán')."
    },
    {
      id: 7,
      question: '¿Qué cambio físico experimentan las cuerdas vocales al producir sonidos agudos (como en voz de cabeza)?',
      options: [
        'Se vuelven más cortas, gruesas y vibran lentamente.',
        'Se separan por completo para dejar salir más aire.',
        'Se estiran, se vuelven más delgadas (finitas) y vibran mucho más rápido.',
        'Se endurecen como huesos y no vibran, solo resuenan.'
      ],
      correctAnswer: 2,
      explanation: 'Para alcanzar notas más altas (frecuencias mayores), las cuerdas vocales se alargan y adelgazan, permitiéndoles vibrar a mayor velocidad.'
    }
  ];

  const isUnit2Exam = node.id === 'u2-node20.5' || 
                      (node.unitId === 2 && (node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'))));
  const isUnit3Exam = node.id === 'u3-node28.5' || 
                      (node.unitId === 3 && (node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'))));
  const isExamNode = !isUnit2Exam && !isUnit3Exam && (
    node.type === 'exam' || 
    node.id === 'u1-node12.5' || 
    Boolean(node.title?.toLowerCase().includes('evaluaci'))
  );
  const isAnyEvaluationNode = node.type === 'exam' || Boolean(node.title?.toLowerCase().includes('evaluaci'));
  const activeQuestions = isExamNode ? UNIT_1_EXAM_QUESTIONS : CLASS_1_QUIZ_QUESTIONS;

  // ─── Unit 2 Exam: Exactly Level 1 of Modo Fácil (3 comfortable notes from vocal pool) ───
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

  // ─── Unit 3 Exam: Levels 9 to 12 of Modo Fácil (Tempo & Rhythm) ───
  const UNIT_3_EXAM_LEVELS = [9, 10, 11, 12] as const;
  const [unit3ExamLevelIndex, setUnit3ExamLevelIndex] = useState<number>(0);
  const [unit3ExamScores, setUnit3ExamScores] = useState<number[]>([]);
  const currentUnit3Level = UNIT_3_EXAM_LEVELS[unit3ExamLevelIndex] ?? 9;
  const currentUnit3Pattern = rhythmPatterns[currentUnit3Level] || rhythmPatterns[9];
  const currentUnit3Bpm = 80 + (currentUnit3Level - 7) * 10;

  // State triggers
  const [examStage, setExamStage] = useState<'questions_part1' | 'balloon' | 'questions_part2'>('questions_part1');
  const [node1CompletedTriggered, setNode1CompletedTriggered] = useState<boolean>(false);
  const [isVideoFadingOut, setIsVideoFadingOut] = useState<boolean>(false);
  const [quizQuestionIdx, setQuizQuestionIdx] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(() => new Array(activeQuestions.length).fill(null));
  const [quizResolved, setQuizResolved] = useState<boolean>(false);
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [star3Climax, setStar3Climax] = useState<boolean>(false);

  // Sync Timer for Video Progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && step === 'video') {
      interval = setInterval(async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const rawTime = playerRef.current.getCurrentTime();
            const time = typeof rawTime?.then === 'function' ? await rawTime : rawTime;
            if (typeof time === 'number' && !isNaN(time)) {
              setCurrentTime(time);
              if (time > 0.5) {
                nodeVideoPlaybackTimes.set(node.id, time);
              }

              // Class 1 (u1-node1) specific timing triggers for audio ding and confetti
              if (node.id === 'u1-node1' || node.title?.includes('Introducción al Canto')) {
                if (time >= 434 && !node1CompletedTriggered) {
                  setNode1CompletedTriggered(true);
                  audioService.playSoftDing();
                  fireVideoConfetti(60);
                  onCompleteNode(node.id, node.xpReward);
                }
              }
            }

            if (typeof playerRef.current.getDuration === 'function') {
              const rawDur = playerRef.current.getDuration();
              const dur = typeof rawDur?.then === 'function' ? await rawDur : rawDur;
              if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                setDuration(dur);

                // Universal Video Fade Out: Trigger 3.2 seconds before video ends on the final loop
                if (dur - (typeof time === 'number' ? time : 0) <= 3.2 && !isVideoFadingOut) {
                  if (currentLoop >= targetLoopCount) {
                    setIsVideoFadingOut(true);
                  }
                }
              }
            }
          } catch (e) {
            // Silently ignore polling errors
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, node1CompletedTriggered, isVideoFadingOut, currentLoop, targetLoopCount, node.id, node.title, node.xpReward, onCompleteNode]);

  // Balloon exercise single timeline state (0 to 40s or 0 to 24s)
  const [balloonActive, setBalloonActive] = useState<boolean>(false);
  const [balloonTotalSecs, setBalloonTotalSecs] = useState<number>(0);
  const isPursedLipsExamBalloon = isExamNode && examStage === 'balloon';

  // Compute exact balloon phase, remaining seconds, scale, and repetition number from single timeline
  const currentBalloonState = useMemo(() => {
    if (isPursedLipsExamBalloon) {
      // Labios Fruncidos airflow timing: 4s Inhale (Nose) + 8s Exhale (Pursed Lips) = 12s per cycle. 24s total for 2 loops.
      const maxSecs = 24;
      const totalSecs = Math.min(maxSecs, Math.max(0, balloonTotalSecs));
      const cycleIdx = totalSecs < 12 ? 0 : 1;
      const timeInCycle = totalSecs >= maxSecs ? 11 : totalSecs % 12;

      let type: 'inhale' | 'hold_full' | 'exhale' = 'inhale';
      let label = 'Inhala por la nariz (4s)';
      let phaseSecsLeft = 4;
      let scale = 1.0;

      if (timeInCycle < 4) {
        type = 'inhale';
        label = 'Inhala por la nariz (4s)';
        phaseSecsLeft = 4 - timeInCycle;
        scale = 0.65 + (timeInCycle / 4) * 0.55;
      } else {
        type = 'exhale';
        label = 'Exhala con labios fruncidos (8s)';
        phaseSecsLeft = 12 - timeInCycle;
        const exhaleProgress = (timeInCycle - 4) / 8;
        scale = 1.20 - exhaleProgress * 0.55;
      }

      return {
        cycleNum: cycleIdx,
        completedCycles: totalSecs >= 24 ? 2 : totalSecs >= 12 ? 1 : 0,
        type,
        label,
        phaseSecsLeft,
        scale
      };
    }

    // Default Control Balloon airflow timing: 5s Inhale + 5s Hold + 10s Exhale = 20s per cycle (40s total)
    const totalSecs = Math.min(40, Math.max(0, balloonTotalSecs));
    const cycleIdx = totalSecs < 20 ? 0 : 1;
    const timeInCycle = totalSecs >= 40 ? 19 : totalSecs % 20;

    let type: 'inhale' | 'hold_full' | 'exhale' = 'inhale';
    let label = 'Inhala en 5s';
    let phaseSecsLeft = 5;
    let scale = 1.0;

    if (timeInCycle < 5) {
      type = 'inhale';
      label = 'Inhala en 5s';
      phaseSecsLeft = 5 - timeInCycle;
      scale = 0.65 + (timeInCycle / 5) * 0.55;
    } else if (timeInCycle < 10) {
      type = 'hold_full';
      label = 'Retén en 5s';
      phaseSecsLeft = 10 - timeInCycle;
      scale = 1.20;
    } else {
      type = 'exhale';
      label = 'Exhala en 10s';
      phaseSecsLeft = 20 - timeInCycle;
      const exhaleProgress = (timeInCycle - 10) / 10;
      scale = 1.20 - exhaleProgress * 0.55;
    }

    return {
      cycleNum: cycleIdx, // 0 for Repetición 1, 1 for Repetición 2
      completedCycles: totalSecs >= 40 ? 2 : totalSecs >= 20 ? 1 : 0,
      type,
      label,
      phaseSecsLeft,
      scale
    };
  }, [balloonTotalSecs, isPursedLipsExamBalloon]);

  const currentBalloonStep = currentBalloonState;
  const balloonSecsLeft = currentBalloonState.phaseSecsLeft;
  const balloonCycles = currentBalloonState.completedCycles;
  const balloonScale = currentBalloonState.scale;

  // Auto-reset video state
  useEffect(() => {
    if (step === 'video') {
      setIsVideoFadingOut(false);
    }
  }, [step]);

  // Auto-reset upon entering practice
  useEffect(() => {
    if (step === 'practice' && node.type === 'control') {
      setBalloonTotalSecs(0);
      setBalloonActive(true);
    }
  }, [step, node.type]);

  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [totalWipeout, setTotalWipeout] = useState<boolean>(false);

  const [starIdleEffect, setStarIdleEffect] = useState<'none' | 'spin' | 'wink'>('none');
  const [idleTargetStar, setIdleTargetStar] = useState<number>(1);
  const targetStarRef = useRef<number>(1);

  // Idle animation loop when user stays on the results screen (Strict alternating Star 1 <-> Star 2, random timing, 0 sound)
  useEffect(() => {
    if (!showQuizResults || quizScore < 2) {
      setStarIdleEffect('none');
      return;
    }

    let mainTimer: NodeJS.Timeout;
    let resetTimer: NodeJS.Timeout;

    const scheduleNextIdle = () => {
      // Random delay between 5.5s and 12.5s (unpredictable & non-stressful)
      const randomDelay = Math.floor(Math.random() * 7000) + 5500;

      mainTimer = setTimeout(() => {
        const effect: 'spin' | 'wink' = Math.random() > 0.5 ? 'spin' : 'wink';
        const currentTarget = targetStarRef.current;

        setStarIdleEffect(effect);
        setIdleTargetStar(currentTarget);

        // Strictly alternate: 1 -> 2 -> 1 -> 2
        targetStarRef.current = currentTarget === 1 ? 2 : 1;

        resetTimer = setTimeout(() => {
          setStarIdleEffect('none');
        }, 1100);

        scheduleNextIdle();
      }, randomDelay);
    };

    scheduleNextIdle();

    return () => {
      clearTimeout(mainTimer);
      clearTimeout(resetTimer);
    };
  }, [showQuizResults, quizScore]);

  const [star3GrandJump, setStar3GrandJump] = useState<boolean>(false);
  const [star3StaticLanded, setStar3StaticLanded] = useState<boolean>(false);

  const triggerStarRatingResults = useCallback((score: number) => {
    setQuizScore(score);
    setShowQuizResults(true);
    setEarnedStars(0);
    setStar3Climax(false);
    setIsRollingBack(false);
    setTotalWipeout(false);
    setStar3GrandJump(false);
    setStar3StaticLanded(false);

    if (score >= 2) {
      // Winning Cascade Timeline (2 or 3 stars)
      // 1. Star 1 Fills at 350ms (Arpeggio Note 1: Do5)
      setTimeout(() => {
        setEarnedStars(1);
        audioService.playStar1ArpeggioNote();
        fireVideoConfetti(30);
      }, 350);

      // 2. Star 2 Fills at 950ms (Arpeggio Note 2: Mi5 -> Sol5)
      setTimeout(() => {
        setEarnedStars(2);
        audioService.playStar2ArpeggioNote();
        fireVideoConfetti(45);
      }, 950);

      // 3. Star 3 Fills at 1600ms
      if (score === 4) {
        // 4/4 Correct -> 3 Full Stars (Full Victory Fanfare & Climax)
        setTimeout(() => {
          setEarnedStars(3);
          setStar3Climax(true);
          audioService.play3StarFanfare(); // Grand polyphonic song with arpeggio climax!
          fireVideoConfetti(90);
          setTimeout(() => fireVideoConfetti(65), 350);
          setTimeout(() => fireVideoConfetti(45), 700);
        }, 1600);

        // 4. Grand Gigantic Jump OUT of the modal after 5 seconds of Star 3 jumping (at 6600ms)!
        setTimeout(() => {
          setStar3GrandJump(true);
          fireVideoConfetti(100);
          setTimeout(() => fireVideoConfetti(60), 300);
        }, 6600);

        // 5. Star 3 lands gracefully & becomes completely static at 8000ms (1.4s later)
        setTimeout(() => {
          setStar3GrandJump(false);
          setStar3StaticLanded(true);
        }, 8000);
      } else if (score === 3) {
        // 3/4 Correct -> 2.5 Stars (Half Star 3)
        setTimeout(() => {
          setEarnedStars(2.5);
          audioService.play2StarChime();
          fireVideoConfetti(60);
        }, 1600);
      }
    } else {
      // Rollback / Defeat Tease Sequence (score <= 1)
      // 1. Fill 1st Star with Arpeggio Note 1
      setTimeout(() => {
        setEarnedStars(1);
        audioService.playStar1ArpeggioNote();
      }, 350);

      // 2. Tease 2nd Star with Arpeggio Note 2
      setTimeout(() => {
        setEarnedStars(2);
        audioService.playStar2ArpeggioNote();
      }, 850);

      // 3. Tease 3rd Star
      setTimeout(() => {
        setEarnedStars(3);
      }, 1350);

      // 4. DRAMATIC ROLLBACK AT 1900ms!
      setTimeout(() => {
        setIsRollingBack(true);
        setEarnedStars(1); // Drops back to 1 star!
        audioService.playSadDefeatSound(); // Tragic melancholic defeat song!
        if (isExamNode && onLoseLife) {
          onLoseLife('academia');
        }
      }, 1900);

      // 5. IF SCORE IS 0: TOTAL WIPEOUT & LAUGHING MOCKERY AT 2900ms (1s after rollback)!
      if (score === 0) {
        setTimeout(() => {
          setEarnedStars(0); // Strips away the last remaining star!
          setTotalWipeout(true);
          audioService.playMockeryWawawaSound(); // Hilarious cartoon "wa-wa-wa-waaah"!
        }, 2900);
      }
    }
  }, [isExamNode, onLoseLife]);

  const handleUnit2ExamSuccess = useCallback(() => {
    audioService.playBadgeUnlockedSound();
    audioService.playSuccessBellSound();
    fireVideoConfetti(100);
    setTimeout(() => fireVideoConfetti(60), 400);

    // Trigger full 3-star victory celebration
    triggerStarRatingResults(4);
  }, [triggerStarRatingResults]);

  const handleUnit3ExamSuccess = useCallback(() => {
    audioService.playBadgeUnlockedSound();
    audioService.playSuccessBellSound();
    fireVideoConfetti(100);
    setTimeout(() => fireVideoConfetti(65), 400);

    // Trigger full 3-star victory celebration
    triggerStarRatingResults(4);
  }, [triggerStarRatingResults]);

  const handleUnit3RhythmStepSuccess = useCallback((score: number) => {
    setUnit3ExamScores((prev) => [...prev, score]);

    if (unit3ExamLevelIndex < UNIT_3_EXAM_LEVELS.length - 1) {
      audioService.playSuccessBellSound();
      fireVideoConfetti(45);
      setUnit3ExamLevelIndex((prev) => prev + 1);
    } else {
      handleUnit3ExamSuccess();
    }
  }, [unit3ExamLevelIndex, handleUnit3ExamSuccess]);

  const handleNextQuizQuestion = () => {
    audioService.playClickSound();

    if (isExamNode && quizQuestionIdx === 3 && examStage === 'questions_part1') {
      // Transition from Question 4 to Balloon Exercise Stage (Labios Fruncidos, 2 loops)
      setExamStage('balloon');
      setBalloonTotalSecs(0);
      setBalloonActive(true);
      return;
    }

    if (quizQuestionIdx < activeQuestions.length - 1) {
      setQuizQuestionIdx((prev) => prev + 1);
    } else {
      // Calculate score out of active questions
      const score = quizAnswers.reduce<number>((acc, ans, idx) => {
        if (ans === activeQuestions[idx]?.correctAnswer) return acc + 1;
        return acc;
      }, 0);

      // Normalize score for Star Rating Modal
      // For 7-question exam: 6-7 correct = 4 (3 stars), 4-5 = 3 (2.5 stars), 2-3 = 2 (2 stars), < 2 = defeat
      const normalizedScore = isExamNode
        ? (score >= 6 ? 4 : score >= 4 ? 3 : score >= 2 ? 2 : 0)
        : score;

      triggerStarRatingResults(normalizedScore);
    }
  };

  // Main Balloon Single-Timeline Loop (Counts 1s ticks from 0 to 40)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (balloonActive && (step === 'practice' || node.type === 'control')) {
      const targetSecsLimit = isPursedLipsExamBalloon ? 24 : 40;

      interval = setInterval(() => {
        setBalloonTotalSecs((prevSecs) => {
          const nextSecs = prevSecs + 1;

          // Sound effect on phase change boundary
          if (isPursedLipsExamBalloon) {
            const timeInCycle = nextSecs % 12;
            if (timeInCycle === 0 || timeInCycle === 4) {
              audioService.playSoftDing();
            }
          } else {
            const timeInCycle = nextSecs % 20;
            if (timeInCycle === 0 || timeInCycle === 5 || timeInCycle === 10) {
              audioService.playSoftDing();
            }
          }

          if (nextSecs >= targetSecsLimit) {
            // Full repetitions completed!
            setBalloonActive(false);
            audioService.playLessonCompleteSound();
            audioService.vibrate([40, 60, 40]);
            fireVideoConfetti(60);

            if (isPursedLipsExamBalloon) {
              setTimeout(() => {
                setExamStage('questions_part2');
                setQuizQuestionIdx(4);
              }, 600);
            } else {
              setTimeout(() => {
                triggerStarRatingResults(4);
              }, 600);
            }
            return targetSecsLimit;
          }

          return nextSecs;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [balloonActive, step, node.type, isPursedLipsExamBalloon, isExamNode, examStage, triggerStarRatingResults]);

  // Confetti helper targeted strictly inside the video canvas with ultra-fine miniature particle sizing
  const fireVideoConfetti = (count: number = 40) => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    try {
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      
      // Set canvas internal resolution 1:1 with container physical pixel size (prevents low-res stretching)
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      const myConfetti = confetti.create(canvas, {
        resize: false,
        useWorker: false
      });

      myConfetti({
        particleCount: count,
        spread: 60,
        startVelocity: 22 * dpr,
        scalar: 0.75 * dpr, // Medium-large, vivid, elegant confetti particles!
        ticks: 180,
        gravity: 0.9,
        origin: { y: 0.5 },
        colors: ['#4648d4', '#6063ee', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7']
      });
    } catch (e) {
      // Silently catch canvas execution edge-cases
    }
  };



  // Active "Eyes": Detects the exact millisecond the video finishes loading/cueing and dispatches autoplay
  const autoPlayFiredRef = useRef<boolean>(false);
  const autoPlayWatcherRef = useRef<NodeJS.Timeout | null>(null);

  const attemptAutoPlay = useCallback((player: any) => {
    if (!player) return;
    try {
      player.unMute?.();
      player.setVolume?.(100);
      player.playVideo?.();
    } catch (e) {}
  }, []);

  // Continuous active watcher: checks every 100ms and triggers play the instant player is ready
  useEffect(() => {
    if (step !== 'video' && !userRequestedPlayRef.current) {
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
      return;
    }

    autoPlayFiredRef.current = false;
    let ticks = 0;

    autoPlayWatcherRef.current = setInterval(async () => {
      ticks++;
      if (ticks > 50 || autoPlayFiredRef.current) {
        if (autoPlayWatcherRef.current) {
          clearInterval(autoPlayWatcherRef.current);
          autoPlayWatcherRef.current = null;
        }
        return;
      }

      const player = playerRef.current;
      if (!player) return;

      try {
        const rawState = typeof player.getPlayerState === 'function' ? player.getPlayerState() : null;
        const state = typeof rawState?.then === 'function' ? await rawState : rawState;

        if (state === 1) {
          setIsPlaying(true);
          autoPlayFiredRef.current = true;
          if (autoPlayWatcherRef.current) {
            clearInterval(autoPlayWatcherRef.current);
            autoPlayWatcherRef.current = null;
          }
          return;
        }

        // State 5 = CUED, -1 = UNSTARTED, 2 = PAUSED before first playback
        if (state === 5 || state === -1 || (state === 2 && !autoPlayFiredRef.current)) {
          attemptAutoPlay(player);
        }
      } catch (e) {}
    }, 100);

    return () => {
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
    };
  }, [step, attemptAutoPlay]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    try {
      const iframe = event.target.getIframe?.();
      if (iframe) {
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      }
      event.target.unMute?.();
      event.target.setVolume?.(100);

      // Resume from exact saved second if previously paused / exited
      const savedTime = nodeVideoPlaybackTimes.get(node.id);
      if (typeof savedTime === 'number' && savedTime > 0.5) {
        event.target.seekTo?.(savedTime, true);
        setCurrentTime(savedTime);
      }
    } catch {}

    if (stepRef.current === 'video' || userRequestedPlayRef.current) {
      attemptAutoPlay(event.target);
    }
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) {
      setIsPlaying(true); // Playing
      autoPlayFiredRef.current = true;
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
    } else if (event.data === 2) {
      setIsPlaying(false); // Paused
      if (!autoPlayFiredRef.current && (stepRef.current === 'video' || userRequestedPlayRef.current)) {
        try {
          event.target.unMute?.();
          event.target.setVolume?.(100);
          event.target.playVideo?.();
        } catch {}
      }
    } else if (event.data === 5 || event.data === -1) {
      // 5 = CUED, -1 = UNSTARTED: Video metadata & cover are loaded and ready!
      if (stepRef.current === 'video' || userRequestedPlayRef.current) {
        attemptAutoPlay(event.target);
      }
    }

    if (event.data === 0) { // Video ENDED (0)
      if (currentLoop < targetLoopCount) {
        // Intermediate Loop completion
        const completedNum = currentLoop;
        const nextLoop = currentLoop + 1;
        setCurrentLoop(nextLoop);
        setIsPlaying(true);
        audioService.playSoftDing();
        audioService.vibrate([20, 30, 20]);

        // Confetti strictly inside video canvas
        fireVideoConfetti(50);

        // Centered Large Notification Toast (ONLY FOR MULTI-LOOP EXERCISES)
        if (targetLoopCount > 1) {
          setLoopToastMsg(`BUCLE ${completedNum} DE ${targetLoopCount} COMPLETADO`);
          setTimeout(() => setLoopToastMsg(null), 2400);
        }

        if (playerRef.current) {
          try {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          } catch {}
        }
      } else {
        // FINAL Loop completed! 5 bursts of elegant confetti strictly INSIDE video
        setIsPlaying(false);
        audioService.playLessonCompleteSound();
        audioService.vibrate([40, 60, 40, 100]);

        if (targetLoopCount > 1) {
          setLoopToastMsg(`¡${targetLoopCount} DE ${targetLoopCount} BUCLES COMPLETADOS! LECCIÓN DOMINADA`);
        }

        // 5 consecutive bursts of confetti strictly INSIDE the video canvas!
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            fireVideoConfetti(70);
            audioService.playXpGainSound();
          }, i * 280);
        }

        // Complete node or go to quiz / vocal diagnostic depending on node type
        if (node.id === 'u1-node7' || node.title?.includes('Fisiología Vocal')) {
          setTimeout(() => {
            unlockOrientation();
            setStep('vocal_diagnostic');
          }, 1200);
        } else if (node.id === 'u1-node1' || node.title?.includes('Introducción al Canto')) {
          setTimeout(() => {
            unlockOrientation();
            if (!quizResolved) {
              setStep('practice');
            } else {
              onClose();
            }
          }, 1200);
        } else {
          // Complete node and return directly to Academia nodes map after celebrations
          setTimeout(() => {
            unlockOrientation();
            onCompleteNode(node.id, node.xpReward);
            onClose();
          }, 2400);
        }
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    resetControlsTimeout();
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
        setIsPlaying(false);
      } else {
        try {
          playerRef.current.unMute?.();
          playerRef.current.setVolume?.(100);
        } catch {}
        playerRef.current.playVideo?.();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        await Promise.resolve(playerRef.current.seekTo(time, true));
      } catch {}
    }
  };

  const seekBackward = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.max(0, currentTime - 10);
      setCurrentTime(newTime);
      try {
        await Promise.resolve(playerRef.current.seekTo(newTime, true));
      } catch {}
    }
  };

  const seekForward = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.min(duration || currentTime + 10, currentTime + 10);
      setCurrentTime(newTime);
      try {
        await Promise.resolve(playerRef.current.seekTo(newTime, true));
      } catch {}
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    audioService.playOpenSound();
  }, []);

  const unlockOrientation = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement) {
        try {
          await (document as any).webkitExitFullscreen?.();
        } catch {}
      }
      // @ts-ignore
      if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
        // @ts-ignore
        window.screen.orientation.unlock();
      }
    } catch (e) {
      console.warn('Could not unlock orientation or exit fullscreen', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        // Si el usuario sale de pantalla completa, desbloqueamos la orientación
        // @ts-ignore
        if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
          try {
            // @ts-ignore
            window.screen.orientation.unlock();
          } catch (e) {
            console.warn(e);
          }
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Pause video immediately whenever step is not 'video'
  useEffect(() => {
    if (step !== 'video') {
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
        } catch {}
      }
      setIsPlaying(false);
    }
  }, [step, node.id]);

  // Pause on tab hidden and on unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
        } catch {}
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      userRequestedPlayRef.current = false;
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
          playerRef.current.stopVideo?.();
        } catch {}
      }
      setIsPlaying(false);
    };
  }, [node.id]);

  const handleAttemptClose = () => {
    userRequestedPlayRef.current = false;
    if (playerRef.current) {
      try {
        const t = playerRef.current.getCurrentTime?.();
        if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
          nodeVideoPlaybackTimes.set(node.id, t);
        }
        playerRef.current.pauseVideo?.();
        playerRef.current.stopVideo?.();
      } catch {}
    }
    setIsPlaying(false);
    audioService.playCloseSound();
    unlockOrientation();
    onClose();
  };

  // Trigger confetti celebration & sound effects when reaching success step
  useEffect(() => {
    if (step === 'success') {
      if (node.status === 'completed') {
        audioService.playLessonCompleteSound();
        audioService.vibrate([30]);
        return;
      }

      audioService.playLessonCompleteSound();
      audioService.vibrate([30, 40, 30]);
      setTimeout(() => audioService.playXpGainSound(), 350);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      const timeoutId = setTimeout(() => {
        try {
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.6 }
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.6 }
          });
        } catch (e) {}
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [step, node.status]);



  const handleFinishQuiz = () => {
    if (selectedAnswer === 1) {
      audioService.playFrequency(440, 0.4);
      setStep('success');
    } else {
      audioService.playFrequency(180, 0.2);
      alert('Respuesta incorrecta. ¡Inténtalo de nuevo!');
    }
  };

  const handleClaimLesson = () => {
    audioService.playClickSound();
    unlockOrientation();
    onCompleteNode(node.id, node.xpReward);
    onClose();
  };

  const getSuccessDescription = () => {
    const title = node.title.toLowerCase();
    if (title.includes('respiración') || title.includes('aire')) {
      return 'Has demostrado excelente control de aire y capacidad pulmonar.';
    }
    if (title.includes('afinación') || title.includes('oído') || title.includes('notas')) {
      return 'Tu oído musical y precisión están mejorando notablemente.';
    }
    if (title.includes('vibrato') || title.includes('técnica')) {
      return 'Has aplicado la técnica vocal con gran dominio.';
    }
    if (title.includes('apoyo') || title.includes('diafragma')) {
      return 'Excelente uso de tu soporte vocal y musculatura.';
    }
    if (title.includes('calentamiento') || title.includes('relajación')) {
      return 'Tus cuerdas vocales están listas y saludables para cantar.';
    }
    // Generic fallback mapping the exact title
    return `Has dominado los conceptos de ${node.title} con gran éxito.`;
  };

  return (
    <>
      {/* 1. Pre-mounted YouTube Video Player (Always in DOM if node.youtubeId exists) */}
      {node.youtubeId && (
        <div
          className={
            step === 'video'
              ? 'fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col justify-center items-center overflow-hidden select-none animate-fadeIn'
              : 'fixed -left-[9999px] -top-[9999px] w-[320px] h-[240px] opacity-0 pointer-events-none overflow-hidden z-[-1]'
          }
        >
          <div 
            ref={videoContainerRef} 
            onMouseMove={resetControlsTimeout}
            onTouchStart={resetControlsTimeout}
            onClick={resetControlsTimeout}
            className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none transition-all duration-[3000ms] ease-out ${
              isVideoFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <YouTube
                videoId={node.youtubeId}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 0,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    disablekb: 1,
                    fs: 0,
                    playsinline: 1,
                    enablejsapi: 1,
                    iv_load_policy: 3
                  }
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:object-cover" 
              />
            </div>

            {/* Internal Video Confetti Overlay Canvas */}
            <canvas 
              ref={confettiCanvasRef} 
              className="absolute inset-0 w-full h-full pointer-events-none z-35" 
            />

            {/* Invisible overlay to capture clicks and prevent YouTube UI interaction */}
            <div 
              className="absolute inset-0 z-10 cursor-pointer" 
              onClick={togglePlay}
            />

            {/* Centered Large Premium Loop Toast */}
            {loopToastMsg && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0b1c30]/95 backdrop-blur-2xl border-2 border-[#4648d4] px-8 py-5 rounded-3xl shadow-[0px_16px_40px_rgba(70,72,212,0.6)] flex flex-col items-center justify-center text-center animate-scaleIn pointer-events-none select-none max-w-xs sm:max-w-md">
                <span className="text-[10px] sm:text-xs font-black text-indigo-300 uppercase tracking-widest block leading-tight">
                  PROGRESO DE EJERCICIO
                </span>
                <h3 className="text-base sm:text-xl font-black text-white leading-tight mt-1 drop-shadow-md">
                  {loopToastMsg}
                </h3>
              </div>
            )}

            {/* Top Header Bar: Back Button + Lesson Title + Loop Counter */}
            <div 
              className={`absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-30 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center gap-2.5 md:gap-3.5 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    audioService.playClickSound();
                    unlockOrientation();
                    if (playerRef.current) {
                      try {
                        const t = playerRef.current.getCurrentTime?.();
                        if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
                          nodeVideoPlaybackTimes.set(node.id, t);
                        }
                        playerRef.current.pauseVideo?.();
                        playerRef.current.stopVideo?.();
                      } catch {}
                    }
                    setIsPlaying(false);
                    if (node.id === 'u1-node1' && !quizResolved) {
                      setStep('practice');
                    } else {
                      onClose();
                    }
                  }}
                  className="organic-shape w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white cursor-pointer transition-all duration-300 press-effect hover:scale-105 shrink-0"
                  style={{
                    backgroundColor: '#ef4444',
                    boxShadow: '0 4px 0 0 #b91c1c'
                  }}
                  title="Salir al mapa de la Academia"
                >
                  <ArrowLeft className="w-5 h-5 md:w-7 md:h-7" strokeWidth={3} />
                </button>

                {/* Lesson Title Header Pill */}
                <div className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-lg max-w-[170px] sm:max-w-xs md:max-w-md">
                  <span className="text-[9px] md:text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest block leading-none">
                    Lección Actual
                  </span>
                  <h4 className="text-xs md:text-sm font-black text-white truncate drop-shadow-sm mt-0.5">
                    {node.title}
                  </h4>
                </div>
              </div>

              {/* Loop Counter Pill */}
              {targetLoopCount > 1 && (
                <div className="pointer-events-auto bg-indigo-600/90 backdrop-blur-md border border-indigo-300/40 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-lg flex items-center gap-1.5 text-white shrink-0">
                  <RotateCw className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="text-[10px] md:text-xs font-black tracking-wide">
                    Bucle {currentLoop}/{targetLoopCount}
                  </span>
                </div>
              )}
            </div>
            
            {/* Karaoke Center Controls Block */}
            <div 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 ${
                showControls || !isPlaying ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="bg-surface-container-high/30 dark:bg-slate-800/40 rounded-[2rem] p-4 md:p-8 flex items-center justify-center gap-6 md:gap-12 backdrop-blur-xs">
                <button 
                  onClick={seekBackward}
                  className="organic-shape w-14 h-14 md:w-28 md:h-28 bg-surface-container-high dark:bg-slate-800 text-slate-700 dark:text-[#c0c1ff] flex items-center justify-center press-effect transition-all duration-300 shadow-[0_4px_0_0_#c7c4d7] md:shadow-[0_8px_0_0_#c7c4d7] dark:shadow-[0_4px_0_0_#1b2b3f] dark:md:shadow-[0_8px_0_0_#1b2b3f] cursor-pointer"
                  title="Retroceder 10s"
                >
                  <RotateCcw className="w-6 h-6 md:w-12 md:h-12 stroke-[2.5]" />
                </button>

                <button
                  onClick={togglePlay}
                  className="organic-shape w-20 h-20 md:w-40 md:h-40 bg-[#4648d4] text-white flex items-center justify-center press-effect transition-all duration-300 shadow-[0_7px_0_0_#282a9e] md:shadow-[0_12px_0_0_#282a9e] group cursor-pointer"
                  title={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 md:w-16 md:h-16 fill-white group-active:scale-90 transition-transform" />
                  ) : (
                    <Play className="w-8 h-8 md:w-16 md:h-16 fill-white ml-1 md:ml-3 group-active:scale-90 transition-transform" />
                  )}
                </button>

                <button 
                  onClick={seekForward}
                  className="organic-shape w-14 h-14 md:w-28 md:h-28 bg-surface-container-high dark:bg-slate-800 text-slate-700 dark:text-[#c0c1ff] flex items-center justify-center press-effect transition-all duration-300 shadow-[0_4px_0_0_#c7c4d7] md:shadow-[0_8px_0_0_#c7c4d7] dark:shadow-[0_4px_0_0_#1b2b3f] dark:md:shadow-[0_8px_0_0_#1b2b3f] cursor-pointer"
                  title="Adelantar 10s"
                >
                  <RotateCw className="w-6 h-6 md:w-12 md:h-12 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Custom Bottom Progress Bar */}
            <div 
              className={`absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-3 max-w-3xl mx-auto">
                <span className="text-white text-[10px] md:text-xs font-bold font-mono w-8 md:w-10 drop-shadow-md">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 md:h-2 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 md:[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-3 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4648d4] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg cursor-pointer transition-all hover:[&::-webkit-slider-thumb]:scale-125"
                />
                <span className="text-white text-[10px] md:text-xs font-bold font-mono w-8 md:w-10 text-right drop-shadow-md">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Standard Dialog Card (When step !== 'video') */}
      {step !== 'video' && (
        <div 
          className={`fixed inset-0 z-50 p-4 bg-black/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto ${isAnyEvaluationNode ? 'cursor-default' : 'cursor-pointer'} animate-fadeIn`}
          onClick={isAnyEvaluationNode ? undefined : handleAttemptClose}
        >
          <div 
            className={`bg-white dark:bg-[#102034] rounded-3xl ${(isUnit2Exam || isUnit3Exam) && step === 'practice' && !showQuizResults ? 'p-3.5 sm:p-5 max-w-md' : 'p-6 max-w-sm'} w-full space-y-5 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] cursor-default my-auto transition-all duration-300 max-h-[96vh] overflow-y-auto`}
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
            {step !== 'vocal_diagnostic' && ((!isUnit2Exam && !isUnit3Exam) || step !== 'practice' || showQuizResults) && (
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${isUnit2Exam || isUnit3Exam ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500' : 'bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff]'} flex items-center justify-center`}>
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
                  <span className={`text-[11px] font-extrabold ${isUnit2Exam || isUnit3Exam ? 'text-amber-600 dark:text-amber-400' : 'text-[#4648d4] dark:text-[#c0c1ff]'} uppercase tracking-wider`}>
                    {isUnit2Exam || isUnit3Exam ? 'Evaluación de Módulo' : node.type === 'concept' ? 'Lección Teórica' : 'Lección Práctica'}
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
                    : node.instructions || 'Sigue las instrucciones para dominar el control diafragmático y mejorar tu tono vocal.'}
                </p>

                <button
                  onClick={() => {
                    audioService.playClickSound();
                    if (node.youtubeId) {
                      userRequestedPlayRef.current = true;
                      // 1. Synchronously trigger browser fullscreen on direct user gesture
                      try {
                        const el = document.documentElement;
                        if (el.requestFullscreen) {
                          el.requestFullscreen().catch(() => {});
                        } else if ((el as any).webkitRequestFullscreen) {
                          (el as any).webkitRequestFullscreen();
                        }
                      } catch (e) {}

                      // 2. Synchronously lock orientation to landscape
                      try {
                        if (window.screen?.orientation && (window.screen.orientation as any).lock) {
                          (window.screen.orientation as any).lock('landscape').catch(() => {});
                        }
                      } catch (e) {}

                      // 3. Immediately trigger play in the user gesture!
                      if (playerRef.current) {
                        try {
                          playerRef.current.unMute?.();
                          playerRef.current.setVolume?.(100);
                          playerRef.current.playVideo?.();
                          setIsPlaying(true);
                        } catch (e) {}
                      }

                      // 4. Set step to video
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

        {/* Step: Vocal Diagnostic Tool (For Class 7: Fisiología Vocal) */}
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

        {/* Step: Practice (Breathing, Quiz, or Unit 2 Tuner Pitch Challenge) */}
        {step === 'practice' && (
          <div className="space-y-4 text-center">
            {isUnit2Exam && !showQuizResults ? (
              /* Unit 2 Evaluation: Exactly Level 1 of Modo Fácil */
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
              /* Unit 3 Evaluation: Levels 9 to 12 of Modo Fácil (Tempo & Rhythm) */
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

                {/* Progress Step Pills (Levels 9-12) */}
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
                        <div className="flex items-center gap-0.5 text-[10px] uppercase tracking-wider">
                          {isPassed && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />}
                          <span>Nivel {lvl}</span>
                        </div>
                        <span className={`text-[9px] ${isCurrent ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {bpm} BPM
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Tuner Rhythm View for Current Level */}
                <TunerRhythmView
                  key={`u3-exam-rhythm-lvl-${currentUnit3Level}`}
                  level={currentUnit3Level}
                  pattern={currentUnit3Pattern}
                  bpm={currentUnit3Bpm}
                  hideExitButton={true}
                  onSuccess={handleUnit3RhythmStepSuccess}
                  onFail={() => {
                    if (onLoseLife) {
                      onLoseLife('tuner');
                    }
                  }}
                />
              </div>
            ) : (node.type === 'control' || (isExamNode && examStage === 'balloon')) && !showQuizResults ? (
              /* Breathing Balloon Exercise Stage */
              <div className="space-y-4 text-center animate-fadeIn">
                {isExamNode && examStage === 'balloon' && (
                  <div className="bg-indigo-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-200 dark:border-slate-700 text-left space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest block">
                        ETAPA INTERMEDIA DE EVALUACIÓN: LABIOS FRUNCIDOS
                      </span>
                      <span className="text-[10px] font-extrabold bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                        Rehabilitación y Presión Positiva
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      Inhala por la nariz profundo y lento. Luego, exhala por la boca con los labios fruncidos como soplando suavemente una vela sin apagarla. Realiza 2 repeticiones completas.
                    </p>
                  </div>
                )}
                {/* 3D Sunken Socket Outer Frame (Exact replica of Academia Unit Headers) */}
                <div className="w-full p-1.5 sm:p-[6px] rounded-[2.5rem] bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800">
                  <div className="w-full p-2 flex flex-col items-center justify-center rounded-[2rem] bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
                    
                    {/* Embedded 3D Card Stage Seated Inside the Socket */}
                    <div className="w-full bg-gradient-to-b from-[#ffffff] to-[#f1f5f9] dark:from-[#0b1828] dark:to-[#09111c] rounded-3xl p-6 border border-white/80 dark:border-white/10 flex flex-col items-center justify-center relative min-h-[320px] shadow-[0px_6px_0px_0px_rgba(180,190,210,0.8)] dark:shadow-[0px_6px_0px_0px_rgba(10,15,30,0.9)] overflow-hidden">
                      
                      {/* Vertical Color Selector Palette (Positioned on the right side of the balloon) */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg z-30 animate-fadeIn">
                        {BALLOON_COLOR_THEMES.map((theme, idx) => (
                          <button
                            key={theme.id}
                            onClick={() => {
                              audioService.playClickSound();
                              setBalloonThemeIdx(idx);
                            }}
                            className={`w-5 h-5 rounded-full transition-all duration-300 press-effect cursor-pointer ${theme.bgCircle} ${
                              balloonThemeIdx === idx
                                ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                                : 'opacity-60 hover:opacity-100 hover:scale-110'
                            }`}
                            title={theme.name}
                          />
                        ))}
                      </div>

                      {/* Top Phase Pill */}
                      <div className="bg-blue-100/90 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border border-blue-300/80 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-xs flex items-center gap-2 mb-3 animate-pulse">
                        <Zap className="w-3.5 h-3.5 text-blue-500" />
                        <span>{currentBalloonStep.label}</span>
                        <span className="opacity-70">({balloonSecsLeft}s)</span>
                      </div>

                      {/* Balloon Stage */}
                      <div className="relative w-52 h-52 flex items-center justify-center">
                        {/* Glow ring */}
                        <div 
                          className="absolute rounded-full transition-all duration-700 ease-out pointer-events-none"
                          style={{
                            width: `${160 * balloonScale}px`,
                            height: `${200 * balloonScale}px`,
                            backgroundColor: currentBalloonStep.type === 'inhale' ? 'rgba(244,63,94,0.35)' : currentBalloonStep.type === 'hold_full' ? 'rgba(168,85,247,0.35)' : 'rgba(16,185,129,0.35)',
                            filter: 'blur(20px)'
                          }}
                        />

                        {/* Balloon Body */}
                        <div 
                          className="relative transition-transform duration-500 ease-out flex flex-col items-center justify-center"
                          style={{
                            transform: `scale(${balloonScale})`,
                            filter: `drop-shadow(0 15px 25px ${currentBalloonTheme.glowRgb})`
                          }}
                        >
                          <div className={`w-36 h-44 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] bg-gradient-to-tr ${currentBalloonTheme.gradient} relative overflow-hidden flex items-center justify-center shadow-inner transition-all duration-500`}>
                            <div className="absolute top-3 left-4 w-12 h-16 bg-white/40 rounded-full blur-[2px] transform -rotate-25" />
                            <div className="absolute top-5 left-7 w-4 h-6 bg-white/70 rounded-full blur-[1px] transform -rotate-25" />
                            
                            <div className="z-10 text-center drop-shadow-md text-white">
                              <span className="font-heading font-black text-4xl block leading-none">
                                {balloonSecsLeft}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 mt-1">
                                {currentBalloonStep.type === 'inhale' ? 'INHALAR' : currentBalloonStep.type === 'hold_full' ? 'RETENER' : 'EXHALAR'}
                              </span>
                            </div>
                          </div>

                          <div className={`w-5 h-3 rounded-b-md -mt-0.5 ${currentBalloonTheme.knotColor} shadow-xs transition-colors duration-500`} />
                          <svg className="w-12 h-10 -mt-0.5 overflow-visible" viewBox="0 0 50 40">
                            <path d="M 25 0 Q 15 15 25 25 T 25 40" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 2" className="opacity-70" />
                          </svg>
                        </div>
                      </div>

                      {/* Cycle Dots / Repetition Badges */}
                      <div className="mt-3 flex items-center justify-center gap-3">
                        {[0, 1].map((dotIdx) => (
                          <div 
                            key={dotIdx} 
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
                              balloonCycles > dotIdx
                                ? 'bg-emerald-500 text-white scale-105 shadow-xs'
                                : balloonCycles === dotIdx && balloonActive
                                  ? 'bg-pink-500 text-white scale-105 shadow-xs animate-pulse'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-60 scale-95'
                            }`}
                          >
                            {balloonCycles > dotIdx ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            <span>Repetición {dotIdx + 1} de 2</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setBalloonActive(!balloonActive);
                    }}
                    className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-black text-sm flex items-center justify-center gap-2 shadow-lg press-effect cursor-pointer"
                  >
                    {balloonActive ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                    <span>{balloonActive ? 'Pausar Ejercicio' : 'Iniciar Ejercicio'}</span>
                  </button>

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setBalloonActive(false);
                      setBalloonTotalSecs(0);
                    }}
                    className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 press-effect shrink-0 cursor-pointer"
                    title="Reiniciar Ejercicio"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : showQuizResults ? (
              /* Star Evaluation Results Stage */
              <div className="py-4 text-center space-y-5 animate-scaleIn">
                {/* Cascade Animated Stars Display */}
                <div className="relative flex items-center justify-center gap-4 py-4 my-2">
                  {/* Expanding Climax Shockwave Ring for 3rd Star */}
                  {star3Climax && (
                    <div className="absolute w-44 h-44 rounded-full border-4 border-amber-400/80 animate-ping pointer-events-none" />
                  )}
                  {[1, 2, 3].map((starNum) => {
                    const isEarned = starNum <= earnedStars;
                    const isHalfStar = starNum === 3 && earnedStars === 2.5;
                    const isStar3ClimaxTarget = starNum === 3 && star3Climax;
                    const wasRolledBackStar = isRollingBack && starNum > 1;

                    if (isHalfStar) {
                      const grandClass = star3GrandJump
                        ? 'animate-grandStar3Jump z-50 pointer-events-none'
                        : star3StaticLanded
                          ? 'scale-110 rotate-0 z-10'
                          : 'animate-bounce scale-110 z-10';

                      return (
                        <div 
                          key={starNum}
                          className={`relative transform transition-all duration-500 ease-out flex items-center justify-center ${grandClass}`}
                        >
                          <svg 
                            className="w-14 h-14 md:w-16 md:h-16 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] transition-all duration-300" 
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <defs>
                              {/* Clip matching Lucide polygon star exactly */}
                              <clipPath id="lucideStarClip">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </clipPath>
                              {/* Left half box clip for golden stroke */}
                              <clipPath id="leftHalfBoxClip">
                                <rect x="0" y="0" width="12" height="24" />
                              </clipPath>
                            </defs>

                            {/* 1. Base Empty Star (Gray Fill & Gray Stroke for Right Half) */}
                            <polygon 
                              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
                              className="fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-600"
                            />

                            {/* 2. Golden Slow Liquid Wave Fill (Slow 4.8s oleaje) */}
                            <path
                              className="fill-amber-400 stroke-none"
                              clipPath="url(#lucideStarClip)"
                              d="M 0 0 L 13 0 Q 16.5 6 10.5 12 Q 7.5 18 13.5 24 L 0 24 Z"
                            >
                              <animate 
                                attributeName="d" 
                                values="
                                  M 0 0 L 13 0 Q 16.5 6 10.5 12 Q 7.5 18 13.5 24 L 0 24 Z;
                                  M 0 0 L 10.5 0 Q 7.5 6 13.5 12 Q 16.5 18 10.5 24 L 0 24 Z;
                                  M 0 0 L 13 0 Q 16.5 6 10.5 12 Q 7.5 18 13.5 24 L 0 24 Z
                                "
                                dur="4.8s"
                                repeatCount="indefinite"
                              />
                            </path>

                            {/* 3. Golden Star Outline Stroke (Clipped ONLY to Left Half) */}
                            <polygon 
                              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
                              className="fill-none text-amber-400"
                              clipPath="url(#leftHalfBoxClip)"
                            />
                          </svg>

                          {/* Sparkles on Grand Jump */}
                          {star3GrandJump ? (
                            <Sparkles className="w-8 h-8 text-yellow-100 absolute -top-3 -right-3 animate-ping z-50" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-yellow-200 absolute -top-1 -right-1 animate-pulse" />
                          )}
                        </div>
                      );
                    }

                    const isIdleTarget = (starNum === 1 || starNum === 2) && starNum === idleTargetStar && starIdleEffect !== 'none';
                    const idleClass = isIdleTarget 
                      ? starIdleEffect === 'spin' 
                        ? 'animate-starJoySpin z-30' 
                        : 'animate-starWinkEye z-30'
                      : '';
                    const isStar3Full = starNum === 3 && earnedStars === 3;
                    const shouldBounceStar3 = starNum === 3 && isStar3ClimaxTarget && !star3StaticLanded && !star3GrandJump;
                    const grandStar3Class = isStar3Full
                      ? star3GrandJump
                        ? 'animate-grandStar3Jump z-50 pointer-events-none'
                        : star3StaticLanded
                          ? 'scale-110 rotate-0 z-10'
                          : shouldBounceStar3
                            ? 'scale-135 rotate-12 z-20'
                            : 'scale-110 rotate-0 z-10'
                      : '';

                    return (
                      <div 
                        key={starNum}
                        className={`relative transform transition-all duration-500 ease-out flex items-center justify-center ${
                          isEarned 
                            ? (starNum === 3 ? (shouldBounceStar3 ? 'scale-135 rotate-12 z-20' : 'scale-110 rotate-0 z-10') : 'scale-110 rotate-0 z-10')
                            : wasRolledBackStar
                              ? 'scale-75 opacity-30 grayscale animate-pulse'
                              : 'scale-75 opacity-25 grayscale'
                        } ${idleClass} ${grandStar3Class}`}
                      >
                        <Star 
                          className={`w-14 h-14 md:w-16 md:h-16 transition-all duration-300 ${
                            isEarned 
                              ? (starNum === 3 && shouldBounceStar3)
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,1)] animate-bounce'
                                : 'text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                              : wasRolledBackStar
                                ? 'text-rose-300 dark:text-rose-900 fill-rose-100 dark:fill-rose-950/50'
                                : 'text-slate-300 dark:text-slate-700 fill-slate-200 dark:fill-slate-800'
                          }`} 
                        />

                        {/* Climax Sparkles around 3rd Star */}
                        {isStar3ClimaxTarget && (
                          <>
                            <Sparkles className="w-6 h-6 text-yellow-200 absolute -top-2 -right-2 animate-ping" />
                            <Sparkles className="w-5 h-5 text-amber-300 absolute -bottom-1 -left-2 animate-pulse" />
                            <Zap className="w-5 h-5 text-cyan-300 absolute -top-2 -left-2 animate-bounce" />
                          </>
                        )}

                        {/* Sparkles on Grand Jump for 3rd full star */}
                        {isStar3Full && star3GrandJump && (
                          <Sparkles className="w-8 h-8 text-yellow-100 absolute -top-3 -right-3 animate-ping z-50" />
                        )}

                        {/* Wink Sparkle Burst */}
                        {isIdleTarget && starIdleEffect === 'wink' && (
                          <Sparkles className="w-7 h-7 text-yellow-100 absolute -top-3 -right-3 animate-ping z-40" />
                        )}

                        {/* Star 1 and 2 Sparkles */}
                        {isEarned && !isStar3ClimaxTarget && (
                          <Sparkles className="w-4 h-4 text-yellow-200 absolute -top-1 -right-1 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Score Header & Message */}
                <div className="space-y-1.5">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                    {isUnit3Exam
                      ? '¡Coordinación y Tempo Magistrales!'
                      : isUnit2Exam
                      ? '¡Afinación Perfecta!'
                      : node.id === 'u1-node7' || node.title?.includes('Fisiología Vocal')
                      ? '¡Diagnóstico Vocal Sincronizado!'
                      : node.type === 'control'
                      ? '¡Dominio Respiratorio!'
                      : quizScore === 4
                      ? '¡Desempeño Triunfal!'
                      : quizScore === 3
                      ? '¡Muy Buen Trabajo!'
                      : quizScore === 2
                      ? '¡Buen Trabajo!'
                      : totalWipeout
                      ? '¡0 de 4! Derrota Total'
                      : 'Debes Repetir el Quiz'}
                  </h3>
                  <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 px-2 leading-relaxed">
                    {isUnit3Exam
                      ? '¡Excelente sentido del ritmo! Has superado con éxito los 4 niveles de tempo (Nivel 9 al 12 del Modo Fácil) sincronizando bombo y palmas al pulso exacto. ¡Evaluación de Unidad 3 superada!'
                      : isUnit2Exam
                      ? '¡Excelente precisión vocal! Has completado el Nivel 1 del Modo Fácil afinando cada una de las 3 notas correctamente. ¡Evaluación de Unidad 2 superada!'
                      : node.id === 'u1-node7' || node.title?.includes('Fisiología Vocal')
                      ? '¡Excelente! Tu rango vocal y perfil tímbrico fueron registrados con éxito. Toda la app ha adaptado sus ejercicios a tu voz.'
                      : node.type === 'control'
                      ? '¡Excelente! Dominaste el anclaje intercostal y la resistencia pulmonar con técnica perfecta.'
                      : quizScore === 4
                      ? '¡Excelente! Respondiste correctamente las 4 preguntas del Quiz con puntuación perfecta.'
                      : quizScore === 3
                      ? 'Obtuviste 3 de 4 respuestas correctas. ¡Muy gran avance!'
                      : quizScore === 2
                      ? 'Obtuviste 2 de 4 respuestas correctas. ¡Aprobaste la lección!'
                      : totalWipeout
                      ? '¡Te quitaron hasta la última estrella porque no acertaste ninguna! Repasa el video e inténtalo de nuevo.'
                      : 'Obtuviste 1 de 4 respuestas correctas. Repasa el video e inténtalo de nuevo.'}
                  </p>
                </div>

                {/* Rewards / Alert Badge */}
                {quizScore >= 2 ? (
                  <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2 rounded-full text-xs font-black shadow-xs">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>+{node.xpReward || (quizScore === 4 ? 30 : quizScore === 3 ? 25 : 20)} XP Recompensados</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-full text-xs font-black">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>{isExamNode ? 'Examen no superado: -1 Vida' : 'Se requieren mínimo 2 respuestas correctas'}</span>
                  </div>
                )}

                {/* Action Buttons */}
                {quizScore >= 2 ? (
                  <button
                    onClick={() => {
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
                    className="w-full py-4 rounded-full tactile-btn-success font-heading font-black text-sm cursor-pointer shadow-lg press-effect mt-2"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if ((userStats?.lives ?? 1) <= 0) {
                        audioService.playClickSound();
                        onClose();
                        if (onOpenRecoveryExam) {
                          onOpenRecoveryExam();
                        } else if (onOpenStore) {
                          onOpenStore();
                        }
                        return;
                      }
                      audioService.playClickSound();
                      setQuizQuestionIdx(0);
                      setQuizAnswers([null, null, null, null]);
                      setUnit3ExamLevelIndex(0);
                      setUnit3ExamScores([]);
                      setShowQuizResults(false);
                    }}
                    className="w-full py-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-sm cursor-pointer shadow-lg press-effect mt-2 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>{(userStats?.lives ?? 1) <= 0 ? 'Sin vidas (Recuperar vida gratis)' : (isExamNode ? 'Reintentar Examen (-1 vida si fallas)' : 'Reintentar Quiz')}</span>
                  </button>
                )}
              </div>
            ) : (
              /* Concept Quiz Questions Stage */
              <div className="space-y-4 text-left animate-fadeIn">
                <div className="flex items-center justify-between bg-indigo-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-indigo-100 dark:border-slate-700">
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
                    {isExamNode ? `EVALUACIÓN DE MÓDULO (${quizQuestionIdx + 1}/${activeQuestions.length})` : `QUIZ DE COMPROBACIÓN (${quizQuestionIdx + 1}/4)`}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                    {isExamNode ? 'Módulo 1' : 'Clase 1'}
                  </span>
                </div>

                <p className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-snug">
                  {activeQuestions[quizQuestionIdx]?.question}
                </p>

                <div className="space-y-2.5">
                  {activeQuestions[quizQuestionIdx]?.options.map((optText, optIdx) => {
                    const isSelected = quizAnswers[quizQuestionIdx] === optIdx;
                    const isCorrect = optIdx === activeQuestions[quizQuestionIdx]?.correctAnswer;
                    const hasAnsweredCurrent = quizAnswers[quizQuestionIdx] !== null;
                    
                    let btnStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80';
                    
                    if (isSelected) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-extrabold shadow-sm';
                      } else {
                        btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-extrabold shadow-sm';
                      }
                    } else if (hasAnsweredCurrent && isCorrect) {
                      btnStyle = 'border-emerald-400/70 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold';
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={hasAnsweredCurrent}
                        onClick={() => {
                          if (hasAnsweredCurrent) return;
                          audioService.playClickSound();
                          const updated = [...quizAnswers];
                          updated[quizQuestionIdx] = optIdx;
                          setQuizAnswers(updated);
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-xs md:text-sm font-bold text-left transition-all flex items-center justify-between ${
                          hasAnsweredCurrent ? 'cursor-default' : 'cursor-pointer press-effect'
                        } ${btnStyle}`}
                      >
                        <span>{optText}</span>
                        {isSelected && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                        )}
                        {isSelected && !isCorrect && (
                          <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card matching user screenshot with high-contrast palette */}
                {quizAnswers[quizQuestionIdx] !== null && (
                  <div className={`p-4 rounded-2xl border transition-all animate-fadeIn space-y-1 ${
                    quizAnswers[quizQuestionIdx] === activeQuestions[quizQuestionIdx]?.correctAnswer
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                      : 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                  }`}>
                    <span className={`text-[11px] font-black uppercase tracking-wider block ${
                      quizAnswers[quizQuestionIdx] === activeQuestions[quizQuestionIdx]?.correctAnswer
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}>
                      {quizAnswers[quizQuestionIdx] === activeQuestions[quizQuestionIdx]?.correctAnswer
                        ? 'RESPUESTA CORRECTA'
                        : 'RESPUESTA INCORRECTA'}
                    </span>
                    <p className="text-xs font-semibold leading-relaxed">
                      {activeQuestions[quizQuestionIdx]?.explanation}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleNextQuizQuestion}
                  disabled={quizAnswers[quizQuestionIdx] === null}
                  className={`w-full py-3.5 rounded-full font-heading font-bold text-sm mt-3 transition-all ${
                    quizAnswers[quizQuestionIdx] !== null 
                      ? 'tactile-btn-primary cursor-pointer' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {quizQuestionIdx < activeQuestions.length - 1
                    ? `Siguiente Pregunta (${quizQuestionIdx + 1}/${activeQuestions.length})`
                    : `Finalizar Evaluación (${activeQuestions.length}/${activeQuestions.length})`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-bold text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
                ¡Lección Completada!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
                {getSuccessDescription()}
              </p>
            </div>

            {node.status === 'completed' ? (
              <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-full font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-500" />
                <span>Repaso Finalizado</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-4 py-2 rounded-full font-bold text-sm">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>+{node.xpReward} XP Recompensados</span>
              </div>
            )}

            <button
              onClick={handleClaimLesson}
              className="w-full py-3.5 rounded-full tactile-btn-success font-heading font-bold text-sm cursor-pointer shadow-md"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  )}

      {/* Exit Confirmation Dialog Overlay */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl border border-red-100 dark:border-red-950 text-center animate-scaleIn cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
                ¿Salir de la lección?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Si abandonas ahora, perderás el progreso de esta lección o ejercicio en curso.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  audioService.playClickSound();
                  setShowExitConfirm(false);
                }}
                className="w-full py-3 rounded-full tactile-btn-primary font-heading font-bold text-xs cursor-pointer"
              >
                Continuar practicando
              </button>

              <button
                onClick={() => {
                  audioService.playCloseSound();
                  unlockOrientation();
                  onClose();
                }}
                className="w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 font-heading font-bold text-xs transition-colors cursor-pointer"
              >
                Abandonar lección
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LessonModal;
