import { useEffect, useRef } from 'react';
import { UserStats } from '../../types';
import { mutationQueue } from '@/lib/mutationQueue';

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

          // If cloud has newer/higher XP or local is uninitialized
          if (cloudStats && typeof cloudStats.xp === 'number' && cloudStats.xp >= (userStats.xp || 0)) {
            setUserStats((prev) => ({
              ...prev,
              ...cloudStats,
              xp: cloudStats.xp,
              level: cloudStats.level || prev.level,
              streak: cloudStats.streak || prev.streak,
            }));
            lastSyncedXp.current = cloudStats.xp;

            // Restore units and modules if cloud has them
            if (parsed.unitsProgress) {
              localStorage.setItem('laclave_units_v8', parsed.unitsProgress);
            }
            if (parsed.dailyQuests) {
              localStorage.setItem('laclave_daily_quests_state_v2', parsed.dailyQuests);
            }
            if (parsed.vocalRange) {
              localStorage.setItem('laclave_vocal_range_saved', parsed.vocalRange);
            }
            if (parsed.vocalRangeClassification) {
              localStorage.setItem('laclave_vocal_range_classification', parsed.vocalRangeClassification);
            }
            if (parsed.voiceGender) {
              localStorage.setItem('laclave_voice_gender', parsed.voiceGender);
            }
          }
        }
        initialSyncDone.current = true;
      } catch (e) {
        // Silent catch for network hiccups
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

        const fullProgressPayload = {
          userStats,
          unitsProgress: typeof window !== 'undefined' ? localStorage.getItem('laclave_units_v8') : null,
          dailyQuests: typeof window !== 'undefined' ? localStorage.getItem('laclave_daily_quests_state_v2') : null,
          vocalRange: typeof window !== 'undefined' ? localStorage.getItem('laclave_vocal_range_saved') : null,
          vocalRangeClassification: typeof window !== 'undefined' ? localStorage.getItem('laclave_vocal_range_classification') : null,
          voiceGender: typeof window !== 'undefined' ? localStorage.getItem('laclave_voice_gender') : null,
        };

        mutationQueue.enqueue(async () => {
          try {
            await fetch('/api/user/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                xp: currentXp,
                level: userStats.level || 1,
                streak: userStats.streak || 0,
                progressData: JSON.stringify(fullProgressPayload),
              }),
            });
          } catch (e) {
            // Silently queue for next sync
          }
        });
      } catch (e) {
        // Fallback catch
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [userStats, isOnline]);
}
