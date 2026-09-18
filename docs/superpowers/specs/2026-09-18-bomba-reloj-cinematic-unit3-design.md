# Especificación de Diseño: Cinemática de Desactivación de Bomba ("Desactiva la Bomba") - Unidad 3

## 1. Visión General y Propósito

La **Cinemática de la Unidad 3** marca el hito de finalización de la **Unidad 3 ("Tempo y Coordinación")** y la transición hacia la **Unidad 4 ("Expresión, Dicción y Estilo")**. 

A diferencia del globo aerostático táctil (Unidad 1) y la copa de cristal resonante por micrófono vocal (Unidad 2), la Unidad 3 pone a prueba la **precisión rítmica y el tempo motor** del usuario en un entorno de alta tensión cinemática: **desactivar una bomba de tiempo táctica** contenida en un maletín de espía de alta tecnología.

### Objetivos Clave
1. **Evaluar el Tempo y Ritmo de Forma Lúdica:** Cortar cables tensionados al ritmo del metrónomo (120 BPM) usando gestos de deslizamiento (*swipe*) tipo *Fruit Ninja*.
2. **Estética Fotorrealista Táctica 3D:** Renderizar un maletín militar/espía con texturas de aleación oscura, remaches, display LED de 7 segmentos, cables cilíndricos con brillo y escáner láser rítmico.
3. **Clímax Épico sin Frustración:** Congelamiento en cámara lenta en `00:01.00`, despresurización neumática con chorros de vapor, apertura de compuerta blindada y revelación del **Trofeo Dorado con Baquetas Cruzadas (`Drum`)**.
4. **Resiliencia ante Fallos:** Cortes a destiempo restan 1 segundo y producen chispas; si el tiempo se agota, ocurre un inofensivo puff de humo caricaturesco y se ofrece un botón inmediato de reintento (`00:08.00`).
5. **Entorno de Pruebas Aislado:** Sandbox en `/sandbox/unit3` con controles completos de depuración.

---

## 2. Arquitectura de Componentes y Archivos

### 2.1 Archivos Involucrados
- **`src/components/Unit3CelebrationModal.tsx`** [NUEVO]: Componente principal del modal de celebración. Contiene la máquina de estados, el maletín 3D, los cables físicos, la capa Canvas para el trazo de la cuchilla y la secuencia de apertura/trofeo.
- **`src/app/sandbox/unit3/page.tsx`** [NUEVO]: Página de pruebas dedicada con panel de telemetría, sliders de BPM, botones de forzado de estados y visualización en tiempo real.
- **`src/components/MainApp.tsx`** [MODIFICAR]: Conexión del trigger de fin de Unidad 3 para instanciar `Unit3CelebrationModal` cuando se complete el nodo de evaluación `u3-node28.5`.

### 2.2 Diagrama de Componentes
```
[MainApp / Sandbox]
       │
       ▼
[Unit3CelebrationModal]
       ├── [TacticalBriefcaseShell (CSS 3D / SVG)]
       │       ├── [DigitalLEDDisplay (Reloj 7-segmentos + LEDs de alarma)]
       │       ├── [RhythmBeamingLaser (Guía visual de barrido a 120 BPM)]
       │       ├── [ArmoredHatch (Compuerta con pistones neumáticos)]
       │       └── [GoldenTrophyRevealer (Icono Drum dorado levitando + confeti)]
       │
       ├── [CablePhysicsCanvasLayer (HTML5 Canvas)]
       │       ├── Detección de trazos de espada táctil (Fruit Ninja slice)
       │       ├── Renderizado de estela de acero brillante + partículas de chispas
       │       └── División y caída elástica de cables cortados (Curvas Bézier)
       │
       └── [SynthesizedAudioEngine (Web Audio API nativo)]
               ├── Tic-tac mecánico analógico
               ├── Swoosh de corte de cuchilla
               ├── Relé metálico de corte exitoso
               ├── BZZT! de cortocircuito en corte a destiempo
               ├── PSSSH! de escape neumático
               ├── Fanfarria arpegiada mayor de victoria
               └── Pffft! de humo en tiempo agotado
```

---

## 3. Modelo de Interacción y Mecánicas

### 3.1 Cables y Detección de Corte (*Fruit Ninja Swipe*)
- **4 Cables Físicos:**
  1. *Cable 1 (Azul Neón - Ciano):* Frecuencia rítmica base (pulso 1).
  2. *Cable 2 (Rojo Carmesí):* Sincronización en contratiempo (pulso 2).
  3. *Cable 3 (Amarillo Eléctrico):* Aceleración rítmica (pulso 3).
  4. *Cable 4 (Púrpura Master):* Cable central maestro (pulso 4 definitivo).
