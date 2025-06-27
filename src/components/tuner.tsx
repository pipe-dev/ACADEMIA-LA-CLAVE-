
"use client";

import { Mic, MicOff, CheckCircle2, Trophy, VolumeX, Lock, Star, ArrowLeft } from "lucide-react";
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

const generateChallenge = (count: number, pool: NoteInfo[]): NoteInfo[] => {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, pool.length));
    return selected.sort((a, b) => a.frequency - b.frequency);
};

const completionPhrases = ["¡Perfecto!", "¡Bien hecho!", "¡En la nota!", "¡Sigue así!", "¡Increíble!", "¡Deliciosa!"];

type Difficulty = "Calentamiento" | "Fácil" | "Medio" | "Difícil";
type ChallengeDifficulty = Exclude<Difficulty, "Calentamiento">;
type ProgressState = Record<ChallengeDifficulty, Record<number, boolean>>;

const difficultySettings = {
  "Calentamiento": { tolerance: 15, exerciseCount: 12 },
  "Fácil": { tolerance: 15 },
  "Medio": { tolerance: 15 },
  "Difícil": { tolerance: 15 },
};

const difficultyLevels: Record<ChallengeDifficulty, number[]> = {
  "Fácil": [3, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
  "Medio": [8, 10, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  "Difícil": [10, 12, 15, 18, 20, 22, 24, 26, 28, 30, 32, 35],
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

export function Tuner({ notePool, gender }: { notePool: NoteInfo[]; gender: 'masculino' | 'femenino' }) {
  const { note, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  const { toast } = useToast();
  
  const [difficulty, setDifficulty] = useState<Difficulty>("Calentamiento");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>([]);
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

  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersCache = useRef(new Map<string, AudioBuffer>());

  useEffect(() => {
    try {
        const savedProgress = window.localStorage.getItem('vocalStudioProgress');
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
  }, []);

  const markLevelAsComplete = useCallback((diff: ChallengeDifficulty, level: number) => {
    setProgress(prev => {
        const newProgress = { ...prev };
        newProgress[diff] = { ...newProgress[diff], [level]: true };
        try {
            window.localStorage.setItem('vocalStudioProgress', JSON.stringify(newProgress));
        } catch (error) {
            console.error("Failed to save progress to localStorage", error);
        }
        return newProgress;
    });
  }, []);

  const getPlaybackAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    let context = playbackAudioContextRef.current;
    if (!context || context.state === 'closed') {
        try {
            context = new (window.AudioContext || (window as any).webkitAudioContext)();
            playbackAudioContextRef.current = context;
        } catch (e) {
            console.error("Could not create playback AudioContext", e);
            return null;
        }
    }
    if (context.state === 'suspended') {
        context.resume();
    }
    return context;
  }, []);
  
  useEffect(() => {
    getPlaybackAudioContext();
    return () => {
        if (playbackAudioContextRef.current && playbackAudioContextRef.current.state !== 'closed') {
            playbackAudioContextRef.current.close();
        }
    }
  }, [getPlaybackAudioContext]);

  const playNote = useCallback(async (noteInfo: NoteInfo) => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return;

    const noteKey = `${gender}_${noteInfo.fullName}`;
    const safeFileName = noteInfo.fullName.replace('#', 's');
    const audioFilePath = `/sounds/${gender}_${safeFileName}.mp3`;

    try {
        let buffer = audioBuffersCache.current.get(noteKey);

        if (!buffer) {
            const response = await fetch(audioFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffersCache.current.set(noteKey, buffer);
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(audioContext.currentTime);

    } catch (error) {
        console.warn(`Could not load custom sound ${audioFilePath}. Falling back to generated tone.`, error);
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(noteInfo.frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.5);
    }
  }, [gender, getPlaybackAudioContext]);

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
  
  useEffect(() => {
    if (!isMounted || notePool.length === 0) return;

    let newChallenge: NoteInfo[];
    
    if (difficulty === "Calentamiento") {
      if (!isInitialWarmupCompleted) {
        const settings = difficultySettings.Calentamiento;
        const middleIndex = Math.floor(notePool.length / 2) - Math.floor(settings.exerciseCount / 2);
        const startIndex = Math.max(0, middleIndex);
        const availableNotes = notePool.length - startIndex;
        const notesToTake = Math.min(settings.exerciseCount, availableNotes);
        newChallenge = notePool.slice(startIndex, startIndex + notesToTake);
      } else {
        const exerciseCount = Math.floor(Math.random() * 3) + 1;
        newChallenge = generateChallenge(exerciseCount, notePool);
      }
    } else {
      const difficultyKey = difficulty as ChallengeDifficulty;
      const exerciseCount = difficultyLevels[difficultyKey][currentLevel - 1];
      newChallenge = generateChallenge(Math.min(exerciseCount, notePool.length), notePool);
    }
    
    setChallengeNotes(newChallenge.sort((a, b) => a.frequency - b.frequency));
  }, [isMounted, notePool, difficulty, currentLevel, isInitialWarmupCompleted]);

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

  const tolerance = activeNote && activeNote.midi >= 43 && activeNote.midi <= 48 ? 25 : 15;

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
          }, 2000);
        }
      }
    } else {
      setInTuneTime(0);
      inTuneSinceRef.current = null;
    }
  }, [note.name, note.octave, smoothedCentsOff, isDetecting, activeNote, lastCompletedNoteFullName, sessionCompleted, completedNotes, challengeNotes.length, challengeDuration, difficulty, playCompletionSound, playAllCompletedSound, markLevelAsComplete, currentLevel, tolerance]);

  const startLevel = useCallback((diff: ChallengeDifficulty, level: number) => {
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
    if (!isDetecting) {
      start();
    }
  }, [isDetecting, start]);

  const startWarmup = useCallback(() => {
    setDifficulty("Calentamiento");
    setCurrentLevel(1);
    setCompletedNotes(new Set());
    setActiveNote(null);
    setSessionCompleted(false);
    setShowDifficultyDialog(false);
    setSelectedDifficulty(null);
    setLastCompletedNoteFullName(null);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
    if (!isDetecting) {
      start();
    }
  }, [isDetecting, start]);

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
    if (completedNotes.has(noteToActivate.fullName) || lastCompletedNoteFullName || !isDetecting) return;
    setActiveNote(noteToActivate);
    playNote(noteToActivate);
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
      if (challengeNotes.length === 0 || (difficulty === 'Calentamiento' && sessionCompleted) || difficulty !== 'Calentamiento') {
          setDialogMessage("Prepárate para poner a prueba tu afinación. Elige una dificultad para empezar.");
          setShowDifficultyDialog(true);
      } else {
          start();
      }
    }
  };
  
  const renderCentralContent = () => {
    if (sessionCompleted && difficulty !== 'Calentamiento' && !showLevelCompleteDialog) {
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
                <p className="text-sm sm:text-md text-muted-foreground -mt-1">Canta la nota</p>
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
        <p>
            Dificultad: <span className="font-bold text-primary">{difficulty}</span>
            {difficulty !== 'Calentamiento' && ` - Nivel ${currentLevel}`}
        </p>
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
         <Button variant="link" onClick={() => setShowDifficultyDialog(true)}>Elegir Nivel</Button>
      </div>

      <AlertDialog open={showDifficultyDialog} onOpenChange={(isOpen) => {
        setShowDifficultyDialog(isOpen);
        if (!isOpen) {
            setSelectedDifficulty(null);
        }
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
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(level => {
                              const isCompleted = progress[selectedDifficulty]?.[level];
                              const isLocked = level > 1 && !progress[selectedDifficulty]?.[level - 1];
                              
                              return (
                                  <Button
                                      key={level}
                                      variant={isCompleted ? "default" : "secondary"}
                                      disabled={isLocked}
                                      onClick={() => startLevel(selectedDifficulty, level)}
                                      className="h-16 sm:h-20 text-xl font-bold flex flex-col gap-1 aspect-square"
                                  >
                                      {isLocked ? (
                                          <Lock className="w-8 h-8"/>
                                      ) : isCompleted ? (
                                          <Star className="w-8 h-8 text-accent fill-accent"/>
                                      ) : (
                                          <span>{level}</span>
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
                      ¡Excelente trabajo! Has desbloqueado el siguiente nivel.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {difficulty !== 'Calentamiento' && currentLevel < difficultyLevels[difficulty as ChallengeDifficulty].length ? (
                    <Button onClick={handleSeeLevels} size="lg">Ver Niveles</Button>
                ) : (
                    <Button onClick={handleChooseNewDifficulty} size="lg">Elegir Dificultad</Button>
                )}
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
