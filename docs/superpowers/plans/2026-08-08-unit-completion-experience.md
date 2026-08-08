# Fullscreen Epic Unit Completion Experience (`UnitCompletionScreen`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-dopamine, full-screen, 4-act interactive celebration screen (`UnitCompletionScreen.tsx`) that triggers the first time a user completes a Unit's final evaluation exam, featuring an interactive 3D orb hold-charge, multi-burst confetti, orchestral fanfare, XP ticker, level-up badge reveal, and seamless unlock transition to the next Unit.

**Architecture:** A standalone fullscreen React component (`UnitCompletionScreen.tsx`) managing a 4-stage state machine (`charge` ➔ `burst` ➔ `rewards` ➔ `unlock`). Audio synthesis is added to `audioService.ts`. Integrated into `LessonModal.tsx` and `MainApp.tsx` with `localStorage` first-time flag checking.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas-Confetti, Web Audio API.

## Global Constraints

- Fullscreen overlay (`fixed inset-0 z-[100]`), zero layout thrashing, hardware-accelerated transforms.
- First-time celebration flag: `localStorage.getItem('laclave_unit_1_celebrated')`.
- Clean TypeScript compilation with `npx tsc --noEmit`.

---

### Task 1: Add Web Audio Victory Synthesis Methods to `audioService.ts`

**Files:**
- Modify: `src/services/audioService.ts`

**Interfaces:**
- Produces:
  - `playOrbeChargeRiser(progress: number)`: Plays an ascending pitch riser (progress from 0 to 1).
  - `playUnitVictoryFanfare()`: Plays a 4-chord polyphonic orchestral fanfare with fanfare arpeggios.
  - `playXpTickSound()`: Plays a high-frequency rapid click tick sound.
  - `playBadgeUnlockChime()`: Plays a majestic resonant bell chime.

- [ ] **Step 1: Implement synthesis methods in `audioService.ts`**

Add the 4 Web Audio API synthesis methods to `audioService.ts`:

```typescript
  // Synthesis method for Orb Hold Charge pitch riser
  playOrbeChargeRiser(progress: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const startFreq = 220 + progress * 440; // 220Hz to 660Hz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  // Synthesis method for Unit Victory Fanfare
  playUnitVictoryFanfare() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
      });
    } catch {}
  }

  // Rapid XP Counter Tick Sound
  playXpTickSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Majestic Badge Unlock Chime
  playBadgeUnlockChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 1.6);
      });
    } catch {}
  }
```

- [ ] **Step 2: Run `npx tsc --noEmit` to verify type clean**

Run: `npx tsc --noEmit`  
Expected: Exit code 0 with zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/audioService.ts
git commit -m "feat: add victory audio synthesis methods to audioService"
```

---

### Task 2: Build `UnitCompletionScreen.tsx` Component

**Files:**
- Create: `src/components/UnitCompletionScreen.tsx`

**Interfaces:**
```typescript
export interface UnitCompletionScreenProps {
  unitId: number;
  unitTitle: string;
  vocalRangeClassification?: string;
  onClose: () => void;
  onUnlockNextUnit: () => void;
}
```

- [ ] **Step 1: Write `src/components/UnitCompletionScreen.tsx`**

Create `src/components/UnitCompletionScreen.tsx` implementing the 4-act state machine (`charge` ➔ `burst` ➔ `rewards` ➔ `unlock`):

```tsx
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Zap, Award, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { audioService } from '../services/audioService';

export interface UnitCompletionScreenProps {
  unitId: number;
  unitTitle: string;
  vocalRangeClassification?: string;
  onClose: () => void;
  onUnlockNextUnit: () => void;
}

