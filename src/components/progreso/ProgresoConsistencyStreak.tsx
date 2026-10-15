import React from 'react';
import { Flame } from 'lucide-react';
import { CalendarWeekDay } from '@/utils/calendarWeekHelper';

interface ProgresoConsistencyStreakProps {
  streak: number;
  zenMode?: boolean;
  days?: CalendarWeekDay[];
  activeDaysCount?: number;
}

export const ProgresoConsistencyStreak: React.FC<ProgresoConsistencyStreakProps> = ({
  streak,
  zenMode = false,
  days,
  activeDaysCount,
}) => {
  const displayActiveCount = typeof activeDaysCount === 'number' ? activeDaysCount : Math.min(7, streak);

  const daysToRender = days || ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayLabel, idx) => ({
    dayLabel,
    isActive: idx < Math.min(7, streak),
    isToday: idx === Math.min(6, streak - 1),
  }));

  return (
    <div className={`rounded-3xl p-4 shadow-sm space-y-2 ${
      zenMode
        ? 'bg-[#1b1c1e] border border-[#2e3138]'
        : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
    }`}>
      <div className="flex items-center justify-between text-xs font-bold px-1">
        <span className={`flex items-center gap-1.5 ${
          zenMode ? 'text-[#e5b83b]' : 'text-orange-600 dark:text-orange-400'
        }`}>
          <Flame className={`w-4 h-4 ${zenMode ? 'fill-[#e5b83b] text-[#e5b83b]' : 'fill-orange-500'}`} />
          <span>Constancia Semanal</span>
        </span>
        <span className="text-slate-400 font-medium">
          {displayActiveCount} de 7 días activos
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {daysToRender.map((dayItem, idx) => {
          const isCompletedDay = dayItem.isActive;
          const isToday = dayItem.isToday;
          return (
            <div
              key={dayItem.dayLabel + idx}
              className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
                isToday
                  ? (zenMode
                      ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-xs font-black'
                      : 'bg-gradient-to-b from-orange-500 to-amber-500 text-white border-orange-600 shadow-md scale-105')
                  : isCompletedDay
                  ? (zenMode
                      ? 'bg-[#26292f] text-[#e5b83b] border-[#383c44]'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700')
                  : (zenMode
                      ? 'bg-[#161719] text-[#555a64] border-[#2e3138]'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800')
              }`}
            >
              <span className="text-[10px] font-extrabold opacity-80">{dayItem.dayLabel}</span>
              {isCompletedDay ? (
                <Flame className={`w-4 h-4 mt-1 ${
                  zenMode
                    ? (isToday ? 'fill-[#161719] text-[#161719]' : 'fill-[#e5b83b] text-[#e5b83b]')
                    : (isToday ? 'fill-white text-white' : 'fill-orange-500 text-orange-500')
                }`} />
              ) : (
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  isToday
                    ? (zenMode ? 'bg-[#161719]' : 'bg-white')
                    : (zenMode ? 'bg-[#2e3138]' : 'bg-slate-300 dark:bg-slate-700')
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
