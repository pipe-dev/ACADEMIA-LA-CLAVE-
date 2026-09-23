# Curved Node Title Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain multi-line lesson titles under Academia nodes with SVG curved text following the bottom arc of each circular node button.

**Architecture:** Integrate SVG `<textPath>` overlays inside the node render loop of `src/components/AcademiaView.tsx`.

**Tech Stack:** React, SVG (`<textPath>`), Tailwind CSS.

---

### Task 1: Replace Node Title Labels with SVG Curved Arc Text

**Files:**
- Modify: `src/components/AcademiaView.tsx:265-315`

- [ ] **Step 1: Locate node render loop in `AcademiaView.tsx`**

Inspect lines 265-315 in `src/components/AcademiaView.tsx` where node titles are currently rendered below `<motion.button>`.

- [ ] **Step 2: Replace plain text label with SVG `<textPath>` overlay**

Replace the plain text `<div>` below the `<motion.button>` with the SVG overlay curved arc:

```tsx
                        {/* Curved Arc Title */}
                        <svg width="160" height="160" className="absolute -top-4 -left-10 pointer-events-none z-20 overflow-visible">
                          <defs>
                            <path
                              id={`node-arc-${node.id}`}
                              d="M 20 80 A 60 60 0 0 0 140 80"
                            />
                          </defs>
                          <text className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest ${
                            isCompleted 
                              ? 'fill-emerald-600 dark:fill-emerald-400' 
                              : isCurrent 
                              ? 'fill-indigo-600 dark:fill-indigo-300' 
                              : 'fill-slate-400 dark:fill-slate-500'
                          }`}>
                            <textPath href={`#node-arc-${node.id}`} startOffset="50%" textAnchor="middle">
                              {node.title}
                            </textPath>
                          </text>
                        </svg>
```

- [ ] **Step 3: Verify in browser**

Ensure node titles curve cleanly along the bottom perimeter of each node without overlapping neighboring paths.

- [ ] **Step 4: Commit changes**

```bash
git add src/components/AcademiaView.tsx
git commit -m "style(academia): redesign node titles as curved SVG arc text hugging node bottom"
```
