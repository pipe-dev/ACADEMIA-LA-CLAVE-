'use client';
import React from 'react';
import { Search, UserPlus, Sparkles } from 'lucide-react';

interface AddFriendFormProps {
  inputCode: string;
  setInputCode: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  feedbackMsg: { text: string; type: 'success' | 'error' | 'info' } | null;
  zenMode?: boolean;
}

export const AddFriendForm: React.FC<AddFriendFormProps> = ({
  inputCode,
  setInputCode,
  onSubmit,
  feedbackMsg,
  zenMode = false
}) => {
  return (
    <form onSubmit={onSubmit} className={`rounded-3xl p-4 shadow-xs space-y-3 transition-colors ${
      zenMode
        ? 'bg-[#1b1c1e] border border-[#2e3138]'
        : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
    }`}>
      <label className={`block text-xs font-bold ${zenMode ? 'text-[#ded9cf]' : 'text-slate-700 dark:text-slate-300'}`}>
        Agregar Amigo por Código
      </label>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Ej: CANTO-9941 o VOCAL-2026"
            className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-hidden uppercase font-mono tracking-wide ${
              zenMode
                ? 'bg-[#161719] border border-[#2e3138] text-[#f0ebe1] focus:border-[#e5b83b]'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 text-[#0b1c30] dark:text-[#d3e4fe] focus:border-indigo-500'
            }`}
          />
        </div>

        <button
          type="submit"
          className={`py-2.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 ${
            zenMode
              ? 'bg-[#e5b83b] hover:bg-[#d6a930] text-[#161719] font-black'
              : 'bg-[#4648d4] hover:bg-indigo-600 text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar</span>
        </button>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : feedbackMsg.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-[10px] text-slate-400 font-semibold">
          Códigos de demostración:
        </span>
        <button
          type="button"
          onClick={() => setInputCode('VOCAL-2026')}
          className={`text-[10px] font-bold underline cursor-pointer ${
            zenMode ? 'text-[#e5b83b] hover:text-[#f5d56b]' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800'
          }`}
        >
          VOCAL-2026
        </button>
        <span className="text-slate-500 text-[10px]">|</span>
        <button
          type="button"
          onClick={() => setInputCode('CANTO-9941')}
          className={`text-[10px] font-bold underline cursor-pointer ${
            zenMode ? 'text-[#e5b83b] hover:text-[#f5d56b]' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800'
          }`}
        >
          CANTO-9941
        </button>
      </div>
    </form>
  );
};
