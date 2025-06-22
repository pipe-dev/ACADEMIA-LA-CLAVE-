
"use client";

import { Mic, MicOff, CheckCircle2, Trophy } from "lucide-react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

type NoteInfo = {
  name: string;
  octave: number;
  frequency: number;
  fullName: string;
};

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const generateFullNotePool = (): NoteInfo[] => {
    const notes: NoteInfo[] = [];
    // G2 (MIDI 43) to C6 (MIDI 84)
    for (let midi = 43; midi <= 84; midi++) {
        const octave = Math.floor(midi / 12) - 1;
        const name = noteStrings[midi % 12];
        const frequency = 440 * Math.pow(2, (midi - 69) / 12);
        notes.push({ name, octave, frequency, fullName: `${name}${octave}` });
    }
    return notes;
};

const notePool = generateFullNotePool();

const generateChallenge = (count: number): NoteInfo[] => {
    const shuffled = [...notePool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
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
        gain2.gain.setValueAtTime(0.2, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc2.connect(gain2).connect(audioContext.destination);
        osc2.start(t);
        osc2.stop(t + 0.5);
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
            { freq: 523.25, delay: 0, duration: 0.1 },
            { freq: 659.25, delay: 0.1, duration: 0.1 },
            { freq: 783.99, delay: 0.2, duration: 0.1 },
            { freq: 1046.50, delay: 0.3, duration: 0.5 },
        ];
        
        melody.forEach((note) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.frequency.value = note.freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.2, t + note.delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + note.delay + note.duration);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(t + note.delay);
            osc.stop(t + note.delay + note.duration);
        });
    }
};

const completionPhrases = ["¡Perfecto!", "¡Bien hecho!", "¡En el clavo!", "¡Sigue así!"];

type Difficulty = "Fácil" | "Medio" | "Difícil";

const difficultySettings = {
  "Fácil": { tolerance: 15, exerciseCount: 12 },
  "Medio": { tolerance: 10, exerciseCount: 12 },
  "Difícil": { tolerance: 5, exerciseCount: 12 },
};

