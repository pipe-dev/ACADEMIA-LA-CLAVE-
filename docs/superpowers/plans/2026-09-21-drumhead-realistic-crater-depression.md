# Realistic Drumhead Crater Deformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a realistic 3D physical depression (crater) on the drum membrane when spheres impact it, remove the unnatural upward light beam/cone artifact, preserve celebration confetti particles, and preserve the original hard dark sphere shadows.

**Architecture:** Update `DrumCanvas.tsx` dimple simulation and rendering: replace the conical projection with a multi-layered 3D depth illusion (top inner shadow, focal cavity occlusion, bottom tension highlight curve, and fast elastic recovery).

**Tech Stack:** React, HTML5 Canvas 2D API, TypeScript, Next.js.

## Global Constraints
- Do not alter the intact sphere drop shadows (`rgba(15, 23, 42, ...)`).
- Keep the confetti/celebration particles intact.
- Zero TypeScript compiler errors (`npx tsc --noEmit`).

---

### Task 1: Refactor Drum Dimple Simulation and Remove Projection Beam

**Files:**
- Modify: `src/components/unit3-rhythm/DrumCanvas.tsx:365-450`

**Interfaces:**
- Consumes: `DrumDimple` from `types.ts`, `dimplesRef`, `triggerDrumImpact`
- Produces: Hyperrealistic 3D drum membrane crater rendering without the upward beam cone

- [ ] **Step 1: Update Dimple Lifespan and Depth Dynamics**
Adjust duration to 480ms for a snappier, physical recoil bounce rather than a 1.2s lingering fade.

- [ ] **Step 2: Remove the Upward Projection Beam**
Delete the conical path and gradient block (`beamGrad`, lines 420-432) that created the upward beam.

- [ ] **Step 3: Implement 3D Anatomical Crater Lighting & Tension**
Implement:
1. Upper inner shadow (top crescent occlusion) offset slightly upwards against light source.
2. Center cavity depth gradient with realistic leather/parchment shadow tones.
3. Lower catch-light rim (specular crescent along bottom perimeter) simulating tension ridge facing the light.
4. Perimetral tension crease ring.

- [ ] **Step 4: Verify TypeScript compilation**
Run `npx tsc --noEmit` to ensure 0 errors.

- [ ] **Step 5: Commit changes**
Commit to git with message `feat(unit3): realistic 3D drum membrane crater and remove projection beam`.
