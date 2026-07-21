# Catálogo de Práctica y Gamificación

## Tareas

- [x] Task 1: Modificar `practica-search.tsx` para mostrar un grid de resultados por defecto y manejar la búsqueda en tiempo real usando el endpoint de `yt-search`. Al hacer clic en un video, extraer título e ir al reproductor.
- [x] Task 2: Modificar `route.ts` de `yt-search` para exponer una API limpia que acepte `?q=` y retorne `[{id, title, thumbnail, channel}]`.
- [x] Task 3: Modificar `polygraph-canvas.tsx` para agregar detección de colisión. Cuando `userPitch` esté cerca de `mockMelodyData` (tolerancia ±50 cents) en tiempo real, emitir evento `onScore(10)`. Añadir textos flotantes de feedback visual.
- [x] Task 4: Modificar `practica-player.tsx` para mostrar el `score` en la UI superior. Añadir el Modal de Resultados finales.
- [x] Task 5: Implementar **Fallback Estático** en `practica-player.tsx`. Si `track.parsedLyrics` está vacío pero hay `track.plainLyrics`, renderizar un div con la letra estática (`whitespace-pre-wrap`) en lugar del componente de letras sincronizadas.

## Instrucciones para los Agentes
Sigan la filosofía de Superpowers y Nintendo 64. Optimizaciones extremas, animaciones limpias con framer-motion o CSS, y no rompan la Web Audio API. 
Para la tarea 3 (Detección de Colisión), los cálculos matemáticos deben hacerse dentro del ciclo de `requestAnimationFrame` sin causar re-renders pesados de React. Usen callbacks (`useRef` o eventos) para notificar al padre sobre cambios de puntaje.
