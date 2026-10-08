# Diseno Tecnico: Blobs Tactiles con Fisica de Gelatina Densa y Siluetas Organicas

## 1. Resumen Ejecutivo
Transformar los 4 personajes (Morado, Fucsia, Amarillo y Naranja) de la vista de autenticacion (`/sandbox/cutelogin` y `/sandbox/log`) para eliminar su rigidez geometrica rectilinea y dotarlos de propiedades tactiles vivas.

El sistema se basa en una arquitectura de tres capas no invasiva:
1. **Morfologia Base Suavizada (DOM/CSS)**: Curvaturas organicas en reposo (cintura sutil, apoyo blando por peso) sin tocar los ojos 3D, pupilas con reflejos, bocas ni degradados de arcilla existentes.
2. **Jaula Elastica Envolvente (Lattice Wrapper)**: Contenedor que absorbe fuerzas fisicas y deforma la masa completa con conservacion volumetrica, cizallamiento viscoso y origen de apoyo en el suelo.
3. **Motor de Fisica y Canvas Tactil Superpuesto**: Motor en tiempo real con modelo de oscilador armonico desfasado de doble frecuencia (jiggle superficial + masa profunda de agua densa) y renderizado de ondas expansivas de choque translucionas y puntos de depresion al presionar.

---

## 2. Arquitectura de Tres Capas

