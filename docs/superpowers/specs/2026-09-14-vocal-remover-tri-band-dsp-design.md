# Diseño Técnico: Motor DSP Tri-Banda de Cancelación Vocal y Preservación de Ritmo

**Fecha:** 2026-09-14  
**Componente Afectado:** `src/hooks/use-vocal-remover.ts` y `src/components/PracticaView.tsx`  
**Objetivo:** Eliminar drásticamente la voz principal de la pista oficial de estudio en el modo Karaoke (manteniendo la sincronización de letras de LRCLIB al milisegundo) sin apagar la batería ni el bajo, y garantizando compatibilidad total sin cancelaciones destructivas en altavoces de celular (mono).

---

## 1. Contexto y Problema

Actualmente, AfinApp utiliza la pista de estudio oficial de YouTube para sincronizar letras con LRCLIB y evaluar la afinación del usuario. Sin embargo:
1. El algoritmo anterior en `use-vocal-remover.ts` utilizaba solo dos filtros de ecualización (`peaking` en 1.050 Hz y 2.600 Hz) en el canal central para evitar que la batería se apagara. Esto dejaba más del 75% de las frecuencias fundamentales de la voz humana (80 Hz a 500 Hz) y los formantes intactos, haciendo que el cantante se siguiera escuchando con claridad.
2. En implementaciones iniciales de inversión de fase tradicional ($L - R$ y $-(L - R)$), los altavoces de los teléfonos celulares (que suman a mono) cancelaban toda la pista ($L - R + R - L = 0$), causando silencio o caídas críticas de volumen.
3. Las grabaciones modernas incluyen reverberación estéreo amplia y coros a los lados (*Sides*) que no se eliminan con la cancelación central básica.

---

## 2. Solución Arquitectónica: DSP Tri-Banda Linkwitz-Riley

La señal de audio estéreo de YouTube se divide en tres bandas de frecuencia independientes antes de sumarse a la salida principal:

```
                  [HTMLAudioElement (Pista Oficial YouTube)]
                                     │
                        [MediaElementAudioSource]
                                     │
                          [ChannelSplitter (L / R)]
                         /           │           \
                        /            │            \
        ┌──────────────┴───┐ ┌───────┴─────────┐ ┌─┴────────────────┐
        │  1. BANDA GRAVES │ │ 2. BANDA VOCAL  │ │ 3. BANDA BRILLO  │
        │  (20 Hz - 200 Hz)│ │(200Hz - 6.5kHz) │ │ (6.5kHz - 20kHz) │
        └──────────────┬───┘ └───────┬─────────┘ └─┬────────────────┘
                       │             │             │
                 [Mono Sub Sum]  [Matriz Vocal    [Estéreo Hi-Fi]
                (Bombo & Bajo)    Diferencial +   (Platillos y Aire)
                 Fase Intacta     Filtro Reverb   (L_hi, R_hi)
                       │          Side Dinámico]   │
                       │             │             │
                       └─────────────┼─────────────┘
                                     │
                            [ChannelMerger (L / R)]
                                     │
                          [Makeup Gain Adaptativo]
                                     │
                         [DynamicsCompressorNode]
                                     │
                                [Master Gain]
                                     │
                              [Destination]
```

### 2.1. Banda 1: Graves Aislados (< 200 Hz - Bombo y Bajo)
* **Filtros:** Cascada de 2 filtros `lowpass` de 2º orden a 200 Hz ($Q = 0.707$, equivalente a Linkwitz-Riley de 24 dB/octava).
* **Enrutamiento:** Se suman en mono: $Bass_{mono} = 0.5 \times (L_{low} + R_{low})$.
* **Comportamiento:** Se inyecta con polaridad positiva idéntica a los canales izquierdo y derecho.
* **Resultado:** El bombo, el bajo eléctrico y el subgrave permanecen con pegada física al 100%, inmunes a cualquier cancelación de fase o suma mono en altavoces de teléfono.

### 2.2. Banda 2: Rango Vocal Medio (200 Hz – 6.500 Hz)
* **Filtros:** Crossover pasa-banda entre 200 Hz y 6.500 Hz.
* **Separación Mid / Side:**
  * $Mid = 0.5 \times (L_{mid} + R_{mid})$ (contiene la voz frontal seca y cuerpo instrumental).
  * $Side = 0.5 \times (L_{mid} - R_{mid})$ (contiene el estéreo instrumental y la reverberación).
* **Control de Voz Central (`vocalLevel` de 0.0 a 1.0):**
  * La ganancia del canal $Mid$ se atenúa progresivamente hasta $-36\text{ dB}$ cuando `vocalLevel = 0`.
