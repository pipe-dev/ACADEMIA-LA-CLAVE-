# Fucsia Intro Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the GSAP Timeline intro animation for the Fucsia character with decoupled matrix transforms (GPU composited, zero-paint) and tactile physics.

**Architecture:** Two decoupled wrapper containers (`fucsia-motion-carrier` for spatial trajectory x/y and `fucsia-motion-body` for rotation/squash-stretch) host the existing `CuteCharacterFucsia` component without altering its clay aesthetics. A GSAP timeline choreographs the upside-down pendulum swing, accelerated free fall with stretch, and ground contact with elastic settle and shadow reaction.

**Tech Stack:** Next.js, React 18, TypeScript, Tailwind CSS, GSAP (`gsap`).

## Global Constraints

- Zero emojis in all code, comments, UI text, and commit messages.
- Files strictly under 500 lines.
- Zero Sparkles icon imports or usage.
- Animate only matrix transforms: `x`, `y`, `rotation`, `scaleX`, `scaleY`, `opacity`. No layout or paint properties.
- Strictly preserve existing clay textures, gradients, and inset box-shadows.

---

### Task 1: CSS Composited Layers and Motion Classes

**Files:**
- Modify: `src/components/sandbox/CuteCharacterFucsia.module.css`

**Interfaces:**
- Produces: CSS classes `.carrier`, `.bodyMotion`, and GPU hardware acceleration hints on `.fuchsia-char`.

- [ ] **Step 1: Add GPU compositing hints and motion classes to module CSS**

In `src/components/sandbox/CuteCharacterFucsia.module.css`, add composition layer isolation and motion wrapper helper classes:

```css
/* Compositing layer isolation for 60-120 FPS zero-paint transforms */
.fuchsia-char {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.carrier {
  position: relative;
  will-change: transform;
}

.bodyMotion {
  position: relative;
  will-change: transform;
}
```

- [ ] **Step 2: Commit Task 1 changes**

```bash
git add src/components/sandbox/CuteCharacterFucsia.module.css
git commit -m "feat(sandbox): add gpu layer isolation and motion classes for fucsia character"
```

---

### Task 2: Decoupled Animated Wrapper Component (`CuteCharacterFucsiaAnimated.tsx`)

**Files:**
- Create: `src/components/sandbox/CuteCharacterFucsiaAnimated.tsx`

**Interfaces:**
- Consumes: `<CuteCharacterFucsia />` from `./CuteCharacterFucsia`
- Produces: Exported component `CuteCharacterFucsiaAnimated` with optional `onComplete` callback and ref forward / replay support.

- [ ] **Step 1: Create `CuteCharacterFucsiaAnimated.tsx` with GSAP timeline**

```tsx
'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import { CuteCharacterFucsia } from './CuteCharacterFucsia';
import styles from './CuteCharacterFucsia.module.css';

export interface CuteCharacterFucsiaAnimatedRef {
  replay: () => void;
}

interface CuteCharacterFucsiaAnimatedProps {
  autoPlay?: boolean;
  onComplete?: () => void;
}

export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>(({ autoPlay = true, onComplete }, ref) => {
  const carrierRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const shadowContactRef = useRef<HTMLDivElement>(null);
  const shadowAmbientRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const buildTimeline = () => {
    if (!carrierRef.current || !bodyRef.current) return null;

    const carrier = carrierRef.current;
    const body = bodyRef.current;
    const shadowContact = shadowContactRef.current;
    const shadowAmbient = shadowAmbientRef.current;

    const tl = gsap.timeline({
      paused: !autoPlay,
      onComplete,
    });

    // Estado inicial: arriba a la derecha, invertido 180 deg (de cabeza)
    tl.set(carrier, { x: 110, y: -280 })
      .set(body, { rotation: 180, transformOrigin: 'top center', scaleX: 1, scaleY: 1 })
      .set(shadowContact, { scaleX: 0.3, opacity: 0.08 })
      .set(shadowAmbient, { scaleX: 0.3, opacity: 0.05 })

      // FASE 1: Balanceo pendular de entrada (derecha a izquierda)
      .to(carrier, { x: -50, duration: 0.65, ease: 'sine.inOut' })
      .to(body, { rotation: 162, duration: 0.65, ease: 'sine.inOut' }, '<')

      // FASE 2: Retorno pendular y preparacion de soltado (izquierda a derecha)
      .to(carrier, { x: 0, duration: 0.55, ease: 'sine.inOut' })
      .to(body, { rotation: 195, duration: 0.55, ease: 'sine.inOut' }, '<')

      // FASE 3: Desprendimiento, caida balistica acelerada y estiramiento en aire
      .set(body, { transformOrigin: 'center center' })
      .to(carrier, { y: 0, duration: 0.40, ease: 'power3.in' })
      .to(body, { rotation: 360, duration: 0.40, ease: 'power1.inOut' }, '<')
      .to(body, { scaleY: 1.14, scaleX: 0.88, duration: 0.14, ease: 'power2.in' }, '-=0.14')
      .to(shadowContact, { scaleX: 0.8, opacity: 0.25, duration: 0.20, ease: 'power2.in' }, '-=0.20')

      // FASE 4: Contacto en suelo, Squash elastico y disipacion procedural
      .set(body, { transformOrigin: 'bottom center' })
      .to(body, { scaleY: 0.76, scaleX: 1.22, duration: 0.08, ease: 'power2.out' })
      .to(shadowContact, { scaleX: 1.25, opacity: 0.45, duration: 0.08, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.15, opacity: 0.22, duration: 0.08, ease: 'power2.out' }, '<')
      .to(body, { scaleY: 1.0, scaleX: 1.0, duration: 0.48, ease: 'elastic.out(1.2, 0.35)' })
      .to(shadowContact, { scaleX: 1.0, opacity: 0.35, duration: 0.48, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.48, ease: 'power2.out' }, '<');

    return tl;
  };

  useEffect(() => {
    timelineRef.current = buildTimeline();

    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    replay: () => {
      if (timelineRef.current) {
        timelineRef.current.restart();
      }
    },
  }));

  return (
    <div className={styles.stage}>
      <div ref={shadowAmbientRef} className={styles['shadow-ambient']} />
      <div ref={shadowContactRef} className={styles['shadow-contact']} />

      <div ref={carrierRef} className={styles.carrier}>
        <div ref={bodyRef} className={styles.bodyMotion}>
          <CuteCharacterFucsia showShadows={false} />
        </div>
      </div>
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
```

