
"use client";

import { Mic, MicOff, CheckCircle2, Trophy, Lock, Star, ArrowLeft, RefreshCw, Brain, Music, Drum, Play, Square } from "lucide-react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export type NoteInfo = {
  name: string;
  octave: number;
  frequency: number;
  fullName: string;
  midi: number;
};

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const generateChallenge = (count: number, pool: NoteInfo[]): NoteInfo[] => {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, pool.length));
    return selected.sort((a, b) => a.frequency - b.frequency);
};

const mediumDifficultyChords = [
    { rootMidi: 60, type: 'major' },   // Nivel 1: C Major
    { rootMidi: 57, type: 'minor' },   // Nivel 2: A minor
    { rootMidi: 55, type: 'major' },   // Nivel 3: G Major
    { rootMidi: 52, type: 'minor' },   // Nivel 4: E minor
    { rootMidi: 53, type: 'major' },   // Nivel 5: F Major
    { rootMidi: 50, type: 'minor' },   // Nivel 6: D minor
    { rootMidi: 58, type: 'major' },   // Nivel 7: A Major
    { rootMidi: 61, type: 'minor' },   // Nivel 8: C# minor
    { rootMidi: 51, type: 'major' },   // Nivel 9: D# Major
    { rootMidi: 48, type: 'minor' },   // Nivel 10: C minor
    { rootMidi: 59, type: 'major' },   // Nivel 11: B Major
    { rootMidi: 56, type: 'minor' },   // Nivel 12: G# minor
];

const melodies: Record<string, { midi: number, duration: number }[]> = {
    beethoven5: [ { midi: 67, duration: 0.3 }, { midi: 67, duration: 0.3 }, { midi: 67, duration: 0.3 }, { midi: 63, duration: 0.8 } ],
    twinkle: [ { midi: 60, duration: 0.4 }, { midi: 60, duration: 0.4 }, { midi: 67, duration: 0.4 }, { midi: 67, duration: 0.4 }, { midi: 69, duration: 0.4 }, { midi: 69, duration: 0.4 }, { midi: 67, duration: 0.8 } ],
    happyBirthday: [ { midi: 60, duration: 0.3 }, { midi: 60, duration: 0.4 }, { midi: 62, duration: 0.7 }, { midi: 60, duration: 0.7 }, { midi: 65, duration: 0.7 }, { midi: 64, duration: 1.2 } ],
    maryHadALamb: [ { midi: 64, duration: 0.4 }, { midi: 62, duration: 0.4 }, { midi: 60, duration: 0.4 }, { midi: 62, duration: 0.4 }, { midi: 64, duration: 0.4 }, { midi: 64, duration: 0.4 }, { midi: 64, duration: 0.8 } ]
};

const rhythmPatterns: Record<number, { time: number; instrument: 'clap' | 'kick' }[]> = {
    9: [ // 100 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },     // Bar 1, Beat 1
        { time: 1200, instrument: 'clap' },  // Bar 1, Beat 3
        { time: 2400, instrument: 'kick' },   // Bar 2, Beat 1
        { time: 3600, instrument: 'clap' },    // Bar 2, Beat 3
    ],
    10: [ // 120 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },     // Bar 1, Beat 1
        { time: 1000, instrument: 'clap' },  // Bar 1, Beat 3
        { time: 2000, instrument: 'kick' },   // Bar 2, Beat 1
        { time: 3000, instrument: 'clap' },    // Bar 2, Beat 3
    ],
};

const generateIntervalChallenge = (level: number, pool: NoteInfo[]): NoteInfo[] => {
    const poolByMidi = new Map<number, NoteInfo>(pool.map(n => [n.midi, n]));
    const challenge = new Map<string, NoteInfo>();

    const chordInfo = mediumDifficultyChords[level - 1];
    if (!chordInfo) return generateChallenge(4, pool); // Fallback

    const { rootMidi, type } = chordInfo;
    
    // Try to find the ideal octave for the root note within the pool
    let bestRoot: NoteInfo | undefined;
    for (let octave = 2; octave <= 5; octave++) {
        const potentialRootMidi = rootMidi % 12 + 12 * (octave + 1);
        if (poolByMidi.has(potentialRootMidi)) {
            bestRoot = poolByMidi.get(potentialRootMidi);
            break;
        }
    }

    // If no suitable octave is found, try to find any note of the same type
    if (!bestRoot) {
        const rootNoteName = noteStrings[rootMidi % 12];
        bestRoot = pool.find(n => n.name === rootNoteName);
    }

    if (!bestRoot) return generateChallenge(4, pool); // Fallback if root not in pool

    const intervals = type === 'major' 
        ? [0, 4, 7, 12] // Root, M3, P5, Octave
        : [0, 3, 7, 12]; // Root, m3, P5, Octave

    for (const interval of intervals) {
        const midi = bestRoot.midi + interval;
        const note = poolByMidi.get(midi);
        if (note) {
            challenge.set(note.fullName, note);
        }
    }

    const result = Array.from(challenge.values());
    
    if (result.length < 2) { // Not enough notes to form a meaningful arpeggio
        return generateChallenge(4, pool);
    }
    
    return result.sort((a, b) => a.frequency - b.frequency);
};

const completionPhrases = ["¡Perfecto!", "¡Bien hecho!", "¡En la nota!", "¡Sigue así!", "¡Increíble!", "¡Deliciosa!"];

type Difficulty = "Calentamiento" | "Fácil" | "Medio" | "Difícil";
type ChallengeDifficulty = Exclude<Difficulty, "Calentamiento">;
type ProgressState = Record<ChallengeDifficulty, Record<number, boolean>>;

const difficultySettings = {
  "Calentamiento": { exerciseCount: 12 },
  "Fácil": { levelCount: 10 },
  "Medio": { levelCount: 12 },
  "Difícil": { levelCount: 12 },
};

const difficultyLevels: Record<ChallengeDifficulty, number[]> = {
    "Fácil":   [3, 4, 4, 5, 5, 5, 5, 5, 0, 0], // Last two are rhythm
    "Medio":   [4, 5, 5, 6, 6, 6, 7, 7, 7, 7, 7, 7],
    "Difícil": [5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10],
};


function TunerSkeleton() {
    return (
      <div className="flex flex-col items-center gap-8 w-full animate-pulse">
        <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-6 w-32 rounded-md" />
        </div>

        <div className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] flex items-center justify-center">
            <Skeleton className="absolute w-full h-full rounded-full" />
            <Skeleton className="w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] rounded-full" />
        </div>
        
        <Skeleton className="h-16 w-56 rounded-full" />
      </div>
    );
  }

