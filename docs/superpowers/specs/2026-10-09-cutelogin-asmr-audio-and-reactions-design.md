# Especificación de Diseño: Motor de Audio ASMR Procedural y Micro-Animaciones para CuteLogin Blobs

Fecha: 2026-10-09  
Estado: Aprobado por el usuario  
Ubicación del archivo: docs/superpowers/specs/2026-10-09-cutelogin-asmr-audio-and-reactions-design.md

---

## 1. Resumen y Objetivos

El objetivo de esta especificación es dotar a los cuatro personajes gelatinosos (Morado, Fucsia, Amarillo y Naranja) de la pantalla de login (`src/app/sandbox/cutelogin/page.tsx`) de una experiencia sensorial completa:

1. **Audio ASMR Táctil Procedural:** Síntesis de sonido en tiempo real con Web Audio API moderna, sin archivos de audio externos, con efectos de viscosidad, aplastamiento (*squish*), textura mojada/slime y gotas de agua (*droplet pops*) reactivos a la física del personaje.
2. **Vida Orgánica e Idle:** Parpadeo biológico asíncrono e independiente por personaje que aporta vivacidad mientras el usuario no interactúa, respetando el estado de sueño cuando la contraseña está oculta.
3. **Reacciones Contextuales del Formulario:** Micro-interacciones sutiles con el formulario (validación de correo, hover en botón de inicio de sesión y guiño al activar Recordarme).
4. **Preservación Estricta:** Cero regresiones en la física de retirada calibrada a 5 caracteres, en la posición y arco de inclinación de Amarillo (`left: 440`), y en el rendimiento móvil libre de temblores.

---

## 2. Arquitectura de Componentes

### 2.1. Nuevo Hook: `src/utils/useJellyAsmrAudio.ts`
Módulo desacoplado responsable exclusivamente de la síntesis de audio procedural mediante Web Audio API:
- **Instancia Única:** Mantiene una referencia perezosa (`lazy`) a `AudioContext`, desbloqueada en el primer gesto de interacción de puntero (`pointerdown`, `click` o `touchstart`).
- **Nodos de Síntesis:**
  - `playSquish(characterId, intensity, stretch)`: Genera sonido visceral de masa gelatinosa al deformar o arrastrar al personaje. Combina un oscilador en modulación FM y buffer procedural de ruido rosa con un filtro paso-bajo (`BiquadFilterNode`) de alta resonancia con barrido exponencial descendente.
  - `playDroplet(characterId, pitchMultiplier)`: Genera un pop acuático cristalino mediante onda senoidal con decaimiento rápido de tono (de ~1100 Hz a ~140 Hz en 45 ms) y envolvente exponencial de ganancia.
  - `playWinkPop()`: Sonido de burbuja líquida ultracorto al alternar el checkbox de Recordarme.
  - `playValidationChime()`: Armónico líquido ascendente cuando el correo electrónico ingresado es válido.
- **Perfiles Acústicos por Personaje:**
  - **Morado:** Fundamental grave (150 Hz - 300 Hz), Q alta (4.5), sensación de cuerpo masivo y denso.
  - **Fucsia:** Perfil acuático y brillante (480 Hz - 900 Hz), efecto de doble gota cristalina.
  - **Amarillo:** Elástico y vivo (320 Hz - 650 Hz), barrido elástico de alta reactividad.
  - **Naranja:** Esponjoso y burbujeante (180 Hz - 380 Hz), resonancia gomosa.

### 2.2. Actualizaciones en `src/components/sandbox/CuteCharactersStatic.tsx`
- **Nuevas Props:**
  - `emailValid?: boolean`: Indica si el formato del correo es válido.
  - `submitHovered?: boolean`: Indica si el cursor está sobre el botón de inicio de sesión.
  - `rememberChecked?: boolean`: Estado del checkbox Recordarme.
- **Ciclo de Parpadeo Asíncrono:**
  - Estado y temporizadores independientes para cada personaje (`blinkMorado`, `blinkFucsia`, `blinkAmarillo`, `blinkNaranja`).
  - Intervalos estocásticos de 3.5 a 6.5 segundos.
  - Pausa automática cuando `effShy === 1` (los personajes duermen con párpados cerrados).
