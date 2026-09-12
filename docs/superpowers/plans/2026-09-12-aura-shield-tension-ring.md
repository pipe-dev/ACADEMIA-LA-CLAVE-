# Aura Shield Tension Ring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Implement the circular SVG Aura Shield tension ring around the central 3D sphere in AfinadorView.tsx with conditional micro-badges and remove the standalone ~85px Tug-of-War box to eliminate vertical scrolling on mobile.

**Architecture:** Create a dedicated, reusable, and testable AuraShieldRing component that encircles the 3D pitch sphere. It computes the SVG arc path based on 0-100% tension, applies dynamic glowing gradients (neon emerald for >= 50%, amber to crimson for < 50%), and conditionally renders floating micro-badges (Trophy on right for >= 75%, Heart on left for <= 30%). Integrate it into AfinadorView.tsx replacing the standalone Tug-of-War card.

**Tech Stack:** React 18, Next.js 15, TypeScript, Tailwind CSS, Motion (motion/react), Lucide React.

## Global Constraints

- Standalone ~85px Tug-of-War card must be completely removed from AfinadorView.tsx.
- Central 3D sphere (w-22 h-22) remains the main focal element, encircled by the SVG ring.
- Micro-badge Trophy (🏆 Victoria) only appears when progress >= 75.
- Micro-badge Heart (❤️ -1 Vida) only appears when progress <= 30.
- In the balanced zone (30% to 75%), both micro-badges remain hidden.
- The State Badge pill below the sphere (tuningStatusMsg) must NOT display numeric percentages.
- Preserve 100% of existing sound triggers, defeat detection (progress reaching 0), and victory flow (progress reaching 100).

---

### Task 1: Create AuraShieldRing Component & Unit Tests

**Files:**
- Create: src/components/AuraShieldRing.tsx
- Create: src/components/__tests__/AuraShieldRing.test.ts

**Interfaces:**
- Consumes:
  - progress: number (0 to 100)
  - isActive: boolean (microphone/tuning active)
  - isMatched: boolean (pitch matches target frequency)
  - zenMode?: boolean
  - showBadges?: boolean
  - children: React.ReactNode (the central 3D sphere button)
- Produces:
  - <AuraShieldRing />: React component rendering concentric SVG tension ring with conditional micro-badges
  - calculateAuraDashOffset(progress: number, radius: number): number: Pure math helper for SVG stroke dash offset
  - getBadgeVisibility(progress: number): { showVictory: boolean; showDanger: boolean }: Pure helper for threshold evaluation`\n\n- [ ] **Step 1: Write the failing test**

``	ypescript
// src/components/__tests__/AuraShieldRing.test.ts
import assert from 'node:assert/strict';
import { calculateAuraDashOffset, getBadgeVisibility } from '../AuraShieldRing';

console.log('--- Testing AuraShieldRing helpers ---');

// Radius 52 -> circumference = 2 * Math.PI * 52 ≈ 326.7256
const radius = 52;
const circumference = 2 * Math.PI * radius;

// 1. Arc offset calculations
const offset100 = calculateAuraDashOffset(100, radius);
assert(Math.abs(offset100 - 0) < 0.01, '100% progress should have ~0 offset (full circle)');

const offset0 = calculateAuraDashOffset(0, radius);
assert(Math.abs(offset0 - circumference) < 0.01, '0% progress should have offset equal to circumference (empty)');

const offset50 = calculateAuraDashOffset(50, radius);
assert(Math.abs(offset50 - circumference * 0.5) < 0.01, '50% progress should be half circumference');

// 2. Badge visibility thresholds
// Neutral zone: 30 < progress < 75 -> NO badges visible
const midVisibility = getBadgeVisibility(50);
assert.equal(midVisibility.showVictory, false, '50% should not show victory badge');
assert.equal(midVisibility.showDanger, false, '50% should not show danger badge');

const boundary40 = getBadgeVisibility(40);
assert.equal(boundary40.showVictory, false, '40% should not show victory badge');
assert.equal(boundary40.showDanger, false, '40% should not show danger badge');

// Victory zone: progress >= 75 -> Trophy badge visible
const victory75 = getBadgeVisibility(75);
assert.equal(victory75.showVictory, true, '75% should show victory badge');
assert.equal(victory75.showDanger, false, '75% should not show danger badge');

const victory90 = getBadgeVisibility(90);
assert.equal(victory90.showVictory, true, '90% should show victory badge');
assert.equal(victory90.showDanger, false, '90% should not show danger badge');

// Danger zone: progress <= 30 -> Heart badge visible
const danger30 = getBadgeVisibility(30);
assert.equal(danger30.showVictory, false, '30% should not show victory badge');
assert.equal(danger30.showDanger, true, '30% should show danger badge');

const danger10 = getBadgeVisibility(10);
assert.equal(danger10.showVictory, false, '10% should not show victory badge');
assert.equal(danger10.showDanger, true, '10% should show danger badge');

console.log('🎉 ALL AuraShieldRing tests passed!');
``\n\n- [ ] **Step 2: Run test to verify it fails**

Run: npx tsx src/components/__tests__/AuraShieldRing.test.ts
Expected: FAIL (Cannot find module '../AuraShieldRing')`\n\n- [ ] **Step 3: Write minimal implementation**

