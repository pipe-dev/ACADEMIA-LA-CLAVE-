// src/components/unit2-celebration/useGlassVoiceTension.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioService } from '../../utils/audioService';

interface UseGlassVoiceTensionProps {
  isOpen: boolean;
  isShattered: boolean;
  onShatter: () => void;
}

export const useGlassVoiceTension = ({
  isOpen,
  isShattered,
  onShatter,
}: UseGlassVoiceTensionProps) => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);

  const isActiveRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const lastVoiceTimeRef = useRef<number>(0);
  const consecutiveVoiceFramesRef = useRef<number>(0);

  const onShatterRef = useRef(onShatter);
  useEffect(() => {
    onShatterRef.current = onShatter;
  }, [onShatter]);

  const resetTension = useCallback(() => {
    setProgress(0);
    setIsActive(false);
    isActiveRef.current = false;
    consecutiveVoiceFramesRef.current = 0;
    setDetectedPitch(null);
    lastTimeRef.current = performance.now();
    lastVoiceTimeRef.current = performance.now();
  }, []);

  const handleStart = useCallback(async () => {
    lastTimeRef.current = performance.now();
    lastVoiceTimeRef.current = performance.now();
    consecutiveVoiceFramesRef.current = 0;

    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const now = performance.now();
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // 1. Fundamental Pitch in Human Vocal Singing Range (75 Hz to 1400 Hz)
      const hasVocalPitch = pitchHz >= 75 && pitchHz <= 1400;

      // 2. Volume threshold
      const hasVocalVolume = vol >= 0.006;

      // 3. Candidate vocal frame
      const isVocalCandidate = hasVocalPitch && hasVocalVolume;

      // 4. Temporal Debounce & Hangover Continuity Filter
      if (isVocalCandidate) {
        consecutiveVoiceFramesRef.current = Math.min(
          8,
          consecutiveVoiceFramesRef.current + 2
        );
        lastVoiceTimeRef.current = now;
      } else {
        consecutiveVoiceFramesRef.current = Math.max(
          0,
          consecutiveVoiceFramesRef.current - 1
        );
      }

      const isVoiceDetected =
        consecutiveVoiceFramesRef.current >= 2 ||
        (now - lastVoiceTimeRef.current < 200 &&
          consecutiveVoiceFramesRef.current > 0);

      if (isVoiceDetected && hasVocalPitch) {
        setDetectedPitch(Math.round(pitchHz));
      } else if (now - lastVoiceTimeRef.current > 600) {
        setDetectedPitch(null);
      }

      setProgress((prev) => {
        if (prev >= 100) return prev;

        let newProg = prev;
        if (isVoiceDetected) {
          const pitchBonus = pitchHz > 350 ? 1.25 : 1.0;
          const loudnessBonus = vol > 0.025 ? 1.25 : 1.0;
          newProg += (dt / 2200) * 100 * pitchBonus * loudnessBonus;
        }

        newProg = Math.max(0, Math.min(100, newProg));

        if (newProg >= 100) {
          audioService.stopMicrophone();
          onShatterRef.current();
        }
        return newProg;
      });
    });

    if (success) {
      setIsActive(true);
      isActiveRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || isShattered) {
      audioService.stopMicrophone();
      isActiveRef.current = false;
      consecutiveVoiceFramesRef.current = 0;
    }
  }, [isOpen, isShattered]);

  useEffect(() => {
    return () => {
      audioService.stopMicrophone();
    };
  }, []);

  return {
    isActive,
    progress,
    detectedPitch,
    handleStart,
    resetTension,
  };
};
