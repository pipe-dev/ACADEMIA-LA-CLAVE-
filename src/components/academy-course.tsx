'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, CheckCircle2, Trophy, ArrowLeft, ChevronLeft, ChevronRight, Wind, Heart, RotateCcw, Video, Sparkles, Lock, Clock, Check, Eye, Music, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { lessons, type Lesson, type CourseExercise } from '@/lib/course-data';
import { dbSave, dbLoad } from '@/lib/db';
import { cn } from '@/lib/utils';
import { useDailyQuests } from '@/hooks/use-daily-quests';
import { VocalPolygraph } from './vocal-polygraph';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';

const quizQuestions1 = [
  {
    question: "¿Cuál es la postura correcta?",
    options: [
      "Estar lo más rígido y tenso posible con los hombros levantados.",
      "Flexionar el cuello hacia adelante y sentarse encorvado.",
      "Hombros y piernas a la misma anchura y todo el cuerpo relajado, sin tensión excesiva.",
      "Mantener los brazos cruzados y las rodillas bloqueadas."
    ],
    correctAnswerIdx: 2,
    explanation: "Tener los hombros y las piernas a la misma anchura con el cuerpo relajado ayuda a cantar de forma cómoda y sin tensiones."
  },
  {
    question: "¿Qué tipo de respiración es fundamental en el canto?",
    options: [
      "Respiración clavicular o de pecho alto.",
      "Respiración diafragmática.",
      "Respiración rápida por la boca.",
      "Respiración conteniendo el aire en la garganta."
    ],
    correctAnswerIdx: 1,
    explanation: "La respiración diafragmática es la base del apoyo para cantar de manera sana y sostenida."
  },
  {
    question: "¿Cuáles son las zonas más comunes del cuerpo donde acumulamos tensión que perjudica la afinación?",
    options: [
      "La mandíbula, el cuello, la lengua y los hombros.",
      "Las rodillas y los talones del pie.",
      "Los dedos de las manos y las muñecas.",
      "La espalda baja y los omóplatos únicamente."
    ],
    correctAnswerIdx: 0,
    explanation: "La mandíbula, el cuello, la lengua y los hombros son los principales acumuladores de tensión vocal."
  },
  {
    question: "Para cantar frases largas sin sentir que te falta el aire, ¿cómo debes respirar correctamente?",
    options: [
      "Empujando todo el aire con fuerza de golpe al iniciar la frase.",
      "Reteniendo el aire en el pecho sin dejarlo salir.",
      "Respirando muy rápido después de cada palabra.",
      "Regulando el flujo de aire gastando solo el aire necesario y sin tensionar excesivamente la garganta."
    ],
    correctAnswerIdx: 3,
    explanation: "Dosificar y regular el aire gastando solo lo necesario y sin tensar la garganta te permite sostener notas largas cómodamente."
  }
];

const quizQuestions6 = [
  {
    question: "¿Dónde se encuentra ubicado el diafragma en el cuerpo humano, según la explicación del video?",
    options: [
      "Debajo de los pulmones o costillas y arriba del estómago.",
      "En la parte superior del pecho, cerca de las clavículas.",
      "En la zona lumbar de la espalda.",
      "En la base del cuello, rodeando la laringe."
    ],
    correctAnswerIdx: 0,
    explanation: "El diafragma se encuentra debajo de los pulmones o costillas y arriba del estómago, actuando como el motor del soporte respiratorio."
  },
  {
    question: "En el canto, la respiración se divide en tres fases (inhalación, mantenimiento y exhalación). Según el video, ¿cuál de ellas es la más importante y difícil de controlar?",
    options: [
      "La inhalación, porque debemos tomar todo el aire posible muy rápido.",
      "El mantenimiento, porque exige cerrar la garganta con fuerza.",
      "La exhalación, porque debes aprender a gastar el aire poco a poco para que te rinda cuando cantas.",
      "Ninguna, todas se controlan de forma automática sin esfuerzo."
    ],
    correctAnswerIdx: 2,
    explanation: "La exhalación es la más importante y difícil de regular, ya que debemos aprender a dosificar y gastar el aire gradualmente para que nos rinda al cantar."
  },
  {
    question: "Al realizar el ejercicio de exhalar prolongadamente con un sonido siseante (letra S prolongada), ¿cuál es el tiempo mínimo recomendado que debe mantenerse dependiendo del género?",
    options: [
      "Para mujeres unos 5-10 segundos, y para hombres 10-15 segundos.",
      "Para mujeres unos 15-20 segundos, y para hombres 25-30 segundos.",
      "Para mujeres unos 30-40 segundos, y para hombres 45-50 segundos.",
      "No hay tiempo mínimo recomendado en el video."
    ],
    correctAnswerIdx: 1,
    explanation: "El instructor establece que para las mujeres el tiempo recomendado es de unos 15-20 segundos, y para los hombres de 25-30 segundos para asegurar una dosificación óptima de aire."
  },
  {
    question: "Cuando realizas el ejercicio emitiendo prolongadamente la consonante 'M', ¿qué sensación física es la correcta y qué síntoma es una señal de que debes parar?",
    options: [
      "Debes sentir vibración en la zona nasal o de la cabeza y parar si sientes esfuerzo vocal.",
      "Debes sentir dolor en la garganta y continuar para fortalecer las cuerdas vocales.",
      "Debes sentir presión o falta de aire en el pecho y parar si te da mareo.",
      "No debes sentir ninguna vibración, solo flujo libre de aire por la nariz."
    ],
    correctAnswerIdx: 0,
    explanation: "Este ejercicio ayuda a activar los resonadores superiores. Debes percibir cosquilleo o vibración en la nariz y parar de inmediato si sientes esfuerzo vocal, picazón o dolor."
  }
];

const quizQuestions7 = [
  {
    question: "Cuando estás intentando llegar a una nota más alta o exigente en una canción, ¿qué debería pasar físicamente en tu cuello?",
    options: [
      "Debe mantenerse relajado, sin que las venas se marquen ni sientas que te estás ahogando.",
      "Debe tensionarse lo suficiente para forzar el paso del aire con potencia.",
      "Debe estirarse hacia adelante y las venas deben marcarse para resonar mejor.",
      "Debe contraerse firmemente cerrando la laringe por completo."
    ],
    correctAnswerIdx: 0,
    explanation: "Para alcanzar notas altas de forma sana, el cuello y la garganta deben estar completamente relajados y sin tensiones."
  },
  {
    question: "Si a mitad de un ensayo empiezas a sentir ardor, dolor o que tu voz se vuelve repentinamente ronca, ¿qué es lo más inteligente que debes hacer?",
    options: [
      "Cantar en un registro más agudo para descansar las zonas adoloridas.",
      "Detenerte inmediatamente y dejar descansar la voz, porque el canto bien hecho nunca debe doler.",
      "Beber agua fría y continuar con más intensidad para calentar la voz.",
      "Seguir ensayando hasta terminar la canción a pesar de la molestia."
    ],
    correctAnswerIdx: 1,
    explanation: "El canto nunca debe doler. Ante cualquier molestia, ardor o ronquera repentina, lo inteligente y sano es detenerse y dejar descansar la voz."
  },
  {
    question: "¿Qué son los resonadores?",
    options: [
      "Filtros de aire ubicados en los bronquios que aumentan el volumen pulmonar.",
      "Músculos ubicados en los hombros que se contraen para proyectar la voz.",
      "Espacios huecos en mi pecho, boca y nariz que ayudan a que mi voz sea más bonita, nítida y con mejor volumen.",
      "Cuerdas vocales secundarias que vibran a frecuencias más graves."
    ],
    correctAnswerIdx: 2,
    explanation: "Los resonadores son las cavidades huecas del cuerpo (como pecho, boca y nariz) donde el sonido de la voz rebota, amplificándose y mejorando su color y volumen."
  }
];

