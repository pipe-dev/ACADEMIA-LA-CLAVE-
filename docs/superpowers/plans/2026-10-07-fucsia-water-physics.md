# Fucsia Water Physics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a continuous water-like undulation effect on the Fucsia character using SVG displacement filters and GSAP attr animations.

**Architecture:** Inject a hidden SVG filter with `<feTurbulence>` and `<feDisplacementMap>` into the component, apply it via CSS `filter: url(#water-filter)` to the `.fuchsia-char` container, and animate the filter attributes continuously using a looping GSAP timeline.

**Tech Stack:** React, CSS Modules, GSAP (attr plugin)

## Global Constraints

- < 500 lines per file — strictly enforced.
- Zero emojis in all code, responses, UI text, and commit messages.
- Zero use of Sparkles icon from lucide-react.
- Must run `npm run typecheck` after every code change.
- No dev servers, no tunnels, no test runners (only do what is asked).

---

### Task 1: Add SVG Filter to Character Component

**Files:**
- Modify: `src/components/sandbox/CuteCharacterFucsia.tsx`

**Interfaces:**
- Produces: An inline SVG definition with `id="water-filter"` that can be referenced by CSS.

- [ ] **Step 1: Inject SVG Definition**

Modify `CuteCharacterFucsia.tsx` to include the hidden SVG filter inside the `charBody` variable, right before `.fuchsia-body`.

```tsx
  const charBody = (
    <div className={styles['fuchsia-char']}>
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="water-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence id="water-turbulence" type="fractalNoise" baseFrequency="0.015" numOctaves="1" result="noise" />
          <feDisplacementMap id="water-displacement" in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className={styles['fuchsia-body']}>
// ... rest of the slices
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/sandbox/CuteCharacterFucsia.tsx
git commit -m "feat(fucsia): inject hidden SVG water displacement filter"
```

---

### Task 2: Apply Filter via CSS

**Files:**
- Modify: `src/components/sandbox/CuteCharacterFucsia.module.css`

**Interfaces:**
- Consumes: `#water-filter` from Task 1.

- [ ] **Step 1: Update CSS Class**

Add the CSS filter property to the `.fuchsia-char` class.

```css
.fuchsia-char {
  position: relative;
  width: 130px;
  height: 120px;
  will-change: transform;
  transform: translateZ(0);
  filter: url(#water-filter); /* Apply the water physics filter */
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/sandbox/CuteCharacterFucsia.module.css
git commit -m "style(fucsia): apply water filter to character container"
```

---

### Task 3: Animate the Filter with GSAP

**Files:**
- Modify: `src/components/sandbox/CuteCharacterFucsiaAnimated.tsx`

**Interfaces:**
- Consumes: The IDs `#water-displacement` and `#water-turbulence` created in Task 1.

- [ ] **Step 1: Create the Continuous Water Timeline**

In `CuteCharacterFucsiaAnimated.tsx`, add a new `useEffect` that handles the infinite water undulation animation using GSAP. The timeline will oscillate the `scale` and `baseFrequency` to simulate breathing fluid.

```tsx
  // Continuous water physics undulation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const waterTl = gsap.timeline({ repeat: -1, yoyo: true });
      
      waterTl.to("#water-displacement", {
        attr: { scale: 14 }, // Swell up the displacement
        duration: 1.5,
        ease: "sine.inOut"
      }, 0);
      
      waterTl.to("#water-turbulence", {
        attr: { baseFrequency: 0.018 }, // Subtle shift in noise frequency
        duration: 1.5,
        ease: "sine.inOut"
      }, 0);
    });

    return () => ctx.revert();
  }, []);
```

- [ ] **Step 2: Add Splash Impact to Entrance Timeline**

In the existing entrance timeline, inject a sudden displacement spike during the floor impact phase.

```tsx
// FASE 4: Impacto y rebote gelatinoso
  .set(".fucsia-motion-body", { transformOrigin: "bottom center" })
  
  // SPLASH EFFECT: Spike the displacement scale on impact
  .to("#water-displacement", {
    attr: { scale: 35 },
    duration: 0.08,
    ease: "power1.out"
  }, "<")
  .to("#water-displacement", {
    attr: { scale: 8 },
    duration: 0.8,
    ease: "elastic.out(1, 0.3)"
  }, ">")
  
  // Existing squash logic...
  .to(".fucsia-motion-body", { 
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/sandbox/CuteCharacterFucsiaAnimated.tsx
git commit -m "feat(fucsia): animate SVG water displacement with GSAP attr plugin"
```
