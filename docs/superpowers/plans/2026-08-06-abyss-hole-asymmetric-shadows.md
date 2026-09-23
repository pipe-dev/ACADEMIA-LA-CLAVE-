# Abyss Hole Asymmetric Shadows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply top-down asymmetric inset box-shadows to the Abyss Hole containers in `AcademiaView.tsx` to enhance depth, gravity, and realism.

**Architecture:** Update class styling conditionally for active (Unit 1) and locked (Units 2-4) unit header containers in `src/components/AcademiaView.tsx`.

**Tech Stack:** React, Tailwind CSS, Lucide Icons.

## Global Constraints
- Do not modify active purple button/node styling or animations.
- Preserve the exact `#dce9ff` (`dark:bg-slate-800`) base color and `shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)]` 3D shadow on locked unit cards.

---

### Task 1: Update Abyss Hole Container Shadows in AcademiaView

**Files:**
- Modify: `src/components/AcademiaView.tsx:190-220`

**Interfaces:**
- Consumes: `isPrimaryUnit` boolean state
- Produces: Asymmetric 3D shadow depth styling for Unit Header Banners

- [ ] **Step 1: Apply asymmetric inset shadows to outer and inner hole containers**

Update lines 194-220 in `src/components/AcademiaView.tsx`:

```tsx
                {/* Unit Header Banner */}
                <div className={`w-full p-1 sm:p-[5px] rounded-full ${
                  isPrimaryUnit
                    ? "bg-[#f8f7fb] dark:bg-[#0f0a16] shadow-[inset_0_6px_8px_-2px_rgba(88,28,135,0.6),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_6px_8px_-2px_rgba(88,28,135,0.9),_inset_0_-2px_4px_rgba(255,255,255,0.1)] border border-purple-900/10 dark:border-purple-900/30"
                    : "bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800"
                }`}>
                  <div className={`w-full p-1.5 flex flex-col items-center justify-center rounded-full ${
                    isPrimaryUnit
                      ? "bg-gradient-to-b from-[#e6e2ef] to-[#f4f2f9] dark:from-[#08040d] dark:to-[#0f0a16] shadow-[inset_0_18px_24px_-4px_rgba(40,10,70,0.85),_inset_0_6px_10px_-2px_rgba(88,28,135,0.7),_inset_0_-3px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_18px_24px_-4px_rgba(0,0,0,0.95),_inset_0_6px_10px_-2px_rgba(88,28,135,0.9),_inset_0_-3px_4px_rgba(255,255,255,0.05)] border border-purple-900/10 dark:border-black"
                      : "bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900"
                  }`}>
```

- [ ] **Step 2: Verify in browser**

Check that Unit 1 hole exhibits an intense top-down shadow gradient, and locked unit holes show a matching neutral top-down shadow gradient.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/AcademiaView.tsx
git commit -m "style(ui): apply top-down asymmetric inset shadows to abyss hole containers"
```
