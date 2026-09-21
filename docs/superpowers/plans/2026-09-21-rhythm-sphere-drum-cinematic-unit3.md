# Cinemática de Percusión y Esferas Rítmicas (Unidad 3) - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar por completo la cinemática de la bomba por una experiencia rítmica, percusiva y minimalista (zero-text UI): un gran bombo de concierto 3D en la base de la pantalla donde las esferas 3D rebotan al tempo de 120 BPM (compás de 4/4) y el usuario las rebana con gestos *Fruit Ninja*, culminando en el corte en cámara lenta de una Gran Esfera Dorada que revela el Trofeo de Baquetas Cruzadas (`Drum`).

**Architecture:**
- Módulo de síntesis de audio nativo (`src/components/unit3-rhythm/rhythmAudio.ts`) para bombo acústico, platillo splash, redoble y fanfarria orquestal con Web Audio API puro.
- Canvas de física y renderizado (`src/components/unit3-rhythm/DrumCanvas.tsx`):
  - Membrana de bombo orquestal con deformación elástica de resorte y ondas de choque circulares.
  - Esferas 3D con trayectorias parabólicas sincronizadas al beat (cenit a los 500ms).
  - Trazo de corte estilo baqueta luminosa (`pointermove` trail) y división de esferas en dos hemisferios 3D con rotación física y chispas.
  - 4 puntos dorados minimalistas de compás encima del tambor (cero textos en gameplay).
- Componente de celebración (`src/components/unit3-rhythm/TrophyCelebration.tsx`):
  - Trofeo 3D dorado con baquetas cruzadas y Lucide `Drum`, levitación suave, confeti y botón táctil 3D "Continuar a la Unidad 4".
- Orquestador modal (`src/components/Unit3CelebrationModal.tsx`):
  - Control de estados: `READY` -> `PULSE_1` -> `PULSE_2` -> `PULSE_3` -> `PULSE_BUILDUP` -> `GOLDEN_LAUNCH` -> `SLOWMO_REVEAL` -> `COMPLETED`.
  - Tolerancia de corte $\pm 130\text{ms}$.
  - Manejo amigable de fallos: la esfera cae, rebota en el parche (*thud* sordo) y el compás 1-2-3-4 se reinicia fluidamente sin penalizaciones.
- Página sandbox (`src/app/sandbox/unit3/page.tsx`) actualizada para pruebas e iteración visual.

**Tech Stack:** Next.js, React 18, TypeScript, HTML5 Canvas, Web Audio API, Lucide React (`Drum`), Canvas Confetti, Tailwind CSS.

## Global Constraints
- **Zero-Text UI durante el juego:** No mostrar carteles, cronómetros, textos de advertencia ni manuales en pantalla. Solo el tambor, los 4 indicadores luminosos y las esferas.
- **Paleta oficial de La Clave:** Azul medianoche de fondo (`#0b1828` / `#0f172a`), iluminación cenital, esfera 3D morada idéntica a los ejercicios de tempo.
- **Sin archivos de audio externos:** Todo sintetizado 100% con Web Audio API nativo.
- **Tolerancia rítmica:** $\pm 130\text{ms}$ respecto al cenit del pulso (120 BPM = 500ms por pulso).
- **Flujo amigable:** En caso de corte errado o no cortar, la esfera rebota y el compás 1-2-3-4 se reanuda de inmediato sin frustración ni pérdida de vidas.

---

### Task 1: Motor de Audio Percusivo Sintetizado (`src/components/unit3-rhythm/rhythmAudio.ts`)

**Files:**
- Create: `src/components/unit3-rhythm/rhythmAudio.ts`

**Interfaces:**
- Produces:
  - `playBassDrum(isAccent?: boolean): void` — Golpe de bombo profundo (130 Hz -> 42 Hz en 120ms con resonancia).
  - `playSphereSlice(step: number): void` — Corte de esfera morada (whoosh rápido + chime percusivo cristalino).
  - `playDrumRollBuildup(): void` — Redoble rápido orquestal de 4 micro-pulsos antes de la esfera dorada.
  - `playGoldenCrashFanfare(): void` — Platillo crash expansivo + acorde mayor arpegiado (Re mayor).
  - `playDullBounce(): void` — Toque sordo amortiguado (*thud*) al rebotar sin corte.
  - `setRhythmAudioMuted(muted: boolean): void`

- [ ] **Paso 1: Escribir `src/components/unit3-rhythm/rhythmAudio.ts`**
- [ ] **Paso 2: Verificar tipos con `npm run typecheck`**
- [ ] **Paso 3: Commit Task 1**

---

### Task 2: Modelos de Datos y Tipos Rítmicos (`src/components/unit3-rhythm/types.ts`)

**Files:**
- Create: `src/components/unit3-rhythm/types.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type RhythmBeatState =
    | 'READY'
    | 'PULSE_1'
    | 'PULSE_2'
    | 'PULSE_3'
    | 'BUILDUP'
    | 'GOLDEN_PULSE'
    | 'SLOWMO_CUT'
    | 'TROPHY_REVEAL';

  export interface ActiveSphere {
    id: number;
    type: 'purple' | 'golden';
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    isCut: boolean;
    birthTime: number;
    peakTime: number; // exactly at beat
    leftPiece?: SphereHemisphere;
    rightPiece?: SphereHemisphere;
  }

  export interface SphereHemisphere {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    vRot: number;
    alpha: number;
  }

  export interface DrumWave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    alpha: number;
  }

  export interface StarSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
  }
  ```

