# Documentacion Tecnica Integral de la Aplicacion Academia La Clave

## 1. Resumen General del Sistema y Arquitectura

Academia La Clave es una plataforma web progresiva (PWA) de entrenamiento vocal, solfeo interactivo, afinacion en tiempo real y pedagogia musical. La solucion esta desarrollada sobre Next.js con arquitectura basada en React, TypeScript y Tailwind CSS, operando fundamentalmente en el lado del cliente (Client-Side Rendering) para procesamiento de senales de audio mediante la Web Audio API con cero latencia perceptible.

### Principios Fundamentales de Diseno
- Procesamiento Local de Senales: La captura de microfono, analisis de tono (Pitch Detection via algoritmo YIN / Autocorrelacion) y sintesis de audio suceden directamente en el hilo de audio del navegador del usuario.
- Resiliencia Offline y PWA: Soporte completo de funcionamiento sin conexion a internet, sincronizacion diferida de progreso y cacheado de activos mediante Service Workers.
- Gamificacion Integral: Sistema de vidas pasivas con regeneracion temporal, rachas de practica diaria, sistema de niveles con curva de experiencia (XP), arbol pedagogico de 4 unidades desbloqueables y 50 insignias autenticas evaluadas en tiempo real.
- Modularidad y Desacoplamiento: Modulos divididos en componentes con un limite estricto de lineas, gestionados mediante buses de eventos (`CustomEvent`) y hooks de estado coordinados.

---

## 2. Flujo de Inicializacion, Arranque y Middleware

### 2.1 Archivos de Entrada del Framework
- `src/app/layout.tsx`: Define el cascaron HTML raiz, la configuracion de viewport para dispositivos moviles, metadatos PWA (manifest, iconos, theme-color) e importa las fuentes tipograficas y estilos globales.
- `src/app/page.tsx`: Punto de entrada de la vista principal. Carga dinamicamente el componente `MainApp` mediante `dynamic import` con `ssr: false` para asegurar que las APIs de Web Audio, Canvas y LocalStorage no se ejecuten durante el renderizado estatico del servidor.
- `src/middleware.ts`: Control de enrutamiento y encabezados de seguridad HTTP.
- `src/app/login/page.tsx`: Pantalla de autenticacion y gestion de sesiones para usuarios de la academia.

### 2.2 Secuencia de Arranque y Splash Screen
- `src/components/SplashScreen.tsx`: Pantalla de carga animada que verifica la disponibilidad de activos, inicializa el motor de audio y valida la compatibilidad del navegador. Muestra frases pedagogicas rotativas de calentamiento vocal y una barra de progreso que culmina al liberar la interfaz principal.
- `src/components/OfflineSyncBanner.tsx`: Monitorea el estado de red (`navigator.onLine`). Si el usuario pierde conexion, despliega una alerta visual indicando que la aplicacion continua 100% operativa en modo local y encola las acciones pendientes.
- `src/utils/tour.ts`: Motor de induccion guiada basado en Driver.js. Si el usuario ingresa por primera vez (`laclave_tour_completed !== 'true'`), ejecuta un recorrido paso a paso por los 4 pilares de la aplicacion (Academia, Afinador, Practica, Progreso).

---

## 3. Gestion del Estado Global y Ciclo de Vida

El estado maestro de la aplicacion se encuentra orquestado en `src/components/MainApp.tsx` y subdividido en hooks especializados dentro de `src/components/main-app/`.

### 3.1 useGlobalGameState (`src/components/main-app/useGlobalGameState.ts`)
Centraliza los datos criticos del perfil del usuario:
- `userStats`: Objeto que almacena nivel, experiencia total (XP), vidas actuales, fecha de ultima recarga, racha de dias consecutivos, minutos de practica diaria y acumulada, clasificacion de rango vocal y listado de insignias.
- `dailyQuestsState`: Estado del motor de misiones diarias rotativas y cofre de bonificacion.
- `toasts`: Cola de notificaciones emergentes para logros, niveles alcanzados, misiones completadas e insignias desbloqueadas.
- Sincronizacion de eventos: Escucha el bus global de misiones `laclave_quest_event` y actualiza el progreso en tiempo real.