- **Mecánica de Swipe:**
  - Se capturan eventos unificados `pointerdown`, `pointermove`, `pointerup` sobre un `<canvas>` superpuesto con `touch-action: none`.
  - El trazo del puntero almacena un histórico de los últimos 8 puntos $(x, y, t)$.
  - Si la línea de corte intersecta la caja de colisión o el trazo Bézier de un cable con velocidad mínima ($> 0.35\text{ px/ms}$), se procesa el intento de corte.
- **Ventana de Acierto Rítmico:**
  - El metrónomo corre a **120 BPM** ($500\text{ms}$ por pulso).
  - El escáner láser rítmico ilumina verticalmente la zona de cables con una oscilación sinusoidal que alcanza su cénit de luz en cada pulso de negra.
  - La ventana de acierto (*hit window*) es de $\pm 120\text{ms}$ respecto al pulso rítmico.
  - **Corte On-Beat:** El cable se secciona limpiamente, destella en blanco, emite sonido metálico y se divide en dos extremos que caen con física elástica amortiguada.
  - **Corte Off-Beat:** El cable no se corta o genera chispas rojas, zumbido eléctrico (*BZZT!*), micro-sacudida de pantalla ($3\text{px}$ por $200\text{ms}$) y resta **1 segundo** al temporizador digital.

### 3.2 Física de Curvas Bézier y Deformación
- Cada cable intacto se define mediante una curva Bézier cúbica:
  $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$
  con puntos de anclaje fijos $P_0$ (terminal izquierdo del maletín) y $P_3$ (terminal derecho), y puntos de control $P_1, P_2$ que proporcionan comba por gravedad.
- Al cortarse en $t_{cut}$, la curva se divide según el algoritmo de De Casteljau en dos segmentos Bézier independientes:
  - Extremo Izquierdo: Anclado en $P_0$, su extremo libre $P_{cut, L}$ experimenta una velocidad inicial de retracción elástica hacia la izquierda y caída por gravedad amortiguada.
  - Extremo Derecho: Anclado en $P_3$, su extremo libre $P_{cut, R}$ experimenta retracción hacia la derecha y oscilación pendular amortiguada.

---

## 4. Diseño Visual y Estética Fotorrealista 3D

### 4.1 Maletín Táctico
- **Gama Cromática:** Fondo gris grafito/antracita militar (`#111317`, `#1a1d24`, `#232730`), detalles en cromo pulido, tornillería hexagonal en titanio mate y biseles con luces reflectantes.
- **Display de 7 Segmentos:** Fuente tipográfica segmentada digital (estilo reloj LCD militar), color rojo rubí intenso con resplandor difuso (`text-shadow: 0 0 12px rgba(239,68,68,0.8)`). Muestra `00:SS.cc` (segundos y centésimas).
- **Indicadores de Estado:** Matriz de 4 diodos LED rectangulares que cambian de rojo intermitente a verde esmeralda fijo a medida que se corta cada cable con éxito.

### 4.2 La Revelación del Trofeo (Clímax)
- **Congelamiento de Tiempo:** Al cortar el 4° cable en el pulso rítmico, el reloj se clava instantáneamente en **`00:01.00`**. La iluminación ambiental se oscurece ligeramente con efecto viñeta cinemática.
- **Despresurización Neumática:**
  - Sonido seco de cerrojos electromecánicos liberándose (*CLACK*).
  - Descarga violenta de vapor simulada mediante partículas blancas translúcidas que salen expulsadas horizontalmente por válvulas laterales (*PSSSH!*).
- **Apertura de la Escotilla:** La compuerta de acero blindado con rayas de peligro amarillas y negras se desliza verticalmente hacia arriba revelando una cámara interna retroiluminada con luz dorada cenital.
- **Trofeo Flotante:**
  - El icono **`Drum`** de Lucide renderizado en material dorado 3D brillante (gradiente metálico oro pulido con reflejos especulares de luz giratoria).
  - Dos baquetas cruzadas detrás de un tambor de concierto con la inscripción `"UNIDAD 3 COMPLETADA"`.
  - Animación de levitación suave (seno vertical $\pm 6\text{px}$) y explosión radial de confeti dorado y plateado.
- **Acción del Usuario:** Botón prominente con estilo pulido `"Continuar a la Unidad 4: Expresión, Dicción y Estilo"` con gradiente dorado/ámbar y flecha animada.

---

## 5. Máquina de Estados de la Cinemática

