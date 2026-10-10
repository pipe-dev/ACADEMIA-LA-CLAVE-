# Cutelogin Slide Register & Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a smooth sliding panel transition in `/sandbox/cutelogin` that moves the login form from right to left over the blobs when clicking "Regístrate", switching to a dark mode registration form, while revealing a dark ambient branding panel on the right without a return button.

**Architecture:** Use CSS hardware-accelerated transforms (`translateX(-100%)`) with `cubic-bezier(0.16, 1, 0.3, 1)` on an overlaid sliding form container, layered over a static two-column base (left: blobs, right: dark ambient panel). Include an acoustic sliding micro-sound (`playSlideTransition`) in Web Audio API.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Web Audio API, Lucide React icons.

## Global Constraints
- Zero external MP3/WAV files (all sounds synthesized via Web Audio API).
- Strictly zero emojis in code, commits, and messages.
- Do NOT add a button on the right panel to unmask the blobs (user will define next interactions).
- Maintain outer page background in neutral tone (`bg-[#e5e9ee]`).
- Preserve all existing blob positions, tilt arc, and happy jump animations untouched.

---

### Task 1: Add `playSlideTransition` in `useJellyAsmrAudio.ts`

**Files:**
- Modify: `src/utils/useJellyAsmrAudio.ts`

**Interfaces:**
- Produces: `playSlideTransition: () => void` in `UseJellyAsmrAudioReturn`.

- [ ] **Step 1: Add method signature and implementation to `useJellyAsmrAudio.ts`**

Add `playSlideTransition: () => void` to `UseJellyAsmrAudioReturn` interface:
```typescript
export interface UseJellyAsmrAudioReturn {
  playSquish: (character: CharacterId, intensity?: number, stretch?: number) => void;
  playDroplet: (character: CharacterId, pitchMultiplier?: number) => void;
  playWinkPop: () => void;
  playValidationChime: () => void;
  playHappyHop: () => void;
  playSlideTransition: () => void;
}
```

Implement `playSlideTransition`:
```typescript
const playSlideTransition = useCallback(() => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.26;

    const noiseBuf = getPinkNoiseBuffer(ctx);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(360, now + dur);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSrc.start(now);
    noiseSrc.stop(now + dur + 0.02);
  } catch {}
}, [getAudioContext, getPinkNoiseBuffer]);
```

Export `playSlideTransition` in the return object.

- [ ] **Step 2: Run typecheck to verify interface**

Run: `npm run typecheck`  
Expected: Exit code 0.

- [ ] **Step 3: Commit Task 1**

```bash
git add src/utils/useJellyAsmrAudio.ts
git commit -m "feat(audio): add synthesized slide transition sound for form sliding"
```

---

### Task 2: Implement Sliding Layer Architecture and Dark Register Form in `page.tsx`

**Files:**
- Modify: `src/app/sandbox/cutelogin/page.tsx`

**Interfaces:**
- Consumes: `playSlideTransition` from `useJellyAsmrAudio`
- State: `isRegisterMode: boolean`, `regName`, `regEmail`, `regPassword`, `showRegPassword`

- [ ] **Step 1: Add register state and audio hook in `page.tsx`**

```typescript
const [isRegisterMode, setIsRegisterMode] = useState(false);
const [regName, setRegName] = useState('');
const [regEmail, setRegEmail] = useState('');
const [regPassword, setRegPassword] = useState('');
const [showRegPassword, setShowRegPassword] = useState(false);
const { playSlideTransition } = useJellyAsmrAudio();

const handleSwitchToRegister = (e: React.MouseEvent) => {
  e.preventDefault();
  playSlideTransition();
  setIsRegisterMode(true);
};
```

- [ ] **Step 2: Structure card layers: Static Base + Sliding Form**

In `src/app/sandbox/cutelogin/page.tsx`:
1. **Base Layer Left (z-10)**: The 50%+5px container with blobs `<CuteCharactersStatic>` (`bg-[#e9e9e9]`).
2. **Base Layer Right (z-10)**: The 50%-5px container with dark background (`bg-[#0f172a]`), subtle border, and minimal welcome branding text (`"Únete a AfinApp: el afinador inteligente para tu voz"`), with NO button to unmask the blobs.
3. **Sliding Layer (z-30)**:
   - An absolute panel placed over the right side:
   - Width: `w-[calc(50%-5px)]`, height: `h-full`, top: 0, right: 0.
   - Transition styles:
     ```tsx
     style={{
       transform: isRegisterMode ? 'translateX(-100%)' : 'translateX(0%)',
       transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), background-color 450ms ease',
     }}
     ```
   - Background: `isRegisterMode ? 'bg-[#0f172a] border-r border-slate-800' : 'bg-white'`
   - Inside:
     - When `!isRegisterMode`: Displays the current clean Login form. The "Regístrate" link triggers `handleSwitchToRegister`.
     - When `isRegisterMode`: Displays the Dark Register form with Nombre, Correo, Contraseña, and "Crear cuenta" submit button.

- [ ] **Step 3: Run typecheck to verify component compilation**

Run: `npm run typecheck`  
Expected: Exit code 0.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/app/sandbox/cutelogin/page.tsx
git commit -m "feat(cutelogin): implement slide register transition covering blobs in dark mode"
```

---

### Task 3: Verification & Visual Polish

**Files:**
- Modify: `src/app/sandbox/cutelogin/page.tsx` (if any micro-adjustments to padding or responsive scaling are needed)

- [ ] **Step 1: Verify TypeScript compilation**

Run: `npm run typecheck`  
Expected: Exit code 0.

- [ ] **Step 2: Verify HTTP server response**

Run: `curl.exe -I http://localhost:9002/sandbox/cutelogin`  
Expected: HTTP/1.1 200 OK.

- [ ] **Step 3: Commit any final polish and update walkthrough**

```bash
git add docs/
git commit -m "docs(cutelogin): document slide register transition and dark mode verification"
```
