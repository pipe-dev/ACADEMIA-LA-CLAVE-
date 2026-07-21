### Task 3: Layout Refactor (The 3 Zones)

**Files:**
- Modify: `src/components/practica/practica-player.tsx`
- Modify: `src/components/practica/synced-lyrics.tsx` (If needed for aesthetics)

**Interfaces:**
- Consumes: `PolygraphCanvas`, `PlayerControls`, `SyncedLyrics`.

- [ ] **Step 1: Implement the Flexbox Layout & Aesthetics**
Rewrite the main return statement of `practica-player.tsx` to be a strict `flex-col h-full`.
- **Background**: Apply the login page gradient (`bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950`).
- **Top Zone**: 40% height `div` containing `<PolygraphCanvas />`.
- **Middle Zone**: 40% height `div` containing `<SyncedLyrics />`.
  - *Lyrics Styling*: Use large, bold typography (e.g., text-4xl, font-black). Apply 30% opacity to inactive lines, and 100% opacity + 5% scale to the active line. Use CSS transforms (`scale()`, `opacity`) for transitions to maintain 2017 hardware compatibility.
- **Bottom Zone**: 20% height `div` containing `<PlayerControls />`.

- [ ] **Step 2: Connect state to components**
Pass the `currentTime`, `userPitch`, and `usePitchDetection` values down to `<PolygraphCanvas />` and `<SyncedLyrics />` as needed. Ensure they render nicely within their Flexbox containers.
