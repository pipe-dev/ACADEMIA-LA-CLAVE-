# Copa Cristal Unidad 2 - Rotación 3D en Eje Y & Refracción Óptica Sedosa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a smooth 3D Y-axis rotation and silky-smooth optical background distortion for the Unit 2 crystal celebration glass, eliminating rough vector lines and scaling distortion with rotation angle.

**Architecture:** Add CSS 3D keyframe animations for Y-axis rotation and light shifts, refine `Unit2CelebrationModal.tsx` to wrap the glass in a 3D perspective container, update the SVG internal refraction with soft diffuse gaussian layers, and sync the ground shadow.

**Tech Stack:** React, Next.js (Turbopack), Tailwind CSS, SVG (Filters & Gradients), Web Audio API (`audioService`).

## Global Constraints
- Perserve all audioService microphone polling, volume detection threshold, and 4.5s sustained note progression.
- Keep fracture stages (30% hairline, 60% spiderweb, 85% critical failure) and shatter explosion at 100%.
- Maintain 3D tactile button styling and responsive layout.

---

### Task 1: CSS 3D Keyframe Animations in `globals.css`

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces CSS classes: `.animate-luxury-rotate-y`, `.animate-caustic-rotate-shift`, `.animate-luxury-shadow-sync`, `.animate-refraction-angle-shift`.

- [ ] **Step 1: Inspect and append keyframe animations**
Define:
```css
@keyframes luxuryRotateY {
  0%, 100% {
    transform: perspective(1000px) rotateY(-18deg) translateY(0px);
  }
  50% {
    transform: perspective(1000px) rotateY(18deg) translateY(-6px);
  }
}

.animate-luxury-rotate-y {
  transform-style: preserve-3d;
  animation: luxuryRotateY 6.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

@keyframes causticRotateShift {
  0%, 100% {
    transform: translateX(-4px);
    opacity: 0.65;
  }
  50% {
    transform: translateX(5px);
    opacity: 0.92;
  }
}

.animate-caustic-rotate-shift {
  animation: causticRotateShift 6.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

@keyframes luxuryShadowSync {
  0%, 100% {
    transform: scaleX(0.92) scaleY(0.95);
    opacity: 0.70;
  }
  50% {
    transform: scaleX(1.08) scaleY(1.02);
    opacity: 0.52;
  }
}

.animate-luxury-shadow-sync {
  transform-origin: 100px 282px;
  animation: luxuryShadowSync 6.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

@keyframes refractionAngleShift {
  0%, 100% {
    transform: scaleX(1.18) scaleY(1.08);
    opacity: 0.55;
  }
  50% {
    transform: scaleX(0.98) scaleY(1.0);
    opacity: 0.35;
  }
}

.animate-refraction-angle-shift {
  transform-origin: 100px 110px;
  animation: refractionAngleShift 6.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}
```

- [ ] **Step 2: Save and verify syntax in `globals.css`**
Check no syntax errors in CSS.

- [ ] **Step 3: Commit**
```bash
git add src/app/globals.css
git commit -m "style: add 3D Y-axis rotation and refraction shift keyframe animations"
```

---

### Task 2: Implement 3D Rotation & Silky Refraction in `Unit2CelebrationModal.tsx`

**Files:**
- Modify: `src/components/Unit2CelebrationModal.tsx`

**Interfaces:**
- Consumes: CSS animation classes from `globals.css`.
- Preserves: `Unit2CelebrationModalProps`, `handleStart`, microphone volume polling, fracture cracking overlay, and continue button.

- [ ] **Step 1: Update SVG defs with silky refraction blur filter**
Ensure filter `#silkyRefraction` with `feGaussianBlur stdDeviation="1.2"` and soft cyan refraction gradient are present.

- [ ] **Step 2: Replace harsh interior grid vectors with soft, diffused optical refraction**
Inside `<g clipPath="url(#bowlInteriorClip)">`:
Apply a soft, continuous, diffuse refraction layer that gently bends the background grid and scales dynamically using `.animate-refraction-angle-shift`.

- [ ] **Step 3: Wrap glass structure in `.animate-luxury-rotate-y`**
Anchor the floor shadow with `.animate-luxury-shadow-sync`, and wrap the upper floating glass structure in `.animate-luxury-rotate-y`.

- [ ] **Step 4: Attach `.animate-caustic-rotate-shift` to the specular glares**
The left studio glare smoothly tracks the rotation in realistic counterpoint.

- [ ] **Step 5: Run typecheck to verify build integrity**
```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**
```bash
git add src/components/Unit2CelebrationModal.tsx
git commit -m "feat: implement 3D Y-axis rotation and silky background refraction on Unit 2 crystal glass"
```

---

### Task 3: Verification & Visual Smoke Test

**Files:**
- Test via: `src/app/sandbox/unit2/page.tsx`

- [ ] **Step 1: Check background dev server and cloudflared tunnel**
Ensure port 9002 is active and tunnel `https://alarm-while-nascar-flood.trycloudflare.com/sandbox/unit2` is responsive.

- [ ] **Step 2: Test microphone interaction and rotation stability**
Confirm glass rotates smoothly without jitter, distortion increases gracefully with rotation, voice detection still fills the progress bar, cracks appear at 30%/60%/85%, and shattering triggers successfully.