const Metronome = ({ bpm, isPlaying }: { bpm: number; isPlaying: boolean }) => {
    const pendulumDuration = 60 / bpm;
    return (
        <div className="w-[280px] h-[400px] bg-card rounded-t-xl rounded-b-lg shadow-2xl flex flex-col items-center p-4 border-2 border-border relative">
            {/* Screws */}
            <div className="absolute top-3 left-3 w-3 h-3 bg-muted rounded-full flex items-center justify-center shadow-inner"><div className="w-1.5 h-0.5 bg-foreground/30"></div><div className="w-0.5 h-1.5 bg-foreground/30 absolute"></div></div>
            <div className="absolute top-3 right-3 w-3 h-3 bg-muted rounded-full flex items-center justify-center shadow-inner"><div className="w-1.5 h-0.5 bg-foreground/30"></div><div className="w-0.5 h-1.5 bg-foreground/30 absolute"></div></div>
            <div className="absolute bottom-3 left-3 w-3 h-3 bg-muted rounded-full flex items-center justify-center shadow-inner"><div className="w-1.5 h-0.5 bg-foreground/30"></div><div className="w-0.5 h-1.5 bg-foreground/30 absolute"></div></div>
            <div className="absolute bottom-3 right-3 w-3 h-3 bg-muted rounded-full flex items-center justify-center shadow-inner"><div className="w-1.5 h-0.5 bg-foreground/30"></div><div className="w-0.5 h-1.5 bg-foreground/30 absolute"></div></div>

            {/* Inner plate */}
            <div className="w-full h-full bg-background rounded-md border border-border shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
                {/* Scale */}
                <div className="absolute w-1/2 h-full flex flex-col justify-around left-2">
                    {[...Array(6)].map((_, i) => <div key={i} className="w-4 h-0.5 bg-muted-foreground/50"></div>)}
                </div>
                 <div className="absolute w-1/2 h-full flex flex-col justify-around right-2 items-end">
                    {[...Array(6)].map((_, i) => <div key={i} className="w-4 h-0.5 bg-muted-foreground/50"></div>)}
                </div>

                {/* Pendulum */}
                <div 
                    className="absolute w-2 h-4/5 bg-primary/70 origin-bottom"
                    style={{
                        animation: isPlaying ? `swing ${pendulumDuration * 2}s ease-in-out infinite` : 'none',
                    }}
                >
                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-8 h-4 bg-primary rounded-sm shadow-md"></div>
                </div>
            </div>
            <style jsx>{`
                @keyframes swing {
                    0% { transform: rotate(-25deg); }
                    50% { transform: rotate(25deg); }
                    100% { transform: rotate(-25deg); }
                }
            `}</style>
        </div>
    );
};

