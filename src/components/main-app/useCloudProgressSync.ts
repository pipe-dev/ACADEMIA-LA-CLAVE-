import { useEffect, useRef } from 'react';
import { UserStats } from '../../types';

interface UseCloudProgressSyncParams {
  userStats: UserStats;
  setUserStats: React.Dispatch<React.SetStateAction<UserStats>>;
  isOnline: boolean;
}

export function useCloudProgressSync({
  userStats,
  setUserStats,
  isOnline,
}: UseCloudProgressSyncParams) {
  const initialSyncDone = useRef(false);
  const lastSyncedXp = useRef(userStats.xp || 0);

  // 1. Initial sync on app load: pull cloud progress
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
          // If cloud has higher XP, merge cloud stats
          if (parsed && typeof parsed.xp === 'number' && parsed.xp > (userStats.xp || 0)) {
            setUserStats((prev) => ({
              ...prev,
              ...parsed,
              xp: parsed.xp,
              level: parsed.level || prev.level,
              streak: parsed.streak || prev.streak,
            }));
            lastSyncedXp.current = parsed.xp;
          }
        }
        initialSyncDone.current = true;
      } catch (e) {
        // Silent catch for offline or network issues
      }
    }

    loadCloudProgress();

    return () => {
      isMounted = false;
    };
  }, [isOnline, setUserStats, userStats.xp]);

  // 2. Debounced save to cloud when XP changes
  useEffect(() => {
    if (!isOnline || !initialSyncDone.current) return;

    const currentXp = userStats.xp || 0;
    if (currentXp === lastSyncedXp.current) return;

    const timeout = setTimeout(async () => {
      try {
        lastSyncedXp.current = currentXp;
        await fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xp: currentXp,
            level: userStats.level || 1,
            streak: userStats.streak || 0,
            progressData: JSON.stringify(userStats),
          }),
        });
      } catch (e) {
        // Silently queue for next sync
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [userStats, isOnline]);
}
