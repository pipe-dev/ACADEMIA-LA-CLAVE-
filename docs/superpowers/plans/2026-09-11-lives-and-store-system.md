# Plan de Implementación: Sistema Unificado de Vidas, Tienda y Recuperación

> **Para trabajadores agenticos:** SUB-HABILIDAD REQUERIDA: Usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Cada paso utiliza la sintaxis de casillas de verificación (`- [ ]`) para el seguimiento.

**Meta:** Implementar el motor centralizado de vidas y tiempo pasivo (20 min), la compra escalonada en la tienda, el examen de recuperación de 7 pasos, y las reglas específicas de vidas en Academia, Afinador (Tug-of-War y protección en Calentamiento) y Práctica/Karaoke (canción de cortesía).

**Arquitectura:** Motor desacoplado y determinista `livesEngine.ts` consumido por `MainApp.tsx` para sincronización continua con `UserStats`, conectado a la interfaz a través de modales dedicados (`StoreModal`, `RecoveryExamModal`) y validadores de acceso contextuales en cada vista.

**Tech Stack:** Next.js 15 (Turbopack), React 18, TypeScript, Tailwind CSS v4, Motion (framer-motion), Web Audio API, Canvas Confetti.

## Restricciones Globales
* Las vidas van de `0` a `5` (tope máximo `5`).
* Tiempo pasivo: exactamente 20 minutos (`1,200,000 ms`) por vida.
* Precio escalonado: 50 XP base, +25 XP por compra consecutiva en el mismo ciclo. Se reinicia a 50 XP al llegar a 5 vidas.
* Canción de cortesía: exactamente 1 canción cuando `lives === 0`. No puede otorgar vidas aunque saque 5 estrellas.
* Afinador con 0 vidas: bloquea el afinador principal; mantiene el acordeón de herramientas 100% habilitado.
* Afinador Calentamiento: zona segura sin pérdida de vidas.
* Afinador niveles (Fácil, Medio, Difícil, Maestro): barra Tug-of-War (50% inicio, silencio congela, 0% pierde 1 vida, 100% gana nivel).
* Examen de recuperación: 7 pasos intercalados (Afinación aleatoria de `tunerLevelsData.ts` $\rightarrow$ Pregunta de `academyData.ts` $\rightarrow$ Ritmo aleatorio de `rhythmPatterns` $\rightarrow$ Pregunta $\rightarrow$ Afinación $\rightarrow$ Pregunta $\rightarrow$ Ritmo).
* Cero emojis en textos del sistema o copywriting.

---

### Tarea 1: Motor Matemático y Funciones Puras (`src/utils/livesEngine.ts`)

**Archivos:**
- Modificar: `src/types.ts:30-45`
- Crear: `src/utils/livesEngine.ts`
- Crear: `src/utils/__tests__/livesEngine.test.ts` (o script de verificación Node)

**Interfaces:**
- Consume: `UserStats` de `src/types.ts`
- Produce:
  - `calculatePassiveRecharge(stats: UserStats, now?: number): UserStats`
  - `getTimeToNextLife(stats: UserStats, now?: number): { remainingMs: number; formatted: string }`
  - `calculateLifePrice(purchaseCount: number): number`
  - `applyLifeDeduction(stats: UserStats, now?: number): UserStats`
  - `applyLifeAward(stats: UserStats, amount?: number): UserStats`
  - `applyLifePurchase(stats: UserStats): { success: boolean; updatedStats: UserStats; cost: number }`

- [ ] **Paso 1: Actualizar `src/types.ts` con los nuevos campos de vidas**

Asegurar que `UserStats` incluya:
```typescript
export interface UserStats {
  // ...
  lives: number;
  maxLives: number;
  lastLifeLostAt: number | null;
  lifePurchaseCount: number;
  hasUsedCourtesySong: boolean;
}
```

- [ ] **Paso 2: Escribir el script de prueba / verificación `src/utils/__tests__/livesEngine.test.ts`**

Cubrir los siguientes casos de prueba:
1. Cálculo de recarga pasiva después de 20 min (+1 vida), 40 min (+2 vidas) y 100 min (tope 5 vidas y limpieza de timestamp).
2. Cálculo de tiempo restante formateado (`mm:ss`).
3. Precios escalonados: 0 compras = 50 XP, 1 compra = 75 XP, 2 compras = 100 XP.
4. Reinicio de `lifePurchaseCount` a 0 al alcanzar 5 vidas.
5. Deducción de vida que no baje de 0 e inicialice `lastLifeLostAt`.
6. Compra que valide saldo de XP insuficiente.

- [ ] **Paso 3: Implementar `src/utils/livesEngine.ts`**

Código limpio, modular y determinista que pase todas las aserciones.

