'use client';
import React from 'react';
import { ShieldCheck, Terminal, Check, Copy, Trash2 } from 'lucide-react';
import { LogEntry } from '../../utils/logger';

interface SettingsDiagnosticLogsProps {
  logs: LogEntry[];
  showLogs: boolean;
  onToggleShowLogs: () => void;
  onCopyLogs: () => void;
  logsCopied: boolean;
  onClearLogs: () => void;
}

export const SettingsDiagnosticLogs: React.FC<SettingsDiagnosticLogsProps> = ({
  logs,
  showLogs,
  onToggleShowLogs,
  onCopyLogs,
  logsCopied,
  onClearLogs,
}) => {
  return (
    <>
      <div className="bg-[#eff4ff] dark:bg-slate-800/60 p-3.5 rounded-2xl border border-indigo-100 dark:border-slate-700 flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff] shrink-0" />
        <span className="font-medium">Tus datos de voz se procesan localmente de forma privada.</span>
      </div>

      {/* Diagnostics & Logs Section */}
      <div className="bg-slate-900/90 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Historial & Logs de Sistema</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
              {logs.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopyLogs}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
            >
              {logsCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-300" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClearLogs}
              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-800/60"
              title="Limpiar registro de logs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>

            <button
              type="button"
              onClick={onToggleShowLogs}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              {showLogs ? 'Ocultar' : 'Ver Logs'}
            </button>
          </div>
        </div>

        {showLogs && (
          <div className="text-[10px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No hay logs registrados en esta sesión.</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="leading-tight border-b border-slate-900/80 pb-1">
                  <span className="text-slate-500">[{l.timestamp}]</span>{' '}
                  <span
                    className={
                      l.level === 'error'
                        ? 'text-rose-400 font-bold'
                        : l.level === 'warn'
                        ? 'text-amber-400 font-bold'
                        : 'text-indigo-300'
                    }
                  >
                    [{l.category}]
                  </span>{' '}
                  <span className="text-slate-200">{l.message}</span>
                  {l.details && (
                    <div className="text-slate-500 text-[9px] pl-2 break-all">
                      {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};
