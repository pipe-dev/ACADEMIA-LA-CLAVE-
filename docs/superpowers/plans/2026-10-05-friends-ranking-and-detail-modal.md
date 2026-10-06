# Plan de Implementación: Tabla de Amigos Móvil y Modal de Detalle de Cantante (Fase 1 Front-End)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la sección de Amigos y Retos en Afinapp para resolver colisiones en pantallas móviles, eliminar efectos `:hover`, renombrar botones a "Desafiar" y "Animar", crear el nuevo `FriendDetailModal` interactivo con estadísticas vocales y cara a cara, y añadir soporte de avatares con ImgBB.

**Architecture:** Se actualiza el modelo `FriendItem` para registrar datos vocales y cara a cara. Se refactoriza `FriendCardItem.tsx` en una cuadrícula móvil limpia de 2 filas con feedback táctil (`whileTap`). Se crea `FriendDetailModal.tsx` con soporte para tema claro, oscuro y zenMode. Se integra la apertura del modal en `FriendsSection.tsx` y `FriendsRankingList.tsx`, y se crea la utilidad de imágenes `imgbbHelper.ts`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion (`motion/react`), Canvas Confetti, Web Audio API (`audioService`).

## Global Constraints

- Límite estricto de menos de 500 líneas de código por archivo.
- Cero emojis en código fuente, comentarios, strings, logs y documentación.
- Botones de acción exterior nombrados exclusivamente como "Desafiar" y "Animar".
- Prohibido el uso de selectores `:hover` o `whileHover` en las tarjetas táctiles móviles; usar `whileTap={{ scale: 0.94 }}` y `active:scale-95`.
- Coherencia visual estricta con el sistema de diseño de Afinapp: bordes `rounded-3xl`, soporte para `zenMode`, y paletas indigo, amber y slate.

---

### Task 1: Ampliar Modelo de Datos y Datos Iniciales en `friendsTypes.ts`

**Files:**
- Modify: `src/components/friends/friendsTypes.ts:1-90`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: Tipos base de TypeScript.
- Produces: `FriendItem` ampliado con campos cara a cara (`duelsWonAgainst`, `duelsLostAgainst`, `lastDuelNote`, `lastDuelScore`, `joinedDate`), catálogo `DEFAULT_VOCAL_AVATARS` y datos de prueba enriquecidos.

- [ ] **Step 1: Escribir el nuevo contrato y datos de prueba en `friendsTypes.ts`**

Actualizar `src/components/friends/friendsTypes.ts` para agregar los nuevos campos de duelos cara a cara, notas y avatares por defecto.

