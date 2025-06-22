"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";

type Note = {
  name: string;
  octave: number;
  frequency: number;
};

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4 = 440;
const C0 = A4 * Math.pow(2, -4.75);

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

// Autocorrelation function to find the fundamental frequency
const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
  const SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.015) { // Not enough signal
    return -1;
  }

  const c = new Float32Array(SIZE);

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (d < SIZE -1 && c[d] > c[d + 1]) {
    d++;
  }
  
  if (d >= SIZE -1) {
    return -1;
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
  
  if (T0 > 0 && T0 < SIZE - 1) {
      const x1 = c[T0 - 1];
      const x2 = c[T0];
      const x3 = c[T0 + 1];

      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;

      if (a) {
        const adjustment = -b / (2 * a);
        if (Math.abs(adjustment) < 1) { 
          T0 = T0 + adjustment;
        }
      }
  }

  if (T0 === 0) {
      return -1;
  }

  return sampleRate / T0;
};


export const usePitchDetection = () => {
  const { toast } = useToast();
  const [note, setNote] = useState<Partial<Note>>({});
  const [frequency, setFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);

  const smoothedCentsRef = useRef(0);
  const [smoothedCentsOff, setSmoothedCentsOff] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);

  const stop = useCallback(() => {
    setIsDetecting(false);
  }, []);
  
  const updatePitch = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
    const pitch = autoCorrelate(dataArrayRef.current, audioContextRef.current.sampleRate);
    
    if (pitch !== -1 && pitch < 2000) { // Add upper frequency limit for human voice
      setFrequency(pitch);
      const detectedNote = noteFromPitch(pitch);
      setNote(detectedNote);

      const currentCents = centsOffFromPitch(pitch, detectedNote.frequency);
      setCentsOff(currentCents);

      const SMOOTHING_FACTOR = 0.25;
      const newSmoothedCents = SMOOTHING_FACTOR * currentCents + (1 - SMOOTHING_FACTOR) * smoothedCentsRef.current;
      smoothedCentsRef.current = newSmoothedCents;
      setSmoothedCentsOff(newSmoothedCents);

    } else {
      setFrequency(0);
      setNote({});
      setCentsOff(0);
      
      const DECAY_FACTOR = 0.95;
      const newSmoothedCents = smoothedCentsRef.current * DECAY_FACTOR;
      if (Math.abs(newSmoothedCents) < 0.1) {
          smoothedCentsRef.current = 0;
          setSmoothedCentsOff(0);
      } else {
          smoothedCentsRef.current = newSmoothedCents;
          setSmoothedCentsOff(newSmoothedCents);
      }
    }
  }, []);

  useEffect(() => {
    if (isDetecting) {
      const loop = () => {
        updatePitch();
        animationFrameId.current = requestAnimationFrame(loop);
      };
      animationFrameId.current = requestAnimationFrame(loop);
    } else {
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
      setFrequency(0);
      setNote({});
      setCentsOff(0);
      setSmoothedCentsOff(0);
      smoothedCentsRef.current = 0;
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
       if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [isDetecting, updatePitch]);


  const start = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;

        dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        smoothedCentsRef.current = 0;
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

  return { note, frequency, centsOff, smoothedCentsOff, isDetecting, start, stop };
};
