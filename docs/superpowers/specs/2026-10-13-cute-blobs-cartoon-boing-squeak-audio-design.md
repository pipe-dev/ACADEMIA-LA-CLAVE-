# Diseño: Motor de Audio Caricaturesco para Blobs Táctiles (Híbrido Squeak & Boing)

## 1. Visión General
Reemplazar los sonidos electrónicos de sintetizador (barridos de frecuencia pura y ruido con filtro resonante agudo) por una síntesis procedural enteramente caricaturesca inspirada en dibujos animados clásicos (estilo Pixar / Looney Tunes / Slime Rancher).

El sistema combina:
- **Al presionar / iniciar agarre**: Un sutil "squeak" de muñeco de goma inflable suave y esponjoso (*rubber squeak*).
- **Al estirar y soltar**: Un "boing" elástico con modulación de frecuencia oscilante (*rubber vibrato / cartoon boioio-ing*), cuya amplitud y vibrato varían dinámicamente según la distancia de estiramiento alcanzada.

## 2. Arquitectura Acústica Procedural (Web Audio API)

### 2.1 Sonido al Presionar / Agarrar: `playCartoonSqueak(character)`
- **Concepto**: El sonido que produce un muñeco o patito de goma al ser presionado levemente.
- **Implementación**:
  - Oscilador con forma de onda triangular/senoidal suave (para aportar cuerpo orgánico sin aspereza metálica).
  - Micro-modulación de tono: sube y baja rápidamente en 40-50 milisegundos con un tono cálido y simpático.
  - Envolvente de volumen de ataque rápido (2ms) y caída suave (45ms).
  - Frecuencias fundamentales por personaje:
    - Morado: 320 Hz -> 420 Hz -> 360 Hz (squeak gordito)
    - Fucsia: 480 Hz -> 640 Hz -> 520 Hz (squeak dulce y elástico)
    - Amarillo: 650 Hz -> 880 Hz -> 720 Hz (squeak diminuto y alegre)
    - Naranja: 400 Hz -> 530 Hz -> 440 Hz (squeak cómico y redondo)

### 2.2 Sonido al Soltar el Estiramiento: `playCartoonBoing(character, stretchIntensity)`
- **Concepto**: Resorte elástico de gelatina que vibra y se desacelera tras liberarse.
- **Implementación**:
  - Modulación de frecuencia en anillo (FM) o modulación senoidal directa sobre la frecuencia del oscilador portador (Carrier) con un modulador LFO (Modulator):
    `frequency(t) = baseFreq + (vibratoDepth * Math.exp(-t * decayRate)) * Math.sin(2 * Math.PI * wobbleFreq * t)`
  - Curva de caída de frecuencia: La frecuencia base inicia con un ligero salto cómico y luego oscila mientras decae en ~250-400ms.
  - Escala con el estiramiento (`stretchIntensity` de 0.2 a 1.5):
    - A mayor estiramiento: el tono sube proporcionalmente y el bamboleo (*wobble*) tiene más oscilaciones audibles.
  - Frecuencias base por personaje:
    - Morado: 110 Hz base, wobble de 12 Hz (resorte grueso de gelatina)
    - Fucsia: 175 Hz base, wobble de 15 Hz (goma elástica ágil)
    - Amarillo: 260 Hz base, wobble de 18 Hz (resorte ágil y saltarín)
    - Naranja: 145 Hz base, wobble de 13 Hz (rebote cálido de pelota de goma)

## 3. Integración en Componentes

- **`useJellyAsmrAudio.ts`**:
  - Incorpora `playCartoonSqueak` y `playCartoonBoing`.
  - Reemplaza en las llamadas táctiles el uso del chirrido anterior por los nuevos métodos caricaturescos.
  - Unifica `playHopSound` (en la caravana inicial de entrada) para usar la combinación caricaturesca alegre y armónica.
- **`CuteCharactersStatic.tsx`**:
  - En `handle[Character]Touch(clientX, clientY, active)`:
    - Al tocar (`active === true`): activa `playCartoonSqueak(character)`.
    - Al soltar (`active === false`): activa `playCartoonBoing(character, stretchDistance)`.
  - En `handleRippleTrigger`:
    - Dispara el boing sutil correspondiente sin sobrecargar el audio.

## 4. Criterios de Aceptación
1. Cero sonidos con estética de sintetizador tecnológico o láser.
2. Cada personaje emite un squeak adorable al tocarlo y un boing elástico cómico al soltarlo.
3. El tono y bamboleo del boing reaccionan a la distancia de estiramiento.
4. Cero errores de compilación TypeScript (`npx tsc --noEmit`).
5. Rendimiento a 60 FPS sin saturación del AudioContext.