```
[INTRO_POWER_ON]
       │  (Apertura de maletín, LEDs inicializan, reloj se fija en 00:08.00)
       ▼
  [DEFUSING] ◄────────────────────────────────────────┐
       │                                              │
       ├──[Corte Off-Beat] ──► [MISCUT_PENALTY] ──────┘
       │                        (-1.00s, BZZT!, shake)
       │
       ├──[Tiempo Agotado <= 00:00.00] ──► [TIMEOUT_PUFF]
       │                                    (Puff humo inofensivo,
       │                                     botón "Reintentar Desactivación")
       │                                     │
       │                                     └──► (Reinicia a DEFUSING a 00:08.00)
       │
       └──[4 Cables Cortados On-Beat]
                │
                ▼
      [DEFUSED_SLOWMO] (Reloj congela en 00:01.00)
                │
                ▼
      [PNEUMATIC_RELEASE] (Chorros vapor, CLACK-PSSSH!)
                │
                ▼
      [HATCH_OPENING] (Compuerta blindada se desliza hacia arriba)
                │
                ▼
      [TROPHY_REVEAL] (Trofeo Drum dorado levita, fanfarria, botón Unidad 4)
```

---

## 6. Motor de Audio Sintetizado (Web Audio API)

Para garantizar cero dependencias de red o archivos `.mp3` faltantes, todos los efectos se generan algorítmicamente mediante el `AudioContext` nativo del navegador:

1. **Tic-tac de Reloj Relé:** Pulsos cortos ($30\text{ms}$) de oscilador de onda triangular con filtro paso-bajo rápido a 800 Hz y decaimiento exponencial. Aumenta de pitch en los últimos 3 segundos.
2. **Swoosh de Corte:** Ráfaga de ruido blanco estéreo filtrada paso-banda ($800\text{ Hz} \to 2400\text{ Hz}$) con envolvente de ataque de $10\text{ms}$ y caída de $90\text{ms}$.
3. **Corte Metálico / Relé:** Impacto de alta energía con oscilador de onda cuadrada modulado a 440 Hz con caída abrupta ($50\text{ms}$) simulando el chasquido del alicate de corte.
4. **Zumbido de Error (BZZT!):** Onda diente de sierra desafinada a 75 Hz con distorsión por ondas de saturación (*waveshaper curve*) durante $180\text{ms}$.
5. **Escape Neumático (PSSSH!):** Ruido blanco filtrado paso-bajo con resonancia variable descendiendo de 3000 Hz a 400 Hz con envolvente exponencial suave de $1.2\text{s}$.
6. **Fanfarria de Victoria:** Cuatro osciladores sinusoidales puros arpegiados en triada mayor brillante con armónicos dorados (Re4, Fa#4, La4, Re5) con sustain y reverberación convolutiva sintética.
7. **Puff de Humo Cómico:** Tono sinusoidal descendente rápido (180 Hz a 40 Hz) superpuesto a un leve soplido suave de $300\text{ms}$.

---

## 7. Entorno de Pruebas: Sandbox `/sandbox/unit3`

El sandbox ubicado en `src/app/sandbox/unit3/page.tsx` proporcionará:
- Visualizador del modal en modo ventana completa o enmarcado de prueba.
- **Barra de Herramientas de Depuración:**
  - *Botón "Iniciar Desactivación":* Dispara la cinemática desde el estado inicial.
  - *Botón "Forzar Victoria":* Salta de inmediato al clímax con trofeo y apertura de compuerta.
  - *Botón "Forzar Timeout":* Reduce el tiempo a `00:00.00` para validar el puff de humo y el flujo de reintento.
  - *Selector de Tempo (BPM):* Slider interactivo entre 60 y 160 BPM para calibrar la dificultad y la velocidad del escáner láser.
  - *Interruptor de Audio Mute:* Para realizar pruebas en silencio sin saturar la sesión.
  - *Indicador de FPS y Telemetría:* Muestra los frames por segundo del canvas y el offset en ms de cada corte registrado.

---

## 8. Criterios de Aceptación y Verificación

1. **Interacción Táctil y Fluidez:**
   - El deslizamiento del dedo o ratón dibuja una estela luminosa continua sin retardo apreciable ($> 60\text{ FPS}$).
   - Cruzar un cable con velocidad suficiente activa la comprobación de tempo de forma inequívoca.
2. **Precisión Rítmica:**
   - Cortar en el momento en que el láser ilumina el cable (dentro de $\pm 120\text{ms}$) cuenta como acierto.
   - Cortar fuera de tempo produce el feedback sonoro y visual de penalización sin romper el juego.
3. **Clímax Cinemático:**
   - Cortar los 4 cables congela el reloj en `00:01.00`.
   - Los chorros de vapor y la apertura de compuerta ocurren con timing secuencial fluido.
   - El trofeo dorado con baquetas (`Drum`) se renderiza con iluminación metálica y animación flotante.
4. **Resiliencia y Recuperación:**
   - Si el tiempo expira, el humo inofensivo aparece y el botón de reintento restaura el juego a `00:08.00` sin recargar la página ni dejar estados corruptos.
5. **Compatibilidad:**
   - La cinemática se ejecuta limpiamente tanto en dispositivos móviles (touch) como en navegadores de escritorio (ratón).