const quizQuestions12_5 = [
  {
    question: "¿Por qué es importante realizar un calentamiento específico antes de cantar repertorio exigente?",
    options: [
      "Para aumentar el tamaño de las cuerdas vocales permanentemente.",
      "Para preparar los músculos vocales, evitar lesiones y mejorar la agilidad y precisión.",
      "Para memorizar la letra de la canción más rápido.",
      "Para lograr cantar más fuerte sin usar el apoyo diafragmático."
    ],
    correctAnswerIdx: 1,
    explanation: "El calentamiento vocal funciona igual que el calentamiento deportivo: prepara la musculatura, previene lesiones, y activa la conexión correcta de aire y resonancia."
  },
  {
    question: "¿Qué papel juegan los ejercicios de tracto semi-ocluido (como trompetillas o usar una pajilla) en el calentamiento?",
    options: [
      "Secan las cuerdas vocales para que vibren más rápido.",
      "Generan una resistencia de aire que ayuda a relajar y equilibrar las presiones dentro de la laringe.",
      "Eliminan completamente la mucosidad de la garganta.",
      "Solo sirven para calentar los labios pero no ayudan a las cuerdas vocales."
    ],
    correctAnswerIdx: 1,
    explanation: "Los ejercicios de tracto vocal semi-ocluido envían presión de aire de regreso a las cuerdas vocales, dándoles un 'masaje' y promoviendo un cierre más suave y eficiente."
  },
  {
    question: "Si durante el calentamiento sientes dolor o tensión excesiva en la garganta, ¿cuál es el paso correcto a seguir?",
    options: [
      "Continuar con más intensidad para que el músculo se acostumbre.",
      "Detenerse, relajar, revisar la técnica de respiración y hacer ejercicios más suaves como sirenas de labio.",
      "Tomar una bebida muy fría para desinflamar al instante y seguir.",
      "Cantar canciones agudas directamente para forzar la apertura de la laringe."
    ],
    correctAnswerIdx: 1,
    explanation: "El dolor o tensión es un indicador de que algo anda mal. Detenerse y reiniciar con ejercicios suaves asegura que no lastimes tu voz antes de empezar."
  },
  {
    question: "¿Cuál es la postura ideal del cuerpo para facilitar un canto saludable y eficiente?",
    options: [
      "Cabeza hacia arriba estirando el cuello y hombros levantados.",
      "Hombros relajados, pecho abierto y ligeramente elevado, rodillas sin bloquear y pies separados.",
      "Sentado encorvado para relajar los músculos del abdomen.",
      "Mentón pegado al pecho y abdomen fuertemente contraído en todo momento."
    ],
    correctAnswerIdx: 1,
    explanation: "Una postura corporal alineada, con el pecho abierto y hombros relajados, permite la correcta expansión de las costillas y evita tensiones innecesarias en el cuello y la laringe."
  },
  {
    question: "¿Qué ocurre físicamente durante la inhalación en la respiración costo-diafragmática?",
    options: [
      "Los hombros se elevan bruscamente para llenar la parte superior de los pulmones.",
      "El diafragma desciende, las costillas inferiores se expanden y la zona abdominal sale ligeramente.",
      "El estómago se contrae fuertemente hacia adentro empujando los pulmones.",
      "El diafragma sube hacia la garganta para abrir el tracto vocal."
    ],
    correctAnswerIdx: 1,
    explanation: "Al inhalar, el diafragma baja aplanándose y empuja las vísceras (lo que hace salir el abdomen), permitiendo que los pulmones se llenen de aire desde su base y las costillas se expandan."
  },
  {
    question: "¿Dónde se ubican exactamente las cuerdas vocales?",
    options: [
      "En el paladar blando, cerca de la campanilla.",
      "En la laringe (la caja de la voz), detrás del cartílago tiroides.",
      "Dentro de la tráquea, justo antes de los pulmones.",
      "En la cavidad nasal, para resonar el aire."
    ],
    correctAnswerIdx: 1,
    explanation: "Las cuerdas (o pliegues) vocales están protegidas dentro de la laringe, ubicadas horizontalmente justo detrás del cartílago tiroides (la 'manzana de Adán')."
  },
  {
    question: "¿Qué cambio físico experimentan las cuerdas vocales al producir sonidos agudos (como en voz de cabeza)?",
    options: [
      "Se vuelven más cortas, gruesas y vibran lentamente.",
      "Se separan por completo para dejar salir más aire.",
      "Se estiran, se vuelven más delgadas (finitas) y vibran mucho más rápido.",
      "Se endurecen como huesos y no vibran, solo resuenan."
    ],
    correctAnswerIdx: 2,
    explanation: "Para alcanzar notas más altas (frecuencias mayores), las cuerdas vocales se alargan y adelgazan, permitiéndoles vibrar a mayor velocidad."
  }
];

import { usePitchDetection } from '@/hooks/use-pitch-detection';
import { PitchGauge } from './pitch-gauge';
import { generateChallenge } from './tuner';
import type { NoteInfo } from './tuner';
import { MiniTunerWidget } from './mini-tuner-widget';

interface AcademyCourseProps {
  onGoBack?: () => void;
  notePool?: NoteInfo[];
  gender?: 'masculino' | 'femenino' | null;
  vocalRangeKey?: string | null;
}

