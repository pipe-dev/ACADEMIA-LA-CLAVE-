# Full-Screen Unit Completion Celebration Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen, ultra-interactive, game-like 4-act unit completion experience (`UnitCompletionCelebration.tsx`) with a press-and-hold 3D particle orb, Web Audio sound synthesis, dopamine XP counters, and automated transition to the next unlocked unit on the Academia map.

**Architecture:** A top-level React overlay component (`UnitCompletionCelebration.tsx`) with hardware-accelerated canvas background, Web Audio API sound effects in `audioService.ts`, state tracking in `MainApp.tsx` for unit completion and first-time triggers, and smooth auto-scroll integration in `AcademiaView.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Web Audio API, Canvas 2D API (30fps capped), canvas-confetti, Lucide React icons.

## Global Constraints

- Tailwind CSS only for styling.
- Hardware-accelerated 30fps canvas rendering (time math cap).
- Synthesized Web Audio API sound effects only (zero heavy external audio files).
- React 19 strict compliance (no direct DOM state mutation).
- All clickable elements MUST have unique descriptive IDs.

---

### Task 1: Synthesize Unit Celebration Audio Effects in Audio Service

**Files:**
- Modify: `src/services/audioService.ts`

**Interfaces:**
- Consumes: Web Audio API `AudioContext`
- Produces: 
  - `playEnergyCharge(progress: number): void`
  - `playPowerBreakImpact(): void`
  - `playXpTick(): void`
  - `playUnitMasteryChime(): void`

- [ ] **Step 1: Write Web Audio synth methods in audioService.ts**

```typescript
  // Synthesized energy charge tone for press-and-hold (progress 0.0 to 1.0)
  playEnergyCharge(progress: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const startFreq = 150 + progress * 600; // 150Hz to 750Hz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);

      gain.gain.setValueAtTime(0.05 + progress * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Synthesized sub-bass explosion impact for orb shatter
  playPowerBreakImpact() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Sub bass boom
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);

      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start();
      subOsc.stop(ctx.currentTime + 0.5);

      // High metallic chime
      const highOsc = ctx.createOscillator();
      const highGain = ctx.createGain();
      highOsc.type = 'triangle';
      highOsc.frequency.setValueAtTime(880, ctx.currentTime);
      highOsc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);

      highGain.gain.setValueAtTime(0.2, ctx.currentTime);
      highGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      highOsc.connect(highGain);
      highGain.connect(ctx.destination);

      highOsc.start();
      highOsc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Rapid XP counter tick chime
  playXpTick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Grand Unit Mastery Fanfare
  playUnitMasteryChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.6);
      } catch {}
    });
  }
```

- [ ] **Step 2: Run build check to verify audioService.ts compiles**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/audioService.ts
git commit -m "feat: add synthesized unit celebration audio effects to audioService"
```

---

### Task 2: Build `UnitCompletionCelebration.tsx` Component

**Files:**
- Create: `src/components/UnitCompletionCelebration.tsx`

**Interfaces:**
- Consumes: `Unit`, `UserStats`, `audioService`
- Produces: Full-screen overlay component `UnitCompletionCelebration`

- [ ] **Step 1: Create UnitCompletionCelebration.tsx**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, Sparkles, ArrowRight, Zap, Award } from 'lucide-react';
import { Unit, UserStats } from '../types';
import { audioService } from '../services/audioService';

interface UnitCompletionCelebrationProps {
  unit: Unit;
  userStats: UserStats;
  onAdvanceToNextUnit: () => void;
}

