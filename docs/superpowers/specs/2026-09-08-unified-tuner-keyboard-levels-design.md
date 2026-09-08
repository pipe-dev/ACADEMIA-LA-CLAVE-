# Design Spec: Unified Tuner & Keyboard Layout (Modo Libre & Modo Niveles)

**Date:** 2026-09-08  
**Status:** Approved by User (Brainstorming Phase)  
**File Target:** `src/components/AfinadorView.tsx`

---

## 1. Problem Statement & User Pain Points
In the current application, entering a level (`tunerMode === 'niveles'`) creates several UX/UI issues:
1. **Redundant Top Bar:** A card displaying `[Fácil • Nivel X ▾]  ❤️❤️❤️❤️❤️  ✕` is rendered above the tuner. The global header already displays the user's lives (`5 ❤️`), making this row 100% duplicate and consuming ~55px of vertical screen height.
2. **Keyboard Disappears:** The tactile piano touch strip is swapped out for a completely different card with oversized horizontal cards (`[Sol Oct 2] [Sol# Oct 3]...`) and duplicate buttons (`Activar Micrófono`, `Niveles`, `Salir`). This breaks muscle memory, visually distorts the layout, and forces the content to overflow behind the bottom navigation bar.
3. **Lack of Visual Synergy:** The tuner and piano should always act as a unified instrument pair, whether practicing freely or completing structured level challenges.

---

## 2. Core Objectives
1. **Eliminate All Redundancies:**
   - Remove the duplicate top bar with hearts and level selector.
   - Remove the separate horizontal notes strip card and duplicate action buttons.
2. **Standard Unified Piano Keyboard:**
   - The piano touch strip (7 natural keys + 5 sharp keys) remains permanently visible in both Modo Libre and Modo Niveles.
   - Zero layout shifts when starting, playing, or exiting a level.
3. **Interactive Sequence Illumination & Inactive Dimming:**
   - **Inactive notes (not in the level):** Dimmed and grayed out (`opacity-35 grayscale`), giving immediate visual clarity on which notes belong to the challenge.
   - **Active target note to sing:** Bright, illuminated, pulsing ring/glow with its step number or highlight.
   - **Completed notes in the sequence:** Accentuated with a subtle green checkmark (`✓`) or emerald glow.
   - **Tapping any level note:** Instantly plays the real human voice reference audio.
4. **Ultra-Compact Progress Indicator:**
   - Render minimalist dot progress in the Afinador card header: `● ● ○ ○ ○ · Nota 2 de 5`.
5. **Zero-Scroll Single-Screen Fit:**
   - Both modules (**Afinador Vocal** + **Teclado Vocal**) fit 100% simultaneously on a mobile viewport without vertical scrolling or overlap with the bottom navigation bar.

---

## 3. UI Component Specifications

### 3.1 Header of Afinador Vocal Card
* **Left:**
  - In Modo Libre: `Afinador Vocal`
  - In Modo Niveles: `Desafío: ${activeTargetNote.name}` with a compact badge `Nv. ${currentLevel}`.
* **Right:**
  - `[🔊 Escuchar]` (plays target note's real human voice).
  - In Modo Niveles: A compact `[✕ Salir]` button to exit cleanly back to Modo Libre.
* **Subtitle Row:**
  - In Modo Libre: `Activa el micrófono abajo para evaluar tu voz` (or live pitch feedback).
  - In Modo Niveles: Minimalist dots progress:
    ```tsx
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <span className="flex items-center gap-1">
        {challengeNotes.map((_, idx) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${
              idx < challengeIndex
                ? 'bg-emerald-500'
                : idx === challengeIndex
                ? 'bg-indigo-600 dark:bg-indigo-400 scale-125'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          />
        ))}
      </span>
      <span>· Nota {challengeIndex + 1} de {challengeNotes.length}</span>
    </div>
    ```

### 3.2 Standard Piano Touch Strip (Unified)
The piano strip renders the exact 7 white + 5 black keys in both modes.

#### Note State Logic in Modo Niveles:
For each note `n` on the keyboard:
* `isInChallenge`: `challengeNotes.some(cn => cn.name.toUpperCase() === n.name.toUpperCase())`
* `isCurrentTarget`: `activeTargetNote.name.toUpperCase() === n.name.toUpperCase()`
* `isCompleted`: `completedChallengeNotes.has(challengeIndex)` for this note or prior steps.
* `isUnused`: `tunerMode === 'niveles' && !isInChallenge`

#### Visual Styling per Note State:
* **Unused Notes (`isUnused`):**
  - White keys: `opacity-35 bg-slate-100 dark:bg-[#0c1624] text-slate-400 dark:text-slate-600 border-slate-200/50 shadow-none`
  - Black keys: `opacity-30 bg-slate-800/60 dark:bg-[#060b13] text-slate-500 border-transparent shadow-none`
* **Current Target Note (`isCurrentTarget`):**
  - White keys: `bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80`
  - Black keys: `bg-gradient-to-b from-violet-500 to-purple-700 text-white border-violet-400 shadow-[0_3px_0_0_#3b0764] ring-2 ring-violet-300 scale-105 z-20`
* **Completed Notes (`isCompleted`):**
  - Subtle emerald indicator badge or small `✓` checkmark.
* **In Challenge (Upcoming):**
  - Fully opaque, crisp text, subtle accent dot indicating it is part of the song/challenge.

### 3.3 Bottom Controls (Preserved Hierarchy)
* Mode selector pill: `Fácil (±15Hz) | Medio (±8Hz) | Difícil (±4Hz)` (opens `TunerLevelSelectModal` when clicked).
* Centered activate mic button: `max-w-[210px]`, `rounded-full`, compact padding.

---

## 4. State & Transition Logic
* **Starting a Level (`startLevel`):**
  - Sets `tunerMode = 'niveles'`, sets `currentLevel`, generates `challengeNotes`, sets `challengeIndex = 0`.
  - Does NOT swap cards or unmount the piano.
  - Automatically targets `challengeNotes[0]`.
* **Exiting a Level (`onExit` / `✕ Salir`):**
  - Calls `audioService.stopMicrophone()`.
  - Sets `tunerMode = 'libre'`.
  - Restores selected note to current free-play target.
* **Completing a Note (`handleNoteCompletedInChallenge`):**
  - Plays completion chime, records progress, increments `challengeIndex`.
  - Piano immediately transitions the glowing illumination to the new target key.
* **Level Victory (`handleLevelVictory`):**
  - Opens `TunerWinModal` with stars, confeti, and XP.

---

## 5. Verification Plan
* `npx tsc --noEmit` must pass with 0 errors.
* Verify Modo Libre in mobile view: both cards fit on screen without vertical scroll.
* Enter a level: layout remains identical, unused keys become dimmed/grayed out, active key glows.
* Verify audio playback on key tap.
* Complete level sequence and verify smooth transition to victory modal.
