# Abyss Hole Asymmetric 3D Shadows Design

## Overview
Enhance the 3D realism, depth, and physical weight of the "Abyss Hole" container in the `AcademiaView` component by implementing directional (top-down) asymmetric inset box-shadows.

## Objectives
- Create an intense shadow drop at the top lip of the abyss hole that smoothly fades downward.
- Maintain full visual harmony between the active purple unit (Unit 1) and locked slate units (Units 2-4).
- Preserve the active purple button/node styling and animations completely intact.

## Technical Specifications

### 1. Outer Hole Container (`div` 1)
- **Active Unit (Unit 1):**
  - Shadow: `shadow-[inset_0_6px_8px_-2px_rgba(88,28,135,0.6),_inset_0_-2px_4px_rgba(255,255,255,1)]` (dark: `shadow-[inset_0_6px_8px_-2px_rgba(88,28,135,0.9),_inset_0_-2px_4px_rgba(255,255,255,0.1)]`)
- **Locked Units (Units 2-4):**
  - Shadow: `shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)]` (dark: `shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)]`)

### 2. Inner Hole / Abyss Floor (`div` 2)
- **Active Unit (Unit 1):**
  - Shadow: `shadow-[inset_0_18px_24px_-4px_rgba(40,10,70,0.85),_inset_0_6px_10px_-2px_rgba(88,28,135,0.7),_inset_0_-3px_4px_rgba(255,255,255,1)]` (dark: `shadow-[inset_0_18px_24px_-4px_rgba(0,0,0,0.95),_inset_0_6px_10px_-2px_rgba(88,28,135,0.9),_inset_0_-3px_4px_rgba(255,255,255,0.05)]`)
- **Locked Units (Units 2-4):**
  - Shadow: `shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)]` (dark: `shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)]`)

### 3. Inner Embedded Button
- **Active Unit (Unit 1):**
  - Retains exact 3D pill button styling (`bg-gradient-to-b from-[#7d7fff] via-[#4648d4] to-[#2c2e8a]`, exact shadows, and active click state).
- **Locked Units (Units 2-4):**
  - Retains exact `#dce9ff` (`dark:bg-slate-800`) base color, `btn-3d`, and subtle 3D shadow `shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)]`.

## Verification Plan
1. Inspect the top lip of Unit 1's hole to verify an intense top-down shadow gradient.
2. Inspect the top lip of locked units to verify matching neutral slate top-down shadow depth.
3. Confirm active unit button functionality and animations are completely untouched.
