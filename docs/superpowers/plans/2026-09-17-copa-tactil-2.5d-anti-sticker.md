# Copa Cristal 2.5D - Reactividad Táctil Fisiológica (Anti-Sticker) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the 2.5D physical touch manipulation of the Unit 2 crystal wine glass so it maintains 100% full volume silhouette (never squashes like a flat sticker), maps horizontal touch drag to 360° cylindrical surface caustic wrap, and bounds 3D tilt to an elastic $\pm 10^\circ$ spring-back range.

**Architecture:** Update pointer drag handling in `Unit2CelebrationModal.tsx` to separate surface rotation angle from structural tilt, keep the main SVG container bounded within safe 3D angles, calculate caustic reflections using cylindrical periodic projection, and keep the floor shadow locked under the stem.

**Tech Stack:** React (hooks & refs), SVG (clipping & caustics), Web Audio API, TypeScript.

## Global Constraints
- Volume of the glass must never flatten: `rotateY` of the outer silhouette is locked to a subtle $\pm 5^\circ$ range or 0°.
- Surface caustics and highlights rotate 360° continuously based on finger drag using periodic trigonometric mapping.
- Tilt X and Z are bounded to $\pm 10^\circ$ and $\pm 3^\circ$ respectively, with damped harmonic spring-back upon release.
- Floor shadow remains centered at $(100, 282)$ and does not shift horizontally.
- Singing detection for 4.5s remains the only way to fracture and shatter the glass.

---

### Task 1: Refactor Touch Physics & Cylindrical Surface Mapping

**Files:**
- Modify: `src/components/Unit2CelebrationModal.tsx`

- [ ] **Step 1: Update touch tracking variables and physics loop**
Separate `surfaceAngle` (for caustics/refraction) from `tiltX` and `tiltZ` (for physical wobble).

- [ ] **Step 2: Update JSX transforms for vessel, caustics, and floor shadow**
Lock vessel `rotateY` to safe range, map caustics to cylindrical $\sin(\theta)$ trajectory, and lock floor shadow position.

- [ ] **Step 3: Run typecheck `npx tsc --noEmit`**
Verify zero compilation errors.

- [ ] **Step 4: Commit Task 1**
```bash
git add src/components/Unit2CelebrationModal.tsx
git commit -m "fix: implement 2.5D anti-sticker touch physics with cylindrical caustic wrap"
```

---

### Task 2: Verification & Smoke Test

- [ ] **Step 1: Test dragging horizontally in browser - confirm glass never flattens into a sticker**
- [ ] **Step 2: Test release - confirm smooth spring-back and return to ambient orbit**
- [ ] **Step 3: Test tap - confirm crystal chime sounds**
- [ ] **Step 4: Test singing - confirm glass shatters at 100%**
