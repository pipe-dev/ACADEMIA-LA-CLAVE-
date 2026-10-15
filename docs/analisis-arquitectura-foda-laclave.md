# Auditoría Técnica de Arquitectura, Estado de Flujos y Matriz FODA
**Sistema Web Audio & Gamificación — Academia La Clave (AfinApp)**  
*Autor: Senior Full-Stack Engineer & Audio Systems Architect*  
*Versión: 2.4.0 — Mapeo Exhaustivo del Código Fuente*

---

## 1. Radiografía Técnica de las 4 Pestañas Principales

La aplicación opera como una SPA en Next.js / React 19 con un orquestador central (`MainApp.tsx` y `MainAppContent.tsx`), gestionada por un hook de estado global (`useGlobalGameState.ts`) y persistencia local multi-clave en `localStorage`.

```
                    ┌─────────────────────────┐
                    │       MainApp.tsx       │
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   AcademiaView   │    │   AfinadorView   │    │   PracticaView   │
│ (Ruta Pedagógica)│    │(Laboratorio Audio│    │ (Karaoke & DSP)  │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │      ProgresoView       │
                    │ (Biometría & Métricas)  │
                    └─────────────────────────┘
```

---

### 1.1 Pestaña Academia (`AcademiaView.tsx` / `useUnitProgression.ts`)

#### Propósito y Mecánica Real
Ruta de aprendizaje estructurada estilo árbol secuencial (Duolingo-style) dividida en 4 Unidades temáticas declaradas en `src/data/academyData.ts`:
1. **Unidad 1: Respiración y Fisiología Vocal** (Fundamentos, Globo de aire, Diafragma, Apoyo, Postura, Examen U1).
2. **Unidad 2: Afinación y Oído Musical** (Solfeo, Intervalos, Reto de notas fundamentales, Precisión, Examen U2).
3. **Unidad 3: Tempo y Coordinación** (Pulso interno, Palmas rítmicas, Bombo + Voz, Polirritmia, Examen U3).
4. **Unidad 4: Expresión, Dicción y Estilo** (Dinámicas, Resonancia, Flappy Voice, Dicción, Certificación U4).

#### Tipos de Nodos y Componentes Reales
- **`concept` (`ConceptLessonView.tsx`):** Lección teórica interactiva con video embed de YouTube y un cuestionario evaluativo de 4 preguntas de opción múltiple. Penaliza vidas en fallo (`handleLoseLife('academia')`).
- **`exercise`:** Minijuegos Web Audio en tiempo real:
  - `BalloonExerciseView.tsx`: Control de presión de aire y fonación sostenida; el globo se infla con micrófono por encima del umbral RMS.
  - `TunerPitchChallengeView.tsx`: Reto de afinación guiada con tolerancia en cents y tiempo de retención.
  - `TunerRhythmView.tsx`: Reto rítmico con metrónomo y sincronización de pulsos tap/voz.
  - `VoiceFlappyGameView.tsx`: Juego de destreza vocal donde la frecuencia detectada en Hz controla la altitud del avatar.
- **`control`:** Nodo de verificación de hitos intermedios.
- **`exam` (`ExamView.tsx`):** Examen formal exhaustivo sin ayudas que desbloquea la celebración de unidad (`UnitCelebrationModal.tsx`) y abre la siguiente unidad.

#### Persistencia y Estado
- Clave: `laclave_units_v8` (guarda los estados `locked`, `current`, `completed` de cada nodo con lógica *self-healing*).
- Dispara eventos de racha (`emitStreakEligibleAction`), suma XP (`recordDailyXpGain`), registra lección en `recentLessons` (hasta 5 lecciones) y re-evalúa insignias (`evaluateBadges`).
- Soporte offline: encola acciones en `queueOfflineAction({ type: 'LESSON_COMPLETE', ... })`.

---

### 1.2 Pestaña Afinador (`AfinadorView.tsx` / `useAfinadorPitch.tsx` / `useAfinadorLevels.ts`)

#### Propósito y Motor DSP
Es el núcleo biométrico y de entrenamiento de afinación. Emplea la Web Audio API con `AudioContext` de baja latencia (`latencyHint: 'interactive'`) y un detector de tono por autocorrelación/YIN en bucle `requestAnimationFrame`.

