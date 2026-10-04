# Vocal Range Auto-Expansion, 6-Day Cadence & Evaluation Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement continuous unidirectional auto-expansion of vocal range across Afinador and Academia tests, simplify the Progreso CTA button to "Evaluar mi Rango", establish a 6-day calibration prompt (Option A), and display intelligent comparative feedback at evaluation completion.

**Architecture:** 
1. Centralized expansion and cadence utilities in `vocalRangeHelper.ts` with custom window event dispatching for reactive UI sync.
2. Hook acoustic detection points in `useAfinadorPitch.tsx` and `usePitchChallengeEngine.ts` to passively audit sustained and in-tune pitches.
3. Exclude `PracticaView.tsx` completely from range modifications.
4. Render 6-day cadence prompt (`VocalRangeCadencePrompt.tsx`) in Progreso and Afinador.
5. Provide detailed comparative feedback in `VocalRangeResultStep.tsx` for dual expansion, low-only, high-only, safe/protected, and initial baseline.

**Tech Stack:** Next.js / React (TypeScript), Tailwind CSS, Lucide icons, LocalStorage, Web Audio API / Pitch detection.

## Global Constraints
- Maximum file length strictly under 500 lines.
- Exact styling and dark mode tokens consistent with existing theme.
- Ratchet rule: Vocal range only expands outwards, never contracts.
- Zero pitch tracking in `PracticaView.tsx` (Karaoke).
- Every task must pass TypeScript validation (`npm run typecheck`).

---

### Task 1: Expand `vocalRangeHelper.ts` with Auto-Expansion, 6-Day Cadence, and Feedback Comparison

**Files:**
- Modify: `src/utils/vocalRangeHelper.ts`
- Test: Unit/Integration verification via TypeScript compilation and browser evaluation

**Interfaces:**
- Produces:
  - `checkAndExpandVocalRange(pitchHz: number, noteName: string, source: 'afinador' | 'academia' | 'manual'): ExpansionResult | null`
  - `isVocalRangeCheckDue(): boolean`
  - `snoozeVocalRangeCheck(): void`
  - `markVocalRangeCheckCompleted(): void`
  - `getEvaluationComparison(newMinHz: number, newMaxHz: number): EvaluationComparison`
  - Event: `'laclave_vocal_range_updated'`

- [ ] **Step 1: Define types and expansion interfaces in `vocalRangeHelper.ts`**

Add `ExpansionResult` and `EvaluationComparison`:
```typescript
export interface ExpansionResult {
  expanded: boolean;
  expandedMin: boolean;
  expandedMax: boolean;
  previousMinNote?: string;
  previousMaxNote?: string;
  newMinNote: string;
  newMaxNote: string;
  newOctaves: number;
}

export type ComparisonFeedbackType = 'dual' | 'lowest' | 'highest' | 'protected' | 'first';

export interface EvaluationComparison {
  type: ComparisonFeedbackType;
  title: string;
  message: string;
  previousMinNote?: string;
  previousMaxNote?: string;
  newMinNote: string;
  newMaxNote: string;
  octaves: string;
}
```

- [ ] **Step 2: Implement `checkAndExpandVocalRange`**
Read saved range. If `pitchHz < minHz` or `pitchHz > maxHz`, compute new notes, classification, octaves, update `laclave_vocal_range_saved`, push entry to `laclave_vocal_range_history_v1`, and dispatch `'laclave_vocal_range_updated'`.

- [ ] **Step 3: Implement 6-day cadence helpers**
Add `isVocalRangeCheckDue`, `snoozeVocalRangeCheck`, and `markVocalRangeCheckCompleted` with 6-day interval (518,400,000 ms) and 24h snooze.

- [ ] **Step 4: Implement `getEvaluationComparison`**
Compares current test min/max Hz with previously recorded baseline and returns the appropriate 1 of 5 feedback descriptions.

- [ ] **Step 5: Verify types**
Run `npm run typecheck` to confirm 0 compilation errors.

