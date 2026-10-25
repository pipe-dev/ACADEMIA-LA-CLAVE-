import { useEffect, useState } from 'react';

/**
 * Temporadas decorativas configurables por rango de fechas (Mes-Día, ambas incluidas).
 * Halloween: 15 de octubre -> 2 de noviembre.
 */
export type SeasonalEvent = 'halloween';

interface SeasonalEventRange {
  key: SeasonalEvent;
  start: string;
  end: string;
}

const SEASONAL_EVENT_RANGES: SeasonalEventRange[] = [
  { key: 'halloween', start: '10-15', end: '11-02' },
];

const toMonthDay = (date: Date): number => (date.getMonth() + 1) * 100 + date.getDate();
const parseRange = (range: string): number => {
  const [month = 0, day = 0] = range.split('-').map(Number);
  return month * 100 + day;
};

/** Verifica si un evento estacional está activo en la fecha indicada. */
export function isSeasonalEventActive(key: SeasonalEvent, now: Date = new Date()): boolean {
  const range = SEASONAL_EVENT_RANGES.find((event) => event.key === key);
  if (!range) return false;
  const monthDay = toMonthDay(now);
  return monthDay >= parseRange(range.start) && monthDay <= parseRange(range.end);
}

/** Hook que activa el evento solo del lado del cliente (evita desajustes de SSR/anio o zona horaria). */
export function useSeasonalEventActive(key: SeasonalEvent): boolean {
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    setIsActive(isSeasonalEventActive(key));
  }, [key]);
  return isActive;
}
