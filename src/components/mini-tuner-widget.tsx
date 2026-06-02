import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePitchDetection } from '@/hooks/use-pitch-detection';
import { PitchGauge } from './pitch-gauge';
import { generateChallenge } from './tuner';
import type { NoteInfo } from './tuner';
import { Music, CheckCircle2, Mic, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface MiniTunerWidgetProps {
  noteCount: number;
  notePool?: NoteInfo[];
  gender?: 'masculino' | 'femenino' | null;
  vocalRangeKey?: string | null;
  onComplete: () => void;
}

export function MiniTunerWidget({ noteCount, notePool, gender, vocalRangeKey, onComplete }: MiniTunerWidgetProps) {
  const { note, frequency, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>([]);
  const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<string>>(new Set());
  const [inTuneTime, setInTuneTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSuccessDelay, setIsSuccessDelay] = useState(false);
  
  const inTuneSinceRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const challengeDuration = 700; // ms

  // Audio Context for reference tones
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSynthTone = (frequency: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
      
      isPlayingRef.current = true;
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const playAudioNote = (noteInfo: NoteInfo) => {
    try {
      const americanNoteStrings = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
      const noteName = americanNoteStrings[noteInfo.midi % 12];
      const selectedGender = gender || 'masculino';
      const audioFileName = `/sounds/${selectedGender}_${noteName}${noteInfo.octave}.mp3`;
      
      const audio = new Audio(audioFileName);
      audio.volume = 0.8;
      
      isPlayingRef.current = true;
      audio.onended = () => {
        isPlayingRef.current = false;
      };

      audio.play().catch((e) => {
        isPlayingRef.current = false;
        console.error("No se pudo reproducir el audio real, usando sintetizador:", e);
        playSynthTone(noteInfo.frequency);
      });
    } catch(e) {
      isPlayingRef.current = false;
      console.error(e);
      playSynthTone(noteInfo.frequency);
    }
  };

  useEffect(() => {
    if (hasStarted && notePool && notePool.length > 0 && challengeNotes.length === 0) {
      const challenge = generateChallenge(noteCount, notePool);
      setChallengeNotes(challenge);
      setActiveNote(challenge[0]);
    }
  }, [hasStarted, noteCount, notePool, challengeNotes.length]);

  useEffect(() => {
    if (isFinished || isSuccessDelay || !isDetecting) return;

    let animationFrameId: number;
    const update = () => {
      if (!activeNote || !note || !frequency || isPlayingRef.current) {
        setInTuneTime(0);
        inTuneSinceRef.current = null;
      } else {
        const detectedMidi = Math.round(12 * Math.log2(frequency / 440)) + 69;
        const targetMidi = activeNote.midi;
        const trueCentsOff = (detectedMidi - targetMidi) * 100 + smoothedCentsOff;
        
        const tolerance = activeNote.midi < 49 ? 35 : 25;
        const isTolerablyInTune = Math.abs(trueCentsOff) < tolerance;

        if (isTolerablyInTune) {
          if (inTuneSinceRef.current === null) {
            inTuneSinceRef.current = Date.now();
          }
          const sustainedTime = Date.now() - inTuneSinceRef.current;
          setInTuneTime(sustainedTime);

          if (sustainedTime >= challengeDuration) {
            handleNoteComplete(activeNote);
          }
        } else {
          setInTuneTime(0);
          inTuneSinceRef.current = null;
        }
      }
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeNote, note, smoothedCentsOff, isDetecting, isFinished, isSuccessDelay]);

  const handleNoteComplete = (completedNote: NoteInfo) => {
    setIsSuccessDelay(true);
    setInTuneTime(0);
    inTuneSinceRef.current = null;
    
    // Play success chime
    playSynthTone(completedNote.frequency * 2);
    
    const newCompleted = new Set(completedNotes).add(completedNote.fullName);
    setCompletedNotes(newCompleted);

    setTimeout(() => {
      if (newCompleted.size >= challengeNotes.length) {
        setIsFinished(true);
        stop();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        const remaining = challengeNotes.filter(n => !newCompleted.has(n.fullName));
        setActiveNote(remaining[0]);
      }
      setIsSuccessDelay(false);
    }, 1000);
  };

  const handleStart = () => {
    setHasStarted(true);
    start();
  };

  // Auto-play the reference note when it changes, and repeat every 20 seconds if not tuned
  useEffect(() => {
    if (!activeNote || isFinished) return;
    
    // Initial play when note changes
    playAudioNote(activeNote);

    // Set interval to repeat every 20 seconds
    const intervalId = setInterval(() => {
      playAudioNote(activeNote);
    }, 20000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.name, activeNote?.octave, isFinished]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  if (!notePool || notePool.length === 0) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm text-destructive">Debes configurar tu rango vocal primero para usar el afinador.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <Card className="glass-panel border-emerald-500/30 bg-emerald-500/5 text-center p-8 animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black mb-2 text-emerald-500">¡Nivel Superado!</h3>
        <p className="text-sm text-muted-foreground mb-6">Has afinado las {noteCount} notas con precisión.</p>
        <Button onClick={onComplete} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 px-8">
          Continuar
        </Button>
      </Card>
    );
  }

  if (!hasStarted) {
    return (
      <Card className="glass-panel border-primary/20 bg-primary/5 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
          <Mic className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black mb-2 text-foreground">Afinación ({noteCount} Notas)</h3>
        <p className="text-xs text-muted-foreground mb-6">Al presionar comenzar, el afinador detectará tu voz. Canta la nota indicada y mantenla estable hasta que se llene la barra.</p>
        <Button onClick={handleStart} className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8">
          Comenzar Ejercicio
        </Button>
      </Card>
    );
  }

  let displayCents = smoothedCentsOff;
  if (activeNote && frequency > 0) {
    const detectedMidi = Math.round(12 * Math.log2(frequency / 440)) + 69;
    displayCents = (detectedMidi - activeNote.midi) * 100 + smoothedCentsOff;
  }

  return (
    <Card className="glass-panel border-white/10 dark:border-white/5 bg-card/40 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-6 space-y-6">
        
        {/* In-Tune Progress (Moved to Top) */}
        <div className="space-y-2">
          <Progress 
            value={isSuccessDelay ? 100 : (inTuneTime / challengeDuration) * 100} 
            className="h-3 rounded-full transition-all duration-75 bg-muted/30 [&>div]:bg-primary"
          />
          <div className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            {isSuccessDelay ? "¡Nota completada!" : "Mantén la afinación..."}
          </div>
        </div>

        {/* Pitch Gauge */}
        <div className="py-8 flex justify-center w-full">
          <PitchGauge 
            centsOff={displayCents}
            isActive={isDetecting}
            size={280}
          />
        </div>

        {/* Note Target */}
        <div className="text-center space-y-2 relative">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {isSuccessDelay ? "¡Excelente!" : "Canta la nota"}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button 
              disabled={isSuccessDelay || !activeNote}
              onClick={() => activeNote && playAudioNote(activeNote)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all bg-muted hover:bg-primary/20",
                isSuccessDelay && "opacity-50"
              )}
            >
              <Play className="w-5 h-5 text-foreground ml-1" fill="currentColor" />
            </button>
            <span className={cn(
              "text-6xl font-black transition-all",
              isSuccessDelay ? "text-emerald-500 scale-110" : "text-foreground"
            )}>
              {activeNote?.name}
              <span className="text-2xl text-muted-foreground font-bold">{activeNote?.octave}</span>
            </span>
          </div>
        </div>



      </CardContent>
    </Card>
  );
}
