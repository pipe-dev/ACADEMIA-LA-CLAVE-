# Especificación de Diseño: Cinemática de Percusión y Esferas Rítmicas - Unidad 3

## 1. Visión General y Propósito

La **Cinemática de la Unidad 3** celebra la finalización de la **Unidad 3 ("Tempo y Coordinación")** y la transición a la **Unidad 4 ("Expresión, Dicción y Estilo")**.

Sustituye por completo el concepto previo de la bomba militar táctica por una experiencia **100% musical, minimalista y orgánica**: un juego de precisión rítmica al estilo *Fruit Ninja* donde las emblemáticas **esferas 3D de la Unidad 3** rebotan sobre la membrana de un **gran bombo de concierto** en la base de la pantalla, invitando al usuario a cortarlas al compás de 120 BPM con un deslizamiento (*swipe*).

### Principios Fundamentales
1. **Zero-Text UI en Gameplay:** Eliminación total de textos técnicos, cajas de advertencia, cronómetros digitales y manuales en pantalla. La experiencia se comunica exclusivamente mediante música, ritmo, física y luz.
2. **Identidad Visual Oficial de La Clave:** Paleta azul medianoche (`#0b1828` / `#0f172a`), iluminación cenital de concierto, esferas moradas 3D con reflejo especular esférico y botones táctiles 3D oficiales.
3. **Mecánica Rítmica en Compás de 4 Tiempos (4/4):**
   * Tiempos 1, 2 y 3: Esferas 3D moradas que rebotan y se cortan en el cenit del beat.
   * Tiempo 4 (Clímax): Gran Esfera Dorada Solar que se corta en cámara lenta (*slow-mo*) para revelar el **Trofeo Dorado de Baquetas Cruzadas (`Drum`)**.
4. **Flujo Continuo sin Frustración:** Si una esfera no es cortada o se corta fuera de beat, rebota amigablemente en el parche del tambor (*thud* sordo) y el ciclo se reanuda de inmediato en el pulso 1 sin pantallas de Game Over ni pérdida de vidas.
5. **Síntesis de Audio 100% Nativa (Web Audio API):** Cero dependencias de archivos de audio externos.

---

## 2. Arquitectura Visual y Componentes

### 2.1 El Escenario y el Gran Bombo 3D
* **Fondo:** Degradado cenital elegante en azul noche profundo (`#0b1828` con halo suave en `#172554`), libre de ruido visual o marcos pesados.
* **El Gran Bombo Orquestal (Tercio Inferior):**
  * Representación en perspectiva cenital del borde superior de un bombo de concierto: aro de madera noble oscura con bisel pulido, remaches y tensores metálicos dorados.
  * Parche percusivo blanco marfil mate con sutil textura de membrana.
  * **Física de Membrana:** Cada vez que una esfera toca el parche, este se deforma elásticamente hacia abajo ($6\text{px}$) mediante un resorte armónico y proyecta una onda expansiva circular suave (*shockwave*) que acompaña al golpe de bombo.

### 2.2 Las Esferas 3D y el Trazo de Corte
* **Esferas Moradas (Pulsos 1, 2 y 3):**
  * Diámetro de $56\text{px}$. Renderizado con gradiente radial violeta/magenta intenso y punto de luz especular blanco superior, idéntica a la esfera de los ejercicios de tempo.
  * Al ser cortada: se divide instantáneamente en dos hemisferios 3D que rotan hacia afuera alejándose por gravedad con estela de partículas de polvo estelar.
* **Gran Esfera Dorada (Pulso 4):**
  * Diámetro de $84\text{px}$. Gradiente oro cálido con aura resplandeciente.
  * Al ser cortada: la escena desacelera en cámara lenta (*slow-mo* 0.3x), la esfera se abre como una geoda brillante y emerge el trofeo.
* **Trazo de Baqueta (Swipe Trail):**
  * Trazo de luz fluida en Canvas HTML5 (60-120 FPS), con degradado blanco puro en el centro y halo dorado suave en los bordes, simulando el veloz movimiento de una baqueta en el aire.

### 2.3 Indicadores de Compás (Sin Texto)
* Cuatro puntos luminosos sutiles de $8\text{px}$ alineados horizontalmente justo sobre el borde superior del bombo:
  * Inactivos: Círculos translúcidos tenuemente visibles (`rgba(255, 255, 255, 0.2)`).
  * Activos: Se iluminan en oro brillante (`#fbbf24`) a medida que se corta con éxito cada esfera (1, 2, 3).
  * En el pulso 4: Los 4 puntos pulsan en unísono al aparecer la Gran Esfera Dorada.

---

## 3. Dinámica de Juego y Máquina de Estados

