# Plan de Implementación: Motor DSP Tri-Banda de Cancelación Vocal y Preservación de Ritmo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el motor acústico DSP tri-banda en Web Audio API para eliminar con alta efectividad la voz principal en el modo Karaoke sobre pistas oficiales de YouTube, preservando al 100% el bombo y bajo, eliminando reverberación residual lateral según la Opción C, y garantizando compatibilidad total sin cancelaciones destructivas en altavoces de celular (mono).

**Architecture:** División de la señal estéreo en tres bandas paralelas (Graves < 200 Hz sumados a mono con fase intacta, Medios 200 Hz - 6.500 Hz con matriz diferencial y filtro dinámico de reverberación lateral a 1.800 Hz, y Agudos > 6.500 Hz en estéreo directo), compensación automática de ganancia (+3.8 dB a voz 0%) y compresión dinámica de estudio.

**Tech Stack:** TypeScript, React (Next.js 15), Web Audio API nativo (`BiquadFilterNode`, `GainNode`, `ChannelSplitterNode`, `ChannelMergerNode`, `DelayNode`, `DynamicsCompressorNode`).

## Global Constraints

- Interfaz pública de `useVocalRemover()` inalterada para no romper componentes existentes.
- Sincronización milimétrica con LRCLIB y detección de notas preservada (audio oficial sin alteraciones temporales).
- Cero bibliotecas externas pesadas; 100% Web Audio nativo compatible con iOS Safari y Android Chrome.
- Cero errores de tipado en TypeScript (`npx tsc --noEmit`).

---

### Task 1: Reescritura del Grafo DSP en `src/hooks/use-vocal-remover.ts`

**Files:**
- Modify: `src/hooks/use-vocal-remover.ts:1-426`

**Interfaces:**
- Consumes: Audio oficial de YouTube vía `/api/yt-audio?videoId=...`
- Produces: Hook `useVocalRemover()` con métodos `initAudio`, `setVocalVolume`, `setDrumBoost`, `setMasterVolume`, `togglePlay`, `play`, `pause`, `destroy`, `isPlaying`, `isReady`, `duration`, etc.

- [ ] **Step 1: Definir los nodos y refs de audio tri-banda**
Actualizar las referencias en `use-vocal-remover.ts` para soportar:
- `bassLowpass1Ref`, `bassLowpass2Ref`, `bassGainRef`
- `midBandpassRef`, `midCenterGainRef`, `sideBandpassRef`, `sideReverbNotchRef`, `sideGainRef`, `sideDecorrelatorRef`
- `highHighpassRef`, `highGainRef`
- `makeupGainRef`, `compressorRef`, `masterGainRef`

- [ ] **Step 2: Construir el grafo de audio en `initAudio()`**
Reemplazar la arquitectura mid/side básica anterior por el enrutamiento tri-banda Linkwitz-Riley:
1. `source -> splitter`
2. Graves: `splitter -> lowpass1 -> lowpass2 -> monoSum -> bassGain -> merger`
3. Medios:
   - Mid (Voz Frontal): `0.5*(L+R) -> bandpass -> midCenterGain -> merger`
   - Side (Estéreo & Reverb): `0.5*(L-R) -> bandpass -> sideReverbNotch -> sideGain -> merger(L) & [delay 6ms] -> merger(R)`
4. Agudos: `splitter(L,R) -> highpass(L,R) -> merger(L,R)`
5. Salida: `merger -> makeupGain -> compressor -> masterGain -> ctx.destination`

- [ ] **Step 3: Implementar la función de modulación dinámica `updateMix()` (Opción C)**
Controlar en tiempo real:
- `midCenterGain`: atenúa de 0 dB a -36 dB cuando `vocalLevel` va de 1.0 a 0.0.
- `sideReverbNotch`: filtro `peaking` en 1.800 Hz ($Q = 1.0$); ganancia de 0 dB a -14 dB cuando `vocalLevel` va de 0.5 a 0.0 (plano en 0.5 a 1.0).
- `makeupGain`: aumenta automáticamente de 1.0 (0 dB) a 1.55 (+3.8 dB) cuando `vocalLevel` va de 1.0 a 0.0.
- `bassGain`: modula la pegada del bombo/bajo según `drumBoostLvl` (1.4x por defecto = +3 dB).

- [ ] **Step 4: Limpieza y desconexión segura en `destroy()`**
Asegurar que todos los nodos desconecten sus puertos y se limpien adecuadamente para evitar fugas de memoria en Web Audio.

- [ ] **Step 5: Verificar compilación estricta**
Run: `npx tsc --noEmit`
Expected: Exit code 0 (0 errores).

---

### Task 2: Ajuste de Tolerancia y Manejo de Reproducción en `src/components/PracticaView.tsx`

**Files:**
- Modify: `src/components/PracticaView.tsx:515-555` y `src/components/PracticaView.tsx:715-725`

**Interfaces:**
- Consumes: `vocalRemover` desde `src/hooks/use-vocal-remover.ts`
- Produces: Experiencia de reproducción sin saltos falsos a `useYtFallback`

- [ ] **Step 1: Evitar caídas innecesarias a `useYtFallback`**
Ajustar el manejador de error de Web Audio para reintentar la conexión o esperar que el stream cargue antes de conmutar al video sin filtro de YouTube.

- [ ] **Step 2: Verificar la invocación de `setVocalVolume` en el slider**
Comprobar que `handleSetVocalLevel` interactúa reactivamente con el nuevo algoritmo y almacena el estado en `localStorage`.

- [ ] **Step 3: Verificar compilación estricta**
Run: `npx tsc --noEmit`
Expected: Exit code 0 (0 errores).

---

### Task 3: Verificación Integral del Sistema y Pruebas Acústicas

**Files:**
- Test manual & build check

- [ ] **Step 1: Ejecutar verificación de tipos global**
Run: `npx tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 2: Verificar respuesta del servidor de desarrollo**
Comprobar que el servidor Next.js compile limpiamente en `http://localhost:9002`.

- [ ] **Step 3: Commit de los cambios**
Run:
```bash
git add src/hooks/use-vocal-remover.ts src/components/PracticaView.tsx docs/superpowers/plans/2026-09-14-tri-band-vocal-remover.md
git commit -m "feat(audio): implement tri-band dsp vocal remover with mono compatibility and reverb damping"
```
