// Adaptador de base de datos D1 para Next.js con soporte dual (Cloudflare D1 o memoria/local)

export type DuelType = 'pitch_duel' | 'rhythm_duel' | 'sky_run_duel' | 'rhythm_sphere_duel';

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
  duel_type: DuelType;
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
  duel_type: DuelType;
  challenger_code: string;
  opponent_code?: string;
  target_note: string;
  offer_sdp?: string;
  answer_sdp?: string;
  status: 'waiting' | 'connected' | 'completed' | 'expired';
  created_at: number;
}

const D1_ACCOUNT_ID = process.env.CLOUDFLARE_D1_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN;

const isCloudflareConfigured = Boolean(
  D1_ACCOUNT_ID && D1_DATABASE_ID && D1_API_TOKEN
);

async function executeCloudflareQuery(sql: string, params: any[] = []): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${D1_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${D1_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare D1 query failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(`Cloudflare D1 reported errors: ${JSON.stringify(json.errors)}`);
  }
  return json.result?.[0]?.results || [];
}

// Almacenamiento en memoria para desarrollo local y modo offline
const mockSingers = new Map<string, SingerRow>();
const mockFriendships = new Set<string>();
const mockDuels: DuelRecordRow[] = [];
const mockRooms = new Map<string, DuelRoomRow>();

// Inicializar cantantes demo base en el mock para pruebas
const DEMO_PRELOAD: SingerRow[] = [
  {
    code: 'VOCAL-9821',
    name: 'Camila Rios',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    level: 5,
    level_title: 'Soprano Aficionada',
    streak: 8,
    xp_this_week: 1240,
    total_xp: 3840,
    vocal_range: 'Soprano (Do4 - Do6)',
    status_text: 'Afino 12 notas hoy',
    stability_score: 94,
    lessons_completed: 18,
    practice_minutes: 142,
    badges_count: 14,
    last_active_at: new Date().toISOString(),
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    code: 'CANTO-4102',
    name: 'Mateo Fernandez',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    level: 4,
    level_title: 'Tenor Lirico',
    streak: 5,
    xp_this_week: 980,
    total_xp: 2950,
    vocal_range: 'Tenor (La2 - Sol4)',
    status_text: 'Practicando apoyo diafragmatico',
    stability_score: 89,
    lessons_completed: 12,
    practice_minutes: 98,
    badges_count: 9,
    last_active_at: new Date().toISOString(),
    created_at: '2026-02-15T00:00:00.000Z'
  },
  {
    code: 'SOLFEO-8830',
    name: 'Sofia Mendoza',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    level: 6,
    level_title: 'Mezzosoprano Vocal',
    streak: 12,
    xp_this_week: 1450,
    total_xp: 4920,
    vocal_range: 'Mezzosoprano (La2 - La5)',
    status_text: 'En racha de 12 dias seguidos',
    stability_score: 97,
    lessons_completed: 26,
    practice_minutes: 215,
    badges_count: 19,
    last_active_at: new Date().toISOString(),
    created_at: '2026-01-10T00:00:00.000Z'
  }
];