``	sx
// src/components/AuraShieldRing.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart } from 'lucide-react';

export function calculateAuraDashOffset(progress: number, radius: number = 52): number {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  return circumference - (clamped / 100) * circumference;
}

export function getBadgeVisibility(progress: number): { showVictory: boolean; showDanger: boolean } {
  return {
    showVictory: progress >= 75,
    showDanger: progress <= 30
  };
}

export interface AuraShieldRingProps {
  progress: number; // 0 to 100
  isActive?: boolean;
  isMatched?: boolean;
  zenMode?: boolean;
  showBadges?: boolean;
  children: React.ReactNode;
}

export const AuraShieldRing: React.FC<AuraShieldRingProps> = ({
  progress,
  isActive = false,
  isMatched = false,
  zenMode = false,
  showBadges = true,
  children
}) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.73
  const strokeDashoffset = calculateAuraDashOffset(progress, radius);
  const { showVictory, showDanger } = getBadgeVisibility(progress);

  const isHighTension = progress >= 50;
  const isCritical = progress <= 20;

  // Gradient identifiers
  const strokeGradientId = ura-gradient-;

  return (
    <div className=relative flex items-center justify-center>
      {/* ─── SVG Concentric Aura Ring ─── */}
      <svg
        className=absolute pointer-events-none -rotate-90 z-10 w-[124px] h-[124px] overflow-visible
        viewBox=0 0 120 120
      >
        <defs>
          <linearGradient id=aura-emerald-grad x1=0% y1=0% x2=100% y2=100%>
            <stop offset=0% stopColor=#10b981 />
            <stop offset=100% stopColor=#06b6d4 />
          </linearGradient>
          <linearGradient id=aura-danger-grad x1=0% y1=0% x2=100% y2=100%>
            <stop offset=0% stopColor=#f59e0b />
            <stop offset=100% stopColor=#f43f5e />
          </linearGradient>
          <linearGradient id=aura-zen-grad x1=0% y1=0% x2=100% y2=100%>
            <stop offset=0% stopColor=#f5d56b />
            <stop offset=100% stopColor=#e5b83b />
          </linearGradient>
          <filter id=aura-glow x=-20% y=-20% width=140% height=140%>
            <feGaussianBlur stdDeviation=3.5 result=blur />
            <feMerge>
              <feMergeNode in=blur />
              <feMergeNode in=SourceGraphic />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx=60
          cy=60
          r={radius}
          fill=none
          strokeWidth=3.5
          className={
            zenMode
              ? 'stroke-[#2e3138]'
              : 'stroke-slate-200/60 dark:stroke-slate-700/60'
          }
        />

        {/* Dynamic Glowing Tension Arc */}
        <circle
          cx=60
          cy=60
          r={radius}
          fill=none
          strokeWidth={isCritical ? 5 : isMatched ? 4.5 : 4}
          strokeLinecap=round
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={
            zenMode
              ? 'url(#aura-zen-grad)'
              : isHighTension
              ? 'url(#aura-emerald-grad)'
              : 'url(#aura-danger-grad)'
          }
          filter={isCritical || isMatched ? 'url(#aura-glow)' : undefined}
          className={	ransition-all duration-200 ease-out }
        />
      </svg>

      {/* ─── Floating Contextual Micro-Badges ─── */}
      {showBadges && (
        <>
          {/* Danger Heart Badge (Left Flank, appears when <= 30%) */}
          <AnimatePresence>
            {showDanger && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: 8 }}
                transition={{ type: 'spring', damping: 18, stiffness: 350 }}
                className=absolute -left-12 sm:-left-14 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/90 text-white shadow-lg backdrop-blur-xs border border-rose-300/40 text-[10px] font-heading font-black tracking-tight whitespace-nowrap animate-pulse
              >
                <Heart className=w-3 h-3 fill-white text-white />
                <span>-1 Vida</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Victory Trophy Badge (Right Flank, appears when >= 75%) */}
          <AnimatePresence>
            {showVictory && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: -8 }}
                transition={{ type: 'spring', damping: 18, stiffness: 350 }}
                className=absolute -right-12 sm:-right-14 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-lg backdrop-blur-xs border border-emerald-300/40 text-[10px] font-heading font-black tracking-tight whitespace-nowrap
              >
                <Trophy className=w-3 h-3 text-white />
                <span>Victoria</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ─── The Central 3D Sphere ─── */}
      <div className=relative z-10>
        {children}
      </div>
    </div>
  );
};
``\n\n- [ ] **Step 4: Run test to verify it passes**

