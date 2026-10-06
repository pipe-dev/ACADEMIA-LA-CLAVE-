# Especificación de Diseño: Tabla de Amigos Móvil y Modal de Detalle de Cantante

**Fecha**: 2026-10-05  
**Estado**: Aprobado por el usuario  
**Tema**: Rediseño móvil de la lista de amigos, resolución de colisiones visuales, botones "Desafiar" / "Animar" y nuevo `FriendDetailModal` interactivo con estadísticas vocales.

---

## 1. Problema y Objetivos

### 1.1 Problemas Actuales
1. **Colisión Visual en Dispositivos Móviles**: En la tarjeta exterior de amigo (`FriendCardItem`), el texto de nivel, la racha con la llama de días y la tesitura vocal se superponen sobre el puntaje de XP en pantallas con ancho móvil reducido.
2. **Falta de Profundidad en el Perfil de Amigos**: Las tarjetas muestran datos preliminares y no son interactivas; el usuario no puede tocar la tarjeta para ver el perfil completo de su amigo ni sus métricas de canto detalladas.
3. **Labels de Acción Mejorables**: Los botones decían "Retar Duelo" y "Ánimo". El usuario solicitó simplificarlos a **"Desafiar"** y **"Animar"**.
4. **Efectos Hover Innecesarios en Móvil**: La interfaz actual cuenta con animaciones y transiciones de cursor (`hover:scale`, `whileHover`) innecesarias para pantallas táctiles de teléfonos móviles, donde no existe puntero de ratón.
5. **Captura Real de Datos**: Al agregar amigos, deben registrarse datos reales (nombre, foto/avatar real, tesitura, racha, nivel y código).

### 1.2 Objetivos
- Corregir el layout exterior de la tarjeta para que todos los datos queden ordenados en una estructura de 2 filas sin riesgo de colisión ni saltos rotos de línea.
- Reemplazar los textos de los botones de acción rápida por **"Desafiar"** y **"Animar"**.
- Eliminar los selectores `:hover` y animaciones `whileHover` en las tarjetas, reemplazándolos exclusivamente por feedback táctil nativo móvil (`active:scale-95` / `whileTap={{ scale: 0.96 }}`).
- Hacer cada tarjeta de amigo completamente clickeable para abrir un nuevo modal: `FriendDetailModal`.
- Diseñar `FriendDetailModal` con coherencia visual al 100% con la estética de Afinapp (soporte de modo claro, oscuro y `zenMode`, bordes `rounded-3xl`, sin emojis).
- Soportar la captura y persistencia de nombre, foto, nivel, tesitura y estadísticas reales al agregar amigos por enlace o código.

---

## 2. Arquitectura de Componentes

```
src/components/
├── FriendsSection.tsx                    (Orquestador de la sección en ProgresoView)
├── friends/
│   ├── friendsTypes.ts                   (Modelo ampliado FriendItem)
│   ├── FriendCardItem.tsx                (Tarjeta táctil móvil optimizada en 2 filas)
│   ├── FriendDetailModal.tsx             (NUEVO: Modal de perfil vocal y cara a cara)
│   ├── FriendsRankingList.tsx            (Lista clasificada por XP semanal)
│   ├── MyFriendCodeCard.tsx              (Tarjeta de código personal)
│   └── AddFriendForm.tsx                 (Buscador / confirmación de amigos)
```

---

## 3. Especificación de Componentes

### 3.1 Modelo de Datos Ampliado (`friendsTypes.ts`)

```typescript
export interface FriendItem {
  id: string;
  code: string;               // Ej: "CLAVE-7598"
  name: string;               // Nombre real o apodo
  avatar: string;             // URL de imagen o avatar vocal
  level: number;              // Nivel numérico (1-20)
  levelTitle: string;         // Ej: "Soprano Aficionada"
  streak: number;             // Días seguidos cantando
  xpThisWeek: number;         // XP acumulado en la semana
  vocalRange: string;         // Ej: "Mezzosoprano (La2 - La5)"
  statusText: string;         // Estado de actividad reciente
  isOnline: boolean;          // Indicador de presencia en vivo
  duelsWonAgainst?: number;   // Duelos ganados por ti contra este amigo
  duelsLostAgainst?: number;  // Duelos ganados por este amigo contra ti
  lastDuelNote?: string;      // Última nota disputada (ej: "Sol4")
  lastDuelScore?: number;     // Puntaje obtenido en el último duelo
  lastNudgeSent?: boolean;    // Estado de ánimo enviado hoy
  joinedDate?: string;        // Fecha de amistad
}
```

---

### 3.2 Tarjeta Exterior Móvil (`FriendCardItem.tsx`)