### 3.2 useLivesState (`src/components/main-app/useLivesState.ts`)
Controla la mecanica de vidas del usuario:
- Regeneracion Pasiva: Cada vida perdida se regenera automaticamente cada 30 minutos de inactividad o tiempo transcurrido, calculada mediante marcas de tiempo Unix en `src/utils/livesEngine.ts`.
- Deduccion de Vidas: Si el usuario falla en una evaluacion o leccion critica, se descuenta una vida.
- Bloqueo y Recuperacion: Al llegar a 0 vidas, los modos de juego y niveles se bloquean, ofreciendo opciones de examen de recuperacion, canciones de cortesia o adquisicion de recarga mediante puntos de experiencia.

### 3.3 useUnitProgression (`src/components/main-app/useUnitProgression.ts`)
Administra el arbol pedagogico de lecciones de la Academia:
- Carga y reconcilia los nodos completados contra la definicion estatica de `INITIAL_UNITS` en `src/data/academyData.ts`.
- Desbloqueo Secuencial: Al completar con exito el nodo actual (`handleCompleteNode`), se habilita el nodo adyacente y se guardan las estadisticas en `laclave_units_v8`.
- Transicion entre Unidades: Controla la apertura de las celebraciones interactivas de final de unidad y desbloquea el primer nodo de la unidad subsiguiente.

### 3.4 useThemeAndZen (`src/components/main-app/useThemeAndZen.ts`)
- Control de Modo Oscuro (`darkMode`): Alterna clases CSS en el contenedor raiz y guarda la preferencia en almacenamiento local.
- Modo Zen (`zenMode`): Interfaz minimalista en tonos dorados y oscuros (`#161719` y `#e5b83b`) que oculta distracciones numericas para sesiones de concentracion profunda.
- Ruido Ambiente (`ambientSound`): Generador de audio de fondo relajante (lluvia, frecuencias calmantes) disenado para disminuir la tension laringea.

### 3.5 useGlobalAppListeners (`src/components/main-app/useGlobalAppListeners.ts`)
- Detecta cambios en la visibilidad de la ventana (`visibilitychange`), eventos de teclado para atajos globales, instalacion de la aplicacion PWA (`beforeinstallprompt`) y recepcion de archivos compartidos via Web Share Target API.

---

## 4. Modulo 1: Academia de Canto (AcademiaView)

Componente principal: `src/components/AcademiaView.tsx`.
Representa la ruta pedagogica estructurada, visualizada como un camino sinuoso de nodos interactivos divididos en 4 unidades tematicas.

### 4.1 Estructura Pedagogica de las Unidades (`src/data/academyData.ts`)
- Unidad 1: Respiracion y Fisiologia Vocal (Diafragma, apoyo intercostal, control del flujo de aire, ataques vocales suaves).
- Unidad 2: Afinacion y Oido Musical (Escalas mayores, intervalos de tercera y quinta, resonancia en mascarilla, eliminacion del desafine).
- Unidad 3: Tempo, Ritmo y Coordinacion (Metronomo corporal, patrones ritmicos, sincronizacion fonatoria, independencia motriz).
- Unidad 4: Expresion, Estilo y Rango Avanzado (Dinamicas vocales piano/forte, transicion de voz de pecho a voz de cabeza, pasaje vocal, interpretacion).

### 4.2 Componentes de Soporte de Academia
- `AcademiaUnitCard.tsx`: Tarjeta colapsable que encabeza cada unidad con su descripcion, barra de progreso y estado bloqueado/desbloqueado.
- `AcademiaWelcomeBanner.tsx`: Banner superior de bienvenida con el estado de racha y consejo pedagogico del dia.
- `AcademiaNoLivesModal.tsx`: Modal restrictivo que se despliega al intentar cursar una leccion sin vidas disponibles.
- `LessonModal.tsx`: Visor interactivo de lecciones teoricas y practicas. Presenta diapositivas con explicaciones anatomicas, reproductores de audio de demostracion, preguntas de seleccion multiple y desafios de emision vocal con microfono.

