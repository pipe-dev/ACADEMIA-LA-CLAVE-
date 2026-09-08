# Unified Tuner & Keyboard Layout (Modo Libre & Modo Niveles) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify `AfinadorView.tsx` into a consistent single-screen layout for both free and level modes by removing redundant level/hearts bars, keeping the piano touch strip permanently visible, and lighting up sequence notes while dimming unused keys.

**Architecture:** Refactor `src/components/AfinadorView.tsx` to eliminate conditional card branching. The top Afinador card integrates the level badge, exit button (`✕`), and dot-based progress indicator (`● ● ○ ○ ○`). The bottom Teclado Vocal card always renders the piano touch strip with dynamic lighting styles computed per key (current target, in-challenge, completed, or unused/dimmed).

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Motion (framer-motion), Lucide React.

## Global Constraints
- Strictly preserve all existing sound and game mechanics from `voicePlaybackService` and `tunerLevelsData`.
- Spanish language for all user-facing labels and titles.
- Both modules (**Afinador Vocal** + **Teclado Vocal**) must fit 100% on screen without vertical scrolling or overlap with the bottom navigation bar.
- Maintain the pyramid proportion: Small mic button (`max-w-[210px]`) -> Medium selector pill (`max-w-[310px]`) -> Large piano (`max-w-sm`).

---

### Task 1: Eliminate Redundant Bars & Integrate Level Controls into Afinador Header

**Files:**
- Modify: `src/components/AfinadorView.tsx:710-820`

**Interfaces:**
- Consumes: `tunerMode`, `currentLevel`, `activeTargetNote`, `challengeNotes`, `challengeIndex`, `gender`, `isTuningActive`, `toggleTuning`, `setTunerMode`
- Produces: Clean Afinador header with integrated exit button and dot progress row in level mode; zero top-bar redundancy.

- [ ] **Step 1: Remove the redundant top level bar with duplicate hearts**
Remove the conditional block `{tunerMode === 'niveles' && ( <div className="mb-2 px-3.5 py-1.5 ..."> ... </div> )}` around lines 715-758.

- [ ] **Step 2: Update Afinador card header with level badge and exit button**
In the title row of `AfinadorView.tsx` (`#tour-tuner-card` header):
- If `tunerMode === 'niveles'`:
  - Title shows `Desafío: ${activeTargetNote.name}` and an adjacent badge `Nv. ${currentLevel}`.
  - Buttons row has `[🔊 Escuchar]` and a compact `[✕ Salir]` button with `onClick={() => setTunerMode('libre')}`.
- If `tunerMode === 'libre'`:
  - Title shows `Afinador Vocal` and standard header buttons.

- [ ] **Step 3: Add minimalist dot progress indicator as subtitle**
In the subtitle row:
- If `tunerMode === 'niveles'`:
  Render `● ● ○ ○ ○ · Nota ${challengeIndex + 1} de ${challengeNotes.length}`.
- If `tunerMode === 'libre'`:
  Render the standard dynamic subtitle (`Activa el micrófono abajo para evaluar tu voz`, etc.).

- [ ] **Step 4: Verify TypeScript compilation**
Run `npx tsc --noEmit` and ensure 0 errors.

- [ ] **Step 5: Commit changes**
`git add src/components/AfinadorView.tsx`
`git commit -m "feat(tuner): integrate level badge, exit button and dot progress into header"`

---

### Task 2: Unify Teclado Vocal with Sequence Illumination & Inactive Dimming

**Files:**
- Modify: `src/components/AfinadorView.tsx:915-1130`

**Interfaces:**
- Consumes: `tunerMode`, `challengeNotes`, `challengeIndex`, `completedChallengeNotes`, `selectedNote`, `naturalNotes`, `blackKeyPositions`, `handleSelectNote`
- Produces: Permanent piano touch strip in both modes with sequence illumination and dimming of unused keys.

- [ ] **Step 1: Remove the challenge notes horizontal cards strip**
Remove the `{tunerMode === 'libre' ? ( ... ) : ( <div ...> Notas a cantar en este nivel ... </div> )}` branch. The piano container is always rendered.

- [ ] **Step 2: Compute note status flags for each piano key**
For every note rendered on the white and black keys:
```tsx
const isInChallenge = tunerMode === 'niveles' && challengeNotes.some(cn => cn.name.toUpperCase() === note.name.toUpperCase());
const isCurrentTarget = tunerMode === 'niveles' ? activeTargetNote.name.toUpperCase() === note.name.toUpperCase() : selectedNote.name === note.name;
const isCompleted = tunerMode === 'niveles' && completedChallengeNotes.has(challengeIndex);
const isUnused = tunerMode === 'niveles' && !isInChallenge;
```

- [ ] **Step 3: Apply interactive visual styles to white keys**
- If `isCurrentTarget`: Active gradient (`from-indigo-500 to-indigo-600`), white text, active ring, elevated shadow.
- If `isUnused`: Dimmed/grayed out (`opacity-35 bg-slate-100 dark:bg-[#0c1624] text-slate-400 dark:text-slate-600 border-slate-200/50 shadow-none pointer-events-none`).
- If `isInChallenge && !isCurrentTarget`: Normal white key with a small indigo dot indicator at the bottom to mark it as part of the level sequence.
- If `isCompleted`: Subtle emerald checkmark `✓` or dot.

- [ ] **Step 4: Apply interactive visual styles to black keys**
- If `isCurrentTarget`: Active gradient (`from-violet-500 to-purple-700`), white text, active ring (`ring-violet-300 scale-105 z-20`).
- If `isUnused`: Dimmed/grayed out (`opacity-30 bg-slate-800/60 dark:bg-[#060b13] text-slate-500 border-transparent shadow-none pointer-events-none`).
- If `isInChallenge && !isCurrentTarget`: Normal black key with a small violet dot indicator.
- If `isCompleted`: Subtle emerald checkmark `✓`.

- [ ] **Step 5: Verify TypeScript compilation**
Run `npx tsc --noEmit` and ensure 0 errors.

- [ ] **Step 6: Commit changes**
`git add src/components/AfinadorView.tsx`
`git commit -m "feat(tuner): unify piano strip across modes with sequence lighting and dimming"`

---

### Task 3: Verification & Mobile Viewport Polish

**Files:**
- Test: `src/components/AfinadorView.tsx`
- Document: `docs/superpowers/specs/2026-09-08-unified-tuner-keyboard-levels-design.md`
- Document: `walkthrough.md`

- [ ] **Step 1: Test Modo Libre rendering**
Verify that Modo Libre renders the complete Afinador Vocal and Teclado Vocal with proper spacing and 0 scroll on mobile dimensions.

- [ ] **Step 2: Test Modo Niveles rendering**
Trigger a level (e.g. Fácil Nivel 1). Verify:
- Top bar with hearts is gone.
- Afinador header shows `Desafío: [Nota]`, badge `Nv. 1`, `[Escuchar]`, `[✕ Salir]`.
- Subtitle shows `● ● ○ ○ ○ · Nota 1 de X`.
- Piano keys: unused keys are dimmed/grayed out; active note glows; upcoming notes show sequence dots.
- Tapping `[✕ Salir]` returns cleanly to Modo Libre with zero layout jumps.

- [ ] **Step 3: Run full TypeScript check**
Run `npx tsc --noEmit` to verify type safety.

- [ ] **Step 4: Commit and finalize walkthrough**
`git add docs/superpowers/plans/2026-09-08-unified-tuner-keyboard-levels.md`
`git commit -m "docs: finalize implementation plan for unified tuner and keyboard layout"`
