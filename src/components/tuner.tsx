
"use client";

import { Mic, MicOff, CheckCircle2, Trophy, Lock, Star, ArrowLeft, RefreshCw, Brain, Music, Drum, Play, Square, Pause, Hand, Footprints, ArrowRight, BarChart3, Flame, Menu, Moon, Sun, Mic2, Share2, Heart, Crown, Download } from "lucide-react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { useHaptic } from "@/hooks/use-haptic";
import { useStreak } from "@/hooks/use-streak";
import { useLives } from "@/hooks/use-lives";
import { useDailyQuests } from "@/hooks/use-daily-quests";
import { useToast } from "@/hooks/use-toast";
import { useUISounds } from "@/hooks/use-ui-sounds";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { ProgressDashboard, achievements, computeStats } from "./progress-dashboard";
import type { Achievement } from "./progress-dashboard";
import { PitchGauge } from "./pitch-gauge";
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { StreakRewards } from "./streak-rewards";
import { ShareDialog } from "./share-dialog";
import { UserProfileDialog } from "./user-profile-dialog";
import { InventoryDialog } from "./inventory-dialog";
import { DailyGoalDialog } from "./daily-goal-dialog";
import { useProfile } from "@/hooks/use-profile";
import { useInventory } from "@/hooks/use-inventory";
import { dbSave, dbLoad } from '@/lib/db';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import confetti from 'canvas-confetti';

gsap.registerPlugin(useGSAP);

const triggerConfetti = (colors?: string[]) => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, colors: colors };
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);
};

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch(e) {}
    }
};

export type NoteInfo = {
  name: string;
  octave: number;
  frequency: number;
  fullName: string;
  midi: number;
};