- **Integración de Audio:**
  - Conexión de callbacks `onTouchPress` y `handleRippleTrigger` con `playSquish` y `playDroplet`.

### 2.3. Actualizaciones en `src/components/sandbox/CuteCharacterTactileCage.tsx`
- Al iniciar y terminar el arrastre (`startDrag`, `releaseDrag`), calcula la velocidad y deformación acumulada para pasar la intensidad correspondiente al reproductor de audio.

### 2.4. Actualizaciones en `src/app/sandbox/cutelogin/page.tsx`
- Calcula `isEmailValid` mediante regex estricto de correo (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
- Detecta `onMouseEnter`/`onMouseLeave` y `onFocus`/`onBlur` en el botón de submit para transmitir `submitHovered`.
- Vincula el cambio de `rememberMe` para disparar el guiño cómplice.

### 2.5. Hojas de Estilo CSS de Personajes (`CuteCharacter*.module.css`)
- Clases para parpadeo rápido:
  ```css
  .blink {
    animation: eyeBlink 130ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes eyeBlink {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.08); }
  }
  ```
- Clase para el guiño en Amarillo (`.wink`):
  ```css
  .wink-left {
    animation: eyeWink 240ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  @keyframes eyeWink {
    0%, 100% { transform: scaleY(1); }
    40%, 60% { transform: scaleY(0.05); }
  }
  ```

---

## 3. Flujo de Datos

```
[Formulario (cutelogin/page.tsx)]
   |--> emailValid, submitHovered, rememberChecked, passwordLength
   v
[CuteCharactersStatic.tsx]
   |--> Ciclo autónomo de parpadeo (3.5s - 6.5s)
   |--> Disparo de Chime / Wink
   |--> Gestor de Audio (useJellyAsmrAudio)
   v
[CuteCharacterTactileCage.tsx]
   |--> Gestos táctiles (Drag, Stretch, Release) --> playSquish(), playDroplet()
```

---

## 4. Manejo de Errores y Seguridad

1. **Autoplay Policy:** La activación del `AudioContext` ocurre estrictamente tras la primera interacción (`pointerdown` o `click`), evitando advertencias en consola en navegadores modernos.
2. **Tolerancia a Fallos:** En entornos sin soporte de audio, con pestañas en segundo plano o dispositivos silenciados, las funciones capturan cualquier excepción silenciosamente sin interrumpir el renderizado de la interfaz.
3. **Liberación de Memoria:** Los nodos de oscilador se detienen con `.stop()` y se desconectan con `.disconnect()` inmediatamente después de que sus envolventes de ganancia llegan a 0.

---

## 5. Criterios de Aceptación y Pruebas

1. **Prueba de Audio:**
   - Al estirar o apretar a cualquier personaje, se escucha un sonido viscoso de *squish* que varía de intensidad según la deformación.
   - Al soltarlo o hacer un toque rápido (*tap*), se escucha una gota o pop líquido reactivo.
   - Cada uno de los 4 personajes presenta un timbre reconocible (Morado grave, Fucsia acuático, Amarillo elástico, Naranja burbujeante).
2. **Prueba de Parpadeo:**
   - Mientras están despiertos, parpadean periódica y asíncronamente.
   - Cuando se enfoca la contraseña oculta (`shy`), el parpadeo se suspende y se muestran los párpados dormidos con Zzz.
3. **Prueba de Micro-Interacciones:**
   - Al escribir un correo válido, los personajes asienten suavemente y suena un chime sutil.
   - Al poner el cursor sobre "Iniciar sesión", miran hacia el botón.
   - Al marcar "Recordarme", Amarillo guiña el ojo con un pop de burbuja.
4. **Prueba de Regresiones:**
   - La retirada calibrada a 5 caracteres funciona exactamente como se definió.
   - La posición de Amarillo (`left: 440`) y su inclinación máxima se mantienen intactas.
   - `npm run typecheck` pasa con 0 errores.
