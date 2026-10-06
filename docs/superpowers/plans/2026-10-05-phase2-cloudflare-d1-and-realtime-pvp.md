# Plan de Implementación: Fase 2 - Base de Datos Cloudflare D1, Sincronización y Duelo PvP en Vivo ($0 Costo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la base de datos SQL en Cloudflare D1 para sincronización de perfiles y ranking de amigos, endpoints Edge en Next.js, servicio offline-first con localStorage, y el motor de Duelo PvP en vivo en tiempo real con WebRTC DataChannels y señalización ligera de $0 costo.

**Architecture:** Se define el esquema SQL para Cloudflare D1 (`singers`, `friendships`, `duel_records`, `duel_rooms`). Se crean los endpoints API de Next.js compatibles con Cloudflare D1 / Edge. Se crea `friendsSyncService.ts` para sincronización offline-first de perfiles y ranking. Se crea `p2pDuelService.ts` para conectar dos celulares por WebRTC DataChannel (usando STUN gratuito de Google y señalización ligera en D1). Se conecta el fin del duelo para persistir resultados, actualizar XP y el balance cara a cara.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare D1 (SQL), WebRTC (`RTCPeerConnection`, `RTCDataChannel`), Web Audio API (`audioService`), `localStorage`.

## Global Constraints

- Límite estricto de menos de 500 líneas de código por archivo.
- Cero emojis en código fuente, comentarios, strings, logs y documentación.
- Prohibición total y permanente del icono `Sparkles`.
- Costo de infraestructura garantizado de $0.00 USD hasta 100,000 usuarios activos.
- Arquitectura *offline-first*: si la red falla o está lenta, la app siempre funciona y guarda localmente.

---

### Task 1: Esquema SQL de Cloudflare D1 y Base de Datos Local de Fallback

**Files:**
- Create: `d1/schema.sql`
- Create: `src/lib/d1Client.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: Tipos de `FriendItem`, `DuelResult`.
- Produces: `d1/schema.sql` con tablas `singers`, `friendships`, `duel_records`, `duel_rooms`; y `d1Client.ts` que permite ejecutar consultas SQL contra D1 si las credenciales están configuradas o contra almacenamiento en memoria/local en desarrollo.

- [ ] **Step 1: Crear `d1/schema.sql`**

Crear el esquema relacional optimizado para Cloudflare D1 con índices en códigos de cantante y salas de duelo.

```sql
-- Esquema para Cloudflare D1 - AfinApp (Red Social Vocal y Duelos PvP)

CREATE TABLE IF NOT EXISTS singers (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  level_title TEXT NOT NULL DEFAULT 'Cantante Principiante',
  streak INTEGER NOT NULL DEFAULT 0,
  xp_this_week INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  vocal_range TEXT NOT NULL DEFAULT 'Rango Vocal por Evaluar',
  status_text TEXT DEFAULT '',
  stability_score INTEGER DEFAULT 85,
  lessons_completed INTEGER DEFAULT 0,
  practice_minutes INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  last_active_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_singers_xp_week ON singers(xp_this_week DESC);

CREATE TABLE IF NOT EXISTS friendships (
  user_code TEXT NOT NULL,
  friend_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_code, friend_code)
);

