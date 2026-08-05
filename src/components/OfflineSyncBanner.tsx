'use client';
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getOfflineQueue, SyncResult, syncPendingOfflineProgress, cacheAllContentLocally, isContentCachedLocally } from '../utils/offlineSync';
import { UserStats } from '../types';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  userStats: UserStats;
  onUpdateStats: (updated: Partial<UserStats>) => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  userStats,
  onUpdateStats
}) => {
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [syncToast, setSyncToast] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(() => isContentCachedLocally());

  // Listen for queue updates & auto-preload content
  useEffect(() => {
    // Automatically cache content on first load
    if (!isCached) {
      cacheAllContentLocally();
      setIsCached(true);
    }

    const updateQueue = () => {
      setPendingQueueCount(getOfflineQueue().length);
    };

    updateQueue();

    const handleQueueChange = (e: any) => {
      if (e.detail?.queueLength !== undefined) {
        setPendingQueueCount(e.detail.queueLength);
      } else {
        updateQueue();
      }
    };

    const handleSyncComplete = (e: any) => {
      if (e.detail) {
        setSyncToast(e.detail);
        setPendingQueueCount(0);
        setTimeout(() => setSyncToast(null), 5000);
      }
    };

    window.addEventListener('laclave-offline-queue-changed', handleQueueChange);
    window.addEventListener('laclave-sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('laclave-offline-queue-changed', handleQueueChange);
      window.removeEventListener('laclave-sync-complete', handleSyncComplete);
    };
  }, [isCached]);

  // Auto-trigger sync when transitioning to online
  useEffect(() => {
    if (isOnline && pendingQueueCount > 0) {
      handleForceSync();
    }
  }, [isOnline]);

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const { updatedStats, syncResult } = syncPendingOfflineProgress(userStats);
      if (syncResult) {
        onUpdateStats(updatedStats);
        setSyncToast(syncResult);
        setTimeout(() => setSyncToast(null), 5000);
      }
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-2">
      {/* Toast 1: Sync Success Notification */}
      {syncToast && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-slideDown mb-2 border border-emerald-400/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-100">
                Sincronización Completada
              </div>
              <div className="text-xs font-bold leading-tight">
                {syncToast.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-xs font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* Offline Status Pill / Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 backdrop-blur-xs shadow-xs mb-2 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-amber-500 text-white rounded-xl shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span>Modo Offline Activo</span>
                {pendingQueueCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {pendingQueueCount} pendientes
                  </span>
                )}
              </div>
              <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 truncate">
                Practica sin conexión. Tu XP y rachas se guardarán localmente.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Queue Pending Notice */}
      {isOnline && pendingQueueCount > 0 && !syncToast && (
        <div className="bg-indigo-600/10 dark:bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl flex items-center justify-between gap-2 backdrop-blur-xs shadow-xs mb-2 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#4648d4] text-white rounded-xl shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-[#4648d4] dark:text-[#c0c1ff]">
                Conexión Detectada ({pendingQueueCount} por sincronizar)
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Haz clic para volcar tu progreso offline a tu cuenta.
              </div>
            </div>
          </div>
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#4648d4] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#383aa8] transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