DEMO_PRELOAD.forEach(s => mockSingers.set(s.code, s));

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

    if (isCloudflareConfigured) {
      try {
        await executeCloudflareQuery(
          `INSERT INTO singers (code, name, avatar_url, level, level_title, streak, xp_this_week, total_xp, vocal_range, status_text, stability_score, lessons_completed, practice_minutes, badges_count, last_active_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(code) DO UPDATE SET
             name=excluded.name, avatar_url=excluded.avatar_url, level=excluded.level, level_title=excluded.level_title,
             streak=excluded.streak, xp_this_week=excluded.xp_this_week, total_xp=excluded.total_xp,
             vocal_range=excluded.vocal_range, status_text=excluded.status_text, stability_score=excluded.stability_score,
             lessons_completed=excluded.lessons_completed, practice_minutes=excluded.practice_minutes,
             badges_count=excluded.badges_count, last_active_at=excluded.last_active_at`,
          [
            updated.code, updated.name, updated.avatar_url, updated.level, updated.level_title,
            updated.streak, updated.xp_this_week, updated.total_xp, updated.vocal_range,
            updated.status_text || '', updated.stability_score || 85, updated.lessons_completed || 0,
            updated.practice_minutes || 0, updated.badges_count || 0, updated.last_active_at, updated.created_at
          ]
        );
      } catch (e) {
        console.error('Cloudflare upsertSinger fallback to local:', e);
      }
    }

    return updated;
  },

  async getSinger(code: string): Promise<SingerRow | null> {
    if (isCloudflareConfigured) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM singers WHERE code = ? LIMIT 1',
          [code]
        );
        if (rows[0]) return rows[0];
      } catch (e) {
        console.error('Cloudflare getSinger fallback to local:', e);
      }
    }
    return mockSingers.get(code) || null;
  },

  async getSingersByCodes(codes: string[]): Promise<SingerRow[]> {
    if (isCloudflareConfigured && codes.length > 0) {
      try {
        const placeholders = codes.map(() => '?').join(',');
        const rows = await executeCloudflareQuery(
          `SELECT * FROM singers WHERE code IN (${placeholders}) ORDER BY xp_this_week DESC`,
          codes
        );
        if (rows && rows.length > 0) return rows;
      } catch (e) {
        console.error('Cloudflare getSingersByCodes fallback to local:', e);
      }
    }

    const results: SingerRow[] = [];
    for (const code of codes) {
      const s = mockSingers.get(code);
      if (s) results.push(s);
    }
    return results.sort((a, b) => b.xp_this_week - a.xp_this_week);
  },

  async addFriendship(userCode: string, friendCode: string): Promise<void> {
    mockFriendships.add(`${userCode}:${friendCode}`);
    mockFriendships.add(`${friendCode}:${userCode}`);

    if (isCloudflareConfigured) {
      try {
        const now = new Date().toISOString();
        await executeCloudflareQuery(
          `INSERT OR IGNORE INTO friendships (user_code, friend_code, created_at) VALUES (?, ?, ?)`,
          [userCode, friendCode, now]
        );
        await executeCloudflareQuery(
          `INSERT OR IGNORE INTO friendships (user_code, friend_code, created_at) VALUES (?, ?, ?)`,
          [friendCode, userCode, now]
        );
      } catch (e) {
        console.error('Cloudflare addFriendship fallback to local:', e);
      }
    }
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

    if (isCloudflareConfigured) {
      try {
        await executeCloudflareQuery(
          `INSERT INTO duel_records (id, duel_type, challenger_code, opponent_code, target_note, challenger_score, opponent_score, winner_code, xp_awarded, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id, record.duel_type, record.challenger_code, record.opponent_code,
            record.target_note, record.challenger_score, record.opponent_score,
            record.winner_code, record.xp_awarded, record.created_at
          ]
        );
      } catch (e) {
        console.error('Cloudflare recordDuel fallback to local:', e);
      }
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
    if (isCloudflareConfigured) {
      try {
        await executeCloudflareQuery(
          `INSERT INTO duel_rooms (room_id, duel_type, challenger_code, opponent_code, target_note, offer_sdp, answer_sdp, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            room.room_id, room.duel_type, room.challenger_code, room.opponent_code || null,
            room.target_note, room.offer_sdp || null, room.answer_sdp || null,
            room.status, room.created_at
          ]
        );
      } catch (e) {
        console.error('Cloudflare createDuelRoom fallback to local:', e);
      }
    }
  },

  async getDuelRoom(roomId: string): Promise<DuelRoomRow | null> {
    if (isCloudflareConfigured) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM duel_rooms WHERE room_id = ? LIMIT 1',
          [roomId]
        );
        if (rows[0]) return rows[0];
      } catch (e) {
        console.error('Cloudflare getDuelRoom fallback to local:', e);
      }
    }
    return mockRooms.get(roomId) || null;
  },

  async updateDuelRoom(roomId: string, updates: Partial<DuelRoomRow>): Promise<DuelRoomRow | null> {
    const r = mockRooms.get(roomId);
    if (!r) return null;
    const updated = { ...r, ...updates };
    mockRooms.set(roomId, updated);

    if (isCloudflareConfigured) {
      try {
        const fields = Object.keys(updates);
        if (fields.length > 0) {
          const setClause = fields.map(f => `${f} = ?`).join(', ');
          const values = fields.map(f => (updates as any)[f]);
          await executeCloudflareQuery(
            `UPDATE duel_rooms SET ${setClause} WHERE room_id = ?`,
            [...values, roomId]
          );
        }
      } catch (e) {
        console.error('Cloudflare updateDuelRoom fallback to local:', e);
      }
    }

    return updated;
  }
};