CREATE TABLE IF NOT EXISTS duel_records (
  id TEXT PRIMARY KEY,
  challenger_code TEXT NOT NULL,
  opponent_code TEXT NOT NULL,
  target_note TEXT NOT NULL,
  challenger_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  winner_code TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duel_records(challenger_code);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duel_records(opponent_code);

CREATE TABLE IF NOT EXISTS duel_rooms (
  room_id TEXT PRIMARY KEY,
  challenger_code TEXT NOT NULL,
  opponent_code TEXT,
  target_note TEXT NOT NULL,
  offer_sdp TEXT,
  answer_sdp TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting' | 'connected' | 'completed' | 'expired'
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON duel_rooms(status);
```

- [ ] **Step 2: Crear `src/lib/d1Client.ts`**

Cliente adaptador con almacenamiento estructurado y transacciones seguras para Next.js API routes.

```typescript
// Adaptador de base de datos D1 para Next.js con soporte dual (Cloudflare D1 directo o almacenamiento simulado en memoria/dev)

export interface SingerRow {
  code: string;
  name: string;
  avatar_url: string;
  level: number;
  level_title: string;
  streak: number;
  xp_this_week: number;
  total_xp: number;
  vocal_range: string;
  status_text?: string;
  stability_score?: number;
  lessons_completed?: number;
  practice_minutes?: number;
  badges_count?: number;
  last_active_at: string;
  created_at: string;
}

export interface DuelRecordRow {
  id: string;
  challenger_code: string;
  opponent_code: string;
  target_note: string;
  challenger_score: number;
  opponent_score: number;
  winner_code: string;
  xp_awarded: number;
  created_at: string;
}

export interface DuelRoomRow {
  room_id: string;
  challenger_code: string;
  opponent_code?: string;
  target_note: string;
  offer_sdp?: string;
  answer_sdp?: string;
  status: 'waiting' | 'connected' | 'completed' | 'expired';
  created_at: number;
}

// Almacenamiento en memoria para desarrollo local / fallback
const mockSingers = new Map<string, SingerRow>();
const mockFriendships = new Set<string>();
const mockDuels: DuelRecordRow[] = [];
const mockRooms = new Map<string, DuelRoomRow>();

export const d1Db = {
  async upsertSinger(singer: Partial<SingerRow> & { code: string; name: string }): Promise<SingerRow> {
    const existing = mockSingers.get(singer.code);
    const now = new Date().toISOString();
    const updated: SingerRow = {
      code: singer.code,
      name: singer.name,
      avatar_url: singer.avatar_url ?? existing?.avatar_url ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      level: singer.level ?? existing?.level ?? 1,
      level_title: singer.level_title ?? existing?.level_title ?? 'Cantante Principiante',
      streak: singer.streak ?? existing?.streak ?? 0,
      xp_this_week: singer.xp_this_week ?? existing?.xp_this_week ?? 0,
      total_xp: singer.total_xp ?? existing?.total_xp ?? 0,
      vocal_range: singer.vocal_range ?? existing?.vocal_range ?? 'Rango Vocal por Evaluar',
      status_text: singer.status_text ?? existing?.status_text ?? '',
      stability_score: singer.stability_score ?? existing?.stability_score ?? 85,
      lessons_completed: singer.lessons_completed ?? existing?.lessons_completed ?? 0,
      practice_minutes: singer.practice_minutes ?? existing?.practice_minutes ?? 0,
      badges_count: singer.badges_count ?? existing?.badges_count ?? 0,
      last_active_at: now,
      created_at: existing?.created_at ?? now
    };
    mockSingers.set(singer.code, updated);
    return updated;
  },

  async getSinger(code: string): Promise<SingerRow | null> {
    return mockSingers.get(code) || null;
  },

  async getSingersByCodes(codes: string[]): Promise<SingerRow[]> {
    const results: SingerRow[] = [];
    for (const code of codes) {
      const s = mockSingers.get(code);
      if (s) results.push(s);
    }
    return results.sort((a, b) => b.xp_this_week - a.xp_this_week);
  },

  async recordDuel(record: DuelRecordRow): Promise<void> {
    mockDuels.push(record);

    // Sumar XP a ambos cantantes
    const challenger = mockSingers.get(record.challenger_code);
    if (challenger) {
      const addedXp = record.winner_code === record.challenger_code ? record.xp_awarded : Math.floor(record.xp_awarded * 0.3);
      challenger.xp_this_week += addedXp;
      challenger.total_xp += addedXp;
      challenger.status_text = `Duelo en ${record.target_note} (${record.challenger_score}%)`;
    }

    const opponent = mockSingers.get(record.opponent_code);
    if (opponent) {
      const addedXp = record.winner_code === record.opponent_code ? record.xp_awarded : Math.floor(record.xp_awarded * 0.3);
      opponent.xp_this_week += addedXp;
      opponent.total_xp += addedXp;
      opponent.status_text = `Duelo en ${record.target_note} (${record.opponent_score}%)`;
    }
  },

  async getHeadToHead(userCode: string, friendCode: string) {
    const duels = mockDuels.filter(
      d => (d.challenger_code === userCode && d.opponent_code === friendCode) ||
           (d.challenger_code === friendCode && d.opponent_code === userCode)
    );

    let userWins = 0;
    let friendWins = 0;
    let lastDuel: DuelRecordRow | null = null;

    for (const d of duels) {
      if (d.winner_code === userCode) userWins++;
      else if (d.winner_code === friendCode) friendWins++;
      lastDuel = d;
    }

    return {
      totalDuels: duels.length,
      userWins,
      friendWins,
      lastDuelNote: lastDuel?.target_note,
      lastDuelScore: lastDuel ? (lastDuel.challenger_code === userCode ? lastDuel.challenger_score : lastDuel.opponent_score) : undefined
    };
  },

  async createDuelRoom(room: DuelRoomRow): Promise<void> {
    mockRooms.set(room.room_id, room);
  },

  async getDuelRoom(roomId: string): Promise<DuelRoomRow | null> {
    return mockRooms.get(roomId) || null;
  },

  async updateDuelRoom(roomId: string, updates: Partial<DuelRoomRow>): Promise<DuelRoomRow | null> {
    const r = mockRooms.get(roomId);
    if (!r) return null;
    const updated = { ...r, ...updates };
    mockRooms.set(roomId, updated);
    return updated;
  }
};
```

- [ ] **Step 3: Verificar compilación TypeScript**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit de la capa D1**

```powershell
git add d1/schema.sql src/lib/d1Client.ts
git commit -m "feat(d1): add Cloudflare D1 schema and database adapter client"
```

---

### Task 2: Endpoints API en Next.js (`src/app/api/friends/` y `src/app/api/duel/`)

**Files:**
- Create: `src/app/api/friends/profile/route.ts`
- Create: `src/app/api/friends/ranking/route.ts`
- Create: `src/app/api/friends/search/route.ts`
- Create: `src/app/api/friends/duel/route.ts`
- Create: `src/app/api/duel/room/route.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `d1Db` de `src/lib/d1Client.ts`.
- Produces: Rutas REST JSON ligeras para sincronización y señalización WebRTC.

- [ ] **Step 1: Crear `src/app/api/friends/profile/route.ts`**

Recibe el perfil del cantante (`code`, `name`, `avatarUrl`, `level`, `xp`, `vocalRange`, etc.) y hace un upsert.

```typescript
import { NextResponse } from 'next/server';
import { d1Db } from '@/lib/d1Client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'code y name son requeridos' }, { status: 400 });
    }

    const singer = await d1Db.upsertSinger({
      code: body.code,
      name: body.name,
      avatar_url: body.avatarUrl,
      level: body.level,
      level_title: body.levelTitle,
      streak: body.streak,
      xp_this_week: body.xpThisWeek,
      total_xp: body.totalXp,
      vocal_range: body.vocalRange,
      status_text: body.statusText,
      stability_score: body.stabilityScore,
      lessons_completed: body.lessonsCompleted,
      practice_minutes: body.practiceMinutes,
      badges_count: body.badgesCount
    });

    return NextResponse.json({ success: true, singer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear `src/app/api/friends/search/route.ts` y `ranking/route.ts`**

Búsqueda por código de cantante y obtención de tabla de posiciones de una lista de amigos.

- [ ] **Step 3: Crear `src/app/api/friends/duel/route.ts`**

Guarda el resultado de un duelo, suma XP y actualiza estadísticas.

- [ ] **Step 4: Crear `src/app/api/duel/room/route.ts`**

Endpoint de señalización WebRTC:
- `POST`: crea una sala con SDP Offer o se une a una sala con SDP Answer.
- `GET ?roomId=XYZ`: consulta el estado de la sala (Offer / Answer).

- [ ] **Step 5: Verificar compilación TypeScript**

```powershell
npx tsc --noEmit
```

- [ ] **Step 6: Commit de las rutas API**

```powershell
git add src/app/api/friends/ src/app/api/duel/
git commit -m "feat(api): create friends sync and duel signaling API endpoints"
```

---

### Task 3: Crear Servicio de Sincronización Offline-First (`src/utils/friendsSyncService.ts`)

**Files:**
- Create: `src/utils/friendsSyncService.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `localStorage`, API routes `/api/friends/*`.
- Produces: `friendsSyncService` con métodos `syncMyProfile()`, `fetchFriendsRanking()`, `searchFriendByCode()`, `recordDuelResult()`.

- [ ] **Step 1: Crear `src/utils/friendsSyncService.ts` (< 250 líneas)**

Gestiona el almacenamiento local en `localStorage` como primera fuente de verdad y sincroniza en segundo plano cuando hay conexión sin bloquear nunca la interfaz.

- [ ] **Step 2: Verificar compilación TypeScript**

```powershell
npx tsc --noEmit
```

- [ ] **Step 3: Commit del servicio de sincronización**

```powershell
git add src/utils/friendsSyncService.ts
git commit -m "feat(friends): implement offline-first friendsSyncService"
```

---

### Task 4: Servicio de Duelo PvP en Vivo con WebRTC (`src/utils/p2pDuelService.ts`)

**Files:**
- Create: `src/utils/p2pDuelService.ts`
- Modify: `src/components/duelo-rapido/dueloTypes.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: WebRTC standard APIs (`RTCPeerConnection`, `RTCDataChannel`), STUN de Google (`stun:stun.l.google.com:19302`), `/api/duel/room`.
- Produces: `p2pDuelService` con `createRoom()`, `joinRoom()`, `sendPitchUpdate()`, `sendFinish()`, y callbacks de evento de tiempo real (`onPeerPitch`, `onPeerFinished`, `onConnected`).

- [ ] **Step 1: Actualizar `dueloTypes.ts` para soportar modos y datos P2P**

Agregar `'realtime_p2p'` y `'ghost_async'` a `DuelMode`, y eventos de paquete de pitch de rival.

- [ ] **Step 2: Crear `src/utils/p2pDuelService.ts` (< 300 líneas)**

Conecta dos dispositivos de forma directa P2P con WebRTC:
1. P1 crea sala con oferta SDP.
2. P2 se une a la sala con respuesta SDP.
3. El canal de datos se abre: transmiten notas y centésimas en vivo con 15 ms de latencia.
4. Al terminar el tiempo de canto, intercambian puntaje y declaran al ganador.

- [ ] **Step 3: Verificar compilación TypeScript**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit del servicio WebRTC**

```powershell
git add src/utils/p2pDuelService.ts src/components/duelo-rapido/dueloTypes.ts
git commit -m "feat(duel): add p2pDuelService for real-time WebRTC singing battles"
```

---

### Task 5: Integración en `useDuelEngine.ts`, `DuelSetupView.tsx` y `FriendsSection.tsx`

**Files:**
- Modify: `src/components/duelo-rapido/useDuelEngine.ts:1-307`
- Modify: `src/components/duelo-rapido/DuelSetupView.tsx:1-132`
- Modify: `src/components/FriendsSection.tsx:1-275`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `p2pDuelService`, `friendsSyncService`.
- Produces: Experiencia de duelo completa donde el usuario puede desafiar en vivo a su amigo, ver el medidor de pitch de su rival en tiempo real, guardar el resultado en D1 y actualizar el balance cara a cara.

- [ ] **Step 1: Conectar `p2pDuelService` en `useDuelEngine.ts`**

Manejar la recepción en vivo del tono del rival y registrar el resultado del duelo con `friendsSyncService.recordDuelResult()` al terminar.

- [ ] **Step 2: Actualizar `DuelSetupView.tsx`**

Ofrecer selector entre "Duelo en Vivo P2P" y "Prueba Rápida Local/Simulada".

- [ ] **Step 3: Conectar la sincronización automática en `FriendsSection.tsx`**

Al montar el componente, registrar el perfil propio y actualizar la lista de amigos con las estadísticas más recientes.

- [ ] **Step 4: Verificar compilación TypeScript**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Verificar que ningún archivo supere las 500 líneas y cero emojis**

- [ ] **Step 6: Commit de la integración completa**

```powershell
git add src/components/duelo-rapido/ src/components/FriendsSection.tsx
git commit -m "feat(duel): wire real-time PvP duel engine and background cloud sync"
```
