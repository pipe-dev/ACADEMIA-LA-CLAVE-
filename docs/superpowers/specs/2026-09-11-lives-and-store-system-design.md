# Especificación de Diseño: Sistema Unificado de Vidas, Tienda y Recuperación

**Fecha**: 2026-09-11  
**Estado**: Validado con el usuario en Brainstorming  
**Módulos involucrados**: `AcademiaView`, `AfinadorView`, `PracticaView` (Karaoke), `Header`, `StoreModal`, `RecoveryExamModal`, `useLivesManager` / `types.ts`

---

## 1. Resumen Ejecutivo
El sistema de vidas (corazones ❤️) y la tienda se integran de forma coherente y gamificada a través de las 3 secciones principales de la aplicación:
1. **Academia**: Perder vidas por fallar preguntas o reprobar exámenes de unidad; bloqueo de nodos con 0 vidas.
2. **Afinador**: Penalización en los 4 modos con niveles (Fácil, Medio, Difícil, Maestro) mediante la *Barra de Precisión Orgánica (Tug-of-War)*; protección total en Calentamiento (sin pérdida de vidas); con 0 vidas, el afinador principal se bloquea y solo el acordeón de herramientas inferiores queda habilitado.
3. **Práctica (Karaoke)**: Perder 1 vida con $\le 2$ estrellas; vidas intactas con 3 o 4 estrellas; ganar 1 vida con 5 estrellas; regla estricta de 1 sola canción de cortesía con 0 vidas (que no puede otorgar vidas aunque se saquen 5 estrellas).
4. **Tienda y Recarga**: Compra de vidas individual (1 a 1) con precio progresivo (+25 XP por compra consecutiva: 50 XP, 75 XP, 100 XP... reiniciándose a 50 XP al llegar a 5 vidas); recarga pasiva de 1 vida cada 20 minutos con cuenta regresiva en vivo (`mm:ss`).
5. **Examen de Recuperación (7 Pasos Intercalados)**: Permite ganar +1 vida gratis sin gastar XP completando una prueba de 7 pasos:  
   **Afinación (nivel aleatorio) → Pregunta → Ritmo (nivel aleatorio) → Pregunta → Afinación → Pregunta → Ritmo**.

---

## 2. Modelo de Datos y Estado (`UserStats`)

