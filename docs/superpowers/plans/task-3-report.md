# Task 3 Report: Layout Refactor (The 3 Zones)

## Implementation Details
1. **Flexbox Layout**: Rewrote the main return statement of `practica-player.tsx` to strictly use `flex flex-col h-full`. We applied the global gradient `bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950`.
2. **Top Zone (40%)**: Refactored to include `PolygraphCanvas`. State from `usePitchDetection` is passed securely to this canvas layout.
3. **Middle Zone (40%)**: Incorporated `SyncedLyrics`. 
4. **Bottom Zone (20%)**: Contains `PlayerControls`. 
5. **Aesthetics (Lyrics)**:
   - Changed font weight to `font-black`.
   - Scaled inactive lyrics to 30% opacity.
   - Used `scale: 1.05` via Framer Motion for active text expansion. 
   - Applied vibrant colors to the primary active text track.

## Status
- Implementation works as requested.
- TypeScript checks passed successfully.
- Code has been committed.

All concerns were addressed inline, maintaining 2017 hardware compatibility with transform-based animations.

## Fixes (Reviewer Feedback)
1. Removed `transition-all duration-300` and `color`/`drop-shadow` Framer Motion animations from `synced-lyrics.tsx` to respect 2017 hardware constraints.
2. Passed `isDetecting` to `PolygraphCanvas` in `practica-player.tsx` and updated `PolygraphCanvasProps` to include it.
3. Added logic to call `start()` from `usePitchDetection` when `isPlaying` becomes true in `togglePlay` in `practica-player.tsx`.
