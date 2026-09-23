# Copa de Cristal Cinemática Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Unit 2 celebration where the user breaks a 3D crystal glass with their voice using the microphone.

**Architecture:** A new React component `Unit2CelebrationModal` that uses `audioService.getVolume()` inside a `requestAnimationFrame` loop to fill a progress bar. Integrated into `MainApp.tsx`.

**Tech Stack:** React, Tailwind CSS, `audioService`.

## Global Constraints
- Volume must be held > 0.15 threshold.
- Required sustained time is 4.5 seconds total to reach 100% progress.
- Progress pauses when volume drops (does not reset completely to 0).
- Pure CSS 3D styling for the glass.

---

### Task 1: Create `Unit2CelebrationModal` Component

**Files:**
- Create: `src/components/Unit2CelebrationModal.tsx`

**Interfaces:**
- Consumes: `audioService` (for `startMicrophone`, `stopMicrophone`, `getVolume`)
- Produces: `Unit2CelebrationModal` component with props `{ isOpen: boolean; onContinue: () => void; }`

- [ ] **Step 1: Write the component scaffolding and state**
```tsx
import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../utils/voicePlaybackService';

interface Unit2CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const Unit2CelebrationModal: React.FC<Unit2CelebrationModalProps> = ({ isOpen, onContinue }) => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShattered, setIsShattered] = useState(false);
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      if (isActive) audioService.stopMicrophone();
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isOpen, isActive]);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">Modal</div>;
};
```

- [ ] **Step 2: Add microphone activation and volume polling logic**
Update the component to handle the 4.5 second accumulation (4500ms):
```tsx
  const handleStart = async () => {
    await audioService.startMicrophone();
    setIsActive(true);
    lastTimeRef.current = performance.now();
    loop();
  };

  const loop = () => {
    const vol = audioService.getVolume();
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    setProgress(prev => {
      let newProg = prev;
      if (vol > 0.15) {
        newProg += (dt / 4500) * 100; // takes 4.5s to reach 100
      }
      if (newProg >= 100) {
        setIsShattered(true);
        audioService.stopMicrophone();
        return 100;
      }
      reqRef.current = requestAnimationFrame(loop);
      return newProg;
    });
  };
```

- [ ] **Step 3: Implement the UI (Glass, Progress Bar, Exploding Shards)**
```tsx
  // Inside the return block of Unit2CelebrationModal:
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
      {!isShattered ? (
        <div className="relative flex flex-col items-center w-full max-w-sm px-4">
          <h2 className="text-white font-bold text-xl mb-8 text-center drop-shadow-md">
            Rompe la copa con tu nota más aguda
          </h2>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-12 shadow-inner">
            <div 
              className="h-full bg-cyan-400 transition-all duration-75 shadow-[0_0_10px_#22d3ee]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 3D Glass */}
          <div className={`relative w-24 h-40 ${progress > 70 ? 'animate-shake' : ''}`}>
             <div className="absolute inset-0 rounded-b-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/30 backdrop-blur-sm"
                  style={{ boxShadow: 'inset 0 -10px 20px rgba(255,255,255,0.2), inset 10px 0 20px rgba(255,255,255,0.1)' }}>
             </div>
             {/* Base/Stem */}
             <div className="absolute top-40 left-1/2 -translate-x-1/2 w-2 h-16 bg-white/20 border-x border-white/30"></div>
             <div className="absolute top-[224px] left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-white/20 border border-white/30"></div>
          </div>

          {!isActive && (
            <button onClick={handleStart} className="mt-20 px-6 py-3 bg-cyan-500 rounded-full text-white font-bold">
              Activar Micrófono
            </button>
          )}
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center animate-fade-in">
          {/* Shards (Simplified CSS explosion) */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-4 h-4 bg-white/50 transform rotate-45 translate-x-20 -translate-y-20 opacity-0 animate-[shatter_1s_ease-out_forwards]"></div>
             <div className="w-6 h-3 bg-white/40 transform -rotate-12 -translate-x-20 -translate-y-10 opacity-0 animate-[shatter_1s_ease-out_forwards_0.1s]"></div>
             <div className="w-3 h-8 bg-white/60 transform rotate-70 translate-x-10 -translate-y-30 opacity-0 animate-[shatter_1s_ease-out_forwards_0.2s]"></div>
          </div>
          <button onClick={onContinue} className="z-10 px-8 py-4 bg-[#4648d4] rounded-full text-white font-black text-lg shadow-[0_4px_0_#1e1e78]">
            CONTINUAR A LA UNIDAD 3
          </button>
        </div>
      )}
    </div>
  );
```

- [ ] **Step 4: Add `@keyframes shatter` to `globals.css`**
Modify `src/app/globals.css` to add:
```css
@keyframes shatter {
  0% { transform: scale(1) translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: scale(0.5) translate(var(--tx, 100px), var(--ty, -100px)) rotate(var(--rot, 90deg)); opacity: 0; }
}
```

---

### Task 2: Integrate into `MainApp.tsx`

**Files:**
- Modify: `src/components/MainApp.tsx`

**Interfaces:**
- Consumes: `Unit2CelebrationModal`

- [ ] **Step 1: Import Unit2CelebrationModal**
```tsx
import { Unit2CelebrationModal } from './Unit2CelebrationModal';
```

- [ ] **Step 2: Add State for Unit 2 Celebration**
Add `showUnit2Celebration` state next to `showUnitCelebration`:
```tsx
const [showUnit2Celebration, setShowUnit2Celebration] = useState<boolean>(false);
```

- [ ] **Step 3: Modify completion logic to detect Unit 2 Exam**
In `handleNodeComplete`, adjust detection:
```tsx
const isLastNodeOfUnit1 = nodeId === 'u1-node12.5';
const isLastNodeOfUnit2 = nodeId === 'u2-node20.5';

if (isLastNodeOfUnit1) {
  setUnlockedUnitAnimationId(null);
  setSelectedNode(null);
  setShowUnitCelebration(true);
  return;
}

if (isLastNodeOfUnit2) {
  setUnlockedUnitAnimationId(null);
  setSelectedNode(null);
  setShowUnit2Celebration(true);
  return;
}
```

- [ ] **Step 4: Implement continue handler for Unit 2**
```tsx
const handleContinueToUnit3 = () => {
  setShowUnit2Celebration(false);
  setUnits((prevUnits) => {
    // Unlock Unit 3 logic here...
    return prevUnits; // Implement proper unlocking based on existing Unit 1 -> 2 transition logic
  });
};
```

- [ ] **Step 5: Render `Unit2CelebrationModal`**
In the return block of `MainApp.tsx`, near `UnitCelebrationModal`:
```tsx
{showUnit2Celebration && (
  <Unit2CelebrationModal
    isOpen={showUnit2Celebration}
    onContinue={handleContinueToUnit3}
  />
)}
```
