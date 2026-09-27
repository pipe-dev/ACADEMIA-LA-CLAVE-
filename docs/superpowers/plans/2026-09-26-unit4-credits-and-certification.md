# Unit 4 Credits Modal and Certification Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the end-of-game credits modal in Unit 4 when the golden trophy floats in the center of the world, and create the `/certification` page with the official diploma preview and the "Disponible Pronto" caution ribbon.

**Architecture:** A lightweight React overlay component (`Unit4CreditsModal.tsx`) mounts on top of the Unit 4 canvas when the victory cinematic finishes its world pan. Clicking the primary CTA navigates to the dedicated `/certification` route (`src/app/certification/page.tsx`), which features a diploma preview with the diagonal warning tape ribbon.

**Tech Stack:** Next.js 15 (App Router), React 18, Tailwind CSS, Lucide icons, Canvas Confetti.

## Global Constraints

- Max 500 lines per file (strict project policy).
- TypeScript strict mode (0 errors in `tsc --noEmit`).
- Exact copy specified in the design spec `docs/superpowers/specs/2026-09-26-unit4-credits-and-certification-design.md`.
- Same caution ribbon styling as `TunerToolsAccordion.tsx` (`repeating-linear-gradient(45deg, #0a0a0a 0px, #0a0a0a 9px, #facc15 9px, #facc15 18px)`).

---

### Task 1: Create the Certification Page (`/certification`)

**Files:**
- Create: `src/app/certification/page.tsx`

**Interfaces:**
- Produces: Default Next.js page component at route `/certification`.
- Consumes: `lucide-react` icons (`Award`, `Lock`, `ArrowLeft`, `CheckCircle2`, `GraduationCap`, `Sparkles`), Next.js `Link` / `useRouter`.

- [ ] **Step 1: Write `src/app/certification/page.tsx`**
  Implement the diploma preview, academy branding, caution ribbon ("Disponible Pronto"), and navigation back to `/`.

- [ ] **Step 2: Verify TypeScript and compilation**
  Run: `npm run typecheck`
  Expected: 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/app/certification/page.tsx
  git commit -m "feat(certification): add certification page with diploma preview and caution ribbon"
  ```

---

### Task 2: Create `Unit4CreditsModal.tsx`

**Files:**
- Create: `src/components/unit4-flappy/Unit4CreditsModal.tsx`

**Interfaces:**
- Produces: `Unit4CreditsModal` component with props `{ onRestart: () => void }`.
- Consumes: `canvas-confetti`, `lucide-react` (`Trophy`, `GraduationCap`, `ArrowRight`, `RotateCcw`, `Sparkles`), Next.js `useRouter`.

- [ ] **Step 1: Write `src/components/unit4-flappy/Unit4CreditsModal.tsx`**
  Implement the glassmorphism modal with:
  1. Title & Trophy icon
  2. Logro: "¡Felicidades! Has culminado con éxito todo el ciclo formativo de la Academia..."
  3. Humor: "Nunca olvides que la seguridad al cantar no se compra... vibrato profesional. 😉"
  4. Créditos:
     - Intérprete Estrella: Tú
     - Dirección Pedagógica: Academia Musical La Clave
     - Tecnología & Evaluación: AfinApp
     - Fans Número Uno: Todos los que creyeron en tu proceso
  5. Bloque de Certificación:
     "¿Listo para el reconocimiento oficial? Si deseas certificarte con la Academia Musical La Clave y recibir tu diploma oficial de graduación, realiza tu examen final para comprobar y avalar todas tus habilidades vocales."
  6. Action buttons: `[ 🎓 Presentar Examen Final & Certificarme ]` (navigates to `/certification`) and `[ Volver a la Academia ]`.
  7. Confetti trigger on mount.

- [ ] **Step 2: Verify file length**
  Ensure line count is well under 500 lines (~180 lines).

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/unit4-flappy/Unit4CreditsModal.tsx
  git commit -m "feat(unit4): create Unit4CreditsModal component"
  ```

---

### Task 3: Integrate `Unit4CreditsModal` in `Unit4Game.tsx`

**Files:**
- Modify: `src/components/Unit4Game.tsx`

**Interfaces:**
- Consumes: `<Unit4CreditsModal onRestart={...} />`.
- Triggers: `showCredits` state when `win.stage === 'pan'` and the pedestal pipe has scrolled past `x + w < -20`.

- [ ] **Step 1: Add state and detection in `Unit4Game.tsx`**
  - Add `const [showCredits, setShowCredits] = useState(false)`.
  - In `reset()`, reset `setShowCredits(false)`.
  - In the animation loop, when `win.stage === 'pan'` and pedestal has exited, set `setShowCredits(true)`.
  - In JSX, render `{showCredits && <Unit4CreditsModal onRestart={() => { setPhaseBoth('ready'); reset(); }} />}`.

- [ ] **Step 2: Check line count of `Unit4Game.tsx`**
  Ensure `Unit4Game.tsx` remains strictly under 500 lines.

- [ ] **Step 3: Run `npm run typecheck`**
  Expected: 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/Unit4Game.tsx
  git commit -m "feat(unit4): integrate credits modal in Unit4Game victory sequence"
  ```

---

### Task 4: Full Verification and Visual Capture

**Files:**
- Run scripts: `capture_unit4_edge.js`

- [ ] **Step 1: Run `npm run build`**
  Verify static page generation including `/certification`.

- [ ] **Step 2: Capture visual verification with browser**
  Navigate to `/certification` and capture screenshot.
  Trigger Unit 4 victory and verify credits modal appearance.

- [ ] **Step 3: Update `walkthrough.md`**
  Document the completion of Area 24.