### 4.3 Minijuegos y Celebraciones de Final de Unidad
- Celebracion Unidad 1 (`src/components/UnitCelebrationModal.tsx` y `src/components/unit1-celebration/`):
  Minijuego del Globo Aerostatico. El usuario debe mantener una exhalacion continua y controlada captada por el microfono para elevar el globo a traves de capas de nubes hasta alcanzar la estratosfera.
- Celebracion Unidad 2 (`src/components/Unit2CelebrationModal.tsx` y `src/components/unit2-celebration/`):
  Minijuego de Resonancia de la Copa de Cristal. El usuario debe emitir un tono afinado y constante. Al coincidir con la frecuencia propia del cristal, la copa entra en resonancia acustica hasta fragmentarse en particulas animadas sobre canvas.
- Celebracion Unidad 3 (`src/components/Unit4Game.tsx` / `src/components/unit3-rhythm/`):
  Minijuego de percusion ritmica 3D y bateria interactiva donde se pone a prueba la precision temporal del usuario contra un metronomo cuantizado.
- Celebracion Unidad 4 (`src/components/unit4-flappy/` y `src/components/Unit4SkyCelebration.tsx`):
  Juego interactivo controlado por pitch vocal (`useVoiceGate.ts`). La altura del pajaro depende directamente de la nota cantada por el usuario (graves bajan, agudos suben) para sortear obstaculos acusticos.

---

## 5. Modulo 2: Gimnasio Vocal y Afinador Cromatico (AfinadorView)

Componente principal: `src/components/AfinadorView.tsx`.
Espacio interactivo de entrenamiento vocal continuo, afinacion instrumental/vocal y herramientas biomecanicas de apoyo.

