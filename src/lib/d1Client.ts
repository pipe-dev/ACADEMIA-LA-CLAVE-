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

  async addFriendship(userCode: string, friendCode: string): Promise<void> {
    mockFriendships.add(`${userCode}:${friendCode}`);
    mockFriendships.add(`${friendCode}:${userCode}`);
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