export function Tuner({ notePool, gender, vocalRangeKey, onGoBack }: { notePool: NoteInfo[]; gender: 'masculino' | 'femenino', vocalRangeKey: string, onGoBack: () => void }) {
  const { note, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  const { toast } = useToast();
  
  const [difficulty, setDifficulty] = useState<Difficulty>("Calentamiento");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>(() => {
    const settings = difficultySettings.Calentamiento;
    const middleIndex = Math.floor(notePool.length / 2) - Math.floor(settings.exerciseCount / 2);
    const startIndex = Math.max(0, middleIndex);
    const availableNotes = notePool.length - startIndex;
    const notesToTake = Math.min(settings.exerciseCount, availableNotes);
    return notePool.slice(startIndex, startIndex + notesToTake);
  });
  const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<string>>(new Set());

  const [inTuneTime, setInTuneTime] = useState(0);
  const inTuneSinceRef = useRef<number | null>(null);

  const [lastCompletedNoteFullName, setLastCompletedNoteFullName] = useState<string | null>(null);
  const [completionPhrase, setCompletionPhrase] = useState("");
  
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [showLevelCompleteDialog, setShowLevelCompleteDialog] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  const [radius, setRadius] = useState(170);

  const [dialogMessage, setDialogMessage] = useState("Prepárate para poner a prueba tu afinación. Elige una dificultad para empezar.");
  const [progress, setProgress] = useState<ProgressState>({ "Fácil": {}, "Medio": {}, "Difícil": {} });
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | null>(null);
  const [isInitialWarmupCompleted, setIsInitialWarmupCompleted] = useState(false);
  
  const [gameMode, setGameMode] = useState<'standard' | 'interval' | 'simon-says' | 'melody-challenge' | 'rhythm-challenge'>('standard');
  const [simonSequence, setSimonSequence] = useState<NoteInfo[]>([]);
  const [playerSimonIndex, setPlayerSimonIndex] = useState(0);
  const [simonPlaybackIndex, setSimonPlaybackIndex] = useState<number | null>(null);
  const [simonPhase, setSimonPhase] = useState<'idle' | 'playback' | 'singing'>('idle');
  const [hasRepeatedSequence, setHasRepeatedSequence] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);

  const [rhythmPattern, setRhythmPattern] = useState<{ time: number; instrument: 'clap' | 'kick' }[]>([]);
  const [rhythmPhase, setRhythmPhase] = useState<'idle' | 'playback' | 'playing' | 'results'>('idle');
  const [userRhythmTaps, setUserRhythmTaps] = useState<{ time: number; instrument: 'clap' | 'kick' }[]>([]);
  const [rhythmStartTime, setRhythmStartTime] = useState(0);
  const [rhythmScore, setRhythmScore] = useState(0);
  const [rhythmBpm, setRhythmBpm] = useState(100);
  const [activeRhythmHit, setActiveRhythmHit] = useState<'clap' | 'kick' | null>(null);


  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const audioBufferCache = useRef(new Map<string, AudioBuffer>());
  const activeSoundSourceRef = useRef<{ source: AudioScheduledSourceNode, gainNode?: GainNode } | null>(null);
  const rhythmPlaybackTimeouts = useRef<NodeJS.Timeout[]>([]);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
        const savedProgress = window.localStorage.getItem(vocalRangeKey);
        if (savedProgress) {
            const parsedProgress = JSON.parse(savedProgress);
            if (parsedProgress['Fácil'] && parsedProgress['Medio'] && parsedProgress['Difícil']) {
                setProgress(parsedProgress);
            }
        }
    } catch (error) {
        console.error("Failed to load progress from localStorage", error);
    }
    setIsMounted(true);
  }, [vocalRangeKey]);

  const markLevelAsComplete = useCallback((diff: ChallengeDifficulty, level: number) => {
    setProgress(prev => {
        const newProgress = { ...prev };
        newProgress[diff] = { ...newProgress[diff], [level]: true };
        try {
            window.localStorage.setItem(vocalRangeKey, JSON.stringify(newProgress));
        } catch (error) {
            console.error("Failed to save progress to localStorage", error);
        }
        return newProgress;
    });
  }, [vocalRangeKey]);

  const getPlaybackAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    let context = playbackAudioContextRef.current;
    if (!context || context.state === 'closed') {
        try {
            context = new (window.AudioContext || (window as any).webkitAudioContext)();
            playbackAudioContextRef.current = context;
        } catch (e) {
            console.error("Could not create playback AudioContext", e);
            toast({
                variant: "destructive",
                title: "Error de Audio",
                description: `No se pudo inicializar el motor de audio. ${e instanceof Error ? e.message : ''}`,
            });
            return null;
        }
    }
    if (context.state === 'suspended') {
        context.resume();
    }
    return context;
  }, [toast]);
  
  useEffect(() => {
    getPlaybackAudioContext();
    return () => {
        if (playbackAudioContextRef.current && playbackAudioContextRef.current.state !== 'closed') {
            playbackAudioContextRef.current.close();
        }
    }
  }, [getPlaybackAudioContext]);

  const playNote = useCallback(async (noteInfo: NoteInfo, duration?: number): Promise<void> => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return;

    if (activeSoundSourceRef.current) {
      try {
        activeSoundSourceRef.current.source.stop(0);
        if (activeSoundSourceRef.current.source.disconnect) activeSoundSourceRef.current.source.disconnect();
        if (activeSoundSourceRef.current.gainNode && activeSoundSourceRef.current.gainNode.disconnect) {
          activeSoundSourceRef.current.gainNode.disconnect();
        }
      } catch (e) {
        // Already stopped or disconnected, which is fine.
      }
      activeSoundSourceRef.current = null;
    }

    const playDuration = duration || (gameMode === 'simon-says' ? 1.6 : 2.5);

    const playTone = (buffer?: AudioBuffer) => {
      return new Promise<void>(resolve => {
        if (!audioContext) {
          resolve();
          return;
        }

        let source: AudioScheduledSourceNode;
        let gainNode: GainNode | undefined = undefined;

        if (buffer) {
          const bufferSource = audioContext.createBufferSource();
          bufferSource.buffer = buffer;
          source = bufferSource;
          source.connect(audioContext.destination);
        } else {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          gainNode = gain;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(noteInfo.frequency, audioContext.currentTime);
          gain.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + playDuration - 0.05);

          osc.connect(gain).connect(audioContext.destination);
          source = osc;
        }

        activeSoundSourceRef.current = { source, gainNode };

        source.onended = () => {
          if (activeSoundSourceRef.current?.source === source) {
            activeSoundSourceRef.current = null;
          }
          resolve();
        };
        
        source.start(0);
        try {
          source.stop(audioContext.currentTime + playDuration);
        } catch (e) {
          // Can fail if context is closed
        }
      });
    };

    const fileNameFriendlyFullName = noteInfo.fullName.replace('#', 's');
    const audioKey = `${gender}_${fileNameFriendlyFullName}`;

    if (audioBufferCache.current.has(audioKey)) {
      const audioBuffer = audioBufferCache.current.get(audioKey)!;
      await playTone(audioBuffer);
      return;
    }

    try {
      const filePath = `/sounds/${gender}_${fileNameFriendlyFullName}.mp3`;
      const response = await fetch(filePath);
      if (!response.ok) {
        if (response.status === 404) {
            // File not found, play generated tone as fallback
        } else {
            toast({
                variant: "destructive",
                title: "Error de Carga de Audio",
                description: `No se pudo cargar ${filePath}. Estado: ${response.status}`,
            });
        }
        await playTone(); // fallback
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBufferCache.current.set(audioKey, decodedBuffer);
      await playTone(decodedBuffer);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error de Reproducción",
            description: `No se pudo procesar el audio. Usando tono de respaldo. ${error instanceof Error ? error.message : ''}`,
        });
      await playTone(); // fallback
    }
  }, [getPlaybackAudioContext, gender, gameMode, toast]);

  const playCompletionSound = useCallback(() => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return;

    const t = audioContext.currentTime;

    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.frequency.value = 1046.50; // C6
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.connect(gain1).connect(audioContext.destination);
    osc1.start(t);
    osc1.stop(t + 0.5);
    
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.frequency.value = 1318.51; // E6
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc2.connect(gain2).connect(audioContext.destination);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.6);
  }, [getPlaybackAudioContext]);

  const playAllCompletedSound = useCallback(() => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return;

    const t = audioContext.currentTime;
    const melody = [
        { freq: 523.25, delay: 0, duration: 0.15 },
        { freq: 659.25, delay: 0.15, duration: 0.15 },
        { freq: 783.99, delay: 0.3, duration: 0.15 },
        { freq: 1046.50, delay: 0.45, duration: 0.6 },
    ];
    
    melody.forEach((note) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.value = note.freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, t + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.delay + note.duration);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(t + note.delay);
        osc.stop(t + note.delay + note.duration);
    });
  }, [getPlaybackAudioContext]);

    const playRhythmSound = useCallback((instrument: 'clap' | 'kick' | 'tick') => {
        const audioContext = getPlaybackAudioContext();
        if (!audioContext) return;
        const t = audioContext.currentTime;
        
        const createSnare = () => {
            const noise = audioContext.createBufferSource();
            const bufferSize = audioContext.sampleRate * 0.1; // 100ms
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;

            const noiseFilter = audioContext.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1500;
            noiseFilter.Q.value = 0.5;

            const noiseEnvelope = audioContext.createGain();
            noiseEnvelope.gain.setValueAtTime(1, t);
            noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            
            noise.connect(noiseFilter).connect(noiseEnvelope).connect(audioContext.destination);
            noise.start(t);
            noise.stop(t + 0.1);
        };
        
        const createClap = () => {
             const noise = audioContext.createBufferSource();
            const bufferSize = audioContext.sampleRate * 0.2; // 200ms
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            let lastValue = 0;
            for (let i = 0; i < bufferSize; i++) {
                 // Simple band-limited noise
                const white = Math.random() * 2 - 1;
                data[i] = (lastValue + (0.02 * white)) / 1.02;
                lastValue = data[i];
                data[i] *= 3.5; // boost
            }
            noise.buffer = buffer;
            
            const noiseEnvelope = audioContext.createGain();
            noiseEnvelope.gain.setValueAtTime(1, t);
            noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            noise.connect(noiseEnvelope).connect(audioContext.destination);
            
            noise.start(t);
            noise.stop(t + 0.2);
        };

        const createKick = () => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
            gain.gain.setValueAtTime(1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        };

        if (instrument === 'clap') { // RED button sound
            createClap();
        } else if (instrument === 'kick') { // BLUE button sound
            createKick();
            createSnare();
        } else { // tick
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, t);
            gain.gain.setValueAtTime(2.5, t); // Increased volume
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        }
    }, [getPlaybackAudioContext]);

    const stopRhythmPlayback = useCallback(() => {
        rhythmPlaybackTimeouts.current.forEach(clearTimeout);
        rhythmPlaybackTimeouts.current = [];
        setRhythmPhase('playing');
        setUserRhythmTaps([]);
    }, []);

    const playRhythmPattern = useCallback(() => {
        if (rhythmPattern.length === 0 || rhythmPhase === 'playback') return;

        setRhythmPhase('playback');
        
        const timeouts = rhythmPattern.map(hit => {
            return setTimeout(() => {
                playRhythmSound(hit.instrument);
                setActiveRhythmHit(hit.instrument);
                setTimeout(() => setActiveRhythmHit(null), 150);
            }, hit.time);
        });

        const totalDuration = rhythmPattern[rhythmPattern.length - 1].time + 1000;
        const endTimeout = setTimeout(() => {
            setRhythmPhase('playing'); // Let user play after demo ends
        }, totalDuration);
        
        rhythmPlaybackTimeouts.current = [...timeouts, endTimeout];

    }, [rhythmPattern, playRhythmSound, rhythmPhase]);

    useEffect(() => {
        if (gameMode === 'rhythm-challenge' && rhythmPhase === 'idle' && rhythmPattern.length > 0) {
            playRhythmPattern();
        }
    }, [gameMode, rhythmPhase, rhythmPattern, playRhythmPattern]);

    const handleListenStopClick = () => {
        if (rhythmPhase === 'playback') {
            rhythmPlaybackTimeouts.current.forEach(clearTimeout);
            rhythmPlaybackTimeouts.current = [];
            setRhythmPhase('playing');
        } else {
            playRhythmPattern();
        }
    };


    useEffect(() => {
        return () => {
            rhythmPlaybackTimeouts.current.forEach(clearTimeout);
            if (metronomeIntervalRef.current) {
                clearInterval(metronomeIntervalRef.current);
            }
        }
    }, []);
    
    useEffect(() => {
        const isRhythmPlaying = rhythmPhase === 'playback' || rhythmPhase === 'playing';
        if (isRhythmPlaying && !metronomeIntervalRef.current) {
            const interval = 60000 / rhythmBpm;
            metronomeIntervalRef.current = setInterval(() => {
                playRhythmSound('tick');
            }, interval);
        } else if (!isRhythmPlaying && metronomeIntervalRef.current) {
            clearInterval(metronomeIntervalRef.current);
            metronomeIntervalRef.current = null;
        }
    }, [rhythmPhase, rhythmBpm, playRhythmSound]);


  useEffect(() => {
    if (simonPhase !== 'playback' || simonSequence.length === 0) return;

    let isCancelled = false;
    const playSequence = async () => {
        setActiveNote(null);
        if (isCancelled) return;
        
        if (!hasRepeatedSequence) {
            await new Promise(resolve => setTimeout(resolve, 1500)); 
        } else {
            await new Promise(resolve => setTimeout(resolve, 200)); 
        }
        if (isCancelled) return;

        for (let i = 0; i < simonSequence.length; i++) {
            if (isCancelled) break;
            setSimonPlaybackIndex(i);
            const noteToPlay = simonSequence[i];
            const duration = (gameMode === 'melody-challenge') ? 0.6 : undefined;
            await playNote(noteToPlay, duration);
            if (isCancelled) break;
            if (i < simonSequence.length - 1) {
              const pauseDuration = (gameMode === 'melody-challenge') ? 100 : 200;
              await new Promise(resolve => setTimeout(resolve, pauseDuration));
            }
             if (isCancelled) break;
        }
        
        if (!isCancelled) {
          setSimonPlaybackIndex(null); 
          setSimonPhase('singing');
        }
    };

    playSequence();

    return () => {
        isCancelled = true;
        setSimonPlaybackIndex(null);
    };
  }, [simonPhase, simonSequence, playNote, hasRepeatedSequence, gameMode]);

  const challengeDuration = gameMode === 'melody-challenge' ? 120 : 1000;
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      const notes = (gameMode === 'simon-says' && simonPhase !== 'idle') ? simonSequence : challengeNotes;
      const isLargeChallenge = notes.length > 25;
      setRadius(isMobile ? 140 : (isLargeChallenge ? 210 : 170));
    };
  
    handleResize();
    window.addEventListener('resize', handleResize);
  
    return () => window.removeEventListener('resize', handleResize);
  }, [challengeNotes.length, simonSequence.length, gameMode, simonPhase]);

  const tolerance = activeNote && activeNote.midi < 49 ? 30 : 18; // G2 is 43, C3 is 48. Up to C3 is grave.

  useEffect(() => {
    if (gameMode !== 'simon-says' && gameMode !== 'melody-challenge' && gameMode !== 'rhythm-challenge') { // Standard and Interval logic
        if (!isDetecting || !activeNote || lastCompletedNoteFullName || sessionCompleted || isPaused) {
          setInTuneTime(0);
          inTuneSinceRef.current = null;
          return;
        }

        const isCorrectNote = note.name === activeNote.name && note.octave === activeNote.octave;
        const isTolerablyInTune = Math.abs(smoothedCentsOff) < tolerance;

        if (isCorrectNote && isTolerablyInTune) {
          if (inTuneSinceRef.current === null) {
            inTuneSinceRef.current = Date.now();
          }
          const sustainedTime = Date.now() - inTuneSinceRef.current;
          setInTuneTime(sustainedTime);

          if (sustainedTime >= challengeDuration) {
            playCompletionSound();
            const randomPhrase = completionPhrases[Math.floor(Math.random() * completionPhrases.length)];
            setCompletionPhrase(randomPhrase);
            
            setCompletedNotes(prev => new Set(prev).add(activeNote.fullName));
            setLastCompletedNoteFullName(activeNote.fullName);
            
            setInTuneTime(0);
            inTuneSinceRef.current = null;
            
            if (completedNotes.size + 1 >= challengeNotes.length) {
              setSessionCompleted(true);
              playAllCompletedSound();
              if (difficulty === 'Calentamiento') {
                setIsInitialWarmupCompleted(true);
                setDialogMessage("¡Excelente trabajo! Has completado el calentamiento. ¿Quieres practicar un poco más o empezar un desafío?");
                setTimeout(() => {
                  setSelectedDifficulty(null);
                  setShowDifficultyDialog(true);
                }, 1500);
              } else {
                markLevelAsComplete(difficulty as ChallengeDifficulty, currentLevel);
                setTimeout(() => setShowLevelCompleteDialog(true), 1500);
              }
            } else {
              setTimeout(() => {
                setLastCompletedNoteFullName(null);
                setActiveNote(null);
              }, 1200);
            }
          }
        } else {
          setInTuneTime(0);
          inTuneSinceRef.current = null;
        }
    } else if (gameMode === 'simon-says' || gameMode === 'melody-challenge') { // Simon Says & Melody Logic
        if (!isDetecting || sessionCompleted || simonPhase !== 'singing' || lastCompletedNoteFullName || isPaused) {
            setInTuneTime(0);
            inTuneSinceRef.current = null;
            return;
        }
        const targetNote = simonSequence[playerSimonIndex];
        if (!targetNote) return;

        const simonTolerance = targetNote.midi < 49 ? 30 : 18;

        const isCorrectNote = note.name === targetNote.name && note.octave === targetNote.octave;
        const isTolerablyInTune = Math.abs(smoothedCentsOff) < simonTolerance;

        if (isCorrectNote && isTolerablyInTune) {
            if (inTuneSinceRef.current === null) {
                inTuneSinceRef.current = Date.now();
            }
            const sustainedTime = Date.now() - inTuneSinceRef.current;
            setInTuneTime(sustainedTime);

            if (sustainedTime >= challengeDuration) {
                const isMelodyChallenge = gameMode === 'melody-challenge';
                if (!isMelodyChallenge) {
                  playCompletionSound();
                }
                
                const uniqueKey = `${targetNote.fullName}-${playerSimonIndex}`;
                setCompletedNotes(prev => new Set(prev).add(uniqueKey));

                if (!isMelodyChallenge) {
                    setLastCompletedNoteFullName(uniqueKey);
                }
                
                const nextIndex = playerSimonIndex + 1;

                if (nextIndex >= simonSequence.length) {
                    setSessionCompleted(true);
                    playAllCompletedSound();
                    markLevelAsComplete(difficulty as ChallengeDifficulty, currentLevel);
                    setTimeout(() => setShowLevelCompleteDialog(true), 1500);
                } else {
                    const nextStep = () => {
                        setPlayerSimonIndex(nextIndex);
                        setLastCompletedNoteFullName(null);
                    };

                    if (isMelodyChallenge) {
                        nextStep();
                    } else {
                        setTimeout(nextStep, 1200);
                    }
                }
                setInTuneTime(0);
                inTuneSinceRef.current = null;
            }
        } else {
            setInTuneTime(0);
            inTuneSinceRef.current = null;
        }
    }
  }, [note.name, note.octave, smoothedCentsOff, isDetecting, activeNote, lastCompletedNoteFullName, sessionCompleted, completedNotes, challengeNotes.length, challengeDuration, difficulty, playCompletionSound, playAllCompletedSound, markLevelAsComplete, currentLevel, tolerance, gameMode, simonPhase, playerSimonIndex, simonSequence, isPaused]);

  const startLevel = (diff: ChallengeDifficulty, level: number) => {
    if (!isMounted || notePool.length === 0) return;

    let newGameMode: "standard" | "interval" | "simon-says" | "melody-challenge" | "rhythm-challenge" = "standard";

    if (diff === 'Fácil') {
        if (level === 9 || level === 10) newGameMode = 'rhythm-challenge';
        else if (level === 4) newGameMode = 'melody-challenge';
        else newGameMode = 'standard';
    } else if (diff === "Medio") {
      if (level === 6) {
        newGameMode = 'melody-challenge';
      } else if (level === 1) {
        newGameMode = 'interval';
      } else {
        newGameMode = Math.random() < 0.2 ? 'standard' : 'interval';
      }
    } else if (diff === "Difícil") {
        if (level === 1 || level === 12) {
            newGameMode = 'simon-says';
        } else if (level === 9) {
            newGameMode = 'melody-challenge';
        } else {
            const modeIndex = (level - 2) % 3;
            if (modeIndex === 0) newGameMode = "standard";
            else if (modeIndex === 1) newGameMode = "interval";
            else newGameMode = "simon-says";
        }
    }

    setGameMode(newGameMode);
    setDifficulty(diff);
    setCurrentLevel(level);

    setCompletedNotes(new Set());
    setActiveNote(null);
    setSessionCompleted(false);
    setShowDifficultyDialog(false);
    setSelectedDifficulty(null);
    setLastCompletedNoteFullName(null);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
    setHasRepeatedSequence(false);
    setPlayerSimonIndex(0);
    setIsPaused(false);
    setRepeatCount(0);
    setRhythmPhase('idle');
    setRhythmScore(0);
    setUserRhythmTaps([]);
    if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
    }


    if (newGameMode === "rhythm-challenge") {
        setRhythmBpm(level === 9 ? 100 : 120);
        setRhythmPattern(rhythmPatterns[level] || []);
        if (isDetecting) stop();
    } else if (newGameMode === "simon-says" || newGameMode === "melody-challenge") {
      let sequence: NoteInfo[] = [];
      const poolByMidi = new Map<number, NoteInfo>(notePool.map(n => [n.midi, n]));
      
      if (newGameMode === 'melody-challenge') {
        const melodyKeys = Object.keys(melodies);
        const randomMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
        const melodySequence = melodies[randomMelodyKey];

        const baseOctave = (gender === 'femenino' ? 4 : 3);
        const baseMidi = 12 * (baseOctave + 1);
        const firstNoteMidi = melodySequence[0].midi % 12 + baseMidi;
        
        // Find the best starting note in the user's pool
        let bestStartNote: NoteInfo | undefined = poolByMidi.get(firstNoteMidi)
        if (!bestStartNote) {
           const potentialStarts = notePool.filter(n => n.name === noteStrings[melodySequence[0].midi % 12]);
           bestStartNote = potentialStarts.sort((a,b) => Math.abs(a.midi - firstNoteMidi) - Math.abs(b.midi - firstNoteMidi))[0];
        }

        if (bestStartNote) {
            const midiOffset = bestStartNote.midi - melodySequence[0].midi;
            sequence = melodySequence
                .map(n => poolByMidi.get(n.midi + midiOffset))
                .filter((n): n is NoteInfo => !!n);
        }

        if(sequence.length === 0) { // Fallback to a simple sequence
           sequence = generateChallenge(5, notePool);
        }

      } else { // simon-says
        const exerciseCount = difficultyLevels[diff][level - 1];
        const initialChallenge = generateChallenge(Math.min(exerciseCount, notePool.length), notePool);
        const simonLevels: Record<number, number> = { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6, };
        const sequenceLength = simonLevels[level] || 3;
        const shuffled = [...initialChallenge].sort(() => 0.5 - Math.random());
        sequence = shuffled.slice(0, Math.min(sequenceLength, initialChallenge.length));
      }

      setSimonSequence(sequence);
      setChallengeNotes([...new Set(sequence.map(n => n.fullName))].map(fn => sequence.find(n => n.fullName === fn)!));
      setSimonPhase("playback");
      if (!isDetecting) start();

    } else { // standard, interval
      let newChallenge: NoteInfo[];
      if (newGameMode === "interval") {
        newChallenge = generateIntervalChallenge(level, notePool);
      } else {
        // standard
        const exerciseCount = difficultyLevels[diff][level - 1];
        newChallenge = generateChallenge(
          Math.min(exerciseCount, notePool.length),
          notePool
        );
      }
      setChallengeNotes(newChallenge.sort((a, b) => a.frequency - b.frequency));
      setSimonSequence([]);
      setSimonPhase("idle");
      if (!isDetecting) start();
    }
  };


  const startWarmup = useCallback(() => {
    setDifficulty("Calentamiento");
    setCurrentLevel(1);
    setGameMode('standard');
    
    const settings = difficultySettings.Calentamiento;
    const middleIndex = Math.floor(notePool.length / 2) - Math.floor(settings.exerciseCount / 2);
    const startIndex = Math.max(0, middleIndex);
    const availableNotes = notePool.length - startIndex;
    const notesToTake = Math.min(settings.exerciseCount, availableNotes);
    const newChallenge = notePool.slice(startIndex, startIndex + notesToTake);
    setChallengeNotes(newChallenge);
    
    setCompletedNotes(new Set());
    setActiveNote(null);
    setSessionCompleted(false);
    setShowDifficultyDialog(false);
    setSelectedDifficulty(null);
    setLastCompletedNoteFullName(null);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
    setSimonPhase('idle');
    setIsPaused(false);
    if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
    }
    if (!isDetecting) {
      start();
    }
  }, [isDetecting, start, notePool]);

  const handleSeeLevels = () => {
    setShowLevelCompleteDialog(false);
    setSelectedDifficulty(difficulty as ChallengeDifficulty);
    setShowDifficultyDialog(true);
  };

  const handleChooseNewDifficulty = () => {
    setShowLevelCompleteDialog(false);
    setSelectedDifficulty(null);
    setShowDifficultyDialog(true);
  };

  const handleNoteClick = (noteToActivate: NoteInfo) => {
    if (completedNotes.has(noteToActivate.fullName) || lastCompletedNoteFullName || !isDetecting || gameMode === 'simon-says' || gameMode === 'melody-challenge' || isPaused) return;
    setActiveNote(noteToActivate);
    playNote(noteToActivate);
  };

  const handleToggleListening = () => {
    if (isDetecting) {
      stop();
      setIsPaused(true);
    } else {
      start();
      setIsPaused(false);
    }
  };

  const handleRepeatSequence = () => {
    if ((gameMode !== 'simon-says' && gameMode !== 'melody-challenge') || simonPhase !== 'singing' || repeatCount >= 3 || sessionCompleted) return;
    setRepeatCount(prev => prev + 1);
    setHasRepeatedSequence(true);
    setSimonPhase('playback');
  };

  const handleBackButtonClick = () => {
    stop();
    rhythmPlaybackTimeouts.current.forEach(clearTimeout);
    if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
    }
    onGoBack();
  }
  
    const handleRhythmTap = (instrument: 'clap' | 'kick') => {
        if (rhythmPhase !== 'playing') return;

        playRhythmSound(instrument);
        setActiveRhythmHit(instrument);
        setTimeout(() => setActiveRhythmHit(null), 150);

        let newTaps: { time: number; instrument: 'clap' | 'kick' }[];
        
        if(userRhythmTaps.length === 0){
            // This is the first tap, it establishes the start time
            setRhythmStartTime(performance.now());
            newTaps = [{ time: 0, instrument }];
        } else {
            const tapTime = performance.now() - rhythmStartTime;
            newTaps = [...userRhythmTaps, { time: tapTime, instrument }];
        }

        setUserRhythmTaps(newTaps);

        if (newTaps.length >= rhythmPattern.length) {
            setRhythmPhase('results');
            
            // Scoring logic based on new rules
            let score = 0;
            const timeTolerance = 150; // ms
            const maxScorePerHit = 100 / rhythmPattern.length;
            const userStartTimeOffset = rhythmPattern[0].time;

            rhythmPattern.forEach((patternHit, i) => {
                const userHit = newTaps[i];
                if (userHit) {
                    const expectedTime = patternHit.time - userStartTimeOffset;
                    const timeDiff = Math.abs(expectedTime - userHit.time);
                    const instrumentMatch = patternHit.instrument === userHit.instrument;
                    if (instrumentMatch && timeDiff <= timeTolerance) {
                        score += maxScorePerHit * (1 - (timeDiff / timeTolerance));
                    }
                }
            });
            
            setRhythmScore(score);

            if (score >= 75) {
                playAllCompletedSound();
                markLevelAsComplete(difficulty as ChallengeDifficulty, currentLevel);
                setTimeout(() => {
                    setSessionCompleted(true);
                    setShowLevelCompleteDialog(true)
                }, 1500);
            } else {
                // play fail sound
            }
        }
    };
  
    const renderRhythmGame = () => {
        const isPlaying = rhythmPhase === 'playback' || rhythmPhase === 'playing';
        let statusText = "Toca los botones para igualar el ritmo.";
        if (rhythmPhase === 'playback') statusText = "Escucha y observa...";
        if (rhythmPhase === 'playing' && userRhythmTaps.length === 0) statusText = "¡Toca para empezar y sigue el ritmo!";
        else if (rhythmPhase === 'playing') statusText = "¡Repite el Ritmo!";
        if (rhythmPhase === 'results') statusText = `Precisión: ${rhythmScore.toFixed(0)}%`;


        return (
            <div className="flex flex-col items-center justify-start gap-4 w-full h-full text-foreground">
                <Metronome bpm={rhythmBpm} isPlaying={isPlaying} />
                
                <div className="text-center my-4">
                    <p className="text-5xl font-bold">{rhythmBpm}</p>
                    <p className="text-xl text-muted-foreground">BPM</p>
                </div>
                
                <div className="w-full flex justify-center items-center gap-2 mb-4">
                    <Button
                        onClick={handleListenStopClick}
                        disabled={rhythmPhase === 'results' || (rhythmPhase === 'playing' && userRhythmTaps.length > 0)}
                        variant="secondary"
                        className="w-32"
                    >
                        {rhythmPhase === 'playback' ? <Square className="mr-2 fill-current" /> : <Play className="mr-2" />}
                        {rhythmPhase === 'playback' ? "Detener" : "Escuchar"}
                    </Button>
                </div>

                <div className="w-full flex-grow flex items-center justify-around px-4">
                     <button
                        onClick={() => handleRhythmTap('kick')}
                        disabled={rhythmPhase !== 'playing'}
                        className={cn(
                            "w-28 h-28 sm:w-32 sm:h-32 rounded-full text-white font-bold shadow-lg transition-all duration-150 flex items-center justify-center",
                            "bg-blue-600/80 border-4 border-blue-800/80",
                            "active:scale-95 active:bg-blue-500",
                             rhythmPhase !== 'playing' && "opacity-50 cursor-not-allowed",
                             (activeRhythmHit === 'kick') && "neon-glow border-blue-400"
                        )}
                         style={{boxShadow: '0 5px 15px rgba(0,0,0,0.5), inset 0 -8px 0 rgba(0,0,0,0.3)'}}
                    />
                    <button
                        onClick={() => handleRhythmTap('clap')}
                        disabled={rhythmPhase !== 'playing'}
                        className={cn(
                            "w-28 h-28 sm:w-32 sm:h-32 rounded-full text-white font-bold shadow-lg transition-all duration-150 flex items-center justify-center",
                            "bg-red-600/80 border-4 border-red-800/80",
                            "active:scale-95 active:bg-red-500",
                            rhythmPhase !== 'playing' && "opacity-50 cursor-not-allowed",
                            (activeRhythmHit === 'clap') && "neon-glow border-red-400"
                        )}
                        style={{boxShadow: '0 5px 15px rgba(0,0,0,0.5), inset 0 -8px 0 rgba(0,0,0,0.3)'}}
                    />
                </div>
                 {rhythmPhase === 'results' && (
                    <div className="text-center mt-4 text-foreground">
                        <p className="text-2xl font-bold">Precisión: {rhythmScore.toFixed(0)}%</p>
                        <p className="text-muted-foreground">{rhythmScore >= 75 ? "¡Excelente, nivel superado!" : "¡Casi! Necesitas 75% para ganar."}</p>
                         {rhythmScore < 75 && <Button onClick={() => startLevel(difficulty as ChallengeDifficulty, currentLevel)} className="mt-4">Reintentar</Button>}
                    </div>
                )}
            </div>
        );
    };

  const renderCentralContent = () => {
    if (gameMode === 'rhythm-challenge') {
        return null; // The rhythm game has its own full layout
    }
      
    if (sessionCompleted && !showLevelCompleteDialog) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in zoom-in-95">
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-accent" />
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">¡Felicidades!</p>
                <p className="text-muted-foreground text-sm sm:text-base">¡Nivel completado!</p>
            </div>
        );
    }

    if (gameMode === 'simon-says' || gameMode === 'melody-challenge') {
        if (simonPhase === 'playback') {
            return (
                <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{gameMode === 'melody-challenge' ? "Canta la Melodía" : "Memoriza"}</p>
                    <p className="text-muted-foreground text-sm sm:text-base">Escucha la secuencia...</p>
                </div>
            )
        }
        if (lastCompletedNoteFullName) {
            return (
                <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                    <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">¡Correcto!</p>
                </div>
            );
        }
        if (simonPhase === 'singing' && !sessionCompleted) {
            const challengeProgress = (inTuneTime / challengeDuration) * 100;
            const targetNote = simonSequence[playerSimonIndex];
            const isInTune = targetNote && Math.abs(smoothedCentsOff) < (targetNote.midi < 49 ? 30 : 18) && note.name === targetNote.name && note.octave === targetNote.octave;

            return (
                <div className="flex flex-col items-center justify-center gap-1 w-full text-center">
                    <p className="text-xl sm:text-2xl text-primary font-bold">Nota {playerSimonIndex + 1} de {simonSequence.length}</p>
                    <p className="text-sm sm:text-md text-muted-foreground -mt-1">Canta la nota</p>
                    <div className="w-4/5 pt-2">
                        <Progress value={challengeProgress} className="h-2 sm:h-3" />
                    </div>
                    <div className="h-16 mt-2 flex flex-col items-center justify-center">
                        <div className={cn("text-3xl sm:text-4xl font-bold transition-colors duration-300", isInTune ? "text-accent" : "text-foreground/70")}>
                            {isDetecting ? (note.name ? `${note.name}${note.octave}` : "--") : ""}
                        </div>
                        <p className={cn("font-mono text-base sm:text-lg", isInTune ? "text-accent" : "text-muted-foreground")}>
                            {isDetecting ? (centsOff !== 0 ? `${smoothedCentsOff.toFixed(0)} cents` : "En tono") : ""}
                        </p>
                    </div>
                </div>
            );
        }
    }
    
    if (lastCompletedNoteFullName) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">{completionPhrase}</p>
            </div>
        );
    }
    
    if (activeNote) {
        const isInTune = Math.abs(smoothedCentsOff) < tolerance && note.name === activeNote.name && note.octave === activeNote.octave;
        const challengeProgress = (inTuneTime / challengeDuration) * 100;
        return (
            <div className="flex flex-col items-center justify-center gap-1 w-full text-center">
                <p className="text-5xl sm:text-7xl font-bold text-primary">{activeNote.fullName}</p>
                <p className="text-sm sm:text-md text-muted-foreground -mt-1">Canta la nota</p>
                <div className="w-4/5 pt-2">
                    <Progress value={challengeProgress} className="h-2 sm:h-3" />
                </div>
                <div className="h-16 mt-2 flex flex-col items-center justify-center">
                   <div className={cn("text-3xl sm:text-4xl font-bold transition-colors duration-300", isInTune ? "text-accent" : "text-foreground/70")}>
                        {isDetecting ? (note.name ? `${note.name}${note.octave}` : "--") : ""}
                    </div>
                    <p className={cn("font-mono text-base sm:text-lg", isInTune ? "text-accent" : "text-muted-foreground")}>
                         {isDetecting ? (centsOff !== 0 ? `${smoothedCentsOff.toFixed(0)} cents` : "En tono") : ""}
                    </p>
                </div>
            </div>
        );
    }
    if (isPaused) {
         return (
            <div className="text-center p-4">
                <MicOff className="w-20 h-20 sm:w-24 sm:h-24 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground mt-2">En pausa</p>
            </div>
        );
    }
    
    return (
        <div className="text-center p-4">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {(gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase === 'singing' ? "¡Tu Turno!" : "Selecciona una nota"}
            </p>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-base sm:text-lg">
                {(gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase === 'singing' ? `Canta la secuencia de ${simonSequence.length} notas` : "Haz clic en un círculo para empezar"}
            </p>
        </div>
    );
  };

  const notesToDisplay = (gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase !== 'idle' && simonSequence.length > 0 ? simonSequence : challengeNotes;
  const isLargeChallenge = notesToDisplay.length > 25;
  const buttonSize = `w-14 h-14 text-sm sm:w-[72px] sm:h-[72px] sm:text-base ${isLargeChallenge ? 'sm:w-14 sm:h-14 sm:text-sm' : ''}`;
  const noteNameSize = `text-xl ${isLargeChallenge ? 'sm:text-xl' : 'sm:text-2xl'}`;
  const octaveSize = `text-xs ${isLargeChallenge ? 'sm:text-xs' : 'sm:text-sm'}`;
  
  if (!isMounted) {
    return <TunerSkeleton />;
  }

  const getDifficultyTitle = () => {
    let title = `${difficulty}`;
    if (difficulty !== 'Calentamiento') {
      title += ` - Nivel ${currentLevel}`;
    }
    if (gameMode === 'simon-says') {
      title += ' (Simón Dice)';
    } else if (gameMode === 'interval') {
      title += ' (Arpegios)';
    } else if (gameMode === 'melody-challenge') {
      title += ' (Melodía)';
    } else if (gameMode === 'rhythm-challenge') {
      title += ' (Ritmo)';
    } else if (difficulty !== 'Fácil' && difficulty !== 'Calentamiento') {
        title += ' (Estándar)';
    }
    return title;
  };
  
  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-5xl mx-auto h-screen p-2 sm:p-4">
       <Button onClick={handleBackButtonClick} variant="ghost" className="absolute top-4 left-4 text-sm h-auto p-2 z-20">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
       </Button>
      <div className="text-center text-foreground font-semibold text-lg mt-12 sm:mt-4">
        <p>
            Dificultad: <span className="font-bold text-primary">{getDifficultyTitle()}</span>
        </p>
         {gameMode !== 'rhythm-challenge' && <p className="text-base text-muted-foreground">Progreso: {completedNotes.size} / {gameMode === 'simon-says' || gameMode === 'melody-challenge' ? simonSequence.length : challengeNotes.length}</p>}
      </div>

      {gameMode === 'rhythm-challenge' ? (
        <div className="flex-grow w-full flex items-center justify-center">
            {renderRhythmGame()}
        </div>
      ) : (
          <>
            <div className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] flex items-center justify-center">
                {notesToDisplay.length > 0 ? (
                    notesToDisplay.map((n, index) => {
                        const angle = (index / notesToDisplay.length) * 2 * Math.PI - (Math.PI / 2);
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        const isPlayingBack = simonPlaybackIndex !== null && simonSequence[simonPlaybackIndex] === n && simonPlaybackIndex === index;
                        const uniqueKey = `${n.fullName}-${index}`;

                        return (
                            <Button
                            key={uniqueKey}
                            onClick={() => handleNoteClick(n)}
                            disabled={!isDetecting || !!lastCompletedNoteFullName || simonPhase === 'playback' || isPaused}
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                            className={cn(
                                "absolute rounded-full flex flex-col justify-center items-center font-bold transition-all duration-300 shadow-lg",
                                buttonSize,
                                completedNotes.has(gameMode === 'melody-challenge' || gameMode === 'simon-says' ? uniqueKey : n.fullName)
                                ? "bg-primary text-primary-foreground border-2 border-primary-foreground/50 cursor-default"
                                : "bg-card hover:bg-card/80 border-2 border-primary/30",
                                activeNote?.fullName === n.fullName && gameMode !== 'simon-says' && "ring-4 ring-offset-background ring-offset-2 ring-accent",
                                isPlayingBack && "scale-110 neon-glow"
                            )}
                            >
                            <span className={noteNameSize}>{n.name}</span>
                            <span className={cn("opacity-70", octaveSize)}>OCT {n.octave}</span>
                            </Button>
                        );
                        })
                ) : (
                    <div className="text-muted-foreground">Cargando desafío...</div>
                )}
            
                <Card className="w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] rounded-full shadow-2xl border-2 border-primary/20 flex items-center justify-center bg-transparent" style={{background: 'radial-gradient(circle, hsl(var(--card)) 0%, hsl(var(--background)) 100%)'}}>
                    <CardContent className="p-2 flex items-center justify-center">
                    {renderCentralContent()}
                    </CardContent>
                </Card>
            </div>
          
            <div className="flex flex-col items-center gap-3">
                <Button onClick={handleToggleListening} size="lg" className="rounded-full w-56 h-16 text-xl shadow-lg">
                    {isDetecting ? <MicOff className="mr-3" /> : <Mic className="mr-3" />}
                    {isDetecting ? "Pausar" : "Empezar"}
                </Button>

                <div className="h-10">
                {(gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase === 'singing' && repeatCount < 3 && !sessionCompleted && (
                    <Button variant="destructive" size="icon" onClick={handleRepeatSequence} className="w-10 h-10 rounded-full">
                    <RefreshCw className="h-5 w-5"/>
                    <span className="sr-only">Repetir</span>
                    </Button>
                )}
                </div>
            </div>
        </>
      )}
       <Button variant="link" onClick={() => {
            if (isDetecting) {
                stop();
                setIsPaused(true);
            }
            if(rhythmPhase !== 'idle'){
                rhythmPlaybackTimeouts.current.forEach(clearTimeout);
                if (metronomeIntervalRef.current) {
                    clearInterval(metronomeIntervalRef.current);
                    metronomeIntervalRef.current = null;
                }
                setRhythmPhase('idle');
            }
            setSelectedDifficulty(null);
            setShowDifficultyDialog(true);
          }} className="mt-auto pb-4">Elegir Nivel</Button>

      <AlertDialog open={showDifficultyDialog} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setSelectedDifficulty(null);
        }
        setShowDifficultyDialog(isOpen);
      }}>
          <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                  {selectedDifficulty && (
                      <Button variant="ghost" size="sm" className="absolute top-3 left-3 px-2 h-auto" onClick={() => setSelectedDifficulty(null)}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Atrás
                      </Button>
                  )}
                  <AlertDialogTitle className="text-2xl text-center pt-8 sm:pt-0">
                      {selectedDifficulty ? `Dificultad ${selectedDifficulty}` : 'Elige una dificultad'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-center">
                      {selectedDifficulty ? 'Selecciona un nivel para comenzar.' : dialogMessage}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="pt-4">
                  {selectedDifficulty ? (
                      <div className="grid grid-cols-4 gap-3 sm:gap-4">
                          {Array.from({ length: difficultySettings[selectedDifficulty].levelCount }, (_, i) => i + 1).map(level => {
                              const isCompleted = progress[selectedDifficulty]?.[level];
                              const isLocked = level > 1 && !progress[selectedDifficulty]?.[level - 1];
                              
                              let modeIndicator: React.ReactNode = null;
                              if (selectedDifficulty === 'Fácil') {
                                if (level === 4) modeIndicator = <Music className="w-4 h-4 text-green-500" />;
                                else if (level === 9 || level === 10) modeIndicator = <Drum className="w-4 h-4 text-blue-500" />;
                              } else if (selectedDifficulty === 'Medio') {
                                  if (level === 6) {
                                      modeIndicator = <Music className="w-4 h-4 text-green-500" />;
                                  } else {
                                      modeIndicator = <Music className="w-4 h-4" />;
                                  }
                              } else if (selectedDifficulty === 'Difícil') {
                                if (level === 1 || level === 12) {
                                    modeIndicator = <Brain className="w-4 h-4" />;
                                } else if (level === 9) {
                                    modeIndicator = <Music className="w-4 h-4 text-green-500" />;
                                } else if ((level - 2) % 3 === 1) { // Arpeggio
                                    modeIndicator = <Music className="w-4 h-4" />;
                                }
                              }

                              return (
                                  <Button
                                      key={level}
                                      variant={isCompleted ? "default" : "secondary"}
                                      disabled={isLocked}
                                      onClick={() => startLevel(selectedDifficulty, level)}
                                      className="h-16 sm:h-20 text-xl font-bold flex flex-col gap-1 aspect-square relative"
                                  >
                                      {isLocked ? (
                                          <Lock className="w-8 h-8"/>
                                      ) : isCompleted ? (
                                          <Star className="w-8 h-8 text-accent fill-accent"/>
                                      ) : (
                                          <span>{level}</span>
                                      )}
                                      {modeIndicator && !isLocked && (
                                          <span className="absolute bottom-1 right-1 text-xs font-normal opacity-70">
                                            {modeIndicator}
                                          </span>
                                      )}
                                  </Button>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                          <Button onClick={startWarmup} variant="secondary" size="lg" className="h-20 text-lg">Calentamiento</Button>
                          <Button onClick={() => setSelectedDifficulty("Fácil")} variant="accent" size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black h-20 text-lg">Fácil</Button>
                          <Button onClick={() => setSelectedDifficulty("Medio")} size="lg" className="h-20 text-lg">Medio</Button>
                          <Button onClick={() => setSelectedDifficulty("Difícil")} variant="destructive" size="lg" className="h-20 text-lg">Difícil</Button>
                      </div>
                  )}
              </div>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLevelCompleteDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl">
                    {difficulty !== 'Calentamiento' && currentLevel < difficultyLevels[difficulty as ChallengeDifficulty].length
                        ? `¡Nivel ${currentLevel} Completado!`
                        : `¡Dificultad ${difficulty} Completada!`
                    }
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                      {gameMode === 'rhythm-challenge' && rhythmScore >= 75 ? "¡Ritmo perfecto!" : "¡Excelente trabajo! Has desbloqueado el siguiente nivel."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {difficulty !== 'Calentamiento' && currentLevel < difficultyLevels[difficulty as ChallengeDifficulty].length ? (
                    <Button onClick={() => {
                      setShowLevelCompleteDialog(false);
                      startLevel(difficulty as ChallengeDifficulty, currentLevel + 1);
                    }} size="lg">Siguiente Nivel</Button>
                ) : (
                     <Button onClick={handleChooseNewDifficulty} size="lg">Elegir Otra Dificultad</Button>
                )}
                <Button onClick={handleSeeLevels} variant="secondary">Ver Niveles</Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