* **Compatibilidad Mono en Celulares:**
  * En lugar de invertir la polaridad de $Side$ en el canal derecho ($Side$ vs $-Side$), se alimenta la señal $Side$ con la misma polaridad en ambos canales.
  * Para escucha en audífonos, se aplica una micro-decorrelación de fase acústica (dispersión de 6 ms mediante un `DelayNode`) en uno de los lados para recrear amplitud espacial sin provocar cancelación en mono.
  * Al reproducir en el celular (mono): $Side + Side = 2 \times Side$, eliminando la voz frontal sin cancelar la música.
* **Supresión Dinámica de Reverberación Lateral (Opción C):**
  * Se inserta un filtro `peaking` dinámico en la cadena $Side$ sintonizado en 1.800 Hz ($Q = 1.0$).
  * A `vocalLevel = 0.0`: Atenúa hasta $-14\text{ dB}$, apagando la cola de reverberación y los coros del cantante original.
  * De `vocalLevel = 0.0` a `0.5`: La atenuación se relaja suavemente de $-14\text{ dB}$ a $0\text{ dB}$, restituyendo el ambiente estéreo original de la sala.

### 2.3. Banda 3: Brillo y Aire (> 6.500 Hz)
* **Filtros:** Filtro `highpass` en 6.500 Hz.
* **Enrutamiento:** Conexión directa en estéreo ($L_{hi}$, $R_{hi}$).
* **Resultado:** Los platillos, hi-hats, percusiones menores y brillo acústico se mantienen cristalinos e inalterados.

### 2.4. Etapa de Salida y Masterización
1. **Makeup Gain Adaptativo:**
   * Al eliminar la energía acústica de la voz principal, el sistema incrementa automáticamente la ganancia general hasta $+3.8\text{ dB}$ (multiplicador $\approx 1.55\times$) a nivel 0% de voz, evitando cualquier caída de sonoridad perceptible.
2. **Compresor Dinámico de Estudio (`DynamicsCompressorNode`):**
   * Umbral: $-8\text{ dB}$, Ratio: $4:1$, Knee: $6\text{ dB}$, Attack: $3\text{ ms}$, Release: $120\text{ ms}$.
   * Elimina sobre-modulaciones o distorsión en altavoces pequeños.
3. **Master Gain:**
   * Control directo del volumen general fijado por el usuario (0 a 100%).

---

## 3. Comportamiento Dinámico del Deslizador de Voz

| Nivel de Voz (`vocalLevel`) | Ganancia Mid (Voz Frontal) | Filtro Reverb Side (1.8 kHz) | Makeup Gain | Resultado Acústico |
| :--- | :--- | :--- | :--- | :--- |
| **0.0 (Karaoke)** | **-36.0 dB** | **-14.0 dB** | **+3.8 dB** | Voz y reverberación eliminadas. Batería, bajo y ritmo al 100%. |
| **0.2 (Guía Mínima)** | -18.0 dB | -8.0 dB | +2.8 dB | Voz tenue de referencia con ritmo intacto. |
| **0.5 (Mitad)** | -8.0 dB | 0.0 dB (Plano) | +1.5 dB | Voz clara pero detrás de la pista instrumental. |
| **1.0 (Original)** | 0.0 dB (Plano) | 0.0 dB (Plano) | 0.0 dB | Audio estéreo original de estudio idéntico a la fuente. |

---

## 4. Requisitos de Integración en el Código

1. **`src/hooks/use-vocal-remover.ts`**:
   * Reescribir la construcción del grafo en `initAudio()` incorporando los nodos de crossover tri-banda, la matriz mono-compatible y el filtro dinámico de reverberación.
   * Actualizar `updateMix(vocalLvl, drumBoostLvl)` para modular en tiempo real los parámetros de ganancia y ecualización con transiciones suaves (`setTargetAtTime`, constante de tiempo $0.02\text{ s}$).
   * Mantener completa compatibilidad de API para evitar romper componentes dependientes.

2. **`src/components/PracticaView.tsx`**:
   * Mantener el deslizador de voz existente y los botones de silencio.
   * Asegurar que el reintento de audio web tenga tolerancia antes de conmutar a `useYtFallback`.

---

## 5. Criterios de Aceptación y Verificación

1. **Supresión Vocal Eficaz:** Al fijar el deslizador en 0%, la voz principal de la canción oficial desaparece drásticamente (reducción percibida > 85-90%).
2. **Pegada de Batería y Bajo:** El bombo y el bajo eléctrico suenan definidos y con pegada tanto a 0% como a 100% de voz.
3. **Altavoz Mono de Teléfono:** Al reproducirse en un teléfono móvil o forzar mono en el sistema, la música no se auto-cancela ni se apaga el volumen.
4. **Sincronización LRCLIB:** Las letras y la barra de afinación continúan sincronizadas al milisegundo exacto con el audio.
5. **Calidad de Código:** `npx tsc --noEmit` compila con 0 errores de TypeScript.
