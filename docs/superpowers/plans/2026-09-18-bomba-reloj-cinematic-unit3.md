# Cinemática de Desactivación de Bomba (Unidad 3) - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Unit 3 to Unit 4 completion cinematic ("Desactiva la Bomba"): a tactical 3D spy briefcase where users slice 4 tensioned colored cables in rhythm (120 BPM) via *Fruit Ninja* blade swipe on an HTML5 Canvas, freeze the digital clock at `00:01.00`, trigger pneumatic steam jets and an armored hatch opening to reveal the Golden Drum Trophy (`Drum` icon), with native Web Audio synthesis and a dedicated sandbox at `/sandbox/unit3`.

**Architecture:** 
- Modular React architecture in `src/components/unit3-bomb/`:
  - `bombAudio.ts`: Pure Web Audio API synthesis engine (zero external audio file dependencies).
  - `CablePhysicsCanvas.tsx`: HTML5 Canvas managing pointer swipes, blade trail, spark particles, and Bézier cable split/drop physics.
  - `TacticalBriefcase.tsx`: CSS 3D & SVG tactical briefcase shell with 7-segment digital countdown clock, status LEDs, and rhythmic scanning laser.
  - `TrophyReveal.tsx`: Pneumatic hatch, lateral steam discharge, 3D Golden Drum Trophy, confeti burst, and cartoon timeout smoke puff.
- Orchestration in `src/components/Unit3CelebrationModal.tsx` managing the state machine (`IDLE` -> `DEFUSING` -> `MISCUT_PENALTY` -> `DEFUSED_SLOWMO` -> `PNEUMATIC_RELEASE` -> `HATCH_OPENING` -> `TROPHY_REVEAL` / `TIMEOUT_PUFF`).
- Dedicated test harness at `src/app/sandbox/unit3/page.tsx` with telemetry and debug controls.
- Integration into `src/components/MainApp.tsx` on completion of evaluation node `u3-node28.5`, unlocking Unit 4.

**Tech Stack:** Next.js, React 18, TypeScript, HTML5 Canvas, Web Audio API, Lucide React (`Drum`), Canvas Confetti, Tailwind CSS.

## Global Constraints
- All audio must be synthesized via native Web Audio API (`bombAudio.ts`) with zero network dependencies or missing audio files.
- Beat window is $\pm 120\text{ms}$ around each 120 BPM metronome pulse ($500\text{ms}$ interval).
- Digital clock starts at `00:08.00`, decrements at 100 FPS; off-beat cut deducts 1.00s and triggers `BZZT!` buzz; successful defusal freezes clock at `00:01.00`.
- Reaching `00:00.00` triggers harmless cartoon smoke puff (`PFFFT!`) and an immediate "Reintentar Desactivación" button restoring `00:08.00`.
- All touch and mouse gestures must work with `touch-action: none` and 60+ FPS on mobile and desktop.
- Retain existing unit 1 and unit 2 celebrations without regressions.

---

### Task 1: Web Audio Synthesis Module (`src/utils/bombAudio.ts`)

**Files:**
- Create: `src/utils/bombAudio.ts`

**Interfaces:**
- Produces: 
  - `playTickSound(isUrgent: boolean): void`
  - `playSwooshSound(): void`
  - `playSnipRelaySound(): void`
  - `playCircuitBuzzSound(): void`
  - `playPneumaticReleaseSound(): void`
  - `playVictoryFanfare(): void`
  - `playTimeoutPuffSound(): void`
  - `setBombAudioMuted(muted: boolean): void`

- [ ] **Step 1: Write `src/utils/bombAudio.ts`**
Implement the audio synthesis engine using native browser `AudioContext` with methods for ticks, blade swooshes, metal snips, error buzz, steam hiss, fanfare, and smoke puff.