#### Modos de Operación
1. **Modo Libre (Cromático):**
   - Teclado cromático adaptativo de 12 notas filtrado por el rango vocal efectivo del usuario (`effectiveRangeData`).
   - Muestras de audio reales de voz humana (`female` / `male`) cargadas desde `/sounds/*.mp3` vía `audioService.playVoiceNote`, con fallback a oscilador senoidal puro.
   - Detección de cents ($-50$ a $+50$), suavizado dinámico contra jitter, umbral de silencio RMS y aguja reactiva (`PitchGauge.tsx`).
   - Partículas reactivas (`AudioParticleCanvas.tsx`) y gráfico de estabilidad de tono (`PitchStabilityChart.tsx`).
   - Sostener la nota en ventana verde suma combo, racha y dispara `onUpdateQuestProgress(1)` (incrementa contador de notas afinadas).
   - **Auto-expansión continua de tesitura:** Llama en vivo a `checkAndExpandVocalRange(frequency, noteName, ...)` expandiendo los límites registrados en `laclave_vocal_range_saved` si el usuario produce notas válidas más graves o agudas.
2. **Modo Niveles (Tug-of-War / Gamificado):**
   - 5 niveles de dificultad: *Calentamiento*, *Fácil*, *Medio*, *Difícil*, *Extremo*.
   - Mecánica de "tira y afloja": sostener el tono afinado jala la barra hacia el 100%; desentonar o callar la hace retroceder. Penaliza con pérdida de vida al agotarse el tiempo.

#### Los 6 Aparatos y Programas Especializados (Acordeón)
1. **`VocalRangeModal.tsx` ("Evaluar mi Rango"):** Barrido vocal guiado (grave a agudo) con micrófono, cálculo de octavas, clasificación (Soprano, Mezzo, Contralto, Tenor, Barítono, Bajo) y prompt de cadencia cada 6 días (`VocalRangeCadencePrompt.tsx`).
2. **`VoiceEvalModal.tsx` ("Diagnóstico Vocal"):** Test de 3 notas que mide precisión, vibrato y estabilidad tímbrica.
3. **`BreathingModal.tsx` ("Aparato de Respiración"):** Temporizador visual diafragmático (Inhalar 4s, Sostener 4s, Exhalar 6s, Pausa 2s).
4. **`EscalasModal.tsx` ("Escalas Vocales"):** 12 escalas fundamentales y modales con reproducción y seguimiento de afinación.
5. **`StabilityChallengeModal.tsx` ("Reto de Estabilidad"):** Reto de sostener una nota en mic con variabilidad menor a $\pm 10$ cents durante $N$ segundos.
6. **`DueloRapidoModal.tsx` ("Duelo Rápido"):** Desafío contrarreloj de velocidad y puntería de notas.

---

### 1.3 Pestaña Práctica (`PracticaView.tsx` / `useKaraokeEngine.ts`)

#### Propósito y Arquitectura
Plataforma de aplicación real y rendimiento sobre canciones reales. Combina video, letras sincronizadas y análisis de voz sobre pista.

#### Componentes del Pipeline
- **Catálogo de Pistas (`RECOMMENDED_TRACKS`, `SONGS_DATABASE`):** Filtros por categorías (Pop, Rock, Baladas, Música Cristiana) y buscador integrado.
- **Reproductor Sincronizado:** Integra `react-youtube` con letras en formato LRC (`fetchLyrics` / `parseLrc`).
- **Atenuador Vocal Tri-banda DSP (`use-vocal-remover.ts`):** Red de `BiquadFilterNode` de Web Audio para atenuar la voz solista original en tiempo real permitiendo cantar sobre la pista.
- **Polígrafo Vocal (`polygraph-canvas.tsx`):** Renderizado en canvas HTML5 que contrasta la curva de pitch teórica de la canción contra la trayectoria real emitida en el micrófono del usuario.
- **Motor de Puntaje (`useKaraokeScoring.ts`):** Porcentaje de acierto, multiplicador de combo, sistema de 1 a 3 estrellas, cálculo de XP y modal de resultados (`KaraokeResultsModal.tsx`).
- **Gestión de Vidas:** Consume vidas o fichas de canciones de cortesía (`isCourtesySongActive`).

---