```typescript
export interface FriendItem {
  id: string;
  code: string;
  name: string;
  avatar: string;
  level: number;
  levelTitle: string;
  streak: number;
  xpThisWeek: number;
  vocalRange: string;
  statusText: string;
  isOnline: boolean;
  duelsWonAgainst?: number;
  duelsLostAgainst?: number;
  lastDuelNote?: string;
  lastDuelScore?: number;
  lastNudgeSent?: boolean;
  joinedDate?: string;
}

export const DEFAULT_VOCAL_AVATARS: { id: string; name: string; url: string }[] = [
  { id: 'soprano', name: 'Soprano', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'tenor', name: 'Tenor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'mezzosoprano', name: 'Mezzosoprano', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: 'baritono', name: 'Barítono', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'contralto', name: 'Contralto', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: 'bajo', name: 'Bajo', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { id: 'armonia', name: 'Armonía', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'acustico', name: 'Acústico', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' }
];

export const INITIAL_DEMO_FRIENDS: FriendItem[] = [
  {
    id: 'f1',
    code: 'VOCAL-9821',
    name: 'Camila Ríos',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    level: 5,
    levelTitle: 'Soprano Aficionada',
    streak: 8,
    xpThisWeek: 1240,
    vocalRange: 'Soprano (Do4 - Do6)',
    statusText: 'Afino 12 notas hoy',
    isOnline: true,
    duelsWonAgainst: 3,
    duelsLostAgainst: 1,
    lastDuelNote: 'Sol4',
    lastDuelScore: 94,
    joinedDate: 'Marzo 2026'
  },
  {
    id: 'f2',
    code: 'CANTO-4102',
    name: 'Mateo Fernández',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    level: 4,
    levelTitle: 'Tenor Lírico',
    streak: 5,
    xpThisWeek: 980,
    vocalRange: 'Tenor (La2 - Sol4)',
    statusText: 'Practicando apoyo diafragmático',
    isOnline: false,
    duelsWonAgainst: 2,
    duelsLostAgainst: 2,
    lastDuelNote: 'Mi3',
    lastDuelScore: 88,
    joinedDate: 'Febrero 2026'
  },
  {
    id: 'f3',
    code: 'SOLFEO-8830',
    name: 'Sofía Mendoza',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    level: 6,
    levelTitle: 'Mezzosoprano Vocal',
    streak: 12,
    xpThisWeek: 1450,
    vocalRange: 'Mezzosoprano (La2 - La5)',
    statusText: 'En racha de 12 días seguidos',
    isOnline: true,
    duelsWonAgainst: 4,
    duelsLostAgainst: 3,
    lastDuelNote: 'La4',
    lastDuelScore: 98,
    joinedDate: 'Enero 2026'
  }
];

export const DEMO_FRIEND_DIRECTORY: Record<string, Omit<FriendItem, 'id'>> = {
  'VOCAL-2026': {
    code: 'VOCAL-2026',
    name: 'Lucas Barítono',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    level: 3,
    levelTitle: 'Barítono Resonante',
    streak: 4,
    xpThisWeek: 720,
    vocalRange: 'Barítono (Mi2 - Mi4)',
    statusText: 'Listo para dueto de afinación',
    isOnline: true,
    duelsWonAgainst: 1,
    duelsLostAgainst: 0,
    lastDuelNote: 'Do3',
    lastDuelScore: 91,
    joinedDate: 'Abril 2026'
  },
  'CANTO-9941': {
    code: 'CANTO-9941',
    name: 'Elena Canto',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
    level: 7,
    levelTitle: 'Maestra de Solfeo',
    streak: 15,
    xpThisWeek: 1890,
    vocalRange: 'Contralto (Fa3 - Fa5)',
    statusText: 'Superó la lección de escalas',
    isOnline: false,
    duelsWonAgainst: 5,
    duelsLostAgainst: 4,
    lastDuelNote: 'Fa4',
    lastDuelScore: 96,
    joinedDate: 'Diciembre 2025'
  }
};

export interface FriendsSectionProps {
  userXp: number;
  userLevel: number;
  zenMode?: boolean;
}
```

- [ ] **Step 2: Verificar compilación TypeScript**

Ejecutar:
```powershell
npx tsc --noEmit
```
Resultado esperado: Sin errores en `friendsTypes.ts`.

- [ ] **Step 3: Commit del modelo de datos**

```powershell
git add src/components/friends/friendsTypes.ts
git commit -m "feat(friends): expand FriendItem model with head-to-head metrics and avatars"
```

---

### Task 2: Crear Utilidad ImgBB y Manejo de Fotos (`src/utils/imgbbHelper.ts`)

**Files:**
- Create: `src/utils/imgbbHelper.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: Free ImgBB API v1.
- Produces: `uploadAvatarToImgBB(file: File): Promise<string>` y selector de avatares predeterminados.

- [ ] **Step 1: Crear `src/utils/imgbbHelper.ts`**

Crear el helper que gestiona la subida de fotos a ImgBB con compresión en canvas para optimizar ancho de banda y garantizar 0 costo.

```typescript
// Helper para carga de avatares a ImgBB y fallback a avatares vocales locales

const DEFAULT_IMGBB_KEY = '5a440e210ca385a42095f47053e18a93'; // Clave pública de demostración para pruebas

export async function uploadAvatarToImgBB(file: File, apiKey: string = DEFAULT_IMGBB_KEY): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Error al subir imagen a ImgBB: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data?.url) {
    return result.data.url;
  }

  throw new Error('No se recibió la URL pública de la imagen');
}

export function getVocalAvatarUrl(genderOrType: string): string {
  const map: Record<string, string> = {
    soprano: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    tenor: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    mezzosoprano: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    baritono: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    contralto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80'
  };
  return map[genderOrType.toLowerCase()] || map.soprano;
}
```

- [ ] **Step 2: Verificar compilación**

Ejecutar:
```powershell
npx tsc --noEmit
```
Resultado esperado: 0 errores.

- [ ] **Step 3: Commit de la utilidad ImgBB**

```powershell
git add src/utils/imgbbHelper.ts
git commit -m "feat(friends): add ImgBB avatar upload helper and fallback resolver"
```

---

### Task 3: Crear el Modal de Detalle de Cantante (`FriendDetailModal.tsx`)

**Files:**
- Create: `src/components/friends/FriendDetailModal.tsx`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `FriendItem`, `audioService`, Lucide icons (`X`, `Swords`, `Zap`, `Flame`, `Trophy`, `Mic2`, `Calendar`).
- Produces: `FriendDetailModal: React.FC<FriendDetailModalProps>` con overlay centrado, datos vocales, sección cara a cara y botones de acción rápida (sin código copiable).

- [ ] **Step 1: Crear `src/components/friends/FriendDetailModal.tsx` (< 250 líneas)**

Componente modal interactivo, táctil, sin `:hover`, sin código copiable, con soporte completo de modo claro/oscuro y `zenMode`.

```typescript
'use client';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Swords, 
  Zap, 
  Flame, 
  Trophy, 
  Mic2, 
  Calendar
} from 'lucide-react';
import { FriendItem } from './friendsTypes';
import { audioService } from '../../utils/audioService';

