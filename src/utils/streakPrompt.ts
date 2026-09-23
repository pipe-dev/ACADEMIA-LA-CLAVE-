'use client';

type StreakListener = () => void;
const listeners = new Set<StreakListener>();

// Fecha local YYYY-MM-DD (se reinicia a las 12:00 a.m. local, no UTC)
export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isStreakLitToday(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('laclave_last_streak_date') === getTodayStr();
  } catch {
    return false;
  }
}

// Notifica que una acción significativa terminó (lección, juego, karaoke...)
export function emitStreakEligibleAction(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.warn('[StreakPrompt] Listener error:', e);
    }
  });
}

export function subscribeStreakEligibleAction(listener: StreakListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}