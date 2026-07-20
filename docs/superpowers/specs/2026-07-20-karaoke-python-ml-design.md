# Diseño de Arquitectura: Karaoke Visual con Python ML Backend

## Resumen del Proyecto
Transformar el componente `practica-player.tsx` en una interfaz estilo Smule/Guitar Hero, dividida en 3 zonas (Polígrafo superior, Letras en el centro, Controles abajo). Como fuente de datos para las "notas guía", construiremos un microservicio separado en Python que descargará el audio de YouTube, separará la voz usando IA, y extraerá las notas MIDI en tiempo real.

## Arquitectura del Sistema

El sistema se divide en dos grandes bloques que se comunican entre sí:

### 1. El Backend de Machine Learning (Python / FastAPI)
Un microservicio dedicado a la extracción de audio e Inteligencia Artificial, ya que Vercel/Next.js no soportan estas cargas pesadas.
- **Endpoint:** `POST /extract-melody`
- **Input:** URL de YouTube (ej. `?v=videoId`).
- **Pipeline Interno:**
  1. `yt-dlp`: Descarga el audio del video de YouTube de forma local al servidor Python.
  2. `Demucs` o `Spleeter`: Toma el audio descargado y extrae EXCLUSIVAMENTE la pista de la voz humana (Stem Separation).
  3. `Spotify Basic Pitch` o `Librosa`: Analiza la voz humana aislada y genera un contorno de frecuencias (Pitch Contour).
- **Output (JSON):** Retorna un arreglo de notas procesadas listo para dibujar en frontend: 
  `[ { start: 12.5, end: 14.0, pitch: "C4", cents: 0 }, ... ]`

### 2. El Frontend en Next.js (React / Framer Motion)
El nuevo `practica-player.tsx` tendrá una estructura vertical flexible (flex-col) dividida en 3 grandes áreas de responsabilidad:

#### A. Top: El Polígrafo Vocal (Piano Roll Canvas)
- **Tecnología:** HTML5 `<canvas>` (para alto rendimiento a 60fps) o SVGs animados.
- **Visualización:** El array de JSON que llega del servidor Python se pinta como rectángulos horizontales (barras guía) que se mueven de derecha a izquierda según el `currentTime` del reproductor de YouTube.
- **Feedback en Tiempo Real:** El `usePitchDetection` del usuario dibuja una línea luminosa (láser) sobre el canvas. 
  - Si el pitch del usuario está cerca del pitch del rectángulo (tolerancia de +/- 50 cents), la línea brilla en VERDE y se suman puntos.
  - Si está lejos, la línea brilla en ROJO o gris.

#### B. Middle: Las Letras Sincronizadas (LRC)
- **Tecnología:** Componente actual `<SyncedLyrics>` potenciado.
- **Visualización:** Usa los datos de `lrclib` (que ya tenemos funcionando). Muestra la frase actual resaltada en grande en el centro de la pantalla. El espacio es más reducido para darle protagonismo al polígrafo superior.

#### C. Bottom: Centro de Control
- **Tecnología:** Botones Shadcn UI + Lógica de estado React.
- **Visualización:** 
  - Botón grande de Play/Pause.
  - Botón de Micrófono (encender/apagar detección).
  - Configuración de Pitch Shift (si en un futuro se implementa cambiar tono).
  - Botones de Offset de Sincronización (-0.5s / +0.5s) que guardan en la "Memoria Colectiva" de Google Sheets.
  - El iframe de YouTube se mantiene oculto `w-1 h-1 opacity-0` (solo lo usamos como motor de audio).

## Flujo de Datos (User Journey)
1. El usuario busca una canción en AfinApp y la selecciona.
2. Next.js muestra un Skeleton/Loader y hace un fetch a la API de Python: `/extract-melody?url=...`
3. El servidor Python hace el procesamiento de IA (Tardará entre 10 y 30 segundos).
4. El servidor Python devuelve las "Barras de Notas".
5. Next.js oculta el loader, monta el `practica-player.tsx` y da Play a YouTube.
6. El usuario canta, el Polígrafo superior dibuja su voz vs la melodía de Python.
7. Al finalizar la canción, se emite un puntaje de precisión.

## Revisión de Riesgos y Edge Cases
- **Tiempos de Espera (Cold Starts):** El servidor Python tomará tiempo procesando la canción la primera vez. Se debe mostrar un mensaje amigable en Next.js ("La IA de AfinApp está analizando la melodía de esta canción para ti...").
- **Costos de Servidor Python:** Python con ML consume RAM. Se puede empezar con un servidor gratuito (Render / Railway / HuggingFace Spaces) pero podría requerir escalado si entran 100 usuarios a la vez a pedir canciones nuevas. Como mitigación, Next.js debería guardar el JSON resultante en su propia base de datos (o Google Sheets) para que la segunda persona que cante la *misma* canción ya no tenga que usar el servidor Python.

## Criterio de Éxito
- La interfaz visual se divide claramente en 3 partes sin que colisionen los elementos.
- La línea dibujada por la voz del usuario "persigue" exitosamente a los rectángulos generados por la API de Python.