interface FriendDetailModalProps {
  isOpen: boolean;
  friend: FriendItem | null;
  zenMode?: boolean;
  onClose: () => void;
  onOpenDuel: (friend: FriendItem) => void;
  onSendNudge: (friend: FriendItem) => void;
  hasNudgeSent?: boolean;
}

export const FriendDetailModal: React.FC<FriendDetailModalProps> = ({
  isOpen,
  friend,
  zenMode = false,
  onClose,
  onOpenDuel,
  onSendNudge,
  hasNudgeSent = false
}) => {
  if (!isOpen || !friend) return null;

  const duelsWon = friend.duelsWonAgainst ?? 0;
  const duelsLost = friend.duelsLostAgainst ?? 0;
  const totalDuels = duelsWon + duelsLost;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl relative border overflow-hidden ${
            zenMode
              ? 'bg-[#1b1c1e] border-[#2e3138] text-[#f0ebe1]'
              : 'bg-white dark:bg-[#0e1726] border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          {/* Header con botón de cerrar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Perfil de Cantante
            </span>
            <button
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 active:scale-90 transition-transform"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ficha de Identidad Principal */}
          <div className="pt-4 text-center">
            <div className="relative inline-block mx-auto mb-2.5">
              <img
                src={friend.avatar}
                alt={friend.name}
                className={`w-20 h-20 rounded-full object-cover border-4 shadow-md ${
                  zenMode ? 'border-[#383c44] grayscale' : 'border-indigo-100 dark:border-indigo-900/60'
                }`}
              />
              <span
                className={`w-4 h-4 rounded-full border-2 absolute bottom-0 right-1 ${
                  friend.isOnline
                    ? zenMode ? 'bg-[#e5b83b] border-[#1b1c1e]' : 'bg-emerald-500 border-white dark:border-[#0e1726]'
                    : 'bg-slate-400 border-white dark:border-[#0e1726]'
                }`}
              />
            </div>

            <h3 className="font-heading font-black text-lg">
              {friend.name}
            </h3>

            <p className={`text-xs font-medium mt-1 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'}`}>
              Nivel {friend.level} • {friend.levelTitle}
            </p>
          </div>

          {/* Cuadrícula de 3 Métricas Vocales */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className={`p-2.5 rounded-2xl text-center border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <Flame className={`w-4 h-4 mx-auto mb-1 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
              <span className="block font-black text-xs">{friend.streak} días</span>
              <span className="text-[9px] text-slate-400">Racha</span>
            </div>

            <div className={`p-2.5 rounded-2xl text-center border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <Mic2 className={`w-4 h-4 mx-auto mb-1 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
              <span className="block font-black text-[11px] truncate">{friend.vocalRange.split(' ')[0]}</span>
              <span className="text-[9px] text-slate-400">Tesitura</span>
            </div>

            <div className={`p-2.5 rounded-2xl text-center border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <Trophy className={`w-4 h-4 mx-auto mb-1 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
              <span className="block font-black text-xs">{friend.xpThisWeek}</span>
              <span className="text-[9px] text-slate-400">XP Semanal</span>
            </div>
          </div>

          {/* Sección Cara a Cara (Head-to-Head) */}
          <div className={`mt-3.5 p-3 rounded-2xl border ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Historial Cara a Cara</span>
              <span className={zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'}>
                {totalDuels} {totalDuels === 1 ? 'Duelo' : 'Duelos'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span>Victorias Tuyas</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{duelsWon}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/40 dark:border-slate-800">
              <span>Victorias de {friend.name.split(' ')[0]}</span>
              <span className="font-black text-amber-600 dark:text-amber-400">{duelsLost}</span>
            </div>

            {friend.lastDuelNote && (
              <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Último reto afinando: <strong className="text-slate-600 dark:text-slate-300">{friend.lastDuelNote}</strong></span>
                <span>Puntos: {friend.lastDuelScore}%</span>
              </div>
            )}
          </div>

          {/* Botones de Acción Táctiles */}
          <div className="mt-4 space-y-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onClose();
                onOpenDuel(friend);
              }}
              className={`w-full py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm ${
                zenMode
                  ? 'bg-[#e5b83b] text-[#161719]'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Desafiar a Duelo en Vivo</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onSendNudge(friend)}
              disabled={hasNudgeSent}
              className={`w-full py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border ${
                hasNudgeSent
                  ? zenMode
                    ? 'bg-[#22252a] text-[#e5b83b] border-[#e5b83b]/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : zenMode
                    ? 'bg-[#26292f] text-[#ded9cf] border-[#383c44]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{hasNudgeSent ? '¡Ánimo Enviado Hoy!' : 'Enviar Ánimo Vocal'}</span>
            </motion.button>
          </div>

          {/* Fecha de amistad */}
          {friend.joinedDate && (
            <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Amigos desde {friend.joinedDate}</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Verificar compilación**

Ejecutar:
```powershell
npx tsc --noEmit
```
Resultado esperado: 0 errores.

- [ ] **Step 3: Commit de `FriendDetailModal.tsx`**

```powershell
git add src/components/friends/FriendDetailModal.tsx
git commit -m "feat(friends): create FriendDetailModal component with vocal metrics and head-to-head stats"
```

---

### Task 4: Rediseñar `FriendCardItem.tsx` (Sin Hover, Cuadrícula Móvil de 2 Filas, "Desafiar" y "Animar")

**Files:**
- Modify: `src/components/friends/FriendCardItem.tsx:1-155`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `FriendItem`, `onSelectFriend: (friend: FriendItem) => void`.
- Produces: `FriendCardItem` táctil donde el clic en la tarjeta dispara `onSelectFriend(friend)` y los botones táctiles "Desafiar" y "Animar" detienen la propagación del evento (`e.stopPropagation()`).

- [ ] **Step 1: Implementar el nuevo layout en `src/components/friends/FriendCardItem.tsx`**

Reemplazar el contenido de `FriendCardItem.tsx` organizando los datos en 2 filas limpias, eliminando todo selector `:hover` y `whileHover`, configurando `whileTap={{ scale: 0.98 }}` en la tarjeta, y botones "Desafiar" y "Animar".

```typescript
'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Flame, CheckCircle2, Swords, Zap } from 'lucide-react';
import { FriendItem } from './friendsTypes';

interface FriendCardItemProps {
  friend: FriendItem;
  rank: number;
  hasNudge: boolean;
  zenMode?: boolean;
  onSelectFriend: (friend: FriendItem) => void;
  onOpenDuel: (friend: FriendItem) => void;
  onSendNudge: (friend: FriendItem) => void;
}

export const FriendCardItem: React.FC<FriendCardItemProps> = ({
  friend,
  rank,
  hasNudge,
  zenMode = false,
  onSelectFriend,
  onOpenDuel,
  onSendNudge
}) => {
  return (
    <motion.div
      onClick={() => onSelectFriend(friend)}
      whileTap={{ scale: 0.98 }}
      className={`p-3.5 rounded-2xl border transition-colors space-y-2.5 shadow-2xs cursor-pointer select-none ${
        zenMode
          ? 'bg-[#22252a] border-[#2e3138] active:border-[#e5b83b]/60'
          : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200/70 dark:border-slate-800/80 active:border-indigo-400'
      }`}
    >
      {/* Fila 1: Puesto, Avatar, Nombre + Nivel + Racha (Izquierda) | XP Semanal + Tesitura (Derecha) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Puesto */}
          <span className={`w-4 text-center font-heading font-black text-xs shrink-0 ${
            rank === 1
              ? (zenMode ? 'text-[#e5b83b]' : 'text-amber-500')
              : 'text-slate-400'
          }`}>
            #{rank}
          </span>

          {/* Avatar circular */}
          <div className="relative shrink-0">
            <img
              src={friend.avatar}
              alt={friend.name}
              className={`w-9 h-9 rounded-full object-cover border-2 ${
                zenMode ? 'border-[#383c44] grayscale' : 'border-white dark:border-slate-700'
              }`}
            />
            {friend.isOnline && (
              <span className={`w-2.5 h-2.5 rounded-full border-2 absolute bottom-0 right-0 ${
                zenMode ? 'bg-[#e5b83b] border-[#22252a]' : 'bg-emerald-500 border-white dark:border-slate-900'
              }`} />
            )}
          </div>

          {/* Bloque Nombre y Código */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h5 className={`font-heading font-bold text-xs truncate max-w-[110px] sm:max-w-[160px] ${
                zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
              }`}>
                {friend.name}
              </h5>
              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                zenMode ? 'bg-[#2e3138] text-[#ded9cf]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {friend.code}
              </span>
            </div>

            {/* Nivel y Racha */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium mt-0.5">
              <span>Nivel {friend.level}</span>
              <span>•</span>
              <span className={`flex items-center gap-0.5 font-bold ${
                zenMode ? 'text-[#e5b83b]' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <Flame className={`w-2.5 h-2.5 ${zenMode ? 'fill-[#e5b83b] text-[#e5b83b]' : 'fill-amber-500 text-amber-500'}`} />
                {friend.streak} d
              </span>
            </div>
          </div>
        </div>

        {/* Puntuación Semanal y Tesitura a la derecha */}
        <div className="text-right shrink-0">
          <span className={`font-heading font-black text-xs block ${
            zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'
          }`}>
            {friend.xpThisWeek.toLocaleString()} XP
          </span>
          <span className="text-[9px] text-slate-400 font-medium block truncate max-w-[100px]">
            {friend.vocalRange}
          </span>
        </div>
      </div>

      {/* Fila 2: Frase de estado a la izquierda | Botones táctiles "Desafiar" y "Animar" a la derecha */}
      <div className={`flex items-center justify-between pt-1.5 border-t text-[11px] ${
        zenMode ? 'border-[#2e3138]' : 'border-slate-200/60 dark:border-slate-800/60'
      }`}>
        <span className="text-[10px] text-slate-400 font-normal truncate italic max-w-[130px] sm:max-w-[180px]">
          {friend.statusText}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón Desafiar */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDuel(friend);
            }}
            whileTap={{ scale: 0.94 }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-2xs ${
              zenMode
                ? 'bg-[#e5b83b] text-[#161719]'
                : 'bg-amber-500 text-white active:bg-amber-600'
            }`}
          >
            <Swords className="w-3 h-3" />
            <span>Desafiar</span>
          </motion.button>

          {/* Botón Animar */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendNudge(friend);
            }}
            disabled={hasNudge}
            whileTap={!hasNudge ? { scale: 0.94 } : undefined}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${
              hasNudge
                ? (zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300')
                : (zenMode
                    ? 'bg-[#2e3138] text-[#ded9cf] active:bg-[#383c44]'
                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 active:bg-indigo-100')
            }`}
          >
            {hasNudge ? (
              <>
                <CheckCircle2 className={`w-3 h-3 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                <span>Animado</span>
              </>
            ) : (
              <>
                <Zap className={`w-3 h-3 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
                <span>Animar</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
```

- [ ] **Step 2: Actualizar `FriendsRankingList.tsx` para pasar `onSelectFriend`**

Modificar `src/components/friends/FriendsRankingList.tsx` agregando la prop `onSelectFriend: (friend: FriendItem) => void` y pasándola a cada `FriendCardItem`.

- [ ] **Step 3: Verificar compilación**

Ejecutar:
```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit de `FriendCardItem.tsx` y `FriendsRankingList.tsx`**

```powershell
git add src/components/friends/FriendCardItem.tsx src/components/friends/FriendsRankingList.tsx
git commit -m "feat(friends): redesign FriendCardItem with 2-row mobile layout and touch-only interactions"
```

---

### Task 5: Integrar `FriendDetailModal` en `FriendsSection.tsx`

**Files:**
- Modify: `src/components/FriendsSection.tsx:1-244`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `FriendDetailModal`, `selectedFriendForDetail`, `setSelectedFriendForDetail`.
- Produces: Experiencia completa donde tocar una tarjeta abre el modal de detalle, y las acciones de desafiar y animar se propagan sin errores.

- [ ] **Step 1: Modificar `src/components/FriendsSection.tsx`**

1. Importar `FriendDetailModal`.
2. Crear estado `selectedFriendForDetail: FriendItem | null`.
3. Conectar el handler `handleSelectFriend: (friend: FriendItem) => void` que reproduce sonido suave y abre el modal.
4. Renderizar `<FriendDetailModal />` debajo de `<DueloRapidoModal />`.

- [ ] **Step 2: Verificar compilación TypeScript**

Ejecutar:
```powershell
npx tsc --noEmit
```
Resultado esperado: 0 errores.

- [ ] **Step 3: Commit de la integración de `FriendsSection.tsx`**

```powershell
git add src/components/FriendsSection.tsx
git commit -m "feat(friends): wire FriendDetailModal into FriendsSection"
```

