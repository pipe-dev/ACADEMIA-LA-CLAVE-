# Especificación de Diseño: Caravana de Saltos de los Blobs al Lado Derecho y Disolución de Texto

Fecha: 2026-10-10  
Estado: Aprobado por el usuario  
Ubicación del archivo: docs/superpowers/specs/2026-10-10-cutelogin-blobs-hopping-right-caravan-design.md  

---

## 1. Resumen y Objetivos

El objetivo de esta especificación es dotar a la transición de registro (`isRegisterMode === true`) de una coreografía viva, interactiva y cinematográfica en la pantalla [`/sandbox/cutelogin`](src/app/sandbox/cutelogin/page.tsx):

1. **Caravana de Saltitos Hacia la Derecha:**
   - Una vez que el formulario de login se desliza hacia la izquierda cubriendo el escenario original de los blobs, los 4 personajes emergen de debajo del panel en una caravana de saltitos cortos y elásticos hacia el lado derecho.
   - **Orden de salida:** Amarillo primero (al estar más cerca del borde derecho en `left: 440`), seguido por Fucsia (`left: 294`), Naranja (`left: -50`) y Morado (`left: 144`).
2. **Disolución Gradual del Texto Derecho:**
   - Eliminación del badge `"AfinApp Studio"`.
   - A medida que Amarillo y Fucsia avanzan hacia la derecha, el texto de bienvenida (*"Únete a AfinApp..."*) se desvanece de forma suave (`opacity: 0`, `filter: blur(4px)`, `translateY(-6px)`), dejando el escenario derecho completamente libre para los personajes sobre el fondo oscuro `#0f172a`.
3. **Reacción Final de Mirada al Registro:**
   - Al terminar de acomodarse en la derecha, los 4 personajes giran su mirada hacia la izquierda (`lookX = -0.7`, `lookY = 0`) para observar con curiosidad los campos del formulario de registro.
4. **Diseño Sonoro ASMR de Pasos y Rebotes:**
   - Cada salto y aterrizaje activa de forma sincronizada los micro-sonidos físicos característicos de cada personaje (`playDroplet` / `playSquish`) mediante `useJellyAsmrAudio`.

---

## 2. Arquitectura de Capas y Coordenadas

### 2.1. Gestión de Capas (Stacking Context)
- **Capa Base Derecha (z-10):** Fondo oscuro `#0f172a` que contiene el texto de bienvenida con animación de desvanecimiento ligada al estado `textDissolved`.
- **Capa de Personajes (z-20):**
  - Contenedor que aloja a `<CuteCharactersStatic>`.
  - En modo Login (`!isRegisterMode`), los blobs reposan en su posición normal a la izquierda.
  - En modo Registro (`isRegisterMode`), el contenedor o slots se trasladan con una secuencia de saltos parabólicos hacia el lado derecho (offset de $\Delta X \approx +470\text{px}$).
  - Al estar en `z-20`, en el lado izquierdo quedan ocultos bajo el formulario deslizante (`z-30`), y al saltar hacia la derecha emergen visiblemente sobre el fondo oscuro (`z-10`).
- **Capa Deslizante del Formulario (z-30):**
  - Se mantiene en `z-30`, en `translateX(0%)` en modo registro, cubriendo la mitad izquierda.

### 2.2. Coreografía y Tiempos de la Caravana
- $t = 0\text{ms}$: Clic en "Regístrate". El formulario se desliza hacia la izquierda (duración 600ms).
- $t = 550\text{ms}$: Inicia la caravana de saltitos hacia la derecha:
  - **Amarillo:** 3 saltos elásticos rápidos de $t = 550\text{ms}$ a $t = 1350\text{ms}$.
  - **Fucsia:** 3 saltos arqueados fluidos de $t = 750\text{ms}$ a $t = 1550\text{ms}$.
  - **Naranja:** 3 saltos alegres de $t = 950\text{ms}$ a $t = 1750\text{ms}$.
  - **Morado:** 3 saltos pesados de $t = 1150\text{ms}$ a $t = 1950\text{ms}$.
- $t = 800\text{ms}$: El texto del lado derecho comienza a desvanecerse (duración 500ms).
- $t = 2100\text{ms}$: Todos los personajes están asentados en su formación en el lado derecho.
- $t = 2200\text{ms}$: Los ojos de los 4 personajes giran suavemente hacia la izquierda (`lookX = -0.7`, `lookY = 0`) para observar el formulario de registro.

---

## 3. Parámetros de Audio ASMR por Salto

En cada fase de impulso y caída de cada personaje se disparan los métodos ya existentes de `useJellyAsmrAudio`:
- Amarillo: `playSquish('amarillo', 1.0)` al despegar, `playDroplet('amarillo')` al aterrizar.
- Fucsia: `playSquish('fucsia', 0.9)` al despegar, `playDroplet('fucsia')` al aterrizar.
- Naranja: `playSquish('naranja', 1.1)` al despegar, `playDroplet('naranja')` al aterrizar.
- Morado: `playSquish('morado', 1.3)` al despegar, `playDroplet('morado')` al aterrizar.

---

## 4. Modificaciones en Archivos

1. **`src/app/sandbox/cutelogin/page.tsx`:**
   - Eliminar el badge `"AfinApp Studio"`.
   - Controlar la disolución del texto con clase condicional o estado `textDissolved`.
   - Propagar la prop `caravanToRight={isRegisterMode}` a `<CuteCharactersStatic>`.
2. **`src/components/sandbox/CuteCharactersStatic.tsx`:**
   - Recibir prop `caravanToRight?: boolean`.
   - Coordinar los offsets de traslación horizontal y las clases de saltitos para cada personaje.
   - Sincronizar el giro de mirada hacia la izquierda (`finalLookX = caravanToRight ? -0.7 : ...`).
3. **`src/components/sandbox/CuteCharactersStatic.module.css`:**
   - Clases `@keyframes caravanHop` con desplazamiento progresivo en $X$ y parábolas en $Y$.

---

## 5. Criterios de Aceptación y Pruebas

1. **Badge Eliminado:** El texto `"AfinApp Studio"` no aparece en el DOM ni en la vista.
2. **Salto Escalonado:** Amarillo y Fucsia se ven primero saltando hacia la derecha, seguidos por Naranja y Morado.
3. **Desaparición del Texto:** El texto del lado derecho desaparece limpiamente mientras los personajes van llegando.
4. **Mirada al Registro:** Al asentarse en el lado derecho, los blobs quedan mirando hacia el formulario de registro a la izquierda.
5. **Cero Errores:** `npm run typecheck` pasa con 0 errores y el endpoint responde con HTTP 200.