export const UnitCompletionCelebration: React.FC<UnitCompletionCelebrationProps> = ({
  unit,
  userStats,
  onAdvanceToNextUnit
}) => {
  const [act, setAct] = useState<1 | 2 | 3 | 4>(1);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [animatedXP, setAnimatedXP] = useState<number>(0);

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas Neon Background Particles (30 FPS capped)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastFrameTime = performance.now();

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2.5 + 1,
      vy: -(Math.random() * 0.6 + 0.2),
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      if (now - lastFrameTime < 33) return; // 30 FPS cap
      lastFrameTime = now;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < -10) p.y = canvas.height + 10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#6366f1';
        ctx.fill();
      });
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Press and hold logic
  const handleMouseDown = () => {
    setIsHolding(true);
    audioService.playClickSound();
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  };

  useEffect(() => {
    if (isHolding && act === 1) {
      holdIntervalRef.current = setInterval(() => {
        setHoldProgress((prev) => {
          const next = prev + 0.05;
          audioService.playEnergyCharge(next);

          if (next >= 1) {
            if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
            setIsHolding(false);
            triggerShatter();
            return 1;
          }
          return next;
        });
      }, 50);
    } else {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isHolding, act]);

  // Shatter Orbe -> Act 2 & Act 3 Transition
  const triggerShatter = () => {
    audioService.playPowerBreakImpact();
    audioService.vibrate([100, 50, 100]);

    // Multi-burst Confetti
    try {
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#818cf8', '#6366f1', '#fbbf24', '#ffffff'] });
      setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { y: 0.5 } }), 200);
    } catch {}

    setAct(2);

    setTimeout(() => {
      setAct(3);
      startXPAnimation();
    }, 1200);
  };

  // Act 3: Rapid XP Counter Animation
  const startXPAnimation = () => {
    let current = 0;
    const target = 100;
    const interval = setInterval(() => {
      current += 5;
      setAnimatedXP(current);
      audioService.playXpTick();

      if (current >= target) {
        clearInterval(interval);
        setAnimatedXP(target);
        audioService.playUnitMasteryChime();
        setTimeout(() => setAct(4), 1000);
      }
    }, 40);
  };

  return (
    <div id="unit-completion-celebration" className="fixed inset-0 z-[100] bg-[#070b14] text-white flex flex-col items-center justify-between p-6 select-none overflow-hidden animate-fadeIn">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Header */}
      <div className="relative z-10 text-center pt-8 space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/50 px-4 py-1.5 rounded-full text-xs font-black text-indigo-300 tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>¡MÓDULO {unit.id} CONQUISTADO!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
          {unit.title}
        </h2>
      </div>

      {/* Act 1 & 2: The Neon Power Orb */}
      {(act === 1 || act === 2) && (
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8 my-auto">
          <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            id="unit-celebration-orb-btn"
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 ${
              isHolding ? 'scale-105' : 'hover:scale-105'
            }`}
          >
            {/* Outer Pulsing Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-indigo-600/30 blur-2xl animate-pulse" />
            
            {/* Progress Radial Overlay */}
            <div
              className="absolute inset-0 rounded-full border-4 border-indigo-500/40"
              style={{
                boxShadow: `0 0 ${20 + holdProgress * 40}px rgba(99,102,241,${0.4 + holdProgress * 0.6})`,
                borderColor: holdProgress > 0 ? '#818cf8' : undefined
              }}
            />

            {/* Inner Core Orb */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-indigo-900 via-indigo-600 to-indigo-400 flex flex-col items-center justify-center p-4 text-center shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] relative overflow-hidden">
              <Sparkles className="w-12 h-12 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
              {act === 2 && <div className="absolute inset-0 bg-white animate-ping" />}
            </div>
          </div>

          {act === 1 && (
            <p className="text-xs sm:text-sm font-black text-indigo-300 tracking-wider uppercase text-center animate-pulse">
              Mantén presionado para liberar tu poder vocal
            </p>
          )}
        </div>
      )}

      {/* Act 3 & 4: Dopamine Stats & Mastery Emblem */}
      {(act === 3 || act === 4) && (
        <div className="relative z-10 flex flex-col items-center space-y-6 my-auto max-w-md w-full animate-scaleIn">
          {/* Unit Master Emblem */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-1 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <div className="w-full h-full bg-[#0b1626] rounded-[22px] flex items-center justify-center">
              <Award className="w-12 h-12 text-amber-400" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="w-full space-y-3">
            <div className="bg-indigo-950/60 border border-indigo-800/80 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-400" />
                <span className="text-sm font-bold text-slate-300">XP Recompensado</span>
              </div>
              <span className="text-xl font-black text-amber-400 font-mono">+{animatedXP} XP</span>
            </div>

            <div className="bg-indigo-950/60 border border-indigo-800/80 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-bold text-slate-300">Lecciones Conquistadas</span>
              </div>
              <span className="text-base font-black text-white font-mono">{unit.nodes.length} / {unit.nodes.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Act 4 CTA Button */}
      {act === 4 && (
        <div className="relative z-10 w-full max-w-md pb-6 animate-fadeIn">
          <button
            id="unit-celebration-advance-btn"
            onClick={() => {
              audioService.playClickSound();
              onAdvanceToNextUnit();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-heading font-black text-base flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(99,102,241,0.6)] cursor-pointer press-effect transition-all"
          >
            <span>¡AVANZAR A LA UNIDAD {unit.id + 1}!</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run build check to verify component compiles**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/UnitCompletionCelebration.tsx
git commit -m "feat: create full-screen unit completion celebration component"
```

---

### Task 3: Integrate Celebration Component in `MainApp.tsx` & `AcademiaView.tsx`

**Files:**
- Modify: `src/components/MainApp.tsx`
- Modify: `src/components/AcademiaView.tsx`

**Interfaces:**
- Consumes: `UnitCompletionCelebration`
- Produces: Full-screen celebration trigger and auto-scroll to next unit

- [ ] **Step 1: Add celebrated units state and trigger handler in MainApp.tsx**

In `MainApp.tsx`:
```tsx
  // Track celebrated unit IDs to enforce first-time-only rule
  const [celebratedUnitIds, setCelebratedUnitIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('laclave_celebrated_units');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeUnitCelebration, setActiveUnitCelebration] = useState<Unit | null>(null);

  // Trigger celebration check on node completion
  const handleCheckUnitCompletion = (completedNodeId: string) => {
    const currentUnit = units.find((u) => u.nodes.some((n) => n.id === completedNodeId));
    if (!currentUnit) return;

    // If all nodes in unit are completed and unit was not yet celebrated:
    const allNodesDone = currentUnit.nodes.every(
      (n) => n.id === completedNodeId || n.status === 'completed'
    );

    if (allNodesDone && !celebratedUnitIds.includes(currentUnit.id)) {
      setActiveUnitCelebration(currentUnit);
      setCelebratedUnitIds((prev) => {
        const updated = [...prev, currentUnit.id];
        try {
          localStorage.setItem('laclave_celebrated_units', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };
```

- [ ] **Step 2: Render `UnitCompletionCelebration` overlay in `MainApp.tsx`**

In `MainApp.tsx` JSX:
```tsx
      {/* Full-Screen Unit Completion Celebration Experience */}
      {activeUnitCelebration && (
        <UnitCompletionCelebration
          unit={activeUnitCelebration}
          userStats={userStats}
          onAdvanceToNextUnit={() => {
            const nextUnitId = activeUnitCelebration.id + 1;
            setActiveUnitCelebration(null);
            
            // Unlock next unit nodes if locked
            setUnits((prev) =>
              prev.map((u) => {
                if (u.id === nextUnitId) {
                  return {
                    ...u,
                    nodes: u.nodes.map((n, idx) => (idx === 0 ? { ...n, status: 'current' as const } : n))
                  };
                }
                return u;
              })
            );

            // Auto-scroll Academia map to next unit
            setTimeout(() => {
              const targetElem = document.getElementById(`unit-header-${nextUnitId}`);
              if (targetElem) {
                targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          }}
        />
      )}
```

- [ ] **Step 3: Run build check to verify MainApp.tsx compiles**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/MainApp.tsx
git commit -m "feat: integrate unit completion celebration in MainApp"
```

---

### Task 4: Final End-to-End Build & Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 2: Commit all updates**

```bash
git add .
git commit -m "chore: finalize full-screen unit completion celebration experience"
```