- [ ] **Step 2: Update `CuteCharacterFucsia.tsx` to support `showShadows` prop**

In `src/components/sandbox/CuteCharacterFucsia.tsx`, allow `showShadows = true` by default so the animated wrapper can independently manipulate ground shadows:

```tsx
'use client';

import React from 'react';
import styles from './CuteCharacterFucsia.module.css';

export interface CuteCharacterFucsiaProps {
  showShadows?: boolean;
}

export const CuteCharacterFucsia: React.FC<CuteCharacterFucsiaProps> = ({
  showShadows = true,
}) => {
  return (
    <div className={styles.stage}>
      {showShadows && (
        <>
          <div className={styles['shadow-ambient']}></div>
          <div className={styles['shadow-contact']}></div>
        </>
      )}

      <div className={styles['fuchsia-char']}>
        <div className={styles.face}>
          <div className={styles.eyes}>
            <div className={styles.eye}>
              <div className={styles.pupil}></div>
            </div>
            <div className={styles.eye}>
              <div className={styles.pupil}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit Task 2 changes**

```bash
git add src/components/sandbox/CuteCharacterFucsiaAnimated.tsx src/components/sandbox/CuteCharacterFucsia.tsx
git commit -m "feat(sandbox): implement decoupled gsap intro animation for fucsia character"
```

---

### Task 3: Integration and Replay Control in CuteCharactersStatic and Sandbox Page

**Files:**
- Modify: `src/components/sandbox/CuteCharactersStatic.tsx`
- Modify: `src/app/sandbox/cutelogin/page.tsx`

**Interfaces:**
- Consumes: `<CuteCharacterFucsiaAnimated ref={fucsiaRef} />`
- Produces: Replay trigger button in sandbox view.

- [ ] **Step 1: Integrate animated Fucsia in `CuteCharactersStatic.tsx`**

Allow an optional `animateFucsia?: boolean` and ref forwarding in `CuteCharactersStatic.tsx`:

```tsx
// In CHARACTER_SLOTS definition:
{
  left: 294,
  zIndex: 20,
  scale: 1,
  origin: 'bottom left',
  character: <CuteCharacterFucsiaAnimated ref={fucsiaRef} />,
}
```

- [ ] **Step 2: Add floating 'Repetir animacion' button in `src/app/sandbox/cutelogin/page.tsx`**

Add a neat, non-intrusive floating button at the top/bottom of the characters column in `cutelogin/page.tsx` that calls `fucsiaRef.current?.replay()`.

- [ ] **Step 3: Commit Task 3 changes**

```bash
git add src/components/sandbox/CuteCharactersStatic.tsx src/app/sandbox/cutelogin/page.tsx
git commit -m "feat(sandbox): integrate animated fucsia character with sandbox replay control"
```

---

### Task 4: Typecheck and Verification

**Files:**
- Check: All modified project files

- [ ] **Step 1: Run typecheck to verify zero TypeScript errors**

Run: `npm run typecheck`
Expected: Output indicates `exit code 0` with zero diagnostic errors.

- [ ] **Step 2: Verify git status and line constraints**

Check that all modified/created files are strictly under 500 lines.

```bash
git status
```
