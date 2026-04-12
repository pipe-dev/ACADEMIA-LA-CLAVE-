'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dbSave, dbLoad } from '@/lib/db';

const MAX_LIVES = 5;
const RECHARGE_MS = 20 * 60 * 1000; // 20 minutes per life
const DB_KEY_LIVES = 'afinapp_lives';
const DB_KEY_TIMESTAMP = 'afinapp_lives_ts';

export function useLives() {
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastLostAt, setLastLostAt] = useState<number | null>(null);
  const [timeToNext, setTimeToNext] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Load saved state
  useEffect(() => {
    (async () => {
      const savedLives = await dbLoad<number>(DB_KEY_LIVES);
      const savedTs = await dbLoad<number>(DB_KEY_TIMESTAMP);

      let currentLives = savedLives ?? MAX_LIVES;
      let ts = savedTs ?? null;

      // Calculate recharged lives since last save
      if (ts && currentLives < MAX_LIVES) {
        const elapsed = Date.now() - ts;
        const recharged = Math.floor(elapsed / RECHARGE_MS);
        if (recharged > 0) {
          currentLives = Math.min(MAX_LIVES, currentLives + recharged);
          // Advance timestamp by recharged amount
          ts = ts + recharged * RECHARGE_MS;
          if (currentLives >= MAX_LIVES) ts = null;
        }
      }

      setLives(currentLives);
      setLastLostAt(currentLives < MAX_LIVES ? ts : null);
    })();
  }, []);

  // Persist whenever lives change
  useEffect(() => {
    dbSave(DB_KEY_LIVES, lives).catch(() => {});
    dbSave(DB_KEY_TIMESTAMP, lastLostAt).catch(() => {});
  }, [lives, lastLostAt]);

  // Timer for countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (lives >= MAX_LIVES || !lastLostAt) {
      setTimeToNext(0);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - lastLostAt;
      const livesRecharged = Math.floor(elapsed / RECHARGE_MS);

      if (livesRecharged > 0) {
        setLives(prev => {
          const newLives = Math.min(MAX_LIVES, prev + livesRecharged);
          if (newLives >= MAX_LIVES) {
            setLastLostAt(null);
            setTimeToNext(0);
          } else {
            setLastLostAt(prev => (prev ?? Date.now()) + livesRecharged * RECHARGE_MS);
          }
          return newLives;
        });
      } else {
        const remaining = RECHARGE_MS - (elapsed % RECHARGE_MS);
        setTimeToNext(remaining);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [lives, lastLostAt]);

  const loseLife = useCallback(() => {
    setLives(prev => {
      const newLives = Math.max(0, prev - 1);
      if (newLives < MAX_LIVES && !lastLostAt) {
        setLastLostAt(Date.now());
      }
      return newLives;
    });
  }, [lastLostAt]);

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return {
    lives,
    maxLives: MAX_LIVES,
    isOutOfLives: lives <= 0,
    loseLife,
    timeToNextLife: formatTime(timeToNext),
    timeToNextLifeMs: timeToNext,
  };
}
