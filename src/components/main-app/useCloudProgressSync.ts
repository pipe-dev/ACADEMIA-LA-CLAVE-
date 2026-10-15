import { useEffect, useRef, useCallback } from 'react';
import { UserStats } from '../../types';
import { mutationQueue } from '@/lib/mutationQueue';

interface UseCloudProgressSyncParams {
  userStats: UserStats;
  setUserStats: React.Dispatch<React.SetStateAction<UserStats>>;
  isOnline: boolean;
}

const STORAGE_KEY_PENDING = 'laclave_progress_sync_pending';
const STORAGE_KEY_LAST_HASH = 'laclave_progress_last_synced_hash';

function computePayloadHash(payload: any): string {
  try {
    const str = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  } catch {
    return String(Date.now());
  }
}

export function useCloudProgressSync({
  userStats,
  setUserStats,
  isOnline,
}: UseCloudProgressSyncParams) {
  const initialSyncDone = useRef(false);
  const isSyncingRef = useRef(false);
  const lastSyncedHash = useRef<string>(
    typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_LAST_HASH) || '') : ''
  );

  const getFullProgressPayload = useCallback(() => {
    return {
      userStats,
      unitsProgress: typeof window !== 'undefined' ? localStorage.getItem('laclave_units_v8') : null,
      dailyQuests: typeof window !== 'undefined' ? localStorage.getItem('laclave_daily_quests_state_v2') : null,
      vocalRange: typeof window !== 'undefined' ? localStorage.getItem('laclave_vocal_range_saved') : null,
      vocalRangeClassification: typeof window !== 'undefined' ? localStorage.getItem('laclave_vocal_range_classification') : null,
      voiceGender: typeof window !== 'undefined' ? localStorage.getItem('laclave_voice_gender') : null,
    };
  }, [userStats]);

  // Synchronize payload to Cloudflare D1
  const syncToCloud = useCallback(async (isExiting = false) => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine && !isExiting) {
      localStorage.setItem(STORAGE_KEY_PENDING, 'true');
      return;
    }

    const payload = getFullProgressPayload();
    const currentHash = computePayloadHash(payload);

    // Dirty-state check: skip sync if nothing changed
    if (currentHash === lastSyncedHash.current && !localStorage.getItem(STORAGE_KEY_PENDING)) {
      return;
    }

    if (isSyncingRef.current && !isExiting) return;
    isSyncingRef.current = true;

    const bodyData = JSON.stringify({
      xp: userStats.xp || 0,
      level: userStats.level || 1,
      streak: userStats.streak || 0,
      progressData: JSON.stringify(payload),
    });

    try {
      if (isExiting) {
        // Guard 3: Use keepalive fetch when tab/app is closing
        fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyData,
          keepalive: true,
        }).catch(() => {});
        localStorage.setItem(STORAGE_KEY_LAST_HASH, currentHash);
        localStorage.removeItem(STORAGE_KEY_PENDING);
        return;
      }

      await mutationQueue.enqueue(async () => {
        const res = await fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyData,
        });

        if (res.ok) {
          lastSyncedHash.current = currentHash;
          localStorage.setItem(STORAGE_KEY_LAST_HASH, currentHash);
          localStorage.removeItem(STORAGE_KEY_PENDING);
        } else {
          localStorage.setItem(STORAGE_KEY_PENDING, 'true');
        }
      });
    } catch {
      localStorage.setItem(STORAGE_KEY_PENDING, 'true');
    } finally {
      isSyncingRef.current = false;
    }
  }, [getFullProgressPayload, userStats.xp, userStats.level, userStats.streak]);

  // 1. Initial sync on app load: pull full cloud progress
  useEffect(() => {
    if (!isOnline || initialSyncDone.current) return;

    let isMounted = true;
    async function loadCloudProgress() {
      try {
        const res = await fetch('/api/user/progress', { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.progress && data.progress.progress_data && isMounted) {
          const parsed = JSON.parse(data.progress.progress_data);
          const cloudStats = parsed.userStats || parsed;

          // If cloud has newer/higher XP
          if (cloudStats && typeof cloudStats.xp === 'number' && cloudStats.xp >= (userStats.xp || 0)) {
            setUserStats((prev) => ({
              ...prev,
              ...cloudStats,
              xp: cloudStats.xp,
              level: cloudStats.level || prev.level,
              streak: cloudStats.streak || prev.streak,
            }));

            if (parsed.unitsProgress) localStorage.setItem('laclave_units_v8', parsed.unitsProgress);
            if (parsed.dailyQuests) localStorage.setItem('laclave_daily_quests_state_v2', parsed.dailyQuests);
            if (parsed.vocalRange) localStorage.setItem('laclave_vocal_range_saved', parsed.vocalRange);
            if (parsed.vocalRangeClassification) localStorage.setItem('laclave_vocal_range_classification', parsed.vocalRangeClassification);
            if (parsed.voiceGender) localStorage.setItem('laclave_voice_gender', parsed.voiceGender);
          }
        }
        initialSyncDone.current = true;

        // If there were pending offline edits, sync them now
        if (localStorage.getItem(STORAGE_KEY_PENDING) === 'true') {
          syncToCloud(false);
        }
      } catch {
        // Offline resilience
      }
    }

    loadCloudProgress();

    return () => {
      isMounted = false;
    };
  }, [isOnline, setUserStats, userStats.xp, syncToCloud]);

  // 2. Guard 1: Debounced save when userStats change
  useEffect(() => {
    if (!isOnline || !initialSyncDone.current) return;

    const timeout = setTimeout(() => {
      syncToCloud(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [userStats, isOnline, syncToCloud]);

  // 3. Guard 2 & 3: Heartbeat + Visibility/Pagehide exit detection
  useEffect(() => {
    // Guard 2: 5-minute heartbeat check for active long sessions
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncToCloud(false);
      }
    }, 5 * 60 * 1000);

    // Guard 3: Flush on background or tab close
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncToCloud(true);
      } else if (document.visibilityState === 'visible') {
        if (localStorage.getItem(STORAGE_KEY_PENDING) === 'true') {
          syncToCloud(false);
        }
      }
    };

    const handlePageHide = () => {
      syncToCloud(true);
    };

    const handleOnline = () => {
      if (localStorage.getItem(STORAGE_KEY_PENDING) === 'true') {
        syncToCloud(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncToCloud]);
}
