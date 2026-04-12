'use client';

import { useState, useEffect } from 'react';
import { dbSave, dbLoad } from '@/lib/db';

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toDateString();
        const storedStreak = await dbLoad<number>('afinapp_streak');
        const storedDate = await dbLoad<string>('afinapp_last_active');

        let currentStreak = storedStreak ?? 0;
        const lastActiveDate = storedDate ?? null;

        if (!lastActiveDate) {
          currentStreak = 1;
          await dbSave('afinapp_streak', 1);
          await dbSave('afinapp_last_active', today);
        } else if (lastActiveDate !== today) {
          const lastDate = new Date(lastActiveDate);
          const currentDate = new Date(today);
          const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

          if (diffDays === 1) {
            currentStreak += 1;
          } else if (diffDays > 1) {
            currentStreak = 1;
          }

          await dbSave('afinapp_streak', currentStreak);
          await dbSave('afinapp_last_active', today);
        }

        setStreak(currentStreak);
      } catch (e) {
        console.error('Failed to parse streak', e);
      }
    };
    load();
  }, []);

  return streak;
}
