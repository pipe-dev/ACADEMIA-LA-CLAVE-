# Copa Cristal Unidad 2 - Reactividad Táctil 3D, Inercia, Resorte y Acústica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full 3D touch direct manipulation on the Unit 2 crystal wine glass with momentum/inertia, spring-back recovery to ambient 360° orbit, and acoustic Web Audio crystal chime synthesis on tap, while preserving vocal note shatter detection.

**Architecture:** Add pointer/touch event handlers and a physics update loop (`requestAnimationFrame`) inside `Unit2CelebrationModal.tsx` controlling rotation angles and caustics, integrate a Web Audio crystal bell tone synthesizer on tap, and ensure smooth hand-off to the continuous 360° CSS orbit.

**Tech Stack:** React (hooks & refs), Web Audio API, SVG, CSS 3D Transforms, TypeScript.

## Global Constraints
- Perserve all audioService microphone polling, volume detection threshold, and 4.5s sustained note progression.
- Keep fracture stages (30% hairline, 60% spiderweb, 85% critical failure) and shatter explosion at 100%.
- Maintain 3D tactile button styling and responsive layout.
- Singing is the only way to shatter the glass; touch manipulation is purely interactive and tactile.

---

### Task 1: Web Audio Crystal Acoustic Synthesis & Micro-Jiggle

**Files:**
- Modify: `src/components/Unit2CelebrationModal.tsx`

**Interfaces:**
- Produces: `playCrystalChime()` helper function that synthesizes a crystal wine glass harmonic chime at 2637 Hz (E7 fundamental) + 5274 Hz octave overtone with exponential decay.

- [ ] **Step 1: Implement `playCrystalChime` and micro-vibration trigger**
Create the audio synthesis function using the native browser `AudioContext`.

- [ ] **Step 2: Verify audio synthesis function type safety with `npx tsc --noEmit`**
Confirm no TypeScript compile errors.

- [ ] **Step 3: Commit Task 1**
```bash
git add src/components/Unit2CelebrationModal.tsx
git commit -m "feat: add crystal acoustic chime synthesis on tap"
```

---

### Task 2: Touch & Pointer Direct Manipulation Physics (Inertia + Spring-Back)

**Files:**
- Modify: `src/components/Unit2CelebrationModal.tsx`
- Modify: `src/app/globals.css` (if needed for interactive transform transitions)

**Interfaces:**
- Produces: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` handlers attached to the glass container.
- Produces: Physics RAF loop managing angular velocities, friction damping (0.94), spring-back harmonic oscillator on tilt, and seamless resumption of ambient orbit.

- [ ] **Step 1: Define interactive physics refs and handlers in `Unit2CelebrationModal.tsx`**
Add pointer tracking, velocity calculation, inertia animation loop, spring-back on release, and tap detection (<6px and <250ms).

- [ ] **Step 2: Connect interactive 3D rotation, caustics, and floor shadow dynamically**
Apply inline `transform: perspective(1000px) rotateX(...) rotateY(...)` during manual manipulation, and seamlessly blend into ambient orbit when idle.

- [ ] **Step 3: Run typecheck `npx tsc --noEmit`**
Verify zero TypeScript compiler issues.

- [ ] **Step 4: Commit Task 2**
```bash
git add src/components/Unit2CelebrationModal.tsx src/app/globals.css
git commit -m "feat: implement 3D touch interaction with inertia and spring-back"
```

---

### Task 3: Verification & Integration Smoke Test

**Files:**
- Verification on running dev server and Cloudflare tunnel: `https://alarm-while-nascar-flood.trycloudflare.com/sandbox/unit2`

- [ ] **Step 1: Test touch drag and spin on desktop/mobile viewport**
- [ ] **Step 2: Test tap for crystal acoustic chime "ting"**
- [ ] **Step 3: Verify microphone singing still drives progress to 100% and shatters glass**
- [ ] **Step 4: Update task.md and walkthrough.md**