- [ ] **Paso 4: Ejecutar la prueba del motor**

Ejecutar: `node -e "require('tsx'); ..."` o script runner para verificar código de salida 0.

- [ ] **Paso 5: Commit de la Tarea 1**

`git add src/types.ts src/utils/livesEngine.ts src/utils/__tests__/livesEngine.test.ts; git commit -m "feat: implement core lives calculation engine and tests"`

---

### Tarea 2: Integración de Audio y Estado Global (`src/utils/audioService.ts` y `src/components/MainApp.tsx`)

**Archivos:**
- Modificar: `src/utils/audioService.ts:320-360`
- Modificar: `src/components/MainApp.tsx:280-370` y `src/components/MainApp.tsx:720-760`

**Interfaces:**
- Consume: `livesEngine.ts`, `audioService.ts`
- Produce: Handlers centralizados `handleLoseLife(reason)`, `handleGainLife()`, `handleBuyLife()` y prop drilling hacia vistas.

- [ ] **Paso 1: Agregar efectos de sonido para pérdida y ganancia de vidas en `audioService.ts`**

```typescript
playHeartLostSound(): void // Tono descendente sutil (420Hz -> 280Hz)
playHeartGainedSound(): void // Acorde brillante arpegiado (Do-Mi-Sol-Do5)
```

- [ ] **Paso 2: Conectar el temporizador pasivo de 1 segundo en `MainApp.tsx`**

En `MainApp.tsx`:
* Ejecutar un `setInterval` de 1000ms que invoque `calculatePassiveRecharge` si `userStats.lives < 5`.
* Si se recupera una vida pasivamente, actualizar `userStats` y reproducir `playHeartGainedSound()`.

- [ ] **Paso 3: Crear los controladores de acción en `MainApp.tsx`**

* `handleLoseLife(source: 'academia' | 'tuner' | 'karaoke')`: Descuenta vida con `applyLifeDeduction`, reproduce `playHeartLostSound()`, dispara animación háptica y muestra toast sutil.
* `handleGainLife()`: Si `userStats.lives < 5`, suma vida con `applyLifeAward`, reproduce `playHeartGainedSound()` y emite confeti si procede.
* `handleBuyLife()`: Ejecuta `applyLifePurchase`, descuenta XP, otorga vida y reproduce sonido.

- [ ] **Paso 4: Verificar compilación TypeScript**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 5: Commit de la Tarea 2**

`git add src/utils/audioService.ts src/components/MainApp.tsx; git commit -m "feat: integrate centralized lives state and sound effects in MainApp"`

---

### Tarea 3: Componente del Header y Popover de Estado de Vidas (`src/components/Header.tsx`)

**Archivos:**
- Modificar: `src/components/Header.tsx:200-240`

**Interfaces:**
- Consume: `UserStats`, `getTimeToNextLife`
- Produce: Botón interactivo de vidas con contador en vivo, animación de corazón palpitante y popover rápido al hacer clic.

- [ ] **Paso 1: Actualizar el botón de corazones en `Header.tsx`**

* Al hacer clic en el botón de corazones, si `lives < 5`:
  * Muestra un diálogo/popover emergente con:
    * Vidas actuales: `{userStats.lives} de 5 vidas`.
    * Temporizador en vivo: *"Siguiente vida gratis en mm:ss"*.
    * Botón primario: *"Recargar en la Tienda"* (abre `onOpenStore`).
    * Botón secundario: *"Entrenar para ganar 1 vida"* (abre `onOpenRecoveryExam`).
* Si `lives === 5`: Muestra aviso sutil *"Tus vidas están al máximo"*.

- [ ] **Paso 2: Agregar micro-animación de impacto al cambiar vidas**

Efecto de salto/pulso en el icono del corazón cuando disminuye o aumenta.

- [ ] **Paso 3: Verificar compilación**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 4: Commit de la Tarea 3**

`git add src/components/Header.tsx; git commit -m "feat: enhance header lives counter with live timer and quick action popover"`

---

### Tarea 4: Modal de la Tienda con Precio Escalonado (`src/components/StoreModal.tsx`)

**Archivos:**
- Modificar: `src/components/StoreModal.tsx:1-120`

**Interfaces:**
- Consume: `UserStats`, `calculateLifePrice`, `getTimeToNextLife`
- Produce: Interfaz de compra individual de vida, tarjeta de entrenamiento gratuito y reloj pasivo.

- [ ] **Paso 1: Actualizar `StoreModal.tsx` con compra individual y precio escalonado**