Run: npx tsx src/components/__tests__/AuraShieldRing.test.ts
Expected: PASS (🎉 ALL AuraShieldRing tests passed!)`\n\n- [ ] **Step 5: Commit**

``ash
git add src/components/AuraShieldRing.tsx src/components/__tests__/AuraShieldRing.test.ts
git commit -m feat: create AuraShieldRing component with math helpers and unit tests
`

---

### Task 2: Integrate AuraShieldRing into AfinadorView.tsx & Remove Standalone Tug-of-War Box

**Files:**
- Modify: src/components/AfinadorView.tsx:1200-1360

**Interfaces:**
- Consumes: <AuraShieldRing> from src/components/AuraShieldRing.tsx
- Replaces: The standalone <div className=p-3 rounded-2xl border space-y-2 ...> box (lines ~1206-1254)
- Preserves: State Badge (tuningStatusMsg) with pure guidance text, audio feedback, failure trigger at progress <= 0, victory at progress >= 100.`\n\n- [ ] **Step 1: Update AfinadorView.tsx**

1. Import AuraShieldRing in src/components/AfinadorView.tsx:
``	sx
import { AuraShieldRing } from './AuraShieldRing';
`

2. Remove the standalone Tug-of-War box (lines ~1206-1254 in AfinadorView.tsx):
- Delete the rectangular block with Derrota (-1 Vida) / Victoria / progress bar / Silencio (Barra congelada).
- Keep the Calentamiento informational strip for 'Calentamiento' difficulty if desired, or let Calentamiento show without the tension ring.

3. Wrap the central 3D sphere button inside <AuraShieldRing> in AfinadorView.tsx:
``	sx
{/* Dynamic Center Sphere with Aura Shield Ring in Level Mode */}
<div className=relative z-10 flex flex-col items-center my-1.5>
  {tunerMode === 'niveles' && selectedDifficulty !== 'Calentamiento' ? (
    <AuraShieldRing
      progress={tugOfWarProgress}
      isActive={isTuningActive}
      isMatched={isPitchMatched}
      zenMode={zenMode}
      showBadges={true}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
        }}
        title=Toca para escuchar voz real
        className={w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative cursor-pointer }
        style={{
          transform: isTuningActive && volume > 0.02 ? scale() : undefined
        }}
      >
        <span className=font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm>
          {activeTargetNote.name}
        </span>
        <span className=text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1>
          <Volume2 className=w-3 h-3 opacity-80 />
          {detectedPitch ? ${detectedPitch} Hz : ${targetFreq} Hz}
        </span>
      </motion.button>
    </AuraShieldRing>
  ) : (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
      }}
      title=Toca para escuchar voz real
      className={w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative cursor-pointer }
      style={{
        transform: isTuningActive && volume > 0.02 ? scale() : undefined
      }}
    >
      <span className=font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm>
        {activeTargetNote.name}
      </span>
      <span className=text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1>
        <Volume2 className=w-3 h-3 opacity-80 />
        {detectedPitch ? ${detectedPitch} Hz : ${targetFreq} Hz}
      </span>
    </motion.button>
  )}

  {/* State Badge (Pura orientación pedagógica, sin números porcentuales) */}
  {isTuningActive ? (
    <div className={mt-2 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-md border transition-all duration-300  }>
      {statusIcon}
      <span>{tuningStatusMsg}</span>
    </div>
  ) : (
    <button
      onClick={toggleTuning}
      className={mt-2 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-102 }
    >
      <Mic className={w-3.5 h-3.5  animate-pulse} />
      <span>Toca para activar micrófono y afinar</span>
    </button>
  )}
</div>
``\n\n- [ ] **Step 2: Run TypeScript check**

Run: npx tsc --noEmit
Expected: Exited with code 0`\n\n- [ ] **Step 3: Run full livesEngine test suite**

Run: npx tsx src/utils/__tests__/livesEngine.test.ts
Expected: 33/33 assertions pass`\n\n- [ ] **Step 4: Commit changes**

``ash
git add src/components/AfinadorView.tsx
git commit -m feat: integrate AuraShieldRing in AfinadorView and eliminate standalone Tug-of-War card
`

---

### Task 3: Verification & Mobile Viewport Audit`\n\n- [ ] **Step 1: Test live dev server response**

Run: curl.exe -I http://localhost:9002
Expected: HTTP 200 OK`\n\n- [ ] **Step 2: Mobile viewport height verification**
- Confirm that with the 85px standalone card removed:
  - Header, Afinador Card (with concentric Aura Shield), and full Teclado Vocal (7 white keys + 5 black keys) are visible in a 667px - 844px height viewport.
  - Zero vertical scroll required to access any piano key or pitch feedback.
- Confirm micro-badge behavior:
  - Sing in tune -> Tension rises -> At >= 75%, 🏆 Victoria badge animates in smoothly on the right.
  - Sing off tune -> Tension falls -> At <= 30%, ❤️ -1 Vida badge animates in with pulse on the left.
  - In normal zone (35% - 70%) -> No badges displayed, clean interface.`\n\n- [ ] **Step 3: Update walkthrough.md artifact**

