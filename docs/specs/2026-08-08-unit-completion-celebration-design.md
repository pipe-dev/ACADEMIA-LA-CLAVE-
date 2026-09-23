# Specification: Unit Completion Celebration Screen ("Cyber Canto")

**Date:** 2026-08-08  
**Status:** Approved  
**Feature:** Fullscreen Interactive Dopamine Unit Master Celebration Screen  

---

## 1. Overview
When a user completes a Unit Final Exam (such as `u1-node12.5` for Unit 1) for the first time, instead of displaying a simple modal, the app transitions into a full-screen, highly interactive, dopamine-inducing cinematic experience ("Cyber Canto" aesthetics).

The experience guides the user through a 4-act interactive ceremony involving a 3D Neon Energy Orb, particle explosions, sci-fi sound effects, real-time XP counters, level-up rank reveals, and the awarding of the official 3D Unit Badge before returning to the main academy map with the next unit unlocked.

---

## 2. Triggering & Activation Rules
- **Condition:** Triggers when the user passes the Unit Exam (`isExamNode`) AND it is the **first time** completing the unit (`!isAlreadyCompleted`).
- **Retakes:** On subsequent exam retakes, the standard result modal is shown instead to prevent UI fatigue.
- **View Scope:** Full-screen overlay (`fixed inset-0 z-50 bg-slate-950 text-white overflow-hidden`).

---

## 3. Visual & Audio Aesthetics ("Neón Tech / Cyber Canto")
- **Color Theme:** Dark space (#030712) with animated aurora glows matching the unit's primary color (e.g. Indigo/Cyan `#4648d4` / `#06b6d4` for Unit 1).
- **Particles:** HTML5 Canvas particle engine rendering floating stellar dust and explosive shockwave particle bursts.
- **Sound Effects (AudioService extensions):**
  - `playOrbChargeSound()`: Rising synth frequencies while holding/charging the orb.
  - `playOrbShatterSound()`: Sub-bass boom + glass shattering effect on release.
  - `playXpTickSound()`: Rapid high-pitched arcade counter ticks.
  - `playUnitVictoryFanfare()`: Epic cyber-synth victory fanfare.

---

## 4. 4-Act Cinematic Sequence

### Act 1: The Energy Ritual (El Rito del Orbe)
- Background darkens into an animated neon aurora.
- A glowing 3D glass Orb floats in the center with pulsing particle halos.
- Interactive Prompt: *"Mantén presionado el Orbe para liberar tu energía vocal"*.

### Act 2: The Core Detonation (La Detonación Tonal)
- User holds down on the Orb. As progress reaches 100%, charge synth audio builds and vibration triggers.
- The Orb shatters into a radial shockwave, releasing confeti, chispas neón, and sub-bass audio.

### Act 3: Dopamine Level-Up & Stats Roll (Subida de Rango y XP)
- Rank Title Unlocked: **"¡NUEVO RANGO: GUARDIÁN DEL DIAFRAGMA!"**.
- Fast-ticking XP counter animation (*0 ➔ +350 XP*).
- Stat cards slide in showing Accuracy %, Singing Practice Minutes, and Perfect Streaks.

### Act 4: Badge Reveal & Progression CTA (Recompensa de Unidad)
- Official 3D Unit Master Badge descends with specular lighting and rotation effects.
- Main CTA Button: **"¡DESBLOQUEAR SIGUIENTE UNIDAD!"**.
- Clicking closes the screen and unlocks the next unit node in `AcademiaView` with camera pan and glow animations.

---

## 5. Technical Component Architecture
- **Component File:** `src/components/UnitCompletionScreen.tsx`
- **Audio Service Additions:** Extended synth/audio helpers in `src/services/audioService.ts`.
- **Integration Points:**
  - `LessonModal.tsx`: Triggers `UnitCompletionScreen` when final exam is completed.
  - `AcademiaView.tsx`: Handles transition and unlocking next unit node.
