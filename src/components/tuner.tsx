
"use client";

import { Mic, MicOff, CheckCircle2, Trophy, VolumeX } from "lucide-react";
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
};

const generateChallenge = (count: number, pool: NoteInfo[]): NoteInfo[] => {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, pool.length));
    return selected.sort((a, b) => a.frequency - b.frequency);
};

let audioContext: AudioContext | null = null;

const playNote = (frequency: number) => {
  if (typeof window !== 'undefined') {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);
  }
};

const playCompletionSound = () => {
    if (typeof window !== 'undefined') {
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

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
    }
};

const playAllCompletedSound = () => {
    if (typeof window !== 'undefined') {
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

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
    }
};

const completionPhrases = ["¡Perfecto!", "¡Bien hecho!", "¡En la nota!", "¡Sigue así!", "¡Increíble!", "¡Deliciosa!"];

type Difficulty = "Calentamiento" | "Fácil" | "Medio" | "Difícil";
type ChallengeDifficulty = Exclude<Difficulty, "Calentamiento">;

const difficultySettings = {
  "Calentamiento": { tolerance: 15, exerciseCount: 12 },
  "Fácil": { tolerance: 15, exerciseCount: 15 },
  "Medio": { tolerance: 15, exerciseCount: 20 },
  "Difícil": { tolerance: 15, exerciseCount: 40 },
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

export function Tuner({ notePool }: { notePool: NoteInfo[] }) {
  const { note, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  const { toast } = useToast();
  
  const [difficulty, setDifficulty] = useState<Difficulty>("Calentamiento");
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>([]);
  const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<string>>(new Set());

  const [inTuneTime, setInTuneTime] = useState(0);
  const inTuneSinceRef = useRef<number | null>(null);

  const [lastCompletedNoteFullName, setLastCompletedNoteFullName] = useState<string | null>(null);
  const [completionPhrase, setCompletionPhrase] = useState("");
  
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  const [radius, setRadius] = useState(170);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;

    if (notePool.length > 0) {
      const settings = difficultySettings[difficulty];
      let newChallenge: NoteInfo[];

      if (difficulty === "Calentamiento") {
        // For warm-up, select 12 successive notes from a comfortable middle part of the range.
        // The notePool is already sorted by frequency.
        const middleIndex = Math.floor(notePool.length / 2) - Math.floor(settings.exerciseCount / 2);
        const startIndex = Math.max(0, middleIndex);
        
        // Ensure we don't go out of bounds if the pool is smaller than the exercise count
        const availableNotes = notePool.length - startIndex;
        const notesToTake = Math.min(settings.exerciseCount, availableNotes);
        
        newChallenge = notePool.slice(startIndex, startIndex + notesToTake);
      } else {
        // For other difficulties, use the random selection logic.
        newChallenge = generateChallenge(settings.exerciseCount, notePool);
      }
      
      setChallengeNotes(newChallenge.sort((a, b) => a.frequency - b.frequency));
    }
  }, [isMounted, notePool, difficulty]);


  const tolerance = difficultySettings[difficulty].tolerance;
  const challengeDuration = 1500;
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      const isLargeChallenge = challengeNotes.length > 25;
      setRadius(isMobile ? 140 : (isLargeChallenge ? 210 : 170));
    };
  
    handleResize();
    window.addEventListener('resize', handleResize);
  
    return () => window.removeEventListener('resize', handleResize);
  }, [challengeNotes.length]);


  useEffect(() => {
    if (!isDetecting || !activeNote || lastCompletedNoteFullName || sessionCompleted) {
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
            setTimeout(() => setShowDifficultyDialog(true), 1500);
          }
        } else {
          setTimeout(() => {
            setLastCompletedNoteFullName(null);
            setActiveNote(null);
          }, 2000);
        }
      }
    } else {
      setInTuneTime(0);
      inTuneSinceRef.current = null;
    }
  }, [note, smoothedCentsOff, isDetecting, activeNote, lastCompletedNoteFullName, sessionCompleted, completedNotes, challengeNotes.length, tolerance, challengeDuration, difficulty]);

  const startNewChallenge = useCallback((diff: ChallengeDifficulty) => {
    setDifficulty(diff);
    setCompletedNotes(new Set());
    setActiveNote(null);
    setSessionCompleted(false);
    setShowDifficultyDialog(false);
    setLastCompletedNoteFullName(null);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
    if (!isDetecting) {
      start();
    }
  }, [isDetecting, start]);

  const handleNoteClick = (noteToActivate: NoteInfo) => {
    if (completedNotes.has(noteToActivate.fullName) || lastCompletedNoteFullName || !isDetecting) return;
    setActiveNote(noteToActivate);
    playNote(noteToActivate.frequency);
  };

  const handleToggleListening = () => {
    if (isDetecting) {
      stop();
      setActiveNote(null);
    } else {
      toast({
          variant: "accent",
          title: "Consejo de Afinación",
          description: "Para obtener mejores resultados, busca un lugar silencioso.",
          duration: 4000,
      });
      if (challengeNotes.length === 0 || (difficulty === 'Calentamiento' && sessionCompleted)) {
          setShowDifficultyDialog(true);
      } else {
          start();
      }
    }
  };
  
  const renderCentralContent = () => {
    if (sessionCompleted && difficulty !== 'Calentamiento') {
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in zoom-in-95">
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-accent" />
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">¡Felicidades!</p>
                <p className="text-muted-foreground text-sm sm:text-base">¡Nivel completado!</p>
                 <Button onClick={() => setShowDifficultyDialog(true)} className="mt-4">Elegir Nivel</Button>
            </div>
        );
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
                <p className="text-sm sm:text-md text-muted-foreground -mt-1">Sostén la nota</p>
                <div className="w-4/5 pt-2">
                    <Progress value={challengeProgress} className="h-2 sm:h-3" />
                </div>
                <div className="h-16 mt-2 flex flex-col items-center justify-center">
                   <div className={cn("text-3xl sm:text-4xl font-bold transition-colors duration-300", isInTune ? "text-accent" : "text-foreground/70")}>
                        {note.name ? `${note.name}${note.octave}` : "--"}
                    </div>
                    <p className={cn("font-mono text-base sm:text-lg", isInTune ? "text-accent" : "text-muted-foreground")}>
                        {centsOff !== 0 ? `${smoothedCentsOff.toFixed(0)} cents` : "En tono"}
                    </p>
                </div>
            </div>
        );
    }
    if (!isDetecting) {
         return <MicOff className="w-20 h-20 sm:w-24 sm:h-24 text-muted-foreground/30" />;
    }
    return (
        <div className="text-center p-4">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">Selecciona una nota</p>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-base sm:text-lg">Haz clic en un círculo para empezar</p>
        </div>
    );
  };

  const isLargeChallenge = challengeNotes.length > 25;
  const buttonSize = `w-14 h-14 text-sm sm:w-[72px] sm:h-[72px] sm:text-base ${isLargeChallenge ? 'sm:w-14 sm:h-14 sm:text-sm' : ''}`;
  const noteNameSize = `text-xl ${isLargeChallenge ? 'sm:text-xl' : 'sm:text-2xl'}`;
  const octaveSize = `text-xs ${isLargeChallenge ? 'sm:text-xs' : 'sm:text-sm'}`;
  
  if (!isMounted) {
    return <TunerSkeleton />;
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="text-center text-foreground font-semibold text-lg">
        <p>Dificultad: <span className="font-bold text-primary">{difficulty}</span> ({challengeNotes.length} notas)</p>
        <p className="text-base text-muted-foreground">Progreso: {completedNotes.size} / {challengeNotes.length}</p>
      </div>

      <div className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] flex items-center justify-center">
        {challengeNotes.map((n, index) => {
          const angle = (index / challengeNotes.length) * 2 * Math.PI - (Math.PI / 2);
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          return (
            <Button
              key={n.fullName}
              onClick={() => handleNoteClick(n)}
              disabled={!isDetecting || !!lastCompletedNoteFullName}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className={cn(
                "absolute rounded-full flex flex-col justify-center items-center font-bold transition-all duration-300 shadow-lg",
                buttonSize,
                completedNotes.has(n.fullName) 
                  ? "bg-primary text-primary-foreground border-2 border-primary-foreground/50 cursor-default" 
                  : "bg-card hover:bg-card/80 border-2 border-primary/30",
                activeNote?.fullName === n.fullName && "ring-4 ring-offset-background ring-offset-2 ring-accent"
              )}
            >
              <span className={noteNameSize}>{n.name}</span>
              <span className={cn("opacity-70", octaveSize)}>OCT {n.octave}</span>
            </Button>
          );
        })}
        
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground text-center max-w-xs px-4">
            <VolumeX className="w-4 h-4 flex-shrink-0" />
            <span>Para obtener mejores resultados, busca un lugar silencioso.</span>
        </div>
      </div>

      <AlertDialog open={showDifficultyDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl">Elige una dificultad</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                      {sessionCompleted 
                        ? "¡Excelente trabajo! Has completado el calentamiento. Ahora escoge un nuevo nivel para seguir practicando."
                        : "Prepárate para poner a prueba tu afinación. Cada nivel tiene un número diferente de notas y una tolerancia de afinación distinta."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Button onClick={() => startNewChallenge("Fácil")} variant="accent" size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black">Fácil</Button>
                  <Button onClick={() => startNewChallenge("Medio")} size="lg">Medio</Button>
                  <Button onClick={() => startNewChallenge("Difícil")} variant="destructive" size="lg">Difícil</Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
