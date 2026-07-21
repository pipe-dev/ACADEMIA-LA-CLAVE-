# Diseño: Aislador de Voz Web (Estilo Apple Music Sing)

## 1. Propósito y Contexto
La aplicación AfinApp requiere una función que permita al usuario reducir el volumen de la voz del cantante original en tiempo real, manteniendo la pista instrumental, similar a la función "Apple Music Sing". Dado que alojar audios separados (Voz + Pista) para 600,000 usuarios excedería los límites de presupuesto ($0), el procesamiento debe ocurrir del lado del cliente en el propio celular del usuario.

## 2. Restricciones Técnicas
- **Presupuesto $0**: No se pueden alojar archivos de audio ni usar APIs pagas.
- **Hardware Antiguo**: Debe funcionar fluidamente en celulares de gama baja (Android 2016-2017).
- **CORS de YouTube**: El reproductor oficial de YouTube en Iframe no permite acceso al flujo de audio (`MediaElementAudioSourceNode`), bloqueando cualquier filtro de ecualización.

## 3. Arquitectura del Sistema (El Enfoque "Proxy + Filtro Web")

### 3.1. Extracción de Audio con Proxy (Bypass de CORS)
Para evitar el bloqueo CORS de YouTube, no usaremos el reproductor oficial para el audio. 
1. La aplicación solicitará la URL directa del stream de audio (.m4a/.mp3) a través de una red de instancias públicas y gratuitas (Invidious / Piped / Cobalt).
2. El stream se carga en un elemento `<audio>` oculto en HTML5 que tendrá el atributo `crossOrigin="anonymous"`, permitiendo su manipulación.

### 3.2. Cancelación de Centro en Tiempo Real (Web Audio API)
Dado que un celular de 2016 no puede ejecutar Inteligencia Artificial en tiempo real, usaremos un truco de ingeniería de sonido ultraligero soportado por todos los navegadores desde 2014.
- En una mezcla estéreo, la voz principal casi siempre se panoramiza exactamente en el "Centro" (el volumen es idéntico en el canal Izquierdo y Derecho).
- El sistema separará el canal Izquierdo (L) y Derecho (R).
- Invertirá la fase del canal Derecho (`R * -1`) y lo sumará al Izquierdo (`L + (-R)`).
- **Resultado matemático**: Todos los sonidos en el centro (La Voz, el Bajo) se cancelan matemáticamente dando `0`, dejando solo los instrumentos panoramizados a los lados. 

### 3.3. Control Deslizante (Slider de Volumen Vocal)
El usuario verá una barra tipo "Apple Music Sing" (0% a 100%).
- Un `GainNode` controlará el volumen de la mezcla original (Estéreo puro).
- Otro `GainNode` controlará el volumen de la mezcla cancelada (Sin Voz).
- El slider hará un *crossfade* (mezcla) entre la versión original y la versión sin voz, dándole al usuario la ilusión de estar "bajándole el volumen al cantante" instantáneamente.

## 4. Estrategia Anti-Caídas (Fallback)
Dado que dependemos de proxies gratuitos para el audio, si un servidor proxy se satura, el sistema saltará automáticamente a la siguiente instancia de Invidious disponible en la lista de respaldo, garantizando que los usuarios siempre tengan servicio de audio.

## 5. Rendimiento
El uso de `BiquadFilterNode` y sumas matemáticas de fase (`ChannelSplitterNode` / `GainNode`) en Web Audio API es acelerado por hardware a nivel del sistema operativo. Esto consume aproximadamente **menos del 2% del CPU** en un teléfono del 2016, siendo muchísimo más ligero que animar bloques en un Canvas HTML5.
