import React from 'react';
import { Clock, CheckCircle2, Flame, Music, Award } from 'lucide-react';

export const getBadgeIcon = (iconName: string, unlocked: boolean) => {
  const className = `w-6 h-6 ${unlocked ? 'text-amber-500 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`;
  switch (iconName) {
    case 'Clock': return <Clock className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Music': return <Music className={className} />;
    case 'Award': return <Award className={className} />;
    default: return <Award className={className} />;
  }
};

export const CustomTooltip = ({ active, payload, label, zenMode }: any) => {
  if (active && payload && payload.length) {
    const xpVal = payload[0].value;
    const dayLabel = label || payload[0].payload?.day || 'Día';
    const totalXp = payload[0].payload?.totalXp;
    return (
      <div className={`p-3 rounded-2xl shadow-xl text-xs space-y-1 backdrop-blur-md ${
        zenMode
          ? 'bg-[#1b1c1e]/95 text-[#f0ebe1] border-2 border-[#e5b83b]/60'
          : 'bg-slate-900/95 dark:bg-[#0f1d2e] text-white border-2 border-indigo-500/80'
      }`}>
        <div className={`flex items-center justify-between gap-3 border-b pb-1 ${
          zenMode ? 'border-[#2e3138]' : 'border-slate-800/80'
        }`}>
          <span className={`font-extrabold uppercase tracking-wider ${
            zenMode ? 'text-[#e5b83b]' : 'text-indigo-300'
          }`}>{dayLabel}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            zenMode ? 'bg-[#26292f] text-[#e5b83b]' : 'bg-indigo-500/30 text-indigo-200'
          }`}>
            {payload[0].payload?.isToday ? 'Hoy' : (payload[0].payload?.fullDayName || 'Día de práctica')}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className={`font-heading font-extrabold text-lg ${
            zenMode ? 'text-[#e5b83b]' : 'text-emerald-400'
          }`}>{xpVal.toLocaleString()}</span>
          <span className={`font-bold text-[11px] ${
            zenMode ? 'text-[#9ea3ae]' : 'text-slate-300'
          }`}>XP {xpVal === 0 ? '(Sin actividad)' : 'ganados'}</span>
        </div>
        {totalXp !== undefined && (
          <p className="text-[10px] text-slate-400 font-medium">
            Total acumulado: {totalXp} XP
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const MinutesTooltip = ({ active, payload, label, zenMode }: any) => {
  if (active && payload && payload.length) {
    const mins = payload[0].value;
    const dayLabel = label || payload[0].payload?.day || 'Día';
    return (
      <div className={`p-3 rounded-2xl shadow-xl text-xs space-y-1 backdrop-blur-md ${
        zenMode
          ? 'bg-[#1b1c1e]/95 text-[#f0ebe1] border-2 border-[#e5b83b]/60'
          : 'bg-slate-900/95 dark:bg-[#0f1d2e] text-white border-2 border-emerald-500/80'
      }`}>
        <div className={`flex items-center justify-between gap-3 border-b pb-1 ${
          zenMode ? 'border-[#2e3138]' : 'border-slate-800/80'
        }`}>
          <span className={`font-extrabold uppercase tracking-wider ${
            zenMode ? 'text-[#e5b83b]' : 'text-emerald-300'
          }`}>{dayLabel}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            zenMode ? 'bg-[#26292f] text-[#e5b83b]' : 'bg-emerald-500/30 text-emerald-200'
          }`}>
            Tiempo de Canto
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className={`font-heading font-extrabold text-lg ${
            zenMode ? 'text-[#e5b83b]' : 'text-emerald-400'
          }`}>{mins} min</span>
          <span className={`font-bold text-[11px] ${
            zenMode ? 'text-[#9ea3ae]' : 'text-slate-300'
          }`}>practicados</span>
        </div>
      </div>
    );
  }
  return null;
};

export const VocalRangeTooltip = ({ active, payload, label, zenMode }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0]?.payload;
    if (!dataItem) return null;
    return (
      <div className={`p-3 rounded-2xl shadow-xl text-xs space-y-1 backdrop-blur-md ${
        zenMode
          ? 'bg-[#1b1c1e]/95 text-[#f0ebe1] border border-[#e5b83b]/50'
          : 'bg-[#0b1828]/95 border border-indigo-500/40 text-white'
      }`}>
        <div className={`flex items-center justify-between gap-3 border-b pb-1 ${
          zenMode ? 'border-[#2e3138]' : 'border-slate-700/80'
        }`}>
          <span className={`font-heading font-extrabold ${
            zenMode ? 'text-[#e5b83b]' : 'text-indigo-300'
          }`}>{label}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            zenMode ? 'bg-[#26292f] text-[#e5b83b]' : 'bg-indigo-500/30 text-indigo-200'
          }`}>
            {dataItem.rangeLabel}
          </span>
        </div>
        <div className="pt-1 space-y-0.5">
          <p className={zenMode ? 'text-[#ded9cf]' : 'text-slate-300'}>
            Nota Grave: <strong className={`font-extrabold ${zenMode ? 'text-[#ded9cf]' : 'text-indigo-400'}`}>{dataItem.noteMin}</strong>
          </p>
          <p className={zenMode ? 'text-[#ded9cf]' : 'text-slate-300'}>
            Nota Aguda: <strong className={`font-extrabold ${zenMode ? 'text-[#e5b83b]' : 'text-purple-400'}`}>{dataItem.noteMax}</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};
