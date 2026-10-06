-- AfinApp Cloudflare D1 Database Schema
-- Production SQL schema for users, progress, singers, friendships, duels, and rooms

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  access_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'blocked' | 'expired'
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  notes TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_access_key ON users(access_key);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  progress_data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_progress_email ON user_progress(user_email);

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

CREATE INDEX IF NOT EXISTS idx_singers_xp_this_week ON singers(xp_this_week DESC);

CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_code TEXT NOT NULL,
  friend_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_code, friend_code)
);

CREATE TABLE IF NOT EXISTS duels (
  id TEXT PRIMARY KEY,
  duel_type TEXT NOT NULL,
  challenger_code TEXT NOT NULL,
  opponent_code TEXT NOT NULL,
  target_note TEXT NOT NULL,
  challenger_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  winner_code TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_code);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_code);

CREATE TABLE IF NOT EXISTS duel_rooms (
  room_id TEXT PRIMARY KEY,
  duel_type TEXT NOT NULL,
  challenger_code TEXT NOT NULL,
  opponent_code TEXT,
  target_note TEXT NOT NULL,
  offer_sdp TEXT,
  answer_sdp TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at INTEGER NOT NULL
);
