# Rhythm Purple Sphere Bounce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duck mascot in `TunerRhythmView.tsx` with an animated purple bouncing sphere featuring a sinusoidal parabolic arc trajectory between the Kick and Clap buttons, squash & stretch physics, and color-coded impact rings.

**Architecture:** Encapsulate the rhythm sphere state and animation logic inside `TunerRhythmView.tsx` (or a dedicated helper state), driving horizontal displacement ($$x: -80\text{px}$$ to $$+80\text{px}$$), vertical sinusoidal jump curves ($$y: 0$$ to $$-55\text{px}$$), and scale transforms ($$\text{scaleX/Y}$$ for squash & stretch) via `motion/react`. Schedulers in `guide` phase anticipate beat hits, and user inputs in `playing` phase trigger immediate reactive leaps.

**Tech Stack:** Next.js, React 19, `motion/react` (Framer Motion API), Tailwind CSS, Lucide icons (`Music2`, `Drum`, `Play`).

## Global Constraints

- Component affected: `src/components/TunerRhythmView.tsx`
- Spec reference: `docs/superpowers/specs/2026-09-08-rhythm-purple-sphere-bounce-design.md`
- Do not introduce external physics libraries; use React state and `motion/react` animations
- Ensure strict TypeScript compliance (`npx tsc --noEmit` must pass with 0 errors)

---

### Task 1: Replace Duck Mascot with Purple Sphere and Trajectory State

**Files:**
- Modify: `src/components/TunerRhythmView.tsx`

**Interfaces:**
- Consumes: `level`, `pattern`, `bpm`, `phase`, `activeButton`
- Produces: `ballPosition` state (`'center' | 'kick' | 'clap'`), `isSquashing` state, `lastImpact` state (`'kick' | 'clap' | null`)

- [ ] **Step 1: Clean up duck imports and define sphere animation states**

Remove `import Image from 'next/image';` from `src/components/TunerRhythmView.tsx` and add `Music2` to lucide imports.
Add sphere state variables:
```tsx
const [sphereTarget, setSphereTarget] = useState<'center' | 'kick' | 'clap'>('center');
const [impactEffect, setImpactEffect] = useState<'kick' | 'clap' | null>(null);
const [isSquashing, setIsSquashing] = useState<boolean>(false);
```

- [ ] **Step 2: Implement the Sphere JSX with dynamic parabolic and squash-stretch transforms**

Replace the `<div className="relative mb-2">...<Image src="/duck.png".../>...</div>` with the purple sphere structure:
```tsx
{/* Dynamic Purple Bouncing Sphere */}
<div className="relative w-full h-24 flex items-center justify-center overflow-visible">
  {/* Ground shadow that moves horizontally with the sphere */}
  <motion.div
    animate={{
      x: sphereTarget === 'kick' ? -80 : sphereTarget === 'clap' ? 80 : 0,
      scale: isSquashing ? 1.3 : 0.85,
      opacity: isSquashing ? 0.6 : 0.3
    }}
    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    className="absolute bottom-1 w-12 h-3 bg-slate-900/20 dark:bg-black/40 rounded-full blur-xs pointer-events-none"
  />

  {/* Impact Micro-Ripple */}
  {impactEffect && (
    <motion.div
      key={`ripple-${Date.now()}`}
      initial={{ scale: 0.6, opacity: 0.9 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`absolute bottom-0 w-14 h-4 rounded-full border-2 pointer-events-none ${
        impactEffect === 'kick' ? 'border-blue-400 bg-blue-400/20' : 'border-rose-400 bg-rose-400/20'
      }`}
      style={{
        left: sphereTarget === 'kick' ? 'calc(50% - 80px - 28px)' : 'calc(50% + 80px - 28px)'
      }}
    />
  )}

  {/* Purple Sphere */}
  <motion.div
    animate={{
      x: sphereTarget === 'kick' ? -80 : sphereTarget === 'clap' ? 80 : 0,
      y: isSquashing ? 6 : [0, -50, 0],
      scaleX: isSquashing ? 1.28 : [0.9, 1.05, 0.95],
      scaleY: isSquashing ? 0.74 : [1.15, 0.95, 1.05]
    }}
    transition={{
      x: { type: 'spring', stiffness: 400, damping: 28 },
      y: { duration: 0.32, ease: [0.33, 1, 0.68, 1] },
      scaleX: { duration: 0.28 },
      scaleY: { duration: 0.28 }
    }}
    className={`w-14 h-14 rounded-full bg-gradient-to-br from-[#6366f1] via-[#4648d4] to-[#2c2abc] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(70,72,212,0.45)] border-t border-white/30 relative z-20 cursor-default transition-shadow duration-150 ${
      impactEffect === 'kick'
        ? 'ring-4 ring-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.8)]'
        : impactEffect === 'clap'
        ? 'ring-4 ring-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.8)]'
        : 'ring-2 ring-indigo-300/30'
    }`}
  >
    <Music2 className="w-6 h-6 text-white/90 drop-shadow-sm" />
  </motion.div>
</div>
```