### 1.4 Pestaña Progreso (`ProgresoView.tsx` / `useGlobalGameState.ts`)

#### Propósito y Componentes de Métricas Reales
Centro de comando y analítica personal del usuario:
1. **`ProgresoLevelCard.tsx`:** Nivel 1 a 20 (`calculateLevelFromXP`), título de rango (*Vocalista Principiante* hasta *Maestro de la Clave*), barra XP y Native Web Share.
2. **`ProgresoDailyGoalCard.tsx`:** Selector de meta (5, 10, 15, 20 min) con anillo SVG de progreso diario (`todayPracticeMinutes`).
3. **`ProgresoConsistencyStreak.tsx`:** Racha semanal con lógica de llama activa/apagada (`streakPrompt.ts`).
4. **`ProgresoWeeklyChart.tsx`:** Histograma Lunes-Domingo de minutos de práctica reales extraídos de `laclave_calendar_week_v2`.
5. **`ProgresoXpChart.tsx`:** Curva de evolución de XP de los últimos 7 días calculada mediante `laclave_xp_evolution_history_v2`.
6. **`ProgresoVocalRangeSection.tsx`:** Gráfico dinámico de tesitura/rango vocal (Hz mínimo/máximo, semitonos, octavas, botón *"Evaluar mi Rango"* y escucha reactiva de eventos `'laclave_vocal_range_updated'`).
7. **`ProgresoRecentLessons.tsx`:** Feed de las 5 lecciones más recientes con puntajes y timestamps.
8. **`ProgresoBadgesSection.tsx`:** Sistema de 50 insignias reales divididas por dificultad con modal de detalle y cero-reset.
9. **`ProgresoQuestsSection.tsx`:** Lista de misiones diarias con botón de cobro de recompensa en XP y disparador de sonido.
10. **`FriendsSection.tsx`:** Integración comunitaria de retos y clasificaciones.

---

## 2. Matriz FODA Integral (SWOT)

| Pestaña / Módulo | Fortalezas (F) | Oportunidades (O) | Debilidades (D) | Amenazas (A) |
| :--- | :--- | :--- | :--- | :--- |
| **Academia** | • Mapeo pedagógico coherente en 4 unidades.<br>• Gran variedad de minijuegos con Web Audio.<br>• Persistencia resiliente con auto-reparación.<br>• Integración de vidas y exámenes de certificación. | • Emitir eventos detallados de tipo de lección (`concept`, `exercise`, `exam`) para misiones dinámicas.<br>• Permitir modo "repaso" de lecciones completadas para ganar XP diario. | • Acoplamiento rígido en `useUnitProgression.ts` (ID `'quest-3'` hardcodeado).<br>• Si el usuario completa los 28 nodos, no puede cumplir misiones de lecciones nuevas. | • Frustración del usuario novato si se queda sin vidas en exámenes difíciles sin gemas. |
| **Afinador** | • Motor DSP YIN de bajísima latencia.<br>• Muestras de audio vocales reales con diferenciación por género.<br>• Teclado cromático adaptativo por rango vocal.<br>• 6 herramientas biometriales profesionales.<br>• Auto-expansión continua de tesitura en tiempo real. | • Conectar las 6 herramientas biometriales al sistema de misiones diarias.<br>• Misiones de racha o estabilidad de afinación (ej. sostener nota <10 cents de error). | • Solo Modo Libre emite notas afinadas a misiones; Modo Niveles y las 6 herramientas no emiten eventos.<br>• Alta carga computacional en móviles de gama baja con partículas activas. | • Ruido ambiente o micrófonos deficientes que desvían la detección o arrojan falsos positivos. |
| **Práctica (Karaoke)** | • Sincronización precisa de YouTube con letras LRC.<br>• Filtro de atenuación vocal en tiempo real por Web Audio.<br>• Polígrafo visual en canvas.<br>• Sistema de calificación por estrellas y vidas. | • Activar el temporizador de minutos de práctica reales mientras la pista suena.<br>• Misiones de rendimiento (ej. lograr 2 estrellas, cantar 1 canción completa). | • `onUpdateQuestProgress` está inyectado en `useKaraokeEngine`, pero el código nunca lo llama.<br>• No aportaba minutos de práctica a las misiones diarias. | • Latencia inherente en auriculares Bluetooth en smartphones.<br>• Videos de YouTube que pueden caerse por derechos de autor. |
| **Progreso** | • Métricas reales 100% conectadas (minutos, racha, nivel 1-20, tesitura, XP 7 días).<br>• 50 insignias reales categorizadas.<br>• UI pulida en Dark Mode y Zen Mode.<br>• Reactividad instantánea ante eventos locales. | • Motor de rotación determinista de misiones diarias según fecha (`YYYY-MM-DD`).<br>• Notificación contextual en BottomNav cuando hay misiones listas para cobrar. | • Misiones diarias estáticas en `INITIAL_QUESTS` sin fecha de reseteo ni rotación.<br>• Cobrar misión reseteaba su progreso a 0 el mismo día permitiendo farmeo ilimitado. | • Desincronización entre múltiples pestañas del navegador si no se sincroniza localStorage. |