- [ ] **Step 6: Commit**
```bash
git add src/utils/vocalRangeHelper.ts
git commit -m "feat: add vocal range auto-expansion, cadence and comparison helpers"
```

---

### Task 2: Simplify Button in `ProgresoVocalRangeSection.tsx` & React to Range Updates

**Files:**
- Modify: `src/components/progreso/ProgresoVocalRangeSection.tsx`

**Interfaces:**
- Consumes: `'laclave_vocal_range_updated'` window event from `vocalRangeHelper.ts`

- [ ] **Step 1: Update button label**
Change line containing `"¡Evaluar mi Rango Vocal con Micrófono!"` to `"Evaluar mi Rango"`.

- [ ] **Step 2: Listen for `'laclave_vocal_range_updated'`**
Add event listener in `useEffect` so that when auto-expansion occurs anywhere in the app, the section immediately reloads range data, octaves, and history without full page reload.

- [ ] **Step 3: Verify visually and compile**
Run `npm run typecheck`.

- [ ] **Step 4: Commit**
```bash
git add src/components/progreso/ProgresoVocalRangeSection.tsx
git commit -m "feat: simplify vocal range button to Evaluar mi Rango and add reactive reload"
```

---

### Task 3: Hook Acoustic Auto-Expansion in `useAfinadorPitch.tsx`

**Files:**
- Modify: `src/components/afinador/useAfinadorPitch.tsx`

**Interfaces:**
- Consumes: `checkAndExpandVocalRange` from `src/utils/vocalRangeHelper.ts`

- [ ] **Step 1: Import helper**
```typescript
import { checkAndExpandVocalRange } from '../../utils/vocalRangeHelper';
```

- [ ] **Step 2: Connect to in-tune sustained note event**
In `useAfinadorPitch.tsx`, when `isMatched` is true (lines 244-249):
Add call:
```typescript
if (isMatched && currTarget?.name && pitchHz > 50 && pitchHz < 1100) {
  checkAndExpandVocalRange(pitchHz, currTarget.name, 'afinador');
}
```
Ensure debouncing / throttling is respected so it only executes when pitch is cleanly held.

- [ ] **Step 3: Verify line count and compile**
Ensure `useAfinadorPitch.tsx` stays under 500 lines.
Run `npm run typecheck`.

- [ ] **Step 4: Commit**
```bash
git add src/components/afinador/useAfinadorPitch.tsx
git commit -m "feat: hook auto-expansion into Afinador in-tune pitch detection"
```

---

### Task 4: Hook Acoustic Auto-Expansion in Academia Exams & Challenges (`usePitchChallengeEngine.ts`)

**Files:**
- Modify: `src/components/pitch-challenge/usePitchChallengeEngine.ts`

**Interfaces:**
- Consumes: `checkAndExpandVocalRange` from `src/utils/vocalRangeHelper.ts`

- [ ] **Step 1: Import helper**
```typescript
import { checkAndExpandVocalRange } from '../../utils/vocalRangeHelper';
```

- [ ] **Step 2: Connect to validated note completion**
In `usePitchChallengeEngine.ts`, inside the block where `nowTime - inTuneSinceRef.current >= 650` (lines 79-88):
```typescript
if (currTarget?.name && detectedPitch) {
  checkAndExpandVocalRange(detectedPitch, currTarget.name, 'academia');
}
```

- [ ] **Step 3: Verify line count and compile**
Ensure `usePitchChallengeEngine.ts` remains < 500 lines.
Run `npm run typecheck`.

- [ ] **Step 4: Commit**
```bash
git add src/components/pitch-challenge/usePitchChallengeEngine.ts
git commit -m "feat: hook auto-expansion into Academia singing challenges and exams"
```

---

### Task 5: Implement 6-Day Cadence Prompt Modal (`VocalRangeCadencePrompt.tsx`)

**Files:**
- Create: `src/components/vocal-range/VocalRangeCadencePrompt.tsx`
- Modify: `src/components/main-app/MainAppModals.tsx` or `ProgresoView.tsx`

