# Especificacion de Diseno: Entrada en Caravana Escalonada de los 4 Personajes

**Fecha:** 2026-10-12  
**Estado:** Aprobado  
**Objetivo:** Sustituir las animaciones de entrada individuales y disonantes de los 4 personajes por una caravana cinematica escalonada (Enfoque 1), donde los personajes emergen saltando de derecha a izquierda desde detras de la tarjeta blanca del formulario hasta acomodarse en su puesto del escenario.

---

## 1. Arquitectura Visual y Ocultamiento Fisico

La tarjeta en `src/app/sandbox/cutelogin/page.tsx` posee la distribucion idonea:
- **Columna Izquierda (Escenario):** `bg-[#e9e9e9]` con `z-10` y `overflow-visible`.
- **Columna Derecha (Formulario):** `bg-white` solido con `z-20` (capa superior a la columna izquierda).
- **Contenedor Principal de la Tarjeta:** `overflow-hidden` con bordes redondeados (`rounded-[24px]` en movil, `rounded-[36px]` en escritorio).

### Mecanismo de emergencia desde atras:
- Cada ranura de personaje dentro del sistema de coordenadas de diseno (`DESIGN_WIDTH = 640px`) inicia desplazada hacia la derecha con `translateX(580px)`.
- Al estar a `+580px` y bajo una capa de menor z-index que el formulario (`z-10` vs `z-20`), el personaje queda **completamente oculto detras del fondo blanco del formulario**.
- Al saltar hacia la izquierda (`translateX: 580px -> 0px`), cruza el borde vertical divisorio entre las dos columnas y emerge directamente al escenario.

---

## 2. Fisica del Salto Parabólico y Squash & Stretch

Cada personaje realiza una secuencia de 2 saltos rítmicos fluidos:

### Salto 1: Impulso y Cruce del Borde Divisorio
- Despegue desde detras del formulario (`translateX: 580px`).
- Elevacion con parabola natural (`translateY: -65px`, leve inclinacion hacia adelante `rotate(-3.5deg)`).
- Primer impacto en el escenario (`translateX: 280px`, compresion elastica `scale(1.14, 0.88)`).

### Salto 2: Acomodo en el Puesto Asignado
- Segundo rebote (`translateY: -42px`).
- Aterrizaje final en su coordenada de reposo (`translateX: 0px`, impacto `scale(1.10, 0.92)` y recuperacion elastica a `scale(1, 1)`).

---

## 3. Secuencia y Desfase Escalonado (Caravana)

El orden de entrada se organiza de atras hacia adelante para respetar las capas de profundidad:

1. **Morado (Fondo, zIndex 10):**
   - Retraso inicial: `0.10s`.
   - Da sus 2 saltos y se posiciona en el fondo a la derecha del escenario.
2. **Fucsia (Medio-izq, zIndex 20):**
   - Retraso inicial: `0.45s`.
   - Salta y se ubica al lado de Morado.
3. **Amarillo (Primer plano der, zIndex 50):**
   - Retraso inicial: `0.80s`.
   - Salta alegremente y se asienta frente a Fucsia.
4. **Naranja (Primer plano izq, zIndex 40):**
   - Retraso inicial: `1.15s`.
   - Salto final mas rotundo con impacto acolchado en el primer plano.

Tiempo total de la coreografia: ~2.35 segundos.

---

## 4. Desactivacion de Animaciones Previas en CSS

Para evitar colisiones entre keyframes:
- Se reemplazan/anulan las animaciones de entrada individuales en los CSS de los personajes (`morado-enter`, `fucsia-enter`, `amarillo-enter`, `naranja-enter`) cuando estan dentro de esta composicion coordinada.
- El movimiento de caravana se gestiona de forma centralizada en el wrapper de ranuras de `CuteCharactersStatic.tsx` mediante una clase de keyframe pura y acelerada por GPU (`@keyframes caravanEntryHop`).

---

## 5. Audio ASMR Sincronizado

Se disparan microsonidos sinteticos suaves en los impactos de aterrizaje:
- Morado: tono resonante suave (`playSquish('morado', 0.8)`).
- Fucsia: gota elastica (`playDroplet('fucsia')`).
- Amarillo: pop chispeante (`playSquish('amarillo', 0.9)`).
- Naranja: rebote de masa esponjosa (`playSquish('naranja', 1.0)`).

---

## 6. Criterios de Aceptacion y Verificacion

1. **Compilacion:** `tsc --noEmit` con 0 errores.
2. **Visual:** Los personajes nacen invisibles detras del formulario blanco y entran dando saltos hacia la izquierda en fila india.
3. **Rendimiento:** 60 fps estables en Safari/iOS y Chrome, sin tirones ni desbordamientos fuera de la tarjeta.
4. **Respuesta HTTP:** Código 200 en servidor local y túnel público.
