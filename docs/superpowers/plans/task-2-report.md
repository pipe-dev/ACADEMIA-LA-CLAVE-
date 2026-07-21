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