En [`src/types.ts`](file:///c:/Users/dani3/OneDrive/Escritorio/games/LaClave/AfinApp/src/types.ts) se actualizan las propiedades de vidas:

```typescript
export interface UserStats {
  // ... campos existentes (xp, level, streak, name...)
  lives: number;                    // Vidas actuales: 0 a 5 (por defecto 5)
  maxLives: number;                 // Tope máximo de vidas: 5
  lastLifeLostAt: number | null;    // Timestamp en ms del momento en que cayó por debajo de 5
  lifePurchaseCount: number;        // Contador de compras consecutivas en el ciclo actual (para calcular precio escalonado)
  hasUsedCourtesySong: boolean;     // Flag: true si ya cantó la canción de cortesía estando en 0 vidas
}
```

### Reglas de Estado y Sincronización:
* **Persistencia**: Almacenado en `localStorage` bajo `laclave_user_stats_v5`.
* **Precio Escalonado**:
  $$\text{Costo XP} = 50 + (\text{lifePurchaseCount} \times 25)$$
  * 1ª compra: 50 XP
  * 2ª compra: 75 XP
  * 3ª compra: 100 XP
  * 4ª compra: 125 XP
  * 5ª compra: 150 XP
  * En cuanto `lives === maxLives` (5 vidas), `lifePurchaseCount` se reinicia a `0`.
* **Recarga Pasiva Continua**:
  * Intervalo: `20 * 60 * 1000` ms (20 minutos).
  * En cada carga o intervalo de 1s:
    $$\text{vidasGanadas} = \left\lfloor \frac{\text{Date.now}() - \text{lastLifeLostAt}}{20 \times 60 \times 1000} \right\rfloor$$
  * Si $\text{vidasGanadas} > 0$:
    * `lives = Math.min(5, lives + vidasGanadas)`
    * Si `lives >= 5`: `lastLifeLostAt = null`, `lifePurchaseCount = 0`, `hasUsedCourtesySong = false`.
    * Si `lives < 5`: `lastLifeLostAt = lastLifeLostAt + (vidasGanadas * 20 * 60 * 1000)`.

---

## 3. Mecánica Detallada por Sección

### 3.1 Academia (`AcademiaView.tsx` y `LessonModal.tsx`)
1. **Detección de 0 Vidas al pulsar un nodo**:
   * Si `lives === 0` y el usuario pulsa cualquier nodo de lección o examen, se previene la apertura de la lección y se despliega el modal interactivo de **"Sin Vidas"**.
   * Opciones disponibles en el modal:
     * **Entrenar para ganar 1 vida (Gratis)** $\rightarrow$ Abre el modal de examen de 7 pasos.
     * **Comprar 1 vida en la Tienda** $\rightarrow$ Abre `StoreModal`.
     * **Esperar recarga** $\rightarrow$ Muestra el reloj regresivo en tiempo real (`mm:ss`).
2. **Pérdida de vidas durante una lección**:
   * Cada pregunta teórica fallada o ejercicio de afinación con intentos agotados descuenta **-1 vida**.
   * Si las vidas caen a 0 dentro de la lección, la lección se pausa y ofrece recuperar vida o regresar al mapa.
3. **Examen de Unidad**:
   * Reprobar el examen de fin de unidad descuenta **-1 vida**.
   * Si el usuario reintenta el examen y vuelve a perder, descuenta **otra vida**.

---

### 3.2 Afinador (`AfinadorView.tsx`)
1. **Niveles en los 4 Modos (Fácil, Medio, Difícil, Maestro)**:
   * **Mecánica "Tug-of-War" (Barra de Precisión Orgánica)**:
     * Al iniciar un nivel de notas, una barra de precisión inicia al **50%**.
     * **Canto afinado**: Llena la barra hacia la derecha (verde).
     * **Silencio para respirar/pensar**: La barra se **congela** en su posición actual. El silencio **nunca** penaliza.
     * **Canto desafinado sostenido**: Hace retroceder la barra hacia la izquierda (rojo).
     * **Victoria**: Barra llega al **100%** $\rightarrow$ Nivel superado con éxito.
     * **Derrota**: Barra cae al **0%** $\rightarrow$ Nivel fracasado y **descuenta -1 vida** (`loseLife('tuner')`).
2. **Modo Calentamiento (Zona Protegida)**:
   * Etiqueta con escudo verde: *"Zona Segura · Sin pérdida de vidas"*.
   * Permite calentar la voz sin riesgo de perder corazones.
3. **Comportamiento con 0 Vidas**:
   * **Afinador Principal Bloqueado**: La esfera de afinación, el micrófono y el teclado superior se deshabilitan con un velo sutil que indica *"Sin vidas suficientes para afinar"*.
   * **Acordeón Inferior 100% Libre**: Las 6 tarjetas de *"Aparatos y Programas de Práctica"* (Respiración diafragmática, Estabilidad 10s, Tesitura, Escalas pentatónicas, etc.) permanecen **completamente abiertas y operativas**.

---

### 3.3 Práctica / Karaoke (`PracticaView.tsx` y `practica-player.tsx`)
1. **Evaluación de Fin de Canción**:
   * **$\le$ 2 estrellas**: **Pierde 1 vida** (`-1 ❤️`).
   * **3 o 4 estrellas**: Aprobado normal $\rightarrow$ Vidas intactas.
   * **5 estrellas**: Gran desempeño $\rightarrow$ **¡Gana 1 vida!** (`+1 ❤️`, hasta 5 vidas max).
2. **Regla de Canción de Cortesía (0 Vidas)**:
   * Si `lives === 0` y `hasUsedCourtesySong === false`:
     * Se permite seleccionar y cantar **1 canción de cortesía**.
     * Al iniciar, se muestra un banner sutil: *"Canción de cortesía activa (0 vidas)"*.
     * **Regla estricta**: Si el usuario obtiene 5 estrellas en esta canción de cortesía, **NO recupera vida** (era una prueba de cortesía).
     * Al terminar la canción, `hasUsedCourtesySong` cambia a `true`.
   * Si `lives === 0` y `hasUsedCourtesySong === true`:
     * El catálogo de canciones se bloquea e invita al usuario a realizar el Examen de Recuperación o comprar vidas en la Tienda.

---

## 4. La Tienda (`StoreModal.tsx`)
* **Tarjeta "Comprar 1 Vida"**:
  * Muestra el precio dinámico actual ($50, 75, 100...$ XP).
  * Muestra el saldo actual del usuario (`userStats.xp`).
  * Si no alcanza el XP: botón deshabilitado con texto *"XP insuficiente"*.
  * Si `lives === 5`: botón deshabilitado con texto *"Vidas al máximo (5/5)"*.
  * Al comprar: descuenta XP, otorga +1 vida, reproduce `audioService.playHeartGainedSound()` e incrementa `lifePurchaseCount`.
* **Tarjeta "Entrenar para ganar 1 vida (Gratis)"**:
  * Visible cuando `lives < 5`.
  * Abre el `RecoveryExamModal`.
* **Tarjeta de Tiempo Pasivo**:
  * Reloj en cuenta regresiva activa: *"Siguiente vida gratis en 18:42"*.

---

## 5. Modal de Examen de Recuperación (`RecoveryExamModal.tsx`)
Secuencia estricta de 7 pasos intercalados adaptando los niveles existentes:
1. **Paso 1 (Afinación)**: Nivel aleatorio de afinación tomado de los niveles existentes en `tunerLevelsData.ts`, adaptado al registro vocal del usuario.
2. **Paso 2 (Pregunta)**: Pregunta interactiva aleatoria de solfeo/teoría tomada de `academyData.ts`.
3. **Paso 3 (Ritmo)**: Ejercicio aleatorio de ritmo tomado de los patrones existentes en `rhythmPatterns`.
4. **Paso 4 (Pregunta)**: Segunda pregunta interactiva de solfeo/teoría.
5. **Paso 5 (Afinación)**: Segundo nivel aleatorio de afinación de `tunerLevelsData.ts`.
6. **Paso 6 (Pregunta)**: Tercera pregunta interactiva de solfeo/teoría.
7. **Paso 7 (Ritmo)**: Segundo ejercicio aleatorio de ritmo de `rhythmPatterns`.

* **Recompensa**: Al finalizar con éxito los 7 pasos $\rightarrow$ Pantalla de victoria con confeti, sonido festivo y **+1 vida inmediata**. `hasUsedCourtesySong` se reinicia a `false`.

---

## 6. Integración en Header (`Header.tsx`)
* El contador de corazones muestra el número exacto `{userStats.lives}`.
* Al hacer clic sobre el corazón:
  * Si `lives < 5`: Muestra un popover/modal rápido con el tiempo exacto que falta para la siguiente vida (`Siguiente vida en 14:20`) y botones directos para *"Ir a la Tienda"* o *"Entrenar (+1 ❤️)"*.
  * Si `lives === 5`: Muestra *"Tus vidas están al máximo (5/5)"*.
* **Animaciones**:
  * Al perder vida: El corazón late en rojo, tiembla y muestra flotando un `-1 ❤️`.
  * Al ganar vida: El corazón late en verde/ámbar, resplandece y muestra flotando un `+1 ❤️`.

---

## 7. Plan de Verificación
1. **Prueba Unitaria de Vidas**: Verificar cálculo de recarga pasiva de 20 min con timestamps simulados en el pasado.
2. **Prueba de Academia**: Verificar que al fallar preguntas en lecciones y reprobar exámenes de unidad se descuenta 1 vida. Verificar que con 0 vidas los nodos abren el modal de recuperación.
3. **Prueba de Afinador**: Verificar que los 4 modos de nivel descuentan 1 vida al llegar la barra al 0% en Tug-of-War; verificar que Calentamiento no descuenta vidas; verificar que con 0 vidas el afinador principal se bloquea y solo el acordeón funciona.
4. **Prueba de Práctica (Karaoke)**: Verificar $\le 2$ estrellas (-1 vida), 3-4 estrellas (intacto), 5 estrellas (+1 vida). Verificar que con 0 vidas se permite exactamente 1 canción de cortesía y no otorga vidas.
5. **Prueba de Tienda**: Verificar compra de vidas individual a 50 XP, 75 XP, 100 XP y reinicio a 50 XP al alcanzar 5 vidas.
6. **Prueba de Examen de 7 Pasos**: Verificar la secuencia intercalada adaptando niveles existentes de afinación, preguntas y ritmo, y que al completar otorgue +1 vida.
