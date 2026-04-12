'use client';

import { useState, useEffect, useCallback } from 'react';
import { dbSave, dbLoad } from '@/lib/db';

export interface Quest {
  id: string;
  label: string;
  icon: string;
  target: number;
  current: number;
}

const QUEST_TEMPLATES = [
  { id: 'notes', label: 'Afina {target} notas', icon: '🎵', targets: [10, 15, 20, 25] },
  { id: 'combo', label: 'Logra un combo x{target}', icon: '🔥', targets: [3, 4, 5] },
  { id: 'minutes', label: 'Practica {target} minutos', icon: '⏱️', targets: [2, 3, 5] },
];

function getTodayKey() {
  return `afinapp_quests_${new Date().toISOString().slice(0, 10)}`;
}

function generateDailyQuests(): Quest[] {
  const seed = new Date().getDate();
  return QUEST_TEMPLATES.map(t => {
    const target = t.targets[seed % t.targets.length];
    return {
      id: t.id,
      label: t.label.replace('{target}', String(target)),
      icon: t.icon,
      target,
      current: 0,
    };
  });
}

export function useDailyQuests() {
  const [quests, setQuests] = useState<Quest[]>(generateDailyQuests());
  const [loaded, setLoaded] = useState(false);

  // Load from IDB on mount
  useEffect(() => {
    dbLoad<Quest[]>(getTodayKey()).then(saved => {
      if (saved && saved.length > 0) setQuests(saved);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Persist to IDB on every change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    dbSave(getTodayKey(), quests).catch(console.error);
  }, [quests, loaded]);

  const addNotes = useCallback((count: number) => {
    setQuests(prev => prev.map(q => q.id === 'notes' ? { ...q, current: Math.min(q.current + count, q.target) } : q));
  }, []);

  const reportCombo = useCallback((combo: number) => {
    setQuests(prev => prev.map(q => q.id === 'combo' ? { ...q, current: Math.max(q.current, combo) } : q));
  }, []);

  const addMinutes = useCallback((mins: number) => {
    setQuests(prev => prev.map(q => q.id === 'minutes' ? { ...q, current: Math.min(q.current + mins, q.target) } : q));
  }, []);

  const allComplete = quests.every(q => q.current >= q.target);

  return { quests, addNotes, reportCombo, addMinutes, allComplete, loaded };
}
