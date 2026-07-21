# Task 2: Create PolygraphCanvas Component

**Goal:** Create a high-performance Canvas component that draws the visual pitch guide (notes scrolling right to left) and the user's pitch line.

**Files:**
- Create: `src/components/practica/polygraph-canvas.tsx`

**Interfaces:**
- Consumes: 
  - `currentTime` (number - current video time in seconds)
  - `userPitch` (object: `{ centsOff: number | null, note: string | null }` - the live microphone pitch)
  - `mockMelodyData` (array of objects: `[{ start: number, end: number, pitch: string }]` - for now, can be an empty array if not passed)

**Steps:**
1. Create `polygraph-canvas.tsx`.
2. Return a `<canvas className="w-full h-full bg-slate-900 rounded-lg" />`.
3. Use a React `ref` for the canvas and a `requestAnimationFrame` loop in a `useEffect` to constantly render.
4. **Drawing Logic (Every frame):**
   - Clear canvas.
   - Calculate pixel mapping: Let the center of the canvas be the current time (`currentTime`). Let 1 second = 100 pixels horizontally.
   - Iterate over `mockMelodyData` and draw gray rectangles for notes that are visible within the canvas viewport (e.g. from `currentTime - 2s` to `currentTime + 4s`).
   - Draw a glowing line for the user's pitch in the center of the screen (X axis). If `userPitch.note` is not null, draw a small circle or line at a Y position representing the pitch (for now, just use `centsOff` to move it up or down relative to the center). If `centsOff` is between -20 and 20, make it green, else red.

**Global Constraints:**
- Use Tailwind CSS for the container (the canvas draws pure pixels).
- No setInterval, must use `requestAnimationFrame`.
