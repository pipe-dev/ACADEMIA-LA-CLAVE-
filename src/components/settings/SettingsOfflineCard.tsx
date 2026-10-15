'use client';
import React from 'react';
import { HardDrive, Wifi, WifiOff, RefreshCw, CheckCircle2, Download } from 'lucide-react';

interface SettingsOfflineCardProps {
  isOnline: boolean;
  offlineDownloading: boolean;
  offlineDownloaded: boolean;
  queueCount: number;
  syncing: boolean;
  onPrecache: () => void;
  onSync: () => void;
  onStartSplash?: () => void;
  onClose: () => void;
}

export const SettingsOfflineCard: React.FC<SettingsOfflineCardProps> = ({
  isOnline,
  offlineDownloading,
  offlineDownloaded,
  queueCount,
  syncing,
  onPrecache,
  onSync,
  onStartSplash,
  onClose,
}) => {
  return (
    <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-[#4648d4]/10 dark:bg-[#4648d4]/20 rounded-xl text-[#4648d4] dark:text-[#c0c1ff]">
            <HardDrive className="w-4 h-4 shrink-0" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe]">
            Modo Offline Completo (Guardado en Caché Local)
          </span>
        </div>
        <span
          className={`text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 w-fit whitespace-nowrap ${
            isOnline
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 animate-pulse'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? 'En Línea (Caché Listo)' : 'Modo Offline (Caché)'}
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Todas las lecciones, afinador, sintetizadores Web Audio y datos de voz se guardan en caché localmente para continuar practicando sin conexión.
      </p>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onPrecache}
          disabled={offlineDownloading}
          className="py-2.5 px-3 bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
        >
          {offlineDownloading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4648d4]" />
          ) : offlineDownloaded ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#4648d4]" />
          )}
          <span>{offlineDownloading ? 'Guardando...' : offlineDownloaded ? 'Contenido Guardado' : 'Guardar Todo'}</span>
        </button>

        <button
          type="button"
          onClick={onSync}
          disabled={syncing || queueCount === 0}
          className="py-2.5 px-3 bg-[#4648d4] text-white hover:bg-[#383aa8] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sincronizando...' : queueCount > 0 ? `Sincronizar (${queueCount})` : 'Sincronizado'}</span>
        </button>
      </div>

      {onStartSplash && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartSplash();
          }}
          className="w-full py-2.5 px-3 bg-[#102034] dark:bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/40 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors mt-2"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Re-descargar todas las secciones con Splash Screen</span>
        </button>
      )}
    </div>
  );
};
