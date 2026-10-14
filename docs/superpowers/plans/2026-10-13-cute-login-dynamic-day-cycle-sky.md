# Dynamic 5-Second Day Cycle Sky Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a smooth, randomized 5-second day cycle (Day -> Sunset -> Night -> Dawn -> Day) in `AnimatedSkyBackground` for `/sandbox/cutelogin`.

**Architecture:** Procedural RGB color lerping on canvas at 60 FPS using cosine easing. The color stops are randomized within harmonious phase ranges every 5 seconds. Particles twinkle dynamically as stars during the night phase.

**Tech Stack:** React 19, TypeScript, HTML5 2D Canvas.

## Global Constraints
- Strictly ZERO emojis in all code and UI text.
- Absolutely NO screenshot commands or tests.
- Pure login card preserved with zero extra buttons.

---

### Task 1: Extend `AnimatedSkyBackground` with Procedural Day Cycle Engine

**Files:**
- Modify: `src/components/sandbox/AnimatedSkyBackground.tsx`

**Interfaces:**
- Props: `dayCycle?: boolean` (default `true`), `cycleDuration?: number` (default `5.0`).
- Mathematical functions: `lerp(a, b, t)`, `lerpColor(c1, c2, t)`, `getRandomPalette(phase)`.

- [ ] **Step 1: Define RGB and DayCycle structures**
- [ ] **Step 2: Implement randomized palette generators for 4 phases (Day, Sunset, Night, Dawn)**
- [ ] **Step 3: Connect cosine easing interpolator in canvas render loop**
- [ ] **Step 4: Adapt particle alpha and colors based on night/day phases**
- [ ] **Step 5: Verify TypeScript compilation with `npx tsc --noEmit`**

### Task 2: Verify Integration and Live Endpoints

**Files:**
- Verify: `src/app/sandbox/cutelogin/page.tsx`
- Check endpoints: `http://localhost:9005/sandbox/cutelogin` and Cloudflare tunnel.

- [ ] **Step 1: Test TypeScript build**
- [ ] **Step 2: Test HTTP status codes**
- [ ] **Step 3: Git commit changes**