**Interfaces:**
- Consumes: `isVocalRangeCheckDue`, `snoozeVocalRangeCheck`, `markVocalRangeCheckCompleted`
- Produces: UI prompt offering "Evaluar mi Rango Ahora" and "Recordarme Mañana"

- [ ] **Step 1: Create `VocalRangeCadencePrompt.tsx`**
Create component with smooth modal design, warm encouraging copy, clock/mic icon, and two action buttons:
1. "Evaluar mi Rango Ahora" -> calls `onStartEvaluation()`.
2. "Recordarme Mañana" -> calls `snoozeVocalRangeCheck()`, closes prompt.

- [ ] **Step 2: Mount prompt in `MainAppModals.tsx` or `ProgresoView.tsx`**
Check `isVocalRangeCheckDue()` on mount. If true and no modal is active, display prompt.

- [ ] **Step 3: Update `markVocalRangeCheckCompleted` on test save**
In `VocalRangeModal.tsx` / `recordVocalRangeEvaluation`, call `markVocalRangeCheckCompleted()`.

- [ ] **Step 4: Compile and test**
Run `npm run typecheck`.

- [ ] **Step 5: Commit**
```bash
git add src/components/vocal-range/VocalRangeCadencePrompt.tsx src/components/main-app/MainAppModals.tsx
git commit -m "feat: implement 6-day vocal range calibration cadence prompt"
```

---

### Task 6: Implement Evaluation Feedback in `VocalRangeResultStep.tsx`

**Files:**
- Modify: `src/components/vocal-range/VocalRangeResultStep.tsx`
- Modify: `src/components/VocalRangeModal.tsx`

**Interfaces:**
- Consumes: `getEvaluationComparison` from `src/utils/vocalRangeHelper.ts`

- [ ] **Step 1: Compute comparison in `VocalRangeModal.tsx`**
Compute `comparison = getEvaluationComparison(minHzVal, maxHzVal)` before passing to `VocalRangeResultStep`.

- [ ] **Step 2: Render comparison card in `VocalRangeResultStep.tsx`**
Add card rendering before practical tips showing:
- Badge / Icon according to scenario:
  - Dual: Emerald/Gold badge + trophy.
  - Lowest: Indigo badge + ArrowDown.
  - Highest: Purple badge + ArrowUp.
  - Protected: Slate badge + ShieldCheck.
  - First: Indigo badge + Award.
- Title and descriptive body text explaining the vocal result.

- [ ] **Step 3: Verify line count and compile**
Ensure `VocalRangeResultStep.tsx` remains < 500 lines.
Run `npm run typecheck`.

- [ ] **Step 4: Commit**
```bash
git add src/components/vocal-range/VocalRangeResultStep.tsx src/components/VocalRangeModal.tsx
git commit -m "feat: add intelligent expansion and protected record feedback card"
```

---

### Task 7: End-to-End Verification & Browser Testing

**Files:**
- Browser / Dev server verification on `http://localhost:9002`

- [ ] **Step 1: Test Button Text in Progreso**
Navigate to Progreso and confirm button reads "Evaluar mi Rango".

- [ ] **Step 2: Test Live Auto-Expansion**
Seed initial vocal range in localStorage (e.g. `La2 - Do5`). Trigger note match of `Sol2` in Afinador. Verify vocal range automatically expands to `Sol2 - Do5` and evolution graph receives new entry.

- [ ] **Step 3: Test 6-Day Cadence Prompt**
Simulate 7 days elapsed by setting `laclave_last_vocal_range_check_date` to 7 days ago. Verify cadence prompt displays. Click "Recordarme Mañana" and verify snooze.

- [ ] **Step 4: Test Result Feedback Scenarios**
Run a test that expands notes and verify the positive expansion card appears. Run a test with narrower notes and verify the "Récord Protegido" card appears.

- [ ] **Step 5: Final Clean Commit & Verification**
Verify 0 TypeScript errors and capture screenshots of all new UI states.
