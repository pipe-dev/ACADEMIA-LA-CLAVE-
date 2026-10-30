
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";
import { emitMicActive } from "@/utils/micEvents";
import { audioService } from "@/utils/audioService";

type Note = {
  name: string;
  octave: number;
  frequency: number;
};

const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

const A4 = 440;
const C0 = A4 * Math.pow(2, -4.75);

const EMPTY_NOTE = {};

const noteFromPitch = (frequency: number): Note => {
  const noteNum = 12 * (Math.log(frequency / C0) / Math.log(2));
  const roundedNote = Math.round(noteNum);
  const octave = Math.floor(roundedNote / 12);
  const name = noteStrings[roundedNote % 12];
  const targetFrequency = C0 * Math.pow(2, roundedNote / 12);

  return { name, octave, frequency: targetFrequency };
};

const centsOffFromPitch = (frequency: number, targetFrequency: number): number => {
  if (frequency === 0 || targetFrequency === 0) return 0;
  return 1200 * Math.log2(frequency / targetFrequency);
};

const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
  const SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Ignorar ruido de fondo (Silence threshold calibrado para voz cruda sin AGC de Apple)
  if (rms < 0.002) {
    return -1;
  }

  // Restrict lag bounds to human vocal range (~60 Hz to ~1000 Hz)
  const minLag = Math.floor(sampleRate / 1000); // ~44 samples at 44.1kHz
  const maxLag = Math.min(SIZE - 2, Math.ceil(sampleRate / 60)); // ~735 samples at 44.1kHz

  let maxval = -1;
  let maxLagIndex = -1;
  
  // Guardar los resultados para buscar picos locales
  const c = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let j = 0; j < SIZE - lag; j++) {
      sum += buf[j] * buf[j + lag];
    }
    c[lag] = sum;
    if (sum > maxval) {
      maxval = sum;
      maxLagIndex = lag;
    }
  }

  // Truco heurístico: en vez del máximo absoluto, buscar el PRIMER pico local
  // que sea lo suficientemente fuerte (> 90% del máximo).
  // Esto elimina el "octave error" (detectar un armónico en vez de la voz real).
  let bestLag = -1;
  const threshold = maxval * 0.9;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (c[lag] > threshold && c[lag] > c[lag - 1] && c[lag] > c[lag + 1]) {
      bestLag = lag;
      break;
    }
  }

  if (bestLag === -1) {
    bestLag = maxLagIndex;
  }

  if (bestLag === -1 || bestLag <= minLag || bestLag >= maxLag) {
    return -1;
  }

  // Parabolic interpolation for fine frequency resolution
  const x1 = c[bestLag - 1];
  const x2 = c[bestLag];
  const x3 = c[bestLag + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  
  let T0 = bestLag;
  if (a !== 0) {
    const shift = -b / (2 * a);
    if (shift >= -1 && shift <= 1) {
      T0 = T0 + shift;
    }
  }

  if (T0 === 0) return -1;
  return sampleRate / T0;
};


