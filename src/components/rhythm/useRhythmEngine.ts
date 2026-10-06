import { useState, useEffect, useRef, useCallback } from 'react';
import { useAnimationControls } from 'motion/react';
import { voicePlayback } from '../../utils/voicePlaybackService';
import { audioService } from '../../utils/audioService';
import { RhythmPatternItem, RhythmPhase, FloatingFeedbackText, UserTapRecord } from './rhythmTypes';

interface UseRhythmEngineParams {
  pattern: RhythmPatternItem[];
  bpm: number;
  onSuccess: (score: number) => void;
  onFail?: (score?: number) => void;
  autoStart?: boolean;
}

export function useRhythmEngine({
  pattern,
  bpm,
  onSuccess,
  onFail,
  autoStart = true,
}: UseRhythmEngineParams) {
  const [phase, setPhase] = useState<RhythmPhase>('guide');
  const [score, setScore] = useState<number>(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingFeedbackText[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [_activeButton, setActiveButton] = useState<'kick' | 'clap' | null>(null);
  const [countInNumber, setCountInNumber] = useState<number | null>(null);

  const ballControls = useAnimationControls();
  const [_sphereTarget, setSphereTarget] = useState<'center' | 'kick' | 'clap'>('center');

  const currentYRef = useRef<number>(-90);
  const currentXRef = useRef<number>(0);

  const floatingIdRef = useRef(0);
  const userTapsRef = useRef<UserTapRecord[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const finishExerciseRef = useRef<() => void>(() => {});

  const isRunningRef = useRef(false);
  const currentBeatRef = useRef(0);
  const exerciseStartTimeRef = useRef(0);
  const playPhaseStartTimeRef = useRef(0);
  const metronomeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guideScheduleTimersRef = useRef<NodeJS.Timeout[]>([]);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  const beatMs = (60 / bpm) * 1000;
  const maxPatternTime = pattern.length > 0 ? Math.max(...pattern.map((p) => p.time), 1000) : 2000;
  const patternBars = Math.max(1, Math.ceil((maxPatternTime + beatMs * 0.5) / (4 * beatMs)));

  const addFloating = (text: string, color: string, side: 'left' | 'right') => {
    const id = ++floatingIdRef.current;
    setFloatingTexts((prev) => [...prev.slice(-3), { id, text, color, side }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 900);
  };

  const triggerBallJump = useCallback(
    (target: 'center' | 'kick' | 'clap') => {
      setSphereTarget(target);

      if (target === 'center') {
        currentYRef.current = -90;
        currentXRef.current = 0;

        ballControls.start({
          x: 0,
          y: [-94, -86, -94],
          scaleX: [1, 1.025, 1],
          scaleY: [1, 0.975, 1],
          rotate: 0,
          transition: {
            x: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
            rotate: { duration: 0.3 },
            y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            scaleX: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            scaleY: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
          },
        });
        return;
      }

      const targetX = target === 'kick' ? -105 : 105;
      const tilt = target === 'kick' ? -8 : 8;
      const startY = currentYRef.current;
      currentYRef.current = 0;
      currentXRef.current = targetX;

      ballControls.start({
        x: targetX,
        y: [startY, -155, 4, -4, 0],
        scaleX: [1, 0.94, 1.18, 0.97, 1],
        scaleY: [1, 1.1, 0.82, 1.04, 1],
        rotate: [0, tilt, 0],
        transition: {
          x: { duration: 0.52, ease: [0.35, 0, 0.25, 1] },
          y: {
            duration: 0.52,
            times: [0, 0.42, 0.72, 0.86, 1],
            ease: ['easeInOut', 'easeIn', 'easeOut', 'easeInOut'],
          },
          scaleX: {
            duration: 0.52,
            times: [0, 0.42, 0.72, 0.86, 1],
            ease: 'easeInOut',
          },
          scaleY: {
            duration: 0.52,
            times: [0, 0.42, 0.72, 0.86, 1],
            ease: 'easeInOut',
          },
          rotate: { duration: 0.52, ease: 'easeInOut' },
        },
      });
    },
    [ballControls]
  );

  const startExercise = useCallback(() => {
    isRunningRef.current = false;
    if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    guideScheduleTimersRef.current.forEach(clearTimeout);
    guideScheduleTimersRef.current = [];
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setPhase('guide');
    setCountInNumber(1);
    setScore(0);
    setCombo(0);
    setFloatingTexts([]);
    userTapsRef.current = [];
    triggerBallJump('center');

    const countInBeats = 4;
    const guideBeats = patternBars * 4;
    const playStartBeat = countInBeats + guideBeats;

    isRunningRef.current = true;
    currentBeatRef.current = 0;
    exerciseStartTimeRef.current = Date.now();

    const leapLeadMs = 374;

    pattern.forEach((hit) => {
      const audioTime = countInBeats * beatMs + hit.time;
      const launchTime = audioTime - leapLeadMs;

      const leapTimer = setTimeout(() => {
        if (!isRunningRef.current) return;
        triggerBallJump(hit.instrument);
      }, launchTime);
      guideScheduleTimersRef.current.push(leapTimer);

      const hitTimer = setTimeout(() => {
        if (!isRunningRef.current) return;
        if (hit.instrument === 'kick') {
          voicePlayback.playKick();
          setActiveButton('kick');
        } else {
          voicePlayback.playClap();
          setActiveButton('clap');
        }
        setTimeout(() => setActiveButton(null), 120);
      }, audioTime);
      guideScheduleTimersRef.current.push(hitTimer);
    });

    const tickBeat = () => {
      if (!isRunningRef.current) return;
      const beat = currentBeatRef.current;

      voicePlayback.playMetronomeTick();

      if (beat < countInBeats) {
        setCountInNumber(beat + 1);
        if (beat < countInBeats - 1) {
          ballControls.start({
            x: 0,
            y: [-90, -112, -90],
            scaleX: [1, 0.96, 1.03, 1],
            scaleY: [1, 1.06, 0.97, 1],
            rotate: 0,
            transition: { duration: 0.28, ease: 'easeInOut' },
          });
        }
      } else if (beat === countInBeats) {
        setCountInNumber(null);
      } else if (beat === playStartBeat) {
        setPhase('playing');
        playPhaseStartTimeRef.current = Date.now();
        triggerBallJump('center');
        audioService.playSoftDing();
      }

      currentBeatRef.current++;
      const nextTime = exerciseStartTimeRef.current + currentBeatRef.current * beatMs;
      const delay = Math.max(0, nextTime - Date.now());
      metronomeTimerRef.current = setTimeout(tickBeat, delay);
    };

    tickBeat();
  }, [ballControls, beatMs, pattern, patternBars, triggerBallJump]);

  const finishExercise = useCallback(() => {
    isRunningRef.current = false;
    if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    guideScheduleTimersRef.current.forEach(clearTimeout);
    guideScheduleTimersRef.current = [];

    setPhase('results');
    setCountInNumber(null);

    const taps = userTapsRef.current;
    if (taps.length === 0) {
      setScore(0);
      ballControls.start({
        x: 0,
        y: -90,
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.3 },
      });
      return;
    }

    let totalPrecision = 0;

    pattern.forEach((expected, idx) => {
      const userTap = taps[idx];
      if (!userTap) return;

      if (userTap.instrument === expected.instrument) {
        const devMs =
          userTap.deviationMs ??
          Math.abs(userTap.time - Math.round(userTap.time / beatMs) * beatMs);
        let hitScore = 0;
        if (devMs <= 50) {
          hitScore = 100;
        } else if (devMs <= 220) {
          hitScore = Math.max(15, 100 - ((devMs - 50) / 170) * 85);
        } else {
          hitScore = 10;
        }
        totalPrecision += hitScore;
      }
    });

    const rawScore = Math.round(totalPrecision / pattern.length);
    const finalScore = Math.max(0, Math.min(100, rawScore));
    setScore(finalScore);

    if (finalScore >= 80) {
      ballControls.start({
        x: 0,
        y: [-90, -135, -90],
        rotate: 0,
        scaleX: [1, 0.95, 1.05, 1],
        scaleY: [1, 1.08, 0.96, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      });
      setTimeout(() => onSuccess(finalScore), 750);
    } else {
      ballControls.start({
        x: 0,
        y: -90,
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.35, ease: 'easeOut' },
      });
      audioService.playSadDefeatSound();
      if (onFail) {
        onFail(finalScore);
      }
    }
  }, [ballControls, beatMs, onFail, onSuccess, pattern]);

  finishExerciseRef.current = finishExercise;

  useEffect(() => {
    if (autoStart) {
      startExercise();
    }
    return () => {
      isRunningRef.current = false;
      if (metronomeTimerRef.current) clearTimeout(metronomeTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      guideScheduleTimersRef.current.forEach(clearTimeout);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [autoStart, startExercise]);

  const handleTap = useCallback(
    (instrument: 'kick' | 'clap') => {
      if (phase !== 'playing' || !isRunningRef.current) return;
      if (userTapsRef.current.length >= pattern.length) return;

      triggerBallJump(instrument);

      if (instrument === 'kick') {
        voicePlayback.playKick();
      } else {
        voicePlayback.playClap();
      }

      const now = Date.now();
      const tapTime = now - playPhaseStartTimeRef.current;

      const nearestPulseIndex = Math.round(tapTime / beatMs);
      const nearestPulseTime = nearestPulseIndex * beatMs;
      const deviationMs = Math.abs(tapTime - nearestPulseTime);

      const currentTapIndex = userTapsRef.current.length;
      const expectedHit = pattern[currentTapIndex];
      const isCorrectInstrument = expectedHit && instrument === expectedHit.instrument;

      userTapsRef.current.push({
        time: tapTime,
        instrument,
        pulseIndex: nearestPulseIndex,
        deviationMs,
      });

      const side = instrument === 'kick' ? 'left' : 'right';
      const roundedDiff = Math.round(deviationMs);

      if (!isCorrectInstrument) {
        const expectedName = expectedHit?.instrument === 'kick' ? 'Bombo' : 'Palmas';
        addFloating(`¡Era ${expectedName}!`, 'text-rose-400', side);
        setCombo(0);
      } else if (deviationMs <= 60) {
        addFloating(`¡Perfecto! ±${roundedDiff}ms`, 'text-emerald-400', side);
        setCombo((prev) => prev + 1);
      } else if (deviationMs <= 150) {
        addFloating(`¡Bien! ±${roundedDiff}ms`, 'text-amber-400', side);
        setCombo((prev) => prev + 1);
      } else if (deviationMs <= 220) {
        addFloating(`¡A tiempo! ±${roundedDiff}ms`, 'text-sky-400', side);
      } else {
        addFloating(`¡A destiempo! ±${roundedDiff}ms`, 'text-rose-400', side);
        setCombo(0);
      }

      if (userTapsRef.current.length === pattern.length) {
        setTimeout(() => {
          finishExerciseRef.current();
        }, 400);
      }
    },
    [beatMs, pattern, phase, triggerBallJump]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handleTap('kick');
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleTap('clap');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  return {
    phase,
    score,
    floatingTexts,
    combo,
    countInNumber,
    ballControls,
    handleTap,
    startExercise,
  };
}