```
     [IDLE / READY]
           │
           ▼
     [RHYTHM_PULSE_1] ──► (Fallo / Fuera de beat) ──► [BOUNCE_RESET] ──┐
           │                                                            │
       (Corte OK)                                                       │
           ▼                                                            │
     [RHYTHM_PULSE_2] ──► (Fallo / Fuera de beat) ──────────────────────┤
           │                                                            │
       (Corte OK)                                                       │
           ▼                                                            │
     [RHYTHM_PULSE_3] ──► (Fallo / Fuera de beat) ──────────────────────┤
           │                                                            │
       (Corte OK)                                                       │
           ▼                                                            │
     [DRUM_ROLL_BUILDUP] (Redoble trrrr-PUM!)                           │
           │                                                            │
           ▼                                                            │
     [GOLDEN_SPHERE_LAUNCH] ──► (Fallo) ────────────────────────────────┘
           │
       (Corte OK en Beat 4)
           ▼
     [SLOWMO_SHATTER] (Apertura de esfera dorada en cámara lenta)
           │
           ▼
     [TROPHY_REVEAL] (Levitación de Trofeo Drum dorado + confeti + botón Continuar)
```

### Tolerancia y Sincronización Rítmica
* Metrónomo interno a **120 BPM** ($500\text{ms}$ por negra).
* La esfera es lanzada desde el parche en $t = 0\text{ms}$ y alcanza la cúspide de su trayectoria parabólica exactamente en $t = 500\text{ms}$ (el golpe del metrónomo).
* **Ventana de Acierto:** $\pm 130\text{ms}$ alrededor del cenit del beat.

---

## 4. El Clímax: Trofeo 3D y Transición a la Unidad 4

* **Revelación del Trofeo:**
  * Del centro de la Gran Esfera Dorada emerge el icono **`Drum`** en formato de medallón/trofeo 3D dorado pulido con baquetas cruzadas.
  * Animación de levitación suave (seno vertical $\pm 6\text{px}$) y lluvia radial de confeti de partículas doradas y plateadas.
* **Botón de Salida:**
  * Un único botón táctil 3D con estilo oficial de La Clave:
    * Texto: **"Continuar a la Unidad 4"** con flecha animada.
    * Al pulsarse: Llama a `onContinue()`, desbloquea la Unidad 4 en `MainApp.tsx` y ejecuta la animación de transición de unidades.

---

## 5. Motor de Audio Sintetizado (Web Audio API)

Todos los sonidos se sintetizan algorítmicamente en el navegador mediante nodos nativos:
1. **Golpe de Bombo Acústico:** Oscilador sinusoidal con barrido descendente de frecuencia ($130\text{ Hz} \to 42\text{ Hz}$ en $120\text{ms}$) conectado a un filtro paso-bajo resonante que emula la tensión del parche.
2. **Corte Rítmico (Esferas 1, 2 y 3):** Ráfaga breve de ruido blanco filtrado paso-alto ($0.04\text{s}$) combinada con una onda triangular aguda ($1800\text{ Hz}$) simulando un golpe de baqueta o campanilla cristalina nítida.
3. **Rebote Amortiguado (Fallo):** Tono grave opaco a $85\text{ Hz}$ con decaimiento rápido y sin agudos (*thud* sordo).
4. **Redoble Previo al Pulso 4:** Ráfaga rítmica de 4 micro-pulsos de percusión acelerados culminando en el lanzamiento de la esfera dorada.
5. **Corte Dorado y Fanfarria:** Ruido blanco modelado como platillo *Crash* orquestal con envolvente exponencial suave ($1.8\text{s}$) acompañado de una triada mayor arpegiada brillante (Re mayor).

---

## 6. Organización de Archivos y Refactorización

* **`src/components/unit3-rhythm/`** [NUEVO DIRECTORIO]:
  * `types.ts`: Definición de estados (`RhythmCinematicState`), modelos de esferas y física de partículas.
  * `rhythmAudio.ts`: Síntesis pura de bombo, splash, crash y redoble.
  * `DrumCanvas.tsx`: Renderizado Canvas del parche de bombo, deformación elástica, ondas de choque, esferas 3D con física parabólica y trazo de corte.
  * `TrophyCelebration.tsx`: Trofeo dorado levitando, confeti y botón minimalista "Continuar".
* **`src/components/Unit3CelebrationModal.tsx`** [MODIFICAR]: Modal de pantalla completa conectando la nueva máquina de estados de 4 tiempos y el canvas rítmico.
* **`src/app/sandbox/unit3/page.tsx`** [MODIFICAR]: Actualización del sandbox con diseño limpio para probar los rebotes, cortes y trofeo.
* **`src/components/MainApp.tsx`** [CONSERVAR]: La integración existente al terminar `u3-node28.5` se mantiene intacta.

---

## 7. Criterios de Aceptación

1. **Ausencia Total de Textos Durante el Juego:** La pantalla no contiene cronómetros, manuales ni advertencias; solo el escenario del tambor, los 4 indicadores luminosos y las esferas.
2. **Física Táctil y Rítmica:**
   * Las esferas botan en sincronía exacta con el bombo (120 BPM).
   * Al cortar una esfera, se divide visiblemente en 2 hemisferios con sonido percusivo gratificante.
3. **Flujo Amigable:** Un corte errado no congela la app ni muestra pantallas rojas; la esfera rebota y el compás 1-2-3-4 se reinicia suavemente.
4. **Clímax Espectacular:** El corte de la 4ta esfera dorada entra en slow-motion, se abre la esfera y el trofeo emerge con confeti y sonido orquestal.
5. **Compatibilidad:** 60+ FPS tanto en móvil táctil como en ratón de escritorio.