- [ ] **Paso 1: Escribir `src/components/unit3-rhythm/types.ts`**
- [ ] **Paso 2: Verificar tipos con `npm run typecheck`**
- [ ] **Paso 3: Commit Task 2**

---

### Task 3: Canvas del Bombo 3D y Física de Esferas (`src/components/unit3-rhythm/DrumCanvas.tsx`)

**Files:**
- Create: `src/components/unit3-rhythm/DrumCanvas.tsx`

**Interfaces:**
- Produces `DrumCanvas`:
  ```typescript
  interface DrumCanvasProps {
    currentBeat: number; // 0, 1, 2, 3, 4
    activeSphere: ActiveSphere | null;
    drumDeformation: number; // vertical pixel displacement of drum skin
    waves: DrumWave[];
    onSliceSphere: (sphere: ActiveSphere, cutPoint: { x: number; y: number }) => void;
    completedBeats: number; // 0 to 3
    isSlowMo: boolean;
  }
  ```

- [ ] **Paso 1: Escribir `src/components/unit3-rhythm/DrumCanvas.tsx`**
  - Renderizado del aro de madera de bombo en la base y parche marfil mate.
  - Deformación elástica del parche y ondas de choque circulares concéntricas.
  - Trayectoria parabólica de la esfera 3D (morada y dorada) con iluminación y sombra proyectada.
  - Detección de corte swipe mediante `pointerdown`/`pointermove`/`pointerup`.
  - División física en dos hemisferios rotando con gravedad y chispas.
  - 4 puntos indicadores dorados minimalistas sobre el tambor (sin texto).
- [ ] **Paso 2: Verificar tipos con `npm run typecheck`**
- [ ] **Paso 3: Commit Task 3**

---

### Task 4: Revelación del Trofeo 3D y Salida Minimalista (`src/components/unit3-rhythm/TrophyCelebration.tsx`)

**Files:**
- Create: `src/components/unit3-rhythm/TrophyCelebration.tsx`

**Interfaces:**
- Produces `TrophyCelebration`:
  ```typescript
  interface TrophyCelebrationProps {
    isOpen: boolean;
    onContinue: () => void;
  }
  ```
- Componente centrado y limpio:
  - Trofeo 3D dorado con baquetas cruzadas y Lucide `Drum`, levitando suavemente ($\pm 6\text{px}$).
  - Rayos de luz dorada radiales y lluvia de confeti oro/plata (`canvas-confetti`).
  - Un solo botón táctil 3D oficial de La Clave: `"Continuar a la Unidad 4"`.
  - Cero párrafos de texto superfluos.

- [ ] **Paso 1: Escribir `src/components/unit3-rhythm/TrophyCelebration.tsx`**
- [ ] **Paso 2: Verificar tipos con `npm run typecheck`**
- [ ] **Paso 3: Commit Task 4**

---

### Task 5: Orquestador Modal (`src/components/Unit3CelebrationModal.tsx`)

**Files:**
- Modify: `src/components/Unit3CelebrationModal.tsx`

**Interfaces:**
- Consumes:
  - `DrumCanvas`, `TrophyCelebration`, `rhythmAudio`.
- Controla:
  - Loop de sincronización a 120 BPM ($500\text{ms}$ por negra).
  - Lanzamiento de esfera en $t=0$, cenit en $t=500\text{ms}$.
  - Tolerancia de corte $\pm 130\text{ms}$.
  - Secuencia: Beat 1 -> Beat 2 -> Beat 3 -> Redoble (buildup) -> Beat 4 (Gran Esfera Dorada).
  - Si una esfera se escapa o se corta a destiempo: rebote amortiguado en el tambor y reinicio fluido a Beat 1.
  - Corte exitoso de la Esfera Dorada: transición a `SLOWMO_CUT` -> `TROPHY_REVEAL`.

- [ ] **Paso 1: Refactorizar `src/components/Unit3CelebrationModal.tsx` con el nuevo motor de esferas**
- [ ] **Paso 2: Verificar tipos con `npm run typecheck`**
- [ ] **Paso 3: Commit Task 5**

---

### Task 6: Actualización del Sandbox (`src/app/sandbox/unit3/page.tsx`)

**Files:**
- Modify: `src/app/sandbox/unit3/page.tsx`

**Interfaces:**
- Sandbox visual ultra-limpio con la paleta oficial de La Clave.
- Permite abrir la cinemática percusiva en modo completo o probar individualmente el rebote y el clímax.

- [ ] **Paso 1: Actualizar `src/app/sandbox/unit3/page.tsx`**
- [ ] **Paso 2: Verificar tipos con `npm run typecheck`**
- [ ] **Paso 3: Commit Task 6**

---

### Task 7: Verificación Visual Integral y Walkthrough

**Files:**
- Modify: `walkthrough.md`

- [ ] **Paso 1: Ejecutar script Chrome Headless CDP para verificar visualmente `/sandbox/unit3`**
- [ ] **Paso 2: Capturar pantallas de:**
  - El bombo de concierto con la esfera morada saltando y los 4 indicadores.
  - La esfera partiéndose en dos hemisferios tras el swipe.
  - La Gran Esfera Dorada abriéndose y revelando el Trofeo de Baquetas (`Drum`).
- [ ] **Paso 3: Actualizar `walkthrough.md` y documentar la solución**
- [ ] **Paso 4: Commit Task 7**
