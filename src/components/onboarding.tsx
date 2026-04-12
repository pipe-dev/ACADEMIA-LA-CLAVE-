'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Mic, MicOff, Music, Brain, ArrowRight, Sparkles, Hand, Footprints,
  Heart, Flame, Star, CheckCircle2, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dbSave, dbLoad } from '@/lib/db';
import { usePitchDetection } from '@/hooks/use-pitch-detection';
import { useProfile } from '@/hooks/use-profile';
import { PitchGauge } from './pitch-gauge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';

/* ─── Note helpers ─── */
const noteStrings = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

function midiToNote(midi: number) {
  const name = noteStrings[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  return { name, octave, frequency, fullName: `${name}${octave}`, midi };
}

/* ─── Audio hook for playing notes with MP3s and drums ─── */
function useInteractiveAudio(gender: 'masculino' | 'femenino') {
  const ctxRef = useRef<AudioContext | null>(null);
  const audioBufferCache = useRef(new Map<string, AudioBuffer>());

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const playTone = useCallback(async (note: ReturnType<typeof midiToNote>, duration = 0.6) => {
    try {
      const ctx = getCtx();
      const americanNoteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note.midi % 12];
      const americanFullName = `${americanNoteName}${note.octave}`;
      const fileNameFriendly = americanFullName.replace('#', 's');
      const audioKey = `${gender}_${fileNameFriendly}`;

      let buffer = audioBufferCache.current.get(audioKey);
      if (!buffer) {
        const response = await fetch(`/sounds/${audioKey}.mp3`);
        if (response.ok) {
           const arrayBuffer = await response.arrayBuffer();
           buffer = await ctx.decodeAudioData(arrayBuffer);
           audioBufferCache.current.set(audioKey, buffer);
        }
      }

      const gain = ctx.createGain();
      
      if (buffer) {
         const source = ctx.createBufferSource();
         source.buffer = buffer;
         gain.gain.setValueAtTime(1, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
         source.connect(gain);
         gain.connect(ctx.destination);
         source.start(ctx.currentTime);
         source.stop(ctx.currentTime + duration);
      } else {
         // fallback oscillator
         const osc = ctx.createOscillator();
         osc.type = 'sine';
         osc.frequency.value = note.frequency;
         gain.gain.setValueAtTime(0.3, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + duration);
      }
    } catch (_) {}
  }, [gender]);

  const playDrum = useCallback((type: 'kick' | 'clap') => {
    try {
      const ctx = getCtx();
      if (type === 'kick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 3000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        noise.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(ctx.destination);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.12);
      }
    } catch (_) {}
  }, []);

  return { playTone, playDrum };
}

/* ─── Slide type ─── */
type SlideId = 'welcome' | 'standard' | 'mic-test' | 'arpeggio' | 'simon' | 'rhythm' | 'lives' | 'stars';

interface SlideConfig {
  id: SlideId;
  icon: React.ReactNode;
  title: string;
  description: string;
  bg: string;
}

const slides: SlideConfig[] = [
  {
    id: 'welcome',
    icon: <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-accent" />,
    title: '¡Bienvenido a AfinApp!',
    description: 'Tu entrenador vocal interactivo. Vamos a explorar juntos todos los modos de juego con mini-demos reales.',
    bg: 'from-accent/20 to-primary/10',
  },
  {
    id: 'mic-test',
    icon: <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-accent" />,
    title: 'Permiso de Micrófono',
    description: 'Necesitamos acceso a tu micrófono para detectar tu voz. Actívalo y canta cualquier nota.',
    bg: 'from-purple-500/20 to-pink-900/10',
  },
  {
    id: 'standard',
    icon: <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
    title: 'Modo Estándar',
    description: 'Toca una nota, cántala y mantén la afinación hasta que la barra se llene. ¡Pruébalo ahora!',
    bg: 'from-green-500/20 to-green-900/10',
  },
  {
    id: 'arpeggio',
    icon: <Music className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400" />,
    title: 'Arpegios & Melodías',
    description: 'Escucha la secuencia de notas y cántalas en orden. Las notas brillarán una por una.',
    bg: 'from-pink-500/20 to-purple-900/10',
  },
  {
    id: 'simon',
    icon: <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />,
    title: 'Simón Dice',
    description: 'Memoriza la secuencia de notas que escuchas y reprodúcela con tu voz. ¡Prueba memorizar 2 notas!',
    bg: 'from-purple-500/20 to-indigo-900/10',
  },
  {
    id: 'rhythm',
    icon: (
      <div className="flex gap-2">
        <Footprints className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
        <Hand className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
      </div>
    ),
    title: 'Modo Ritmo',
    description: 'Escucha el patrón y reprodúcelo tocando Kick y Clap. ¡Sigue el ritmo!',
    bg: 'from-blue-500/20 to-red-900/10',
  },
  {
    id: 'stars',
    icon: <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-accent" />,
    title: '¡Gana Estrellas!',
    description: 'Cada nivel te otorga de 1 a 3 estrellas ⭐ según tu rendimiento. ¡A jugar!',
    bg: 'from-accent/20 to-yellow-900/10',
  },
  {
    id: 'lives',
    icon: (
      <div className="flex gap-3">
        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 fill-red-500" />
        <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
      </div>
    ),
    title: 'Vidas & Rachas',
    description: 'Tienes 5 vidas que se recargan con el tiempo. ¡Mantén tu racha diaria para desbloquear premios exclusivos!',
    bg: 'from-red-500/20 to-orange-900/10',
  },
];

/* ─────────────────── MAIN COMPONENT ─────────────────── */

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [gender, setGender] = useState<'masculino' | 'femenino'>('masculino');
  
  useEffect(() => {
    dbLoad<'masculino' | 'femenino'>('afinapp_user_gender').then(g => {
      if (g) setGender(g);
    });
  }, []);
  
  const { note, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  const { playTone, playDrum } = useInteractiveAudio(gender);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Standard mode demo state
  const [stdDemoActive, setStdDemoActive] = useState(false);
  const [stdTargetNote, setStdTargetNote] = useState(() => midiToNote(gender === 'masculino' ? 48 : 60)); // Do3 o Do4
  const [stdActiveNote, setStdActiveNote] = useState<ReturnType<typeof midiToNote> | null>(null);
  const [stdInTuneTime, setStdInTuneTime] = useState(0);
  const [stdCompleted, setStdCompleted] = useState(false);
  const stdLastFrameRef = useRef<number>(0);
  const stdRafRef = useRef<number>(0);

  // Arpeggio demo state
  const [arpDemoActive, setArpDemoActive] = useState(false);
  const [arpNotes, setArpNotes] = useState(() => {
    const base = gender === 'masculino' ? 48 : 60;
    return [midiToNote(base), midiToNote(base + 4), midiToNote(base + 7)]; // Do-Mi-Sol
  });
  const [arpCompleted, setArpCompleted] = useState<Set<string>>(new Set());
  const [arpCurrentIdx, setArpCurrentIdx] = useState(0);
  const [arpInTuneTime, setArpInTuneTime] = useState(0);
  const [arpPlaybackIdx, setArpPlaybackIdx] = useState<number | null>(null);
  const arpRafRef = useRef<number>(0);
  const arpLastFrameRef = useRef<number>(0);

  // Simon Says demo state
  const [simonDemoActive, setSimonDemoActive] = useState(false);
  const [simonNotes, setSimonNotes] = useState(() => {
    const base = gender === 'masculino' ? 48 : 60;
    return [midiToNote(base), midiToNote(base + 7)]; // Do-Sol
  });
  const [simonPhase, setSimonPhase] = useState<'idle' | 'playback' | 'singing'>('idle');
  const [simonPlaybackIdx, setSimonPlaybackIdx] = useState<number | null>(null);
  const [simonPlayerIdx, setSimonPlayerIdx] = useState(0);
  const [simonCompleted, setSimonCompleted] = useState<Set<string>>(new Set());
  const [simonInTuneTime, setSimonInTuneTime] = useState(0);
  const simonRafRef = useRef<number>(0);
  const simonLastFrameRef = useRef<number>(0);

  // Rhythm demo state
  const [rhythmDemoActive, setRhythmDemoActive] = useState(false);
  const rhythmPattern = [
    { time: 0, instrument: 'kick' as const },
    { time: 700, instrument: 'clap' as const },
    { time: 1400, instrument: 'kick' as const },
    { time: 2100, instrument: 'clap' as const },
  ];
  const [rhythmPhase, setRhythmPhase] = useState<'idle' | 'guide' | 'playing' | 'done'>('idle');
  const [rhythmGuideIdx, setRhythmGuideIdx] = useState<number | null>(null);
  const [rhythmUserTaps, setRhythmUserTaps] = useState<{ time: number; instrument: 'kick' | 'clap' }[]>([]);
  const [rhythmScore, setRhythmScore] = useState<number | null>(null);
  const rhythmStartRef = useRef(0);
  const rhythmTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const [showLevelDialog, setShowLevelDialog] = useState(false);

  // Update notes if gender changes during render
  useEffect(() => {
    const base = gender === 'masculino' ? 48 : 60;
    setStdTargetNote(midiToNote(base));
    setArpNotes([midiToNote(base), midiToNote(base + 4), midiToNote(base + 7)]);
    setSimonNotes([midiToNote(base), midiToNote(base + 7)]);
  }, [gender]);

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const CHALLENGE_DURATION = 0.3; // seconds to hold a note in tune (muy fácil para el tutorial)
  const TOLERANCE = 45; // cents (muy tolerante para el tutorial)

  // ─── Cleanup on slide change ───
  useEffect(() => {
    setStdDemoActive(false);
    setStdActiveNote(null);
    setStdInTuneTime(0);
    setStdCompleted(false);
    setArpDemoActive(false);
    setArpCompleted(new Set());
    setArpCurrentIdx(0);
    setArpInTuneTime(0);
    setArpPlaybackIdx(null);
    setSimonDemoActive(false);
    setSimonPhase('idle');
    setSimonPlaybackIdx(null);
    setSimonPlayerIdx(0);
    setSimonCompleted(new Set());
    setSimonInTuneTime(0);
    setRhythmDemoActive(false);
    setRhythmPhase('idle');
    setRhythmGuideIdx(null);
    setRhythmUserTaps([]);
    setRhythmScore(null);
    setShowLevelDialog(false);
    rhythmTimeoutsRef.current.forEach(clearTimeout);
    rhythmTimeoutsRef.current = [];
    cancelAnimationFrame(stdRafRef.current);
    cancelAnimationFrame(arpRafRef.current);
    cancelAnimationFrame(simonRafRef.current);
  }, [currentSlide]);

  // ─── EFFECTS FOR COMPLETION MODALS ───
  useEffect(() => {
    if (stdCompleted) {
      const timer = setTimeout(() => setShowLevelDialog(true), 800);
      return () => clearTimeout(timer);
    }
  }, [stdCompleted]);

  useEffect(() => {
    if (arpDemoActive && arpCurrentIdx >= arpNotes.length && arpNotes.length > 0) {
      const timer = setTimeout(() => setShowLevelDialog(true), 800);
      return () => clearTimeout(timer);
    }
  }, [arpDemoActive, arpCurrentIdx, arpNotes.length]);

  useEffect(() => {
    if (simonDemoActive && simonPhase === 'singing' && simonPlayerIdx >= simonNotes.length && simonNotes.length > 0) {
      const timer = setTimeout(() => setShowLevelDialog(true), 800);
      return () => clearTimeout(timer);
    }
  }, [simonDemoActive, simonPhase, simonPlayerIdx, simonNotes.length]);

  // ─── STANDARD MODE: pitch tracking loop ───
  useEffect(() => {
    if (!stdDemoActive || !isDetecting || !stdActiveNote || stdCompleted) return;
    let running = true;
    stdLastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (!running) return;
      const dt = (now - stdLastFrameRef.current) / 1000;
      stdLastFrameRef.current = now;

      const isInTune =
        note.name === stdActiveNote.name &&
        note.octave === stdActiveNote.octave &&
        Math.abs(smoothedCentsOff) < TOLERANCE;

      if (isInTune) {
        setStdInTuneTime((prev) => {
          const next = prev + dt;
          if (next >= CHALLENGE_DURATION) {
            setStdCompleted(true);
            return CHALLENGE_DURATION;
          }
          return next;
        });
      } else {
        setStdInTuneTime((prev) => Math.max(0, prev - dt * 2));
      }
      stdRafRef.current = requestAnimationFrame(tick);
    };
    stdRafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(stdRafRef.current);
    };
  }, [stdDemoActive, isDetecting, stdActiveNote, stdCompleted, note, smoothedCentsOff]);

  // ─── ARPEGGIO MODE: pitch tracking loop ───
  useEffect(() => {
    if (!arpDemoActive || !isDetecting || arpCurrentIdx >= arpNotes.length) return;
    let running = true;
    arpLastFrameRef.current = performance.now();
    const target = arpNotes[arpCurrentIdx];

    const tick = (now: number) => {
      if (!running) return;
      const dt = (now - arpLastFrameRef.current) / 1000;
      arpLastFrameRef.current = now;

      const isInTune =
        note.name === target.name &&
        note.octave === target.octave &&
        Math.abs(smoothedCentsOff) < TOLERANCE;

      if (isInTune) {
        setArpInTuneTime((prev) => {
          const next = prev + dt;
          if (next >= CHALLENGE_DURATION) {
            setArpCompleted((s) => new Set(s).add(target.fullName));
            setArpCurrentIdx((i) => i + 1);
            setArpInTuneTime(0);
            return 0;
          }
          return next;
        });
      } else {
        setArpInTuneTime((prev) => Math.max(0, prev - dt * 2));
      }
      arpRafRef.current = requestAnimationFrame(tick);
    };
    arpRafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(arpRafRef.current);
    };
  }, [arpDemoActive, isDetecting, arpCurrentIdx, arpNotes, note, smoothedCentsOff]);

  // ─── SIMON SAYS: playback ───
  useEffect(() => {
    if (simonPhase !== 'playback' || !simonDemoActive) return;
    let cancelled = false;
    const play = async () => {
      for (let i = 0; i < simonNotes.length; i++) {
        if (cancelled) return;
        setSimonPlaybackIdx(i);
        playTone(simonNotes[i], 0.7);
        await new Promise((r) => setTimeout(r, 900));
      }
      if (!cancelled) {
        setSimonPlaybackIdx(null);
        setSimonPhase('singing');
        if (!isDetecting) start();
      }
    };
    play();
    return () => { cancelled = true; };
  }, [simonPhase, simonDemoActive, simonNotes, playTone, isDetecting, start]);

  // ─── SIMON SAYS: pitch tracking loop ───
  useEffect(() => {
    if (!simonDemoActive || simonPhase !== 'singing' || !isDetecting || simonPlayerIdx >= simonNotes.length) return;
    let running = true;
    simonLastFrameRef.current = performance.now();
    const target = simonNotes[simonPlayerIdx];

    const tick = (now: number) => {
      if (!running) return;
      const dt = (now - simonLastFrameRef.current) / 1000;
      simonLastFrameRef.current = now;

      const isInTune =
        note.name === target.name &&
        note.octave === target.octave &&
        Math.abs(smoothedCentsOff) < TOLERANCE;

      if (isInTune) {
        setSimonInTuneTime((prev) => {
          const next = prev + dt;
          if (next >= CHALLENGE_DURATION) {
            setSimonCompleted((s) => new Set(s).add(`${target.fullName}-${simonPlayerIdx}`));
            setSimonPlayerIdx((i) => i + 1);
            setSimonInTuneTime(0);
            return 0;
          }
          return next;
        });
      } else {
        setSimonInTuneTime((prev) => Math.max(0, prev - dt * 2));
      }
      simonRafRef.current = requestAnimationFrame(tick);
    };
    simonRafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(simonRafRef.current);
    };
  }, [simonDemoActive, simonPhase, isDetecting, simonPlayerIdx, simonNotes, note, smoothedCentsOff]);

  // ─── RHYTHM: guide playback ───
  const startRhythmGuide = useCallback(() => {
    setRhythmPhase('guide');
    setRhythmGuideIdx(null);
    setRhythmUserTaps([]);
    setRhythmScore(null);
    rhythmTimeoutsRef.current.forEach(clearTimeout);
    rhythmTimeoutsRef.current = [];

    rhythmPattern.forEach((beat, i) => {
      const t = setTimeout(() => {
        setRhythmGuideIdx(i);
        playDrum(beat.instrument);
      }, beat.time);
      rhythmTimeoutsRef.current.push(t);
    });

    const last = rhythmPattern[rhythmPattern.length - 1];
    const endT = setTimeout(() => {
      setRhythmGuideIdx(null);
      setRhythmPhase('playing');
      rhythmStartRef.current = Date.now();
    }, last.time + 600);
    rhythmTimeoutsRef.current.push(endT);
  }, [playDrum]);

  const handleRhythmTap = useCallback((instrument: 'kick' | 'clap') => {
    if (rhythmPhase !== 'playing') return;
    playDrum(instrument);
    const elapsed = Date.now() - rhythmStartRef.current;
    setRhythmUserTaps((prev) => {
      const next = [...prev, { time: elapsed, instrument }];
      if (next.length >= rhythmPattern.length) {
        // evaluate
        let matched = 0;
        for (const tap of next) {
          const closest = rhythmPattern.reduce((best, beat) =>
            Math.abs(beat.time - tap.time) < Math.abs(best.time - tap.time) ? beat : best
          );
          if (closest.instrument === tap.instrument && Math.abs(closest.time - tap.time) < 600) {
            matched++;
          }
        }
        const score = Math.round((matched / rhythmPattern.length) * 100);
        setTimeout(() => {
          setRhythmScore(Math.max(50, score)); // Garantizar un puntaje mínimo
          setRhythmPhase('done');
          setTimeout(() => setShowLevelDialog(true), 600);
        }, 200);
      }
      return next;
    });
  }, [rhythmPhase, playDrum]);

  // ─── Navigation ───
  const handleNext = () => {
    if (isDetecting && slide.id !== 'mic-test') stop();
    if (isLast) {
      if (isDetecting) stop();
      dbSave('afinapp_onboarding_done', true).catch(console.error);
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (isDetecting) stop();
    dbSave('afinapp_onboarding_done', true).catch(console.error);
    onComplete();
  };

  const handleToggleMic = useCallback(() => {
    if (isDetecting) stop();
    else start();
  }, [isDetecting, start, stop]);

  // ─── Start demo handlers ───
  const startStandardDemo = () => {
    setStdDemoActive(true);
    const baseMidi = gender === 'masculino' ? 48 : 60;
    const n = midiToNote(baseMidi);
    setStdTargetNote(n);
    setStdActiveNote(n);
    setStdInTuneTime(0);
    setStdCompleted(false);
    playTone(n, 1);
    if (!isDetecting) start();
  };

  const startArpeggioDemo = () => {
    setArpDemoActive(true);
    setArpCompleted(new Set());
    setArpCurrentIdx(0);
    setArpInTuneTime(0);
    // Play sequence first
    arpNotes.forEach((n, i) => {
      setTimeout(() => {
        setArpPlaybackIdx(i);
        playTone(n, 0.6);
      }, i * 700);
    });
    setTimeout(() => {
      setArpPlaybackIdx(null);
      if (!isDetecting) start();
    }, arpNotes.length * 700 + 300);
  };

  const startSimonDemo = () => {
    setSimonDemoActive(true);
    setSimonPlayerIdx(0);
    setSimonCompleted(new Set());
    setSimonInTuneTime(0);
    setSimonPhase('playback');
  };

  const startRhythmDemo = () => {
    setRhythmDemoActive(true);
    startRhythmGuide();
  };

  /* ─── Mini note circle renderer ─── */
  const renderMiniNoteCircle = (
    notes: ReturnType<typeof midiToNote>[],
    completedSet: Set<string>,
    activeFullName: string | null,
    playbackIdx: number | null,
    centerContent: React.ReactNode,
    onNoteClick?: (n: ReturnType<typeof midiToNote>) => void,
    useIndexKeys?: boolean
  ) => {
    const R = 90;
    return (
      <div className="relative w-[220px] h-[220px] flex items-center justify-center mx-auto">
        {notes.map((n, i) => {
          const angle = (i / notes.length) * 2 * Math.PI - Math.PI / 2;
          const x = R * Math.cos(angle);
          const y = R * Math.sin(angle);
          const key = useIndexKeys ? `${n.fullName}-${i}` : n.fullName;
          const isComplete = completedSet.has(key);
          const isPlaying = playbackIdx === i;
          const isActive = activeFullName === n.fullName;

          return (
            <Button
              key={key}
              onClick={() => onNoteClick?.(n)}
              style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              className={cn(
                'absolute z-20 rounded-full flex flex-col justify-center items-center font-bold transition-all duration-300 shadow-lg w-[56px] h-[56px] text-xs',
                isComplete
                  ? 'bg-primary text-primary-foreground border-2 border-primary-foreground/50'
                  : 'bg-card hover:bg-card/80 border-2 border-primary/30',
                isActive && 'ring-4 ring-offset-background ring-offset-2 ring-accent',
                isPlaying && 'scale-110 shadow-[0_0_20px_hsl(var(--primary))]'
              )}
            >
              <span className="text-sm font-bold">{n.name}</span>
              <span className="text-[8px] opacity-70">OCT {n.octave}</span>
            </Button>
          );
        })}
        <Card className="absolute z-10 w-[120px] h-[120px] rounded-full shadow-2xl border-2 border-primary/20 flex items-center justify-center bg-transparent" style={{ background: 'radial-gradient(circle, hsl(var(--card)) 0%, hsl(var(--background)) 100%)' }}>
          <CardContent className="p-1 flex items-center justify-center w-full">
            {centerContent}
          </CardContent>
        </Card>
      </div>
    );
  };

  /* ─── Interactive content per slide ─── */
  const renderInteractiveContent = () => {
    switch (slide.id) {
      /* ── Standard Demo ── */
      case 'standard': {
        if (!stdDemoActive) {
          return (
            <Button onClick={startStandardDemo} size="lg" className="w-full rounded-full shadow-lg animate-pulse">
              <Play className="mr-2 w-5 h-5" /> Probar Modo Estándar
            </Button>
          );
        }
        const progress = (stdInTuneTime / CHALLENGE_DURATION) * 100;
        const centerContent = stdCompleted ? (
          <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-xs font-bold text-primary">¡Perfecto!</p>
          </div>
        ) : stdActiveNote ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <p className="text-xl font-bold text-primary">{stdActiveNote.fullName}</p>
            <p className="text-[10px] text-muted-foreground">Canta la nota</p>
            <div className="w-4/5 pt-1">
              <Progress value={progress} className="h-2" />
            </div>
            <PitchGauge centsOff={smoothedCentsOff} isActive={isDetecting && !!note.name} size={100} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Toca una nota</p>
        );

        return renderMiniNoteCircle(
          [stdTargetNote],
          stdCompleted ? new Set([stdTargetNote.fullName]) : new Set(),
          stdActiveNote?.fullName || null,
          null,
          centerContent,
          (n) => {
            if (!stdCompleted) {
              setStdActiveNote(n);
              playTone(n, 1);
            }
          }
        );
      }

      /* ── Mic test (keep existing) ── */
      case 'mic-test':
        return (
          <div className="flex flex-col items-center gap-4 w-full mt-2 animate-in fade-in duration-500">
            <Button
              onClick={handleToggleMic}
              size="lg"
              variant={isDetecting ? 'destructive' : 'default'}
              className="rounded-full w-20 h-20 p-0 shadow-xl"
            >
              {isDetecting ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>

            {isDetecting && (
              <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-90 duration-300">
                <p className={cn('text-4xl font-black transition-colors', note.name ? 'text-primary' : 'text-muted-foreground/30')}>
                  {note.name ? `${note.name}${note.octave}` : '--'}
                </p>
                <PitchGauge centsOff={smoothedCentsOff} isActive={isDetecting && !!note.name} size={140} />
              </div>
            )}
            {!isDetecting && <p className="text-xs text-muted-foreground animate-pulse">Toca el botón para activar el micrófono</p>}
          </div>
        );

      /* ── Arpeggio Demo ── */
      case 'arpeggio': {
        if (!arpDemoActive) {
          return (
            <Button onClick={startArpeggioDemo} size="lg" className="w-full rounded-full shadow-lg animate-pulse">
              <Play className="mr-2 w-5 h-5" /> Probar Arpegios
            </Button>
          );
        }
        const allDone = arpCurrentIdx >= arpNotes.length;
        const currentTarget = !allDone ? arpNotes[arpCurrentIdx] : null;
        const arpProgress = (arpInTuneTime / CHALLENGE_DURATION) * 100;

        const centerContent = allDone ? (
          <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-xs font-bold text-primary">¡Perfecto!</p>
          </div>
        ) : arpPlaybackIdx !== null ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-foreground">Escucha...</p>
            <p className="text-xs text-muted-foreground">Nota {(arpPlaybackIdx ?? 0) + 1} de {arpNotes.length}</p>
          </div>
        ) : currentTarget ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <p className="text-lg font-bold text-primary">{currentTarget.fullName}</p>
            <p className="text-[10px] text-muted-foreground">Nota {arpCurrentIdx + 1}/{arpNotes.length}</p>
            <div className="w-4/5 pt-1">
              <Progress value={arpProgress} className="h-2" />
            </div>
            <PitchGauge centsOff={smoothedCentsOff} isActive={isDetecting && !!note.name} size={90} />
          </div>
        ) : null;

        return renderMiniNoteCircle(
          arpNotes,
          arpCompleted,
          currentTarget?.fullName || null,
          arpPlaybackIdx,
          centerContent
        );
      }

      /* ── Simon Says Demo ── */
      case 'simon': {
        if (!simonDemoActive) {
          return (
            <Button onClick={startSimonDemo} size="lg" className="w-full rounded-full shadow-lg animate-pulse">
              <Play className="mr-2 w-5 h-5" /> Probar Simón Dice
            </Button>
          );
        }
        const allDone = simonPlayerIdx >= simonNotes.length && simonPhase === 'singing';
        const currentTarget = simonPhase === 'singing' && simonPlayerIdx < simonNotes.length ? simonNotes[simonPlayerIdx] : null;
        const simonProgress = (simonInTuneTime / CHALLENGE_DURATION) * 100;

        const centerContent = allDone ? (
          <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-xs font-bold text-primary">¡Memorizado!</p>
          </div>
        ) : simonPhase === 'playback' ? (
          <div className="flex flex-col items-center gap-1">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            <p className="text-sm font-bold text-foreground">Memoriza...</p>
          </div>
        ) : currentTarget ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <p className="text-lg font-bold text-primary">Nota {simonPlayerIdx + 1}/{simonNotes.length}</p>
            <p className="text-[10px] text-muted-foreground">Canta la nota</p>
            <div className="w-4/5 pt-1">
              <Progress value={simonProgress} className="h-2" />
            </div>
            <PitchGauge centsOff={smoothedCentsOff} isActive={isDetecting && !!note.name} size={90} />
          </div>
        ) : null;

        return renderMiniNoteCircle(
          simonNotes,
          simonCompleted,
          currentTarget?.fullName || null,
          simonPlaybackIdx,
          centerContent,
          undefined,
          true
        );
      }

      /* ── Rhythm Demo ── */
      case 'rhythm': {
        if (!rhythmDemoActive) {
          return (
            <Button onClick={startRhythmDemo} size="lg" className="w-full rounded-full shadow-lg animate-pulse">
              <Play className="mr-2 w-5 h-5" /> Probar Modo Ritmo
            </Button>
          );
        }

        return (
          <div className="flex flex-col items-center gap-4 w-full animate-in fade-in duration-500">
            {/* Phase label */}
            <div className="text-center">
              {rhythmPhase === 'guide' && (
                <p className="text-sm font-bold text-foreground animate-pulse">🎵 Escucha el patrón...</p>
              )}
              {rhythmPhase === 'playing' && (
                <p className="text-sm font-bold text-accent">¡Tu turno! Toca los botones 👇</p>
              )}
              {rhythmPhase === 'done' && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-lg font-bold text-primary">Precisión: {rhythmScore}%</p>
                  <p className="text-xs text-muted-foreground">¡Nivel Completado!</p>
                </div>
              )}
            </div>

            {/* Guide indicators */}
            {rhythmPhase === 'guide' && (
              <div className="flex gap-3 justify-center">
                {rhythmPattern.map((beat, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                      rhythmGuideIdx === i
                        ? beat.instrument === 'kick'
                          ? 'bg-blue-500 border-blue-300 scale-125 shadow-lg shadow-blue-500/50'
                          : 'bg-red-500 border-red-300 scale-125 shadow-lg shadow-red-500/50'
                        : 'bg-muted border-muted-foreground/20'
                    )}
                  >
                    {beat.instrument === 'kick' ? (
                      <Footprints className="w-5 h-5 text-white" />
                    ) : (
                      <Hand className="w-5 h-5 text-white" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            {(rhythmPhase === 'playing' || rhythmPhase === 'guide') && (
              <div className="flex gap-6 justify-center">
                <Button
                  onPointerDown={() => handleRhythmTap('kick')}
                  disabled={rhythmPhase !== 'playing'}
                  className={cn(
                    'w-[5.5rem] h-[5.5rem] rounded-full text-white font-black text-sm flex flex-col items-center justify-center gap-1 touch-none select-none',
                    'bg-gradient-to-b from-blue-400 to-blue-600 border-[4px] border-blue-200',
                    'shadow-[0_10px_0_0_#1e3a5f,0_14px_12px_0_rgba(0,0,0,0.3)]',
                    'active:shadow-[0_0_0_0_#1e3a5f] active:translate-y-[10px] active:scale-95',
                    rhythmPhase !== 'playing' && 'opacity-60'
                  )}
                >
                  <Footprints size={24} /> Kick
                </Button>
                <Button
                  onPointerDown={() => handleRhythmTap('clap')}
                  disabled={rhythmPhase !== 'playing'}
                  className={cn(
                    'w-[5.5rem] h-[5.5rem] rounded-full text-white font-black text-sm flex flex-col items-center justify-center gap-1 touch-none select-none',
                    'bg-gradient-to-b from-red-400 to-red-600 border-[4px] border-red-200',
                    'shadow-[0_10px_0_0_#7f1d1d,0_14px_12px_0_rgba(0,0,0,0.3)]',
                    'active:shadow-[0_0_0_0_#7f1d1d] active:translate-y-[10px] active:scale-95',
                    rhythmPhase !== 'playing' && 'opacity-60'
                  )}
                >
                  <Hand size={24} /> Clap
                </Button>
              </div>
            )}

            {/* Progress display */}
            {rhythmPhase === 'playing' && (
              <p className="text-xs text-muted-foreground">
                Toques: {rhythmUserTaps.length}/{rhythmPattern.length}
              </p>
            )}
          </div>
        );
      }

      /* ── Lives & Streaks info ── */
      case 'lives':
        return (
          <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-500">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart key={i} className={cn('w-8 h-8 transition-all', i < 4 ? 'text-red-500 fill-red-500' : 'text-muted-foreground/30')} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Las vidas se recargan cada 30 minutos</p>
            <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold text-orange-500">Racha: 7 días 🔥</span>
            </div>
          </div>
        );

      /* ── Stars info ── */
      case 'stars':
        return (
          <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-500">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <Star key={s} className="w-10 h-10 text-accent fill-accent drop-shadow-lg" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              90%+ = ⭐⭐⭐ &nbsp;|&nbsp; 80%+ = ⭐⭐ &nbsp;|&nbsp; Completar = ⭐
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] p-4 sm:p-6 bg-background overflow-y-auto">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4 sm:mb-6 flex-shrink-0">
        {slides.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === currentSlide ? 'bg-primary w-6' : i < currentSlide ? 'bg-primary/60 w-2' : 'bg-muted-foreground/30 w-2'
            )}
          />
        ))}
      </div>

      {/* Slide content */}
      <div
        key={currentSlide}
        className={cn(
          'flex flex-col items-center text-center gap-4 w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-400',
          'p-5 sm:p-6 rounded-3xl bg-gradient-to-br',
          slide.bg
        )}
      >
        <div className="animate-in zoom-in-75 duration-500">{slide.icon}</div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground">{slide.title}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{slide.description}</p>

        {/* Interactive content */}
        {renderInteractiveContent()}
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-2 mt-4 sm:mt-6 w-full max-w-xs flex-shrink-0">
        <Button onClick={handleNext} size="lg" className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-full shadow-lg">
          {isLast ? '¡Empezar a Jugar!' : 'Siguiente'}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        {!isLast && (
          <Button onClick={handleSkip} variant="ghost" className="text-muted-foreground text-xs">
            Saltar tutorial
          </Button>
        )}
      </div>

      <AlertDialog open={showLevelDialog}>
        <AlertDialogContent className="max-w-xs sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-2xl text-center">
              ¡Nivel Completado!
            </AlertDialogTitle>
            
            <div className="flex justify-center gap-3 py-4">
              {[1, 2, 3].map((s) => {
                let showEmpty = false;
                if (slide.id === 'rhythm' && rhythmScore !== null) {
                   if (s === 3 && rhythmScore <= 85) showEmpty = true;
                   if (s === 2 && rhythmScore <= 60) showEmpty = true;
                }
                return (
                  <div key={s} className="relative">
                    {!showEmpty && <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: '1.5s', animationIterationCount: '1' }} />}
                    <Star
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 transition-all duration-500",
                        !showEmpty ? "text-accent fill-accent drop-shadow-[0_0_12px_hsl(var(--accent))] scale-100 opacity-100" : "text-muted-foreground/15 scale-75 opacity-40"
                      )}
                    />
                  </div>
                );
              })}
            </div>
            
            {slide.id === 'rhythm' && rhythmScore !== null ? (
               <AlertDialogDescription className="text-sm sm:text-base text-center">
                  ¡Excelente trabajo!<br/>
                  <span className="text-md sm:text-lg font-bold text-foreground">Precisión: {rhythmScore.toFixed(0)}%</span>
               </AlertDialogDescription>
            ) : (
               <AlertDialogDescription className="text-sm sm:text-base text-center">
                  ¡Rendimiento perfecto! 🌟
               </AlertDialogDescription>
            )}
           </AlertDialogHeader>
           <AlertDialogFooter className="flex flex-col gap-2">
             <Button 
               size="lg" 
               className="h-14 sm:h-16 px-6 text-lg sm:text-xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-2 border-white shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce w-full"
               onClick={() => {
                 setShowLevelDialog(false);
                 handleNext();
               }}
             >
               Continuar <ArrowRight className="ml-2 w-6 h-6" />
             </Button>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
