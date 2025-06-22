
"use client";

import { Mic, MicOff, CheckCircle2, Trophy, RefreshCw } from "lucide-react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

type NoteInfo = {
  name: string;
  frequency: number;
};

const notes: NoteInfo[] = [
  { name: "C", frequency: 261.63 },
  { name: "C#", frequency: 277.18 },
  { name: "D", frequency: 293.66 },
  { name: "D#", frequency: 311.13 },
  { name: "E", frequency: 329.63 },
  { name: "F", frequency: 349.23 },
  { name: "F#", frequency: 369.99 },
  { name: "G", frequency: 392.00 },
  { name: "G#", frequency: 415.30 },
  { name: "A", frequency: 440.00 },
  { name: "A#", frequency: 466.16 },
  { name: "B", frequency: 493.88 },
];

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
            // Upward arpeggio
            { freq: 523.25, delay: 0, duration: 0.1 },    // C5
            { freq: 659.25, delay: 0.1, duration: 0.1 },  // E5
            { freq: 783.99, delay: 0.2, duration: 0.1 },  // G5
            // Held final note
            { freq: 1046.50, delay: 0.3, duration: 0.5 }, // C6
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

export function Tuner() {
  const { note, frequency, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  
  const [challengeNote, setChallengeNote] = useState<NoteInfo | null>(null);
  const [inTuneTime, setInTuneTime] = useState(0);
  const [completedNotes, setCompletedNotes] = useState<Record<string, boolean>>({});
  const [allNotesCompleted, setAllNotesCompleted] = useState(false);
  const inTuneSinceRef = useRef<number | null>(null);
  const [lastCompletedNote, setLastCompletedNote] = useState<string | null>(null);
  const [completionPhrase, setCompletionPhrase] = useState("");

  const challengeDuration = 2000;

  useEffect(() => {
    if (lastCompletedNote || allNotesCompleted) return;

    if (!isDetecting || !challengeNote) {
      setInTuneTime(0);
      inTuneSinceRef.current = null;
      return;
    }

    const isCorrectNote = note.name === challengeNote.name;
    const isTolerablyInTune = Math.abs(smoothedCentsOff) < 15;

    if (isCorrectNote && isTolerablyInTune) {
      if (inTuneSinceRef.current === null) {
        inTuneSinceRef.current = Date.now();
      }

      const sustainedTime = Date.now() - inTuneSinceRef.current;
      setInTuneTime(sustainedTime);

      if (sustainedTime >= challengeDuration) {
        const newCompletedNotes = { ...completedNotes, [challengeNote.name]: true };
        setCompletedNotes(newCompletedNotes);

        if (Object.keys(newCompletedNotes).length === notes.length) {
          setAllNotesCompleted(true);
          playAllCompletedSound();
        } else {
          playCompletionSound();
        }
        
        const randomPhrase = completionPhrases[Math.floor(Math.random() * completionPhrases.length)];
        setCompletionPhrase(randomPhrase);
        setLastCompletedNote(challengeNote.name);

        setChallengeNote(null);
        setInTuneTime(0);
        inTuneSinceRef.current = null;

        setTimeout(() => {
            setLastCompletedNote(null);
        }, 2000);
      }
    } else {
      setInTuneTime(0);
      inTuneSinceRef.current = null;
    }
  }, [note, smoothedCentsOff, isDetecting, challengeNote, lastCompletedNote, allNotesCompleted, completedNotes]);

  const handleToggle = () => {
    if (allNotesCompleted) {
        setCompletedNotes({});
        setAllNotesCompleted(false);
        setChallengeNote(null);
        setInTuneTime(0);
        inTuneSinceRef.current = null;
        setLastCompletedNote(null);
        start();
        return;
    }

    if (isDetecting) {
      stop();
      setChallengeNote(null);
      setInTuneTime(0);
      setLastCompletedNote(null);
    } else {
      start();
    }
  };
  
  const handleNoteClick = (n: NoteInfo) => {
    if (!isDetecting || completedNotes[n.name] || (challengeNote && challengeNote.name === n.name) || lastCompletedNote || allNotesCompleted) return;
    playNote(n.frequency);
    setChallengeNote(n);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
  }

  const isInTune = Math.abs(smoothedCentsOff) < 15;
  const challengeProgress = challengeNote ? (inTuneTime / challengeDuration) * 100 : 0;

  const radius = 120;
  const buttonSize = 48;
  const containerSize = radius * 2 + buttonSize;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
       <div
        className="relative flex items-center justify-center mt-4"
        style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
      >
        {notes.map((n, i) => {
          const angle = (i / notes.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const isActive = note.name === n.name && isDetecting && !challengeNote && !allNotesCompleted;
          const isChallenge = challengeNote?.name === n.name;
          const isCompleted = completedNotes[n.name];

          return (
            <Button
              key={n.name}
              variant={"outline"}
              className={cn(
                "absolute aspect-square rounded-full font-bold flex items-center justify-center transition-all duration-200 z-10",
                "hover:scale-105",
                isActive ? "bg-accent text-accent-foreground scale-110" : "bg-card",
                isChallenge && !isCompleted && "animate-pulse border-primary border-2 shadow-lg",
                isCompleted && "bg-primary text-primary-foreground border-primary",
              )}
              style={{
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                fontSize: '1.25rem',
                top: `calc(50% - ${buttonSize / 2}px)`,
                left: `calc(50% - ${buttonSize / 2}px)`,
                transform: `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px)`,
              }}
              onClick={() => handleNoteClick(n)}
              disabled={!isDetecting || allNotesCompleted}
            >
              {n.name}
            </Button>
          );
        })}

        <Card className="w-48 h-48 rounded-full shadow-lg border-2 border-primary/20 flex items-center justify-center absolute">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             {allNotesCompleted ? (
                <div className="flex flex-col items-center justify-center gap-1 text-center animate-in fade-in zoom-in-95">
                    <Trophy className="w-16 h-16 text-accent" />
                    <p className="text-3xl font-bold text-primary mt-2">¡Felicidades!</p>
                    <p className="text-muted-foreground">Completaste el desafío.</p>
                </div>
             ) : isDetecting ? (
                lastCompletedNote ? (
                    <div className="flex flex-col items-center justify-center gap-1 text-center animate-in fade-in zoom-in-95">
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                        <p className="text-2xl font-bold text-primary mt-2">{completionPhrase}</p>
                    </div>
                ) : challengeNote ? (
                    <div className="flex flex-col items-center justify-center gap-1 w-full">
                        <p className="text-xs text-muted-foreground">Sostén la nota</p>
                        <p className="text-4xl font-bold text-primary">{challengeNote.name}</p>
                        <div className="w-3/4 pt-1">
                            <Progress value={challengeProgress} className="h-2" />
                        </div>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            {`${(inTuneTime / 1000).toFixed(1)}s / ${(challengeDuration / 1000).toFixed(1)}s`}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground">Nota detectada</p>
                        <div
                        className={cn(
                            "text-6xl font-bold transition-colors duration-300",
                            isInTune ? "text-accent" : "text-primary"
                        )}
                        >
                        {note.name || "--"}
                        </div>
                        <p className={cn("font-mono text-sm", isInTune ? "text-accent" : "text-muted-foreground")}>
                        {centsOff !== 0 ? `${centsOff.toFixed(1)} cents` : "En tono"}
                        </p>
                        <div className="font-mono mt-1">
                            <p className="text-muted-foreground text-xs">Frecuencia</p>
                            <p className="text-base">{frequency > 0 ? `${frequency.toFixed(2)} Hz` : "0.00 Hz"}</p>
                        </div>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <MicOff className="w-12 h-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-sm">Afinador apagado</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleToggle} size="lg" className="rounded-full w-48 h-14 shadow-lg mt-2">
        {allNotesCompleted ? (
            <>
                <RefreshCw className="mr-2" />
                <span>Jugar de nuevo</span>
            </>
        ) : isDetecting ? ( 
            <>
                <MicOff className="mr-2" />
                Detener
            </>
        ) : (
            <>
                <Mic className="mr-2" />
                Empezar
            </>
        )}
      </Button>
    </div>
  );
}