```typescript
// src/utils/bombAudio.ts
let audioCtx: AudioContext | null = null;
let isMuted = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setBombAudioMuted(muted: boolean) {
  isMuted = muted;
}

export function playTickSound(isUrgent = false) {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(isUrgent ? 1200 : 800, now);
  osc.frequency.exponentialRampToValueAtTime(isUrgent ? 600 : 300, now + 0.035);

  gain.gain.setValueAtTime(isUrgent ? 0.25 : 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}

export function playSwooshSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const bufferSize = Math.floor(ctx.sampleRate * 0.09);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
  filter.Q.setValueAtTime(3.0, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
}

export function playSnipRelaySound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Sharp relay snap
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  // Metallic click transient
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(2400, now);
  osc2.frequency.exponentialRampToValueAtTime(600, now + 0.025);
  gain2.gain.setValueAtTime(0.35, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.05);
  osc2.stop(now + 0.05);
}

export function playCircuitBuzzSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(75, now);
  osc.frequency.linearRampToValueAtTime(68, now + 0.18);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.19);
}

export function playPneumaticReleaseSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Mechanical clack
  const osc = ctx.createOscillator();
  const clackGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
  clackGain.gain.setValueAtTime(0.5, now);
  clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(clackGain);
  clackGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);

  // Steam hiss (filtered noise)
  const duration = 1.1;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, now);
  filter.frequency.exponentialRampToValueAtTime(350, now + duration);

  const steamGain = ctx.createGain();
  steamGain.gain.setValueAtTime(0.38, now);
  steamGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(steamGain);
  steamGain.connect(ctx.destination);
  noise.start(now);
}

export function playVictoryFanfare() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Arpeggiated golden chord: D4 (293.66), F#4 (369.99), A4 (440.0), D5 (587.33)
  const notes = [
    { freq: 293.66, delay: 0.0, dur: 0.8 },
    { freq: 369.99, delay: 0.12, dur: 0.8 },
    { freq: 440.00, delay: 0.24, dur: 0.9 },
    { freq: 587.33, delay: 0.36, dur: 1.4 },
  ];

  notes.forEach(({ freq, delay, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.linearRampToValueAtTime(0.22, now + delay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

    // Subtle overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now + delay);
    gain2.gain.setValueAtTime(0.0001, now + delay);
    gain2.gain.linearRampToValueAtTime(0.08, now + delay + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur * 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(now + delay);
    osc2.start(now + delay);
    osc.stop(now + delay + dur + 0.05);
    osc2.stop(now + delay + dur + 0.05);
  });
}

export function playTimeoutPuffSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.33);
}
```

- [ ] **Step 2: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 1**
```bash
git add src/utils/bombAudio.ts
git commit -m "feat(audio): add synthesized audio engine for bomb defusal cinematic"
```

---

### Task 2: Cable Physics & Blade Swipe Canvas (`src/components/unit3-bomb/CablePhysicsCanvas.tsx`)

**Files:**
- Create: `src/components/unit3-bomb/types.ts`
- Create: `src/components/unit3-bomb/CablePhysicsCanvas.tsx`

**Interfaces:**
- Produces `BombCable`:
  ```typescript
  export interface BombCable {
    id: number;
    color: string;
    glowColor: string;
    label: string;
    isCut: boolean;
    cutTime?: number;
    cutX?: number;
    cutY?: number;
    leftCurve?: { p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number]; vy: number };
    rightCurve?: { p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number]; vy: number };
  }
  ```
- Component `CablePhysicsCanvas`:
  ```typescript
  interface CablePhysicsCanvasProps {
    cables: BombCable[];
    onCableSliceAttempt: (cableIndex: number, cutCoord: { x: number; y: number }) => void;
    activeScannerX: number; // 0 to 1 normalized laser scanning position
    disabled: boolean;
  }
  ```

- [ ] **Step 1: Create `src/components/unit3-bomb/types.ts`**
Define cable data structures, state machine types (`BombCinematicState`), and laser scanning parameters.

- [ ] **Step 2: Create `src/components/unit3-bomb/CablePhysicsCanvas.tsx`**
Implement:
1. `pointerdown`, `pointermove`, `pointerup`, `pointercancel` tracking swipe coordinates.
2. Blade trail drawing with fading gradient (`#e0f2fe` to `#38bdf8`) and particle sparks (`#fef08a`).
3. 4 tensioned Bézier curves across the width:
   - Blue (Top): cyan neon (`#00f2fe`)
   - Red (Mid-high): crimson (`#ef4444`)
   - Yellow (Mid-low): electric yellow (`#eab308`)
   - Purple (Bottom Master): deep violet/purple (`#a855f7`)
