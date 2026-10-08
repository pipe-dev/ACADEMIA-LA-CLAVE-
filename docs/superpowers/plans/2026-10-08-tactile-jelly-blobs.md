# Blobs Tactiles con Fisica de Gelatina Densa y Siluetas Organicas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dotar a los 4 personajes (Morado, Fucsia, Amarillo, Naranja) de siluetas de arcilla maleables no rectilineas y fisica tactil reactiva de gelatina densa (drag & pull con resistencia elastica, tap squish con jiggle, y ondas de choque translúcidas en canvas).

**Architecture:** Arquitectura no invasiva de tres capas: Capa 1 Siluetas DOM base suavizadas, Capa 2 Jaula Elastica GPU (Lattice Wrapper) con origen anclado en la base, y Capa 3 Motor de Fisica de doble armónico acoplado con Canvas superpuesto para efectos de contacto y ondas.

**Tech Stack:** React 19, TypeScript, Next.js App Router, CSS Modules, GSAP / requestAnimationFrame, Canvas 2D API.

## Global Constraints
- Limite maximo de 500 lineas por archivo.
- Cero emojis en codigo, mensajes de commit, interfaz y respuestas.
- Cero uso del icono Sparkles de lucide-react.
- Ejecutar npm run typecheck tras cada cambio de codigo.
- No levantar servidores de desarrollo, tuneles ni suites de pruebas en bucle.

---

### Task 1: Suavizado de Siluetas Base en CSS (Morfologia Organica en Reposo)

**Files:**
- Modify: `src/components/sandbox/CuteCharacterMorado.module.css:10-38`
- Modify: `src/components/sandbox/CuteCharacterFucsia.module.css:70-96`
- Modify: `src/components/sandbox/CuteCharacterAmarillo.module.css:34-67`
- Modify: `src/components/sandbox/CuteCharacterNaranja.module.css:34-71`
- Modify: `public/4personajes/personaje_morado_exacto.html`
- Modify: `public/4personajes/personaje_fucsia.html`
- Modify: `public/4personajes/personaje_amarillo.html`
- Modify: `public/4personajes/personaje_naranja.html`

**Interfaces:**
- Produces: Estilos visuales con curvaturas suaves de arcilla en reposo (sin paredes 100% verticales rectas), conservando al 100% las medidas de bounding-box, ojos, pupilas, bocas y sombras.

- [ ] **Step 1: Aplicar curvatura suave con sutil cintura en CuteCharacterMorado.module.css**
  Reemplazar el rectangulo plano por un `clip-path` o curvatura compuesta que estreche suavemente el torso medio en ~4px y expanda sutilmente la base para simular apoyo blando de arcilla.

- [ ] **Step 2: Suavizar transición de curvatura en CuteCharacterFucsia.module.css**
  Ajustar el `clip-path` de `.fuchsia-body` para una transicion organica continua sin aristas duras.

- [ ] **Step 3: Aplicar suave conicidad y cúpula continua en CuteCharacterAmarillo.module.css**
  Eliminar las paredes 100% verticales rectilíneas mediante un `clip-path` sutilmente ensanchado en la base.

- [ ] **Step 4: Reforzar apoyo blando en base de CuteCharacterNaranja.module.css**
  Ajustar la base del semicírculo para simular asentamiento por gravedad.

