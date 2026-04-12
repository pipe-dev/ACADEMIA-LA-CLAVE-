
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

  if (rms < 0.01) {
    return -1;
  }

  let c = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    let sum = 0;
    for (let j = 0; j < SIZE - i; j++) {
      sum += buf[j] * buf[j + i];
    }
    c[i] = sum;
  }

  let d = 0;
  while (d < c.length -1 && c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  if (maxpos === -1) {
    return -1;
  }
  
  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  if (T0 === 0) {
    return -1;
  }

  return sampleRate / T0;
};


export const usePitchDetection = () => {
  const { toast } = useToast();
  const [note, setNote] = useState<Partial<Note>>(EMPTY_NOTE);
  const [frequency, setFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);

  const smoothedCentsRef = useRef(0);
  const [smoothedCentsOff, setSmoothedCentsOff] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lowpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isSilent = useRef(true);
  const lastStateUpdateTime = useRef<number>(0);

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
        analyserRef.current.fftSize = 4096;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        const lowpassFilter = context.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(800, context.currentTime);
        lowpassFilterRef.current = lowpassFilter;

        source.connect(lowpassFilter).connect(analyserRef.current);
        
        isSilent.current = true;
        smoothedCentsRef.current = 0;
        lastStateUpdateTime.current = 0;
        setSmoothedCentsOff(0);
        setIsDetecting(true);
      } else {
        throw new Error("getUserMedia not supported on your browser!");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: `Please allow microphone access in your browser settings. Error: ${errorMessage}`,
      });
      setIsDetecting(false);
    }
  }, [toast]);

  const stop = useCallback(() => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
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
    smoothedCentsRef.current = 0;
  }, []);

  const updatePitch = useCallback((timestamp: number) => {
    if (!analyserRef.current || !audioContextRef.current) {
      animationFrameId.current = requestAnimationFrame(updatePitch);
      return;
    }
  
    const dataArray = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(dataArray);
    const pitch = autoCorrelate(dataArray, audioContextRef.current.sampleRate);
  
    if (pitch !== -1 && pitch < 2000) {
      isSilent.current = false;
      const detectedNote = noteFromPitch(pitch);
      const currentCents = centsOffFromPitch(pitch, detectedNote.frequency);
      
      const SMOOTHING_FACTOR = 0.25;
      smoothedCentsRef.current = SMOOTHING_FACTOR * currentCents + (1 - SMOOTHING_FACTOR) * smoothedCentsRef.current;
      
      // THROTTLE: Only hit React State every ~40ms (25 FPS cap)
      if (timestamp - lastStateUpdateTime.current > 40) {
        lastStateUpdateTime.current = timestamp;
        
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
    } else {
      if (!isSilent.current) {
        isSilent.current = true;
        smoothedCentsRef.current = 0;
        lastStateUpdateTime.current = timestamp;
        
        setFrequency(0);
        setNote(EMPTY_NOTE);
        setCentsOff(0);
        setSmoothedCentsOff(0);
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


  return { note, frequency, centsOff, smoothedCentsOff, isDetecting, start, stop };
};
