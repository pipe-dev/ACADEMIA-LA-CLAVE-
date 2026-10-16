import React from 'react';
import { History, CheckCircle2 } from 'lucide-react';
import { audioService } from '../../utils/audioService';
import { TunedHistoryItem } from './afinadorTypes';

interface TunerHistorySectionProps {
  tunedHistory: TunedHistoryItem[];
  onClearHistory: () => void;
  zenMode?: boolean;
}

export const TunerHistorySection: React.FC<TunerHistorySectionProps> = ({
  tunedHistory,
  onClearHistory,
  zenMode = false
}) => {
  const handleClear = () => {
    audioService.playClickSound();
    onClearHistory();
  };

  return (
    <div
      id="tour-tuner-history"
      className={`rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors ${
        zenMode
          ? 'bg-[#1b1c1e] border border-[#2e3138]'
          : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl ${
              zenMode
                ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4
              className={`font-heading font-bold text-base ${
                zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
              }`}
            >
              Historial de Precisión
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Últimas 5 notas afinadas con éxito
            </p>
          </div>
        </div>
        {tunedHistory.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {tunedHistory.length === 0 ? (
        <div
          className={`p-4 rounded-2xl border border-dashed text-center space-y-1 ${
            zenMode
              ? 'bg-[#161719] border-[#2e3138]'
              : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800'
          }`}
        >
          <p
            className={`text-xs font-bold ${
              zenMode ? 'text-[#9ea3ae]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sin notas afinadas aún en este historial
          </p>
          <p className="text-[11px] text-slate-400">
            Activa el micrófono y canta una nota con precisión para registrar tus logros.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tunedHistory.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                zenMode
                  ? 'bg-[#22252a] border-[#2e3138] hover:border-[#e5b83b]/40'
                  : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-100 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl font-heading font-extrabold text-xs flex items-center justify-center shadow-xs ${
                    zenMode
                      ? 'bg-[#2e3138] text-[#e5b83b] border border-[#e5b83b]/30'
                      : 'text-white'
                  }`}
                  style={{ backgroundColor: zenMode ? undefined : item.noteColor }}
                >
                  {item.noteName}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        zenMode ? 'text-[#ded9cf]' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.detectedFreq} Hz
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      (Meta: {item.targetFreq} Hz)
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 block">
                    {item.timestamp}
                  </span>
                </div>
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                  zenMode
                    ? 'bg-[#26292f] border-[#e5b83b]/40 text-[#e5b83b]'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'
                  }`}
                />
                <span>{item.diffHz === 0 ? 'Perfecto' : `±${item.diffHz} Hz`}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
