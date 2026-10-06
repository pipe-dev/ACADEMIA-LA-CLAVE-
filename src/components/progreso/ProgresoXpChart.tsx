import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CustomTooltip } from './ProgresoChartsTooltips';

interface ProgresoXpChartProps {
  xpData: { day: string; xp: number; dateStr?: string; fullDayName?: string; earned?: number; isToday?: boolean }[];
  xpGained?: number;
  zenMode?: boolean;
}

export const ProgresoXpChart: React.FC<ProgresoXpChartProps> = ({
  xpData,
  xpGained: xpGainedProp,
  zenMode = false,
}) => {
  const xpGained = typeof xpGainedProp === 'number' 
    ? xpGainedProp 
    : xpData.reduce((acc, curr) => acc + (curr.xp || 0), 0);

  return (
    <div className={`rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors ${
      zenMode
        ? 'bg-[#1b1c1e] border border-[#2e3138]'
        : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-[#4648d4] dark:text-[#c0c1ff]'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-heading font-bold text-base ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              Evolución de XP
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Últimos 7 días
            </p>
          </div>
        </div>
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
          zenMode
            ? 'text-[#e5b83b] bg-[#26292f] border border-[#e5b83b]/30'
            : 'text-[#4648d4] dark:text-[#c0c1ff] bg-indigo-50 dark:bg-indigo-900/40'
        }`}>
          +{xpGained} XP
        </span>
      </div>

      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={xpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={zenMode ? '#e5b83b' : '#4648d4'} stopOpacity={0.4} />
                <stop offset="95%" stopColor={zenMode ? '#e5b83b' : '#4648d4'} stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              domain={[
                0,
                (dataMax: number) => Math.max(50, Math.ceil((dataMax + 20) / 25) * 25)
              ]}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip zenMode={zenMode} />} />
            <Area 
              type="monotone" 
              dataKey="xp" 
              stroke={zenMode ? '#e5b83b' : '#4648d4'} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#xpGradient)"
              dot={{ r: 4, fill: zenMode ? '#e5b83b' : '#4648d4', strokeWidth: 2, stroke: zenMode ? '#161719' : '#ffffff' }}
              activeDot={{ r: 7, fill: zenMode ? '#f5d56b' : '#6cf8bb', strokeWidth: 3, stroke: zenMode ? '#161719' : '#005236' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
