// Adaptador de base de datos D1 para Next.js con soporte dual (Cloudflare D1 o almacenamiento local persistente)
import fs from 'fs';
import path from 'path';

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

interface D1StorageState {
  singers: SingerRow[];
  friendships: string[];
  duels: DuelRecordRow[];
  rooms: DuelRoomRow[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'afinapp_db.json');

import { executeD1Query, getNativeD1 } from './d1Binding';

const D1_ACCOUNT_ID = process.env.CLOUDFLARE_D1_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN;

const isCloudflareConfigured = () => Boolean(
  getNativeD1() || (D1_ACCOUNT_ID && D1_DATABASE_ID && D1_API_TOKEN)
);

const DEMO_PRELOAD: SingerRow[] = [
  {
    code: 'VOCAL-9821',
    name: 'Camila Rios',
    avatar_url: '/avatars/avatar-soprano.svg',
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
    avatar_url: '/avatars/avatar-tenor.svg',
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
    avatar_url: '/avatars/avatar-mezzosoprano.svg',
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

function loadLocalD1State(): D1StorageState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        singers: parsed.singers && parsed.singers.length > 0 ? parsed.singers : [...DEMO_PRELOAD],
        friendships: parsed.friendships || [],
        duels: parsed.duels || [],
        rooms: parsed.rooms || [],
      };
    }
  } catch (e) {
    console.error('Error reading local D1 state:', e);
  }

  return {
    singers: [...DEMO_PRELOAD],
    friendships: [],
    duels: [],
    rooms: [],
  };
}

function saveLocalD1State(state: Partial<D1StorageState>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let currentRaw: any = {};
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        currentRaw = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
      } catch {}
    }
    const merged = {
      ...currentRaw,
      ...state,
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local D1 state:', e);
  }
}

async function executeCloudflareQuery(sql: string, params: any[] = []): Promise<any> {
  return executeD1Query(sql, params, {
    accountId: D1_ACCOUNT_ID,
    databaseId: D1_DATABASE_ID,
    apiToken: D1_API_TOKEN,
  });
}

