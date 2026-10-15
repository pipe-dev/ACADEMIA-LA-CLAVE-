// src/components/unit4-flappy/useVoiceGate.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioService } from '../../utils/audioService';
import { Phase } from './unit4Types';

interface UseVoiceGateOptions {
  getPhase: () => Phase;
  onStart: () => void;
  onFlap: () => void;
}

const VOICE_GATE_DEFAULT = 0.012;
const VOICE_MIN = 65; // incluye graves profundos
const VOICE_MAX = 1000;
const VOICE_DEBOUNCE = 0.15;
const CAL_SAMPLES = 45; // ~1.5s a 30 FPS

export const useVoiceGate = ({
  getPhase,
  onStart,
  onFlap,
}: UseVoiceGateOptions) => {
  const [micActive, setMicActive] = useState(false);
  const micActiveRef = useRef(false);
  const calibratingRef = useRef(false);

  const voiceGateValueRef = useRef(VOICE_GATE_DEFAULT);
  const pitchStreakRef = useRef(0);
  const lastVoiceFlapRef = useRef(0);
  const noiseSamplesRef = useRef<number[]>([]);

  // Keep latest callbacks in refs to avoid re-binding audioService
  const callbacksRef = useRef({ getPhase, onStart, onFlap });
  useEffect(() => {
    callbacksRef.current = { getPhase, onStart, onFlap };
  });

  const voiceGate = useCallback((pitchHz: number, volume: number) => {
    const now = performance.now() / 1000;
    const { getPhase: phaseGetter, onStart: startCb, onFlap: flapCb } =
      callbacksRef.current;
    const currentPhase = phaseGetter();

    // Calibración: mide el piso de ruido del ambiente y ajusta el gate
    if (calibratingRef.current) {
      noiseSamplesRef.current.push(volume);
      if (noiseSamplesRef.current.length >= CAL_SAMPLES) {
        const sorted = [...noiseSamplesRef.current].sort((a, b) => a - b);
        const noise = sorted[Math.floor(sorted.length * 0.75)];
        voiceGateValueRef.current = Math.min(
          0.025,
          Math.max(0.007, noise * 1.1 + 0.0025)
        );
        calibratingRef.current = false;
        noiseSamplesRef.current.length = 0;
        console.log(
          `[Unit4] gate ajustado a ${voiceGateValueRef.current.toFixed(3)} (ruido ${noise.toFixed(3)})`
        );
      }
      return;
    }

    if (
      volume > voiceGateValueRef.current ||
      (pitchHz >= VOICE_MIN && pitchHz <= VOICE_MAX)
    ) {
      pitchStreakRef.current += 1;
      if (currentPhase === 'ready' && micActiveRef.current) {
        if (pitchStreakRef.current >= 2) {
          pitchStreakRef.current = 0;
          startCb();
        }
        return;
      }
      if (
        currentPhase === 'playing' &&
        pitchStreakRef.current >= 2 &&
        now - lastVoiceFlapRef.current > VOICE_DEBOUNCE
      ) {
        pitchStreakRef.current = 0;
        lastVoiceFlapRef.current = now;
        flapCb();
      }
    } else {
      pitchStreakRef.current = 0;
    }
  }, []);

  const isRequestingRef = useRef(false);
  const permissionDeniedRef = useRef(false);

  const startMic = useCallback(async (isManualRetry = false) => {
    if (micActiveRef.current || isRequestingRef.current) return;
    if (permissionDeniedRef.current && !isManualRetry) return;

    isRequestingRef.current = true;
    try {
      const ok = await audioService.startMicrophone(voiceGate);
      micActiveRef.current = ok;
      setMicActive(ok);
      if (ok) {
        permissionDeniedRef.current = false;
        voiceGateValueRef.current = VOICE_GATE_DEFAULT;
        noiseSamplesRef.current.length = 0;
        calibratingRef.current = true;
      } else {
        permissionDeniedRef.current = true;
      }
    } catch {
      permissionDeniedRef.current = true;
    } finally {
      isRequestingRef.current = false;
    }
  }, [voiceGate]);

  const stopMic = useCallback(() => {
    if (micActiveRef.current) {
      audioService.stopMicrophone();
      micActiveRef.current = false;
      setMicActive(false);
    }
    calibratingRef.current = false;
    noiseSamplesRef.current.length = 0;
  }, []);

  const ensureMic = useCallback(() => {
    // Si ya está activo, o ya fue denegado/falló, o hay una petición en vuelo,
    // NO volver a llamar a getUserMedia en cada tap de la pantalla!
    if (micActiveRef.current || isRequestingRef.current || permissionDeniedRef.current) {
      return;
    }
    startMic(false);
  }, [startMic]);

  const toggleMic = useCallback(() => {
    if (micActiveRef.current) {
      stopMic();
    } else {
      startMic(true);
    }
  }, [startMic, stopMic]);

  useEffect(() => {
    // Intento inicial automático
    startMic(false);
    return () => {
      stopMic();
    };
  }, [startMic, stopMic]);

  return {
    micActive,
    micActiveRef,
    startMic,
    stopMic,
    ensureMic,
    toggleMic,
  };
};
