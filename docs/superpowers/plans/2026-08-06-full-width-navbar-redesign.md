# Full-Width Native Navbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `BottomNav` container to be anchored to the bottom of the screen with rounded top corners.

**Architecture:** Update container positioning and corner radius classes in `src/components/BottomNav.tsx`.

**Tech Stack:** React, Tailwind CSS, Framer Motion.

## Global Constraints
- Anchor to bottom viewport (`bottom-0 left-0 right-0`).
- Top-only corner rounding (`rounded-t-3xl`).
- Maintain mobile safe area padding (`pb-[calc(0.75rem+env(safe-area-inset-bottom))]`).

---

### Task 1: Update BottomNav Container Styling

**Files:**
- Modify: `src/components/BottomNav.tsx:30-73`

**Interfaces:**
- Consumes: `activeTab`, `onChangeTab`, `progressBadgeCount`
- Produces: Redesigned full-width native bottom navigation bar

- [ ] **Step 1: Update `<nav>` container classes in `BottomNav.tsx`**

Replace line 32 in `src/components/BottomNav.tsx`:

```tsx
    <nav id="tour-bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#0b1c30]/90 backdrop-blur-2xl shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.08)] rounded-t-3xl flex justify-around items-center px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-x border-white/50 dark:border-white/10 select-none max-w-lg mx-auto">
```

- [ ] **Step 2: Verify in browser**

Verify the navbar attaches flush to the bottom of the screen with top-rounded corners.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/BottomNav.tsx
git commit -m "style(ui): redesign bottom navbar container to full-width native bottom bar"
```
