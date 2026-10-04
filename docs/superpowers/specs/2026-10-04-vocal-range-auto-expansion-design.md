# Especificación de Diseño: Auto-Expansión y Calibración Continua de Rango Vocal

**Fecha:** 2026-10-04  
**Estado:** Aprobado  
**Objetivo:** Implementar la auto-expansión continua e unidireccional (ratchet) del rango vocal del usuario a través de sus prácticas reales en Afinador y exámenes de Academia, simplificar el botón de evaluación, establecer una cadencia de calibración periódica cada 6 días con aviso contextual (Opción A), y desplegar retroalimentación inteligente detallada al finalizar cada evaluación.

---

## 1. Motivación y Principios de Diseño

1. **Pedagogía Vocal (Regla del Trinquete / Unidirectional Ratchet):**  
   La musculatura y flexibilidad vocal se desarrollan con la práctica. Cuando un cantante logra emitir una nota más grave o más aguda de manera afinada y estable, ha conquistado una nueva frontera en su extensión vocal. El récord histórico y la gráfica de progreso **nunca deben disminuir o encogerse**.
2. **Evaluación Continua y Pasiva:**  
   El usuario no debería verse obligado a ejecutar un test formal cada vez que progresa. Si en un calentamiento, reto de afinación o examen canta un Sol2 o un Do5 afinado, la app debe acreditar esa expansión en su perfil y en la gráfica de progreso automáticamente.
3. **Exclusión Estricta de Karaoke (`PracticaView.tsx`):**  
   En el karaoke existen pistas musicales continuas, sibilancias y transiciones rápidas que no proveen contraste acústico aislado para certificar notas extremas. Se excluye al 100%.
4. **Cadencia Periódica Amigable (Cada 6 Días):**  
   Para mantener la calibración formal fresca sin ser invasivos, cada 6 días se invita al usuario a realizar una medición completa. La Opción A (aviso contextual con opción de posponer) previene la fricción.

---

## 2. Cambios en la Interfaz (UI)

### 2.1 Botón de Evaluación en Progreso (`ProgresoVocalRangeSection.tsx`)
* **Texto anterior:** `"¡Evaluar mi Rango Vocal con Micrófono!"`
* **Texto nuevo:** `"Evaluar mi Rango"`
* **Propiedades visuales:** Se conserva el icono de micrófono, el gradiente/estilo del botón y los micro-estados hover/tap.

### 2.2 Pantalla de Resultados (`VocalRangeResultStep.tsx`)
Se incorpora una tarjeta de comparación de resultados que contrasta la prueba actual contra el récord histórico guardado:
* **🌟 Doble Expansión:** Notificación celebratoria de aumento en ambos extremos (nueva nota mínima y nueva nota máxima).
* **⬇️ Expansión en Graves:** Reconocimiento de mayor relajación y registro bajo.
* **⬆️ Expansión en Agudos:** Reconocimiento de mayor soporte, proyección y registro alto.
* **🛡️ Récord Protegido (Sin Expansión):** Mensaje positivo confirmando que su mejor marca histórica se mantiene a salvo y explicando la variabilidad natural de la voz.
* **🎯 Primera Evaluación:** Mensaje de bienvenida estableciendo la línea base de partida.

---

## 3. Motor de Auto-Expansión Continua (`vocalRangeHelper.ts`)

### 3.1 Función Núcleo `checkAndExpandVocalRange`
```typescript
export interface ExpansionResult {
  expanded: boolean;
  expandedMin: boolean;
  expandedMax: boolean;
  previousRange: VocalRangeData | null;
  newRange: VocalRangeData;
}

export function checkAndExpandVocalRange(
  pitchHz: number,
  noteName: string,
  source: 'afinador' | 'academia' | 'manual'
): ExpansionResult | null;
```

### 3.2 Lógica de Expansión
1. Lee `laclave_vocal_range_saved`. Si no existe, no auto-expande pasivamente hasta que haya una prueba inicial o toma la nota si se inicia un perfil.
2. Si `pitchHz < currentMinHz`:
   - `newMinHz = pitchHz`
   - `newNoteMin = noteName`
   - Marca `expandedMin = true`
3. Si `pitchHz > currentMaxHz`:
   - `newMaxHz = pitchHz`
   - `newNoteMax = noteName`
   - Marca `expandedMax = true`
4. Si `expandedMin` o `expandedMax` es verdadero:
   - Recalcula octavas: `Math.log2(newMaxHz / newMinHz)`.
   - Re-clasifica la voz (`classifyVoice`).
   - Persiste en `laclave_vocal_range_saved`.
   - Agrega un nuevo hito al historial `laclave_vocal_range_history_v1` con fecha del día para nutrir la gráfica de evolución.

### 3.3 Filtro de Seguridad Acústica (Anti-Ruido)
Para evitar que golpes al micrófono, estática o carraspeos introduzcan notas erráticas:
- En `useAfinadorPitch.tsx`: Solo se invoca cuando `isMatched === true` y la nota ha sido sostenida dentro de la tolerancia de afinación.
- En `usePitchChallengeEngine.ts`: Solo se invoca cuando la nota es completada con éxito (`audioService.playSoftDing()` tras hold de ~650ms).

---

## 4. Cadencia de Calibración Periódica (Cada 6 Días)

### 4.1 Persistencia
* **Clave de almacenamiento:** `laclave_last_vocal_range_check_date` (guarda fecha en formato ISO o timestamp en ms).
* **Clave de posponer:** `laclave_vocal_range_snoozed_until` (timestamp en ms).

### 4.2 Lógica de Disparo
1. Al cargar `ProgresoView` o `AfinadorView`:
   - Si `now < snoozed_until`, no mostrar.
   - Si `now - last_check >= 6 * 24 * 60 * 60 * 1000` (o no existe `last_check` pero sí hay un rango inicial registrado hace más de 6 días):
     - Muestra el componente modal/banner `VocalRangeCadencePrompt`.
2. Opciones del Prompt:
   - **"Evaluar mi Rango Ahora"**: Abre directamente el modal de medición (`VocalRangeModal`). Al guardar, se actualiza `laclave_last_vocal_range_check_date = Date.now()` y se borra cualquier `snooze`.
   - **"Recordarme Mañana"**: Fija `snoozed_until = Date.now() + 24 * 60 * 60 * 1000` (pospone 24 horas).

---

## 5. Pruebas y Criterios de Aceptación

1. **Botón:** En `ProgresoView`, el botón dice `"Evaluar mi Rango"`.
2. **Auto-expansión en Afinador:**
   - Si el rango guardado es `La2 (110 Hz) - Do5 (523 Hz)`.
   - Cantando y afinando `Sol2 (98 Hz)` en el afinador, el rango se actualiza a `Sol2 - Do5`.
   - Cantando `Do4 (261 Hz)` (nota intermedia), el rango se mantiene intacto.
3. **Auto-expansión en Academia:**
   - En un examen de recuperación o lección con `TunerPitchChallengeView`, cantar una nota más alta que el límite previo actualiza el rango y registra el hito.
4. **Karaoke sin impacto:**
   - En `PracticaView.tsx`, ninguna nota cantada altera `laclave_vocal_range_saved`.
5. **Cadencia de 6 días:**
   - Con `last_check` simulado hace 7 días, al entrar a Progreso aparece el aviso amigable.
   - Si se elige "Recordarme Mañana", el aviso se oculta de inmediato.
   - Si se completa la evaluación, se muestra la tarjeta de retroalimentación correspondiente (Doble expansión, Graves, Agudos o Récord Protegido).
