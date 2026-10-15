import { useState, useRef, useCallback, useEffect } from 'react';
import { ComboTextItem } from './practicaTypes';

export function useKaraokeScoring() {
  const [score, setScore] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [comboTexts, setComboTexts] = useState<ComboTextItem[]>([]);
  const [earnedStars, setEarnedStars] = useState<number>(0);

  const hitFramesCountRef = useRef<number>(0);
  const missFramesRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const comboIdCounter = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const handleHitUpdate = useCallback((isHit: boolean) => {
    if (isHit) {
      missFramesRef.current = 0;
      hitFramesCountRef.current += 1;

      // Cada ~5 cuadros de afinación sostenida (~80ms)
      if (hitFramesCountRef.current >= 5) {
        hitFramesCountRef.current = 0;

        setComboCount((prev) => {
          const nextCombo = prev + 1;
          if (nextCombo > maxComboRef.current) {
            maxComboRef.current = nextCombo;
          }

          let newMult = 1;
          let comboMsg = '';

          if (nextCombo >= 35) {
            newMult = 4;
            comboMsg = '¡RAYO! x4 ⚡';
          } else if (nextCombo >= 18) {
            newMult = 3;
            comboMsg = '¡Racha x3! ⚡';
          } else if (nextCombo >= 6) {
            newMult = 2;
            comboMsg = '¡Genial! x2';
          }

          if (newMult !== multiplier) {
            setMultiplier(newMult);
          }

          if (
            comboMsg &&
            (nextCombo === 6 ||
              nextCombo === 18 ||
              nextCombo === 35 ||
              nextCombo % 20 === 0)
          ) {
            const id = ++comboIdCounter.current;
            setComboTexts((curr) => [
              ...curr.slice(-2),
              { id, text: comboMsg, color: 'text-amber-300' }
            ]);
            setTimeout(() => {
              setComboTexts((curr) => curr.filter((t) => t.id !== id));
            }, 1400);
          }

          return nextCombo;
        });

        setScore((prev) => prev + 12 * multiplier);
      }
    } else {
      missFramesRef.current += 1;
      // Tolerancia: La racha se mantiene durante pausas de respiración cortas (~450ms / 28 cuadros)
      if (missFramesRef.current > 28) {
        hitFramesCountRef.current = 0;
        setComboCount(0);
        if (multiplier !== 1) {
          setMultiplier(1);
        }
      }
    }
  }, [multiplier]);

  const resetScoring = useCallback(() => {
    setScore(0);
    setComboCount(0);
    setMultiplier(1);
    setComboTexts([]);
    hitFramesCountRef.current = 0;
    missFramesRef.current = 0;
    maxComboRef.current = 0;
  }, []);

  const calculateStars = useCallback((finalScore: number) => {
    const stars =
      finalScore >= 3000
        ? 5
        : finalScore >= 1800
        ? 4
        : finalScore >= 900
        ? 3
        : finalScore >= 300
        ? 2
        : 1;
    setEarnedStars(stars);
    return stars;
  }, []);

  return {
    score,
    setScore,
    comboCount,
    setComboCount,
    multiplier,
    comboTexts,
    earnedStars,
    setEarnedStars,
    scoreRef,
    maxComboRef,
    handleHitUpdate,
    resetScoring,
    calculateStars
  };
}
