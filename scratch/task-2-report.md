# Task 2 Report: Implement `useVocalRemover` hook

## What was done:
1. **Created Hook**: Created `src/hooks/use-vocal-remover.ts`.
2. **Implementation**: Implemented the Web Audio API based center cancellation logic as specified in the brief. This includes routing for splitting, inverting the right channel, merging, and providing an equal power crossfade for smooth volume transition between original and center-cancelled audio.
3. **Commit**: Committed the file to the repository with the message `feat(audio): add useVocalRemover hook for Web Audio center cancellation`.

## Lightweight / Optimization notes:
- The hook utilizes the hardware-accelerated Web Audio API for performance.
- We avoided unnecessary re-renders by utilizing `useRef` for tracking instances like `audioContextRef` and `audioRef`.
- `useEffect` cleanup properly releases resources (suspends/closes context and pauses audio).

## Concerns / Future thoughts:
- Browser compatibility might be an issue with some legacy browsers, though the fallback `webkitAudioContext` is included.
- CORS on some proxy URLs could be unreliable depending on the proxy's uptime and configuration, we have added multiple fallbacks but this is a point of potential failure.

Status: **DONE**