* Calcular precio actual con `calculateLifePrice(userStats.lifePurchaseCount)`.
* Mostrar botón con el precio exacto (ej: `50 XP`, `75 XP`, `100 XP`...).
* Deshabilitar si `userStats.xp < cost` (texto *"XP insuficiente"*).
* Deshabilitar si `userStats.lives >= 5` (texto *"Vidas al máximo"*).
* Tarjeta informativa: *"Siguiente vida gratis en mm:ss"*.

- [ ] **Paso 2: Agregar botón de "Entrenar para ganar 1 vida (Gratis)"**

* Si `userStats.lives < 5`: tarjeta con icono de rayo o meta: *"Entrenamiento de Recuperación: Completa 7 ejercicios y gana 1 vida gratis"*.
* Dispara `onOpenRecoveryExam()`.

- [ ] **Paso 3: Verificar compilación**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 4: Commit de la Tarea 4**

`git add src/components/StoreModal.tsx; git commit -m "feat: upgrade StoreModal with progressive life pricing and recovery training entry"`

---

### Tarea 5: Modal de Examen de Recuperación de 7 Pasos (`src/components/RecoveryExamModal.tsx`)

**Archivos:**
- Crear: `src/components/RecoveryExamModal.tsx`
- Modificar: `src/components/MainApp.tsx` (para registrar el modal)

**Interfaces:**
- Consume: `tunerLevelsData.ts` (niveles de afinación), `academyData.ts` (preguntas), `rhythmPatterns` (ritmos).
- Produce: Modal a pantalla completa / centrado que orquesta los 7 pasos y llama a `onCompleteSuccess()`.

- [ ] **Paso 1: Crear la estructura de pasos en `RecoveryExamModal.tsx`**

Construir dinámicamente la prueba al abrir el modal seleccionando:
* Paso 1: Ejercicio de Afinación aleatorio.
* Paso 2: Pregunta de solfeo aleatoria.
* Paso 3: Ejercicio de Ritmo aleatorio.
* Paso 4: Pregunta de solfeo aleatoria.
* Paso 5: Ejercicio de Afinación aleatorio.
* Paso 6: Pregunta de solfeo aleatoria.
* Paso 7: Ejercicio de Ritmo aleatorio.

- [ ] **Paso 2: Implementar el flujo interactivo de los 7 pasos**

* Barra de progreso superior con 7 píldoras/segmentos numerados.
* Para cada paso de afinación: reutilizar el detector de tono y medidor de cents.
* Para cada paso de pregunta: tarjetas de selección múltiple con validación inmediata.
* Para cada paso de ritmo: botón de tap con seguimiento de tempo BPM.

- [ ] **Paso 3: Pantalla de Éxito y Otorgamiento de Vida**

* Al completar el paso 7: animación con confeti, texto *"¡Has recuperado 1 vida! ❤️"* y llamada a `onGainLife()`.

- [ ] **Paso 4: Verificar compilación**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 5: Commit de la Tarea 5**

`git add src/components/RecoveryExamModal.tsx src/components/MainApp.tsx; git commit -m "feat: create 7-step interleaved RecoveryExamModal for earning lives"`

---

### Tarea 6: Integración en Academia (`src/components/AcademiaView.tsx` y `src/components/LessonModal.tsx`)

**Archivos:**
- Modificar: `src/components/AcademiaView.tsx:390-440`
- Modificar: `src/components/LessonModal.tsx`

**Interfaces:**
- Consume: `userStats.lives`, `handleLoseLife`, `onOpenRecoveryExam`, `onOpenStore`.
- Produce: Intercepción de 0 vidas en nodos y deducción de vidas por fallos y exámenes reprobados.

- [ ] **Paso 1: Intercepción en `AcademiaView.tsx` con 0 vidas**

* En `handleNodeClick`, si `userStats.lives === 0`:
  * Bloquear apertura de lección.
  * Mostrar modal de *"Sin Vidas"* con las 3 opciones: Entrenar (7 pasos), Tienda, o Esperar tiempo.

- [ ] **Paso 2: Deducción de vidas en `LessonModal.tsx`**

* Si el usuario falla preguntas interactivas o agota intentos en ejercicios de entonación, invocar `onLoseLife('academia')`.
* Si reprueba el examen final de unidad, invocar `onLoseLife('academia')`. Si reintenta y vuelve a reprobar, descontar otra vida.

- [ ] **Paso 3: Verificar compilación**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 4: Commit de la Tarea 6**

`git add src/components/AcademiaView.tsx src/components/LessonModal.tsx; git commit -m "feat: enforce lives loss and 0-lives gate in AcademiaView and LessonModal"`

---

### Tarea 7: Integración en Afinador con Barra Tug-of-War (`src/components/AfinadorView.tsx`)

**Archivos:**
- Modificar: `src/components/AfinadorView.tsx:180-250` y `AfinadorView.tsx:710-800`