#### Layout en 2 Filas
1. **Fila Superior (Identidad + Puntuación Semanal)**:
   - Izquierda (`min-w-0 flex items-center gap-2.5`):
     - Puesto en el ranking (`#1`, `#2` con énfasis tipográfico).
     - Avatar circular (40x40px) con anillo y punto indicador online/offline.
     - Bloque textual con nombre (`font-heading font-extrabold text-xs truncate max-w-[120px] sm:max-w-[160px]`) y etiqueta con código (`text-[9px] font-bold px-1.5 py-0.5 rounded-full`).
     - Debajo del nombre: nivel del cantante (`Nivel X`) y llama con días de racha.
   - Derecha (`shrink-0 text-right`):
     - XP semanal destacado (`1,450 XP`) en negrita.
     - Subtítulo sutil de tesitura (`text-[9px] text-slate-400 truncate max-w-[90px] sm:max-w-[120px]`).

2. **Fila Inferior (Estado + Acciones Táctiles)**:
   - Izquierda: Estado reciente en cursiva (`text-[10px] text-slate-400 truncate max-w-[130px] sm:max-w-[180px]`).
   - Derecha (`flex items-center gap-1.5 shrink-0`):
     - Botón **"Desafiar"**: Botón ámbar con icono `Swords`, tamaño táctil compacto, sin hover, con `whileTap={{ scale: 0.94 }}` y `e.stopPropagation()` para abrir directamente el Duelo Rápido.
     - Botón **"Animar"**: Botón índigo con icono `Zap`, sin hover, con `whileTap={{ scale: 0.94 }}` y `e.stopPropagation()` para enviar ánimo háptico/auditivo.

3. **Interacción de la Tarjeta**:
   - Todo el contenedor responde al toque con `whileTap={{ scale: 0.98 }}` abriendo `FriendDetailModal`.
   - Se eliminan por completo las clases `hover:scale-*`, `hover:border-*` y `whileHover`.

---

### 3.3 Nuevo Modal de Detalle de Amigo (`FriendDetailModal.tsx`)

Se renderiza como overlay con backdrop blur y modal centrado `rounded-3xl`:

1. **Barra de Navegación Superior**:
   - Botón volver/cerrar con `ArrowLeft` o `X`.
   - Título de sección: "Perfil de Cantante".

2. **Ficha de Identidad**:
   - Avatar grande (68x68px) centrado o destacado con borde temático.
   - Nombre completo en `text-lg font-heading font-black`.
   - Píldora de código con botón táctil para copiar al portapapeles.
   - Insignia de Nivel y Título Honorífico (ej: *Nivel 6 • Mezzosoprano Vocal*).

3. **Parrilla de Estadísticas Vocales (Grid de 3 Tarjetas)**:
   - **Racha**: Llama con días consecutivos.
   - **Tesitura**: Rango vocal completo con notas límite (ej: *La2 a La5*).
   - **XP Semanal**: Total de puntos sumados en la semana actual.

4. **Sección Cara a Cara (Head-to-Head)**:
   - Tarjeta comparativa de duelos:  
     `Victorias Tuyas: X` vs `Victorias de [Nombre]: Y`
   - Resumen del último duelo disputado: nota cantada y puntajes de ambos.

5. **Acciones Principales**:
   - Botón grande **"Desafiar a Duelo en Vivo"** (abre `DueloRapidoModal` contra este amigo).
   - Botón secundario **"Animar"** (con feedback sonoro `playXpGainSound()` y vibración háptica).
   - Enlace discreto en el pie: *"Eliminar de amigos"*.

---

### 3.4 Captura de Datos al Agregar Amigos

1. **Parámetros por Enlace (`?amigo=CODIGO&nombre=NOMBRE&avatar=URL`)**:
   - Al compartir el enlace por WhatsApp, la URL incluye el nombre y avatar reales configurados en el perfil del usuario.
   - Al recibir el enlace, la app detecta la invitación y carga la ficha con foto y nombre sin requerir servidor central.
2. **Catálogo de Avatares Vocales**:
   - Se incluye un conjunto de 8 avatares vocales predeterminados de alta resolución para garantizar que cualquier amigo nuevo tenga foto nítida e identidad atractiva.

---

## 4. Estrategia de Verificación

1. **Compilación de Tipos**: Ejecutar `npx tsc --noEmit` y confirmar 0 errores de TypeScript.
2. **Límite de Líneas**: Verificar que ningún archivo supere las 500 líneas de código.
3. **Prueba Automatizada en Navegador Móvil (Puppeteer con Viewport de 390x844)**:
   - Comprobar que en la tarjeta exterior no haya colisiones de texto.
   - Comprobar que los botones dicen **"Desafiar"** y **"Animar"**.
   - Comprobar que al tocar la tarjeta se abre `FriendDetailModal` con todos los datos.
   - Comprobar que al pulsar "Desafiar" se lanza directamente el modal de Duelo Rápido.
   - Tomar capturas de pantalla de la tarjeta corregida y del modal de detalle abierto.
