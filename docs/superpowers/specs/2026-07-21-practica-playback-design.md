# Diseño de Reproducción Sincronizada (Practica Playback)

## 1. Visión General
El objetivo es permitir que el usuario escuche su interpretación de voz grabada inmediatamente después de practicar una canción, sincronizada con la pista original de YouTube de fondo. Todo esto se logrará localmente (RAM) sin usar bases de datos para mantener los costos en cero y asegurar alto rendimiento en celulares antiguos (ej. Android 2017).

## 2. Arquitectura y Flujo de Datos

### Fase de Grabación (`use-pitch-detection.ts`)
- Al iniciar la práctica, se instanciará un `MediaRecorder` capturando el mismo flujo de micrófono (`MediaStream`) que se usa para el análisis de afinación.
- Los fragmentos de audio (`chunks`) se almacenarán en memoria temporal.
- Al finalizar (o cuando el usuario presione "Terminar"), el `MediaRecorder` se detiene, los chunks se unen en un `Blob` de audio, y se genera una URL local usando `URL.createObjectURL()`.

### Fase de Resultados / Reproducción (`practica-player.tsx`)
- Al terminar la canción, la vista de la práctica cambia a un estado de "Resultados".
- Para ahorrar RAM en dispositivos antiguos, el lienzo del polígrafo (canvas) se oculta o se destruye. En su lugar, se muestra la puntuación final y unos controles de reproducción básicos ("Escuchar mi interpretación").
- Se inyecta un elemento HTML5 `<audio>` invisible que carga la URL local del Blob.
- El reproductor de YouTube, que ya está montado, retrocede a `0:00`.

### Lógica de Sincronización (Maestro/Esclavo)
- **YouTube es el reloj Maestro.** 
- Al presionar Play, se da la orden de reproducción tanto a YouTube como al `<audio>` local.
- Un bucle de sincronización (cada ~500ms) lee `youtubePlayer.getCurrentTime()`.
- Si la diferencia entre `audio.currentTime` y `youtube.getCurrentTime()` supera los `0.3` segundos (umbral para evitar tartamudeo auditivo constante), el código fuerza agresivamente `audio.currentTime = youtube.getCurrentTime()`.
- **Manejo de Buffering:** Se escuchará el evento `onStateChange` de YouTube. Si YouTube entra en modo *Buffering* (código 3) o *Pausa* (código 2), se pausa instantáneamente el `<audio>`. Cuando YouTube vuelva a *Playing* (código 1), el `<audio>` se reanuda.

## 3. Manejo de Errores y Casos Límite
- **Falta de Permisos:** Si el navegador (por ser muy antiguo o por permisos del usuario) falla al iniciar `MediaRecorder`, la variable de grabación quedará nula y la pantalla de resultados omitirá el botón de reproducción gracefully.
- **Fuga de Memoria (Memory Leaks):** Es vital que al presionar la "X" para cerrar el reproductor, se ejecute `URL.revokeObjectURL(blobUrl)` para liberar los 2-3MB de memoria RAM asignados al audio y evitar que el navegador móvil colapse tras jugar 10 canciones seguidas.

## 4. Componentes a Modificar
1. **`src/hooks/use-pitch-detection.ts`**:
   - Añadir estado interno para `MediaRecorder`.
   - Exportar `audioBlobUrl` y funciones para limpiar la memoria.
2. **`src/components/practica/practica-player.tsx`**:
   - Añadir interfaz condicional: si `isFinished === true`, mostrar pantalla de resultados en la "Zona 2" en vez de `PolygraphCanvas`.
   - Añadir la lógica de sincronización Maestro/Esclavo en un `useEffect`.
