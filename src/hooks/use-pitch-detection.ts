
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

interface AutoCorrelateResult {
  pitch: number;
  clarity: number;
}

const autoCorrelate = (buf: Float32Array, sampleRate: number): AutoCorrelateResult => {
  const SIZE = buf.length;
  let sumSquares = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    sumSquares += val * val;
  }
  const rms = Math.sqrt(sumSquares / SIZE);

  // Ignorar ruido de fondo mínimo
  if (rms < 0.002) {
    return { pitch: -1, clarity: 0 };
  }

  // Restricción a rango vocal (~60 Hz a ~1000 Hz)
  const minLag = Math.floor(sampleRate / 1000); // ~44 samples a 44.1kHz
  const maxLag = Math.min(SIZE - 2, Math.ceil(sampleRate / 60)); // ~735 samples a 44.1kHz

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

  // Heurística de primer pico local fuerte (> 90% del máximo) para evitar saltos de octava
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
    return { pitch: -1, clarity: 0 };
  }

  // Normalización real sin sesgo de ventana (McLeod / NSDF sobre la ventana solapada exacta)
  // Elimina la penalización matemática en notas graves masculinas (< 200 Hz / lag > 240)
  let energy1 = 0;
  let energy2 = 0;
  for (let j = 0; j < SIZE - bestLag; j++) {
    energy1 += buf[j] * buf[j];
    energy2 += buf[j + bestLag] * buf[j + bestLag];
  }
  const denom = Math.sqrt(energy1 * energy2);
  const clarity = denom > 0 ? Math.max(0, Math.min(1, c[bestLag] / denom)) : 0;

  // Interpolación parabólica para afinación continua de alta resolución
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

  if (T0 === 0) return { pitch: -1, clarity };
  return { pitch: sampleRate / T0, clarity };
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

  // Referencias para Bleed Gate y Estabilidad Temporal
  const isUsingHeadphonesRef = useRef<boolean>(false);
  const getBackingRmsRef = useRef<(() => number) | null>(null);
  const stableCandidateNoteRef = useRef<string>('');
  const stableFramesCountRef = useRef<number>(0);

  const start = useCallback(async (
    _externalCtx?: AudioContext | null,
    trackOutputGain?: GainNode | null,
    isUsingHeadphones: boolean = false,
    userInitiated: boolean = false,
    getBackingRms?: () => number
  ): Promise<boolean> => {
    if (isStartingRef.current || (streamRef.current && isDetecting)) {
      return isDetecting;
    }
    isStartingRef.current = true;
    isUsingHeadphonesRef.current = !!isUsingHeadphones;
    getBackingRmsRef.current = getBackingRms || null;
    stableFramesCountRef.current = 0;
    stableCandidateNoteRef.current = '';

    try {
      if (navigator.mediaDevices) {
        // Fase 1: Adquirir stream centralizado sin duplicar getUserMedia ni filtros VoiceProcessingIO
        const stream = await audioService.acquireMicrophoneStream('karaoke');
        streamRef.current = stream;

        // Emitir evento de micrófono activo para que los reproductores apliquen compensación anti-ducking inmediata
        if (!isMicEmittedRef.current) {
          isMicEmittedRef.current = true;
          emitMicActive(true);
        }

        // WebKit AudioSession: 'auto' evita que iOS imponga el perfil VoiceChat o filtre el audio
        if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
          try {
            (navigator as any).audioSession.type = 'auto';
          } catch {}
        }

        // Asegurar que los tracks de audio permanezcan activos
        stream.getAudioTracks().forEach(t => {
          t.enabled = true;
        });

        // Fase 3: AudioContext dedicado y aislado para el micrófono
        // AISLAMIENTO TOTAL: NUNCA conectar el micrófono al AudioContext de la música.
        // Esto garantiza que iOS CoreAudio JAMÁS aplique filtros de llamada telefónica (VoiceProcessingIO) a la canción.
        let context = audioContextRef.current;
        if (!context || context.state === 'closed') {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          try {
            context = new AudioCtx({ latencyHint: 'interactive' });
          } catch {
            context = new AudioCtx();
          }
          audioContextRef.current = context;
          isSharedContextRef.current = false;
        }
        if (context.state === 'suspended') {
          await context.resume().catch(() => {});
        }

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

        // Pre-amplificador diferenciado:
        // En Karaoke SIN audífonos, bajar a 1.5x para evitar captar el parlante
        // CON audífonos, 4.0x para máxima sensibilidad vocal
        const micBoostGain = context.createGain();
        const boostVal = isUsingHeadphones ? 4.0 : 1.5;
        micBoostGain.gain.setValueAtTime(boostVal, context.currentTime);

        // Cadena de análisis: Mic -> HighPass (90Hz) -> LowPass (1100Hz) -> PreAmp (4x) -> Analyser
        // El micrófono NUNCA se conecta a context.destination para evitar que el OS active el modo llamada y ducking.
        source.connect(highpassFilter).connect(lowpassFilter).connect(micBoostGain).connect(analyserRef.current);

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
      if (isMicEmittedRef.current) {
        isMicEmittedRef.current = false;
        emitMicActive(false);
      }
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
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        (navigator as any).audioSession.type = 'playback';
        setTimeout(() => {
          try {
            (navigator as any).audioSession.type = 'auto';
          } catch {}
        }, 50);
      } catch {}
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    if (isMicEmittedRef.current) {
      isMicEmittedRef.current = false;
      emitMicActive(false);
    }

    stableFramesCountRef.current = 0;
    stableCandidateNoteRef.current = '';

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

      const isHeadphones = isUsingHeadphonesRef.current;
      const backingRms = getBackingRmsRef.current ? getBackingRmsRef.current() : 0;

      // ─── Compuerta Dinámica Anti-Acople (Backing Track Bleed Gate) ───
      // En Karaoke sin audífonos, la voz cantando cerca del micrófono (>0.035) debe superar
      // la energía acústica de la canción que sale por el altavoz (Math.max(0.028, backingRms * 1.45)).
      const dynamicThreshold = isHeadphones ? 0.003 : Math.max(0.028, backingRms * 1.45);

      if (rmsVal < dynamicThreshold) {
        // La señal es mero sangrado del altavoz o silencio: no premiar ni computar
        stableFramesCountRef.current = 0;
        stableCandidateNoteRef.current = '';
        if (!isSilent.current) {
          isSilent.current = true;
          smoothedCentsRef.current = 0;
          setFrequency(0);
          setNote(EMPTY_NOTE);
          setCentsOff(0);
          setSmoothedCentsOff(0);
        }
        animationFrameId.current = requestAnimationFrame((ts) => updatePitchRef.current(ts));
        return;
      }

      // ─── Detección de Tono y Coeficiente de Pureza Periódica ───
      const { pitch, clarity } = autoCorrelate(dataArray, audioContextRef.current.sampleRate);

      // ─── Filtro de Pureza Monofónica (Anti-Acople Polifónico) ───
      // Los acordes, percusión y armonía de la canción dan baja pureza (< 0.85).
      // La voz humana cantada a poca distancia produce una onda cuasi-periódica con pureza >= 0.88.
      const minClarity = isHeadphones ? 0.82 : 0.88;

      if (pitch === -1 || pitch >= 2000 || clarity < minClarity) {
        stableFramesCountRef.current = 0;
        stableCandidateNoteRef.current = '';
        if (!isSilent.current) {
          isSilent.current = true;
          smoothedCentsRef.current = 0;
          setFrequency(0);
          setNote(EMPTY_NOTE);
          setCentsOff(0);
          setSmoothedCentsOff(0);
        }
        animationFrameId.current = requestAnimationFrame((ts) => updatePitchRef.current(ts));
        return;
      }

      // ─── Filtro de Estabilidad Temporal (Mínimo 3 frames continuos ~50ms) ───
      const detectedNote = noteFromPitch(pitch);
      const noteKey = `${detectedNote.name}${detectedNote.octave}`;

      if (stableCandidateNoteRef.current === noteKey) {
        stableFramesCountRef.current += 1;
      } else {
        stableCandidateNoteRef.current = noteKey;
        stableFramesCountRef.current = 1;
      }

      const requiredFrames = isHeadphones ? 1 : 3;
      if (stableFramesCountRef.current < requiredFrames) {
        // Aún en ventana de confirmación de estabilidad: no proyectar ni sumar puntos espurios
        animationFrameId.current = requestAnimationFrame((ts) => updatePitchRef.current(ts));
        return;
      }

      isSilent.current = false;
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
