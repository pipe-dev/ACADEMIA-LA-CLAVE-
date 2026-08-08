# Design Specification: Full-Screen Unit Completion Celebration Experience

**Date:** 2026-08-08  
**Feature:** Ultra-Satisfactory 4-Act Full-Screen Unit Mastery Celebration  
**Target:** `AfinApp` (La Clave)  

---

## 1. Overview & Goal

Provide an epic, highly interactive, full-screen dopamine-inducing celebration experience when a user completes a Unit's final evaluation exam for the first time. The feature replaces small modals with an immersive, game-like experience complete with a press-and-hold energy orb, particle explosions, high-contrast neon aesthetics, Web Audio API sound synthesis, and automated map progression to the next unlocked Unit.

---

## 2. Core User Experience & 4-Act Flow

The experience is encapsulated in a full-screen overlay component: `src/components/UnitCompletionCelebration.tsx`.

### Act 1: The Neon Power Orb (Hold to Charge)
- **Visuals:** Dark background (`#070b14`) with a hardware-accelerated 30fps canvas rendering drifting neon particles.
- **Center Piece:** A 3D pulsing glowing Orb styled with the completed Unit's theme color (`#4648d4` for Unit 1).
- **Header:** `"UNIDAD 1 CONQUISTADA"`
- **Instruction:** `"MANTÉN PRESIONADO PARA LIBERAR TU PODER VOCAL"`
- **Interaction:** User holds down touch/mouse on the Orb for 1.5 seconds.
- **Feedback:** As the charge bar fills to 100%, an ascending Web Audio synth tone (`playEnergyCharge()`) plays alongside building haptic vibration and expanding radial shockwaves.

### Act 2: Power Break & Explosive Shatter
- Upon reaching 100% hold charge:
  - **Audio:** Heavy sub-bass impact sound (`playPowerBreakImpact()`).
  - **Visuals:** The Orb shatters into a glowing emblem ring with a multi-burst neon confetti explosion.
  - **Emblem:** Unveils the Unit 1 Master Emblem with gold and neon accents.

### Act 3: Dopamine Stats & XP Cascade
- Sequential animation of achievement cards:
  - **XP Counter:** Rapid tick animation counting up to `+100 XP` with `playXpTick()` chimes.
  - **Lessons Completed:** `12 / 12 Lecciones Completadas`.
  - **Vocal Range Profile:** Displays user's saved classification (e.g. *Barítono* / *Soprano*).

### Act 4: Progression & Transition to Next Unit
- Prominent glowing CTA Button: `"¡AVANZAR A LA UNIDAD 2!"`
- **Action:** Triggers victory fanfare (`playUnitMasteryChime()`), fades out the celebration overlay, unlocks Unit 2 on `AcademiaView`, and automatically scrolls the map view to Unit 2 Node 1.

---

## 3. Activation & Persistence Rules

- **First-Time Only Rule:** The celebration screen triggers automatically **only the first time** a user completes a Unit's evaluation exam (`u1-node12.5`).
- **Persistence:** Tracked in `localStorage` under `laclave_celebrated_units` (e.g. `[1]`).
- **Subsequent Attempts:** If the user retakes the evaluation exam after having already celebrated Unit 1, they see the standard star results modal instead of the full-screen celebration.

---

## 4. Audio Synthesis Additions (`audioService.ts`)

Synthesized Web Audio API sound effects (no heavy external assets):
1. `playEnergyCharge(progress: number)`: Ascending frequency tone with frequency modulation matching hold progress.
2. `playPowerBreakImpact()`: Low-frequency sub-bass boom combined with a high-register metallic shatter chime.
3. `playXpTick()`: High-pitched rapid arcade tick sound.
4. `playUnitMasteryChime()`: Majestic polyphonic victory chord sequence.

---

## 5. Technical Architecture

- **`src/components/UnitCompletionCelebration.tsx`**
  - Full-screen `fixed inset-0 z-[100] bg-[#070b14]` overlay.
  - Hardware-accelerated particle canvas.
  - Touch & mouse press-and-hold event listeners with progress timer.
- **`src/components/LessonModal.tsx`**
  - Triggers `onShowUnitCelebration(unitId)` upon first-time completion of `isExamNode`.
- **`src/components/MainApp.tsx`**
  - Manages `activeUnitCelebration` state and passes completion callbacks to auto-unlock and focus the next unit on `AcademiaView`.

---

## 6. Verification Plan

1. Complete Unit 1 Evaluation Exam (`u1-node12.5`) for the first time.
2. Verify full-screen overlay opens with dark neon particle canvas.
3. Press and hold the central Orb: verify ascending sound and progress ring fill.
4. Release or reach 100%: verify shatter impact sound, confetti explosion, XP cascade animation, and final CTA button.
5. Click `"¡AVANZAR A LA UNIDAD 2!"`: verify smooth fade out, return to `AcademiaView`, unlock of Unit 2, and auto-scroll.
6. Retake Unit 1 Exam: verify standard results modal opens instead of repeating the full celebration.
7. Run `npx tsc --noEmit` to confirm 0 compilation errors.
