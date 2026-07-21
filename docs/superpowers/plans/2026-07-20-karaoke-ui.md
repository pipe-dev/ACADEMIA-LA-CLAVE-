# Karaoke Player UI Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `practica-player.tsx` into a 3-zone layout (Polygraph, Lyrics, Controls) and build a scrolling Canvas Pitch Tracker.

**Architecture:** Split the monolithic player into distinct, focused components. `PolygraphCanvas` handles high-performance 60fps rendering of pitch data. `SyncedLyrics` handles scrolling text. `PlayerControls` handles user interactions. All coordinate via props from the parent `PracticaPlayer`.

**Tech Stack:** React, Tailwind CSS, HTML5 Canvas, Framer Motion.

## Global Constraints
- Use Tailwind CSS for styling.
- Optimize for 2016-2017 hardware (e.g. Redmi) by using web performance best practices: use hardware-accelerated animations (`transform`, `opacity`), avoid animating layout/paint properties, and maintain a 30fps cap for canvas loops.
- The UI MUST be highly beautified, premium, and dynamic, achieving this through performant techniques (CSS variables, solid color harmonies, pre-rendered assets) rather than expensive runtime filters like `backdrop-blur`.

---

### Task 1: Create PlayerControls Component

**Files:**
- Create: `src/components/practica/player-controls.tsx`
- Modify: `src/components/practica/practica-player.tsx`

**Interfaces:**
- Consumes: Play state, sync offset, mic state.
- Produces: `onTogglePlay`, `onAdjustOffset`, `onToggleMic` callbacks.

- [ ] **Step 1: Write the component skeleton**
Extract the bottom control bar from `practica-player.tsx` into a new isolated component that receives all handlers via props.

- [ ] **Step 2: Update PracticaPlayer to use the new component**
Replace the inline bottom div in `practica-player.tsx` with `<PlayerControls />`.

---

### Task 2: Create PolygraphCanvas Component

**Files:**
- Create: `src/components/practica/polygraph-canvas.tsx`

**Interfaces:**
- Consumes: `currentTime`, `userPitch` (centsOff, note), `mockMelodyData` (array of notes).

- [ ] **Step 1: Build the Canvas Engine**
Create a component that renders an HTML5 `<canvas>`. Use a `useEffect` with `requestAnimationFrame` to continuously draw.

- [ ] **Step 2: Draw the Scrolling Timeline**
Make the canvas draw vertical grid lines representing seconds that scroll from right to left based on `currentTime`.

- [ ] **Step 3: Draw the User's Pitch Line**
Using the `userPitch` prop, draw a glowing line (like a laser) that moves up and down on the Y-axis according to the user's pitch.

---

### Task 3: Layout Refactor (The 3 Zones)

**Files:**
- Modify: `src/components/practica/practica-player.tsx`

**Interfaces:**
- Consumes: `PolygraphCanvas`, `PlayerControls`, `SyncedLyrics`.

- [ ] **Step 1: Implement the Flexbox Layout & Aesthetics**
Rewrite the main return statement of `practica-player.tsx` to be a strict `flex-col h-full`.
- **Background**: Apply the login page gradient (`bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950`).
- **Top Zone**: 40% height `div` containing `<PolygraphCanvas />`.
- **Middle Zone**: 40% height `div` containing `<SyncedLyrics />`.
  - *Lyrics Styling*: Use large, bold typography (e.g., text-4xl, font-black). Apply 30% opacity to inactive lines, and 100% opacity + 5% scale to the active line. Use CSS transforms (`scale()`, `opacity`) for transitions to maintain 2017 hardware compatibility.
- **Bottom Zone**: 20% height `div` containing `<PlayerControls />`.

- [ ] **Step 2: Connect state to Canvas**
Pass the `currentTime` and `usePitchDetection` values down to the `<PolygraphCanvas />`.
