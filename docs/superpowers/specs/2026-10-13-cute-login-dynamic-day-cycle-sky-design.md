# Diseño: Ciclo de Cielo Dinámico Randomizado cada 5 Segundos

## 1. Visión General
Implementación de un ciclo continuo de transición de cielo (Día -> Atardecer -> Noche -> Amanecer -> Día) en el motor de canvas de `AnimatedSkyBackground` utilizado en el sandbox de inicio de sesión (`/sandbox/cutelogin`). Cada transición dura exactamente 5 segundos y aplica variaciones cromáticas aleatorias en cada ciclo para que la atmósfera nunca sea estática ni repetitiva.

## 2. Arquitectura de Fases y Paletas Aleatorias

Cada fase define rangos cromáticos controlados (mínimo y máximo para canales R, G y B en 3 paradas de gradiente: Superior, Medio, Inferior):

1. **Día (Daytime)**
   - Top: `[50..70, 72..100, 210..240]` (Azul cobalto intenso)
   - Mid: `[85..115, 120..155, 235..255]` (Azul celeste luminoso)
   - Bottom: `[56..120, 180..220, 248..255]` (Turquesa / cian diurno)

2. **Atardecer (Sunset / Golden Hour)**
   - Top: `[120..160, 50..85, 160..215]` (Púrpura y fucsia crepuscular)
   - Mid: `[230..255, 90..135, 40..85]` (Naranja brillante / coral)
   - Bottom: `[250..255, 180..230, 60..115]` (Ámbar dorado y durazno)

3. **Noche (Night)**
   - Top: `[8..18, 10..22, 38..55]` (Azul noche profundo / medianoche)
   - Mid: `[22..36, 24..44, 65..95]` (Índigo cósmico)
   - Bottom: `[45..75, 35..65, 95..140]` (Crepúsculo violeta oscuro)

4. **Amanecer (Dawn / Transition)**
   - Top: `[70..105, 80..125, 200..235]` (Azul lavanda matutino)
   - Mid: `[215..248, 140..185, 190..235]` (Rosa pastel / bruma solar)
   - Bottom: `[130..175, 210..245, 245..255]` (Cielo fresco despejado)

## 3. Motor de Interpolación Cuadro por Cuadro (60 FPS)

- **Temporizador**: `cycleTimer` acumula el delta de tiempo (`dtSec`) hasta alcanzar `cycleDuration` (5.0s por defecto).
- **Factor de interpolación**: `progress = cycleTimer / cycleDuration`.
- **Suavizado (Easing)**: Curva cosenoidal `smoothT = (1 - Math.cos(progress * Math.PI)) / 2` para transiciones orgánicas sin frenazos bruscos.
- **Transición de fase**:
  - Al completar los 5 segundos, la paleta actual de destino se convierte en el nuevo punto de partida.
  - La fase avanza cíclicamente: `(currentPhase + 1) % 4`.
  - Se genera una nueva muestra aleatoria dentro de los rangos de la siguiente fase.
  - El temporizador se reinicia a cero.

## 4. Adaptación de Elementos Procedurales

- **Partículas atmosféricas**:
  - En fase nocturna: Se atenúa el tono oscuro y se potencia el destello (*twinkle*) con una onda senoidal sobre la opacidad para asemejar estrellas titilantes.
  - En fase de atardecer: Adquieren tonos cálidos dorados y ambarinos.
  - En fase de día: Mantienen el aspecto ligero de burbujas y esporas luminosas.
- **Sombra y tono de nubes**:
  - El color de sombra de las nubes se interpola dinámicamente según la fase (azul índigo de día, violeta crepuscular en atardecer, azul noche profundo en la noche).

## 5. Criterios de Aceptación
1. Transición continua y suave cada 5 segundos entre Día -> Atardecer -> Noche -> Amanecer -> Día.
2. Cada iteración de ciclo presenta variaciones de tono sutiles y armónicas.
3. El canvas mantiene 60 FPS estables sin degradación de memoria ni lag.
4. Se conserva la compatibilidad con `/sandbox/cutelogin` y la tarjeta de vidrio translúcido.
5. Cero errores de compilación TypeScript.