---

## 3. Diagnóstico y Arquitectura Real para las Misiones Diarias

### 3.1 La Causa Raíz del Problema
Las propuestas de misiones genéricas previas fallaban porque prometían acciones que el código actual no podía escuchar ni medir:
1. **Desconexión de Llamadas:** En `useKaraokeEngine.ts`, `onUpdateQuestProgress` se recibe en parámetros pero jamás se ejecuta en el bucle de reproducción.
2. **Islas Desconectadas:** Modales como `BreathingModal`, `EscalasModal`, `StabilityChallengeModal`, `VocalRangeModal` y `VoiceEvalModal` no tienen acceso ni emiten eventos a `useGlobalGameState`.
3. **Hardcoding Estricto:** `useGlobalGameState` y `useUnitProgression` tenían cableado directo:
   - `handleUpdateNotesTuned` solo buscaba `q.id === 'quest-1'`.
   - `handleUpdatePracticeTime` solo buscaba `q.id === 'quest-2'`.
   - `handleCompleteNode` solo buscaba `q.id === 'quest-3'`.
4. **Ausencia de Ciclo Diario:** No existía persistencia de fecha (`laclave_quests_date`). Si el usuario abría la app al día siguiente, tenía las mismas 3 misiones completadas o a medio hacer.

---

### 3.2 El Contrato Unificado de Eventos de la Aplicación

Para que cualquier misión sea real, viable y robusta, creamos un **Despachador Central de Acciones de Juego** (`gameEvents.ts` o hook global) que escucha las acciones genuinas que la app ya realiza:

```typescript
export type GameEventType =
  | 'NOTE_TUNED'            // Afinador Modo Libre: cada nota afinada (+1)
  | 'LEVEL_COMPLETED'       // Afinador Modo Niveles: nivel superado (+1)
  | 'PRACTICE_MINUTES'      // Práctica/Afinador: minutos activos sumados
  | 'ACADEMY_LESSON_DONE'   // Academia: cualquier nodo completado o repasado
  | 'VOCAL_RANGE_TESTED'    // Modal Rango: evaluación de tesitura finalizada
  | 'BREATHING_SESSION'     // Modal Respiración: ciclo completado
  | 'SCALE_TRAINED'         // Modal Escalas: escala practicada
  | 'STABILITY_PASSED'      // Modal Estabilidad: reto sostenido exitosamente
  | 'KARAOKE_COMPLETED';    // Práctica: canción finalizada con puntaje
```

---

### 3.3 Catálogo Técnico Real de Misiones Rotativas

Definimos una bolsa de **12 misiones viables**, vinculadas 1:1 a los eventos reales:

#### Categoría A: Afinación & Biometría (Afinador)
1. **`tune_25_notes`:** *"Afina 25 notas"* (Evento: `NOTE_TUNED`, meta: 25, XP: 40).
2. **`tune_50_notes`:** *"Afina 50 notas"* (Evento: `NOTE_TUNED`, meta: 50, XP: 70).
3. **`complete_tuner_level`:** *"Supera 1 nivel en Modo Niveles"* (Evento: `LEVEL_COMPLETED`, meta: 1, XP: 80).
4. **`vocal_range_eval`:** *"Evalúa tu Rango Vocal en el Afinador"* (Evento: `VOCAL_RANGE_TESTED`, meta: 1, XP: 75).

