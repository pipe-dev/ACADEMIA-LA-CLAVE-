# Cutelogin Blobs Hopping Right Caravan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the playful hopping caravan animation where the 4 blobs emerge from behind the dark login panel, hopping one by one across to the right side of the card, dissolving the right-side text, looking back towards the register form, accompanied by organic ASMR hop/droplet sounds. Remove the "AfinApp Studio" badge.

**Architecture:** Use CSS keyframe animations (`@keyframes caravanHop`) with 3 parabolic hops translating each slot by `+620px` in design space. Stagger character departure (Amarillo -> Fucsia -> Naranja -> Morado). Dissolve right-side text with delayed blur-fade transition. Synchronize audio triggers with landing moments.

**Tech Stack:** Next.js (App Router), React, CSS Modules, Tailwind CSS, Web Audio API.

## Global Constraints
- Zero external MP3/WAV files (all sounds synthesized via Web Audio API).
- Strictly zero emojis in code, commits, and messages.
- Remove the `"AfinApp Studio"` badge from the right side.
- Maintain existing blob resting base coordinates, tilt arcs, and idle animations.
- Final gaze direction when settled on right must be towards the register form (`lookX = -0.7`).

---

### Task 1: Remove Badge and Implement Text Dissolution in `page.tsx`

**Files:**
- Modify: `src/app/sandbox/cutelogin/page.tsx`

**Interfaces:**
- Pass `caravanToRight={isRegisterMode}` prop to `<CuteCharactersStatic>`.
- Remove `"AfinApp Studio"` badge.
- Apply delayed blur/fade dissolution to right-side welcome text when `isRegisterMode` is true.
- Adjust stacking context on Left Base column to `z-20` (over Column 2 `z-10`, under sliding form `z-30`).

- [ ] **Step 1: Update `page.tsx` with layout stacking, badge removal, and prop**

In `src/app/sandbox/cutelogin/page.tsx`:
1. Remove `<span ...>AfinApp Studio</span>`.
2. Wrap the right-side text in:
```tsx
<div
  className={`max-w-[340px] sm:max-w-[360px] mx-auto w-full space-y-2 sm:space-y-4 transition-all duration-700 ease-out ${
    isRegisterMode
      ? 'opacity-0 filter blur-sm -translate-y-4 pointer-events-none'
      : 'opacity-100 filter blur-0 translate-y-0'
  }`}
  style={{
    transitionDelay: isRegisterMode ? '600ms' : '0ms',
  }}
>
  <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
    Únete a AfinApp
  </h2>
  <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
    El afinador inteligente para tu voz. Descubre tu rango y entrena tu afinación en tiempo real.
  </p>
</div>
```
3. Set left column wrapper `z-20` (so blobs hopping right cross over column 2's `z-10` background).
4. Pass `caravanToRight={isRegisterMode}` to `<CuteCharactersStatic>`.

- [ ] **Step 2: Run typecheck to verify props interface**

Run: `npm run typecheck`  
Expected: May report `caravanToRight` not on props until Task 2 defines it. Proceed to Task 2.

---

### Task 2: Implement Caravan Keyframes and Audio Coordination in `CuteCharactersStatic`

**Files:**
- Modify: `src/components/sandbox/CuteCharactersStatic.module.css`
- Modify: `src/components/sandbox/CuteCharactersStatic.tsx`

**Interfaces:**
- Props: `caravanToRight?: boolean` on `CuteCharactersStaticProps`.
- CSS: `.caravanHop` with individual delays and 3 parabolic hops advancing `+620px`.
- Audio: Schedulers for `playDroplet` / `playSquish` on hop landings.
- Gaze: `lookX` set to `-0.7` when `caravanToRight` is active.

- [ ] **Step 1: Add caravan keyframes in `CuteCharactersStatic.module.css`**

Define `@keyframes caravanHop`:
```css
.caravanWrapper {
  animation: caravanMove 1.1s cubic-bezier(0.25, 0.9, 0.35, 1) var(--caravan-delay, 0s) forwards;
  transform-origin: 50% 100%;
}

@keyframes caravanMove {
  0% {
    transform: translate(0, 0) scale(1, 1);
  }
  /* Hop 1 */
  8% {
    transform: translate(30px, 4px) scale(1.12, 0.88);
  }
  18% {
    transform: translate(110px, -55px) scale(0.92, 1.12);
  }
  28% {
    transform: translate(200px, 2px) scale(1.08, 0.92);
  }
  /* Hop 2 */
  36% {
    transform: translate(240px, 4px) scale(1.12, 0.88);
  }
  48% {
    transform: translate(330px, -65px) scale(0.92, 1.12);
  }
  60% {
    transform: translate(420px, 2px) scale(1.08, 0.92);
  }
  /* Hop 3 */
  68% {
    transform: translate(460px, 4px) scale(1.1, 0.9);
  }
  80% {
    transform: translate(540px, -45px) scale(0.94, 1.08);
  }
  92% {
    transform: translate(610px, 2px) scale(1.06, 0.94);
  }
  100% {
    transform: translate(610px, 0) scale(1, 1);
  }
}
```

- [ ] **Step 2: Update `CuteCharactersStatic.tsx` with caravan logic and audio synchronization**

1. Add `caravanToRight?: boolean` to `CuteCharactersStaticProps`.
2. Add caravan delay parameters:
   - Amarillo: `0.55s`
   - Fucsia: `0.75s`
   - Naranja: `0.95s`
   - Morado: `1.15s`
3. In `CuteCharactersStatic.tsx`, trigger landing sounds on timeouts when `caravanToRight` becomes true.
4. Set `finalLookX = caravanToRight ? -0.7 : (submitHovered ? 0.35 : ready ? look.x : 0)`.
5. Apply `.caravanWrapper` conditionally when `caravanToRight` is true.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`  
Expected: Exit code 0.

- [ ] **Step 4: Commit Task 1 and 2**

```bash
git add src/app/sandbox/cutelogin/page.tsx src/components/sandbox/CuteCharactersStatic.tsx src/components/sandbox/CuteCharactersStatic.module.css
git commit -m "feat(cutelogin): implement blobs hopping right caravan and text dissolve on register"
```

---

### Task 3: Verification & Visual Polish

**Files:**
- Test and verify: `curl.exe -I http://localhost:9002/sandbox/cutelogin`
- Documentation: `docs/superpowers/plans/2026-10-10-cutelogin-blobs-hopping-right-caravan.md`

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`  
Expected: Exit code 0.

- [ ] **Step 2: Verify HTTP server response**

Run: `curl.exe -I http://localhost:9002/sandbox/cutelogin`  
Expected: HTTP/1.1 200 OK.

- [ ] **Step 3: Commit and update walkthrough**

```bash
git add docs/
git commit -m "docs(cutelogin): document caravan hop implementation and text dissolution"
```