4. Line intersection test between last pointer segment $(p_a, p_b)$ and cable curve.
5. De Casteljau split at intersection point with damped gravity and recoil drop physics for severed halves.

- [ ] **Step 3: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 2**
```bash
git add src/components/unit3-bomb/types.ts src/components/unit3-bomb/CablePhysicsCanvas.tsx
git commit -m "feat(cinematic): implement Fruit Ninja blade canvas and Bézier cable physics"
```

---

### Task 3: 3D Tactical Briefcase & HUD Components (`src/components/unit3-bomb/TacticalBriefcase.tsx`)

**Files:**
- Create: `src/components/unit3-bomb/TacticalBriefcase.tsx`

**Interfaces:**
- Produces `TacticalBriefcase`:
  ```typescript
  interface TacticalBriefcaseProps {
    timeLeftMs: number;
    cables: BombCable[];
    scannerProgress: number; // 0 to 1 beat scanner cycle
    screenShake: boolean;
    isSlowMoFrozen: boolean;
    children?: React.ReactNode; // CablePhysicsCanvas passed as child
  }
  ```

- [ ] **Step 1: Implement `src/components/unit3-bomb/TacticalBriefcase.tsx`**
Includes:
1. Heavy industrial spy briefcase shell (graphite `#111317`, titanium corner brackets, hex bolts, metallic bevels).
2. 7-segment digital display rendering `00:SS.cc` with intense red glow (`#ef4444`).
3. 4 status LED indicators: red blinking when cable intact, solid emerald green (`#10b981`) when defused.
4. Vertical rhythmic beat laser: emerald/cyan neon scanning line (`rgba(34, 197, 94, 0.8)`) oscillating horizontally with sinusoidal sweep across the 4 cables synchronized to the 120 BPM tempo.
5. CSS screen shake class during penalty states.

- [ ] **Step 2: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 3**
```bash
git add src/components/unit3-bomb/TacticalBriefcase.tsx
git commit -m "feat(cinematic): build 3D tactical briefcase shell with 7-segment clock and beat laser"
```

---

### Task 4: Armored Hatch, Pneumatic Steam & Golden Drum Trophy (`src/components/unit3-bomb/TrophyReveal.tsx`)

**Files:**
- Create: `src/components/unit3-bomb/TrophyReveal.tsx`

**Interfaces:**
- Produces `TrophyReveal`:
  ```typescript
  interface TrophyRevealProps {
    state: 'UNLATCHING' | 'TROPHY_REVEAL' | 'TIMEOUT_PUFF';
    onContinue: () => void;
    onRetry: () => void;
  }
  ```

- [ ] **Step 1: Implement `src/components/unit3-bomb/TrophyReveal.tsx`**
Includes:
1. Armored hatch door with hazard warning stripes (`repeating-linear-gradient(45deg, #eab308 0 12px, #18181b 12px 24px)`), sliding upward on release.
2. Dual lateral pneumatic steam exhaust vents with expanding white particle mist.
3. 3D Golden Trophy with crossed drumsticks and Lucide `Drum` icon:
   - Rendered with metallic gold gradient (`linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)`).
   - Radial rotating light rays and smooth floating levitation ($\pm 6\text{px}$).
   - Text banner: "UNIDAD 3 COMPLETADA: TEMPO Y COORDINACIÓN".
   - Gold and silver confetti burst using `canvas-confetti`.
   - "Continuar a la Unidad 4: Expresión, Dicción y Estilo" button.
4. Timeout failure view:
   - Harmless cartoon smoke cloud puff with expanding gray circles.
   - Text: "¡Tiempo agotado! El circuito se bloqueó sin peligro."
   - "Reintentar Desactivación" button.

- [ ] **Step 2: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 4**
```bash
git add src/components/unit3-bomb/TrophyReveal.tsx
git commit -m "feat(cinematic): add armored hatch opening, pneumatic steam, and golden drum trophy"
```

---

### Task 5: Modal Orchestrator (`src/components/Unit3CelebrationModal.tsx`)