```
┌──────────────────────────────────────────────────────────────┐
│ Capa 3: CuteTactileCanvas (Motor C + Canvas Superpuesto)     │
│ - Dibuja depresion de presion en punto de contacto (x, y)    │
│ - Dibuja ondas de choque radiales traslucidas (shockwaves)    │
│ - Ejecuta el bucle fisico via requestAnimationFrame          │
└──────────────────────────────┬───────────────────────────────┘
                               │ Transmite: scaleX, scaleY, skewX, rotate, offsetY
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Capa 2: CuteCharacterTactileCage (Jaula Elastica B)          │
│ - Wrapper GPU transform (transform-origin: bottom center)    │
│ - Captura eventos unificados de puntero (mouse y touch)      │
│ - Conmuta fluidamente entre fisica tactil y respiracion idle │
└──────────────────────────────┬───────────────────────────────┘
                               │ Contiene intacto al hijo
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Capa 1: Personaje Base (DOM / CSS)                           │
│ - Siluetas de arcilla suavizadas (sin paredes rectas)        │
│ - Ojos 3D, pupilas con destello especular, bocas y sombras   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo Fisico: Masa Gelatinosa / Agua Densa

Para evitar que el rebote parezca un resorte de metal duro o un globo vacio, el motor calcula la deformacion mediante un oscilador armonico amortiguado con las siguientes caracteristicas:

### 3.1. Conservacion de Volumen (Squash & Stretch)
- **Compresion vertical** ($scale_Y < 1$): Expande horizontalmente $scale_X = 1 + (1 - scale_Y) \times 0.85$.
- **Traccion vertical** ($scale_Y > 1$): Adelgaza los costados $scale_X = 1 - (scale_Y - 1) \times 0.65$.
- **Anclaje de apoyo**: El origen se mantiene en la base inferior (`bottom center`), garantizando que la base permanezca en contacto con el suelo mientras el cuerpo se aplasta o estira.

### 3.2. Desfase Armonico de Ejes (Oscilacion Asimetrica)
- El rebote en $Y$ y la compensacion en $X$ estan desfasados en $\pi / 2$ radianes (90 grados).
- Este desfase produce el oleaje caracteristico de la gelatina densa donde la masa fluye hacia los lados y luego vuelve al centro de forma asincrona.

### 3.3. Doble Frecuencia (Masa Profunda + Jiggle Superficial)
- Al recibir un impacto (tap o suelta brusca tras arrastre), la posicion se rige por:
  $$Y(t) = A_1 e^{-\gamma_1 t} \cos(\omega_1 t) + A_2 e^{-\gamma_2 t} \cos(\omega_2 t)$$
  - Componente 1 (Masa densa): baja frecuencia $\omega_1$, amortiguamiento medio $\gamma_1$.
  - Componente 2 (Jiggle gelatinoso): alta frecuencia $\omega_2$, atenuacion rapida $\gamma_2 \approx 500\text{ ms}$.

### 3.4. Parametros de Masa por Personaje
- **Morado**: Masa pesada (1.3), rigidez moderada (210), amortiguacion viscosa (16), oscilacion de rebote prolongada.
- **Fucsia**: Masa media (0.9), rigidez elastica (260), amortiguacion agil (18).
- **Amarillo**: Masa ligera (0.7), rigidez alta (300), amortiguacion rapida (22), jiggle energico.
- **Naranja**: Masa ancha (1.4), base de gran inercia, oscilacion lateral amplia en $X$ y `skewX`.

---

## 4. Interacciones Tactiles Soportadas

1. **Arrastre Continuo (Drag & Pull)**:
   - Resistencia progresiva tipo banda elastica al jalar desde cualquier punto.
   - Si se jala hacia abajo, se aplasta; hacia arriba, se estira; hacia los lados, se arquea con `skewX` y leve `rotate`.
   - Al soltar, libera la energia y vibra como gelatina densa hasta recuperar el reposo.
2. **Toque Directo (Tap / Poke / Click)**:
   - Si el contacto dura menos de 220 ms sin arrastre significativo, se inyecta un impulso de compresion instantaneo ($scale_Y = 0.82$) que detona vibracion y una onda de choque radial.
3. **Paso del Cursor (Hover)**:
   - Micro-inclinacion gravitacional hacia el cursor ($\pm 1.5^\circ$) cuando entra en su radio.
4. **Retorno Suave a Respiracion Idle**:
   - Cuando la amplitud del rebote cae por debajo del umbral $\epsilon = 0.002$, se transiciona sin salto al ciclo sinusoidal de `CuteCharacterBreathe`.

---

## 5. Renderizado en Canvas Superpuesto (`CuteTactileCanvas`)

1. **Punto de Depresion Tactil**:
   - Dibuja un gradiente radial translucion en $(x, y)$ con modo de fusion suave (`overlay`) mientras el puntero presiona la superficie.
2. **Ondas Expansivas de Choque (Ripples)**:
   - Al soltar tras arrastre o al hacer tap, genera anillos elipticos concentricos blancos semitransparentes (`rgba(255, 255, 255, alpha)` con opacidad inicial 0.35) que se expanden a velocidad decreciente y desaparecen en 450 ms.
3. **Consumo Cero en Reposo**:
   - Cuando las ondas terminan y no hay interaccion, se limpia el canvas (`clearRect`) y el bucle de animacion se suspende automaticamente.

---

## 6. Morfologia en Reposo (Suavizado de Siluetas)

1. **Morado**:
   - Curvatura organica suave con ligera cintura (reduccion sutil de 4px en el tercio medio) y base apoyada blanda, eliminando las paredes 100% rectas.
2. **Fucsia**:
   - Refinamiento de la curvatura en su `clip-path` para unificar la transicion entre el torso acampanado y los hombros de gota maleable.
3. **Amarillo**:
   - Perfil con ligera conicidad y hombros redondeados continuos que eliminan la rigidez del cilindro extruido.
4. **Naranja**:
   - Achatamiento blando en los apoyos inferiores para simular el peso de la arcilla descansando sobre el plano.

---

## 7. Plan de Verificacion

1. **Compilacion y Tipos**:
   - Ejecutar `npm run typecheck` tras cada modificacion. Cero errores de TypeScript.
2. **Pruebas de Interaccion**:
   - Verificar respuesta a toques individuales (poke) en cada uno de los 4 personajes.
   - Verificar arrastre vertical y horizontal con retorno elastico amortiguado.
   - Verificar que los ojos, bocas y sombras se muevan en perfecta sincronia con el cuerpo sin desfasarse.
   - Verificar que no haya caida de FPS ni fugas de memoria en el bucle del canvas al interactuar repetidamente.