const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const americanNoteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const generateChallenge = (count: number, pool: NoteInfo[]): NoteInfo[] => {
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
    // Fácil (Levels 7-12) - now 6 levels of rhythm
    7: [ // 80 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },
        { time: 1500, instrument: 'clap' },
    ],
    8: [ // 90 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },
        { time: 666, instrument: 'kick' },
        { time: 1333, instrument: 'clap' },
    ],
    9: [ // 100 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' }, 
        { time: 1200, instrument: 'clap' }, 
    ],
    10: [ // 110 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },
        { time: 1091, instrument: 'clap' }, 
    ],
     11: [ // 120 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },
        { time: 500, instrument: 'clap' },
        { time: 1000, instrument: 'kick' },
        { time: 1500, instrument: 'clap' },
    ],
     12: [ // 130 BPM, 2 bars 4/4
        { time: 0, instrument: 'kick' },
        { time: 461, instrument: 'kick' },
        { time: 923, instrument: 'clap' },
        { time: 1846, instrument: 'kick' },
    ],
    // Medio (Levels 13-16)
    13: [ // 140 BPM - Basic Rock
        { time: 0, instrument: 'kick' }, { time: 857, instrument: 'clap' }, { time: 1714, instrument: 'kick' }, { time: 2571, instrument: 'clap' },
    ],
    14: [ // 150 BPM
        { time: 0, instrument: 'kick' }, { time: 400, instrument: 'kick' }, { time: 800, instrument: 'clap' }, { time: 1600, instrument: 'kick' }, { time: 2400, instrument: 'clap' },
    ],
    15: [ // 160 BPM
        { time: 0, instrument: 'kick' }, { time: 750, instrument: 'clap' }, { time: 1125, instrument: 'kick' }, { time: 1500, instrument: 'kick' }, { time: 1875, instrument: 'clap' },
    ],
    16: [ // 170 BPM - Funk
        { time: 0, instrument: 'kick' }, { time: 705, instrument: 'clap' }, { time: 1411, instrument: 'kick' }, { time: 1764, instrument: 'kick' }, { time: 2470, instrument: 'clap' },
    ],
    // Dificil (Levels 17-20)
    17: [ // 180 BPM - Rock
        { time: 0, instrument: 'kick' }, { time: 666, instrument: 'clap' }, { time: 1333, instrument: 'kick' }, { time: 1666, instrument: 'kick' },
        { time: 2000, instrument: 'clap' }, { time: 2666, instrument: 'kick' }, { time: 3333, instrument: 'clap' },
    ],
    18: [ // 190 BPM
        { time: 0, instrument: 'kick' }, { time: 315, instrument: 'kick' }, { time: 631, instrument: 'clap' }, { time: 947, instrument: 'kick' },
        { time: 1263, instrument: 'kick' }, { time: 1578, instrument: 'clap' }, { time: 2210, instrument: 'kick' }, { time: 2842, instrument: 'clap' },
    ],
    19: [ // 200 BPM
        { time: 0, instrument: 'kick' }, { time: 300, instrument: 'kick' }, { time: 600, instrument: 'clap' }, { time: 900, instrument: 'kick' },
        { time: 1200, instrument: 'kick' }, { time: 1500, instrument: 'clap' }, { time: 1800, instrument: 'kick' }, { time: 2100, instrument: 'clap' },
    ],
    20: [ // 210 BPM
        { time: 0, instrument: 'kick' }, { time: 285, instrument: 'kick' }, { time: 571, instrument: 'clap' }, { time: 857, instrument: 'kick' },
        { time: 1142, instrument: 'clap' }, { time: 1428, instrument: 'kick' }, { time: 1714, instrument: 'kick' }, { time: 2000, instrument: 'clap' },
    ],
    // Maestro (Insane Rhythm - Levels 21-24)
    21: [ // 220 BPM - Ultra Flash Rock
        { time: 0, instrument: 'kick' }, { time: 272, instrument: 'kick' }, { time: 545, instrument: 'clap' }, { time: 1090, instrument: 'kick' }, { time: 1363, instrument: 'kick' }, { time: 1636, instrument: 'clap' },
    ],
    22: [ // 230 BPM - Triple Syncopation
        { time: 0, instrument: 'kick' }, { time: 130, instrument: 'kick' }, { time: 260, instrument: 'clap' }, { time: 520, instrument: 'kick' }, { time: 780, instrument: 'clap' }, { time: 1040, instrument: 'kick' }, { time: 1300, instrument: 'clap' },
    ],
    23: [ // 240 BPM - Speed Demon
        { time: 0, instrument: 'kick' }, { time: 250, instrument: 'clap' }, { time: 500, instrument: 'kick' }, { time: 750, instrument: 'clap' }, { time: 1000, instrument: 'kick' }, { time: 1250, instrument: 'clap' }, { time: 1500, instrument: 'kick' }, { time: 1750, instrument: 'clap' },
    ],
    24: [ // 250 BPM - Impossible Riff
        { time: 0, instrument: 'kick' }, { time: 240, instrument: 'kick' }, { time: 480, instrument: 'clap' }, { time: 720, instrument: 'kick' }, { time: 960, instrument: 'clap' }, { time: 1200, instrument: 'kick' }, { time: 1680, instrument: 'kick' }, { time: 1920, instrument: 'clap' },
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

type Difficulty = "Calentamiento" | "Fácil" | "Medio" | "Difícil" | "Maestro";
type ChallengeDifficulty = Exclude<Difficulty, "Calentamiento">;
type ProgressState = Record<ChallengeDifficulty, Record<number, number>>; // 0 = not done, 1-3 = stars

const difficultySettings = {
  "Calentamiento": { exerciseCount: 12 },
  "Fácil": { levelCount: 12 },
  "Medio": { levelCount: 16 },
  "Difícil": { levelCount: 20 },
  "Maestro": { levelCount: 10 },
};

const difficultyLevels: Record<ChallengeDifficulty, number[]> = {
    "Fácil":   [3, 4, 4, 5, 5, 6, 0, 0, 0, 0, 0, 0], // 6 tuning, 6 rhythm
    "Medio":   [4, 5, 5, 6, 6, 6, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0], // 12 tuning, 4 rhythm
    "Difícil": [5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0], // 12 tuning, 8 rhythm
    "Maestro": [6, 7, 8, 9, 10, 10, 0, 0, 0, 0], // 6 tuning, 4 rhythm — brutal note counts, tight tolerance
};

const UserMenu = ({ align, isProfileSet, avatar, MenuIcon, lives, maxLives, dailyQuests, setShowProfileDialog, setShowNoLivesDialog, setShowInventoryDialog, handleBackButtonClick, stopAllRhythmAndAudio, isDetecting, stop, setIsPaused, setShowProgressDashboard, theme, setTheme, onOpenVocalAssessor, displayName, isOutOfLives }: any) => {
  const { equippedAura, equippedTheme } = useInventory();
  const { isInstallable, promptInstall } = usePWAInstall();

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-background/40">
            <span className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                equippedAura === 'bronze_star' && 'aura-bronze',
                equippedAura === 'fire' && 'aura-fire',
                equippedAura === 'lightning' && 'aura-lightning',
                equippedAura === 'cosmic' && 'aura-cosmic',
                equippedAura === 'divine' && 'aura-divine',
            )}>
                {isProfileSet ? avatar : <MenuIcon className="h-5 w-5" />}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56 glass-panel border-white/10 dark:border-white/5 rounded-2xl shadow-xl p-2 gap-1 flex flex-col">
            <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl filter drop-shadow-md">{avatar}</span>
                        <span className="font-bold text-foreground leading-tight">{isProfileSet ? displayName : 'Mi Perfil'}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { if (isOutOfLives) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); setShowNoLivesDialog(true); }}}>
                    <div className="flex gap-1.5">
                        {Array.from({ length: maxLives }).map((_, i) => (
                            <Heart key={i} className={cn("w-4 h-4 transition-all filter drop-shadow-sm", i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground/30")} />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">{lives}/{maxLives}</span>
                </div>
                <DropdownMenuSeparator className="bg-border/20 my-1" />
                <div className="px-1 py-1">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Misiones Diarias</span>
                        {dailyQuests.allComplete && <span className="text-[9px] bg-emerald-500/20 text-emerald-500 font-bold px-1.5 py-0.5 rounded-full">✨</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {dailyQuests.quests.map((q: any) => {
                            const done = q.current >= q.target;
                            const pct = Math.min((q.current / q.target) * 100, 100);
                            return (
                                <div key={q.id} className="group relative">
                                    <div className="flex items-center justify-between mb-0.5 px-0.5">
                                        <span className="text-[10px] font-medium text-foreground/80 truncate flex items-center gap-1 text-left">
                                            {q.icon} {q.label}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground">{q.current}/{q.target}</span>
                                    </div>
                                    <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-700", done ? "bg-emerald-500" : "bg-primary/50")} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="rounded-xl py-2 cursor-pointer transition-colors focus:bg-primary/20 bg-primary/10 mt-1 text-primary justify-center font-bold">
                Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); setTimeout(() => setShowInventoryDialog(true), 100); }} className="rounded-xl py-2 cursor-pointer transition-colors focus:bg-accent/10 bg-accent/5 mt-1 text-accent-foreground justify-center font-bold">
                🎒 Mi Armario
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40 my-1" />
            <DropdownMenuItem onClick={handleBackButtonClick} className="rounded-xl py-2 cursor-pointer transition-colors focus:bg-primary/10">
                <Mic2 className="mr-2 h-4 w-4" />
                <span className="font-medium">Ajustar tipo de voz</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { stopAllRhythmAndAudio(); if (isDetecting) { stop(); setIsPaused(true); } setShowProgressDashboard(true); }} className="rounded-xl py-2 cursor-pointer transition-colors focus:bg-primary/10">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span className="font-medium">Mi Progreso</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl py-2 cursor-pointer transition-colors focus:bg-primary/10">
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4 text-orange-400" /> : <Moon className="mr-2 h-4 w-4 text-slate-500" />}
                <span className="font-medium">Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
            </DropdownMenuItem>
            {isInstallable && (
                <DropdownMenuItem onClick={promptInstall} className="rounded-xl py-2 cursor-pointer transition-colors focus:bg-green-500/20 text-green-500 font-bold bg-green-500/10 mt-1 justify-center">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Instalar App</span>
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border/40 my-1" />
            <DropdownMenuItem onClick={() => { 
                stopAllRhythmAndAudio(); 
                if (isDetecting) stop(); 
                if (onOpenVocalAssessor) onOpenVocalAssessor(); 
            }} className="rounded-xl py-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/10 transition-colors">
                <Mic2 className="mr-2 h-4 w-4" />
                <span className="font-bold">Test de Rango Vocal</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
};

function TunerSkeleton() {
    return (
      <div className="flex flex-col items-center gap-8 w-full animate-pulse">
        <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-6 w-32 rounded-md" />
        </div>

        <div className="relative w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
            <Skeleton className="absolute w-full h-full rounded-full" />
            <Skeleton className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-full" />
        </div>
        
        <Skeleton className="h-14 w-48 sm:h-16 sm:w-56 rounded-full" />
      </div>
    );
  }

export function Tuner({ notePool, gender, vocalRangeKey, onGoBack, onOpenVocalAssessor }: { notePool: NoteInfo[]; gender: 'masculino' | 'femenino', vocalRangeKey: string, onGoBack: () => void, onOpenVocalAssessor?: () => void }) {
  const { theme, setTheme } = useTheme();
  const { note, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  const { toast } = useToast();
  const { tapLight, tapMedium, tapHeavy, tapSuccess, tapTriumph, tapError } = useHaptic();
  const streak = useStreak();
  const dailyQuests = useDailyQuests();
  const { lives, maxLives, isOutOfLives, loseLife, timeToNextLife } = useLives();
  const { avatar, displayName, isProfileSet } = useProfile();
  const { equippedAura, equippedConfetti, equippedSound, checkAndUnlockNewRewards } = useInventory();
  const [showNoLivesDialog, setShowNoLivesDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showDailyGoalsDialog, setShowDailyGoalsDialog] = useState(false);
  const uiSounds = useUISounds();
  // Track daily quests to show achievement popup on completion
  const prevQuestsRef = useRef(dailyQuests.quests);
  const isQuestsInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only check for completions if the quests have already been fully loaded into the app
    if (isQuestsInitializedRef.current) {
        dailyQuests.quests.forEach(q => {
          const prev = prevQuestsRef.current.find((p: any) => p.id === q.id);
          if (prev && prev.current < prev.target && q.current >= q.target) {
            setAchievementNotification({
              id: `quest_${q.id}`,
              title: '¡Misión Diaria Cumplida!',
              description: q.label,
              icon: <span className="text-2xl">{q.icon}</span>,
              check: () => true
            });
            uiSounds.play('success');
            
            // Auto-dismiss after 3.5 seconds
            setTimeout(() => {
                setAchievementNotification(null);
            }, 3500);
          }
        });
    }

    if (dailyQuests.loaded) {
        isQuestsInitializedRef.current = true;
    }

    prevQuestsRef.current = dailyQuests.quests;
  }, [dailyQuests.quests, dailyQuests.loaded, uiSounds]);

  const perfectStreakRef = useRef(0);

  // Check for new reward unlocks on mount
  useEffect(() => {
    if (streak > 0) {
      const newRewards = checkAndUnlockNewRewards(streak);
      newRewards.forEach(r => {
        toast({ variant: 'accent', title: `${r.icon} ¡Nueva recompensa!`, description: `${r.name} desbloqueado. Ve a tu Armario para equiparlo.`, duration: 5000 });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  // Practice time tracker for daily quests
  useEffect(() => {
    const timer = setInterval(() => {
      dailyQuests.addMinutes(1);
    }, 60000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [difficulty, setDifficulty] = useState<Difficulty>("Calentamiento");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [challengeNotes, setChallengeNotes] = useState<NoteInfo[]>([]);
  const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<string>>(new Set());

  const [inTuneTime, setInTuneTime] = useState(0);
  const inTuneSinceRef = useRef<number | null>(null);
  const lastHapticTimeRef = useRef<number>(0);

  const [lastCompletedNoteFullName, setLastCompletedNoteFullName] = useState<string | null>(null);
  const [completionPhrase, setCompletionPhrase] = useState("");
  
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [showLevelCompleteDialog, setShowLevelCompleteDialog] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const checkDailyGoalPopup = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSeenKey = `afinapp_last_goal_seen_${today}`;
    const seen = await dbLoad<boolean>(lastSeenKey);
    if (!seen) {
        setShowDailyGoalsDialog(true);
        await dbSave(lastSeenKey, true).catch(console.error);
    }
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [radius, setRadius] = useState(160);

  const [dialogMessage, setDialogMessage] = useState("Prepárate para poner a prueba tu afinación. Elige una dificultad para empezar.");
  const [progress, setProgress] = useState<ProgressState>({ "Fácil": {}, "Medio": {}, "Difícil": {}, "Maestro": {} });
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | null>(null);
  const [isInitialWarmupCompleted, setIsInitialWarmupCompleted] = useState(false);
  const [lastLevelStars, setLastLevelStars] = useState(0);
  
  const [gameMode, setGameMode] = useState<'standard' | 'interval' | 'simon-says' | 'melody-challenge' | 'rhythm-challenge'>('standard');
  const [simonSequence, setSimonSequence] = useState<NoteInfo[]>([]);
  const [playerSimonIndex, setPlayerSimonIndex] = useState(0);
  const [simonPlaybackIndex, setSimonPlaybackIndex] = useState<number | null>(null);
  const [simonPhase, setSimonPhase] = useState<'idle' | 'playback' | 'singing'>('idle');
  const [hasRepeatedSequence, setHasRepeatedSequence] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);

  // Keyboard and Tap tracking
  const lastTapTimeRef = useRef({ kick: 0, clap: 0 });

  // Rhythm Game State
  const [rhythmPattern, setRhythmPattern] = useState<{ time: number; instrument: 'clap' | 'kick' }[]>([]);
  
  // Streak Roadmap state
  const [showStreakRewards, setShowStreakRewards] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const [rhythmPhase, setRhythmPhase] = useState<'idle' | 'guide' | 'playing' | 'results'>('idle');
  const [guideKey, setGuideKey] = useState(0);
  const [userRhythmTaps, setUserRhythmTaps] = useState<{ time: number; instrument: 'clap' | 'kick' }[]>([]);
  const rhythmStartTimeRef = useRef(0);

  // Combo System
  const [comboCount, setComboCount] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const lastCompletedTimeRef = useRef<number>(0);

  const handleComboAdvance = useCallback(() => {
     const now = Date.now();
     if (now - lastCompletedTimeRef.current < 4500) {
       setComboCount(prev => {
         const newCombo = prev + 1;
         if (newCombo >= 3) {
           setShowComboAnimation(true);
           setTimeout(() => setShowComboAnimation(false), 2000);
           // Trigger a short burst of haptics for combo
           if (typeof navigator !== 'undefined' && navigator.vibrate) {
             navigator.vibrate([30, 50, 30]);
           }
         }
         return newCombo;
       });
     } else {
       setComboCount(1);
     }
      lastCompletedTimeRef.current = now;
      // Report combo to daily quests
      dailyQuests.reportCombo(comboCount + 1);
  }, []);
  const [rhythmScore, setRhythmScore] = useState(0);
  const [rhythmBpm, setRhythmBpm] = useState(100);
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const rhythmTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const activeAudioNodesRef = useRef<AudioScheduledSourceNode[]>([]);

  // Floating feedback state
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; color: string; x: 'left' | 'right' }[]>([]);
  const floatingIdRef = useRef(0);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  
  const [showEasyWinVideo, setShowEasyWinVideo] = useState(false);
  const [showMediumWinVideo, setShowMediumWinVideo] = useState(false);
  const [showHardWinVideo, setShowHardWinVideo] = useState(false);
  const [hardVideoPhase, setHardVideoPhase] = useState<'playing' | 'white' | 'dust'>('playing');
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const noteContainerRef = useRef<HTMLDivElement>(null);
  const [freePlayMode, setFreePlayMode] = useState(false);
  const [achievementNotification, setAchievementNotification] = useState<Achievement | null>(null);
  const previouslyUnlockedRef = useRef<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediumVideoRef = useRef<HTMLVideoElement>(null);
  const hardVideoRef = useRef<HTMLVideoElement>(null);
  const loopCountRef = useRef(0);

  // GSAP animation refs
  const duckRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const kickBtnRef = useRef<HTMLButtonElement>(null);
  const clapBtnRef = useRef<HTMLButtonElement>(null);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferCache = useRef(new Map<string, AudioBuffer>());
  const activeSoundSourceRef = useRef<{ source: AudioScheduledSourceNode, gainNode?: GainNode } | null>(null);


  useEffect(() => {
      if (showEasyWinVideo && videoRef.current) {
          const video = videoRef.current;
          video.currentTime = 0;
          loopCountRef.current = 0;
          video.play().catch(e => console.error("Video play failed:", e));
      }
  }, [showEasyWinVideo]);

  useEffect(() => {
      if (showMediumWinVideo && mediumVideoRef.current) {
          const video = mediumVideoRef.current;
          video.currentTime = 0;
          video.play().catch(e => console.error("Video play failed:", e));
      }
  }, [showMediumWinVideo]);

  useEffect(() => {
    if (showHardWinVideo && hardVideoRef.current && hardVideoPhase === 'playing') {
        const video = hardVideoRef.current;
        video.currentTime = 0;
        video.play().catch(e => console.error("Video play failed:", e));
    }
  }, [showHardWinVideo, hardVideoPhase]);

  const handleVideoTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;

      // Reset loop count when the video restarts from the beginning natively via `loop`
      if (video.currentTime < 1) {
          loopCountRef.current = 0;
      }

      // Loop between second 6 and 7, exactly 4 times
      if (video.currentTime >= 7 && video.currentTime < 7.5) {
          if (loopCountRef.current < 4) {
              video.currentTime = 6;
              loopCountRef.current++;
          }
      }
  };

  const markLevelAsComplete = useCallback((diff: ChallengeDifficulty, level: number, stars: number) => {
    const clampedStars = Math.max(1, Math.min(3, stars));
    const currentStars = progress[diff]?.[level] || 0;
    const bestStars = Math.max(currentStars, clampedStars);
    
    setLastLevelStars(clampedStars);

    const newProgress = { ...progress };
    newProgress[diff] = { ...newProgress[diff], [level]: bestStars };
    setProgress(newProgress);
    dbSave(vocalRangeKey, newProgress).catch(console.error);
    
    const isLastLevelOfEasy = diff === 'Fácil' && level === difficultySettings['Fácil'].levelCount;
    if (isLastLevelOfEasy) {
        setShowEasyWinVideo(true);
    }

    const isLastLevelOfMedium = diff === 'Medio' && level === difficultySettings['Medio'].levelCount;
    if (isLastLevelOfMedium) {
        setShowMediumWinVideo(true);
    }

    const isLastLevelOfHard = diff === 'Difícil' && level === difficultySettings['Difícil'].levelCount;
    if (isLastLevelOfHard) {
        setShowHardWinVideo(true);
    }

  }, [vocalRangeKey, progress]);

  const getPlaybackAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    let context = audioContextRef.current;
    if (!context || context.state === 'closed') {
        try {
            context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
        } catch (e) {
            console.error("Could not create playback AudioContext", e);
            toast({ variant: "destructive", title: "Error de Audio", description: `No se pudo inicializar el motor de audio. ${e instanceof Error ? e.message : ''}` });
            return null;
        }
    }
    if (context.state === 'suspended') {
        context.resume();
    }
    return context;
  }, [toast]);
  

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
    vibrate(playDuration * 1000);

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
          if (gainNode) {
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + playDuration - 0.05);
            source.stop(audioContext.currentTime + playDuration);
          } else {
            source.stop(audioContext.currentTime + playDuration);
          }
        } catch (e) {
          // Can fail if context is closed
        }
      });
    };
    
    const americanNoteName = americanNoteStrings[noteInfo.midi % 12];
    const americanFullName = `${americanNoteName}${noteInfo.octave}`;
    const fileNameFriendlyFullName = americanFullName.replace('#', 's');
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

const playMetronomeTick = useCallback((time: number): AudioScheduledSourceNode | null => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return null;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, time);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain).connect(audioContext.destination);
    osc.start(time);
    osc.stop(time + 0.05);
    return osc;
}, [getPlaybackAudioContext]);


const playRhythmSound = useCallback((instrument: 'clap' | 'kick', time: number): AudioScheduledSourceNode | null => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return null;

    if (instrument === 'clap') {
        vibrate(40);
        const noise = audioContext.createBufferSource();
        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = (Math.random() * 2 - 1); }
        noise.buffer = buffer;

        const noiseEnvelope = audioContext.createGain();
        noiseEnvelope.gain.setValueAtTime(0, time);
        noiseEnvelope.gain.linearRampToValueAtTime(1.5, time + 0.01);
        noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        noise.connect(noiseEnvelope).connect(audioContext.destination);
        noise.start(time);
        noise.stop(time + 0.2);
        return noise;
    } else if (instrument === 'kick') {
        vibrate(80);
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        gain.gain.setValueAtTime(2.5, time); // Louder kick
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        osc.connect(gain).connect(audioContext.destination);
        osc.start(time);
        osc.stop(time + 0.1);
        return osc;
    }
    return null;
}, [getPlaybackAudioContext]);