#### Categoría B: Academia & Pedagogía
5. **`complete_academy_lesson`:** *"Completa 1 lección en la Academia"* (Evento: `ACADEMY_LESSON_DONE`, meta: 1, XP: 60).
6. **`complete_two_lessons`:** *"Supera 2 lecciones o ejercicios"* (Evento: `ACADEMY_LESSON_DONE`, meta: 2, XP: 100).

#### Categoría C: Gimnasia Vocal (Aparatos y Modales)
7. **`breathing_session`:** *"Realiza 1 sesión en el Aparato de Respiración"* (Evento: `BREATHING_SESSION`, meta: 1, XP: 50).
8. **`train_vocal_scale`:** *"Entrena 1 escala en el modal de Escalas"* (Evento: `SCALE_TRAINED`, meta: 1, XP: 60).
9. **`stability_challenge`:** *"Supera el Reto de Estabilidad Vocal"* (Evento: `STABILITY_PASSED`, meta: 1, XP: 65).

#### Categoría D: Práctica, Karaoke & Tiempo
10. **`practice_5_minutes`:** *"Entrena al menos 5 minutos hoy"* (Evento: `PRACTICE_MINUTES`, meta: 5, XP: 50).
11. **`practice_15_minutes`:** *"Alcanza 15 minutos de práctica diaria"* (Evento: `PRACTICE_MINUTES`, meta: 15, XP: 80).
12. **`finish_karaoke_song`:** *"Canta 1 canción en la pestaña Práctica"* (Evento: `KARAOKE_COMPLETED`, meta: 1, XP: 70).

---

### 3.4 Motor de Rotación Determinista Diario (Arquitectura)

1. **Semilla de Fecha:** Se calcula `const today = getTodayStr()` (ej. `"2026-10-04"`).
2. **Verificación de Fecha en `localStorage` (`laclave_daily_quests_v4`):**
   - Si la fecha guardada coincide con hoy, se cargan las misiones activas y su progreso acumulado.
   - Si la fecha es de un día anterior (o primera vez):
     - Se ejecuta una función pseudo-aleatoria basada en el hash de la fecha (garantizando que todos los usuarios tengan las mismas 3 misiones cada día y que roten exactamente a medianoche).
     - La selección elige **3 misiones equilibradas**: 1 de Afinación, 1 de Academia/Gimnasia y 1 de Tiempo/Práctica.
     - Se inicializan en `progress: 0, completed: false, claimed: false`.
3. **Escucha y Actualización Centralizada:**
   - Cada vez que ocurre un evento de juego, `notifyQuestEvent(type, amount)` recorre las 3 misiones activas. Si el tipo coincide y no está completada, incrementa el progreso y dispara un toast al completarse.
4. **Reclamo de Recompensa Sin Reseteo Tramposo:**
   - Al pulsar *"Reclamar Recompensa"*, la misión queda en estado `claimed: true` con su insignia de cobrada, otorgando el XP al usuario pero impidiendo volver a farmearla el mismo día.

---

## 4. Plan de Acción Técnico Inmediato

1. **Crear `src/utils/dailyQuestsEngine.ts`:**
   - Definir catálogo maestro tipado con `eventType`.
   - Algoritmo de rotación determinista por fecha `getTodayQuests(todayStr)`.
   - Gestor de eventos `processQuestProgress(quests, eventType, amount)`.
2. **Conectar Emisores en las Pestañas:**
   - En `useKaraokeEngine.ts`: Llamar al evento de tiempo durante la reproducción y al evento `KARAOKE_COMPLETED` al finalizar la canción.
   - En `BreathingModal.tsx`, `EscalasModal.tsx`, `StabilityChallengeModal.tsx`, `VocalRangeModal.tsx`: Emitir su respectivo evento al culminar la sesión con éxito.
   - En `useAfinadorLevels.ts`: Emitir `LEVEL_COMPLETED` al ganar el tirón de guerra.
   - En `useUnitProgression.ts`: Emitir `ACADEMY_LESSON_DONE`.
3. **Actualizar `ProgresoQuestsSection.tsx`:**
   - Reflejar visualmente los estados: `En progreso`, `Completada (Lista para reclamar)`, y `Reclamada`.
   - Mostrar el tiempo restante para el reinicio de las misiones (cuenta regresiva a medianoche).
