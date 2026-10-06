import { getTodayStr } from './streakPrompt';

export interface XpDayPoint {
  day: string;          // Short day label: 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'
  fullDayName: string;  // 'Lunes', 'Martes', ...
  dateStr: string;      // 'YYYY-MM-DD'
  xp: number;           // Daily XP earned on that day (0 if nothing done)
  earned: number;       // XP earned on that day
  totalXp?: number;     // Total cumulative XP at the end of that day
  isToday: boolean;
}

export interface XpEvolutionData {
  points: XpDayPoint[];
  totalXp: number;
  xpGained: number;
}

const SHORT_LABELS_BY_DAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FULL_NAMES_BY_DAY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DAILY_XP_LOG_KEY = 'laclave_daily_xp_log_v1';
const DAILY_XP_SNAPSHOTS_KEY = 'laclave_daily_xp_snapshots_v1';

/**
 * Records XP gained today and optionally updates today's total XP snapshot.
 */
export function recordDailyXpGain(amount: number, newTotalXp?: number): void {
  if (amount <= 0 || typeof window === 'undefined') return;
  try {
    const todayStr = getTodayStr();
    
    // 1. Record daily earned XP log
    const savedLog = localStorage.getItem(DAILY_XP_LOG_KEY);
    const log: Record<string, number> = savedLog ? JSON.parse(savedLog) : {};
    log[todayStr] = (log[todayStr] || 0) + amount;
    localStorage.setItem(DAILY_XP_LOG_KEY, JSON.stringify(log));

    // 2. Record daily total XP snapshot if provided
    if (typeof newTotalXp === 'number') {
      const savedSnapshots = localStorage.getItem(DAILY_XP_SNAPSHOTS_KEY);
      const snapshots: Record<string, number> = savedSnapshots ? JSON.parse(savedSnapshots) : {};
      snapshots[todayStr] = newTotalXp;
      localStorage.setItem(DAILY_XP_SNAPSHOTS_KEY, JSON.stringify(snapshots));
    }
  } catch {}
}

/**
 * Records a snapshot of the current total XP for today.
 */
export function recordDailyXpSnapshot(totalXp: number): void {
  if (typeof window === 'undefined') return;
  try {
    const todayStr = getTodayStr();
    const savedSnapshots = localStorage.getItem(DAILY_XP_SNAPSHOTS_KEY);
    const snapshots: Record<string, number> = savedSnapshots ? JSON.parse(savedSnapshots) : {};
    snapshots[todayStr] = totalXp;
    localStorage.setItem(DAILY_XP_SNAPSHOTS_KEY, JSON.stringify(snapshots));
  } catch {}
}

/**
 * Computes the real XP evolution over the rolling last 7 days ending today.
 */
export function getXpEvolutionData(currentTotalXp: number = 0): XpEvolutionData {
  const safeTotalXp = Math.max(0, currentTotalXp || 0);
  const now = new Date();
  const todayStr = getTodayStr();

  // Read saved logs
  let dailyLog: Record<string, number> = {};
  let snapshots: Record<string, number> = {};
  try {
    if (typeof window !== 'undefined') {
      const savedLog = localStorage.getItem(DAILY_XP_LOG_KEY);
      if (savedLog) dailyLog = JSON.parse(savedLog);

      const savedSnapshots = localStorage.getItem(DAILY_XP_SNAPSHOTS_KEY);
      if (savedSnapshots) snapshots = JSON.parse(savedSnapshots);
    }
  } catch {}

  // Save/refresh today's snapshot
  snapshots[todayStr] = safeTotalXp;

  // Generate 7 days ending today: offset -6 to 0
  const daysList: { dateStr: string; dayLabel: string; fullDayName: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;
    const jsDay = d.getDay(); // 0 is Sunday
    daysList.push({
      dateStr,
      dayLabel: SHORT_LABELS_BY_DAY[jsDay],
      fullDayName: FULL_NAMES_BY_DAY[jsDay],
      isToday: dateStr === todayStr,
    });
  }

  // 1. Reconstruct cumulative total XP at the end of each day
  const cumulativeValues = new Array<number>(7);
  cumulativeValues[6] = safeTotalXp;

  for (let idx = 5; idx >= 0; idx--) {
    const dateStr = daysList[idx].dateStr;
    const nextDateStr = daysList[idx + 1].dateStr;
    const loggedInNext = dailyLog[nextDateStr];

    if (snapshots[dateStr] !== undefined) {
      cumulativeValues[idx] = snapshots[dateStr];
    } else if (loggedInNext !== undefined) {
      cumulativeValues[idx] = Math.max(0, cumulativeValues[idx + 1] - loggedInNext);
    } else {
      cumulativeValues[idx] = cumulativeValues[idx + 1];
    }
  }

  // 2. Compute DAILY XP earned for each day
  // If no activity happened on a day, daily XP earned is strictly 0!
  const dailyXpEarned = new Array<number>(7);

  for (let idx = 0; idx < 7; idx++) {
    const dateStr = daysList[idx].dateStr;
    if (dailyLog[dateStr] !== undefined) {
      dailyXpEarned[idx] = Math.max(0, dailyLog[dateStr]);
    } else if (idx > 0) {
      const diff = cumulativeValues[idx] - cumulativeValues[idx - 1];
      dailyXpEarned[idx] = Math.max(0, diff);
    } else {
      dailyXpEarned[idx] = 0;
    }
  }

  // If today is today and dailyLog[todayStr] is not explicitly logged, but safeTotalXp > cumulativeValues[5]:
  if (dailyLog[todayStr] === undefined && safeTotalXp > cumulativeValues[5]) {
    dailyXpEarned[6] = safeTotalXp - cumulativeValues[5];
  }

  const points: XpDayPoint[] = daysList.map((d, idx) => ({
    day: d.dayLabel,
    fullDayName: d.fullDayName,
    dateStr: d.dateStr,
    xp: dailyXpEarned[idx],
    earned: dailyXpEarned[idx],
    totalXp: cumulativeValues[idx],
    isToday: d.isToday,
  }));

  const xpGained = points.reduce((acc, p) => acc + p.xp, 0);

  return {
    points,
    totalXp: safeTotalXp,
    xpGained,
  };
}
