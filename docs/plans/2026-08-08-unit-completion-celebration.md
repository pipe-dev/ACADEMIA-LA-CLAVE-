# Unit Completion Celebration Screen ("Cyber Canto") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen, 4-act interactive celebration experience ("Cyber Canto") that triggers automatically upon first-time completion of a Unit Final Exam, rewarding the user with interactive orb shattering, XP counting, level up rank reveals, and badge unboxings.

**Architecture:** A top-level React component `UnitCompletionScreen.tsx` mounted at the app/modal root level, combined with custom audio extensions in `audioService.ts` and HTML5 Canvas particle explosion effects.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide Icons, Canvas API, Web Audio API / AudioService, Canvas-Confetti.

## Global Constraints
- Full-screen view with `fixed inset-0 z-50 bg-slate-950 text-white overflow-hidden`.
- Triggers strictly on first-time unit exam completion (`node.type === 'exam'` and `!isAlreadyCompleted`).
- 4-act sequential choreography with smooth CSS/motion transitions.

---

### Task 1: Add Sci-Fi Audio Effects to AudioService
**Files:**
- Modify: `src/services/audioService.ts`

**Interfaces:**
- Produces: `audioService.playOrbChargeSound()`, `audioService.playOrbShatterSound()`, `audioService.playXpTickSound()`, `audioService.playUnitVictoryFanfare()`

- [ ] **Step 1: Add sound synthesizer methods to audioService**

Add the synth sounds using Web Audio API in `src/services/audioService.ts`:

```typescript
  playOrbChargeSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playOrbShatterSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      // Sub-bass impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playXpTickSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playUnitVictoryFanfare() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 2: Create `UnitCompletionScreen.tsx` Component
**Files:**
- Create: `src/components/UnitCompletionScreen.tsx`

**Interfaces:**
- Consumes: `audioService`
- Produces: `<UnitCompletionScreen unitId={1} unitTitle="Aparato Pulmonar y Control de Aire" xpEarned={350} accuracy={95} onContinue={() => {}} />`

- [ ] **Step 1: Create `UnitCompletionScreen.tsx` component**

Write `UnitCompletionScreen.tsx` with 4-act state machine:
- Act 1: Hold 3D Neon Orb (press & hold or 3 taps)
- Act 2: Shockwave particle burst & shatter
- Act 3: XP counter ticker & rank reveal ("¡GUARDIÁN DEL DIAFRAGMA!")
- Act 4: 3D Unit Badge & Continue CTA button.

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.

---

### Task 3: Integrate `UnitCompletionScreen` into `LessonModal.tsx` & `AcademiaView.tsx`
**Files:**
- Modify: `src/components/LessonModal.tsx`
- Modify: `src/components/AcademiaView.tsx`

- [ ] **Step 1: Trigger full-screen celebration on exam completion**

In `LessonModal.tsx`, when `isExamNode` is completed and `earnedStars >= 2`, check if it's the first time completing. If so, show `<UnitCompletionScreen />` before closing the modal!

- [ ] **Step 2: Verify end-to-end integration with TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS with 0 errors.
