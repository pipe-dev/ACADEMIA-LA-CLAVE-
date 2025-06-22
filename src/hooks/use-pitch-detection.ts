"use client";

import { useState, useRef, useCallback } from "react";
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

  if (rms < 0.01) { // Not enough signal
    return -1;
  }

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const newBuf = buf.slice(r1, r2);
  const newSize = newBuf.length;
  const c = new Float32Array(newSize);

  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] = c[i] + newBuf[j] * newBuf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
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

  return sampleRate / T0;
};


export const usePitchDetection = () => {
  const { toast } = useToast();
  const [note, setNote] = useState<Partial<Note>>({});
  const [frequency, setFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);

  const detectPitch = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
      const pitch = autoCorrelate(dataArrayRef.current, audioContextRef.current!.sampleRate);
      
      if (pitch !== -1) {
        setFrequency(pitch);
        const detectedNote = noteFromPitch(pitch);
        setNote(detectedNote);
        const cents = centsOffFromPitch(pitch, detectedNote.frequency);
        setCentsOff(cents);
      } else {
        setFrequency(0);
        setNote({});
        setCentsOff(0);
      }
    }
    animationFrameId.current = requestAnimationFrame(detectPitch);
  }, []);

  const start = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;

        dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);

        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);
        
        setIsDetecting(true);
        detectPitch();
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
  }, [detectPitch, toast]);

  const stop = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    setIsDetecting(false);
    setFrequency(0);
    setNote({});
    setCentsOff(0);
  }, []);

  return { note, frequency, centsOff, isDetecting, start, stop };
};
