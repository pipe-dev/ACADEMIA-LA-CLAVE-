// offlineSync.ts - Servicio para Modo Offline Completo y Sincronización Automática
import { UserStats } from '../types';
import { INITIAL_UNITS, QUICK_SCALES, SOLFEGE_NOTES, SONGS_DATABASE, INITIAL_QUESTS } from '../data/academyData';

export interface OfflineAction {
  id: string;
  type: 'LESSON_COMPLETE' | 'XP_EARNED' | 'STREAK_INCREMENT' | 'QUEST_PROGRESS' | 'PRACTICE_TIME';
  payload: any;
  timestamp: string;
}

export interface SyncResult {
  syncedCount: number;
  totalXpAdded: number;
  streakAdded: number;
  message: string;
}

const OFFLINE_QUEUE_KEY = 'laclave_offline_queue_v1';
const OFFLINE_CONTENT_CACHE_KEY = 'laclave_offline_content_v1';
const USER_STATS_KEY = 'laclave_user_stats_v1';
const UNITS_DATA_KEY = 'laclave_units_data_v1';

// 1. Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const register = () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[ServiceWorker] Registrado exitosamente:', reg.scope);
        })
        .catch((err) => {
          console.warn('[ServiceWorker] Falló el registro:', err);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }
  }
}

// 2. Queue offline progress when internet is unavailable
export function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): OfflineAction {
  const fullAction: OfflineAction = {
    ...action,
    id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString()
  };

  try {
    const existing = getOfflineQueue();
    existing.push(fullAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    
    // Dispatch local event so UI knows queue updated
    window.dispatchEvent(new CustomEvent('laclave-offline-queue-changed', { detail: { queueLength: existing.length } }));
  } catch (e) {
    console.error('Error al guardar acción offline:', e);
  }

  return fullAction;
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  window.dispatchEvent(new CustomEvent('laclave-offline-queue-changed', { detail: { queueLength: 0 } }));
}

// 3. Pre-download & Cache 100% of academy content for Offline Use
export function cacheAllContentLocally(): { success: boolean; itemCount: number } {
  try {
    const bundle = {
      units: INITIAL_UNITS,
      scales: QUICK_SCALES,
      notes: SOLFEGE_NOTES,
      songs: SONGS_DATABASE,
      quests: INITIAL_QUESTS,
      cachedAt: new Date().toISOString()
    };

    localStorage.setItem(OFFLINE_CONTENT_CACHE_KEY, JSON.stringify(bundle));
    
    // Also ensure units and initial user stats exist in localStorage
    if (!localStorage.getItem(UNITS_DATA_KEY)) {
      localStorage.setItem(UNITS_DATA_KEY, JSON.stringify(INITIAL_UNITS));
    }
    
    return { success: true, itemCount: INITIAL_UNITS.length + QUICK_SCALES.length + SONGS_DATABASE.length };
  } catch (e) {
    console.error('Error al guardar contenido offline:', e);
    return { success: false, itemCount: 0 };
  }
}

export function isContentCachedLocally(): boolean {
  try {
    return !!localStorage.getItem(OFFLINE_CONTENT_CACHE_KEY);
  } catch {
    return false;
  }
}

// 4. Synchronize pending offline actions to main user profile
export function syncPendingOfflineProgress(currentStats: UserStats): { updatedStats: UserStats; syncResult: SyncResult | null } {
  const queue = getOfflineQueue();
  
  if (queue.length === 0) {
    return { updatedStats: currentStats, syncResult: null };
  }

  let totalXpAdded = 0;
  let streakAdded = 0;
  let lessonsCompletedCount = 0;
  let practiceMinutesAdded = 0;

  queue.forEach((action) => {
    if (action.type === 'XP_EARNED') {
      totalXpAdded += action.payload.xp || 0;
    } else if (action.type === 'LESSON_COMPLETE') {
      totalXpAdded += action.payload.xpEarned || 0;
      lessonsCompletedCount += 1;
    } else if (action.type === 'STREAK_INCREMENT') {
      streakAdded += action.payload.amount || 1;
    } else if (action.type === 'PRACTICE_TIME') {
      practiceMinutesAdded += action.payload.minutes || 0;
      totalXpAdded += action.payload.xpEarned || 0;
    }
  });

  // Calculate new stats
  const newXp = currentStats.xp + totalXpAdded;
  const newStreak = Math.max(currentStats.streak, currentStats.streak + streakAdded);
  const newLessons = (currentStats.lessonsCompleted || 0) + lessonsCompletedCount;
  const newPracticeMins = (currentStats.practiceMinutes || 0) + practiceMinutesAdded;

  // Level up calculation if maxXP reached
  let newLevel = currentStats.level;
  let currentMaxXP = currentStats.maxXP;
  let tempXp = newXp;

  while (tempXp >= currentMaxXP) {
    newLevel += 1;
    tempXp -= currentMaxXP;
    currentMaxXP = Math.round(currentMaxXP * 1.2);
  }

  const updatedStats: UserStats = {
    ...currentStats,
    xp: tempXp,
    maxXP: currentMaxXP,
    level: newLevel,
    streak: newStreak,
    lessonsCompleted: newLessons,
    practiceMinutes: newPracticeMins
  };

  // Save to localStorage
  try {
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(updatedStats));
  } catch (e) {
    console.warn('Could not update user stats in storage:', e);
  }

  const syncResult: SyncResult = {
    syncedCount: queue.length,
    totalXpAdded,
    streakAdded,
    message: `¡Sincronización Completa! Se guardaron ${queue.length} actividades offline (+${totalXpAdded} XP acumulados).`
  };

  // Clear queue
  clearOfflineQueue();

  // Dispatch sync completion event
  window.dispatchEvent(new CustomEvent('laclave-sync-complete', { detail: syncResult }));

  return { updatedStats, syncResult };
}