export function Tuner() {
  const { note, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  
  const [difficulty, setDifficulty] = useState<Difficulty | "General">("General");
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>(() => generateChallenge(12));
  const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<string>>(new Set());

  const [inTuneTime, setInTuneTime] = useState(0);
  const inTuneSinceRef = useRef<number | null>(null);

  const [lastCompletedNoteFullName, setLastCompletedNoteFullName] = useState<string | null>(null);
  const [completionPhrase, setCompletionPhrase] = useState("");
  
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const tolerance = difficulty === "General" ? 15 : difficultySettings[difficulty].tolerance;
  const challengeDuration = 2000;

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
          setTimeout(() => setShowDifficultyDialog(true), 1000);
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
  }, [note, smoothedCentsOff, isDetecting, activeNote, lastCompletedNoteFullName, sessionCompleted, completedNotes, challengeNotes.length, tolerance, challengeDuration]);

  const startNewChallenge = useCallback((diff: Difficulty) => {
    const settings = difficultySettings[diff];
    setDifficulty(diff);
    setChallengeNotes(generateChallenge(settings.exerciseCount));
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
      if (!challengeNotes.length || showDifficultyDialog) {
          setShowDifficultyDialog(true);
      } else {
          start();
      }
    }
  };
  
  const renderCentralContent = () => {
    if (sessionCompleted) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 text-center animate-in fade-in zoom-in-95">
                <Trophy className="w-16 h-16 text-accent" />
                <p className="text-3xl font-bold text-primary mt-2">¡Felicidades!</p>
                <p className="text-muted-foreground">¡Nivel completado!</p>
            </div>
        );
    }
    if (lastCompletedNoteFullName) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 text-center animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-16 h-16 text-primary" />
                <p className="text-3xl font-bold text-primary mt-2">{completionPhrase}</p>
            </div>
        );
    }
    if (activeNote) {
        const isInTune = Math.abs(smoothedCentsOff) < tolerance && note.name === activeNote.name && note.octave === activeNote.octave;
        const challengeProgress = (inTuneTime / challengeDuration) * 100;
        return (
            <div className="flex flex-col items-center justify-center gap-1 w-full text-center">
                <p className="text-6xl sm:text-7xl font-bold text-primary">{activeNote.fullName}</p>
                <p className="text-lg text-muted-foreground">Sostén la nota</p>
                <div className="w-4/5 pt-2">
                    <Progress value={challengeProgress} className="h-3" />
                </div>
                <div className="h-20 mt-2">
                   <div className={cn("text-4xl font-bold transition-colors duration-300", isInTune ? "text-accent" : "text-primary/70")}>
                        {note.name ? `${note.name}${note.octave}` : "--"}
                    </div>
                    <p className={cn("font-mono text-lg", isInTune ? "text-accent" : "text-muted-foreground")}>
                        {centsOff !== 0 ? `${smoothedCentsOff.toFixed(1)} cents` : "En tono"}
                    </p>
                </div>
            </div>
        );
    }
    if (!isDetecting) {
         return <MicOff className="w-20 h-20 text-muted-foreground/30" />;
    }
    return (
        <div className="text-center p-4">
            <p className="text-2xl font-bold text-primary">Selecciona una nota</p>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Haz clic en un círculo para empezar</p>
        </div>
    );
  };

  const radius = challengeNotes.length > 25 ? 210 : 170;
  const buttonSize = challengeNotes.length > 25 ? "w-12 h-12 text-xs" : "w-16 h-16 text-sm";
  const noteNameSize = challengeNotes.length > 25 ? "text-lg" : "text-xl";
  const octaveSize = challengeNotes.length > 25 ? "text-2xs" : "text-xs";
  
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center text-primary font-semibold">
        <p>Dificultad: <span className="font-bold">{difficulty}</span> ({challengeNotes.length} notas)</p>
        <p className="text-sm text-muted-foreground">Progreso: {completedNotes.size} / {challengeNotes.length}</p>
      </div>

      <div className="relative w-[360px] h-[360px] sm:w-[450px] sm:h-[450px] flex items-center justify-center">
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
                "absolute rounded-full flex flex-col justify-center items-center font-bold transition-all duration-300 shadow-md",
                buttonSize,
                completedNotes.has(n.fullName) 
                  ? "bg-primary text-primary-foreground border-2 border-primary-foreground/50 cursor-default" 
                  : "bg-card hover:bg-card/80 border-2 border-primary/30",
                activeNote?.fullName === n.fullName && "ring-4 ring-offset-2 ring-accent"
              )}
            >
              <span className={noteNameSize}>{n.name}</span>
              <span className={cn("opacity-70", octaveSize)}>OCT {n.octave}</span>
            </Button>
          );
        })}
        
        <Card className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-full shadow-lg border-2 border-primary/20 flex items-center justify-center">
            <CardContent className="p-2 flex items-center justify-center">
              {renderCentralContent()}
            </CardContent>
        </Card>
      </div>
      
      <Button onClick={handleToggleListening} size="lg" className="rounded-full w-48 h-14 shadow-lg">
        {isDetecting ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
        {isDetecting ? "Pausar" : "Empezar"}
      </Button>

      <AlertDialog open={showDifficultyDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Elige una dificultad</AlertDialogTitle>
                  <AlertDialogDescription>
                      {sessionCompleted 
                        ? "¡Excelente trabajo! Has completado todas las notas. Ahora escoge un nuevo nivel para seguir practicando."
                        : "Prepárate para poner a prueba tu afinación. Cada nivel tiene un número diferente de notas y una tolerancia de afinación distinta."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row justify-center gap-2 pt-4">
                  <Button onClick={() => startNewChallenge("Fácil")} variant="accent">Fácil</Button>
                  <Button onClick={() => startNewChallenge("Medio")}>Medio</Button>
                  <Button onClick={() => startNewChallenge("Difícil")} variant="destructive">Difícil</Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
