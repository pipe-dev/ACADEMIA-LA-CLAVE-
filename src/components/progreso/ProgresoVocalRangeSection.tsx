import React from 'react';
import { Mic } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { audioService } from '../../utils/audioService';
import { calculateOctaves, getVocalRangeHistory, VocalRangeData } from '../../utils/vocalRangeHelper';
import { VocalRangeTooltip } from './ProgresoChartsTooltips';

interface ProgresoVocalRangeSectionProps {
  savedVocalRange: VocalRangeData | null;
  onOpenVocalRangeModal?: () => void;
  zenMode?: boolean;
}

export const ProgresoVocalRangeSection: React.FC<ProgresoVocalRangeSectionProps> = ({
  savedVocalRange: propSavedRange,
  onOpenVocalRangeModal,
  zenMode = false,
}) => {
  const [activeRange, setActiveRange] = React.useState<VocalRangeData | null>(propSavedRange);
  const [history, setHistory] = React.useState(() => getVocalRangeHistory(propSavedRange));

  React.useEffect(() => {
    setActiveRange(propSavedRange);
    setHistory(getVocalRangeHistory(propSavedRange));
  }, [propSavedRange]);

  React.useEffect(() => {
    const handleRangeUpdate = () => {
      try {
        const raw = localStorage.getItem('laclave_vocal_range_saved');
        const parsed = raw ? (JSON.parse(raw) as VocalRangeData) : null;
        setActiveRange(parsed);
        setHistory(getVocalRangeHistory(parsed));
      } catch {}
    };

    window.addEventListener('laclave_vocal_range_updated', handleRangeUpdate);
    return () => {
      window.removeEventListener('laclave_vocal_range_updated', handleRangeUpdate);
    };
  }, []);

  const octavesText = calculateOctaves(activeRange);

  // If there is only 1 test, duplicate it as 'Inicio' and 'Actual' so Recharts can draw the vocal span area
  const chartData = history.length === 1
    ? [
        { ...history[0], week: 'Inicio' },
        { ...history[0], week: 'Actual' },
      ]
    : history.map((h) => ({
        week: h.label,
        minPitch: h.minPitch,
        maxPitch: h.maxPitch,
        noteMin: h.noteMin,
        noteMax: h.noteMax,
        rangeLabel: h.rangeLabel,
      }));

  const hasHistory = chartData.length > 0;

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
              : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
          }`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-heading font-bold text-base ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              Progreso de Rango Vocal
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Extensión de notas y tesitura
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
          zenMode
            ? 'text-[#e5b83b] bg-[#26292f] border-[#e5b83b]/40'
            : 'text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800'
        }`}>
          {octavesText}
        </span>
      </div>

      {/* Current Range Highlights */}
      <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl border ${
        zenMode
          ? 'bg-[#22252a] border-[#2e3138]'
          : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-100 dark:border-slate-800'
      }`}>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nota Más Grave</span>
          <span className={`font-heading font-extrabold text-sm ${
            zenMode ? 'text-[#ded9cf]' : 'text-indigo-600 dark:text-indigo-400'
          }`}>
            {activeRange ? activeRange.noteMin : '--'}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nota Más Aguda</span>
          <span className={`font-heading font-extrabold text-sm ${
            zenMode ? 'text-[#e5b83b]' : 'text-purple-600 dark:text-purple-400'
          }`}>
            {activeRange ? activeRange.noteMax : '--'}
          </span>
        </div>
      </div>

      {/* Live Vocal Range Test CTA Button */}
      {onOpenVocalRangeModal && (
        <button
          onClick={() => {
            audioService.playClickSound();
            onOpenVocalRangeModal();
          }}
          className={`w-full py-3 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 ${
            zenMode
              ? 'bg-[#e5b83b]  text-[#161719] shadow-[0_4px_0_0_#9a7212] font-black'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600   text-white '
          }`}
        >
          <Mic className="w-4 h-4 animate-bounce" />
          <span>Evaluar mi Rango</span>
        </button>
      )}

      {/* Vocal Range Evolution Chart or Clean Empty State */}
      <div className="h-48 w-full pt-1">
        {hasHistory ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="vocalMaxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={zenMode ? '#e5b83b' : '#a855f7'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={zenMode ? '#e5b83b' : '#a855f7'} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="vocalMinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={zenMode ? '#525968' : '#6366f1'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={zenMode ? '#525968' : '#6366f1'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={zenMode ? '#2e3138' : '#e2e8f0'} className={zenMode ? '' : 'dark:opacity-10'} />
              <XAxis 
                dataKey="week" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 600, fill: zenMode ? '#8e95a5' : '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: zenMode ? '#8e95a5' : '#94a3b8' }} 
                tickFormatter={(hz) => `${Math.round(hz)}Hz`}
              />
              <Tooltip content={<VocalRangeTooltip zenMode={zenMode} />} />
              <Area 
                type="monotone" 
                dataKey="maxPitch" 
                name="Nota Aguda"
                stroke={zenMode ? '#e5b83b' : '#a855f7'} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#vocalMaxGradient)" 
                dot={{ r: 4, fill: zenMode ? '#e5b83b' : '#a855f7', strokeWidth: 2, stroke: zenMode ? '#161719' : '#ffffff' }}
                animationDuration={400}
              />
              <Area 
                type="monotone" 
                dataKey="minPitch" 
                name="Nota Grave"
                stroke={zenMode ? '#8e95a5' : '#6366f1'} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#vocalMinGradient)" 
                dot={{ r: 4, fill: zenMode ? '#8e95a5' : '#6366f1', strokeWidth: 2, stroke: zenMode ? '#161719' : '#ffffff' }}
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-full w-full rounded-2xl flex flex-col items-center justify-center text-center p-4 border border-dashed ${
            zenMode ? 'border-[#383c44] bg-[#161719]/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20'
          }`}>
            <div className={`p-2.5 rounded-full mb-2 ${zenMode ? 'bg-[#26292f] text-[#e5b83b]' : 'bg-purple-50 dark:bg-purple-950/60 text-purple-500'}`}>
              <Mic className="w-5 h-5" />
            </div>
            <p className={`font-heading font-bold text-xs ${zenMode ? 'text-[#ded9cf]' : 'text-slate-700 dark:text-slate-300'}`}>
              Sin evaluaciones registradas
            </p>
            <p className="text-[11px] text-slate-400 font-medium max-w-xs mt-1">
              Presiona el botón para cantar tus notas más graves y agudas con el micrófono y ver tu rango aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