export function AcademyCourse({ onGoBack, notePool, gender, vocalRangeKey }: AcademyCourseProps) {
  const { toast } = useToast();
  const dailyQuests = useDailyQuests();

  // Selected Lesson & Exercise Index
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number>(0); // 0, 1, or 2
  
  // Progress/DB State (Maps Lesson ID to an array of 3 booleans [ex1, ex2, ex3])
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean[]>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Breathing Exercise State
  const [exerciseActive, setExerciseActive] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale' | 'success' | 'fail'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalPhaseDuration, setTotalPhaseDuration] = useState(1);

  // Video looping state for Shorts (Classes 2-5)
  const [videoLoopCount, setVideoLoopCount] = useState<number>(0);

  // Quiz State for Lesson 1
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizQuestionIdx, setCurrentQuizQuestionIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // GSAP animation refs
  const breathButtonRef = useRef<HTMLButtonElement>(null);
  
  // Timers and references
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const isHoldingButtonRef = useRef<boolean>(false);
  
  // YouTube refs
  const playerRef = useRef<any>(null);
  const selectedLessonRef = useRef<Lesson | null>(null);
  const loopCounterRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredQuizForVideoRef = useRef<boolean>(false);
  const hasAutoCompletedVideoRef = useRef<boolean>(false);
  const videoProgressRef = useRef<Record<number, number>>({});

  // Load progress from IndexedDB
  useEffect(() => {
    dbLoad<Record<number, boolean[]>>('afinapp_completed_exercises')
      .then(saved => {
        if (saved) setCompletedExercises(saved);
        return dbLoad<Record<number, number>>('afinapp_video_progress');
      })
      .then(savedProgress => {
        if (savedProgress) videoProgressRef.current = savedProgress;
        setIsLoadingProgress(false);
      })
      .catch(err => {
        console.error("Error loading progress:", err);
        setIsLoadingProgress(false);
      });
  }, []);

  // Update selected lesson reference
  useEffect(() => {
    selectedLessonRef.current = selectedLesson;
  }, [selectedLesson]);

  // Set first incomplete exercise as default when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      if (selectedLesson.exercises.length > 0) {
        const lessonProgress = completedExercises[selectedLesson.id] || [];
        let incompleteIdx = -1;
        for (let i = 0; i < selectedLesson.exercises.length; i++) {
          if (!lessonProgress[i]) {
            incompleteIdx = i;
            break;
          }
        }
        if (incompleteIdx !== -1) {
          setSelectedExerciseIdx(incompleteIdx);
        } else {
          setSelectedExerciseIdx(0);
        }
      } else {
        setSelectedExerciseIdx(0);
      }
    }
  }, [selectedLesson, completedExercises]);

  // Handle YouTube Player creation & Shorts Looping (Classes 2-5)
  useEffect(() => {
    if (!selectedLesson) return;
    
    setVideoLoopCount(0);
    loopCounterRef.current = 0;
    hasTriggeredQuizForVideoRef.current = false;
    hasAutoCompletedVideoRef.current = false;
    let timerId: any = null;
    
    const initPlayer = () => {
      const elementId = "academy-yt-player";
      const element = document.getElementById(elementId);
      if (!element) return;
      
      // Clean up previous player if it exists
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying old player:", e);
        }
        playerRef.current = null;
      }
      
      try {
        const player = new (window as any).YT.Player(elementId, {
          videoId: selectedLesson.youtubeId,
          playerVars: {
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            autoplay: 1
          },
          events: {
            'onReady': (event: any) => {
              const currentLsn = selectedLessonRef.current;
              if (currentLsn) {
                const savedTime = videoProgressRef.current[currentLsn.id];
                if (savedTime && savedTime > 0) {
                  event.target.seekTo(savedTime, true);
                }
              }
            },
            'onStateChange': (event: any) => {
              const currentLsn = selectedLessonRef.current;
              if (!currentLsn) return;
              
              if (event.data === (window as any).YT.PlayerState.PLAYING) {
                if (!pollIntervalRef.current) {
                  pollIntervalRef.current = setInterval(() => {
                    if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
                      const currentTime = playerRef.current.getCurrentTime();
                      const duration = playerRef.current.getDuration();
                      
                      if (duration > 0) {
                        const timeRemaining = duration - currentTime;
                        
                        // Memory: Save progress every 5 seconds
                        const lastSavedTime = videoProgressRef.current[currentLsn.id] || 0;
                        if (Math.abs(currentTime - lastSavedTime) >= 5 && timeRemaining > 2) {
                          videoProgressRef.current[currentLsn.id] = currentTime;
                          dbSave('afinapp_video_progress', videoProgressRef.current).catch(console.error);
                        } else if (timeRemaining <= 2 && lastSavedTime !== 0) {
                          // Reset progress when finished
                          videoProgressRef.current[currentLsn.id] = 0;
                          dbSave('afinapp_video_progress', videoProgressRef.current).catch(console.error);
                        }

                        if (!completedExercises[currentLsn.id]?.[0]) {
                        
                        // 1. Quiz logic (25s before)
                        if (timeRemaining <= 25 && [1, 6, 7].includes(currentLsn.id) && !hasTriggeredQuizForVideoRef.current) {
                          hasTriggeredQuizForVideoRef.current = true;
                          setShowQuiz(true);
                        }

                        // 2. Auto-complete theoretical classes (15s before)
                        const isNormalTheory = currentLsn.exercises.length === 0 && ![1, 2, 3, 4, 5, 6, 7, 12.5].includes(currentLsn.id);
                        if (timeRemaining <= 15 && isNormalTheory && !hasAutoCompletedVideoRef.current) {
                          hasAutoCompletedVideoRef.current = true;
                          const lessonId = currentLsn.id;
                          const nextStatus = [true, true, true];
                          setCompletedExercises(prev => {
                            const next = { ...prev, [lessonId]: nextStatus };
                            dbSave('afinapp_completed_exercises', next).catch(console.error);
                            return next;
                          });
                          
                          triggerConfetti();
                          playTone(659.25, 0.2);
                          setTimeout(() => playTone(783.99, 0.4), 150);
                          
                          toast({
                            variant: "accent",
                            title: "¡Lección completada!",
                            description: "Has terminado de ver el video de teoría.",
                            duration: 3000,
                          });
                        }
                      }
                      }
                    }
                  }, 1000);
                }
              } else {
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
              }

              if (event.data === (window as any).YT.PlayerState.ENDED) {
                if ([1, 6, 7].includes(currentLsn.id)) {
                  if (!hasTriggeredQuizForVideoRef.current) {
                    hasTriggeredQuizForVideoRef.current = true;
                    setShowQuiz(true);
                  }
                }
                const isShortLoop = currentLsn.id >= 2 && currentLsn.id <= 5 && currentLsn.exercises.length === 0;
                if (isShortLoop) {
                  loopCounterRef.current += 1;
                  setVideoLoopCount(loopCounterRef.current);
                  
                  if (loopCounterRef.current < 4) {
                    event.target.playVideo();
                    toast({
                      title: `Bucle de Clase Corta`,
                      description: `Reproduciendo por ${loopCounterRef.current + 1}ª vez (Meta: 4 veces)`,
                      duration: 3000,
                    });
                  } else {
                    // Mark as fully completed automatically
                    const lessonId = currentLsn.id;
                    const nextStatus = [true, true, true];
                    setCompletedExercises(prev => {
                      const next = { ...prev, [lessonId]: nextStatus };
                      dbSave('afinapp_completed_exercises', next).catch(console.error);
                      return next;
                    });
                    
                    triggerConfetti();
                    playTone(659.25, 0.2);
                    setTimeout(() => playTone(783.99, 0.4), 150);
                    
                    toast({
                      variant: "accent",
                      title: "¡Lección completada!",
                      description: "Has visto el short 4 veces. Avance registrado automáticamente.",
                      duration: 5000,
                    });
                  }
                } else if (currentLsn.exercises.length === 0 && ![1, 2, 3, 4, 5, 6, 7, 12.5].includes(currentLsn.id)) {
                  // Fallback for classes without exercises or quiz (e.g. Clases 8-11), complete automatically when video ends
                  if (!hasAutoCompletedVideoRef.current && !completedExercises[currentLsn.id]?.[0]) {
                    hasAutoCompletedVideoRef.current = true;
                    const lessonId = currentLsn.id;
                    const nextStatus = [true, true, true];
                    setCompletedExercises(prev => {
                      const next = { ...prev, [lessonId]: nextStatus };
                      dbSave('afinapp_completed_exercises', next).catch(console.error);
                      return next;
                    });
                    
                    triggerConfetti();
                    playTone(659.25, 0.2);
                    setTimeout(() => playTone(783.99, 0.4), 150);
                    
                    toast({
                      variant: "accent",
                      title: "¡Lección completada!",
                      description: "Has terminado de ver el video de teoría.",
                      duration: 3000,
                    });
                  }
                }
              }
            }
          }
        });
        playerRef.current = player;
      } catch (e) {
        console.error("Error creating YT.Player:", e);
      }
    };
    
    // Load script dynamically if not loaded
    if (!(window as any).YT || !(window as any).YT.Player) {
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      
      (window as any).onYouTubeIframeAPIReady = () => {
        timerId = setTimeout(initPlayer, 100);
      };
    } else {
      // Script already loaded, wait for the placeholder DOM element to render
      timerId = setTimeout(initPlayer, 150);
    }
    
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [selectedLesson, toast]);

  // Update practice time in daily quests while active in Academy
  useEffect(() => {
    const timer = setInterval(() => {
      dailyQuests.addMinutes(1);
    }, 60000);
    return () => clearInterval(timer);
  }, [dailyQuests]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    };
  }, []);

  // Trigger win confetti
  const triggerConfetti = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#3b82f6', '#10b981']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#3b82f6', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Sound generator helper for phases
  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio synthesis blockages
    }
  };

  // Fail the current exercise
  const failExercise = useCallback((message: string) => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    
    setPhase('fail');
    playTone(180, 0.4, 'triangle');

    // Deflate button to original size with bounce effect
    if (breathButtonRef.current) {
      gsap.killTweensOf(breathButtonRef.current);
      gsap.to(breathButtonRef.current, {
        scale: 1,
        duration: 0.5,
        ease: 'bounce.out',
      });
    }

    toast({
      variant: "destructive",
      title: "Ciclo de respiración interrumpido",
      description: message,
    });
  }, [toast]);

  const startExhalePhase = useCallback((exercise: CourseExercise) => {
    setPhase('exhale');
    const targetSeconds = exercise.exhaleSeconds || 4;
    setTimeLeft(targetSeconds);
    setTotalPhaseDuration(targetSeconds);
    phaseStartTimeRef.current = Date.now();
    
    playTone(523.25, 0.3); // Note C5 to signal release of button

    // Shrink button over the exhalation duration with GSAP
    if (breathButtonRef.current) {
      gsap.killTweensOf(breathButtonRef.current);
      gsap.to(breathButtonRef.current, {
        scale: 1.0,
        duration: targetSeconds,
        ease: 'linear',
      });
    }

    // Exhale countdown timer
    let count = targetSeconds;
    exerciseTimerRef.current = setInterval(() => {
      count -= 1;
      setTimeLeft(count);

      // Check if user accidentally pressed the button during the exhale phase
      if (isHoldingButtonRef.current) {
        clearInterval(exerciseTimerRef.current!);
        failExercise("¡Presionaste el botón durante la exhalación! Debes exhalar relajadamente con el botón libre.");
        return;
      }

      if (count <= 0) {
        clearInterval(exerciseTimerRef.current!);

        // Success!
        setPhase('success');
        triggerConfetti();
        playTone(659.25, 0.2);
        setTimeout(() => playTone(783.99, 0.4), 150);

        // Mark this specific exercise index (0, 1, or 2) as completed
        const lessonId = selectedLesson!.id;
        const currentStatus = completedExercises[lessonId] || [];
        const nextStatus = [...currentStatus];
        nextStatus[selectedExerciseIdx] = true;
        
        const nextCompleted = { ...completedExercises, [lessonId]: nextStatus };
        setCompletedExercises(nextCompleted);
        dbSave('afinapp_completed_exercises', nextCompleted).catch(console.error);

        // Notify daily quest progress
        dailyQuests.addNotes(4); 

        toast({
          variant: "accent",
          title: `¡Ejercicio ${selectedExerciseIdx + 1} Completado!`,
          description: `Has completado el ejercicio rítmico correctamente.`,
        });

        // Auto-advance or complete lesson
        let nextIncompleteIdx = -1;
        for (let i = 0; i < selectedLesson!.exercises.length; i++) {
          if (!nextStatus[i]) {
            nextIncompleteIdx = i;
            break;
          }
        }
        
        if (nextIncompleteIdx !== -1) {
          setTimeout(() => {
            setSelectedExerciseIdx(nextIncompleteIdx);
          }, 1500);
        } else {
          setTimeout(() => {
            handleManualComplete();
            setSelectedLesson(null);
          }, 1500);
        }
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLesson, selectedExerciseIdx, completedExercises, failExercise, dbSave, dailyQuests, toast]);

  const handleExerciseComplete = useCallback(() => {
    triggerConfetti();
    playTone(659.25, 0.2);
    setTimeout(() => playTone(783.99, 0.4), 150);

    const lessonId = selectedLesson!.id;
    const currentStatus = completedExercises[lessonId] || [];
    const nextStatus = [...currentStatus];
    nextStatus[selectedExerciseIdx] = true;
    
    const nextCompleted = { ...completedExercises, [lessonId]: nextStatus };
    setCompletedExercises(nextCompleted);
    dbSave('afinapp_completed_exercises', nextCompleted).catch(console.error);

    dailyQuests.addNotes(4); 

    toast({
      variant: "accent",
      title: `¡Ejercicio ${selectedExerciseIdx + 1} Completado!`,
      description: `Has completado el ejercicio con éxito.`,
    });
    
    setPhase('success');

    // Auto-advance to the next incomplete exercise
    let nextIncompleteIdx = -1;
    for (let i = 0; i < selectedLesson!.exercises.length; i++) {
      if (!nextStatus[i]) {
        nextIncompleteIdx = i;
        break;
      }
    }
    
    if (nextIncompleteIdx !== -1) {
      // Delay so they can see confetti for a second before changing tabs
      setTimeout(() => {
        setSelectedExerciseIdx(nextIncompleteIdx);
      }, 1000);
    } else {
      // Delay then return to course list
      setTimeout(() => {
        handleManualComplete();
        setSelectedLesson(null);
      }, 500);
    }
  }, [selectedLesson, selectedExerciseIdx, completedExercises, dbSave, dailyQuests, toast]);

  // Handle breath button press down (Inhale start)
  const handleBreathPress = () => {
    if (!exerciseActive) return;

    if (phase === 'success' || phase === 'fail') {
      startExercise();
      return;
    }
    
    if (phase !== 'idle') return;
    
    const exercise = selectedLesson!.exercises[selectedExerciseIdx];
    if (!exercise) return;
    const inhaleDuration = exercise.inhaleSeconds || 4;
    isHoldingButtonRef.current = true;
    setPhase('inhale');
    setTimeLeft(inhaleDuration);
    setTotalPhaseDuration(inhaleDuration);
    phaseStartTimeRef.current = Date.now();

    playTone(261.63, 0.2); // C4 note to start inhaling

    // Animate button expanding using GSAP
    if (breathButtonRef.current) {
      gsap.killTweensOf(breathButtonRef.current);
      gsap.to(breathButtonRef.current, {
        scale: 1.8,
        duration: inhaleDuration,
        ease: 'power1.inOut',
      });
    }

    // Inhale countdown timer
    let count = inhaleDuration;
    exerciseTimerRef.current = setInterval(() => {
      count -= 1;
      setTimeLeft(count);

      if (count <= 0) {
        clearInterval(exerciseTimerRef.current!);
        
        // Transition to Hold or Exhale
        const holdDuration = exercise.holdSeconds || 0;
        if (holdDuration > 0) {
          setPhase('hold');
          setTimeLeft(holdDuration);
          setTotalPhaseDuration(holdDuration);
          playTone(329.63, 0.2); // E4 note to hold

          let holdCount = holdDuration;
          exerciseTimerRef.current = setInterval(() => {
            holdCount -= 1;
            setTimeLeft(holdCount);

            if (holdCount <= 0) {
              clearInterval(exerciseTimerRef.current!);
              startExhalePhase(exercise);
            }
          }, 1000);
        } else {
          startExhalePhase(exercise);
        }
      }
    }, 1000);
  };

  // Handle breath button release
  const handleBreathRelease = () => {
    if (!exerciseActive) return;
    isHoldingButtonRef.current = false;

    // If released early in Inhale or Hold, it's a failure
    if (phase === 'inhale') {
      failExercise("Soltaste el botón antes de tiempo. ¡Debes inhalar continuamente mientras crece!");
    } else if (phase === 'hold') {
      failExercise("Soltaste el botón en la fase de retención. ¡Mantén el aire con el botón presionado!");
    }
  };

  const startExercise = () => {
    if (!selectedLesson) return;
    setExerciseActive(true);
    setPhase('idle');
    const exercise = selectedLesson.exercises[selectedExerciseIdx];
    if (!exercise) return;
    const inhaleDuration = exercise.inhaleSeconds || 4;
    setTimeLeft(inhaleDuration);
    setTotalPhaseDuration(inhaleDuration);
    isHoldingButtonRef.current = false;
  };

  // Exit/Cancel breathing exercise
  const cancelExercise = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    setExerciseActive(false);
    setPhase('idle');
    isHoldingButtonRef.current = false;
    
    // Scale button back to normal size
    if (breathButtonRef.current) {
      gsap.killTweensOf(breathButtonRef.current);
      gsap.to(breathButtonRef.current, {
        scale: 1,
        duration: 0.3,
      });
    }
  };

  // Return to list view (on mobile)
  const handleDeselect = () => {
    cancelExercise();
    setSelectedLesson(null);
  };

  // Mark introductory lessons (1-5) as completed manually
  const handleManualComplete = () => {
    if (!selectedLesson) return;
    
    const lessonId = selectedLesson.id;
    const nextStatus = [true, true, true]; // Completes the lesson
    
    setCompletedExercises(prev => {
      const next = { ...prev, [lessonId]: nextStatus };
      dbSave('afinapp_completed_exercises', next).catch(console.error);
      return next;
    });

    triggerConfetti();
    playTone(659.25, 0.2);
    setTimeout(() => playTone(783.99, 0.4), 150);

    toast({
      variant: "accent",
      title: "Lección completada",
      description: "La clase ha sido marcada como completada y vista.",
    });
  };

  // Calculate global exercise stats
  let totalExercisesCompleted = 0;
  let fullyCompletedClasses = 0;
  
  Object.entries(completedExercises).forEach(([_, arr]) => {
    const completedCount = arr.filter(Boolean).length;
    totalExercisesCompleted += completedCount;
    if (completedCount === 3) {
      fullyCompletedClasses += 1;
    }
  });

  const totalCourseExercises = lessons.reduce((sum, l) => sum + l.exercises.length, 0);
  const courseProgressPct = Math.round((fullyCompletedClasses / lessons.length) * 100);
  const activeExercise = selectedLesson?.exercises[selectedExerciseIdx];
  const isIntroductoryClass = selectedLesson && selectedLesson.exercises.length === 0;

  return (
    <div className="flex flex-1 flex-col sm:flex-row bg-background text-foreground overflow-hidden">
      
      {/* Sidebar: Lesson List */}
      <div className={cn(
        "w-full sm:w-80 md:w-96 flex flex-col border-r border-border/40 bg-card/10 shrink-0 h-full overflow-hidden transition-all duration-300",
        selectedLesson && "hidden sm:flex" // Hide list on mobile when playing a class
      )}>
        
        {/* Header inside list */}
        <header className="p-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            {onGoBack && (
              <Button onClick={onGoBack} variant="ghost" size="icon" className="h-8 w-8 rounded-full sm:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
                🎓 Academia Canto
              </h1>
              <p className="text-xs text-muted-foreground">Curso guiado de Técnica Vocal y Apoyo</p>
            </div>
          </div>

          {/* Global Progress Card */}
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-foreground">Clases Completadas</span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {fullyCompletedClasses}/{lessons.length}
              </span>
            </div>
            <Progress value={courseProgressPct} className="h-1.5 mb-2" />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-0.5">
                <Trophy className="w-3.5 h-3.5 text-accent" /> {totalExercisesCompleted} / {totalCourseExercises} Ejercicios
              </span>
              <span>{courseProgressPct}%</span>
            </div>
          </div>
        </header>

        {/* Scrollable Lesson Feed */}
        <ScrollArea className="flex-grow p-3 space-y-2 [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col gap-2 pb-6">
            {lessons.map((lesson, idx) => {
              const exerciseStatus = completedExercises[lesson.id] || [];
              const completedCount = exerciseStatus.filter(Boolean).length;
              const expectedCount = lesson.exercises?.length > 0 ? lesson.exercises.length : 3;
              const isClassComplete = completedCount >= expectedCount;
              const isSelected = selectedLesson?.id === lesson.id;
              
              // Unlocked logic: Lesson 1 is always unlocked. Next are unlocked if previous is complete
              const isUnlocked = idx === 0 || completedExercises[lessons[idx - 1].id] !== undefined;

              return (
                <button
                  key={lesson.id}
                  disabled={!isUnlocked}
                  onClick={() => {
                    cancelExercise();
                    setSelectedLesson(lesson);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden group",
                    isSelected 
                      ? "bg-primary/10 border-primary shadow-sm" 
                      : "bg-card/40 border-border/40 hover:bg-card/70 hover:border-border/80",
                    !isUnlocked && "opacity-40 cursor-not-allowed border-dashed bg-muted/5 hover:bg-muted/5"
                  )}
                >
                  {/* Progress Indicator Dots */}
                  <div className="flex flex-col items-center justify-start mt-0.5 shrink-0">
                    {isUnlocked ? (
                      isClassComplete ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 font-black text-[10px]">
                          ✓
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {lesson.id}
                        </div>
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted/20 border border-border/20 flex items-center justify-center text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Title & Stats */}
                  <div className="flex-grow min-w-0 pr-2">
                    <h3 className={cn(
                      "text-xs sm:text-sm font-bold leading-snug line-clamp-1 group-hover:text-primary transition-colors",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {lesson.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {lesson.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {lesson.duration} min
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase",
                        lesson.focus === 'Respiración' && 'bg-blue-500/10 text-blue-500',
                        lesson.focus === 'Afinación' && 'bg-amber-500/10 text-amber-500',
                        lesson.focus === 'Tempo' && 'bg-red-500/10 text-red-500',
                        lesson.focus === 'Técnica Vocal' && 'bg-purple-500/10 text-purple-500'
                      )}>
                        {lesson.focus}
                      </span>
                    </div>
                  </div>

                  {/* Completed Check/Fractions */}
                  {isUnlocked && (
                    <div className="absolute bottom-3 right-3 bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border/25 text-[8px] font-black text-emerald-500">
                      {lesson.exercises.length === 0 ? (
                        isClassComplete ? "Visto ✓" : "Intro"
                      ) : (
                        `${completedCount}/3 Ej.`
                      )}
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="absolute top-2 right-2 opacity-30">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Panel: Video Player & Breathing Widget */}
      <div className={cn(
        "flex-grow flex flex-col h-full overflow-hidden bg-background relative",
        !selectedLesson && "hidden sm:flex" // Hide main panel on mobile if no class selected
      )}>
        
        {selectedLesson ? (
          <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-10">
            
            {/* Header: Class Name (with Back button on mobile) */}
            <header className="p-3 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Button onClick={handleDeselect} variant="ghost" size="icon" className="h-8 w-8 rounded-full sm:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Clase {selectedLesson.id} de 33</span>
                  <h2 className="text-sm sm:text-base font-black truncate text-foreground">{selectedLesson.title}</h2>
                </div>
              </div>
              
              {/* Navigation controls */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  disabled={selectedLesson.id <= 1}
                  onClick={() => {
                    const idx = lessons.findIndex(l => l.id === selectedLesson.id);
                    if (idx > 0) {
                      cancelExercise();
                      setSelectedLesson(lessons[idx - 1]);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 rounded-lg font-bold gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Anterior</span>
                </Button>
                <Button
                  disabled={selectedLesson.id >= lessons.length || completedExercises[selectedLesson.id] === undefined}
                  onClick={() => {
                    const idx = lessons.findIndex(l => l.id === selectedLesson.id);
                    if (idx >= 0 && idx < lessons.length - 1) {
                      cancelExercise();
                      setSelectedLesson(lessons[idx + 1]);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2.5 rounded-lg font-bold gap-1"
                >
                  <span className="hidden xs:inline">Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </header>

            {/* Content Container */}
            <div className="p-4 max-w-4xl mx-auto w-full flex flex-col gap-4 flex-grow">
              
              {/* Video Player or Evaluation Panel */}
              {selectedLesson.youtubeId ? (
                <div key={selectedLesson.id} className="order-1 w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black aspect-video group">
                  <div
                    id="academy-yt-player"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : selectedLesson.exercises && selectedLesson.exercises.length > 0 ? null : (
                <div key={`eval-${selectedLesson.id}`} className="order-1 w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-gradient-to-br from-primary/10 via-background to-accent/5 aspect-video flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mb-2 text-foreground">{selectedLesson.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md">
                    {selectedLesson.description}
                  </p>
                  
                  {selectedLesson.exercises?.[0]?.type === 'pitch-matching' ? (
                    <div className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-full border border-primary/20 animate-pulse text-sm">
                      Desliza abajo y selecciona el Nivel 1 para comenzar 👇
                    </div>
                  ) : (
                    completedExercises[selectedLesson.id]?.[0] ? (
                      <div className="flex flex-col items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="w-8 h-8" />
                        <span className="text-sm font-bold">¡Evaluación Aprobada!</span>
                        <Button onClick={() => setShowQuiz(true)} variant="outline" className="mt-2 text-xs h-8 rounded-full">
                          Repetir Evaluación
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setShowQuiz(true)}
                        className="font-bold rounded-full bg-primary hover:bg-primary/95 text-white h-12 px-8 shadow-lg shadow-primary/25"
                      >
                        <Check className="w-5 h-5 mr-2" /> Iniciar Cuestionario
                      </Button>
                    )
                  )}
                </div>
              )}

              {/* Lesson Instructions & Details */}
              <div className="order-2 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                
                {/* Navigation Buttons (Replacing Description Card) */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => {
                      const idx = lessons.findIndex(l => l.id === selectedLesson.id);
                      if (idx > 0) {
                        cancelExercise();
                        setSelectedLesson(lessons[idx - 1]);
                      }
                    }} 
                    disabled={lessons.findIndex(l => l.id === selectedLesson.id) <= 0}
                    className="h-full min-h-[100px] rounded-2xl glass-panel bg-card/20 hover:bg-card/40 border-white/10 flex flex-col items-center justify-center gap-2 group transition-all"
                    variant="ghost"
                  >
                    <ChevronLeft className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-bold text-sm">Clase Anterior</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const idx = lessons.findIndex(l => l.id === selectedLesson.id);
                      if (idx >= 0 && idx < lessons.length - 1) {
                        cancelExercise();
                        setSelectedLesson(lessons[idx + 1]);
                      }
                    }}
                    disabled={(() => {
                      const idx = lessons.findIndex(l => l.id === selectedLesson.id);
                      return idx >= lessons.length - 1 || completedExercises[selectedLesson.id] === undefined;
                    })()}
                    className="h-full min-h-[100px] rounded-2xl glass-panel bg-card/20 hover:bg-card/40 border-white/10 flex flex-col items-center justify-center gap-2 group transition-all"
                    variant="ghost"
                  >
                    <ChevronRight className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-bold text-sm">Siguiente Clase</span>
                  </Button>
                </div>

                {/* Evaluation Progress status */}
                <Card className="glass-panel border-white/10 dark:border-white/5 bg-card/20 rounded-2xl flex flex-col justify-between">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-accent" /> Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-center items-center">
                    {(() => {
                      const lessonProgress = completedExercises[selectedLesson.id] || [];
                      const completedCount = lessonProgress.filter(Boolean).length;
                      const totalCount = selectedLesson.exercises?.length || 3;
                      const isComplete = completedCount === totalCount;
                      
                      return (
                        <div className="text-center space-y-2">
                          <span className="text-3xl font-black text-foreground">
                            {isComplete ? "Vista ✓" : isIntroductoryClass ? "Pendiente" : `${completedCount} / ${totalCount}`}
                          </span>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">
                            {isIntroductoryClass ? "Estado de Lección" : "ejercicios superados"}
                          </p>
                          {isComplete && (
                            <p className="text-[9px] bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded-full inline-block">
                              ✓ Completada
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Exercises Area (Dynamic conditional based on whether it is intro or practical) */}
              <div className={cn("w-full transition-all", !selectedLesson.youtubeId && selectedLesson.exercises && selectedLesson.exercises.length > 0 ? "order-first mb-4" : "order-3")}>
              {isIntroductoryClass ? (
                /* Introductory Lesson Panel (Lessons 2-5) */
                (selectedLesson.id >= 2 && selectedLesson.id <= 5) ? (
                  <div className="pt-8 pb-4 flex flex-col items-center animate-in fade-in space-y-8">
                    <p className="text-sm font-medium text-foreground text-center max-w-sm">
                      Esta clase se repetirá 4 veces para que puedas practicar
                    </p>

                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border text-sm font-black transition-all",
                            videoLoopCount >= idx 
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-110" 
                              : "bg-muted/10 text-muted-foreground/50 border-border/20"
                          )}
                        >
                          {idx}
                        </div>
                      ))}
                    </div>

                    {completedExercises[selectedLesson.id]?.[0] && (
                      <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-bold">¡Esta lección ya ha sido completada!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Ultra-clean UI for normal theoretical classes (e.g. Class 1, 6, 7, 8+) */
                  [1, 6, 7, 12.5].includes(selectedLesson.id) ? (
                    <div className="pt-8 pb-4 flex flex-col items-center animate-in fade-in">
                      {completedExercises[selectedLesson.id]?.[0] ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-bold">¡Esta lección ya ha sido completada!</span>
                          </div>
                          <Button onClick={() => setShowQuiz(true)} variant="outline" className="text-xs h-8 rounded-full border-emerald-500/20 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10">
                            📝 Repetir Cuestionario
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                            Por si quieres probar suerte...
                          </span>
                          <Button 
                            onClick={() => setShowQuiz(true)} 
                            variant="outline"
                            className="w-full sm:w-auto h-12 px-8 font-black rounded-full gap-2 shadow-lg text-primary border-primary/40 bg-primary/5 hover:bg-primary/20"
                          >
                            📝 Responder Cuestionario Teórico
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null
                )
              ) : (
                /* Practical Lesson Panel (Lessons 6-33) with 3 Breathing Exercises */
                <Card className="glass-panel border-white/10 dark:border-white/5 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-3xl overflow-hidden shadow-xl">
                  <CardHeader className="p-4 border-b border-border/40 bg-card/30 flex flex-row items-center justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base font-black flex items-center gap-1.5 truncate">
                        {activeExercise?.type === 'pitch-matching' ? (
                          <><Music className="w-5 h-5 text-emerald-500 shrink-0" /> Afinación Interactiva</>
                        ) : activeExercise?.type === 'vocal-range-polygraph' ? (
                          <><Activity className="w-5 h-5 text-purple-500 shrink-0" /> Espectrógrafo Vocal</>
                        ) : (
                          <><Wind className="w-5 h-5 text-blue-500 shrink-0" /> Ejercicios Prácticos de Apoyo Diafragmático</>
                        )}
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Selecciona y completa los {selectedLesson.exercises.length} ejercicios asignados a esta lección.
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedLesson.id === 6 && !completedExercises[6]?.[0] && (
                        <Button 
                          onClick={() => setShowQuiz(true)} 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs px-3 rounded-full font-bold border-primary/40 bg-primary/5 hover:bg-primary/20 text-primary gap-1"
                        >
                          📝 Responder Cuestionario
                        </Button>
                      )}
                      {exerciseActive && (
                        <Button onClick={cancelExercise} variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {!exerciseActive ? (
                      <div className="text-center py-4 max-w-lg mx-auto space-y-6">
                        
                        {/* Individual Exercise Selector */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-muted-foreground block">Elige un ejercicio para realizar:</span>
                          <div className={cn("grid gap-2", selectedLesson.exercises.length > 3 ? "grid-cols-5" : "grid-cols-3")}>
                            {selectedLesson.exercises.map((exercise, idx) => {
                              const lessonProgress = completedExercises[selectedLesson.id] || [];
                              const isExComplete = lessonProgress[idx];
                              const isUnlocked = idx === 0 || lessonProgress[idx - 1];
                              
                              return (
                                <button
                                  key={idx}
                                  disabled={!isUnlocked}
                                  onClick={() => setSelectedExerciseIdx(idx)}
                                  className={cn(
                                    "py-3.5 px-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all outline-none relative",
                                    !isUnlocked && "opacity-50 cursor-not-allowed bg-muted/30 border-border/20",
                                    isUnlocked && selectedExerciseIdx === idx 
                                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                                      : isUnlocked && "border-border/40 hover:border-border/80 bg-card/10 text-muted-foreground",
                                  )}
                                >
                                  {!isUnlocked && (
                                    <Lock className="w-4 h-4 absolute top-2 right-2 text-muted-foreground/50" />
                                  )}
                                  <span className="text-xs font-black">Nivel {idx + 1}</span>
                                  <span className="text-[8px] uppercase tracking-wider font-semibold">
                                    {exercise.type === 'pitch-matching' ? `${exercise.noteCount} Notas` : (idx === 0 ? "Fácil" : idx === 1 ? "Medio" : "Difícil")}
                                  </span>
                                  
                                  {isExComplete && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center border border-background">
                                      <Check className="w-2.5 h-2.5 font-bold" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Display pattern details */}
                        {activeExercise && activeExercise.type !== 'pitch-matching' && (
                          <div className="bg-card/40 border border-border/20 rounded-2xl p-4 space-y-3">
                            <p className="text-xs text-foreground/90 font-medium">
                              {activeExercise.description}
                            </p>
                            <div className="flex justify-center gap-3 text-[10px] font-bold">
                              <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500">
                                Inhalar: {activeExercise.inhaleSeconds}s
                              </span>
                              {activeExercise.holdSeconds && activeExercise.holdSeconds > 0 && (
                                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-500">
                                  Mantener: {activeExercise.holdSeconds}s
                                </span>
                              )}
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
                                Exhalar: {activeExercise.exhaleSeconds}s
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {activeExercise && activeExercise.type === 'pitch-matching' && (
                          <div className="bg-card/40 border border-border/20 rounded-2xl p-4 text-center">
                            <p className="text-xs text-foreground/90 font-medium">
                              {activeExercise.description}
                            </p>
                          </div>
                        )}

                        <Button onClick={startExercise} className="w-full sm:w-auto h-12 px-8 font-black rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95 text-white">
                          Comenzar Nivel {selectedExerciseIdx + 1}
                        </Button>

                        {(selectedLesson.id === 1 || selectedLesson.id === 6 || selectedLesson.id === 7 || selectedLesson.id === 12.5) && (
                          <div className="pt-4 border-t border-border/20 w-full mt-4 flex flex-col items-center animate-in fade-in">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                              Por si quieres probar suerte...
                            </span>
                            <Button 
                              onClick={() => setShowQuiz(true)} 
                              variant="outline"
                              className="w-full sm:w-auto h-10 px-6 font-bold rounded-full gap-2 text-primary border-primary/40 bg-primary/5 hover:bg-primary/20"
                            >
                              📝 Responder Cuestionario Teórico
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : activeExercise && activeExercise.type === 'pitch-matching' ? (
                      <MiniTunerWidget 
                        key={`tuner-${selectedExerciseIdx}`}
                        noteCount={activeExercise.noteCount || 3}
                        notePool={notePool}
                        gender={gender}
                        vocalRangeKey={vocalRangeKey}
                        onComplete={handleExerciseComplete}
                      />
                    ) : activeExercise && activeExercise.type === 'vocal-range-polygraph' ? (
                      <VocalPolygraph
                        key={`polygraph-${selectedExerciseIdx}`}
                        direction={activeExercise.polygraphDirection as 'up' | 'down'}
                        duration={activeExercise.polygraphDuration || 4}
                        title={activeExercise.description}
                        onComplete={handleExerciseComplete}
                      />
                    ) : activeExercise ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-8 w-full max-w-md mx-auto">
                        
                        {/* Phase instructions with animated sizes */}
                        <div className="text-center space-y-1.5 h-20 flex flex-col justify-center select-none shrink-0">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                            Ejercicio {selectedExerciseIdx + 1} · {selectedExerciseIdx === 0 ? "Fácil" : selectedExerciseIdx === 1 ? "Medio" : "Difícil"}
                          </span>
                          <h3 className={cn(
                            "text-xl sm:text-2xl font-black transition-all duration-300",
                            phase === 'idle' && 'text-muted-foreground animate-pulse',
                            phase === 'inhale' && 'text-blue-500 scale-105',
                            phase === 'hold' && 'text-purple-500 scale-105',
                            phase === 'exhale' && 'text-emerald-500 scale-105',
                            phase === 'success' && 'text-emerald-600',
                            phase === 'fail' && 'text-destructive'
                          )}>
                            {phase === 'idle' && "Presiona para inhalar"}
                            {phase === 'inhale' && "¡MANTÉN PRESIONADO E INHALA!"}
                            {phase === 'hold' && "¡MANTÉN PRESIONADO Y RETÉN!"}
                            {phase === 'exhale' && "¡SUELTA EL BOTÓN Y EXHALA!"}
                            {phase === 'success' && "¡EJERCICIO COMPLETADO!"}
                            {phase === 'fail' && "¡INTÉNTALO DE NUEVO!"}
                          </h3>
                          
                          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-0.5">
                            {phase === 'idle' && "Presiona y mantén pulsado el botón para comenzar"}
                            {phase === 'inhale' && `Inhala expandiendo tu diafragma: ${timeLeft}s`}
                            {phase === 'hold' && `Retén el aire con el botón pulsado: ${timeLeft}s`}
                            {phase === 'exhale' && `Suelta el botón y sopla constante haciendo 'Sssss': ${timeLeft}s`}
                            {phase === 'success' && `¡Buen control de apoyo diafragmático! Ejercicio completado.`}
                            {phase === 'fail' && "Asegúrate de mantener pulsado el botón y soltarlo en la fase correcta."}
                          </p>
                        </div>

                        {/* Main Interactive Button Area with pulsing dynamic halo */}
                        <div className="relative w-48 h-48 flex items-center justify-center select-none touch-none shrink-0">
                          
                          {/* CSS-based wind flow animation during exhalation */}
                          {phase === 'exhale' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="absolute w-40 h-40 border-2 border-emerald-400/30 rounded-full animate-ping-slow" />
                              <div className="absolute w-36 h-36 border border-emerald-500/20 rounded-full animate-pulse-slow" />
                              
                              {/* Wind particles */}
                              <div className="absolute flex gap-1 items-center justify-center text-emerald-500/40 text-xs">
                                <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>💨</span>
                                <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>💨</span>
                                <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>💨</span>
                              </div>
                            </div>
                          )}

                          {/* Interactive breathing button */}
                          <button
                            ref={breathButtonRef}
                            onMouseDown={handleBreathPress}
                            onMouseUp={handleBreathRelease}
                            onMouseLeave={handleBreathRelease}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              handleBreathPress();
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              handleBreathRelease();
                            }}
                            className={cn(
                              "absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-white font-black shadow-2xl transition-all border-4 relative overflow-hidden active:scale-95 duration-75 outline-none select-none",
                              phase === 'idle' && "bg-gradient-to-br from-primary to-primary/80 border-white/20 shadow-primary/30 cursor-pointer animate-pulse-slow",
                              phase === 'inhale' && "bg-gradient-to-br from-blue-500 to-blue-400 border-blue-300 shadow-blue-500/40 cursor-grabbing",
                              phase === 'hold' && "bg-gradient-to-br from-purple-500 to-purple-400 border-purple-300 shadow-purple-500/40 cursor-grabbing",
                              phase === 'exhale' && "bg-gradient-to-br from-emerald-500 to-emerald-400 border-emerald-300 shadow-emerald-500/40 cursor-pointer",
                              phase === 'success' && "bg-emerald-600 border-emerald-400 shadow-emerald-600/30",
                              phase === 'fail' && "bg-destructive border-red-400 shadow-destructive/30"
                            )}
                          >
                            <div className="z-10 flex flex-col items-center">
                              {phase === 'idle' && <Wind className="w-8 h-8 animate-bounce-slow" />}
                              {phase === 'inhale' && <Wind className="w-8 h-8 animate-pulse-slow" />}
                              {phase === 'hold' && <Heart className="w-8 h-8 text-purple-200 animate-pulse-slow" />}
                              {phase === 'exhale' && <Wind className="w-8 h-8 animate-pulse-slow text-emerald-100" />}
                              {phase === 'success' && <Trophy className="w-8 h-8" />}
                              {phase === 'fail' && <RotateCcw className="w-8 h-8" />}

                              <span className="text-[10px] uppercase font-bold tracking-widest mt-1">
                                {phase === 'idle' && "Presionar"}
                                {phase === 'inhale' && "Inhalando"}
                                {phase === 'hold' && "Reteniendo"}
                                {phase === 'exhale' && "Exhalar"}
                                {phase === 'success' && "Éxito"}
                                {phase === 'fail' && "Reintentar"}
                              </span>
                            </div>
                            
                            {/* Inner overlay */}
                            <div className="absolute inset-0 bg-white/10 dark:bg-white/5 mix-blend-overlay" />
                          </button>
                        </div>

                        {/* Visual progress bar of current phase */}
                        <div className="w-full select-none shrink-0 flex flex-col items-center">
                          {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
                            <div className="w-full space-y-1.5 text-center">
                              <Progress 
                                value={((totalPhaseDuration - timeLeft) / totalPhaseDuration) * 100} 
                                className={cn(
                                  "h-2 transition-all duration-300 bg-muted/40",
                                  phase === 'inhale' && "[&>div]:bg-blue-500",
                                  phase === 'hold' && "[&>div]:bg-purple-500",
                                  phase === 'exhale' && "[&>div]:bg-emerald-500"
                                )} 
                              />
                              <span className="text-xs font-bold text-muted-foreground block">
                                {timeLeft}s restantes en esta fase
                              </span>
                            </div>
                          )}
                          
                          {(phase === 'success' || phase === 'fail') && (
                            <div className="h-9 flex items-center justify-center text-xs text-muted-foreground font-medium animate-pulse">
                              Toca el círculo para reintentar
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                          <Trophy className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black">¡Lección Completada!</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          Has superado todos los ejercicios prácticos de esta lección. ¡Gran trabajo!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              </div>

            </div>
          </div>
        ) : (
          /* Empty State / Welcome Screen when no class is selected */
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-transparent relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 filter blur-3xl" />
            
            <div className="max-w-md space-y-6 relative animate-in fade-in-50 duration-700">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20 mx-auto filter drop-shadow-md animate-bounce-slow">
                🎓
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">Bienvenido a la Academia de Canto</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para comenzar tu viaje de entrenamiento vocal guiado, selecciona una clase del catálogo a la izquierda. Verás vídeos del curso exclusivos de YouTube y podrás entrenar tu respiración diafragmática completando los ejercicios de forma guiada.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card/40 border border-border/20 rounded-2xl p-3">
                  <Video className="w-6 h-6 text-primary mx-auto mb-1" />
                  <span className="text-[10px] font-bold block">33 Clases</span>
                  <span className="text-[8px] text-muted-foreground">de YouTube</span>
                </div>
                <div className="bg-card/40 border border-border/20 rounded-2xl p-3">
                  <Wind className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <span className="text-[10px] font-bold block">Ejercicios</span>
                  <span className="text-[8px] text-muted-foreground">De Apoyo</span>
                </div>
                <div className="bg-card/40 border border-border/20 rounded-2xl p-3">
                  <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
                  <span className="text-[10px] font-bold block">Seguimiento</span>
                  <span className="text-[8px] text-muted-foreground">De Progreso</span>
                </div>
              </div>

              {/* Back Button for mobile */}
              <Button onClick={onGoBack} variant="outline" className="w-full sm:w-auto rounded-full font-bold h-11 px-6 sm:hidden">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
              </Button>
            </div>
          </div>
        )}

      {/* Quiz Modal Overlay */}
      {showQuiz && selectedLesson && (
        (() => {
          const activeQuestions = selectedLesson.id === 6 
            ? quizQuestions6 
            : selectedLesson.id === 7 
              ? quizQuestions7 
              : selectedLesson.id === 12.5
                ? quizQuestions12_5
                : quizQuestions1;
          const passingScore = activeQuestions.length >= 7 ? 5 : activeQuestions.length >= 4 ? 3 : 2;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
              <div className="bg-card/95 border border-white/10 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                    📝 Cuestionario: Clase {selectedLesson.id}
                  </h3>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Pregunta {currentQuizQuestionIdx + 1} de {activeQuestions.length}
                  </span>
                </div>

                {/* Quiz Body */}
                {!quizFinished ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-foreground leading-snug">
                      {activeQuestions[currentQuizQuestionIdx].question}
                    </p>

                    <div className="flex flex-col gap-2.5">
                      {activeQuestions[currentQuizQuestionIdx].options.map((option, idx) => {
                        const isSelected = selectedAnswerIdx === idx;
                        const isCorrect = idx === activeQuestions[currentQuizQuestionIdx].correctAnswerIdx;
                        const isAnswered = selectedAnswerIdx !== null;
                        
                        return (
                          <button
                            key={idx}
                            disabled={isAnswered}
                            onClick={() => {
                              setSelectedAnswerIdx(idx);
                              if (isCorrect) {
                                setQuizScore(prev => prev + 1);
                                playTone(523.25, 0.15);
                              } else {
                                playTone(180, 0.3, 'triangle');
                              }
                            }}
                            className={cn(
                              "w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all relative outline-none flex items-center justify-between",
                              !isAnswered && "bg-muted/10 border-border/40 hover:bg-muted/20 hover:border-border/80",
                              isAnswered && isCorrect && "bg-emerald-500/20 border-emerald-500 text-emerald-500 font-bold",
                              isAnswered && isSelected && !isCorrect && "bg-destructive/20 border-destructive text-destructive font-bold",
                              isAnswered && !isSelected && !isCorrect && "opacity-55 border-border/20 bg-muted/5"
                            )}
                          >
                            <span>{option}</span>
                            {isAnswered && isCorrect && <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation / Feedback */}
                    {selectedAnswerIdx !== null && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1 animate-in fade-in duration-200">
                        <span className="text-[10px] font-black uppercase text-primary block">
                          {selectedAnswerIdx === activeQuestions[currentQuizQuestionIdx].correctAnswerIdx 
                            ? "¡Correcto!" 
                            : "Respuesta incorrecta"}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeQuestions[currentQuizQuestionIdx].explanation}
                        </p>
                      </div>
                    )}

                    {/* Next Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        disabled={selectedAnswerIdx === null}
                        onClick={() => {
                          if (currentQuizQuestionIdx < activeQuestions.length - 1) {
                            setCurrentQuizQuestionIdx(prev => prev + 1);
                            setSelectedAnswerIdx(null);
                          } else {
                            setQuizFinished(true);
                          }
                        }}
                        className="rounded-full px-5 font-bold h-9 bg-primary hover:bg-primary/95 text-white"
                      >
                        {currentQuizQuestionIdx < activeQuestions.length - 1 ? "Siguiente" : "Finalizar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Quiz Finished Screen
                  <div className="text-center py-6 space-y-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-primary/10 border border-primary/20">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="text-base font-black">Cuestionario Finalizado</h4>
                      <p className="text-sm font-medium">
                        Puntaje: <span className="font-black text-primary">{quizScore} / {activeQuestions.length}</span> correctas
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        {quizScore >= passingScore 
                          ? "¡Excelente trabajo! Has demostrado comprender los fundamentos evaluados."
                          : `No lograste el puntaje mínimo de ${passingScore} respuestas correctas. ¡Te recomendamos repasar el video e intentarlo de nuevo!`}
                      </p>
                    </div>

                    <div className="flex justify-center gap-3 pt-2">
                      {quizScore >= passingScore ? (
                        <Button
                          onClick={() => {
                            setShowQuiz(false);
                            handleManualComplete();
                            // Reset quiz state
                            setCurrentQuizQuestionIdx(0);
                            setSelectedAnswerIdx(null);
                            setQuizScore(0);
                            setQuizFinished(false);
                          }}
                          className="rounded-full px-6 font-bold h-10 bg-emerald-600 hover:bg-emerald-550 text-white gap-2"
                        >
                          <Check className="w-4 h-4" /> Completar Lección
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            // Reset quiz state for retry
                            setCurrentQuizQuestionIdx(0);
                            setSelectedAnswerIdx(null);
                            setQuizScore(0);
                            setQuizFinished(false);
                          }}
                          variant="outline"
                          className="rounded-full px-6 font-bold h-10 gap-2"
                        >
                          <RotateCcw className="w-4 h-4" /> Intentar de nuevo
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setShowQuiz(false);
                          // Reset state
                          setCurrentQuizQuestionIdx(0);
                          setSelectedAnswerIdx(null);
                          setQuizScore(0);
                          setQuizFinished(false);
                        }}
                        variant="ghost"
                        className="rounded-full px-4 font-bold h-10 text-muted-foreground"
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}

      </div>
    </div>
  );
}