- [ ] **Step 3: Run TypeScript check to ensure valid JSX and types**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 1**

```bash
git add src/components/TunerRhythmView.tsx
git commit -m "feat: replace duck with purple bouncing sphere in rhythm exercises"
```

---

### Task 2: Synchronize Bouncing Dynamics with Guide & Playing Phases

**Files:**
- Modify: `src/components/TunerRhythmView.tsx`

**Interfaces:**
- Consumes: `startGuidePhase`, `handleTap`, `pattern`, `bpm`
- Produces: Precise leap scheduling before each beat and reactive impact triggers on player taps

- [ ] **Step 1: Connect count-in and pattern guide scheduling**

In `startGuidePhase`:
- During count-in ticks ($$i = 0 \dots 3$$), trigger micro vertical bounces in the center:
  `setSphereTarget('center'); setIsSquashing(true); setTimeout(() => setIsSquashing(false), 120);`
- Before each hit ($$\text{hit.instrument} === \text{'kick'} \mid \text{'clap'}$$), schedule the sphere jump:
  Leap starts $$\sim 160\text{ms}$$ before sound so the landing coincides with audio:
  ```tsx
  const leapStart = Math.max(0, startPatternTime + hit.time - 160);
  const leapTimer = setTimeout(() => {
    setSphereTarget(hit.instrument);
  }, leapStart);
  timeoutsRef.current.push(leapTimer);

  const impactTimer = setTimeout(() => {
    setIsSquashing(true);
    setImpactEffect(hit.instrument);
    setTimeout(() => {
      setIsSquashing(false);
      setImpactEffect(null);
    }, 140);
  }, startPatternTime + hit.time);
  timeoutsRef.current.push(impactTimer);
  ```

- [ ] **Step 2: Connect interactive user tap reaction in `handleTap`**

In `handleTap(instrument)`:
Trigger immediate parabolic jump and squash impact on the tapped side:
```tsx
setSphereTarget(instrument);
setIsSquashing(true);
setImpactEffect(instrument);
setTimeout(() => {
  setIsSquashing(false);
  setImpactEffect(null);
}, 140);
```

- [ ] **Step 3: Add Victory celebration jump on results**

In `evaluateTaps`:
If `finalScore >= 80`, return `sphereTarget` to `'center'` and trigger a celebratory high-jump.
If `finalScore < 80`, return smoothly to `'center'`.

- [ ] **Step 4: Run verification tests**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/TunerRhythmView.tsx
git commit -m "feat: synchronize purple sphere bounce with guide phase and user taps"
```

---

### Task 3: Visual Polish, Verification and Final Review

**Files:**
- Modify: `src/components/TunerRhythmView.tsx`
- Modify: `public/sw.js` (bump cache version if needed)

- [ ] **Step 1: Test rhythm playflow in browser**
Verify in `localhost:9002`:
1. Enter rhythm level (e.g. Nivel 7+).
2. Observe 4 count-in micro-bounces in center.
3. Observe sphere leaping smoothly in sinusoidal parabola to Kick (left) and Clap (right).
4. Observe squash & stretch landing with colored impact ring and ripple.
5. In playing phase, tap keys `A` and `D` or click buttons; verify instantaneous responsive leaps.

- [ ] **Step 2: Bump service worker cache version**
Ensure clients receive fresh components seamlessly without stale cache.

- [ ] **Step 3: Run final TypeScript verification**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 3**
```bash
git commit -am "chore: finalize rhythm purple sphere animation and verify"
```