export const d1Db = {
  async upsertSinger(singer: Partial<SingerRow> & { code: string; name: string }): Promise<SingerRow> {
    const local = loadLocalD1State();
    const existing = local.singers.find((s) => s.code === singer.code);
    const now = new Date().toISOString();

    const updated: SingerRow = {
      code: singer.code,
      name: singer.name,
      avatar_url: singer.avatar_url ?? existing?.avatar_url ?? '/avatars/avatar-soprano.svg',
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
      created_at: existing?.created_at ?? now,
    };

    if (isCloudflareConfigured()) {
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
            updated.status_text, updated.stability_score, updated.lessons_completed,
            updated.practice_minutes, updated.badges_count, updated.last_active_at, updated.created_at,
          ]
        );
      } catch (e) {
        console.error('Cloudflare upsertSinger fallback to local:', e);
      }
    }

    const idx = local.singers.findIndex((s) => s.code === singer.code);
    if (idx >= 0) {
      local.singers[idx] = updated;
    } else {
      local.singers.push(updated);
    }
    saveLocalD1State({ singers: local.singers });
    return updated;
  },

  async getSinger(code: string): Promise<SingerRow | null> {
    const cleanCode = code.trim().toUpperCase();
    if (isCloudflareConfigured()) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM singers WHERE code = ? LIMIT 1',
          [cleanCode]
        );
        if (rows[0]) return rows[0];
      } catch (e) {
        console.error('Cloudflare getSinger fallback to local:', e);
      }
    }

    const local = loadLocalD1State();
    const existing = local.singers.find((s) => s.code.toUpperCase() === cleanCode);
    if (existing) return existing;

    // Check if a registered user exists with this access key and auto-provision their singer profile
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
        const foundUser = (raw.users || []).find((u: any) => u.access_key?.toUpperCase() === cleanCode);
        if (foundUser) {
          const newSinger: SingerRow = {
            code: foundUser.access_key.toUpperCase(),
            name: foundUser.name,
            avatar_url: '/avatars/avatar-soprano.svg',
            level: 1,
            level_title: 'Estudiante Academia',
            streak: 1,
            xp_this_week: 0,
            total_xp: 0,
            vocal_range: 'Voz por Evaluar',
            status_text: 'Estudiante activo',
            stability_score: 80,
            lessons_completed: 0,
            practice_minutes: 0,
            badges_count: 0,
            last_active_at: new Date().toISOString(),
            created_at: foundUser.created_at || new Date().toISOString(),
          };
          local.singers.push(newSinger);
          saveLocalD1State({ singers: local.singers });
          return newSinger;
        }
      }
    } catch {}

    return null;
  },

  async getSingersByCodes(codes: string[]): Promise<SingerRow[]> {
    const local = loadLocalD1State();
    const codeSet = new Set(codes.map((c) => c.toUpperCase()));
    return local.singers
      .filter((s) => codeSet.has(s.code.toUpperCase()))
      .sort((a, b) => b.xp_this_week - a.xp_this_week);
  },

  async addFriendship(userCode: string, friendCode: string): Promise<void> {
    const local = loadLocalD1State();
    const pair1 = `${userCode}:${friendCode}`;
    const pair2 = `${friendCode}:${userCode}`;
    const set = new Set(local.friendships);
    set.add(pair1);
    set.add(pair2);
    local.friendships = Array.from(set);
    saveLocalD1State({ friendships: local.friendships });
  },

  async recordDuel(record: DuelRecordRow): Promise<void> {
    const local = loadLocalD1State();
    local.duels.push(record);

    const challenger = local.singers.find((s) => s.code === record.challenger_code);
    if (challenger) {
      const addedXp = record.winner_code === record.challenger_code ? record.xp_awarded : Math.floor(record.xp_awarded * 0.3);
      challenger.xp_this_week += addedXp;
      challenger.total_xp += addedXp;
      challenger.status_text = `Duelo en ${record.target_note} (${record.challenger_score}%)`;
    }

    const opponent = local.singers.find((s) => s.code === record.opponent_code);
    if (opponent) {
      const addedXp = record.winner_code === record.opponent_code ? record.xp_awarded : Math.floor(record.xp_awarded * 0.3);
      opponent.xp_this_week += addedXp;
      opponent.total_xp += addedXp;
      opponent.status_text = `Duelo en ${record.target_note} (${record.opponent_score}%)`;
    }

    saveLocalD1State({ duels: local.duels, singers: local.singers });
  },

  async getHeadToHead(userCode: string, friendCode: string) {
    const local = loadLocalD1State();
    const duels = local.duels.filter(
      (d) =>
        (d.challenger_code === userCode && d.opponent_code === friendCode) ||
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
      lastDuelScore: lastDuel
        ? lastDuel.challenger_code === userCode
          ? lastDuel.challenger_score
          : lastDuel.opponent_score
        : undefined,
    };
  },

  async createDuelRoom(room: DuelRoomRow): Promise<void> {
    const local = loadLocalD1State();
    const filtered = local.rooms.filter((r) => r.room_id !== room.room_id);
    filtered.push(room);
    saveLocalD1State({ rooms: filtered });
  },

  async getDuelRoom(roomId: string): Promise<DuelRoomRow | null> {
    const local = loadLocalD1State();
    return local.rooms.find((r) => r.room_id === roomId) || null;
  },

  async updateDuelRoom(roomId: string, updates: Partial<DuelRoomRow>): Promise<DuelRoomRow | null> {
    const local = loadLocalD1State();
    const idx = local.rooms.findIndex((r) => r.room_id === roomId);
    if (idx === -1) return null;
    local.rooms[idx] = { ...local.rooms[idx], ...updates };
    saveLocalD1State({ rooms: local.rooms });
    return local.rooms[idx];
  },
};
