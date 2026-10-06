// Servicio de sincronizacion offline-first para amigos, perfiles y duelos

import { FriendItem } from '../components/friends/friendsTypes';
import { DuelType } from '../lib/d1Client';

export interface DuelRecordPayload {
  challengerCode: string;
  opponentCode: string;
  targetNote: string;
  challengerScore: number;
  opponentScore: number;
  winnerCode: string;
  xpAwarded: number;
  duelType?: DuelType;
}

export interface HeadToHeadResult {
  totalDuels: number;
  userWins: number;
  friendWins: number;
  lastDuelNote?: string;
  lastDuelScore?: number;
}

class FriendsSyncService {
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // 1. Sincronizar perfil propio con la nube (Background Sync)
  async syncMyProfile(profile: {
    code: string;
    name: string;
    avatarUrl?: string;
    level?: number;
    levelTitle?: string;
    streak?: number;
    xpThisWeek?: number;
    totalXp?: number;
    vocalRange?: string;
    statusText?: string;
    stabilityScore?: number;
    lessonsCompleted?: number;
    practiceMinutes?: number;
    badgesCount?: number;
  }): Promise<void> {
    try {
      if (!this.isOnline()) return;

      await fetch('/api/friends/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {
      console.warn('Sync profile offline fallback:', e);
    }
  }

  // 2. Obtener clasificacion actualizada de amigos
  async fetchFriendsRanking(currentFriends: FriendItem[]): Promise<FriendItem[]> {
    if (currentFriends.length === 0) return [];

    try {
      if (!this.isOnline()) return currentFriends;

      const codes = currentFriends.map(f => f.code);
      const res = await fetch('/api/friends/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes })
      });

      if (!res.ok) return currentFriends;

      const data = await res.json();
      if (!data.success || !Array.isArray(data.friends)) return currentFriends;

      // Fusionar preservando estadisticas locales de duelos cara a cara
      const serverFriendsMap = new Map<string, Partial<FriendItem>>();
      data.friends.forEach((sf: FriendItem) => serverFriendsMap.set(sf.code, sf));

      const merged = currentFriends.map(local => {
        const remote = serverFriendsMap.get(local.code);
        if (!remote) return local;

        return {
          ...local,
          name: remote.name ?? local.name,
          avatar: remote.avatar ?? local.avatar,
          level: remote.level ?? local.level,
          levelTitle: remote.levelTitle ?? local.levelTitle,
          streak: remote.streak ?? local.streak,
          xpThisWeek: remote.xpThisWeek ?? local.xpThisWeek,
          totalXp: remote.totalXp ?? local.totalXp,
          vocalRange: remote.vocalRange ?? local.vocalRange,
          statusText: remote.statusText ?? local.statusText,
          stabilityScore: remote.stabilityScore ?? local.stabilityScore,
          lessonsCompleted: remote.lessonsCompleted ?? local.lessonsCompleted,
          practiceMinutes: remote.practiceMinutes ?? local.practiceMinutes,
          badgesCount: remote.badgesCount ?? local.badgesCount,
          isOnline: remote.isOnline ?? local.isOnline
        };
      });

      // Guardar en localStorage
      try {
        localStorage.setItem('laclave_friends_list', JSON.stringify(merged));
      } catch {
        // Ignorar error de cuota de storage
      }

      return merged;
    } catch (e) {
      console.warn('Sync ranking offline fallback:', e);
      return currentFriends;
    }
  }

  // 3. Buscar amigo por codigo
  async searchFriendByCode(code: string): Promise<{
    found: boolean;
    singer?: FriendItem;
    message?: string;
  }> {
    const formatted = code.trim().toUpperCase();
    if (!formatted) return { found: false, message: 'Codigo invalido' };

    try {
      if (!this.isOnline()) {
        return { found: false, message: 'Modo sin conexion activo' };
      }

      const res = await fetch('/api/friends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formatted })
      });

      if (!res.ok) {
        return { found: false, message: 'Error de conexion con el servidor' };
      }

      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Search friend offline error:', e);
      return { found: false, message: 'No se pudo conectar con el servidor' };
    }
  }

  // 4. Registrar resultado de duelo y actualizar cara a cara
  async recordDuelResult(payload: DuelRecordPayload): Promise<{
    success: boolean;
    headToHead?: HeadToHeadResult;
  }> {
    // 1. Actualizar balance local en memoria y localStorage primero
    try {
      const saved = localStorage.getItem('laclave_friends_list');
      if (saved) {
        const list: FriendItem[] = JSON.parse(saved);
        const idx = list.findIndex(f => f.code === payload.opponentCode);
        if (idx !== -1) {
          const friend = list[idx];
          const won = payload.winnerCode === payload.challengerCode;
          list[idx] = {
            ...friend,
            duelsWonAgainst: (friend.duelsWonAgainst ?? 0) + (won ? 1 : 0),
            duelsLostAgainst: (friend.duelsLostAgainst ?? 0) + (won ? 0 : 1),
            lastDuelNote: payload.targetNote,
            lastDuelScore: payload.challengerScore,
            statusText: `Duelo disputado en ${payload.targetNote}`
          };
          localStorage.setItem('laclave_friends_list', JSON.stringify(list));
        }
      }
    } catch (e) {
      console.warn('Local duel update fallback:', e);
    }

    // 2. Sincronizar con Cloudflare D1 en background
    try {
      if (!this.isOnline()) return { success: true };

      const res = await fetch('/api/friends/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, headToHead: data.headToHead };
      }
    } catch (e) {
      console.warn('Sync duel to cloud error:', e);
    }

    return { success: true };
  }
}

export const friendsSyncService = new FriendsSyncService();
