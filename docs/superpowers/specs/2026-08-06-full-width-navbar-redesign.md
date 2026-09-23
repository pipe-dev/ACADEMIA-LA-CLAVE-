# Full-Width Native Navbar Redesign

## Overview
Redesign the bottom navigation bar (`BottomNav`) container from a floating isolated pill into a sleek, full-width native bottom bar anchored to the bottom of the screen with rounded top corners.

## Objectives
- Remove floating side margins (`bottom-4 left-4 right-4`).
- Anchor the navbar directly to the bottom viewport edge (`fixed bottom-0 left-0 right-0`).
- Implement top-only corner rounding (`rounded-t-3xl`).
- Add upwards-projected soft glass shadow (`shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.08)]`).
- Preserve full-area safe inset padding for iOS/Android home indicators (`pb-[calc(0.75rem+env(safe-area-inset-bottom))]`).

## Technical Specifications

### File: `src/components/BottomNav.tsx`
- **Container element (`<nav>`):**
  - Classes: `fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#0b1c30]/90 backdrop-blur-2xl shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.08)] rounded-t-3xl flex justify-around items-center px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-x border-white/50 dark:border-white/10 select-none max-w-lg mx-auto`
- **Active Tab Pill (`motion.div`):**
  - Classes: `absolute inset-0 bg-[#eef2ff] dark:bg-indigo-950/80 rounded-2xl shadow-[0_2px_0_0_#4648d4] -z-10`

## Verification Plan
1. Check that the bottom navbar touches the bottom screen edge smoothly.
2. Confirm the top corners display a clean `rounded-t-3xl` curve.
3. Verify tab transitions (`layoutId="activeTabPill"`) and sound effects remain fully functional.
