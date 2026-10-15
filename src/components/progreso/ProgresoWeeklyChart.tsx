import React from 'react';
import { BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MinutesTooltip } from './ProgresoChartsTooltips';

interface ProgresoWeeklyChartProps {
  weeklyMinutesData: { day: string; minutes: number; isToday?: boolean }[];
  totalWeeklyMinutes: number;
  avgDailyMinutes: number;
  zenMode?: boolean;
}

export const ProgresoWeeklyChart: React.FC<ProgresoWeeklyChartProps> = ({
  weeklyMinutesData,
  totalWeeklyMinutes,
  avgDailyMinutes,
  zenMode = false,
}) => {
  return (
    <div className={`rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors ${
      zenMode
        ? 'bg-[#1b1c1e] border border-[#2e3138]'
        : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
          }`}>
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-heading font-bold text-base ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              Resumen Semanal
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Minutos de práctica por día
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-heading font-extrabold text-lg block leading-none ${
            zenMode ? 'text-[#e5b83b]' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {totalWeeklyMinutes} min
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            ~{avgDailyMinutes} min/día
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-40 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyMinutesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={zenMode ? '#2e3138' : '#e2e8f0'} className={zenMode ? '' : 'dark:opacity-10'} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 600, fill: zenMode ? '#8e95a5' : '#94a3b8' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: zenMode ? '#8e95a5' : '#94a3b8' }} 
            />
            <Tooltip content={<MinutesTooltip zenMode={zenMode} />} />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
              {weeklyMinutesData.map((entry, index) => {
                const isToday = entry.isToday ?? (index === weeklyMinutesData.length - 1);
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={zenMode ? (isToday ? '#e5b83b' : '#3d434f') : (isToday ? '#10b981' : '#4648d4')} 
                    opacity={isToday ? 1 : 0.85}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
