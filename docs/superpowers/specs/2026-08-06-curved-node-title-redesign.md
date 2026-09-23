# Curved Node Title Redesign (SVG Arc)

## Overview
Replace the floating multi-line text blocks below each lesson node in `AcademiaView` with elegant SVG curved text along the bottom perimeter arc of each circular node button.

## Objectives
- Eliminate cluttered multi-line text collisions under serpentine map nodes.
- Render lesson titles as curved badge inscriptions following the bottom arc of each circular 3D node button.
- Use SVG `<path>` and `<textPath>` for resolution-independent curved text rendering.

## Technical Specifications

### File: `src/components/AcademiaView.tsx`

#### 1. SVG Arc Definition
Around each node container, render an absolute SVG overlay (`w-[150px] h-[150px]` centered over the node):

```tsx
<svg width="150" height="150" className="absolute -top-3 -left-[33px] pointer-events-none z-20 overflow-visible">
  <defs>
    <path
      id={`node-arc-${node.id}`}
      d="M 21 75 A 54 54 0 0 0 129 75"
    />
  </defs>
  <text className={`text-[9.5px] font-extrabold uppercase tracking-widest ${
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

#### 2. Layout Integration
- Replace the existing `div.mt-2` plain text container under each `<motion.button>` with the clean SVG curved text overlay.

## Verification Plan
1. Check that lesson titles curve neatly along the bottom contour of each node.
2. Confirm no text overlaps with neighboring nodes on the serpentine path.
3. Verify dark mode colors and font legibility.
