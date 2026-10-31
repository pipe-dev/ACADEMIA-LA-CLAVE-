'use client';

type StreakListener = () => void;
const listeners = new Set<StreakListener>();

export const STREAK_CLAIMED_KEY = 'laclave_streak_claimed_date';
export const LEGACY_STREAK_KEY = 'laclave_last_streak_date';

// Fecha local YYYY-MM-DD del dispositivo (se reinicia estrictamente a las 12:00 a.m. local, no UTC)
export function getLocalCalendarDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Fecha local de ayer YYYY-MM-DD para validar incremento real de racha
export function getYesterdayCalendarDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Alias de retrocompatibilidad exacta
export const getTodayStr = getLocalCalendarDate;

export function isStreakLitToday(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const today = getLocalCalendarDate();
    const claimed = localStorage.getItem(STREAK_CLAIMED_KEY) || localStorage.getItem(LEGACY_STREAK_KEY);
    return claimed === today;
  } catch {
    return false;
  }
}

// Función atómica para reclamar racha diaria con validación estricta de continuidad
export function claimDailyStreakAtomic(currentStreak: number): { updated: boolean; newStreak: number } {
  const today = getLocalCalendarDate();
  const lastClaimed = typeof window !== 'undefined'
    ? (localStorage.getItem(STREAK_CLAIMED_KEY) || localStorage.getItem(LEGACY_STREAK_KEY))
    : null;

  // Si ya se reclamó hoy en hora local, no permitir duplicar
  if (lastClaimed === today) {
    return { updated: false, newStreak: currentStreak };
  }

  // Guardado síncrono atómico previo a cualquier actualización de UI
  try {
    localStorage.setItem(STREAK_CLAIMED_KEY, today);
    localStorage.setItem(LEGACY_STREAK_KEY, today);
  } catch {}

  const yesterday = getYesterdayCalendarDate();
  // Si reclamó ayer, suma +1. Si es primera vez o perdió la continuidad de días, arranca en 1.
  const newStreak = lastClaimed === yesterday ? currentStreak + 1 : 1;

  return { updated: true, newStreak };
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