**Files:**
- Create: `src/components/Unit3CelebrationModal.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface Unit3CelebrationModalProps {
    isOpen: boolean;
    onContinue: () => void;
    initialBpm?: number; // default 120
    isMuted?: boolean;
    debugForceVictory?: boolean;
    debugForceTimeout?: boolean;
  }
  export const Unit3CelebrationModal: React.FC<Unit3CelebrationModalProps>;
  ```

- [ ] **Step 1: Implement `src/components/Unit3CelebrationModal.tsx`**
Coordinates:
1. `requestAnimationFrame` countdown clock from `00:08.00` down to `00:00.00`.
2. Metronome phase tracking at 120 BPM ($500\text{ms}$ per cycle).
3. Hit-window evaluation on cable slice:
   - Difference to nearest beat pulse $\le 120\text{ms}$ -> Success! Cuts cable, plays `playSnipRelaySound()`.
   - Difference $> 120\text{ms}$ -> Penalty! Plays `playCircuitBuzzSound()`, shakes screen, deducts 1.00s.
4. 4th cable cut on beat -> Freeze clock in slow-motion at `00:01.00`, transition `DEFUSED_SLOWMO` -> `PNEUMATIC_RELEASE` (`playPneumaticReleaseSound()`) -> `HATCH_OPENING` -> `TROPHY_REVEAL` (`playVictoryFanfare()`).
5. Timeout at `00:00.00` -> Transition `TIMEOUT_PUFF` (`playTimeoutPuffSound()`).
6. Clean reset on open or retry.

- [ ] **Step 2: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 5**
```bash
git add src/components/Unit3CelebrationModal.tsx
git commit -m "feat(cinematic): orchestrate Unit 3 bomb defusal celebration modal"
```

---

### Task 6: Dedicated Sandbox Page (`src/app/sandbox/unit3/page.tsx`)

**Files:**
- Create: `src/app/sandbox/unit3/page.tsx`

**Interfaces:**
- Produces interactive test page at `/sandbox/unit3` with:
  - Open/Close modal button.
  - Telemetry bar (active state, BPM slider 60-160, mute toggle, force victory, force timeout).
  - Live stats panel showing offset ms of last cut and hit accuracy rating.

- [ ] **Step 1: Implement `src/app/sandbox/unit3/page.tsx`**
Create clean sandbox page following the design of `/sandbox/unit2` and `/sandbox/unit`.

- [ ] **Step 2: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 6**
```bash
git add src/app/sandbox/unit3/page.tsx
git commit -m "feat(sandbox): add interactive sandbox page for Unit 3 cinematic at /sandbox/unit3"
```

---

### Task 7: Integration in `MainApp.tsx` & End-to-End Visual Verification

**Files:**
- Modify: `src/components/MainApp.tsx`

**Interfaces:**
- Consumes `Unit3CelebrationModal`:
  - Dynamically imported with `dynamic(() => import('./Unit3CelebrationModal').then(m => m.Unit3CelebrationModal), { ssr: false })`
  - Triggered on completion of `u3-node28.5` (or when `targetUnit?.id === 3 && targetNode?.type === 'exam'`).
  - `handleContinueToUnit4`: marks Unit 3 as completed, unlocks Unit 4, starts unlock animation.

- [ ] **Step 1: Connect `Unit3CelebrationModal` into `MainApp.tsx`**
Add state `showUnit3Celebration`, condition `isLastNodeOfUnit3`, handler `handleContinueToUnit4`, and modal render.

- [ ] **Step 2: Typecheck verification**
Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Headless Chrome CDP Verification Script**
Create and run a script to navigate to `http://localhost:9002/sandbox/unit3`, open the modal, simulate swipes, test victory trigger, and save screenshots:
- `scratch/unit3_bomb_defusing.png`
- `scratch/unit3_bomb_victory.png`

- [ ] **Step 4: Update `walkthrough.md` with visual evidence**
Embed screenshots and verification results.

- [ ] **Step 5: Commit Task 7**
```bash
git add src/components/MainApp.tsx
git commit -m "feat: integrate Unit 3 bomb defusal cinematic and transition to Unit 4"
```
