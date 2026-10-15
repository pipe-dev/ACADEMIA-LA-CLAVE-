# Especificacion de Diseno: Fondo de Cielo Animado con Velo en Cute Login

**Fecha:** 2026-10-12  
**Estado:** Aprobado  
**Objetivo:** Integrar el motor de cielo animado de las cinematicas de la Unidad 4 (`AnimatedSkyBackground`) como fondo global en `/sandbox/cutelogin`, atenuado por un velo atmosferico sutil que potencie la profundidad visual de la tarjeta sin perjudicar el contraste de los personajes ni la legibilidad del formulario.

---

## 1. Contexto y Justificacion

La vista de acceso interactiva en `/sandbox/cutelogin` actualmente reposa sobre un fondo estatico gris claro (`#e5e9ee`). Para elevar la atmosfera visual de la aplicacion y dotarla de mayor dinamismo y conexion con la estetica ludica de AfinApp, se propone utilizar el motor de cielo animado con nubes y microparticulas desarrollado en `src/components/sandbox/AnimatedSkyBackground.tsx`.

Para evitar saturacion y mantener el foco en el formulario, se adopta el **Enfoque 2**: el cielo corre en segundo plano pero cubierto por un velo atmosferico semitransparente con desenfoque ultra leve (`backdrop-blur-[1px]`), lo que otorga sensacion de profundidad de ensueño sin competir con los elementos activos.

---

## 2. Arquitectura de Capas Visuales

El contenedor principal `<main>` en `src/app/sandbox/cutelogin/page.tsx` organizara los elementos en tres niveles de profundidad (z-index):

### Nivel 0 (z-0): Motor de Cielo Animado
- **Componente:** `<AnimatedSkyBackground theme="unit4" cloudSpeed={0.8} />`
- **Posicionamiento:** `fixed inset-0 w-full h-[100dvh] pointer-events-none z-0`
- **Caracteristicas:**
  - Degradado suave `#4648d4` (azul profundo) -> `#6063ee` (azul lavanda) -> `#38bdf8` (azul cielo).
  - Nubes estilo caricatura pre-renderizadas offscreen para 60 fps constantes.
  - Microparticulas de textura ascendentes.
  - Velocidad moderada (`cloudSpeed = 0.8`) para no generar distraccion visual.

### Nivel 1 (z-[1]): Velo Atmosferico (Backdrop)
- **Elemento:** `<div className="fixed inset-0 z-[1] bg-slate-950/15 backdrop-blur-[1px] pointer-events-none" />`
- **Funcion:**
  - Suaviza los contrastes duros de las nubes y particulas.
  - Da una sensacion cinematica y tenue al entorno general.
  - Evita interferencias con eventos del mouse o tactiles (`pointer-events-none`).

### Nivel 2 (z-10): Tarjeta de Acceso Flotante
- **Elemento:** `<div className="... relative z-10 ...">`
- **Sombra y presencia:** `shadow-[0_25px_60px_rgba(15,23,42,0.22)]` para despegar la tarjeta del fondo.
- **Escenario de Personajes (lado izquierdo):** Se mantiene el fondo plano neutro `#e9e9e9`. Esto es critico para garantizar el maximo contraste de los colores de Morado (`#8254d8`), Fucsia, Amarillo y Naranja, impidiendo que el Morado se pierda con el azul del cielo.
- **Formulario (lado derecho):** Se mantiene el blanco puro `#ffffff` para maxima legibilidad y minimalismo.

---

## 3. Dispositivos Moviles y Teclado Virtual

- En pantallas pequenas (`max-width: 639px`), la tarjeta utiliza el sistema de contraccion vertical (`cardFocused` en `CuteLogin.module.css`).
- El cielo de fondo (`fixed inset-0 h-[100dvh]`) permanece inmovil y fijo detras de la tarjeta, sin producir saltos ni recortes al abrirse el teclado virtual.
- `overflow-hidden` y `overscroll-none` previenen cualquier rebote o scroll no deseado.

---

## 4. Criterios de Aceptacion y Verificacion

1. **Compilacion:** `tsc --noEmit` debe ejecutarse con 0 errores.
2. **Respuesta HTTP:** `http://localhost:9002/sandbox/cutelogin` debe responder 200 OK.
3. **Flotabilidad:** La tarjeta debe percibirse claramente separada y suspendida sobre el cielo con velo.
4. **Interactividad intacta:** Las interacciones con los blobs (tacto, seguimiento con la mirada, timidez ante clave, revelacion fluida de contraseña) y los campos del formulario deben operar con total fluidez a 60 fps.