export const usePitchDetection = () => {
  const { toast } = useToast();
  const [note, setNote] = useState<Partial<Note>>(EMPTY_NOTE);
  const [frequency, setFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [rms, setRms] = useState(0);

  const smoothedCentsRef = useRef(0);
  const [smoothedCentsOff, setSmoothedCentsOff] = useState(0);

  // Grabación de Voz Local (RAM)
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const isSharedContextRef = useRef<boolean>(false);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const highpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const recordDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const vocalRecordNodesRef = useRef<{ pop?: BiquadFilterNode; comp?: DynamicsCompressorNode; gain?: GainNode } | null>(null);
  const backingNodesRef = useRef<{ delay?: DelayNode; gain?: GainNode } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isSilent = useRef(true);
  const lastStateUpdateTime = useRef<number>(0);

  const bufferRef = useRef<Float32Array | null>(null);
  const isMicEmittedRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const lastErrorToastTimeRef = useRef<number>(0);

  const start = useCallback(async (
    _externalCtx?: AudioContext | null,
    trackOutputGain?: GainNode | null,
    isUsingHeadphones?: boolean,
    userInitiated: boolean = false
  ): Promise<boolean> => {
    if (isStartingRef.current || (streamRef.current && isDetecting)) {
      return isDetecting;
    }
    isStartingRef.current = true;
    try {
      if (navigator.mediaDevices) {
        // Fase 1: Adquirir stream centralizado sin duplicar getUserMedia ni filtros VoiceProcessingIO
        const stream = await audioService.acquireMicrophoneStream('karaoke');
        streamRef.current = stream;

        // Asegurar que los tracks de audio permanezcan activos
        stream.getAudioTracks().forEach(t => {
          t.enabled = true;
        });

        // Fase 3: AudioContext Unificado a 48000 Hz nativos
        const context = _externalCtx || audioService.getSharedContext();
        if (context.state === 'suspended') {
          await context.resume();
        }
        audioContextRef.current = context;
        isSharedContextRef.current = true;

        const source = context.createMediaStreamSource(stream);
        mediaStreamSourceRef.current = source;

        analyserRef.current = context.createAnalyser();
        analyserRef.current.fftSize = 2048;

        // Fase 2: Filtro pasa-banda vocal antes del AnalyserNode
        // 1. High-pass a 90 Hz (Q = 0.707) para cortar el subgrave y el bombo del altavoz
        const highpassFilter = context.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.setValueAtTime(90, context.currentTime);
        highpassFilter.Q.setValueAtTime(0.707, context.currentTime);
        highpassFilterRef.current = highpassFilter;

        // 2. Low-pass a 1100 Hz (Q = 0.707) para cortar platillos y armónicos agudos
        const lowpassFilter = context.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(1100, context.currentTime);
        lowpassFilter.Q.setValueAtTime(0.707, context.currentTime);
        lowpassFilterRef.current = lowpassFilter;

        // Pre-amplificador 4x para señal de micrófono sin AGC de Apple
        const micBoostGain = context.createGain();
        micBoostGain.gain.setValueAtTime(4.0, context.currentTime);

        // Cadena de análisis: Mic -> HighPass (90Hz) -> LowPass (1100Hz) -> PreAmp (4x) -> Analyser
        source.connect(highpassFilter).connect(lowpassFilter).connect(micBoostGain).connect(analyserRef.current);

        // Silent sink mudo (0% volumen) hacia destination (soluciona el bug de Dead-End Graph de WebKit en iOS)
        const silentSink = context.createGain();
        silentSink.gain.setValueAtTime(0.0, context.currentTime);
        analyserRef.current.connect(silentSink);
        silentSink.connect(context.destination);

        if (context.state !== 'running') {
          await context.resume().catch(() => {});
        }

        // Fase 4: Bus de Mezcla para Grabación de Estudio (MediaStreamAudioDestinationNode)
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
          setAudioBlobUrl(null);
        }
        audioChunksRef.current = [];

        try {
          const recordDestination = context.createMediaStreamDestination();
          recordDestinationRef.current = recordDestination;

          // Rama vocal para grabación:
          // Highpass a 80 Hz para eliminar golpes de aire (plosivas P/B) y ruido de sostener el teléfono
          const vocalPopFilter = context.createBiquadFilter();
          vocalPopFilter.type = 'highpass';
          vocalPopFilter.frequency.setValueAtTime(80, context.currentTime);
          vocalPopFilter.Q.setValueAtTime(0.707, context.currentTime);

          // Compresor suave para nivelar la voz del alumno
          const vocalCompressor = context.createDynamicsCompressor();
          vocalCompressor.threshold.setValueAtTime(-24, context.currentTime);
          vocalCompressor.knee.setValueAtTime(30, context.currentTime);
          vocalCompressor.ratio.setValueAtTime(4, context.currentTime);
          vocalCompressor.attack.setValueAtTime(0.005, context.currentTime);
          vocalCompressor.release.setValueAtTime(0.25, context.currentTime);

          const vocalRecordGain = context.createGain();
          vocalRecordGain.gain.setValueAtTime(1.4, context.currentTime);

          source.connect(vocalPopFilter);
          vocalPopFilter.connect(vocalCompressor);
          vocalCompressor.connect(vocalRecordGain);
          vocalRecordGain.connect(recordDestination);

          // Rama de la pista (si hay audífonos conectados):
          const headphonesActive = isUsingHeadphones ?? audioService.isUsingHeadphones();
          if (headphonesActive && trackOutputGain) {
            // DelayNode de 35 ms para compensar la latencia de entrada de iOS/Android
            const latencyDelay = context.createDelay(0.2);
            latencyDelay.delayTime.setValueAtTime(0.035, context.currentTime);

            const backingRecordGain = context.createGain();
            backingRecordGain.gain.setValueAtTime(0.65, context.currentTime);

            trackOutputGain.connect(latencyDelay);
            latencyDelay.connect(backingRecordGain);
            backingRecordGain.connect(recordDestination);
            backingNodesRef.current = { delay: latencyDelay, gain: backingRecordGain };
          }
          vocalRecordNodesRef.current = { pop: vocalPopFilter, comp: vocalCompressor, gain: vocalRecordGain };

          // MediaRecorder multiplataforma: audio/mp4 en iOS Safari, audio/webm en Android/Chrome
          const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : 'audio/webm';

          const mediaRecorder = new MediaRecorder(recordDestination.stream, { mimeType });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(blob);
            setAudioBlobUrl(url);
          };

          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
        } catch (recErr) {
          console.warn('[usePitchDetection] MediaRecorder no disponible en este dispositivo:', recErr);
        }
        setIsDetecting(true);
        return true;
      } else {
        throw new Error("getUserMedia not supported on your browser!");
      }
    } catch (err: any) {
      console.error('[usePitchDetection] Error al capturar micrófono:', err);
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((track) => track.stop());
        } catch {}
        streamRef.current = null;
      }
      setIsDetecting(false);

      // Solo mostrar toast si fue iniciado explícitamente por el usuario
      if (userInitiated) {
        const now = Date.now();
        if (now - lastErrorToastTimeRef.current > 6000) {
          lastErrorToastTimeRef.current = now;
          if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
            const isStandalone =
              typeof window !== 'undefined' &&
              typeof window.matchMedia === 'function' &&
              window.matchMedia('(display-mode: standalone)').matches;
            toast({
              variant: "destructive",
              title: "Acceso al Micrófono Denegado",
              description: isStandalone
                ? 'Ajustes del teléfono → Aplicaciones → AfinApp → Permisos → Micrófono → Permitir.'
                : 'Por favor permite el acceso al micrófono en la barra superior o ajustes de tu navegador.',
            });
          }
        }
      }
      return false;
    } finally {
      isStartingRef.current = false;
    }
  }, [audioBlobUrl, isDetecting, toast]);

  const stop = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Stop MediaRecorder first so onstop fires and builds the Blob
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Desconectar nodos de audio
    if (mediaStreamSourceRef.current) {
      try { mediaStreamSourceRef.current.disconnect(); } catch {}
      mediaStreamSourceRef.current = null;
    }
    if (highpassFilterRef.current) {
      try { highpassFilterRef.current.disconnect(); } catch {}
      highpassFilterRef.current = null;
    }
    if (lowpassFilterRef.current) {
      try { lowpassFilterRef.current.disconnect(); } catch {}
      lowpassFilterRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    }
    if (vocalRecordNodesRef.current) {
      try {
        vocalRecordNodesRef.current.pop?.disconnect();
        vocalRecordNodesRef.current.comp?.disconnect();
        vocalRecordNodesRef.current.gain?.disconnect();
      } catch {}
      vocalRecordNodesRef.current = null;
    }
    if (backingNodesRef.current) {
      try {
        backingNodesRef.current.delay?.disconnect();
        backingNodesRef.current.gain?.disconnect();
      } catch {}
      backingNodesRef.current = null;
    }
    recordDestinationRef.current = null;

    // Si el contexto era compartido (p. ej. de vocalRemover), NO cerrarlo para no cortar la música
    if (!isSharedContextRef.current && audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    isSharedContextRef.current = false;
    
    audioService.releaseMicrophoneStream();
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    if (isMicEmittedRef.current) {
      isMicEmittedRef.current = false;
      emitMicActive(false);
    }

    setIsDetecting(false);
    setFrequency(0);
    setNote(EMPTY_NOTE);
    setCentsOff(0);
    setSmoothedCentsOff(0);
    setRms(0);
    smoothedCentsRef.current = 0;
  }, []);
  
  const clearAudio = useCallback(() => {
     if (audioBlobUrl) {
         URL.revokeObjectURL(audioBlobUrl);
         setAudioBlobUrl(null);
         audioChunksRef.current = [];
     }
  }, [audioBlobUrl]);

  const updatePitchRef = useRef<(timestamp: number) => void>(() => {});

  const updatePitch = useCallback((timestamp: number) => {
    if (!analyserRef.current || !audioContextRef.current) {
      animationFrameId.current = requestAnimationFrame((ts) => updatePitchRef.current(ts));
      return;
    }

    const ctx = audioContextRef.current;
    if (ctx && (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted')) {
      ctx.resume().catch(() => {});
    }

    // THROTTLE: Only process DSP every ~40ms (25 FPS cap) to save CPU
    if (timestamp - lastStateUpdateTime.current > 40) {
      lastStateUpdateTime.current = timestamp;

      const fftSize = analyserRef.current.fftSize;
      if (!bufferRef.current || bufferRef.current.length !== fftSize) {
        bufferRef.current = new Float32Array(fftSize);
      }
      
      analyserRef.current.getFloatTimeDomainData(bufferRef.current);
      const dataArray = bufferRef.current;
      
      // Calculate RMS volume level
      let rmsVal = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i];
        rmsVal += val * val;
      }
      rmsVal = Math.sqrt(rmsVal / dataArray.length);

      setRms(rmsVal);

      const pitch = autoCorrelate(dataArray, audioContextRef.current.sampleRate);

      if (pitch !== -1 && pitch < 2000) {
        isSilent.current = false;
        const detectedNote = noteFromPitch(pitch);
        const currentCents = centsOffFromPitch(pitch, detectedNote.frequency);
        
        const SMOOTHING_FACTOR = 0.25;
        smoothedCentsRef.current = SMOOTHING_FACTOR * currentCents + (1 - SMOOTHING_FACTOR) * smoothedCentsRef.current;
        
        setFrequency(pitch);
        setNote(prevNote => {
            if (detectedNote.name !== prevNote.name || detectedNote.octave !== prevNote.octave) {
            return detectedNote;
            }
            return prevNote;
        });
        setCentsOff(currentCents);
        setSmoothedCentsOff(smoothedCentsRef.current);
      } else {
        if (!isSilent.current) {
          isSilent.current = true;
          smoothedCentsRef.current = 0;
          
          setFrequency(0);
          setNote(EMPTY_NOTE);
          setCentsOff(0);
          setSmoothedCentsOff(0);
        }
      }
    }
  
    animationFrameId.current = requestAnimationFrame((ts) => updatePitchRef.current(ts));
  }, []);

  updatePitchRef.current = updatePitch;
  
  useEffect(() => {
    if (isDetecting) {
        animationFrameId.current = requestAnimationFrame(updatePitch);
    }
    
    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    }
  }, [isDetecting, updatePitch]);

  // Clean up mic only on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);


  return { note, frequency, centsOff, smoothedCentsOff, isDetecting, rms, start, stop, audioBlobUrl, clearAudio };
};
