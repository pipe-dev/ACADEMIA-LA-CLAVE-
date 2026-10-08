import fs from 'fs';
import path from 'path';

export type UserStatus = 'active' | 'blocked' | 'expired';
export type UserRole = 'student' | 'admin';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  access_key: string;
  status: UserStatus;
  expires_at: string;
  created_at: string;
  notes?: string;
  role: UserRole;
  last_login_at?: string;
}

export interface UserProgressRecord {
  user_id: string;
  user_email: string;
  xp: number;
  level: number;
  streak: number;
  progress_data: string;
  updated_at: string;
}

import { executeD1Query, getNativeD1 } from './d1Binding';

interface LocalDatabaseState {
  users: UserRecord[];
  progress: UserProgressRecord[];
}

const D1_ACCOUNT_ID = process.env.CLOUDFLARE_D1_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN;

const isCloudflareConfigured = () => Boolean(
  getNativeD1() || (D1_ACCOUNT_ID && D1_DATABASE_ID && D1_API_TOKEN)
);

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'afinapp_db.json');

function getDefaultSeedUsers(): UserRecord[] {
  const now = new Date();
  const plus30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const plus90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const plus365Days = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'usr_demo_1001',
      name: 'Estudiante Demo',
      email: 'demo@canto.com',
      access_key: 'clave123',
      status: 'active',
      expires_at: plus30Days,
      created_at: now.toISOString(),
      notes: 'Cuenta demo de bienvenida',
      role: 'student',
    },
    {
      id: 'usr_iglesia_1002',
      name: 'Grupo Coral Iglesia',
      email: 'iglesia@canto.com',
      access_key: 'grupoiglesia',
      status: 'active',
      expires_at: plus90Days,
      created_at: now.toISOString(),
      notes: 'Convenio grupal coro',
      role: 'student',
    },
    {
      id: 'usr_admin_master',
      name: 'Administrador Maestro',
      email: 'admin@laclave.com',
      access_key: 'admin123',
      status: 'active',
      expires_at: plus365Days,
      created_at: now.toISOString(),
      notes: 'Cuenta directiva de academia',
      role: 'admin',
    },
  ];
}

function loadLocalState(): LocalDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initialState: LocalDatabaseState = {
        users: getDefaultSeedUsers(),
        progress: [],
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialState, null, 2), 'utf-8');
      return initialState;
    }
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      progress: parsed.progress || [],
    };
  } catch (err) {
    console.error('Error reading local AfinApp database file:', err);
    return {
      users: getDefaultSeedUsers(),
      progress: [],
    };
  }
}

function saveLocalState(state: LocalDatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local AfinApp database file:', err);
  }
}

export function computeUserEffectiveStatus(user: UserRecord): {
  status: UserStatus;
  daysRemaining: number;
  isExpired: boolean;
  isBlocked: boolean;
} {
  const isBlocked = user.status === 'blocked';
  const now = Date.now();
  const expiryTime = new Date(user.expires_at).getTime();
  const diffMs = expiryTime - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  let effectiveStatus: UserStatus = 'active';
  if (isBlocked) {
    effectiveStatus = 'blocked';
  } else if (isExpired) {
    effectiveStatus = 'expired';
  }

  return {
    status: effectiveStatus,
    daysRemaining,
    isExpired,
    isBlocked,
  };
}

async function executeCloudflareQuery(sql: string, params: any[] = []): Promise<any> {
  return executeD1Query(sql, params, {
    accountId: D1_ACCOUNT_ID,
    databaseId: D1_DATABASE_ID,
    apiToken: D1_API_TOKEN,
  });
}