export const UnitCompletionScreen: React.FC<UnitCompletionScreenProps> = ({
  unitId,
  unitTitle,
  vocalRangeClassification = 'Barítono',
  onClose,
  onUnlockNextUnit
}) => {
  const [act, setAct] = useState<'charge' | 'burst' | 'rewards' | 'unlock'>('charge');
  const [chargeProgress, setChargeProgress] = useState<number>(0);
  const [displayedXP, setDisplayedXP] = useState<number>(0);
  const isHoldingRef = useRef<boolean>(false);
  const chargeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Act 1: Orb Hold Charge Mechanics
  const startCharging = () => {
    isHoldingRef.current = true;
    audioService.playClickSound();
    audioService.vibrate(25);

    if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
    
    chargeTimerRef.current = setInterval(() => {
      setChargeProgress((prev) => {
        if (prev >= 100) {
          if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
          triggerBurstAct();
          return 100;
        }
        const next = prev + 4; // Reaches 100% in ~1.5s
        audioService.playOrbeChargeRiser(next / 100);
        audioService.vibrate(12);
        return next;
      });
    }, 60);
  };

  const stopCharging = () => {
    isHoldingRef.current = false;
    if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
    if (act === 'charge') {
      setChargeProgress(0);
    }
  };

  // Act 2: Burst & Fanfare Transition
  const triggerBurstAct = () => {
    setAct('burst');
    audioService.playUnitVictoryFanfare();
    audioService.vibrate([60, 100, 60, 120]);

    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#4648d4', '#818cf8', '#f59e0b', '#10b981', '#ffffff']
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 120,
          origin: { y: 0.3 },
          colors: ['#ffe55c', '#6cf8bb', '#38bdf8']
        });
      }, 400);
    } catch {}

    setTimeout(() => {
      setAct('rewards');
      audioService.playBadgeUnlockChime();
    }, 1800);
  };

  // Act 3: XP Counter Animation
  useEffect(() => {
    if (act === 'rewards') {
      let current = 0;
      const interval = setInterval(() => {
        current += 5;
        if (current >= 100) {
          setDisplayedXP(100);
          clearInterval(interval);
          setTimeout(() => {
            setAct('unlock');
          }, 2200);
        } else {
          setDisplayedXP(current);
          audioService.playXpTickSound();
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [act]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#070c14] text-white flex flex-col items-center justify-between p-6 overflow-hidden animate-fadeIn">
      {/* Background Animated Neon Glow Aura */}
      <div className="absolute inset-0 bg-radial from-indigo-900/40 via-purple-950/20 to-transparent pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Top Banner */}
      <div className="relative z-10 pt-4 text-center space-y-1">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>MÓDULO {unitId} COMPLETADO</span>
        </span>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white drop-shadow-md">
          {unitTitle}
        </h1>
      </div>

      {/* Center Stage: Act-dependent Content */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-sm text-center space-y-6">
        {/* Act 1: Interactive Neon Orb Charge */}
        {act === 'charge' && (
          <div className="space-y-6 animate-scaleIn flex flex-col items-center">
            <div className="relative">
              {/* Outer Pulse Rings */}
              <div className="absolute -inset-4 rounded-full border-2 border-indigo-500/60 animate-ping opacity-50 pointer-events-none" />
              <div className="absolute -inset-8 rounded-full border border-purple-500/40 animate-pulse pointer-events-none" />

              {/* The Interactive Orb Button */}
              <button
                onMouseDown={startCharging}
                onMouseUp={stopCharging}
                onMouseLeave={stopCharging}
                onTouchStart={startCharging}
                onTouchEnd={stopCharging}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 p-1 shadow-[0_0_50px_rgba(99,102,241,0.6)] cursor-pointer press-effect relative overflow-hidden flex items-center justify-center transition-transform active:scale-95"
              >
                <div className="w-full h-full rounded-full bg-[#0d1627] flex flex-col items-center justify-center p-4 relative z-10">
                  <Zap className="w-12 h-12 text-amber-400 animate-bounce" />
                  <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase mt-1">
                    {chargeProgress > 0 ? `${chargeProgress}%` : 'MANTÉN PRESIONADO'}
                  </span>
                </div>

                {/* Fill Ring Progress */}
                <div
                  className="absolute inset-0 bg-indigo-500/40 transition-all duration-75"
                  style={{ height: `${chargeProgress}%` }}
                />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-300 px-4 leading-relaxed">
              Mantén presionado el Orbe de Poder para liberar la energía y completar el Módulo 1.
            </p>
          </div>
        )}

        {/* Act 2: Cosmic Burst Fanfare */}
        {act === 'burst' && (
          <div className="space-y-4 animate-scaleIn flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-amber-400/20 border-4 border-amber-400 flex items-center justify-center animate-spin">
              <Trophy className="w-16 h-16 text-amber-400" />
            </div>
            <h2 className="font-heading font-black text-3xl text-amber-300 tracking-wider animate-pulse">
              ¡GRAN VICTORIA!
            </h2>
          </div>
        )}

        {/* Act 3 & 4: Rewards, Badge & Stats */}
        {(act === 'rewards' || act === 'unlock') && (
          <div className="space-y-5 animate-fadeIn w-full">
            {/* 3D Rotating Badge Card */}
            <div className="bg-gradient-to-b from-indigo-950/80 to-[#0b1626] p-5 rounded-3xl border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                  INSIGNIA DESBLOQUEADA
                </span>
                <h3 className="font-heading font-black text-base text-white">
                  Maestro de la Fisiología y Apoyo Vocal
                </h3>
              </div>
            </div>

            {/* XP Counter Card */}
            <div className="bg-indigo-900/30 p-4 rounded-2xl border border-indigo-500/40 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200">Recompensa XP del Módulo</span>
              <span className="text-xl font-black text-amber-400 font-mono">+{displayedXP} XP</span>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>12/12 Clases</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Voz: {vocalRangeClassification}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Unlock Button (Act 4) */}
      <div className="relative z-10 w-full max-w-sm pb-4">
        {act === 'unlock' ? (
          <button
            onClick={() => {
              audioService.playClickSound();
              onUnlockNextUnit();
              onClose();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] press-effect cursor-pointer animate-bounce"
          >
            <span>¡DESBLOQUEAR UNIDAD 2: AFINACIÓN Y OÍDO!</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors block mx-auto py-2 cursor-pointer"
          >
            Omitir animación
          </button>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Run `npx tsc --noEmit` to verify type clean**

Run: `npx tsc --noEmit`  
Expected: Exit code 0 with zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/UnitCompletionScreen.tsx
git commit -m "feat: add UnitCompletionScreen component for full-screen celebration"
```

---

### Task 3: Integrate `UnitCompletionScreen` into `LessonModal.tsx` and `MainApp.tsx` Flow

**Files:**
- Modify: `src/components/LessonModal.tsx`
- Modify: `src/components/MainApp.tsx`

- [ ] **Step 1: Update `LessonModal.tsx` to launch `UnitCompletionScreen` on first exam completion**

In `LessonModal.tsx`, when `isExamNode` completes with passing score, check if `laclave_unit_1_celebrated` is present. If not, trigger `UnitCompletionScreen`:

```tsx
  // Check if first-time unit exam completion
  const handleExamFinish = () => {
    const celebrated = localStorage.getItem('laclave_unit_1_celebrated');
    if (!celebrated && isExamNode) {
      setShowUnitCelebration(true);
    }
  };
```

- [ ] **Step 2: Update `MainApp.tsx` to handle Unit 2 unlock and map focus**

In `MainApp.tsx`, when `onUnlockNextUnit` is called from `UnitCompletionScreen`:
```tsx
  const handleUnlockNextUnit = () => {
    localStorage.setItem('laclave_unit_1_celebrated', 'true');
    // Unlock Unit 2
    setUnits(prev => prev.map(u => {
      if (u.id === 2) {
        return {
          ...u,
          nodes: u.nodes.map((n, idx) => idx === 0 ? { ...n, status: 'current' as const } : n)
        };
      }
      return u;
    }));
  };
```

- [ ] **Step 3: Run `npx tsc --noEmit` to verify compilation**

Run: `npx tsc --noEmit`  
Expected: Exit code 0 with zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/LessonModal.tsx src/components/MainApp.tsx
git commit -m "feat: integrate UnitCompletionScreen trigger and Unit 2 unlock flow"
```

---

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify TypeScript compilation clean across all updated files.

### Manual Verification
- Open Unit 1 Evaluation Exam (`u1-node12.5`), complete questions 1-4, perform the 2 repetitions of Labios Fruncidos balloon, answer questions 5-7, and verify the full-screen `UnitCompletionScreen` triggers with Orb charge, fanfare, XP counter, badge reveal, and Unit 2 unlock!
