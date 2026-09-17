# Copa Cristal Unidad 2 - Rotación 3D en Eje Y & Refracción Óptica Sedosa

## 1. Visión General y Propósito
Mejorar la experiencia visual (UX) y el acabado gráfico de la cinemática final de la Unidad 2 ("Rompe la copa con tu nota más aguda") elevándola a un estándar *luxury* y cinematográfico. La copa de vino de cristal ahora rotará suavemente sobre su eje vertical (Eje Y) en el espacio 3D, mientras que el fondo (la cuadrícula técnica del Afinador) se distorsionará y difuminará a través del cáliz de manera sedosa, sin trazos rústicos o duros, aumentando la intensidad de la refracción en función del ángulo de rotación y la voz del usuario.

---

## 2. Arquitectura Visual y Movimiento 3D

### 2.1 Rotación Suave en el Eje Y
* **Perspectiva y Contenedor:** El contenedor de la copa dispondrá de `perspective: 1000px` y `transform-style: preserve-3d`.
* **Animación `rotateY`:** 
  * Ciclo de rotación oscilante continuo de 6.5 segundos.
  * Rango de rotación: de `-18deg` a `+18deg` con interpolación `cubic-bezier(0.45, 0.05, 0.55, 0.95)`.
  * La copa parece suspendida en el aire, realizando un balanceo orbital pausado y elegante.
* **Sincronización de Sombras en el Suelo:** 
  * La sombra de oclusión ambiental en la base (`#000000` con `feGaussianBlur stdDeviation="6"`) modula suavemente su ancho elíptico en contrapunto al ángulo de giro (`scaleX(0.95)` a `scaleX(1.05)`).

### 2.2 Desplazamiento Dinámico de Reflejos Cáusticos
* A medida que el cáliz rota en el eje Y, los reflejos de estudio del lateral izquierdo y derecho se desplazan horizontalmente (`translateX`) a lo largo de la curvatura del vidrio, simulando fuentes de luz fijas en el entorno reflectando sobre una superficie cristalina que gira.

---

## 3. Refracción Óptica del Fondo (Acabado Sedoso y Difuminado)

### 3.1 Eliminación de Trazos Rústicos
* Se eliminan las líneas vectoriales rígidas/duras en el interior del cáliz.
* En su lugar, el vidrio actúa como una lente translúcida que procesa la cuadrícula del fondo mediante capas difusas de luz y desenfoque.

### 3.2 Capas de Refracción Óptica
1. **Filtro de Difuminado Focal (*Depth Blur*):**
   * Un desenfoque suave mediante `filter="url(#silkyRefraction)"` (`feGaussianBlur stdDeviation="1.2"`) aplicado a la visualización interna del fondo.
2. **Gradiente de Densidad y Refracción Luminosa:**
   * Degradado radial/lineal de tinte cian/azul ultramar (`rgba(2, 132, 199, 0.15)` a `rgba(255, 255, 255, 0.04)`) que genera volumen sin bloquear la visión de la cuadrícula.
3. **Distorsión Acoplada al Ángulo de Giro:**
   * Cuando la copa está de frente (`0deg`), la cuadrícula detrás se ve ligeramente agrandada y suavemente curvada.
   * Cuando la copa rota hacia los extremos (`±18deg`), el espesor aparente del cristal aumenta por perspectiva, incrementando la curvatura y la distorsión del fondo en un 25-30% adicional de forma natural.

---

## 4. Interacción con el Micrófono y Tensión Sonora

* **Estado Idle:** La copa rota lentamente con su fondo difuminado y la sombra en el piso.
* **Estado Grabando (Voz Sostenida):** 
  * A la rotación suave se le suman micro-frecuencias de vibración acústica en el cristal.
  * Los anillos de resonancia armónica pulsan desde la boca de la copa.
  * La barra de tensión superior se llena con el volumen sostenido (4.5 segundos).
  * Aparecen las fisuras progresivas (30% leves, 60% ramificadas, 85% críticas con chispas de energía).
* **Estado Estallido (100%):** 
  * La copa se desintegra en fragmentos geométricos de cristal brillante (`@keyframes shatter`), habilitando el botón táctil "CONTINUAR A LA UNIDAD 3".

---

## 5. Prevención de Errores y Compatibilidad

* **Rendimiento Móvil:** Las transformaciones 3D (`rotateY`, `scale`, `translate3d`) están aceleradas por GPU (`will-change: transform`).
* **Soporte Cross-Browser:** Sin depender exclusivamente de `backdrop-filter` (cuyo soporte en WebKit/iOS es irregular con filtros SVG complejos), la refracción se resuelve combinando capas de SVG clip-path con filtros gaussianos nativos y gradientes de densidad que funcionan al 100% en Safari móvil, Chrome y navegadores desktop.
* **Integración:** El componente `Unit2CelebrationModal.tsx` mantiene intactas sus props (`isOpen`, `onContinue`) y su conexión con `audioService.startMicrophone` y `stopMicrophone`.
