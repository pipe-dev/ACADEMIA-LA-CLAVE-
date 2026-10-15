
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";
import { emitMicActive } from "@/utils/micEvents";

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

  // Ignorar ruido de fondo (Silence threshold)
  // Bajar un poco el umbral para detectar susurros o voces suaves
  if (rms < 0.01) {
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
  const lowpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isSilent = useRef(true);
  const lastStateUpdateTime = useRef<number>(0);

  const bufferRef = useRef<Float32Array | null>(null);
  const isMicEmittedRef = useRef<boolean>(false);

  const start = useCallback(async (externalCtx?: AudioContext | null) => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 1. AudioSession Preparation (WebKit/iOS):
        // Primero señalizar 'playback' y luego 'play-and-record' fuerza la salida
        // al ALTAVOZ PRINCIPAL (evitando el auricular telefónico de llamadas)
        // a la vez que habilita el acceso de captura de micrófono sin restricciones.
        if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
          try {
            (navigator as any).audioSession.type = 'play-and-record';
          } catch {}
        }

        // 2. Solicitud de micrófono optimizada para MÚSICA y CANTO (NO modo llamada / telefonía)
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            },
            video: false
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
        streamRef.current = stream;

        // 3. Confirmar sesión activa de captura
        if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
          try {
            (navigator as any).audioSession.type = 'play-and-record';
          } catch {}
        }
        
        // 4. Conexión de AudioContext Compartido o Nuevo:
        // Compartir el MISMO AudioContext que reproduce la música evita que el S.O.
        // detecte dos contextos compitiendo y atenúe (duck) la canción de fondo.
        let context: AudioContext;
        if (externalCtx && externalCtx.state !== 'closed') {
          context = externalCtx;
          isSharedContextRef.current = true;
        } else {
          context = new (window.AudioContext || (window as any).webkitAudioContext)();
          isSharedContextRef.current = false;
        }

        if (context.state === 'suspended') {
          await context.resume();
        }
        audioContextRef.current = context;

        analyserRef.current = context.createAnalyser();
        analyserRef.current.fftSize = 2048; // Reducido para óptimo rendimiento móvil

        const source = context.createMediaStreamSource(stream);
        mediaStreamSourceRef.current = source;
        
        const lowpassFilter = context.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(800, context.currentTime);
        lowpassFilterRef.current = lowpassFilter;

        // Conectar micrófono SOLO al analizador (NUNCA a destination para evitar feedback acústico)
        source.connect(lowpassFilter).connect(analyserRef.current);
        
        // Setup MediaRecorder for RAM Audio Recording
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
          setAudioBlobUrl(null);
        }
        audioChunksRef.current = [];
        try {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
          });
          
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
          
          mediaRecorder.start(1000); // fragmentar cada 1s
          mediaRecorderRef.current = mediaRecorder;
        } catch (recErr) {
          console.warn('[usePitchDetection] MediaRecorder no disponible en este dispositivo:', recErr);
        }
        
        isSilent.current = true;
        smoothedCentsRef.current = 0;
        lastStateUpdateTime.current = 0;
        setSmoothedCentsOff(0);
        setRms(0);
        setIsDetecting(true);
        if (!isMicEmittedRef.current) {
          isMicEmittedRef.current = true;
          emitMicActive(true);
        }
      } else {
        throw new Error("getUserMedia not supported on your browser!");
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Acceso al Micrófono Denegado",
        description: `Por favor permite el acceso al micrófono en la configuración de tu navegador.`,
      });
      setIsDetecting(false);
    }
  }, [audioBlobUrl, toast]);

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
    if (lowpassFilterRef.current) {
      try { lowpassFilterRef.current.disconnect(); } catch {}
      lowpassFilterRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    }

    // Si el contexto era compartido (p. ej. de vocalRemover), NO cerrarlo para no cortar la música
    if (!isSharedContextRef.current && audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    isSharedContextRef.current = false;
    
    // Restaurar sesión de audio a modo playback para mantener sonido con interruptor de silencio o modos de enfoque
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        (navigator as any).audioSession.type = 'playback';
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