- [ ] **Step 5: Sincronizar los cambios estáticos en public/4personajes/*.html**
  Actualizar los 4 archivos HTML de referencia estática para reflejar estas mismas siluetas.

- [ ] **Step 6: Verificar compilacion TypeScript**
  Ejecutar: `npm run typecheck`
  Esperado: codigo de salida 0.

- [ ] **Step 7: Commit Task 1**
  ```bash
  git add src/components/sandbox/CuteCharacter*.module.css public/4personajes/*.html
  git commit -m "style: soften character silhouette borders to organic clay curvature"
  ```

---

### Task 2: Motor Fisico de Gelatina Densa (`useTactileJellyPhysics.ts`)

**Files:**
- Create: `src/components/sandbox/useTactileJellyPhysics.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface JellyPhysicsConfig {
    mass: number;
    stiffness: number;
    damping: number;
    volumeFactor: number;
    jiggleFrequency: number;
    jiggleDamping: number;
  }

  export interface JellyTransformState {
    scaleX: number;
    scaleY: number;
    skewX: number;
    rotate: number;
    offsetY: number;
    isInteracting: boolean;
    isSettling: boolean;
  }

  export function useTactileJellyPhysics(config: JellyPhysicsConfig): {
    state: JellyTransformState;
    startDrag: (x: number, y: number) => void;
    updateDrag: (dx: number, dy: number) => void;
    releaseDrag: () => void;
    triggerPoke: (force?: number) => void;
    triggerHover: (direction: number) => void;
    clearHover: () => void;
  }
  ```

- [ ] **Step 1: Implementar calculo de oscilador amortiguado de doble armonico**
  Escribir el modelo matematico que integra:
  1. Movimiento primario de masa pesada en Y con desfase de 90 grados hacia X.
  2. Jiggle superficial secundario de alta frecuencia (atenuado en ~500ms).
  3. Cizallamiento viscoso (skewX) proporcional al arrastre horizontal.
  4. Conservacion de volumen: $scaleX = 1 + (1 - scaleY) \times volumeFactor$.

- [ ] **Step 2: Conectar ciclo de animacion reactivo mediante requestAnimationFrame**
  Asegurar que el loop se detenga completamente cuando la energia cinetica decaiga por debajo del umbral de reposo ($\epsilon = 0.001$), transicionando limpiamente de regreso a reposo.

- [ ] **Step 3: Exportar configuraciones precalibradas por personaje**
  Definir y exportar presets: `JELLY_PRESET_MORADO`, `JELLY_PRESET_FUCSIA`, `JELLY_PRESET_AMARILLO`, `JELLY_PRESET_NARANJA`.

- [ ] **Step 4: Verificar compilacion TypeScript**
  Ejecutar: `npm run typecheck`
  Esperado: codigo de salida 0.

- [ ] **Step 5: Commit Task 2**
  ```bash
  git add src/components/sandbox/useTactileJellyPhysics.ts
  git commit -m "feat: implement dual-frequency dense jelly physics hook"
  ```

---

### Task 3: Jaula Elastica Envolvente (`CuteCharacterTactileCage.tsx`)

**Files:**
- Create: `src/components/sandbox/CuteCharacterTactileCage.tsx`
- Create: `src/components/sandbox/CuteCharacterTactileCage.module.css`

**Interfaces:**
- Consumes: `useTactileJellyPhysics` (Task 2)
- Produces:
  ```typescript
  export interface CuteCharacterTactileCageProps {
    children: React.ReactNode;
    config: JellyPhysicsConfig;
    onRippleTrigger?: (originX: number, originY: number, intensity: number) => void;
    className?: string;
  }
  ```

- [ ] **Step 1: Crear estructura del componente contenedor**
  Crear el componente con `transformOrigin: 'bottom center'` que aplica las matrices de transformacion aceleradas por GPU (`scale3d`, `skewX`, `rotateZ`).

- [ ] **Step 2: Gestionar eventos PointerEvents con setPointerCapture**
  Implementar manipuladores unificados:
  - `onPointerDown`: Iniciar arrastre, registrar tiempo inicial y coordenadas $(x, y)$.
  - `onPointerMove`: Si esta arrastrando, calcular $(\Delta X, \Delta Y)$ y enviar a `updateDrag`. Si solo hace hover, enviar a `triggerHover`.
  - `onPointerUp`: Evaluar si fue un tap rapido ($< 220\text{ ms}$ y arrastre mínimo) para invocar `triggerPoke()`, o soltar arrastre e invocar `releaseDrag()`. Disparar callback `onRippleTrigger`.
  - `onPointerLeave`: Restablecer hover suavemente.

- [ ] **Step 3: Integrar estilos CSS Modules**
  Configurar aislamiento de eventos táctiles (`touch-action: none; user-select: none; will-change: transform`).

- [ ] **Step 4: Verificar compilacion TypeScript**
  Ejecutar: `npm run typecheck`
  Esperado: codigo de salida 0.

- [ ] **Step 5: Commit Task 3**
  ```bash
  git add src/components/sandbox/CuteCharacterTactileCage.tsx src/components/sandbox/CuteCharacterTactileCage.module.css
  git commit -m "feat: add tactile elastic cage container with pointer capture"
  ```

---

### Task 4: Capa de Canvas Tactil Superpuesto (`CuteTactileCanvas.tsx`)

**Files:**
- Create: `src/components/sandbox/CuteTactileCanvas.tsx`
- Create: `src/components/sandbox/CuteTactileCanvas.module.css`

**Interfaces:**
- Produces:
  ```typescript
  export interface CuteTactileCanvasRef {
    spawnRipple: (x: number, y: number, intensity?: number) => void;
    setTouchGlow: (x: number, y: number, active: boolean) => void;
  }

  export interface CuteTactileCanvasProps {
    width: number;
    height: number;
  }
  ```

- [ ] **Step 1: Implementar sistema de ondas circulares expansivas (Shockwave Ripples)**
  Estructura de particulas de onda con: radio inicial, velocidad de expansion decreciente, radio maximo, y desvanecimiento de opacidad suave (`globalAlpha` decreciente).

- [ ] **Step 2: Implementar renderizado de gradiente de depresion de contacto**
  Dibujar gradiente radial translúcido centrado en $(x, y)$ con modo `mix-blend-mode: overlay` mientras haya presion activa.

- [ ] **Step 3: Gestion del ciclo de renderizado optimizado**
  El canvas limpia su frame (`clearRect`) y corre `requestAnimationFrame` exclusivamente mientras existan ondas activas o presion; de lo contrario, se suspende para garantizar 0% de CPU en reposo.

- [ ] **Step 4: Verificar compilacion TypeScript**
  Ejecutar: `npm run typecheck`
  Esperado: codigo de salida 0.

- [ ] **Step 5: Commit Task 4**
  ```bash
  git add src/components/sandbox/CuteTactileCanvas.tsx src/components/sandbox/CuteTactileCanvas.module.css
  git commit -m "feat: add overlay tactile canvas with shockwave ripples and pressure indentation"
  ```

---

### Task 5: Integracion en CuteCharactersStatic, /sandbox/cutelogin y /sandbox/log

**Files:**
- Modify: `src/components/sandbox/CuteCharactersStatic.tsx`

**Interfaces:**
- Consumes: `CuteCharacterTactileCage`, `CuteTactileCanvas`, presets de fisica.
- Conecta cada personaje en su slot respectivo envolviendo a `CuteCharacterBreathe` de modo que la respiracion idle opere en reposo y la fisica elastica tome control prioritario al interactuar.

- [ ] **Step 1: Envolver cada slot de personaje en CuteCharacterTactileCage**
  Asignar a cada personaje (Morado, Fucsia, Amarillo, Naranja) su preset fisico correspondiente (`JELLY_PRESET_*`).

- [ ] **Step 2: Montar la capa de CuteTactileCanvas sobre el escenario**
  Dimensionar el canvas segun `DESIGN_WIDTH` (640px) y `DESIGN_HEIGHT` (705px) y conectar los callbacks `onRippleTrigger` de las jaulas al canvas.

- [ ] **Step 3: Verificar compatibilidad en /sandbox/cutelogin y /sandbox/log**
  Comprobar que ambas rutas conservan sus funcionalidades previas (formulario de login, mirada de ojos con mouse, etc.) agregando la respuesta elastica táctil.

- [ ] **Step 4: Ejecutar verificacion de tipos TypeScript completa**
  Ejecutar: `npm run typecheck`
  Esperado: codigo de salida 0 sin errores.

- [ ] **Step 5: Commit Task 5**
  ```bash
  git add src/components/sandbox/CuteCharactersStatic.tsx
  git commit -m "feat: integrate tactile jelly physics and ripple canvas into cute characters stage"
  ```
