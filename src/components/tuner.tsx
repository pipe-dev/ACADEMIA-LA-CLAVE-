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
  "Fácil": { tolerance: 10, exerciseCount: 15 },
  "Medio": { tolerance: 10, exerciseCount: 20 },
  "Difícil": { tolerance: 10, exerciseCount: 40 },
};

export function Tuner() {
  const { note, frequency, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  
  const [challenge, setChallenge] = useState<NoteInfo[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isChallengeActive, setIsChallengeActive] = useState(false);

  const [inTuneTime, setInTuneTime] = useState(0);
  const inTuneSinceRef = useRef<number | null>(null);

  const [lastCompletedNote, setLastCompletedNote] = useState<string | null>(null);
  const [completionPhrase, setCompletionPhrase] = useState("");
  
  const [difficulty, setDifficulty] = useState<Difficulty>("Medio");
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const { tolerance: challengeTolerance, exerciseCount } = difficultySettings[difficulty];
  const challengeDuration = 2000;

  const challengeNote = isChallengeActive ? challenge[currentNoteIndex] : null;

  useEffect(() => {
    if (!isDetecting || !challengeNote || lastCompletedNote || sessionCompleted) {
      setInTuneTime(0);
      inTuneSinceRef.current = null;
      return;
    }

    const isCorrectNote = note.name === challengeNote.name && note.octave === challengeNote.octave;
    const isTolerablyInTune = Math.abs(smoothedCentsOff) < challengeTolerance;

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
        setLastCompletedNote(challengeNote.fullName);

        setInTuneTime(0);
        inTuneSinceRef.current = null;

        if (currentNoteIndex + 1 >= challenge.length) {
            setSessionCompleted(true);
            playAllCompletedSound();
            setShowDifficultyDialog(true);
            setIsChallengeActive(false);
        } else {
            setTimeout(() => {
                setLastCompletedNote(null);
                setCurrentNoteIndex(prevIndex => prevIndex + 1);
            }, 2000);
        }
      }
    } else {
      setInTuneTime(0);
      inTuneSinceRef.current = null;
    }
  }, [note, smoothedCentsOff, isDetecting, challengeNote, lastCompletedNote, sessionCompleted, challenge, currentNoteIndex, challengeTolerance]);

  const startNewChallenge = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    const settings = difficultySettings[diff];
    const newChallenge = generateChallenge(settings.exerciseCount);
    setChallenge(newChallenge);
    setCurrentNoteIndex(0);
    setIsChallengeActive(true);
    setSessionCompleted(false);
    setShowDifficultyDialog(false);
    setLastCompletedNote(null);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
    if (!isDetecting) {
      start();
    }
  }, [isDetecting, start]);

  const handleToggle = useCallback(() => {
    if (isDetecting) {
      stop();
    } else {
      if (isChallengeActive && !sessionCompleted) {
          start();
      } else {
          startNewChallenge("Medio");
      }
    }
  }, [isDetecting, stop, start, isChallengeActive, sessionCompleted, startNewChallenge]);
  
  const handleSelectDifficulty = (newDifficulty: Difficulty) => {
    startNewChallenge(newDifficulty);
  };

  const isInTune = Math.abs(smoothedCentsOff) < challengeTolerance;
  const challengeProgress = challengeNote ? (inTuneTime / challengeDuration) * 100 : 0;

  useEffect(() => {
    if (challengeNote && !lastCompletedNote) {
        playNote(challengeNote.frequency);
    }
  }, [challengeNote, lastCompletedNote]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      {isChallengeActive && (
        <div className="text-center text-primary font-semibold">
          <p>Dificultad: <span className="font-bold">{difficulty}</span> ({exerciseCount} notas)</p>
          <p className="text-sm text-muted-foreground">Tolerancia: ±{challengeTolerance} cents</p>
        </div>
      )}

      <Card className="w-72 h-72 sm:w-80 sm:h-80 rounded-full shadow-lg border-2 border-primary/20 flex items-center justify-center">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
           { sessionCompleted ? (
              <div className="flex flex-col items-center justify-center gap-1 text-center animate-in fade-in zoom-in-95">
                  <Trophy className="w-16 h-16 text-accent" />
                  <p className="text-3xl font-bold text-primary mt-2">¡Felicidades!</p>
                  <p className="text-muted-foreground">Escoge una dificultad.</p>
              </div>
           ) : isDetecting && isChallengeActive && challengeNote ? (
              lastCompletedNote ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-center animate-in fade-in zoom-in-95">
                      <CheckCircle2 className="w-12 h-12 text-primary" />
                      <p className="text-2xl font-bold text-primary mt-2">{completionPhrase}</p>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center gap-1 w-full">
                      <p className="text-lg text-muted-foreground">
                        Nota {currentNoteIndex + 1} de {challenge.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Sostén la nota</p>
                      <p className="text-6xl font-bold text-primary">{challengeNote.fullName}</p>
                      <div className="w-3/4 pt-1">
                          <Progress value={challengeProgress} className="h-2" />
                      </div>
                      <div className="h-16 mt-2">
                        <div
                            className={cn(
                                "text-3xl font-bold transition-colors duration-300",
                                isInTune && note.name === challengeNote.name && note.octave === challengeNote.octave ? "text-accent" : "text-primary"
                            )}
                        >
                            {note.name ? `${note.name}${note.octave}` : "--"}
                        </div>
                        <p className={cn("font-mono text-sm", isInTune && note.name === challengeNote.name && note.octave === challengeNote.octave ? "text-accent" : "text-muted-foreground")}>
                            {centsOff !== 0 ? `${smoothedCentsOff.toFixed(1)} cents` : "En tono"}
                        </p>
                      </div>
                  </div>
              )
          ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <MicOff className="w-12 h-12 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">
                  {isChallengeActive ? "Afinador en pausa" : "Pulsa Empezar para jugar"}
                </p>
              </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleToggle} size="lg" className="rounded-full w-48 h-14 shadow-lg mt-2">
        {isDetecting ? ( 
            <>
                <MicOff className="mr-2" />
                Pausar
            </>
        ) : (
            <>
                <Mic className="mr-2" />
                {isChallengeActive ? "Continuar" : "Empezar"}
            </>
        )}
      </Button>

      <AlertDialog open={showDifficultyDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¡Nivel Completado!</AlertDialogTitle>
                  <AlertDialogDescription>
                      ¡Excelente trabajo! Has completado todas las notas. Ahora escoge un nuevo nivel de dificultad para seguir practicando.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row justify-center gap-2 pt-4">
                  <Button onClick={() => handleSelectDifficulty("Fácil")} variant="accent" className="flex-1">Fácil ({difficultySettings["Fácil"].exerciseCount} notas)</Button>
                  <Button onClick={() => handleSelectDifficulty("Medio")} className="flex-1">Medio ({difficultySettings["Medio"].exerciseCount} notas)</Button>
                  <Button onClick={() => handleSelectDifficulty("Difícil")} variant="destructive" className="flex-1">Difícil ({difficultySettings["Difícil"].exerciseCount} notas)</Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
