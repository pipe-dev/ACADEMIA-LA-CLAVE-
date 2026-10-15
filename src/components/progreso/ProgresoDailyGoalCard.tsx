import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

interface ProgresoDailyGoalCardProps {
  currentPracticeMinutes: number;
  dailyGoalMinutes: number;
  onSelectGoal: (minutes: number) => void;
  zenMode?: boolean;
}

export const ProgresoDailyGoalCard: React.FC<ProgresoDailyGoalCardProps> = ({
  currentPracticeMinutes,
  dailyGoalMinutes,
  onSelectGoal,
  zenMode = false,
}) => {
  const goalPercentage = Math.min(100, Math.round((currentPracticeMinutes / dailyGoalMinutes) * 100));
  const isGoalReached = goalPercentage >= 100;

  // SVG Circular Ring Math
  const circleRadius = 40;
  const circleCircumference = 2 * Math.PI * circleRadius; // ~251.32
  const strokeDashoffset = circleCircumference - (circleCircumference * goalPercentage) / 100;

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
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4648d4] dark:text-[#c0c1ff]'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-heading font-extrabold text-base ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              Meta de Práctica Diaria
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Tu objetivo de minutos hoy
            </p>
          </div>
        </div>
        {isGoalReached && (
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border animate-pulse ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/40'
              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
          }`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-600 dark:text-emerald-400'}`} /> Meta lograda
          </span>
        )}
      </div>

      {/* Circular Progress Display & Details */}
      <div className="flex items-center gap-4 pt-1">
        {/* Circular Ring SVG */}
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r={circleRadius}
              className={zenMode ? '' : 'stroke-slate-100 dark:stroke-slate-800'}
              stroke={zenMode ? '#2e3138' : undefined}
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r={circleRadius}
              className={`transition-all duration-700 ease-out ${zenMode ? '' : 'stroke-[#4648d4] dark:stroke-[#6063ee]'}`}
              stroke={zenMode ? '#e5b83b' : undefined}
              strokeWidth="8"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Inner Content inside Circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            <span className={`font-heading font-extrabold text-xl leading-tight ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              {currentPracticeMinutes}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              de {dailyGoalMinutes} min
            </span>
          </div>
        </div>

        {/* Goal Selector Buttons */}
        <div className="flex-1 space-y-2">
          <div className={`text-xs font-bold ${zenMode ? 'text-[#ded9cf]' : 'text-slate-600 dark:text-slate-300'}`}>
            Ajusta tu meta diaria:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[10, 15, 30, 60].map((mins) => {
              const isSelected = dailyGoalMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSelectGoal(mins)}
                  className={`py-2 px-2.5 rounded-2xl text-xs font-heading font-bold border press-effect transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? (zenMode
                          ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-xs font-black'
                          : 'bg-[#4648d4] text-white border-[#3b3dbf] shadow-md shadow-indigo-500/20')
                      : (zenMode
                          ? 'bg-[#22252a] text-[#ded9cf] border-[#2e3138] hover:bg-[#2c2f35]'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800')
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{mins} min</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
