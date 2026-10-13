# Especificacion Tecnica: Quejidos Vocales Elasticos y Caricaturescos Procedurales (Web Audio API)

## 1. Vision General y Proposito
Dotar a los cuatro personajes interactivos (Morado, Fucsia, Amarillo y Naranja) de `/sandbox/cutelogin` de respuestas vocales procedurales caricaturescas ante la manipulacion fisica. Cuando el usuario interactua, estira o comprime a cualquiera de los bloques de gelatina, estos reaccionan vocalmente emitiendo quejidos, ruidos de incomodidad y exclamaciones comicas sintetizadas en tiempo real mediante la Web Audio API (sintesis por formantes del tracto vocal), sin depender de archivos de audio externos.

---

## 2. Arquitectura Acustica: Sintesis por Formantes Vocales

El motor acustico emula un tracto vocal humano / caricaturesco mediante tres etapas en serie y paralelo:

```
+--------------------------------------------------------------+
| 1. Fuente Glotal (Oscilador Glotal)                          |
| - Oscilador 'sawtooth' / 'triangle' con filtro pasabajas     |
|   para eliminar asperezas metalicas                          |
| - Modulado por LFO de temblor involuntario (Shiver / Jitter) |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
| 2. Cavidad Vocal Resonante (Filtros de Formantes F1 y F2)    |
| - BiquadFilter 1: Formante F1 (apertura bucal / esfuerzo)    |
| - BiquadFilter 2: Formante F2 (timbre lingual y brillo)      |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
| 3. Envolvente Dinamica y Ganancia Principal                  |
| - Curvas lineales y exponenciales segun estiramiento dy      |
| - Salida directa a AudioContext.destination                  |
+--------------------------------------------------------------+
```

### Parametros Acusticos por Personaje

1. **Morado (Bloque Gigante y Calmo)**:
   - Frecuencia fundamental (F0): 85 Hz a 125 Hz.
   - Formante F1: 320 Hz a 420 Hz (esfuerzo gutural cerrado).
   - Formante F2: 780 Hz a 920 Hz.
   - Timbre y personalidad: Gruñido pesado y profundo ("uugggh... huuumph").
   - LFO de temblor: 15 Hz, profundidad media.

2. **Fucsia (Bloque Elegante y Suave)**:
   - Frecuencia fundamental (F0): 240 Hz a 370 Hz.
   - Formante F1: 440 Hz a 590 Hz.
   - Formante F2: 1850 Hz a 2200 Hz.
   - Timbre y personalidad: Quejido melodioso de molestia fina ("aaiiih... mhmpf").
   - LFO de temblor: 18 Hz, profundidad sutil.

3. **Amarillo (Bloque Pequeño y Nervioso)**:
   - Frecuencia fundamental (F0): 480 Hz a 760 Hz.
   - Formante F1: 580 Hz a 840 Hz.
   - Formante F2: 2450 Hz a 2950 Hz.
   - Timbre y personalidad: Chillido caricaturesco agudo de dibujo animado ("eeeek! uip!").
   - LFO de temblor: 22 Hz, profundidad alta con vibrato acelerado.

4. **Naranja (Bloque Travieso y Elastico)**:
   - Frecuencia fundamental (F0): 130 Hz a 260 Hz.
   - Formante F1: 400 Hz a 620 Hz.
   - Formante F2: 1200 Hz a 1550 Hz.
   - Timbre y personalidad: Quejido gomoso con glissando de tira y afloja ("booo-whiiine / bleeeh").
   - LFO de temblor: 17 Hz, modulacion no lineal.

---

## 3. Dinamica de Interaccion (Enfoque Hibrido)

El comportamiento vocal se divide en tres estados interactivos:

### A. Tension de Fondo (Arrastre Continuo)
- **Umbral de activacion**: Cuando la distancia de arrastre vertical supera `|dy| > 15px`.
- **Evolucion del tono**: F0 y los formantes se modulan en tiempo real siguiendo una curva `tanh(|dy| / 180)`:
  - Estiramiento hacia arriba (`dy < 0`): Tono sube, formantes se abren hacia un tono mas quejumbroso.
  - Compresion hacia abajo (`dy > 0`): Tono se comprime hacia un tono ahogado con menor F2.
- **Volumen**: Ganancia sutil (0.04 a 0.08) para no ensordecer la experiencia general.

### B. Quejido Caricaturesco al Limite (Burst Expresivo)
- **Umbral de disparo**: Cuando el estiramiento supera el umbral crítico (`|dy| > 75px` o deformacion `stretch > 0.35`) o cuando se detecta una velocidad brusca de tirón (`vel > 1.8 px/ms`).
- **Respuesta**: Ráfaga de 180 ms con pico expresivo de volumen (0.16) y apertura rapida de formantes que emite la queja caricaturesca completa.
- **Cooldown**: 450 ms por personaje para evitar ráfagas descontroladas mientras el puntero permanezca quieto en el punto maximo.

### C. Liberacion y Alivio (Release)
- Al soltar el puntero (`pointerup` / `releaseDrag`), la tension sostenida se apaga con un desvanecimiento exponencial de 18 ms.
- Se ejecuta la respuesta fisica habitual de rebote (sonido de impacto de gelatina `playSquish` + gota `playDroplet`).

---

## 4. Modulos y Archivos Afectados

1. **`src/utils/useJellyAsmrAudio.ts`**:
   - Nuevos perfiles acusticos: `VOCAL_FORMANT_PROFILES`.
   - Nuevas funciones del hook:
     - `startVocalTension(character: CharacterId, initialStretch?: number)`: Inicia el oscilador glotal continuo y los formantes.
     - `updateVocalTension(character: CharacterId, stretchRatio: number, dy: number)`: Modula F0, formantes y ganancia en vivo.
     - `stopVocalTension(character: CharacterId)`: Apaga suavemente el sonido vocal.
     - `playVocalComplainBurst(character: CharacterId, intensity?: number)`: Dispara la queja expresiva al cruzar el limite.

2. **`src/components/sandbox/CuteCharacterTactileCage.tsx`**:
   - Prop opcional o invocacion directa en `handlePointerMove` y `handlePointerUp` para comunicar el nivel de estiramiento al sistema de audio vocal.

3. **`src/components/sandbox/CuteCharactersStatic.tsx`**:
   - Canalizacion de las identidades de cada personaje (`morado`, `fucsia`, `amarillo`, `naranja`) hacia sus respectivas jaulas tactiles.

---

## 5. Criterios de Aceptacion y Verificacion

1. **Naturalidad Caricaturesca**: Los sonidos se perciben organicos y comicos, asemejando personitas de plastilina/goma, sin zumbidos electronicos sinteticos esteriles.
2. **Respuesta Inmediata**: Cero latencia perceptible al comenzar a arrastrar a cualquier personaje.
3. **Desconexion Limpia**: Al soltar el click o dedo, el quejido sostenido se apaga de forma limpia e instantanea sin clicks digitales (desvanecimiento suave de 15-20 ms).
4. **Cero Impacto en el Login**: No se alteran botones, estilos del formulario, bloqueo de scroll ni la responsividad del layout.
5. **Verificacion TypeScript**: `npx tsc --noEmit` debe compilar con 0 errores.
6. **Restricciones Globales**: Cero emojis en todas las respuestas y codigo.