const stopAllRhythmAndAudio = useCallback(() => {
    rhythmTimeoutsRef.current.forEach(clearTimeout);
    rhythmTimeoutsRef.current = [];

    activeAudioNodesRef.current.forEach(source => {
        try {
          source.stop(0);
        } catch (e) {
            // Node might have already stopped, which is fine.
        }
    });
    activeAudioNodesRef.current = [];
    
    if (activeSoundSourceRef.current) {
        try {
            activeSoundSourceRef.current.source.stop(0);
            if (activeSoundSourceRef.current.source.disconnect) activeSoundSourceRef.current.source.disconnect();
            if (activeSoundSourceRef.current.gainNode && activeSoundSourceRef.current.gainNode.disconnect) {
                activeSoundSourceRef.current.gainNode.disconnect();
            }
        } catch (e) {
            // Already stopped or disconnected
        }
        activeSoundSourceRef.current = null;
    }

    vibrate(0); // Stop any ongoing vibrations
}, []);

const startRhythmSession = useCallback((bpm: number, guidePattern: { time: number; instrument: 'clap' | 'kick' }[]) => {
    const audioContext = getPlaybackAudioContext();
    if (!audioContext) return;

    stopAllRhythmAndAudio();
    setRhythmPhase('guide');
    setGuideKey(prev => prev + 1);
    setUserRhythmTaps([]);
    setRhythmScore(0);
    setShowFailureMessage(false);
    setCombo(0);
    comboRef.current = 0;
    setFloatingTexts([]);

    const beatDuration_s = 60.0 / bpm;
    const maxPatternTime_ms = Math.max(...guidePattern.map(h => h.time));
    const beatsInPattern = maxPatternTime_ms / (beatDuration_s * 1000);
    const guideBars = Math.max(1, Math.ceil((beatsInPattern + 1) / 4));
    
    const guideDuration_ms = guideBars * 4 * beatDuration_s * 1000;
    
    const audioStartTime_s = audioContext.currentTime + 0.5;
    const playPhaseStartTime_s = audioStartTime_s + guideDuration_ms / 1000;

    rhythmStartTimeRef.current = playPhaseStartTime_s * 1000;

    // Schedule just enough metronome beats for the level (Guide phase + Play phase + Padding)
    const exactBeatsNeeded = (guideBars * 4) * 2 + 12; // 12 extra beats (3 bars padding) to handle any latency
    for (let i = 0; i < exactBeatsNeeded; i++) {
        const tickTime = audioStartTime_s + i * beatDuration_s;
        const tickNode = playMetronomeTick(tickTime);
        if (tickNode) activeAudioNodesRef.current.push(tickNode);
    }
    
    // Schedule guide sounds
    guidePattern.forEach(hit => {
        const guideNode = playRhythmSound(hit.instrument, audioStartTime_s + hit.time / 1000);
        if (guideNode) activeAudioNodesRef.current.push(guideNode);
    });

    // Transition to 'playing' 0.25 beats BEFORE the new bar starts
    const transitionDelay_ms = (guideBars * 4 - 0.25) * beatDuration_s * 1000;
    const transitionTimeout = setTimeout(() => {
        setRhythmPhase('playing');
    }, transitionDelay_ms + 500); // Add audio delay buffer

    rhythmTimeoutsRef.current.push(transitionTimeout);

}, [getPlaybackAudioContext, playMetronomeTick, playRhythmSound, stopAllRhythmAndAudio]);

  useGSAP(() => {
    if (rhythmPhase === 'guide' && duckRef.current && kickBtnRef.current && clapBtnRef.current && containerRef.current) {
        // Force cleanup to avoid GSAP sticking variables during rapid click overlapping
        gsap.killTweensOf([duckRef.current, kickBtnRef.current, clapBtnRef.current]);
        gsap.set(duckRef.current, { clearProps: "all" });
        gsap.set([kickBtnRef.current, clapBtnRef.current], { clearProps: "transform" });

        const tl = gsap.timeline();
        gsap.set(duckRef.current, { opacity: 1, y: -250, x: 0, scaleX: 1, scaleY: 1 }); // Force precise initial state
        
        rhythmPattern.forEach((hit) => {
            const isKick = hit.instrument === 'kick';
            const targetBtn = isKick ? kickBtnRef.current : clapBtnRef.current;
            const hitTime_s = hit.time / 1000 + 0.5; // match audio delay
            const jumpTime = 0.2; // time it takes to fall
            
            // Arc movement towards target button
            tl.to(duckRef.current, {
                x: () => {
                    if (!containerRef.current || !targetBtn) return 0;
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const containerCenter = containerRect.left + containerRect.width / 2;
                    const targetRect = targetBtn.getBoundingClientRect();
                    const targetCenter = targetRect.left + targetRect.width / 2;
                    return targetCenter - containerCenter;
                },
                y: -40, // Land slightly above center of button
                duration: jumpTime,
                ease: "power2.in",
            }, hitTime_s - jumpTime);

            // Squash duck and trampoline effect on the button on landing
            tl.to(duckRef.current, { scaleY: 0.6, scaleX: 1.2, duration: 0.05 }, hitTime_s);
            tl.to(targetBtn, { scaleY: 0.8, scaleX: 1.05, duration: 0.05 }, hitTime_s);

            // Rebound physics
            tl.to(duckRef.current, { scaleY: 1, scaleX: 1, duration: 0.1 }, hitTime_s + 0.05);
            tl.to(targetBtn, { scaleY: 1, scaleX: 1, duration: 0.1 }, hitTime_s + 0.05);

            // Jump back up into the air awaiting next beat
            tl.to(duckRef.current, {
                y: -150,
                duration: jumpTime * 1.5,
                ease: "power2.out",
            }, hitTime_s + 0.05);
        });

        // After guide finishes, duck fades and stops
        const beatDuration_s = 60.0 / rhythmBpm;
        const maxPatternBeats = Math.max(...rhythmPattern.map(h => h.time)) / (beatDuration_s * 1000);
        const guideBars = Math.max(1, Math.ceil((maxPatternBeats + 1) / 4));
        const fadeOutTime_s = (guideBars * 4 - 0.25) * beatDuration_s + 0.5;
        tl.to(duckRef.current, { opacity: 0, duration: 0.3 }, fadeOutTime_s);
    } else {
        if (duckRef.current) {
            gsap.killTweensOf(duckRef.current);
            gsap.set(duckRef.current, { opacity: 0 });
        }
    }
  }, { dependencies: [rhythmPhase, rhythmPattern, rhythmBpm, guideKey], scope: containerRef });

  useEffect(() => {
    let animationFrameId: number;

    const checkTime = () => {
        if (rhythmPhase !== 'guide') return;
        
        const audioContext = audioContextRef.current;
        if (!audioContext) { 
            animationFrameId = requestAnimationFrame(checkTime);
            return;
        }

        const guideDuration_ms = (60.0 / rhythmBpm) * 8 * 1000;
        const playStartTime = rhythmStartTimeRef.current;
        const now = audioContext.currentTime * 1000;
        
        if (now >= playStartTime) {
            setRhythmPhase('playing');
        } else {
            animationFrameId = requestAnimationFrame(checkTime);
        }
    };

    if (rhythmPhase === 'guide') {
        animationFrameId = requestAnimationFrame(checkTime);
    }

    return () => {
        cancelAnimationFrame(animationFrameId);
    };
  }, [rhythmPhase, rhythmBpm]);
  
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
    setIsMounted(true);

    try {
        // Load from IDB first, fallback to localStorage
        dbLoad<Record<string, Record<string, number | boolean>>>(vocalRangeKey).then(parsedProgress => {
            if (parsedProgress && parsedProgress['Fácil'] && parsedProgress['Medio'] && parsedProgress['Difícil']) {
                const migrated: ProgressState = { 'Fácil': {}, 'Medio': {}, 'Difícil': {}, 'Maestro': {} };
                for (const diff of ['Fácil', 'Medio', 'Difícil', 'Maestro'] as ChallengeDifficulty[]) {
                    for (const [level, value] of Object.entries(parsedProgress[diff] || {})) {
                        migrated[diff][Number(level)] = typeof value === 'boolean' ? (value ? 1 : 0) : (value as number);
                    }
                }
                setProgress(migrated);
            }
        }).catch(console.error);
    } catch (error) {
        console.error("Failed to load progress", error);
    }
    
    function handleResize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        if (vw < 640) {
            // Total overhead: everything that ISN'T the orbital system
            // header=80, footer(pausar+elegir+margin)=160, note overshoot(top+bottom)=64, safety=36
            const overhead = 340;
            const maxFromHeight = Math.floor((vh - overhead) / 2);
            
            const baseRadius = 142;
            const absoluteMin = 100;
            
            setRadius(Math.max(absoluteMin, Math.min(baseRadius, maxFromHeight)));
        } else {
            // Desktop/tablet: center=220px(r=110) + gap=20 + note=72px(r=36) = 166
            setRadius(166);
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
        stop();
        stopAllRhythmAndAudio();
        window.removeEventListener('resize', handleResize);
    }
  }, [vocalRangeKey, stopAllRhythmAndAudio, stop]);

  const tolerance = difficulty === 'Maestro'
    ? 10 // Ultra-tight tolerance for Maestro mode
    : (activeNote && activeNote.midi < 49 ? 30 : 18); // Standard tolerances

  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
        if (gameMode !== 'simon-says' && gameMode !== 'melody-challenge' && gameMode !== 'rhythm-challenge') { // Standard and Interval logic
            if (!isDetecting || !activeNote || lastCompletedNoteFullName || sessionCompleted || isPaused) {
                setInTuneTime(0);
                inTuneSinceRef.current = null;
            } else {
                const isCorrectNote = note.name === activeNote.name && note.octave === activeNote.octave;
                const isTolerablyInTune = Math.abs(smoothedCentsOff) < tolerance;

                if (isCorrectNote && isTolerablyInTune) {
                    if (inTuneSinceRef.current === null) {
                        inTuneSinceRef.current = Date.now();
                    }
                    const sustainedTime = Date.now() - inTuneSinceRef.current;
                    setInTuneTime(sustainedTime);

                    if (Date.now() - lastHapticTimeRef.current > 120) {
                        tapLight();
                        lastHapticTimeRef.current = Date.now();
                    }

                    if (sustainedTime >= challengeDuration) {
                        playCompletionSound();
                        const randomPhrase = completionPhrases[Math.floor(Math.random() * completionPhrases.length)];
                        setCompletionPhrase(randomPhrase);
                        
                        setCompletedNotes(prev => new Set(prev).add(activeNote.fullName));
                        setLastCompletedNoteFullName(activeNote.fullName);
                        tapHeavy();
                        handleComboAdvance();
                        dailyQuests.addNotes(1);
                        
                        // Easter Egg: consecutive perfect notes (< 5 cents off)
                        if (Math.abs(smoothedCentsOff) < 5) {
                          perfectStreakRef.current += 1;
                          if (perfectStreakRef.current === 10) {
                            uiSounds.play('perfectStreak');
                            triggerConfetti(equippedConfetti === 'deluxe_gold' ? ['#FFD700', '#FFA500', '#B8860B', '#FAFAD2'] : undefined);
                            toast({
                              variant: 'accent',
                              title: '🌟 ¡PERFECCIÓN VOCAL!',
                              description: '10 notas perfectas seguidas. Eres leyenda.',
                              duration: 4000,
                            });
                          } else if (perfectStreakRef.current === 20) {
                            uiSounds.play('fanfare');
                            triggerConfetti(equippedConfetti === 'deluxe_gold' ? ['#FFD700', '#FFA500', '#B8860B', '#FAFAD2'] : undefined);
                            triggerConfetti(equippedConfetti === 'deluxe_gold' ? ['#FFD700', '#FFA500', '#B8860B', '#FAFAD2'] : undefined);
                            toast({
                              variant: 'accent',
                              title: '👑 ¡VOZ DIVINA!',
                              description: '20 notas perfectas. Tu voz es un instrumento celestial.',
                              duration: 5000,
                            });
                          }
                        } else {
                          perfectStreakRef.current = 0;
                        }
                        
                        setInTuneTime(0);
                        inTuneSinceRef.current = null;
                        
                        if (completedNotes.size + 1 >= challengeNotes.length) {
                            setSessionCompleted(true);
                            animateNotesExit();
                            playUISound('success');
                            tapSuccess();
                            triggerConfetti(equippedConfetti === 'deluxe_gold' ? ['#FFD700', '#FFA500', '#B8860B', '#FAFAD2'] : undefined);
                            playAllCompletedSound();
                            if (difficulty === 'Calentamiento') {
                                setIsInitialWarmupCompleted(true);
                                setDialogMessage("¡Excelente trabajo! Has completado el calentamiento. ¿Quieres practicar un poco más o empezar un desafío?");
                                setTimeout(() => {
                                    setSelectedDifficulty(null);
                                    setShowDifficultyDialog(true);
                                    checkDailyGoalPopup();
                                }, 1500);
                            } else {
                                // Stars: 3⭐ = no pauses, 2⭐ = paused once, 1⭐ = completed
                                const stars = isPaused ? 1 : (repeatCount === 0 ? 3 : 2);
                                markLevelAsComplete(difficulty as ChallengeDifficulty, currentLevel, stars);
                                setTimeout(() => setShowLevelCompleteDialog(true), 1500);
                            }
                        } else {
                            setTimeout(() => {
                                setLastCompletedNoteFullName(null);
                                if (gameMode === 'interval') {
                                    const currentIndex = challengeNotes.findIndex(n => n.fullName === activeNote.fullName);
                                    const nextNote = challengeNotes[currentIndex + 1];
                                    if (nextNote) {
                                        setActiveNote(nextNote);
                                        playNote(nextNote);
                                    } else {
                                        setActiveNote(null);
                                    }
                                } else {
                                    setActiveNote(null);
                                }
                            }, 1200);
                        }
                    }
                } else {
                    setInTuneTime(0);
                    inTuneSinceRef.current = null;
                    if (Math.abs(smoothedCentsOff) >= 15) {
                      perfectStreakRef.current = 0;
                    }
                }
            }
        } else if (gameMode === 'simon-says' || gameMode === 'melody-challenge') { // Simon Says & Melody Logic
            if (!isDetecting || sessionCompleted || simonPhase !== 'singing' || lastCompletedNoteFullName || isPaused) {
                setInTuneTime(0);
                inTuneSinceRef.current = null;
            } else {
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

                    if (Date.now() - lastHapticTimeRef.current > 120) {
                        tapLight();
                        lastHapticTimeRef.current = Date.now();
                    }

                    if (sustainedTime >= challengeDuration) {
                        const isMelodyChallenge = gameMode === 'melody-challenge';
                        if (!isMelodyChallenge) {
                            playCompletionSound();
                        }
                        
                        const uniqueKey = `${targetNote.fullName}-${playerSimonIndex}`;
                        setCompletedNotes(prev => new Set(prev).add(uniqueKey));
                        handleComboAdvance();
                        dailyQuests.addNotes(1);

                        if (!isMelodyChallenge) {
                            setLastCompletedNoteFullName(uniqueKey);
                        }
                        
                        const nextIndex = playerSimonIndex + 1;

                        if (nextIndex >= simonSequence.length) {
                            setSessionCompleted(true);
                            animateNotesExit();
                            playUISound('success');
                            tapSuccess();
                            triggerConfetti(equippedConfetti === 'deluxe_gold' ? ['#FFD700', '#FFA500', '#B8860B', '#FAFAD2'] : undefined);
                            playAllCompletedSound();
                            if (difficulty === 'Calentamiento') {
                                setIsInitialWarmupCompleted(true);
                                setDialogMessage("¡Excelente trabajo! Has completado el calentamiento. ¿Quieres practicar un poco más o empezar un desafío?");
                                setTimeout(() => {
                                    setSelectedDifficulty(null);
                                    setShowDifficultyDialog(true);
                                    checkDailyGoalPopup();
                                }, 1500);
                            } else {
                                // Stars: 3⭐ = no repeats, 2⭐ = 1 repeat, 1⭐ = 2+ repeats
                                const stars = repeatCount === 0 ? 3 : (repeatCount <= 1 ? 2 : 1);
                                markLevelAsComplete(difficulty as ChallengeDifficulty, currentLevel, stars);
                                setTimeout(() => setShowLevelCompleteDialog(true), 1500);
                            }
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
        }
        animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrameId);
  }, [note.name, note.octave, smoothedCentsOff, isDetecting, activeNote, lastCompletedNoteFullName, sessionCompleted, completedNotes, challengeNotes.length, challengeDuration, difficulty, playCompletionSound, playAllCompletedSound, markLevelAsComplete, currentLevel, tolerance, gameMode, simonPhase, playerSimonIndex, simonSequence, isPaused, challengeNotes, playNote]);

  const startLevel = useCallback((diff: ChallengeDifficulty, level: number) => {
    if (!isMounted || notePool.length === 0) return;
    if (isOutOfLives) {
      setShowNoLivesDialog(true);
      return;
    }

    stopAllRhythmAndAudio();
    let newGameMode: "standard" | "interval" | "simon-says" | "melody-challenge" | "rhythm-challenge" = "standard";

    if (diff === 'Fácil') {
        if (level > 6) { // Levels 7-12 are rhythm
            newGameMode = 'rhythm-challenge';
        } else if (level === 4 || level === 6) { // Levels 4 and 6 are melody
            newGameMode = 'melody-challenge';
        } else { // Levels 1, 2, 3, 5 are standard
            newGameMode = 'standard';
        }
    } else if (diff === "Medio") {
      if (level === 11 || level === 13 || level === 15 || level === 16) {
        newGameMode = 'rhythm-challenge';
      } else if (level === 6) {
        newGameMode = 'melody-challenge';
      } else if (level === 1) {
        newGameMode = 'interval';
      } else {
        newGameMode = Math.random() < 0.5 ? 'standard' : 'interval';
      }
    } else if (diff === "Difícil") {
        const modes: ('standard' | 'interval' | 'simon-says' | 'melody-challenge' | 'rhythm-challenge')[] = [
            'rhythm-challenge', 'simon-says', 'melody-challenge', 'interval', 'standard'
        ];
        newGameMode = modes[level % 5];
    } else if (diff === "Maestro") {
        // Maestro: levels 1-6 are intense tuning/melody, 7-10 are insane rhythm
        if (level > 6) {
            newGameMode = 'rhythm-challenge';
        } else if (level % 2 === 0) {
            newGameMode = 'melody-challenge';
        } else {
            newGameMode = Math.random() < 0.4 ? 'simon-says' : 'interval';
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
    setShowFailureMessage(false);
    setRhythmScore(0);
    setUserRhythmTaps([]);

    if (newGameMode === "rhythm-challenge") {
        const bpmMap: Record<number, number> = { 
            7: 80, 8: 90, 9: 100, 10: 110, 11: 120, 12: 130, // Fácil
            13: 140, 14: 150, 15: 160, 16: 170, // Medio
            17: 180, 18: 190, 19: 200, 20: 210, // Dificil
            21: 220, 22: 230, 23: 240, 24: 250, // Maestro
        };
        
        // Wrap pattern keys to ensure randomly mixed levels always get a valid rhythm
        let patternKey = rhythmPatterns[level] ? level : ((level % 14) + 7);
        if (diff === 'Maestro' && level >= 7 && level <= 10) {
            patternKey = level + 14; // Mapping 7-10 to 21-24
        }

        const bpm = bpmMap[patternKey] || 150;
        const pattern = rhythmPatterns[patternKey] || rhythmPatterns[7];
        setRhythmBpm(bpm);
        setRhythmPattern(pattern);
        if (isDetecting) stop();
        startRhythmSession(bpm, pattern);

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
        const simonLevels: Record<number, number> = {
            1: 2, 2: 2, 3: 2, 4: 2,
            5: 3, 6: 3, 7: 3, 8: 3,
            9: 4, 10: 4, 11: 4, 12: 4,
        };
        const sequenceLength = simonLevels[level] || 2;
        const initialChallenge = generateChallenge(Math.min(notePool.length, 8), notePool);
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
        if (newChallenge.length > 0) {
            setActiveNote(newChallenge[0]);
            playNote(newChallenge[0]);
        }
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
  }, [isMounted, notePool, stopAllRhythmAndAudio, gender, isDetecting, start, stop, playNote, startRhythmSession]);

  // GSAP Tornado Entry Animation for notes
  const animateNotesEntry = useCallback(() => {
    if (!noteContainerRef.current) return;
    const buttons = noteContainerRef.current.querySelectorAll('.note-btn');
    if (buttons.length === 0) return;
    
    gsap.killTweensOf(buttons);
    gsap.set(buttons, { scale: 0, opacity: 0, rotation: -540 });
    gsap.to(buttons, {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.6,
      ease: 'back.out(1.7)',
      stagger: { each: 0.06, from: 'random' },
    });
    // Animate center card
    const center = noteContainerRef.current.querySelector('.center-card');
    if (center) {
      gsap.fromTo(center, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', delay: 0.2 });
    }
  }, []);

  // Trigger entry animation when notes change
  useEffect(() => {
    if (gameMode !== 'rhythm-challenge' && (challengeNotes.length > 0 || simonSequence.length > 0)) {
      // Small delay to let DOM render
      requestAnimationFrame(() => {
        animateNotesEntry();
      });
    }
  }, [challengeNotes, simonSequence, gameMode, animateNotesEntry]);

  // GSAP exit animation for level completion
  const animateNotesExit = useCallback(() => {
    if (!noteContainerRef.current) return;
    const buttons = noteContainerRef.current.querySelectorAll('.note-btn');
    gsap.to(buttons, {
      scale: 0,
      opacity: 0,
      rotation: 360,
      y: -100,
      duration: 0.4,
      ease: 'power3.in',
      stagger: { each: 0.03, from: 'end' },
    });
  }, []);

  // UI Sound Synthesis
  const playUISound = useCallback((type: 'click' | 'success' | 'whoosh' | 'error') => {
    const ctx = getPlaybackAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'whoosh') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  }, [getPlaybackAudioContext]);

  // Achievement fanfare sound
  const playAchievementFanfare = useCallback(() => {
    const ctx = getPlaybackAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  }, [getPlaybackAudioContext]);

  // Check for new achievements when progress changes
  useEffect(() => {
    const stats = computeStats(progress);
    const currentlyUnlocked = achievements.filter(a => a.check(progress, stats));
    const currentIds = new Set(currentlyUnlocked.map(a => a.id));
    
    if (previouslyUnlockedRef.current.size === 0 && currentIds.size > 0) {
      previouslyUnlockedRef.current = currentIds;
      return;
    }

    const newlyUnlocked = currentlyUnlocked.filter(a => !previouslyUnlockedRef.current.has(a.id));
    
    if (newlyUnlocked.length > 0) {
      previouslyUnlockedRef.current = currentIds;
      setAchievementNotification(newlyUnlocked[0]);
      playAchievementFanfare();
      tapTriumph();
      setTimeout(() => setAchievementNotification(null), 3500);
    }
  }, [progress, playAchievementFanfare]);

  // Star reveal sound - ascending grandeur per star
  const playStarRevealSound = useCallback((starNumber: number) => {
    const ctx = getPlaybackAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    if (starNumber === 1) {
      // Simple bell tone - C5
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (starNumber === 2) {
      // Two-note chord - E5 + G5
      [659.25, 783.99].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
      });
    } else if (starNumber === 3) {
      // Full triumphant chord - C5 + E5 + G5 + C6
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.22, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.9);
        osc.start(now + i * 0.04); osc.stop(now + i * 0.04 + 0.9);
      });
    }
  }, [getPlaybackAudioContext]);

  // Track which stars have been revealed in sequence
  const [revealedStars, setRevealedStars] = useState(0);
  const starRevealTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start star reveal animation when dialog opens
  useEffect(() => {
    if (showLevelCompleteDialog && lastLevelStars > 0) {
      setRevealedStars(0);
      let current = 0;
      const revealNext = () => {
        current++;
        if (current <= lastLevelStars) {
          setRevealedStars(current);
          playStarRevealSound(current);
          if (current < lastLevelStars) {
            starRevealTimerRef.current = setTimeout(revealNext, 600);
          }
        }
      };
      starRevealTimerRef.current = setTimeout(revealNext, 400);
      return () => { if (starRevealTimerRef.current) clearTimeout(starRevealTimerRef.current); };
    }
  }, [showLevelCompleteDialog, lastLevelStars, playStarRevealSound]);

  const startWarmup = useCallback(() => {
    if (notePool.length === 0) return;
    stopAllRhythmAndAudio();
    setDifficulty("Calentamiento");
    setCurrentLevel(1);

    // Reset shared state
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
    setShowFailureMessage(false);
    setRhythmScore(0);
    setUserRhythmTaps([]);

    // Randomly pick a game mode
    const modes: ('standard' | 'interval' | 'simon-says' | 'melody-challenge' | 'rhythm-challenge')[] = [
      'standard', 'interval', 'simon-says', 'melody-challenge', 'rhythm-challenge'
    ];
    const chosenMode = modes[Math.floor(Math.random() * modes.length)];
    setGameMode(chosenMode);

    const poolByMidi = new Map<number, NoteInfo>(notePool.map(n => [n.midi, n]));

    if (chosenMode === 'rhythm-challenge') {
      const bpm = 80;
      const pattern = rhythmPatterns[7] || [{ time: 0, instrument: 'kick' as const }, { time: 1500, instrument: 'clap' as const }];
      setRhythmBpm(bpm);
      setRhythmPattern(pattern);
      setSimonPhase('idle');
      if (isDetecting) stop();
      startRhythmSession(bpm, pattern);
    } else if (chosenMode === 'simon-says' || chosenMode === 'melody-challenge') {
      let sequence: NoteInfo[] = [];

      if (chosenMode === 'melody-challenge') {
        const melodyKeys = Object.keys(melodies);
        const randomMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
        const melodySequence = melodies[randomMelodyKey];
        const baseOctave = (gender === 'femenino' ? 4 : 3);
        const baseMidi = 12 * (baseOctave + 1);
        const firstNoteMidi = melodySequence[0].midi % 12 + baseMidi;
        let bestStartNote: NoteInfo | undefined = poolByMidi.get(firstNoteMidi);
        if (!bestStartNote) {
          const potentialStarts = notePool.filter(n => n.name === noteStrings[melodySequence[0].midi % 12]);
          bestStartNote = potentialStarts.sort((a, b) => Math.abs(a.midi - firstNoteMidi) - Math.abs(b.midi - firstNoteMidi))[0];
        }
        if (bestStartNote) {
          const midiOffset = bestStartNote.midi - melodySequence[0].midi;
          sequence = melodySequence
            .map(n => poolByMidi.get(n.midi + midiOffset))
            .filter((n): n is NoteInfo => !!n);
        }
        if (sequence.length === 0) sequence = generateChallenge(4, notePool);
      } else {
        // Simon Says with a short 2-note sequence for warmup
        const initialChallenge = generateChallenge(Math.min(notePool.length, 6), notePool);
        const shuffled = [...initialChallenge].sort(() => 0.5 - Math.random());
        sequence = shuffled.slice(0, 2);
      }

      setSimonSequence(sequence);
      setChallengeNotes([...new Set(sequence.map(n => n.fullName))].map(fn => sequence.find(n => n.fullName === fn)!));
      setSimonPhase('playback');
      if (!isDetecting) start();
    } else {
      // standard or interval
      let newChallenge: NoteInfo[];
      if (chosenMode === 'interval') {
        // Pick a random simple chord for warmup
        const warmupLevel = Math.floor(Math.random() * 3) + 1; // levels 1-3
        newChallenge = generateIntervalChallenge(warmupLevel, notePool);
        if (newChallenge.length > 0) {
          setActiveNote(newChallenge[0]);
          playNote(newChallenge[0]);
        }
      } else {
        // Standard with 3-4 random notes
        newChallenge = generateChallenge(Math.min(4, notePool.length), notePool);
      }
      setChallengeNotes(newChallenge.sort((a, b) => a.frequency - b.frequency));
      setSimonSequence([]);
      setSimonPhase('idle');
      if (!isDetecting) start();
    }
  }, [isDetecting, start, stop, notePool, gender, stopAllRhythmAndAudio, playNote, startRhythmSession]);

  // Auto-start warmup with a random mode on mount
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (isMounted && !hasAutoStarted.current && notePool.length > 0) {
      hasAutoStarted.current = true;
      startWarmup();
    }
  }, [isMounted, startWarmup, notePool.length]);

  const handleSeeLevels = () => {
    setShowLevelCompleteDialog(false);
    setSelectedDifficulty(difficulty as ChallengeDifficulty);
    setShowDifficultyDialog(true);
    checkDailyGoalPopup();
  };

  const handleChooseNewDifficulty = () => {
    setShowLevelCompleteDialog(false);
    setSelectedDifficulty(null);
    setShowDifficultyDialog(true);
    checkDailyGoalPopup();
  };

  const handleNoteClick = (noteToActivate: NoteInfo) => {
    if (completedNotes.has(noteToActivate.fullName) || lastCompletedNoteFullName || !isDetecting || gameMode === 'simon-says' || gameMode === 'melody-challenge' || isPaused || gameMode === 'interval') return;
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
    stopAllRhythmAndAudio();
    onGoBack();
  }

  const handleExitLevel = () => {
    stop();
    stopAllRhythmAndAudio();
    setChallengeNotes([]);
    setSimonSequence([]);
    setSessionCompleted(false);
    setShowDifficultyDialog(true);
    setSelectedDifficulty(null);
  };

 const evaluateRhythm = useCallback((taps: { time: number; instrument: 'clap' | 'kick' }[]) => {
    if (!rhythmPattern || rhythmPattern.length === 0 || taps.length === 0) return 0;

    const timeTolerance = 200; // ms - how close the user's tap must be to the actual beat
    const beatDuration_ms = (60.0 / rhythmBpm) * 1000;
    
    // Find where the user started (first tap)
    const firstUserTapTime = taps[0].time;
    
    // Find the nearest metronome beat to their first tap
    const nearestBeatTime = Math.round(firstUserTapTime / beatDuration_ms) * beatDuration_ms;
    
    // Shift the pattern to start at this nearest beat
    const shiftedPattern = rhythmPattern.map(hit => ({
        ...hit,
        time: hit.time + nearestBeatTime
    }));

    let totalScore = 0;
    const userTaps = [...taps];
    
    // Evaluate against the shifted pattern
    shiftedPattern.forEach(patternHit => {
        let bestMatchIndex = -1;
        let smallestTimeDiff = Infinity;

        // Find the user's tap that is the closest match
        for (let i = 0; i < userTaps.length; i++) {
            const userTap = userTaps[i];
            if (userTap.instrument === patternHit.instrument) {
                const timeDiff = Math.abs(userTap.time - patternHit.time);
                if (timeDiff < smallestTimeDiff) {
                    smallestTimeDiff = timeDiff;
                    bestMatchIndex = i;
                }
            }
        }

        // If a close enough match is found, calculate its precision score
        if (bestMatchIndex !== -1 && smallestTimeDiff <= timeTolerance) {
            // Perfect score <= 50ms difference, scales down to 0 at timeTolerance
            const perfectTolerance = 50;
            let hitPrecision = 100;
            if (smallestTimeDiff > perfectTolerance) {
                hitPrecision = Math.max(0, 100 * (1 - (smallestTimeDiff - perfectTolerance) / (timeTolerance - perfectTolerance)));
            }
            totalScore += hitPrecision;
            userTaps.splice(bestMatchIndex, 1); // Remove the matched tap
        }
    });

    const score = Math.round(totalScore / rhythmPattern.length);
    return score;
}, [rhythmPattern, rhythmBpm]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (rhythmPhase !== 'playing' || showLevelCompleteDialog || showFailureMessage) return;

          if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
              handleRhythmTap('kick');
              if (kickBtnRef.current) {
                  gsap.fromTo(kickBtnRef.current, { y: 16, filter: 'brightness(0.9)' }, { y: 0, filter: 'brightness(1)', duration: 0.15 });
              }
          } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
              handleRhythmTap('clap');
              if (clapBtnRef.current) {
                  gsap.fromTo(clapBtnRef.current, { y: 16, filter: 'brightness(0.9)' }, { y: 0, filter: 'brightness(1)', duration: 0.15 });
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }); // Run without strict dependency injection to always execute with freshest rhythmPhase and handleRhythmTap reference

  const playFeedbackSound = useCallback((type: 'perfect' | 'good' | 'miss') => {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain).connect(audioContext.destination);
      if (type === 'perfect') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, audioContext.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.08);
          gain.gain.setValueAtTime(0.15, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.15);
      } else if (type === 'good') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, audioContext.currentTime);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.12);
      } else {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, audioContext.currentTime);
          gain.gain.setValueAtTime(0.08, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
      }
  }, []);

  const addFloatingText = useCallback((text: string, color: string, side: 'left' | 'right') => {
      const id = floatingIdRef.current++;
      setFloatingTexts(prev => [...prev, { id, text, color, x: side }]);
      setTimeout(() => {
          setFloatingTexts(prev => prev.filter(t => t.id !== id));
      }, 900);
  }, []);

  const handleRhythmTap = (instrument: 'clap' | 'kick') => {
      const audioContext = getPlaybackAudioContext();
      if (rhythmPhase !== 'playing' || !audioContext) return;

      const now = Date.now();
      if (now - lastTapTimeRef.current[instrument] < 60) return;
      lastTapTimeRef.current[instrument] = now;

      const tapTime_ms = audioContext.currentTime * 1000;
      const relativeTapTime_ms = tapTime_ms - rhythmStartTimeRef.current;
      const side: 'left' | 'right' = instrument === 'kick' ? 'left' : 'right';

      // Find nearest matching pattern hit for real-time feedback
      const beatDuration_ms = (60.0 / rhythmBpm) * 1000;
      const firstTapTime = userRhythmTaps.length === 0 ? relativeTapTime_ms : userRhythmTaps[0].time;
      const nearestBeat = Math.round(firstTapTime / beatDuration_ms) * beatDuration_ms;

      let bestDiff = Infinity;
      rhythmPattern.forEach(hit => {
          if (hit.instrument === instrument) {
              const shiftedTime = hit.time + nearestBeat;
              const diff = Math.abs(relativeTapTime_ms - shiftedTime);
              if (diff < bestDiff) bestDiff = diff;
          }
      });

      if (bestDiff <= 50) {
          comboRef.current++;
          setCombo(comboRef.current);
          playFeedbackSound('perfect');
          addFloatingText(comboRef.current >= 3 ? `¡Perfecto! x${comboRef.current}🔥` : '¡Perfecto!', '#22c55e', side);
      } else if (bestDiff <= 200) {
          comboRef.current++;
          setCombo(comboRef.current);
          playFeedbackSound('good');
          addFloatingText(comboRef.current >= 3 ? `¡Bien! x${comboRef.current}` : '¡Bien!', '#eab308', side);
      } else {
          comboRef.current = 0;
          setCombo(0);
          playFeedbackSound('miss');
          addFloatingText('¡Mal!', '#ef4444', side);
      }
      
      const tapNode = playRhythmSound(instrument, audioContext.currentTime);
      if (tapNode) {
          activeAudioNodesRef.current.push(tapNode);
      }
      
      const newTaps = [...userRhythmTaps, { time: relativeTapTime_ms, instrument }];
      setUserRhythmTaps(newTaps);
      
      if (rhythmPattern && rhythmPattern.length > 0 && newTaps.length >= rhythmPattern.length) {
          setRhythmPhase('results');
          const finalScore = evaluateRhythm(newTaps);
          setRhythmScore(finalScore);

          setTimeout(() => {
              stopAllRhythmAndAudio();
          }, 300);

          if (finalScore >= 80) {
              setSessionCompleted(true);
              if (finalScore >= 95) {
                  triggerConfetti(equippedConfetti === 'deluxe_gold' ? ['#FFD700', '#FFA500', '#B8860B', '#FAFAD2'] : undefined);
              }
              setTimeout(() => playAllCompletedSound(), 350);
              if (difficulty === 'Calentamiento') {
                  setIsInitialWarmupCompleted(true);
                  setDialogMessage("¡Excelente trabajo! Has completado el calentamiento. ¿Quieres practicar un poco más o empezar un desafío?");
                  setTimeout(() => {
                      setSelectedDifficulty(null);
                      setShowDifficultyDialog(true);
                      checkDailyGoalPopup();
                  }, 1500);
              } else {
                  // Stars: 3⭐ = 95%+, 2⭐ = 90%+, 1⭐ = 80%+
                  const rhythmStars = finalScore >= 95 ? 3 : (finalScore >= 90 ? 2 : 1);
                  markLevelAsComplete(difficulty as ChallengeDifficulty, currentLevel, rhythmStars);
                  setTimeout(() => setShowLevelCompleteDialog(true), 1500);
              }
          } else {
              setShowFailureMessage(true);
          }
      }
  };
  
    const renderRhythmGame = () => {
        const phaseTextMap = {
            'idle': 'Cargando nivel...',
            'guide': '¡Escucha la guía!',
            'playing': '¡Tu turno! Sigue el ritmo.',
            'results': 'Resultados',
        };

        return (
            <div className="flex flex-col items-center justify-start gap-4 sm:gap-8 w-full h-full text-foreground pt-6 sm:pt-16">
                <div className="text-center">
                    <p className="text-base sm:text-xl font-bold">
                        {phaseTextMap[rhythmPhase]}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        BPM: {rhythmBpm}
                    </p>
                </div>
                
                <div ref={containerRef} className="w-full relative flex-grow flex items-center justify-around px-4 sm:px-8">
                    {rhythmPhase === 'guide' && (
                        <div ref={duckRef} className="absolute z-10 w-20 h-20 sm:w-32 sm:h-32 pointer-events-none opacity-0" style={{ left: '50%', top: '0', marginLeft: '-40px', marginTop: '-40px' }}>
                            <Image src="/duck.png" alt="Pato" fill className="object-contain drop-shadow-xl" />
                        </div>
                    )}

                    {/* Floating feedback texts */}
                    {floatingTexts.map(ft => (
                        <div
                            key={ft.id}
                            className="absolute z-20 pointer-events-none font-black text-lg sm:text-2xl animate-float-up"
                            style={{
                                color: ft.color,
                                [ft.x === 'left' ? 'left' : 'right']: '15%',
                                top: '30%',
                                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            }}
                        >
                            {ft.text}
                        </div>
                    ))}

                    {/* Combo counter */}
                    {rhythmPhase === 'playing' && combo >= 3 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 text-yellow-400 font-black text-xl sm:text-3xl animate-pulse drop-shadow-lg">
                            🔥 Combo x{combo}
                        </div>
                    )}

                    <Button
                        ref={kickBtnRef}
                        onPointerDown={(e) => handleRhythmTap('kick')}
                        disabled={rhythmPhase !== 'playing'}
                        className={cn(
                            "relative w-[7.5rem] h-[7.5rem] sm:w-36 sm:h-36 rounded-full text-white font-black text-base sm:text-lg transition-all duration-100 flex flex-col items-center justify-center gap-1 outline-none touch-none select-none",
                            "bg-gradient-to-b from-blue-400 to-blue-600",
                            "border-[6px] border-blue-200",
                            "shadow-[0_16px_0_0_#1e3a8a,0_24px_20px_0_rgba(0,0,0,0.4)]",
                            "active:shadow-[0_0_0_0_#1e3a8a,0_0_0_0_rgba(0,0,0,0)] active:translate-y-[16px] active:scale-95 active:brightness-90",
                            rhythmPhase !== 'playing' && "opacity-80 cursor-not-allowed pointer-events-none"
                        )}
                    >
                        <Footprints size={32}/>
                        Kick
                    </Button>
                    <Button
                        ref={clapBtnRef}
                        onPointerDown={(e) => handleRhythmTap('clap')}
                        disabled={rhythmPhase !== 'playing'}
                        className={cn(
                            "relative w-[7.5rem] h-[7.5rem] sm:w-36 sm:h-36 rounded-full text-white font-black text-base sm:text-lg transition-all duration-100 flex flex-col items-center justify-center gap-1 outline-none touch-none select-none",
                            "bg-gradient-to-b from-red-400 to-red-600",
                            "border-[6px] border-red-200",
                            "shadow-[0_16px_0_0_#7f1d1d,0_24px_20px_0_rgba(0,0,0,0.4)]",
                            "active:shadow-[0_0_0_0_#7f1d1d,0_0_0_0_rgba(0,0,0,0)] active:translate-y-[16px] active:scale-95 active:brightness-90",
                            rhythmPhase !== 'playing' && "opacity-80 cursor-not-allowed pointer-events-none"
                        )}
                    >
                        <Hand size={32}/>
                        Clap
                    </Button>
                </div>

                <div className="h-10 mt-2 sm:mt-4">
                  {(rhythmPhase === 'playing' || rhythmPhase === 'results' || rhythmPhase === 'guide') && (
                    <Button variant="outline" onClick={() => startRhythmSession(rhythmBpm, rhythmPattern)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Repetir Guía
                    </Button>
                  )}
                </div>
            </div>
        );
    };

  const renderCentralContent = () => {
      
    if (sessionCompleted && !showLevelCompleteDialog && !showFailureMessage) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-center animate-in fade-in zoom-in-95">
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-accent" />
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">¡Felicidades!</p>
                <p className="text-muted-foreground text-sm sm:text-base">¡Nivel completado!</p>
            </div>
        );
    }
    
    if (showFailureMessage) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-foreground gap-4">
                <div className="text-xl sm:text-2xl font-bold">Precisión: {rhythmScore.toFixed(0)}%</div>
                <p className="text-muted-foreground text-sm sm:text-base">¡Casi! Necesitas 80% para ganar.</p>
                <Button onClick={() => {
                  setShowFailureMessage(false);
                  if (difficulty === 'Calentamiento') {
                    startWarmup();
                  } else {
                    startLevel(difficulty as ChallengeDifficulty, currentLevel);
                  }
                }} className="mt-4">Reintentar</Button>
            </div>
        );
    }

    if (gameMode === 'simon-says' || gameMode === 'melody-challenge') {
        if (simonPhase === 'playback') {
            return (
                <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-center animate-in fade-in">
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
            
            const displayCents = (targetNote && note.frequency) 
                ? smoothedCentsOff + 1200 * Math.log2(note.frequency / targetNote.frequency)
                : smoothedCentsOff;

            return (
                <div className="flex flex-col items-center justify-center gap-1 w-full text-center">
                    <p className="text-xl sm:text-2xl text-primary font-bold">Nota {playerSimonIndex + 1} de {simonSequence.length}</p>
                    <p className="text-sm sm:text-md text-muted-foreground -mt-1">Canta la nota</p>
                    <div className="w-4/5 pt-2">
                        <Progress value={challengeProgress} className="h-2 sm:h-3" />
                    </div>
                    <PitchGauge centsOff={displayCents} isActive={isDetecting && !!note.name} size={120} />
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
        
        const displayCents = (activeNote && note.frequency) 
            ? smoothedCentsOff + 1200 * Math.log2(note.frequency / activeNote.frequency)
            : smoothedCentsOff;

        return (
            <div className="flex flex-col items-center justify-center gap-1 w-full text-center">
                <p className={cn("text-3xl sm:text-5xl font-bold text-primary")}>{activeNote.fullName}</p>
                <p className="text-xs sm:text-md text-muted-foreground -mt-1">Canta la nota</p>
                <div className="w-4/5 pt-2">
                    <Progress value={challengeProgress} className="h-2 sm:h-3" />
                </div>
                <PitchGauge centsOff={displayCents} isActive={isDetecting && !!note.name} size={120} />
            </div>
        );
    }
    if (isPaused) {
         return (
            <div className="text-center p-2 sm:p-4">
                <MicOff className="w-12 h-12 sm:w-24 sm:h-24 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-base">En pausa</p>
            </div>
        );
    }
    
    return (
      <div className="text-center p-2 sm:p-4">
          <p className="text-base sm:text-2xl font-bold text-foreground">
              {(gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase === 'singing' ? "¡Tu Turno!" : (gameMode === 'interval' ? 'Canta el Arpegio' : (!isDetecting ? 'Micrófono apagado' : 'Selecciona una nota'))}
          </p>
          <p className="text-xs sm:text-base text-muted-foreground mt-0.5 sm:mt-2">
              {(gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase === 'singing' ? `Canta la secuencia de ${simonSequence.length} notas` : (gameMode === 'interval' ? 'Sigue la secuencia de notas' : (!isDetecting ? 'Toca "Empezar" abajo 👇' : 'Haz clic en un círculo para empezar'))}
          </p>
      </div>
    );
  };

  const notesToDisplay = (gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase !== 'idle' && simonSequence.length > 0 ? simonSequence : challengeNotes;
  
  // Adaptive sizing: scale everything proportionally when radius is clamped on short screens
  const isCompact = typeof window !== 'undefined' && radius < 130;
  const buttonSize = isCompact
    ? `w-[50px] h-[50px] sm:w-[72px] sm:h-[72px] text-xs sm:text-base`
    : `w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] text-sm sm:text-base`;
  const noteNameSize = isCompact ? `text-sm sm:text-2xl` : `text-base sm:text-2xl`;
  const octaveSize = isCompact ? `text-[8px] sm:text-sm` : `text-[10px] sm:text-sm`;
  
  // Center card scales with radius: at full radius (142) → 200px, scales down proportionally
  const centerCardMobile = isCompact ? Math.max(130, Math.round(radius * 200 / 142)) : 200;
  const centerCardClass = `w-[${centerCardMobile}px] h-[${centerCardMobile}px] sm:w-[220px] sm:h-[220px]`;
  
  if (!isMounted) {
    return <TunerSkeleton />;
  }

  const getDifficultyTitle = () => {
    if (freePlayMode) return 'Práctica Libre';
    return difficulty;
  };
  
  if (showProgressDashboard) {
    return (
      <div className="w-full max-w-md mx-auto h-full bg-background">
        <ProgressDashboard vocalRangeKey={vocalRangeKey} onClose={() => setShowProgressDashboard(false)} />
      </div>
    );
  }

  const freePlayIsInTune = note.name && Math.abs(smoothedCentsOff) < 15;

  if (showEasyWinVideo) {
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md aspect-square">
                <video
                    ref={videoRef}
                    src="/Duck Win.mp4"
                    autoPlay
                    muted={false}
                    loop
                    playsInline
                    onTimeUpdate={handleVideoTimeUpdate}
                    className="w-full h-full object-contain"
                />
            </div>
            <Button 
                size="lg"
                onClick={() => {
                    setShowEasyWinVideo(false);
                    setShowLevelCompleteDialog(false);
                    startLevel('Medio', 1);
                }}
                className="absolute bottom-16 z-20 h-20 px-8 text-xl sm:text-2xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-4 border-white shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce"
            >
                Siguiente Reto <ArrowRight className="ml-2 w-8 h-8 sm:w-10 sm:h-10" />
            </Button>
        </div>
    )
  }

  if (showMediumWinVideo) {
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md aspect-square">
                <video
                    ref={mediumVideoRef}
                    src="/Duck dancing.mp4"
                    autoPlay
                    muted={false}
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                />
            </div>
            <Button 
                size="lg"
                onClick={() => {
                    setShowMediumWinVideo(false);
                    setShowLevelCompleteDialog(false);
                    startLevel('Difícil', 1);
                }}
                className="absolute bottom-16 z-20 h-20 px-8 text-xl sm:text-2xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-4 border-white shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce"
            >
                Siguiente Reto <ArrowRight className="ml-2 w-8 h-8 sm:w-10 sm:h-10" />
            </Button>
        </div>
    )
  }

  if (showHardWinVideo) {
    return (
        <div className={cn("fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4", hardVideoPhase === 'dust' && "animate-thanos-snap pointer-events-none")}>
            {(hardVideoPhase === 'white' || hardVideoPhase === 'dust') && (
                <div className="fixed inset-0 bg-white z-[60] animate-in fade-in duration-700 pointer-events-auto" />
            )}
            <div className="w-full max-w-md aspect-square">
                <video
                    ref={hardVideoRef}
                    src="/Duck Thanos.mp4"
                    autoPlay
                    muted={false}
                    playsInline
                    className="w-full h-full object-contain"
                    onEnded={() => {
                        if (hardVideoPhase === 'playing') {
                            setHardVideoPhase('white');
                            setTimeout(() => {
                                setHardVideoPhase('dust');
                                setTimeout(() => {
                                    setHardVideoPhase('playing');
                                    setShowHardWinVideo(false);
                                    setShowLevelCompleteDialog(false);
                                    setFreePlayMode(false);
                                    setSelectedDifficulty(null);
                                    setShowDifficultyDialog(true);
                                }, 3500);
                            }, 5000);
                        }
                    }}
                />
            </div>
            {hardVideoPhase === 'playing' && (
                <Button 
                    size="lg"
                    onClick={() => {
                        setHardVideoPhase('white');
                        setTimeout(() => {
                            setHardVideoPhase('dust');
                            setTimeout(() => {
                                setHardVideoPhase('playing');
                                setShowHardWinVideo(false);
                                setShowLevelCompleteDialog(false);
                                setFreePlayMode(false);
                                setSelectedDifficulty(null);
                                setShowDifficultyDialog(true);
                            }, 3500);
                        }, 5000);
                    }}
                    className="absolute bottom-16 z-20 h-20 px-8 text-xl sm:text-2xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-4 border-white shadow-[0_0_30px_rgba(251,191,36,1)] animate-bounce"
                >
                    ¡Eres una Leyenda! 👑
                </Button>
            )}
        </div>
    )
  }
  let auroraClass = 'aurora-idle';
  if (isDetecting && note.name) {
    const absCents = Math.abs(smoothedCentsOff);
    if (absCents < 15) auroraClass = 'aurora-in-tune';
    else if (absCents < 35) auroraClass = 'aurora-close';
    else if (smoothedCentsOff < 0) auroraClass = 'aurora-flat';
    else auroraClass = 'aurora-sharp';
  }

  const isPlayingChallenge = (challengeNotes.length > 0 || simonSequence.length > 0 || gameMode === 'rhythm-challenge') && !sessionCompleted;

  return (
    <div className={cn("flex flex-col w-full min-h-[100dvh] overflow-y-auto pb-24 aurora-bg transition-colors duration-700 relative select-none touch-none theme-transition", auroraClass)}>
      <StreakRewards isOpen={showStreakRewards} onClose={() => setShowStreakRewards(false)} currentStreak={streak} onOpenInventory={() => setShowInventoryDialog(true)} />
      <UserProfileDialog isOpen={showProfileDialog} onClose={() => setShowProfileDialog(false)} />
      <InventoryDialog isOpen={showInventoryDialog} onClose={() => setShowInventoryDialog(false)} />
      <DailyGoalDialog isOpen={showDailyGoalsDialog} onClose={() => setShowDailyGoalsDialog(false)} />

      {/* Header */}
      <header className="flex-shrink-0 mb-4 sm:mb-8 w-full pt-1 sm:pt-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2">
            {/* Left Slot: Arrow if in level, else Menu */}
            <div className="flex justify-start w-11 h-11 items-center">
                {isPlayingChallenge ? (
                    <Button onClick={handleExitLevel} variant="ghost" size="icon" className="shrink-0 rounded-full w-10 h-10 hover:bg-background/40">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                ) : (
                    <UserMenu align="start" isProfileSet={isProfileSet} avatar={avatar} MenuIcon={Menu} lives={lives} maxLives={maxLives} dailyQuests={dailyQuests} setShowProfileDialog={setShowProfileDialog} setShowNoLivesDialog={setShowNoLivesDialog} setShowInventoryDialog={setShowInventoryDialog} handleBackButtonClick={handleBackButtonClick} stopAllRhythmAndAudio={stopAllRhythmAndAudio} isDetecting={isDetecting} stop={stop} setIsPaused={setIsPaused} setShowProgressDashboard={setShowProgressDashboard} theme={theme} setTheme={setTheme} onOpenVocalAssessor={onOpenVocalAssessor} displayName={displayName} isOutOfLives={isOutOfLives} />
                )}
            </div>

            {/* Center: Title & Progress Bar */}
            <div className="flex flex-col items-center justify-center min-w-[140px] px-2">
                <h1 className="font-bold text-base sm:text-xl text-primary text-center tracking-tight truncate max-w-[150px] sm:max-w-none">
                    {getDifficultyTitle()}
                </h1>
                {gameMode !== 'rhythm-challenge' && (challengeNotes.length > 0 || simonSequence.length > 0) && (
                    <div className="flex items-center justify-center gap-2 w-full max-w-[140px] mt-1 sm:mt-1.5 opacity-90">
                        <Progress 
                            value={(completedNotes.size / (gameMode === 'simon-says' || gameMode === 'melody-challenge' ? simonSequence.length : challengeNotes.length)) * 100} 
                            className="h-1.5 w-full bg-secondary/50" 
                        />
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-mono font-bold shrink-0">
                            {completedNotes.size}/{gameMode === 'simon-says' || gameMode === 'melody-challenge' ? simonSequence.length : challengeNotes.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1 shrink-0">
              <div 
                onClick={() => setShowStreakRewards(true)}
                className="flex items-center gap-1.5 bg-background/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-orange-500/20 shadow-sm text-orange-500 h-9 cursor-pointer hover:bg-background/80 transition-colors"
                role="button"
                tabIndex={0}
              >
                <Flame className={cn("h-4 w-4", streak > 2 && "animate-pulse", streak >= 5 && "text-red-500")} />
                <span className="text-sm font-bold dark:text-orange-400 leading-none">{streak}</span>
              </div>
              
              {/* Menu appears on right only when in a level */}
              {isPlayingChallenge && (
                <UserMenu align="end" isProfileSet={isProfileSet} avatar={avatar} MenuIcon={Menu} lives={lives} maxLives={maxLives} dailyQuests={dailyQuests} setShowProfileDialog={setShowProfileDialog} setShowNoLivesDialog={setShowNoLivesDialog} setShowInventoryDialog={setShowInventoryDialog} handleBackButtonClick={handleBackButtonClick} stopAllRhythmAndAudio={stopAllRhythmAndAudio} isDetecting={isDetecting} stop={stop} setIsPaused={setIsPaused} setShowProgressDashboard={setShowProgressDashboard} theme={theme} setTheme={setTheme} onOpenVocalAssessor={onOpenVocalAssessor} displayName={displayName} isOutOfLives={isOutOfLives} />
              )}
            </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center overflow-y-auto pb-12 min-h-0">
        {freePlayMode ? (
          <div className="flex flex-col w-full h-full items-center justify-center gap-4 p-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Práctica Libre</h2>
            <p className="text-sm text-muted-foreground text-center">Canta cualquier nota y observa tu afinación en tiempo real</p>
            
            <PitchGauge centsOff={smoothedCentsOff} isActive={isDetecting && !!note.name} size={200} />
            
            <div className="text-center">
              <p className={cn("text-5xl sm:text-7xl font-black transition-colors", freePlayIsInTune ? "text-accent" : "text-foreground")}>
                {isDetecting ? (note.name ? `${note.name}${note.octave}` : '--') : '🎤'}
              </p>
              {isDetecting && note.name && (
                <p className="text-sm text-muted-foreground mt-1">
                  {note.frequency ? `${note.frequency.toFixed(1)} Hz` : ''}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 mt-4">
              <Button onClick={() => { if (isDetecting) stop(); else start(); }} size="lg" className="rounded-full w-44 h-12 text-base">
                {isDetecting ? <><MicOff className="mr-2" /> Pausar</> : <><Mic className="mr-2" /> Empezar</>}
              </Button>
              <Button variant="link" onClick={() => {
                setFreePlayMode(false);
                if (isDetecting) { stop(); }
                setSelectedDifficulty(null);
                setShowDifficultyDialog(true);
              }}>Elegir Modo</Button>
            </div>
          </div>
        ) : gameMode === 'rhythm-challenge' ? (
            <div className="w-full h-full flex items-center justify-center">
                {(rhythmPhase === 'results' && !sessionCompleted)
                    ? renderCentralContent() 
                    : renderRhythmGame()
                }
            </div>
        ) : (
            <div ref={noteContainerRef} id="tuner-container" className="relative w-full flex items-center justify-center flex-grow min-h-0 overflow-visible">
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
                            onClick={() => { playUISound('click'); tapLight(); handleNoteClick(n); }}
                            disabled={!isDetecting || !!lastCompletedNoteFullName || simonPhase === 'playback' || isPaused}
                            style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                            className={cn(
                                "absolute z-20 rounded-full flex flex-col justify-center items-center font-bold transition-colors duration-300 shadow-lg note-btn",
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
            
                <Card className={cn(
                    "absolute z-10 rounded-full shadow-2xl border-2 border-primary/20 flex items-center justify-center bg-transparent center-card",
                    "sm:w-[220px] sm:h-[220px]"
                )} style={{
                    background: 'radial-gradient(circle, hsl(var(--card)) 0%, hsl(var(--background)) 100%)',
                    width: typeof window !== 'undefined' && window.innerWidth < 640 ? `${centerCardMobile}px` : undefined,
                    height: typeof window !== 'undefined' && window.innerWidth < 640 ? `${centerCardMobile}px` : undefined,
                }}>
                    <CardContent className="p-1 sm:p-2 flex items-center justify-center w-full">
                        {renderCentralContent()}
                    </CardContent>
                </Card>
            </div>
        )}
      </main>

      {/* Footer */}
      {!freePlayMode && (
      <footer className="flex-shrink-0 mt-auto mb-1 sm:mb-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          {gameMode !== 'rhythm-challenge' && (
              <>
                  <Button onClick={handleToggleListening} size="lg" className="rounded-full w-44 sm:w-56 h-12 sm:h-16 text-base sm:text-xl shadow-lg">
                      {isDetecting ? <MicOff className="mr-3" /> : <Mic className="mr-3" />}
                      {isDetecting ? "Pausar" : "Empezar"}
                  </Button>
                  <Button variant="link" onClick={() => {
                      if (isDetecting) {
                          stop();
                          setIsPaused(true);
                      }
                      stopAllRhythmAndAudio();
                      setSelectedDifficulty(null);
                      setShowDifficultyDialog(true);
                    }}>Elegir Nivel</Button>

                  <div className="h-8 sm:h-10 flex items-center justify-center">
                      {(gameMode === 'simon-says' || gameMode === 'melody-challenge') && simonPhase === 'singing' && repeatCount < 3 && !sessionCompleted && (
                          <Button variant="destructive" size="icon" onClick={handleRepeatSequence} className="w-10 h-10 rounded-full">
                          <RefreshCw className="h-5 w-5"/>
                          <span className="sr-only">Repetir</span>
                          </Button>
                      )}
                  </div>
              </>
          )}
        </div>
      </footer>
      )}

      <AlertDialog open={showDifficultyDialog} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setSelectedDifficulty(null);
        }
        setShowDifficultyDialog(isOpen);
      }}>
          <AlertDialogContent className="max-w-xs sm:max-w-md">
              <AlertDialogHeader>
                  {selectedDifficulty && (
                      <Button variant="ghost" size="sm" className="absolute top-3 left-3 px-2 h-auto" onClick={() => setSelectedDifficulty(null)}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Atrás
                      </Button>
                  )}
                  <AlertDialogTitle className="text-xl sm:text-2xl text-center pt-8 sm:pt-0">
                      {selectedDifficulty ? `Modo ${selectedDifficulty}` : 'Elige un modo'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm sm:text-base text-center">
                      {selectedDifficulty ? 'Selecciona un nivel para comenzar.' : dialogMessage}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="pt-2 sm:pt-4">
                  {selectedDifficulty ? (
                      <div className="grid grid-cols-4 gap-2 sm:gap-4">
                          {Array.from({ length: difficultySettings[selectedDifficulty].levelCount }, (_, i) => i + 1).map(level => {
                              const starCount = progress[selectedDifficulty]?.[level] || 0;
                              
                              const isLocked = false; // All levels unlocked for review
                              
                              let modeIndicator: React.ReactNode = null;
                              if (selectedDifficulty === 'Fácil') {
                                if (level > 6) {
                                    modeIndicator = <Drum className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
                                } else if (level === 4 || level === 6) {
                                    modeIndicator = <Music className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
                                }
                              } else if (selectedDifficulty === 'Medio') {
                                  if (level === 11 || level === 13 || level === 15 || level === 16) {
                                      modeIndicator = <Drum className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
                                  } else {
                                      modeIndicator = <Music className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
                                  }
                              } else if (selectedDifficulty === 'Difícil') {
                                  const dMode = ['rhythm-challenge', 'simon-says', 'melody-challenge', 'interval', 'standard'][level % 5];
                                  if (dMode === 'rhythm-challenge') modeIndicator = <Drum className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
                                  else if (dMode === 'simon-says') modeIndicator = <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />;
                                  else if (dMode === 'melody-challenge') modeIndicator = <Music className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />;
                                  else modeIndicator = <Music className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
                              }

                              return (
                                  <Button
                                      key={level}
                                      variant={starCount > 0 ? "default" : "secondary"}
                                      disabled={isLocked}
                                      onClick={() => startLevel(selectedDifficulty, level)}
                                      className="h-16 sm:h-20 p-0 text-lg sm:text-xl font-bold flex flex-col items-center justify-center gap-0.5 aspect-square relative overflow-hidden shrink-0"
                                  >
                                      {isLocked ? (
                                          <Lock className="w-6 h-6 sm:w-8 sm:h-8"/>
                                      ) : starCount > 0 ? (
                                          <>
                                            <span className="text-xs sm:text-sm opacity-80">{level}</span>
                                            <div className="flex gap-0.5 px-1">
                                              {[1, 2, 3].map(s => (
                                                <Star key={s} className={cn("w-2.5 h-2.5 sm:w-3.5 sm:h-3.5", s <= starCount ? "text-accent fill-accent" : "text-muted-foreground/30")} />
                                              ))}
                                            </div>
                                          </>
                                      ) : (
                                          <span>{level}</span>
                                      )}
                                      {modeIndicator && !isLocked && (
                                          <span className="absolute top-1 right-1 text-xs font-normal opacity-70">
                                            {modeIndicator}
                                          </span>
                                      )}
                                  </Button>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="flex flex-col gap-3 sm:gap-4 pt-4">
                          <Button onClick={startWarmup} variant="secondary" size="lg" className="h-16 sm:h-20 text-lg">Calentamiento</Button>
                          <Button onClick={() => setSelectedDifficulty("Fácil")} variant="accent" size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black h-16 sm:h-20 text-lg">Fácil</Button>
                          <Button onClick={() => setSelectedDifficulty("Medio")} size="lg" className="h-16 sm:h-20 text-lg">Medio</Button>
                          <Button onClick={() => setSelectedDifficulty("Difícil")} variant="destructive" size="lg" className="h-16 sm:h-20 text-lg">Difícil</Button>
                          <Button 
                            onClick={() => setSelectedDifficulty("Maestro")} 
                            disabled={streak < 60} 
                            className="h-16 sm:h-20 text-lg relative overflow-hidden group border-2 border-primary/50 text-white hover:border-primary transition-all duration-300 bg-slate-900 hover:bg-slate-800"
                          >
                            <span className={cn(
                                "flex items-center justify-center gap-2 transition-all duration-300",
                                streak < 60 ? "opacity-30" : "font-black drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                            )}>
                              {streak < 60 ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Crown className="w-6 h-6 text-yellow-400" />} 
                              Maestro
                            </span>
                            {streak < 60 && (
                                <span className="absolute bottom-1 right-2 w-full text-center text-[10px] sm:text-xs text-muted-foreground">
                                    Requiere racha de 60 días
                                </span>
                            )}
                          </Button>
                          <Button onClick={() => {
                            setFreePlayMode(true);
                            setShowDifficultyDialog(false);
                            setDifficulty('Calentamiento');
                            setGameMode('standard');
                            setChallengeNotes([]);
                            setActiveNote(null);
                            setSessionCompleted(false);
                            if (!isDetecting) start();
                          }} variant="outline" size="lg" className="h-14 sm:h-16 text-base border-dashed border-2">
                            <Mic className="mr-2 w-5 h-5" /> Práctica Libre
                          </Button>
                      </div>
                  )}
              </div>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLevelCompleteDialog}>
          <AlertDialogContent className="max-w-xs sm:max-w-sm">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl sm:text-2xl text-center">
                    {difficulty !== 'Calentamiento' && currentLevel < difficultySettings[difficulty as ChallengeDifficulty].levelCount
                        ? `¡Nivel ${currentLevel} Completado!`
                        : `¡Modo ${difficulty} Completado!`
                    }
                  </AlertDialogTitle>
                  {/* Stars display - sequential reveal */}
                  {lastLevelStars > 0 && (
                    <div className="flex justify-center gap-3 py-4">
                      {[1, 2, 3].map(s => {
                        const isEarned = s <= lastLevelStars;
                        const isRevealed = s <= revealedStars;
                        return (
                          <div key={s} className="relative">
                            {/* Glow ring behind star */}
                            {isEarned && isRevealed && (
                              <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: '1.5s', animationIterationCount: '1' }} />
                            )}
                            <Star
                              className={cn(
                                "w-10 h-10 sm:w-12 sm:h-12 transition-all",
                                isEarned && isRevealed
                                  ? "text-accent fill-accent drop-shadow-[0_0_12px_hsl(var(--accent))] scale-100 opacity-100"
                                  : isEarned && !isRevealed
                                  ? "text-muted-foreground/10 scale-50 opacity-30"
                                  : "text-muted-foreground/15 scale-75 opacity-40"
                              )}
                              style={{
                                transitionDuration: '500ms',
                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {gameMode === 'rhythm-challenge' && rhythmScore >= 80 ? (
                      <>
                        <AlertDialogDescription className="text-sm sm:text-base text-center">¡Excelente trabajo!</AlertDialogDescription>
                        <div className="text-md sm:text-lg font-bold text-center text-foreground pt-1">
                            Precisión: {rhythmScore.toFixed(0)}%
                        </div>
                      </>
                  ) : (
                    <AlertDialogDescription className="text-sm sm:text-base text-center">
                      {lastLevelStars >= 3 ? '¡Rendimiento perfecto! 🌟' : lastLevelStars >= 2 ? '¡Muy bien! Intenta de nuevo para 3 estrellas.' : '¡Completado! Practica para mejorar tu puntaje.'}
                    </AlertDialogDescription>
                  )}
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                {difficulty !== 'Calentamiento' && currentLevel < difficultySettings[difficulty as ChallengeDifficulty].levelCount ? (
                    <Button onClick={() => {
                      setShowLevelCompleteDialog(false);
                      startLevel(difficulty as ChallengeDifficulty, currentLevel + 1);
                    }} size="lg">Siguiente Nivel</Button>
                ) : (
                    <>
                      {difficulty === 'Fácil' && (
                          <Button
                              size="lg"
                              onClick={() => {
                                  setShowLevelCompleteDialog(false);
                                  startLevel('Medio', 1);
                              }}
                              className="h-14 sm:h-16 px-6 text-lg sm:text-xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-2 border-white shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce"
                          >
                              Siguiente Reto <ArrowRight className="ml-2 w-6 h-6" />
                          </Button>
                      )}
                      {difficulty === 'Medio' && (
                          <Button
                              size="lg"
                              onClick={() => {
                                  setShowLevelCompleteDialog(false);
                                  startLevel('Difícil', 1);
                              }}
                              className="h-14 sm:h-16 px-6 text-lg sm:text-xl font-black rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-2 border-white shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce"
                          >
                              Siguiente Reto <ArrowRight className="ml-2 w-6 h-6" />
                          </Button>
                      )}
                      {difficulty === 'Difícil' && (
                          <Button
                              size="lg"
                              disabled={streak < 60}
                              onClick={() => {
                                  setShowLevelCompleteDialog(false);
                                  startLevel('Maestro', 1);
                              }}
                              className="h-14 sm:h-16 px-6 text-lg sm:text-xl font-black rounded-full bg-slate-900 border-2 border-primary text-white shadow-[0_0_15px_rgba(0,0,0,0.6)] animate-bounce hover:bg-slate-800"
                          >
                              {streak < 60 ? <Lock className="mr-2 w-5 h-5 opacity-50" /> : <Crown className="mr-2 w-6 h-6 text-yellow-500" />} Maestro <ArrowRight className="ml-2 w-6 h-6" />
                          </Button>
                      )}
                      {(difficulty === 'Maestro' || difficulty === 'Calentamiento') && (
                          <Button onClick={handleChooseNewDifficulty} size="lg">Elegir Otro Modo</Button>
                      )}
                    </>
                )}
                {lastLevelStars > 0 && lastLevelStars < 3 && difficulty !== 'Calentamiento' && (
                    <Button onClick={() => {
                        setShowLevelCompleteDialog(false);
                        startLevel(difficulty as ChallengeDifficulty, currentLevel);
                    }} size="lg" variant="outline" className="w-full sm:w-auto border-2 border-dashed">
                        <RefreshCw className="mr-2 w-5 h-5" /> Repetir
                    </Button>
                )}
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button onClick={() => setShowShareDialog(true)} variant="outline" className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10">
                    <Share2 className="w-4 h-4 mr-2" /> Compartir
                  </Button>
                  <Button onClick={handleSeeLevels} variant="secondary" className="flex-1 sm:flex-none">Ver Niveles</Button>
                </div>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {/* Achievement Unlock Notification */}
      {achievementNotification && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pointer-events-none pt-16 sm:pt-20">
          <div 
            className="pointer-events-auto bg-gradient-to-r from-accent/90 to-primary/90 text-white rounded-2xl shadow-2xl shadow-accent/30 px-6 py-4 max-w-xs flex items-center gap-4 animate-in slide-in-from-top-8 fade-in zoom-in-95 duration-500"
            onClick={() => setAchievementNotification(null)}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
              {achievementNotification.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold">¡Logro Desbloqueado!</p>
              <p className="font-black text-base sm:text-lg leading-tight">{achievementNotification.title}</p>
              <p className="text-xs opacity-80">{achievementNotification.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Combo Animation Overlay */}
      {showComboAnimation && comboCount >= 3 && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 animate-in zoom-in-50 fade-in duration-300">
           <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-yellow-300 via-orange-500 to-red-500 filter drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-bounce rotate-[-5deg]">
             ¡COMBO x{comboCount}! 🔥
           </div>
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => setShowShareDialog(false)} 
        cardData={{ 
          type: 'level_complete', 
          score: gameMode === 'rhythm-challenge' ? rhythmScore : 100, 
          levelName: getDifficultyTitle() 
        }} 
      />

      {/* Out of Lives Dialog */}
      <AlertDialog open={showNoLivesDialog} onOpenChange={setShowNoLivesDialog}>
        <AlertDialogContent className="max-w-xs sm:max-w-sm text-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl sm:text-3xl font-black">
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: maxLives }).map((_, i) => (
                  <Heart key={i} className="w-8 h-8 text-muted-foreground/20" />
                ))}
              </div>
              ¡Sin Vidas!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Tus vidas se están recargando. La siguiente vida llega en:
              <span className="block text-3xl font-black text-primary mt-4">{timeToNextLife}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2">
            <Button onClick={() => setShowNoLivesDialog(false)} variant="secondary" size="lg">Entendido</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DailyGoalDialog isOpen={showDailyGoalsDialog} onClose={() => setShowDailyGoalsDialog(false)} />
    </div>
  );
}
    

    

    

    

    

    