export const userDb = {
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (isCloudflareConfigured()) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1',
          [normalized]
        );
        return rows[0] || null;
      } catch (e) {
        console.error('Cloudflare getUserByEmail fallback to local:', e);
      }
    }

    const state = loadLocalState();
    return state.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async getUserByKey(key: string): Promise<UserRecord | null> {
    const cleanKey = key.trim();
    if (isCloudflareConfigured()) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM users WHERE access_key = ? LIMIT 1',
          [cleanKey]
        );
        return rows[0] || null;
      } catch (e) {
        console.error('Cloudflare getUserByKey fallback to local:', e);
      }
    }

    const state = loadLocalState();
    return state.users.find((u) => u.access_key === cleanKey) || null;
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    if (isCloudflareConfigured()) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM users WHERE id = ? LIMIT 1',
          [id]
        );
        return rows[0] || null;
      } catch (e) {
        console.error('Cloudflare getUserById fallback to local:', e);
      }
    }

    const state = loadLocalState();
    return state.users.find((u) => u.id === id) || null;
  },

  async listUsers(search?: string): Promise<UserRecord[]> {
    let list: UserRecord[] = [];
    if (isCloudflareConfigured()) {
      try {
        list = await executeCloudflareQuery(
          'SELECT * FROM users ORDER BY created_at DESC'
        );
      } catch (e) {
        console.error('Cloudflare listUsers fallback to local:', e);
        list = loadLocalState().users;
      }
    } else {
      list = loadLocalState().users;
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.access_key.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async createUser(data: {
    name: string;
    email: string;
    access_key: string;
    daysDuration: number;
    notes?: string;
    role?: UserRole;
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const cleanKey = data.access_key.trim();
    const now = new Date();
    const expiryDate = new Date(
      now.getTime() + Math.max(1, data.daysDuration) * 24 * 60 * 60 * 1000
    );

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      access_key: cleanKey,
      status: 'active',
      expires_at: expiryDate.toISOString(),
      created_at: now.toISOString(),
      notes: data.notes?.trim() || '',
      role: data.role || 'student',
    };

    if (isCloudflareConfigured()) {
      try {
        await executeCloudflareQuery(
          `INSERT INTO users (id, name, email, access_key, status, expires_at, created_at, notes, role)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newUser.id,
            newUser.name,
            newUser.email,
            newUser.access_key,
            newUser.status,
            newUser.expires_at,
            newUser.created_at,
            newUser.notes,
            newUser.role,
          ]
        );
        return newUser;
      } catch (e) {
        console.error('Cloudflare createUser fallback to local:', e);
      }
    }

    const state = loadLocalState();
    const filtered = state.users.filter((u) => u.email !== normalizedEmail);
    filtered.unshift(newUser);
    saveLocalState({ ...state, users: filtered });
    return newUser;
  },

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const ALLOWED_COLUMNS = new Set([
      'name',
      'email',
      'access_key',
      'status',
      'expires_at',
      'notes',
      'role',
      'last_login_at',
    ]);
    const validFields = Object.keys(updates).filter((f) => ALLOWED_COLUMNS.has(f));

    if (isCloudflareConfigured() && validFields.length > 0) {
      try {
        const setClause = validFields.map((f) => `\`${f}\` = ?`).join(', ');
        const values = validFields.map((f) => (updates as any)[f]);
        await executeCloudflareQuery(
          `UPDATE users SET ${setClause} WHERE id = ?`,
          [...values, id]
        );
      } catch (e) {
        console.error('Cloudflare updateUser fallback to local:', e);
      }
    }

    const state = loadLocalState();
    const idx = state.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    state.users[idx] = { ...state.users[idx], ...updates };
    saveLocalState(state);
    return state.users[idx];
  },

  async renewUser(id: string, additionalDays: number): Promise<UserRecord | null> {
    const user = await this.getUserById(id);
    if (!user) return null;

    const currentExpiry = new Date(user.expires_at).getTime();
    const now = Date.now();
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(
      baseTime + Math.max(1, additionalDays) * 24 * 60 * 60 * 1000
    ).toISOString();

    return this.updateUser(id, {
      expires_at: newExpiry,
      status: 'active',
    });
  },

  async toggleUserBlock(id: string): Promise<UserRecord | null> {
    const user = await this.getUserById(id);
    if (!user) return null;

    const nextStatus: UserStatus = user.status === 'blocked' ? 'active' : 'blocked';
    return this.updateUser(id, { status: nextStatus });
  },

  async deleteUser(id: string): Promise<boolean> {
    if (isCloudflareConfigured()) {
      try {
        await executeCloudflareQuery('DELETE FROM users WHERE id = ?', [id]);
      } catch (e) {
        console.error('Cloudflare deleteUser fallback to local:', e);
      }
    }

    const state = loadLocalState();
    const nextUsers = state.users.filter((u) => u.id !== id);
    saveLocalState({ ...state, users: nextUsers });
    return true;
  },

  async getUserProgress(userIdOrEmail: string): Promise<UserProgressRecord | null> {
    const needle = userIdOrEmail.trim().toLowerCase();
    if (isCloudflareConfigured()) {
      try {
        const rows = await executeCloudflareQuery(
          'SELECT * FROM user_progress WHERE user_id = ? OR LOWER(user_email) = ? LIMIT 1',
          [needle, needle]
        );
        if (rows[0]) return rows[0];
      } catch (e) {
        console.error('Cloudflare getUserProgress fallback to local:', e);
      }
    }

    const state = loadLocalState();
    return (
      state.progress.find(
        (p) => p.user_id === needle || p.user_email.toLowerCase() === needle
      ) || null
    );
  },

  async saveUserProgress(data: {
    userId: string;
    userEmail: string;
    xp: number;
    level: number;
    streak: number;
    progressData: string;
  }): Promise<UserProgressRecord> {
    const now = new Date().toISOString();
    const record: UserProgressRecord = {
      user_id: data.userId,
      user_email: data.userEmail.toLowerCase(),
      xp: data.xp,
      level: data.level,
      streak: data.streak,
      progress_data: data.progressData,
      updated_at: now,
    };

    if (isCloudflareConfigured()) {
      try {
        await executeCloudflareQuery(
          `INSERT INTO user_progress (user_id, user_email, xp, level, streak, progress_data, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             user_email = excluded.user_email,
             xp = excluded.xp,
             level = excluded.level,
             streak = excluded.streak,
             progress_data = excluded.progress_data,
             updated_at = excluded.updated_at`,
          [
            record.user_id,
            record.user_email,
            record.xp,
            record.level,
            record.streak,
            record.progress_data,
            record.updated_at,
          ]
        );
      } catch (e) {
        console.error('Cloudflare saveUserProgress fallback to local:', e);
      }
    }

    const state = loadLocalState();
    const existingIndex = state.progress.findIndex(
      (p) => p.user_id === data.userId || p.user_email.toLowerCase() === data.userEmail.toLowerCase()
    );

    if (existingIndex >= 0) {
      state.progress[existingIndex] = record;
    } else {
      state.progress.push(record);
    }

    saveLocalState(state);
    return record;
  },
};
