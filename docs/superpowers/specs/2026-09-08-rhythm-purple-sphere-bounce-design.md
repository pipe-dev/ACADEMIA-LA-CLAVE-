# Especificación de Diseño: Esfera Morada con Rebote Parabólico Senoidal en Ejercicios Rítmicos

**Fecha:** 2026-09-08  
**Componente Afectado:** `src/components/TunerRhythmView.tsx`

---

## 1. Contexto y Objetivos

Actualmente, los ejercicios de ritmo dentro de los niveles del afinador utilizan una imagen de un pato (`/duck.png`) como mascota estática en el centro del visualizador. El objetivo es reemplazar completamente esta imagen por la **esfera morada distintiva del afinador vocal**, animada con una trayectoria de rebote en parábola senoidal que viaje entre los botones de **Bombo** (izquierda) y **Palmas** (derecha), aportando sincronía rítmica, dinamismo visual y retroalimentación de impacto elástico (*squash & stretch*).

---

## 2. Especificación Visual de la Esfera

1. **Dimensiones y Forma:**
   - Diámetro: `w-14 h-14` (56px), circular perfecto (`rounded-full`).
   - Gradiente de fondo: `bg-gradient-to-br from-[#6366f1] via-[#4648d4] to-[#2c2abc]`.
   - Sombra base tridimensional: `shadow-[0_8px_20px_rgba(70,72,212,0.45)]`.
   - Brillo interno superior: `border-t border-white/30`.
   - Núcleo visual central: Icono o pulso de onda musical minimalista blanco (`Music2` o micro-ondas) con opacidad sutil (85%).

2. **Efectos de Impacto y Destello por Lado:**
   - **Impacto Izquierdo (Bombo - Kick):**
     - Destello exterior: `ring-4 ring-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.7)]`.
     - Micro-ripple en el suelo: Anillo translúcido azul que se expande hacia afuera en la base izquierda.
   - **Impacto Derecho (Palmas - Clap):**
     - Destello exterior: `ring-4 ring-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.7)]`.
     - Micro-ripple en el suelo: Anillo translúcido rosado que se expande hacia afuera en la base derecha.
   - **Estado Neutro / Reposo:**
     - Anillo tenue morado `ring-2 ring-indigo-300/40`.

---

## 3. Física de Rebote y Trayectoria Parabólica

1. **Parábola Senoidal en Ejes X e Y:**
   - **Posición X (Horizontal):**
     - `x = -80px` para alineación sobre el botón Bombo.
     - `x = 0px` para posición de reposo / centro.
     - `x = +80px` para alineación sobre el botón Palmas.
   - **Posición Y (Vertical - Altura de vuelo):**
     - Durante el desplazamiento entre lados o desde el centro, la altura se eleva siguiendo una curva senoidal $$\sin(\pi \cdot t)$$ alcanzando un ápice de `y = -55px` en el punto medio del salto.
     - Al tocar el suelo, `y = 0px`.

2. **Deformación Elástica (*Squash & Stretch*):**
   - **Despegue:** Estiramiento vertical `scaleY: 1.18, scaleX: 0.88`.
   - **Vuelo medio (ápice):** Restauración neutral `scaleY: 1.0, scaleX: 1.0`.
   - **Aterrizaje (impacto, 100-130ms):** Aplastamiento contra el suelo `scaleY: 0.74, scaleX: 1.28`.
   - **Recuperación:** Vuelve elásticamente a `1.0`.

---

## 4. Comportamiento según Fases

1. **Fase 1: Guía (`guide`):**
   - **Conteo previo (4 pulsos de metrónomo):** La esfera realiza micro-rebotes verticales en el centro (`x: 0, y: [0, -14, 0]`) sincronizados con cada tic del compás preparatorio.
   - **Demostración de Golpes:** Antes de cada hit del patrón:
     - Si el hit es `'kick'`, inicia la parábola hacia `x = -80px` para impactar exactamente en el milisegundo del golpe.
     - Si el hit es `'clap'`, viaja hacia `x = +80px` impactando exactamente en el momento de la palma.
     - El botón correspondiente se ilumina en perfecta sincronía con el aterrizaje.

2. **Fase 2: Juego (`playing`):**
   - En espera de pulsaciones, mantiene un suave pulso en el centro al tempo del metrónomo.
   - Al tocar Bombo (clic, tap o teclas `←` / `A`), la esfera salta inmediatamente en parábola hacia la izquierda (`x: -80px`), aplastándose con destello azul y activando el efecto flotante (`¡Perfecto!`, `¡Bien!`, etc.).
   - Al tocar Palmas (clic, tap o teclas `→` / `D`), la esfera salta en parábola hacia la derecha (`x: +80px`) con destello fucsia.
   - Si se toca el mismo lado consecutivamente, ejecuta un rebote elástico vertical en su misma posición X sin regresar al centro.

3. **Fase 3: Resultados (`results`):**
   - La esfera regresa suavemente al centro.
   - Si el puntaje es aprobatorio ($$\ge 80\%$$), ejecuta una animación de victoria (salto alto con giro o rotación y partículas doradas).
   - Si no aprueba, oscila suavemente invitando a reintentar.

---

## 5. Limpieza de Código

- Remover la importación de `Image` de Next.js en `TunerRhythmView.tsx` si ya no es requerida por otros elementos.
- Eliminar la referencia a `/duck.png`.
- Reemplazar el contenedor del pato por el escenario interactivo con la esfera `motion.div` y el indicador de piso/sombra reactiva.