### 5.1 Modos Principales del Afinador
- Modo Libre (`useAfinadorPitch.tsx`):
  Captura continua de audio por microfono. Identifica la frecuencia fundamental (Hz), la nota musical mas cercana en notacion cientifica (ej. C4, F#3), la desviacion en centesimas de semitono (-50 a +50 cents) y el nivel de precision. Renderiza una esfera 3D animada (`TunerSphereCard.tsx`) que cambia de color segun la proximidad al tono perfecto (verde = afinado, rojo = desafinado).
- Modo Niveles (`useAfinadorLevels.ts`, `TunerLevelSelectModal.tsx`, `src/data/tunerLevelsData.ts`):
  Sistema de progresion estructurado en desafios de cuerda ("Tiron de Guerra Acustico"). El usuario debe entonar secuencias de notas especificas y mantenerlas estables para vencer la resistencia del oponente virtual.
- Desafio de Tono (`TunerPitchChallengeView.tsx` y `src/components/pitch-challenge/`):
  Prueba de precision a ciegas. La aplicacion reproduce una nota de referencia y el usuario debe igualarla con su voz en un lapso determinado sin ayudas visuales iniciales.
- Desafio de Ritmo (`TunerRhythmView.tsx`):
  Modulo de entrenamiento del compas y subdivision ritmica con metronomo visual y auditivo.

### 5.2 Las 6 Herramientas Vocales Integradas (`TunerToolsAccordion.tsx`)
1. Evaluacion de Tesitura y Rango Vocal (`VocalRangeModal.tsx`):
   Asistente guiado que calibra los limites anatomicos de la voz del usuario (nota mas grave alcanzable y nota mas aguda alcanzable) y clasifica la voz en categorias estandar (Bajo, Baritono, Tenor, Contralto, Mezzosoprano, Soprano).
2. Gimnasio de Respiracion Diafragmatica (`BreathingModal.tsx` y `src/components/breathing/`):
   Guia visual con ciclos animados de inhalacion, retencion, exhalacion sostenida y descanso (respiracion en caja y metodo pranayama) para expandir la capacidad pulmonar.
3. Entrenador de Escalas y Arpegios (`EscalasModal.tsx`):
   Generador de patrones melodicos (escalas mayores, menores, pentatonicas y arpegios) con reproduccion de voz humana de referencia en MP3 o sintetizador, permitiendo cantar por encima con deteccion en vivo.
4. Reto de Estabilidad Vocal (`StabilityChallengeModal.tsx` y `src/components/stability/`):
   Analizador de varianza de frecuencia. Mide la fluctuacion en microtonos mientras el cantante sostiene una nota larga, evaluando el control del vibrato y la firmeza muscular.
5. Duelo Rapido Vocal (`DueloRapidoModal.tsx` y `src/components/duelo-rapido/`):
   Mecanica competitiva contra un bot virtual calibrado en diferentes dificultades. Ambos participantes compiten por afinar notas en pantalla de forma consecutiva.
6. Evaluacion Vocal Completa (`VoiceEvalModal.tsx` y `src/components/voice-eval/`):
   Prueba diagnostica de 4 parametros: extension de rango, estabilidad del tono, velocidad de ataque y afinacion sobre intervalos.

---

## 6. Modulo 3: Practica y Estudio de Canciones (PracticaView)

Componente principal: `src/components/PracticaView.tsx`.
Centro de entrenamiento aplicado mediante canciones y pistas musicales tipo Karaoke interactivo con evaluacion en vivo.

### 6.1 Catalogo de Pistas (`src/components/practica/practicaCatalogData.ts`)
- Catalogo filtrable por genero (Pop, Balada, Rock, Latino, Ejercicios Tecnicos) y dificultad (Principiante, Intermedio, Avanzado).
- Metadata por cancion: tonalidad original, rango requerido (ej. A2 - E4), duracion, autor y archivo de letra sincronizada en formato LRC / JSON.

### 6.2 Motor de Reproduccion y Evaluacion (`useKaraokeEngine.ts`, `useKaraokeScoring.ts`)
- `KaraokeStageHero.tsx`: Escenario visual que renderiza la forma de onda acustica, la barra de progreso de la cancion y la linea de tono objetivo en comparacion con el tono real emitido por el usuario.
- `KaraokeControlsPanel.tsx`: Controles de reproduccion (reproducir, pausar, reiniciar, ajuste de volumen de pista y volumen de microfono, tono/transposicion).
- Algoritmo de Puntuacion: Compara en tiempo real los semitonos detectados por el microfono contra las notas de la melodia guia. Cada fragmento afinado dentro de una tolerancia de +-35 cents acumula puntaje.
- Acumulador de Minutos de Canto Activo: Registra los segundos exactos en los que el usuario emite sonido afinado sobre la pista y los convierte en minutos de practica efectiva para las metas diarias y misiones.
- `KaraokeResultsModal.tsx`: Resumen post-cancion con porcentaje de precision, nota final, experiencia ganada y retroalimentacion tecnica sobre pasajes desafinados.

---

## 7. Modulo 4: Progreso, Metricas y Gamificacion (ProgresoView)

Componente principal: `src/components/ProgresoView.tsx`.
Panel estadistico centralizado que recopila y visualiza todos los datos biometricos, historicos y de gamificacion del cantante.

### 7.1 Secciones Principales de Progreso
- Tarjeta de Nivel y Titulo Vocal (`ProgresoLevelCard.tsx`):
  Despliega el nivel actual (1 a 100), el titulo honorifico correspondiente segun `src/utils/levelHelper.ts` (ej. "Iniciado Vocal", "Afinador Nato", "Maestro del Tono"), la barra de experiencia actual respecto al maximo del nivel y el total acumulado de XP.
- Meta Diaria de Practica (`ProgresoDailyGoalCard.tsx`):
  Seguimiento de los minutos practicados hoy contra el objetivo seleccionado (5, 10, 15 o 30 minutos). Permite al usuario modificar su meta directamente.
- Racha de Constancia (`ProgresoConsistencyStreak.tsx`):
  Contador de dias consecutivos cantando. Si el usuario realiza una practica valida hoy, la racha se enciende mediante `streakPrompt.ts`.
- Calendario Semanal de Practica (`ProgresoWeeklyChart.tsx`, `calendarWeekHelper.ts`):
  Grafico de barras con los minutos reales practicados de lunes a domingo de la semana en curso, marcando con un indicador de fuego los dias en los que se mantuvo activa la racha.
- Grafica de Evolucion de XP (`ProgresoXpChart.tsx`, `xpEvolutionHelper.ts`):
  Grafico de area que traza la acumulacion de puntos de experiencia a lo largo del tiempo, con persistencia historica en `laclave_xp_history_v2`.
- Grafica de Progreso de Rango Vocal (`ProgresoChartsTooltips.tsx`):
  Visualizacion del rango vocal alcanzado en semitonos (desde la nota mas grave registrada hasta la mas aguda). Se actualiza unicamente cuando el cantante supera sus limites biometricos previos en una evaluacion. Incluye un asistente de cadencia que recuerda realizar la calibracion cada 6 dias.
- Sistema de Insignias y Logros (`ProgresoBadgesSection.tsx`, `ProgresoBadgeModal.tsx`):
  Cuadricula completa de 50 medallas autenticas divididas en 3 niveles de complejidad:
  - Faciles (`src/data/badgesEasy.ts`): Primeras notas, primera leccion, primera racha.
  - Intermedias (`src/data/badgesMedium.ts`): Dominio de escalas, estabilidad prolongada, sesiones completas de respiracion.
  - Dificiles (`src/data/badgesHard.ts`): Precision milimetrica, amplios rangos vocales, rachas extensas de semanas consecutivas.
  Cada medalla cuenta con barra de progreso, fecha de desbloqueo y ventana modal con boton para compartir el logro en redes sociales o mensajeria.
- Historial de Lecciones Recientes (`ProgresoRecentLessons.tsx`):
  Lista cronologica de las ultimas lecciones completadas en la Academia con su calificacion y puntos de experiencia obtenidos.
- Seccion Social y Amigos (`FriendsSection.tsx`, `src/components/friends/`):
  Generador de codigo unico de cantante (ej. `CLAVE-2133`), lector de codigos de companeros, tabla de clasificacion semanal y sistema de desafios vocales directos.

### 7.2 Motor de Misiones Diarias (`ProgresoQuestsSection.tsx`, `dailyQuestsEngine.ts`)
- Catalogo de 13 misiones reales clasificadas en 3 familias: Afinador/Pitch, Academia/Biometria y Herramientas/Tiempo.
- Rotacion Determinista a Medianoche: Selecciona exactamente 3 misiones diarias equilibradas utilizando un algoritmo hash basado en la fecha local `YYYY-MM-DD`.
- Reclamo Individual: Cada mision completada habilita su cobro de experiencia sin reseteos tramposos (`claimed: true`).
- Bonificacion Diaria (+50 XP): Al completar y cobrar las 3 misiones de la jornada, se desbloquea el bono general del dia.

---

## 8. Motores de Audio y Procesamiento Digital de Senales

### 8.1 Motor de Deteccion de Tono (`src/hooks/use-pitch-detection.ts`, `src/utils/pitchUtils.ts`)
- Entrada: Flujo de audio en tiempo real desde `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Analisis en Frecuencia y Tiempo:
  - Creacion de un nodo `AnalyserNode` con tamano de FFT de 2048 muestras.
  - Implementacion del algoritmo YIN optimizado para deteccion de frecuencia fundamental ($f_0$) en voces humanas (rango de 65 Hz a 1100 Hz, cubriendo desde C2 hasta C6).
  - Umbral de claridad y energia RMS minima para evitar disparos en falso por ruido ambiental.
- Conversion Matematica:
  - Frecuencia a numero de nota MIDI:
    $$n = 69 + 12 \times \log_2\left(\frac{f}{440}\right)$$
  - Calculo de desviacion en cents respecto a la afinacion estandar A4 = 440 Hz:
    $$\Delta_{\text{cents}} = 1200 \times \log_2\left(\frac{f}{f_{\text{objetivo}}}\right)$$

### 8.2 Servicio Central de Audio (`src/utils/audioService.ts`)
Manejador unico basado en el patron Singleton sobre un `AudioContext` nativo:
- Sintesis de Efectos de Sonido:
  - `playClickSound()`: Clic mecanico para interacciones tactiles.
  - `playSuccessSound()`: Acorde mayor brillante al acertar notas.
  - `playErrorSound()`: Disolucion armonica menor al fallar.
  - `playXpGainSound()`: Arpegio ascendente rapido al sumar experiencia.
  - `playBadgeUnlockedSound()`: Fanfarria de desbloqueo de logros.
  - `play3StarFanfare()`: Fanfarria orquestal completa de tres campanas para finalizacion de unidades y cobro de bonos diarios.
- Metronomo Acustico: Sintetizador de pulsos clack/tick con subdivisiones en compases de 4/4, 3/4 y 6/8.

### 8.3 Servicio de Reproduccion de Voces Reales (`src/utils/voicePlaybackService.ts`)
- Carga y reproduce muestras de audio grabadas por cantantes reales masculinos y femeninos alojadas en `public/sounds/` (notas de C2 a C6 en formato MP3).
- Mecanismo Fallback: Si un archivo de audio no esta disponible en cache o falla la red, conmuta automaticamente a un oscilador sintetizado con formantes vocales para asegurar continuidad en la practica.

---

## 9. Modelado de Datos y Persistencia Local

La aplicacion no depende de una base de datos remota obligatoria para el funcionamiento base, garantizando maxima privacidad del usuario y operacion offline permanente. Todos los datos se serializan en `localStorage` bajo esquemas versionados:

| Clave de Almacenamiento | Descripcion del Contenido |
| :--- | :--- |
| `laclave_user_stats_v6` | Perfil principal: XP, nivel, vidas, racha, insignias y minutos de practica. |
| `laclave_units_v8` | Estado secuencial de los nodos del arbol de la Academia (completado, actual, bloqueado). |
| `laclave_daily_quests_v5` | Estado de las 3 misiones diarias activas, progreso y banderas de cobro. |
| `laclave_last_streak_date` | Ultima fecha (`YYYY-MM-DD`) en la que se encendio la llama de la racha. |
| `laclave_xp_history_v2` | Registros cronologicos de adquisicion de experiencia para la grafica historica. |
| `laclave_calendar_week_v2` | Minutos de practica registrados dia por dia en la semana en curso. |
| `laclave_vocal_range_saved` | Objeto con la nota mas grave, nota mas aguda y fecha de la ultima evaluacion vocal. |
| `laclave_notes_tuned_total` | Contador acumulativo de notas afinadas con exito en el gimnasio vocal. |
| `laclave_offline_queue_v1` | Cola FIFO de acciones realizadas offline para ser sincronizadas al reconectar. |
| `laclave_tour_completed` | Bandera booleana que previene la reaparicion automatica de la induccion guiada. |

---

## 10. Caracteristicas PWA y Sincronizacion Offline

### 10.1 Service Worker y Manifiesto
- Archivo de configuracion PWA: `public/manifest.json`.
- Cache de Activos: Los archivos estaticos, fuentes, audios de interfaz e imagenes se almacenan en cache local durante la instalacion, permitiendo abrir y utilizar la aplicacion completamente desconectado de internet.
- Prompt de Instalacion (`usePwaInstall.ts`): Detecta si la aplicacion puede instalarse como aplicacion de escritorio o movil independiente y despliega un boton de instalacion directa.

### 10.2 Cola de Sincronizacion Diferida (`src/utils/offlineSync.ts`)
- Cuando la aplicacion se encuentra sin conexion (`navigator.onLine === false`), las acciones críticas (lecciones superadas, evaluaciones de fin de unidad, compras con XP) se encolan en `laclave_offline_queue_v1`.
- Al restablecerse la conexion (`window.addEventListener('online')`), el motor procesa secuencialmente los eventos pendientes y sincroniza los estados correspondientes.

---

## 11. Resumen de Tecnologias y Bibliotecas Principales

- Framework Base: Next.js 15+ (App Router).
- Lenguaje: TypeScript 5+.
- Estilos y Diseno: Tailwind CSS, Lucide React (iconografia).
- Animaciones e Interactividad: Motion (Framer Motion) y Canvas Confetti.
- Motor de Graficos: Canvas API 2D nativo (particulas, osciloscopios, formas de onda y visualizadores de tono).
- Procesamiento y Sintesis de Audio: Web Audio API nativa (`AudioContext`, `AnalyserNode`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`).
- Induccion de Usuario: Driver.js.
