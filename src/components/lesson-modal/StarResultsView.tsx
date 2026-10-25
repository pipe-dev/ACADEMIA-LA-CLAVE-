'use client';
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LessonNode, UserStats } from '../../types';
import { audioService } from '../../utils/audioService';
import { Star, Sparkles, Zap, Trophy, AlertTriangle, RotateCcw } from 'lucide-react';

interface StarResultsViewProps {
  quizScore: number;
  isExamNode: boolean;
  isUnit2Exam: boolean;
  isUnit3Exam: boolean;
  isUnit4Exam?: boolean;
  node: LessonNode;
  userStats?: UserStats;
  onContinue: () => void;
  onRetry: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
}

export const StarResultsView: React.FC<StarResultsViewProps> = ({
  quizScore,
  isExamNode,
  isUnit2Exam,
  isUnit3Exam,
  isUnit4Exam = false,
  node,
  userStats,
  onContinue,
  onRetry,
  onOpenRecoveryExam,
  onOpenStore,
  onLoseLife
}) => {
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [star3Climax, setStar3Climax] = useState<boolean>(false);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [totalWipeout, setTotalWipeout] = useState<boolean>(false);
  const [star3GrandJump, setStar3GrandJump] = useState<boolean>(false);
  const [star3StaticLanded, setStar3StaticLanded] = useState<boolean>(false);

  const [starIdleEffect, setStarIdleEffect] = useState<'none' | 'spin' | 'wink'>('none');
  const [idleTargetStar, setIdleTargetStar] = useState<number>(1);
  const targetStarRef = useRef<number>(1);
  const onLoseLifeRef = useRef(onLoseLife);
  useEffect(() => {
    onLoseLifeRef.current = onLoseLife;
  }, [onLoseLife]);
  const hasFinishedRef = useRef<boolean>(false);

  const fireConfetti = (count: number = 40) => {
    try {
      confetti({
        particleCount: count,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Timeline sequence based on score - entra una sola vez y no en bucle
  useEffect(() => {
    if (hasFinishedRef.current) return;
    setEarnedStars(0);
    setStar3Climax(false);
    setIsRollingBack(false);
    setTotalWipeout(false);
    setStar3GrandJump(false);
    setStar3StaticLanded(false);

    if (quizScore >= 2) {
      // Winning Cascade Timeline (2 or 3 stars)
      const t1 = setTimeout(() => {
        setEarnedStars(1);
        audioService.playStar1ArpeggioNote();
        fireConfetti(30);
      }, 350);

      const t2 = setTimeout(() => {
        setEarnedStars(2);
        audioService.playStar2ArpeggioNote();
        fireConfetti(45);
        if (quizScore === 2) hasFinishedRef.current = true;
      }, 950);

      let t3: NodeJS.Timeout | undefined;
      let t4: NodeJS.Timeout | undefined;
      let t5: NodeJS.Timeout | undefined;

      if (quizScore === 4) {
        t3 = setTimeout(() => {
          setEarnedStars(3);
          setStar3Climax(true);
          audioService.play3StarFanfare();
          hasFinishedRef.current = true;
          fireConfetti(90);
          setTimeout(() => fireConfetti(65), 350);
          setTimeout(() => fireConfetti(45), 700);
        }, 1600);

        t4 = setTimeout(() => {
          setStar3GrandJump(true);
          fireConfetti(100);
          setTimeout(() => fireConfetti(60), 300);
        }, 6600);

        t5 = setTimeout(() => {
          setStar3GrandJump(false);
          setStar3StaticLanded(true);
        }, 8000);
      } else if (quizScore === 3) {
        t3 = setTimeout(() => {
          setEarnedStars(2.5);
          audioService.play2StarChime();
          hasFinishedRef.current = true;
          fireConfetti(60);
        }, 1600);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (t3) clearTimeout(t3);
        if (t4) clearTimeout(t4);
        if (t5) clearTimeout(t5);
      };
    } else {
      // Rollback / Defeat Tease Sequence (score <= 1)
      const t1 = setTimeout(() => {
        setEarnedStars(1);
        audioService.playStar1ArpeggioNote();
      }, 350);

      const t2 = setTimeout(() => {
        setEarnedStars(2);
        audioService.playStar2ArpeggioNote();
      }, 850);

      const t3 = setTimeout(() => {
        setEarnedStars(3);
      }, 1350);

      const t4 = setTimeout(() => {
        setIsRollingBack(true);
        setEarnedStars(1);
        audioService.playSadDefeatSound();
        hasFinishedRef.current = true;
        if (isExamNode && onLoseLifeRef.current) {
          onLoseLifeRef.current('academia');
        }
      }, 1900);

      let t5: NodeJS.Timeout | undefined;
      if (quizScore === 0) {
        t5 = setTimeout(() => {
          setEarnedStars(0);
          setTotalWipeout(true);
          audioService.playMockeryWawawaSound();
        }, 2900);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        if (t5) clearTimeout(t5);
      };
    }
  }, [quizScore, isExamNode]);

  // Idle animation loop for Star 1 and Star 2
  useEffect(() => {
    if (quizScore < 2) {
      setStarIdleEffect('none');
      return;
    }

    let mainTimer: NodeJS.Timeout;
    let resetTimer: NodeJS.Timeout;

    const scheduleNextIdle = () => {
      const randomDelay = Math.floor(Math.random() * 7000) + 5500;

      mainTimer = setTimeout(() => {
        const effect: 'spin' | 'wink' = Math.random() > 0.5 ? 'spin' : 'wink';
        const currentTarget = targetStarRef.current;

        setStarIdleEffect(effect);
        setIdleTargetStar(currentTarget);
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
  }, [quizScore]);

  const getResultsTitle = () => {
    if (isUnit4Exam) {
      return quizScore >= 2 ? '¡Módulo 4 Superado!' : 'Debes Repetir la Evaluación del Módulo 4';
    }
    if (isUnit3Exam) return '¡Coordinación y Tempo Magistrales!';
    if (isUnit2Exam) return '¡Afinación Perfecta!';
    if (node.id === 'u1-node7' || node.title?.includes('Fisiología Vocal')) return '¡Diagnóstico Vocal Sincronizado!';
    if (node.type === 'control') return '¡Dominio Respiratorio!';
    if (quizScore === 4) return '¡Desempeño Triunfal!';
    if (quizScore === 3) return '¡Muy Buen Trabajo!';
    if (quizScore === 2) return '¡Buen Trabajo!';
    if (totalWipeout) return '¡0 de 4! Derrota Total';
    return 'Debes Repetir el Quiz';
  };

  const getResultsDescription = () => {
    if (isUnit4Exam) {
      return quizScore >= 2
        ? '¡Felicidades! Has superado la Evaluación del Módulo 4 demostrando dominio de agilidad, vibrato, dicción, resonancia e identidad vocal. ¡Es momento de celebrar tu graduación!'
        : 'No alcanzaste el mínimo de 3 respuestas correctas en la Evaluación del Módulo 4. Repasa sus clases (agilidad, vibrato, dicción, resonancia e identidad vocal) e inténtalo de nuevo.';
    }
    if (isUnit3Exam) {
      return '¡Excelente sentido del ritmo! Has superado con éxito los 4 niveles de tempo (Nivel 9 al 12 del Modo Fácil) sincronizando bombo y palmas al pulso exacto. ¡Evaluación de Unidad 3 superada!';
    }
    if (isUnit2Exam) {
      return '¡Excelente precisión vocal! Has completado el Nivel 1 del Modo Fácil afinando cada una de las 3 notas correctamente. ¡Evaluación de Unidad 2 superada!';
    }
    if (node.id === 'u1-node7' || node.title?.includes('Fisiología Vocal')) {
      return '¡Excelente! Tu rango vocal y perfil tímbrico fueron registrados con éxito. Toda la app ha adaptado sus ejercicios a tu voz.';
    }
    if (node.type === 'control') {
      return '¡Excelente! Dominaste el anclaje intercostal y la resistencia pulmonar con técnica perfecta.';
    }
    if (quizScore === 4) {
      return '¡Excelente! Respondiste correctamente las 4 preguntas del Quiz con puntuación perfecta.';
    }
    if (quizScore === 3) {
      return 'Obtuviste 3 de 4 respuestas correctas. ¡Muy gran avance!';
    }
    if (quizScore === 2) {
      return 'Obtuviste 2 de 4 respuestas correctas. ¡Aprobaste la lección!';
    }
    if (totalWipeout) {
      return '¡Te quitaron hasta la última estrella porque no acertaste ninguna! Repasa el video e inténtalo de nuevo.';
    }
    return 'Obtuviste 1 de 4 respuestas correctas. Repasa el video e inténtalo de nuevo.';
  };

  return (
    <div className="py-4 text-center space-y-5 animate-scaleIn">
      {/* Cascade Animated Stars Display */}
      <div className="relative flex items-center justify-center gap-4 py-4 my-2">
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
                    <clipPath id="lucideStarClip">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </clipPath>
                    <clipPath id="leftHalfBoxClip">
                      <rect x="0" y="0" width="12" height="24" />
                    </clipPath>
                  </defs>

                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    className="fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-600"
                  />

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

                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    className="fill-none text-amber-400"
                    clipPath="url(#leftHalfBoxClip)"
                  />
                </svg>

                {star3GrandJump ? (
                  <Sparkles className="w-8 h-8 text-yellow-100 absolute -top-3 -right-3 animate-ping z-50" />
                ) : (
                  <Sparkles className="w-4 h-4 text-yellow-200 absolute -top-1 -right-1 animate-pulse" />
                )}
              </div>
            );
          }

          const isIdleTarget =
            (starNum === 1 || starNum === 2) && starNum === idleTargetStar && starIdleEffect !== 'none';
          const idleClass = isIdleTarget
            ? starIdleEffect === 'spin'
              ? 'animate-starJoySpin z-30'
              : 'animate-starWinkEye z-30'
            : '';
          const isStar3Full = starNum === 3 && earnedStars === 3;
          const shouldBounceStar3 =
            starNum === 3 && isStar3ClimaxTarget && !star3StaticLanded && !star3GrandJump;
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
                  ? starNum === 3
                    ? shouldBounceStar3
                      ? 'scale-135 rotate-12 z-20'
                      : 'scale-110 rotate-0 z-10'
                    : 'scale-110 rotate-0 z-10'
                  : wasRolledBackStar
                  ? 'scale-75 opacity-30 grayscale animate-pulse'
                  : 'scale-75 opacity-25 grayscale'
              } ${idleClass} ${grandStar3Class}`}
            >
              <Star
                className={`w-14 h-14 md:w-16 md:h-16 transition-all duration-300 ${
                  isEarned
                    ? starNum === 3 && shouldBounceStar3
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,1)] animate-bounce'
                      : 'text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                    : wasRolledBackStar
                    ? 'text-rose-300 dark:text-rose-900 fill-rose-100 dark:fill-rose-950/50'
                    : 'text-slate-300 dark:text-slate-700 fill-slate-200 dark:fill-slate-800'
                }`}
              />

              {isStar3ClimaxTarget && (
                <>
                  <Sparkles className="w-6 h-6 text-yellow-200 absolute -top-2 -right-2 animate-ping" />
                  <Sparkles className="w-5 h-5 text-amber-300 absolute -bottom-1 -left-2 animate-pulse" />
                  <Zap className="w-5 h-5 text-cyan-300 absolute -top-2 -left-2 animate-bounce" />
                </>
              )}

              {isStar3Full && star3GrandJump && (
                <Sparkles className="w-8 h-8 text-yellow-100 absolute -top-3 -right-3 animate-ping z-50" />
              )}

              {isIdleTarget && starIdleEffect === 'wink' && (
                <Sparkles className="w-7 h-7 text-yellow-100 absolute -top-3 -right-3 animate-ping z-40" />
              )}

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
          {getResultsTitle()}
        </h3>
        <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 px-2 leading-relaxed">
          {getResultsDescription()}
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
          onClick={onContinue}
          className="w-full py-4 rounded-full tactile-btn-success font-heading font-black text-sm cursor-pointer shadow-lg press-effect mt-2"
        >
          Continuar
        </button>
      ) : (
        <button
          onClick={() => {
            if ((userStats?.lives ?? 1) <= 0) {
              audioService.playClickSound();
              if (onOpenRecoveryExam) {
                onOpenRecoveryExam();
              } else if (onOpenStore) {
                onOpenStore();
              }
              return;
            }
            onRetry();
          }}
          className="w-full py-4 rounded-full bg-rose-600 text-white font-heading font-black text-sm cursor-pointer shadow-lg press-effect mt-2 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>
            {(userStats?.lives ?? 1) <= 0
              ? 'Sin vidas (Recuperar vida gratis)'
              : isExamNode
              ? 'Reintentar Examen (-1 vida si fallas)'
              : 'Reintentar Quiz'}
          </span>
        </button>
      )}
    </div>
  );
};
