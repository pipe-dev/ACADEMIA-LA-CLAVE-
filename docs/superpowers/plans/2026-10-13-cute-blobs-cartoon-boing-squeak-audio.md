# Cartoon Squeak and Boing Audio for Cute Blobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace electronic/laser sound synthesis with cartoon rubber squeaks on press and cartoon bouncy boing/wobble on release for the 4 cute characters.

**Architecture:** Web Audio API procedural synthesis with triangular/sine body modeling for rubber toy squeaks, and decaying frequency vibrato LFO synthesis for cartoon rubber boings scaled to stretch distance.

**Tech Stack:** React 19, TypeScript, Web Audio API.

## Global Constraints
- Strictly ZERO emojis in all code and UI text.
- Absolutely NO screenshot commands or tests.
- Pure login card preserved with zero extra buttons.

---

### Task 1: Implement Cartoon Squeak and Boing Synthesizers

**Files:**
- Modify: `src/utils/useJellyAsmrAudio.ts`

**Interfaces:**
- `playCartoonSqueak: (character: CharacterId, volumeMultiplier?: number) => void;`
- `playCartoonBoing: (character: CharacterId, intensity?: number) => void;`

- [ ] **Step 1: Define acoustic profiles for cartoon squeaks and cartoon boings**
- [ ] **Step 2: Implement `playCartoonSqueak` with dual wave inflection (triangle + sine) and gentle lowpass filter**
- [ ] **Step 3: Implement `playCartoonBoing` with LFO-modulated wobble decay and initial rubber pluck**
- [ ] **Step 4: Update `UseJellyAsmrAudioReturn` interface and hook export**

### Task 2: Connect Cartoon Audio to Tactile Interactions

**Files:**
- Modify: `src/components/sandbox/CuteCharactersStatic.tsx`
- Modify: `src/components/sandbox/CuteCharacterTactileCage.tsx`

- [ ] **Step 1: Wire `handleMoradoTouch`, `handleFucsiaTouch`, `handleAmarilloTouch`, `handleNaranjaTouch` to use `playCartoonSqueak` on touch and `playCartoonBoing` on release**
- [ ] **Step 2: Update `playHopSound` to use the warm bouncy cartoon combination**
- [ ] **Step 3: Pass stretch intensity from `CuteCharacterTactileCage` on release**

### Task 3: Verification and Live Endpoints

- [ ] **Step 1: Run `npx tsc --noEmit` and confirm 0 errors**
- [ ] **Step 2: Test local and public tunnel endpoints (HTTP 200)**
- [ ] **Step 3: Git commit changes**