**Interfaces:**
- Consume: `userStats.lives`, `handleLoseLife`.
- Produce: Bloqueo de afinador superior en 0 vidas (manteniendo acordeón activo), insignia de Calentamiento seguro, y barra Tug-of-War en los 4 modos con niveles.

- [ ] **Paso 1: Bloqueo del afinador principal con 0 vidas**

* Si `userStats.lives === 0`:
  * Cubrir el afinador superior (esfera, micrófono, teclado) con una tarjeta estética: *"Afinador en pausa · Sin energía vocal"* con botón para abrir recuperación o tienda.
  * Mantener el acordeón de *"Aparatos y Programas de Práctica"* 100% interactivo y desbloqueado.

- [ ] **Paso 2: Modo Calentamiento protegido**

* En el selector de dificultad, `Calentamiento` muestra insignia de escudo verde: *"Zona Segura (sin pérdida de vidas)"*.

- [ ] **Paso 3: Barra Tug-of-War en los 4 modos de nivel (Fácil, Medio, Difícil, Maestro)**

* Reemplazar contrarreloj con la Barra de Precisión Orgánica iniciada al 50%.
* Canto afinado: incrementa hacia el 100% (supera el nivel).
* Silencio: congela la barra exactamente en su posición.
* Canto desafinado sostenido: disminuye hacia el 0%.
* Si llega al 0%: nivel fracasado y descuenta **-1 vida** (`onLoseLife('tuner')`).

- [ ] **Paso 4: Verificar compilación**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 5: Commit de la Tarea 7**

`git add src/components/AfinadorView.tsx; git commit -m "feat: implement Tug-of-War precision bar and zero-lives accordion isolation in AfinadorView"`

---

### Tarea 8: Integración en Karaoke y Canción de Cortesía (`src/components/PracticaView.tsx` y `src/components/practica/practica-player.tsx`)

**Archivos:**
- Modificar: `src/components/PracticaView.tsx`
- Modificar: `src/components/practica/practica-player.tsx`

**Interfaces:**
- Consume: `userStats.lives`, `userStats.hasUsedCourtesySong`, `handleLoseLife`, `handleGainLife`.
- Produce: Penalización por $\le 2$ estrellas, vida extra por 5 estrellas, y control estricto de 1 canción de cortesía.

- [ ] **Paso 1: Regla de canción de cortesía con 0 vidas en `PracticaView.tsx`**

* Si `userStats.lives === 0` y `!userStats.hasUsedCourtesySong`:
  * Permite cantar 1 canción con aviso: *"Canción de cortesía activa"*.
* Si `userStats.lives === 0` y `userStats.hasUsedCourtesySong`:
  * Bloquea el reproductor e invita a recuperar vidas antes de cantar otra canción.

- [ ] **Paso 2: Evaluación de fin de canción en `practica-player.tsx`**

* Al finalizar:
  * Si era canción de cortesía: `hasUsedCourtesySong` pasa a `true` y **no** se otorgan vidas sin importar las estrellas.
  * Si no era canción de cortesía:
    * $\le 2$ estrellas: descuenta **-1 vida** (`onLoseLife('karaoke')`).
    * 3 o 4 estrellas: vidas sin cambios.
    * 5 estrellas: otorga **+1 vida** (`onGainLife()`, hasta el tope de 5).

- [ ] **Paso 3: Verificar compilación**

Ejecutar: `npx tsc --noEmit`

- [ ] **Paso 4: Commit de la Tarea 8**

`git add src/components/PracticaView.tsx src/components/practica/practica-player.tsx; git commit -m "feat: implement karaoke stars lives evaluation and courtesy song restriction"`

---

### Tarea 9: Verificación Integral de Sistema y Pruebas de Calidad

- [ ] **Paso 1: Ejecutar verificación de tipos global**

Ejecutar: `npx tsc --noEmit` y confirmar 0 errores.

- [ ] **Paso 2: Probar el flujo completo en servidor de desarrollo**

Verificar en `http://localhost:9002`:
* Contador de vidas y temporizador pasivo de 20 min en el Header.
* Compra en Tienda con costo escalonado (50, 75, 100 XP...).
* Examen de 7 pasos intercalados y recarga de +1 vida.
* Bloqueo en Academia al llegar a 0 vidas.
* Afinador: Tug-of-War, Calentamiento seguro, y acordeón habilitado en 0 vidas.
* Karaoke: penalización con $\le 2$ estrellas, premio con 5 estrellas, y restricción de cortesía.

- [ ] **Paso 3: Documentar resultados en `walkthrough.md`**

Actualizar el walkthrough con evidencias y resumen de pruebas completadas.
