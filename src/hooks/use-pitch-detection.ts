
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";

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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lowpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isSilent = useRef(true);
  const lastStateUpdateTime = useRef<number>(0);

  const bufferRef = useRef<Float32Array | null>(null);

  const start = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (context.state === 'suspended') {
            await context.resume();
        }
        audioContextRef.current = context;

        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048; // Reduced fftSize for mobile performance

        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        const lowpassFilter = context.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(800, context.currentTime);
        lowpassFilterRef.current = lowpassFilter;

        source.connect(lowpassFilter).connect(analyserRef.current);
        
        // Setup MediaRecorder for RAM Audio Recording
        if (audioBlobUrl) {
          URL.revokeObjectURL(audioBlobUrl);
          setAudioBlobUrl(null);
        }
        audioChunksRef.current = [];
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
        
        mediaRecorder.start(1000); // chunk every 1 second
        mediaRecorderRef.current = mediaRecorder;
        
        isSilent.current = true;
        smoothedCentsRef.current = 0;
        lastStateUpdateTime.current = 0;
        setSmoothedCentsOff(0);
        setRms(0);
        setIsDetecting(true);
      } else {
        throw new Error("getUserMedia not supported on your browser!");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Acceso al Micrófono Denegado",
        description: `Por favor permite el acceso al micrófono en la configuración de tu navegador.`,
      });
      setIsDetecting(false);
    }
  }, [toast]);

  const stop = useCallback(() => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    }
    
    // Stop MediaRecorder first so onstop fires and builds the Blob
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
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

  const updatePitch = useCallback((timestamp: number) => {
    if (!analyserRef.current || !audioContextRef.current) {
      animationFrameId.current = requestAnimationFrame(updatePitch);
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
  
    animationFrameId.current = requestAnimationFrame(updatePitch);
  }, []);
  
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
