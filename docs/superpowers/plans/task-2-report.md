# Task 2 Report: Create PolygraphCanvas Component

## Status
DONE

## Commit SHA
622d249

## Work Completed
- Created the `PolygraphCanvas` component in `src/components/practica/polygraph-canvas.tsx`.
- Implemented standard React `useRef` for the canvas and established a `requestAnimationFrame` render loop within `useEffect`.
- Mapped the current time to horizontal placement, such that the center of the canvas corresponds to the `currentTime` (with 100 pixels representing 1 second).
- Integrated `mockMelodyData` rendering by drawing blocks scrolling horizontally based on their `start` and `end` times relative to `currentTime`.
- Added canvas boundary checks (skipping rendering for notes fully out of view).
- Added logic for a glowing pitch indicator circle for the user in the center of the viewport, using the `centsOff` variable to offset vertically. The indicator turns green when the user is within 20 cents, and red otherwise.
- Ensured the dimensions adapt properly by syncing `canvas.width` and `canvas.height` with its bounding client rect.
- Validated via TypeScript compilation (`npx tsc --noEmit`), which succeeded without issues.

## Concerns / Notes
- The vertical mapping of notes is currently basic (all centered except user pitch offset). If the melody notes need accurate musical pitches rendered vertically in a future version, we would need to map the note names (e.g. C4, D4) to Y offsets to match the grid. For now, it provides a solid foundation for horizontal scrolling and visual feedback based on the task description constraints.
- Pitch offset rendering sets `yOffset = -userPitch.centsOff` (negative offsets map downward and positive upward, so negative cents map to positive Y space relative to canvas top).

## Fix Report
- Replaced `canvas.getBoundingClientRect()` inside the render loop with a `ResizeObserver` setup in the `useEffect`.
- Removed `[currentTime, userPitch, mockMelodyData]` from the loop `useEffect` dependency array. We now store these props in a `propsRef` (using a separate `useEffect`) and read them from the ref during the render loop.
- Capped `requestAnimationFrame` to exactly 30 fps by tracking `elapsed` time and only rendering when `>= 33.3ms` has passed since the last render.
- Rebuilt with `npx tsc --noEmit` to verify type safety.
- Committed changes as `9f7ad62`.
- **Low-end Device Optimization**: Removed `shadowBlur` and `shadowColor` properties from the canvas drawing logic to avoid heavy composite operations and prevent frame drops on older hardware. Committed as `6e0ed68`.
- **2017 Compatibility & Extreme Performance Optimization**: Replaced `ctx.roundRect` with `ctx.fillRect()` and added a fallback for `ResizeObserver` using `window.addEventListener('resize')`. Applied `window.devicePixelRatio` scaling. Implemented classic 64-bit console performance optimizations: replaced floating point math with integer math (bitwise `| 0`), completely removed object allocations in the render loop by caching primitive variables, and removed `ctx.scale` in favor of manual scaled integer math. Committed as `cbe3b6eafbac3a871dc81d044f6be91b92b549c9`.
- **Reviewer Fixes**: Reimplemented the glow effect using performant overlapping semi-transparent circles instead of `shadowBlur`. Fixed `ResizeObserver` layout thrashing by reading `entries[0].contentRect`. Un-hoisted primitive variables back into the `render` function loop, since V8 does not heap-allocate local primitives.
