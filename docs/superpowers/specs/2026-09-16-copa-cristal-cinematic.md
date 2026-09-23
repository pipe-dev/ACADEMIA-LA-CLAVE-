# Especificación de Diseño: Cinemática de Copa de Cristal (Unidad 2)

## 1. Objetivo
Crear una cinemática de celebración inmersiva e interactiva para el final de la Unidad 2 ("Afinación y Oído Musical"). A diferencia del globo táctil de la Unidad 1, esta cinemática requerirá el uso del micrófono, desafiando al usuario a sostener una nota vocal para "romper" una copa de cristal 3D.

## 2. Arquitectura Visual (UI)
*   **Texto Principal:** `"Rompe la copa con tu nota mas aguda"`.
*   **Barra de Tensión:** Una barra de progreso horizontal, ubicada por encima de la copa. Comenzará vacía y se llenará gradualmente de izquierda a derecha. Se usará un color vibrante (ej. cian o dorado) con un efecto de brillo (glow).
*   **Copa de Cristal 3D:** Un elemento central renderizado íntegramente con CSS (y/o SVG). Utilizará superposición de sombras internas (`inset-shadow`), degradados y bordes translúcidos para emular volumen y refracción. 
*   **Estado Final (Shatter):** Fragmentos vectoriales (SVG) predefinidos que, al momento del estallido, saldrán disparados hacia los bordes de la pantalla usando animaciones CSS.
*   **Botón de Continuar:** El botón de "Continuar a la Unidad 3" aparecerá con un efecto de `fade-in` una vez que la copa se haya roto.

## 3. Flujo de Interacción y Lógica de Audio
El flujo dependerá del nivel de volumen captado por el micrófono usando el `audioService` existente en la aplicación.

1.  **Activación:** El modal inicia con un botón de `"Activar Micrófono"` (o similar, o se reutiliza el estado de permisos si ya están dados) para cumplir con las políticas de auto-play y AudioContext del navegador.
2.  **Mecánica de Sostenimiento:**
    *   Se requiere mantener un volumen vocal sostenido por encima de un umbral moderado (ej. `volume > 0.15`).
    *   La duración total requerida para romper la copa será de **4.5 segundos continuos**.
    *   Si el usuario alcanza el umbral de volumen, la barra de tensión avanza.
    *   Si el usuario deja de cantar (baja del umbral), la barra **pausa** su progreso (no se vacía, para evitar excesiva frustración) o decae muy lentamente.
3.  **Feedback Visual:**
    *   Mientras se capte la voz, la copa aplicará una animación CSS de vibración (`shake`).
    *   A mayor progreso de la barra (> 70%), la vibración se vuelve más violenta y la copa adquiere un resplandor interno (glowing).
4.  **Clímax:**
    *   Al alcanzar los 4.5 segundos acumulados (Barra al 100%), se detiene la captura del micrófono para liberar recursos.
    *   Se reproduce de fondo un efecto de sonido (`glass-shatter.mp3` o similar, si existe en `/sounds`, o se usará un sonido sintetizado / placeholder provisto por `audioService`).
    *   La copa se oculta y se activan los fragmentos de cristal saliendo volando.
    *   Aparece el botón para ir a la Unidad 3.

## 4. Componentes y Estructura de Código
*   `Unit2CelebrationModal.tsx` (o un nuevo componente análogo a `UnitCelebrationModal.tsx`): 
    *   Manejará su propio `useEffect` de `requestAnimationFrame` para consultar `audioService.getVolume()` repetidamente.
    *   Mantendrá estados locales: `isActive` (micrófono encendido), `progress` (0 a 100), `isShattered` (booleano).
*   Se integrará en `MainApp.tsx` modificando la lógica de `showUnitCelebration` para que distinga si el hito es de la Unidad 1 (Globo) o de la Unidad 2 (Copa).

## 5. Prevención de Errores (Edge Cases)
*   **Ruido de fondo:** El umbral de volumen será calibrado de manera que un ligero ruido de fondo no llene la barra de inmediato; requerirá la energía típica de una voz cantando frente al dispositivo.
