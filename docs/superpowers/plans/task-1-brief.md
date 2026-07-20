# Task 1: Create PlayerControls Component

**Goal:** Extract the bottom control bar from `practica-player.tsx` into an isolated `PlayerControls` component.

**Files:**
- Create: `src/components/practica/player-controls.tsx`
- Modify: `src/components/practica/practica-player.tsx`

**Interfaces:**
- Consumes: `isPlaying` (boolean), `isReady` (boolean), `syncOffset` (number)
- Produces: `onTogglePlay` (() => void), `onAdjustOffset` ((amount: number) => void)

**Steps:**
1. Create `player-controls.tsx` and move the bottom `div` containing the Rewind/FastForward offset buttons and the Play/Pause button from `practica-player.tsx`.
2. Update `practica-player.tsx` to import and use `<PlayerControls />` in place of the old inline code, passing down the required props.

**Global Constraints:**
- Use Tailwind CSS.
- Keep the exact existing functionality (Play/Pause, Sync offset display, and adjustOffset calls).
