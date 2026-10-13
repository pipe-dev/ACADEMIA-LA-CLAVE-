# Procedural Elastic Vocal Complaints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time Web Audio API procedural formant synthesis for elastic vocal complaints and cartoonish whimpers across the four characters when stretched, dragged, or released in the cute login sandbox.

**Architecture:** A lightweight vocal tract emulator constructed purely in Web Audio API with a bandlimited glottal oscillator, an involuntary muscle-shiver LFO, two resonant BiquadFilter formants (F1 and F2), dynamic gain staging tied to physical drag displacement `dy`, and threshold-triggered complaint burst reactions with automatic cooldown.

**Tech Stack:** Next.js (React 19 / TypeScript), Web Audio API (native AudioContext, OscillatorNode, BiquadFilterNode, GainNode).

## Global Constraints

- Strictly ZERO emojis in all code, comments, responses, and documentation.
- Absolutely NO screenshot commands or visual testing tools.
- Minimal login card preserved; zero extra buttons added.
- Cero external audio files: all sound synthesis must be 100% procedural.
- Zero audio popping or clicks on sudden mouse release: clean exponential ramps (15-20 ms).

---

### Task 1: Acoustic Vocal Formant Synthesis Engine

**Files:**
- Modify: `src/utils/useJellyAsmrAudio.ts`

**Interfaces:**
- Consumes: `getSharedAudioContext()`, `CharacterId`
- Produces:
  - `startVocalTension(character: CharacterId, initialDy?: number): void`
  - `updateVocalTension(character: CharacterId, dy: number, dx?: number): void`
  - `stopVocalTension(character: CharacterId): void`
  - `playVocalComplainBurst(character: CharacterId, intensity?: number): void`

- [ ] **Step 1: Define vocal formant acoustic profiles**
Add `VOCAL_FORMANT_PROFILES` with F0 base, F0 max, F1 base/max, F2 base/max, Q factors, and shiver rate for `morado`, `fucsia`, `amarillo`, and `naranja`.

- [ ] **Step 2: Implement continuous vocal tension synth (`startVocalTension`, `updateVocalTension`, `stopVocalTension`)**
Create persistent voice nodes tracking each character so active dragging dynamically bends the pitch, formants, and LFO shiver without creating new audio nodes on every mousemove.

- [ ] **Step 3: Implement cartoon complaint burst (`playVocalComplainBurst`)**
Build short (180ms) expressive vocal burst with rapid formant glide and cooldown tracking (450ms).

- [ ] **Step 4: Typecheck changes**
Run `npx tsc --noEmit` to verify type safety.

- [ ] **Step 5: Commit**
`git add src/utils/useJellyAsmrAudio.ts; git commit -m "feat(audio): add procedural vocal formant engine for character complaints"`

---

### Task 2: Tactile Cage Drag & Tension Event Integration

**Files:**
- Modify: `src/components/sandbox/CuteCharacterTactileCage.tsx`

**Interfaces:**
- Consumes: `onVocalTensionStart?: (character: CharacterId) => void`, `onVocalTensionUpdate?: (character: CharacterId, dy: number, dx: number) => void`, `onVocalTensionStop?: (character: CharacterId) => void`
- Produces: callbacks triggered on `pointerdown`, `pointermove`, and `pointerup`

- [ ] **Step 1: Add vocal interaction callbacks to `CuteCharacterTactileCageProps`**
Extend interface with `onDragTension?: (dy: number, dx: number, isInitial?: boolean) => void` and `onDragRelease?: () => void`.

- [ ] **Step 2: Connect callbacks into `handlePointerDown`, `handlePointerMove`, and `handlePointerUp`**
Notify parent of `dy` and `dx` during active drag, passing 0 on release.

- [ ] **Step 3: Verify no regression in physical jelly response**
Ensure spring simulation, tilt, skew, and ripples work identically.

- [ ] **Step 4: Typecheck changes**
Run `npx tsc --noEmit` to verify type safety.

- [ ] **Step 5: Commit**
`git add src/components/sandbox/CuteCharacterTactileCage.tsx; git commit -m "feat(sandbox): integrate drag tension callbacks in CuteCharacterTactileCage"`

---

### Task 3: Character Orchestration & Vocal Whimper Wiring

**Files:**
- Modify: `src/components/sandbox/CuteCharactersStatic.tsx`

**Interfaces:**
- Consumes: `startVocalTension`, `updateVocalTension`, `stopVocalTension`, `playVocalComplainBurst` from `useJellyAsmrAudio`
- Produces: Character-specific vocal bindings for Morado, Fucsia, Amarillo, and Naranja

- [ ] **Step 1: Connect vocal hooks to each character's `CuteCharacterTactileCage`**
Wire `onDragTension` and `onDragRelease` for `moradoNode`, `fucsiaNode`, `amarilloNode`, and `naranjaNode`.

- [ ] **Step 2: Add burst complaint threshold logic**
Detect when `|dy| > 70px` or rapid velocity occurs to trigger `playVocalComplainBurst(character)`.

- [ ] **Step 3: Typecheck changes**
Run `npx tsc --noEmit` to verify type safety.

- [ ] **Step 4: Commit**
`git add src/components/sandbox/CuteCharactersStatic.tsx; git commit -m "feat(sandbox): wire character vocal complaints to tactile drag states"`

---

### Task 4: Compilation, Live Verification & Endpoint Health Check

**Files:**
- Check: All modified files and live endpoints

- [ ] **Step 1: Run full TypeScript compilation**
Execute `npx tsc --noEmit` and confirm 0 errors.

- [ ] **Step 2: Test local and tunnel HTTP endpoints**
Confirm HTTP 200 on port 9005 and Cloudflare tunnel.

- [ ] **Step 3: Document completion and summary**
Provide clean, concise confirmation to user with zero emojis.
