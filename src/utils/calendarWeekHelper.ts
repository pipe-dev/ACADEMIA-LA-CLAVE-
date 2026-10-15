import { getTodayStr } from './streakPrompt';

export interface CalendarWeekDay {
  dayIndex: number;      // 0 = Lunes, 6 = Domingo
  dayLabel: string;      // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
  chartLabel: string;    // 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'
  fullDayName: string;   // 'Lunes', 'Martes', ...
  dateStr: string;       // 'YYYY-MM-DD'
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  minutes: number;
  isActive: boolean;
}

export interface CurrentWeekData {
  days: CalendarWeekDay[];
  activeDaysCount: number;
  totalWeeklyMinutes: number;
  avgDailyMinutes: number;
  currentDayName: string;
  todayStr: string;
}

const SHORT_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CHART_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const FULL_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function getCalendarWeekData(todayLiveMinutes: number = 0): CurrentWeekData {
  const now = new Date();
  const todayStr = getTodayStr();

  // In JavaScript: getDay() 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Convert to Monday = 0, Tuesday = 1 ... Sunday = 6
  const jsDay = now.getDay();
  const mondayOffset = (jsDay + 6) % 7;

  // Compute Monday of current week in local time
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);

  // Read saved logs
  let practiceLog: Record<string, number> = {};
  let activeDates: string[] = [];
  try {
    if (typeof window !== 'undefined') {
      const savedLog = localStorage.getItem('laclave_daily_practice_log_v1');
      if (savedLog) practiceLog = JSON.parse(savedLog);

      const savedActive = localStorage.getItem('laclave_active_dates_log');
      if (savedActive) activeDates = JSON.parse(savedActive);
    }
  } catch {}

  const days: CalendarWeekDay[] = [];
  let totalWeeklyMinutes = 0;
  let activeDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;

    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    let minutes = 0;
    if (isToday) {
      minutes = Math.max(0, todayLiveMinutes);
    } else if (isPast) {
      minutes = Math.max(0, practiceLog[dateStr] || 0);
    }

    const isActive = minutes > 0 || activeDates.includes(dateStr);
    if (isActive) {
      activeDaysCount++;
    }

    totalWeeklyMinutes += minutes;

    days.push({
      dayIndex: i,
      dayLabel: SHORT_LABELS[i],
      chartLabel: CHART_LABELS[i],
      fullDayName: FULL_NAMES[i],
      dateStr,
      isToday,
      isPast,
      isFuture,
      minutes,
      isActive,
    });
  }

  // Days elapsed in the current week up to today (1 for Monday, up to 7 for Sunday)
  const daysElapsedThisWeek = mondayOffset + 1;
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / Math.max(1, daysElapsedThisWeek));

  const currentDayName = FULL_NAMES[mondayOffset] || 'Hoy';

  return {
    days,
    activeDaysCount,
    totalWeeklyMinutes,
    avgDailyMinutes,
    currentDayName,
    todayStr,
  };
}

export function recordDayPracticeMinutes(minutesToAdd: number): void {
  try {
    if (typeof window === 'undefined') return;
    const todayStr = getTodayStr();
    const savedLog = localStorage.getItem('laclave_daily_practice_log_v1');
    const log: Record<string, number> = savedLog ? JSON.parse(savedLog) : {};
    log[todayStr] = (log[todayStr] || 0) + minutesToAdd;
    localStorage.setItem('laclave_daily_practice_log_v1', JSON.stringify(log));

    // Also mark in active dates log
    const savedActive = localStorage.getItem('laclave_active_dates_log');
    const activeList: string[] = savedActive ? JSON.parse(savedActive) : [];
    if (!activeList.includes(todayStr)) {
      activeList.push(todayStr);
      localStorage.setItem('laclave_active_dates_log', JSON.stringify(activeList));
    }
  } catch {}
}
