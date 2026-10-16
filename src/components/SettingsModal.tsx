'use client';
import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../utils/audioService';
import { X, Sliders, Check } from 'lucide-react';
import {
  cacheAllContentLocally,
  getOfflineQueue,
  isContentCachedLocally,
  syncPendingOfflineProgress,
} from '../utils/offlineSync';
import {
  enableScreenWakeLock,
  disableScreenWakeLock,
  sendPracticeReminderNotification,
  triggerHapticFeedback,
  shareUserAchievement,
  isScreenWakeLockActive,
} from '../utils/pwaFeatures';
import { logger, LogEntry } from '../utils/logger';
import { SettingsModalProps, SavedVocalRangeData } from './settings/settingsTypes';
import { SettingsProfileForm } from './settings/SettingsProfileForm';
import { SettingsOfflineCard } from './settings/SettingsOfflineCard';
import { SettingsTogglesList } from './settings/SettingsTogglesList';
import { SettingsDiagnosticLogs } from './settings/SettingsDiagnosticLogs';

export type { SettingsModalProps };

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userStats,
  darkMode = false,
  zenMode = false,
  ambientSound = false,
  isOnline = true,
  onToggleDarkMode,
  onToggleZenMode,
  onToggleAmbientSound,
  onStartTour,
  onInstallApp,
  isInstalled = false,
  onClose,
  onUpdateStats,
  onStartSplash,
  sessionUser,
  onRefreshSession,
}) => {
  const [name, setName] = useState<string>(userStats.name);
  const [avatarUrl, setAvatarUrl] = useState<string>(userStats.avatarUrl || '');
  const [savedVocalRangeData] = useState<SavedVocalRangeData | null>(() => {
    if (userStats.vocalRangeData) return userStats.vocalRangeData;
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [vocalRange, setVocalRange] = useState<string>(() => {
    if (userStats.vocalRange) return userStats.vocalRange;
    if (userStats.vocalRangeData?.classification) return userStats.vocalRangeData.classification;
    try {
      const classif = localStorage.getItem('laclave_vocal_range_classification');
      if (classif) return classif;
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.classification) return parsed.classification;
      }
    } catch {}
    return 'Tenor';
  });

  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [offlineDownloading, setOfflineDownloading] = useState<boolean>(false);
  const [offlineDownloaded, setOfflineDownloaded] = useState<boolean>(() => isContentCachedLocally());
  const [queueCount, setQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(() => true);

  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsCopied, setLogsCopied] = useState<boolean>(false);

  const hasMountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      const now = Date.now();
      // Prevents audio looping if remounted rapidly
      if (typeof window !== 'undefined') {
        const lastPlay = Number((window as any).__lastSettingsOpenSound || 0);
        if (now - lastPlay > 2000) {
          (window as any).__lastSettingsOpenSound = now;
          audioService.playOpenSound();
          logger.info('Settings', 'Ajustes abiertos por el usuario');
        }
      }
    }

    enableScreenWakeLock().then((active) => {
      setWakeLockActive(active || isScreenWakeLockActive());
    });

    return logger.subscribe((newLogs) => setLogs(newLogs));
  }, []);

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logger.exportLogsAsString());
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 2000);
    } catch {
      alert('No se pudo copiar automáticamente.');
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await disableScreenWakeLock();
      setWakeLockActive(false);
    } else {
      const ok = await enableScreenWakeLock();
      if (ok) setWakeLockActive(true);
      else alert('Tu dispositivo no soporta o bloquea Screen WakeLock.');
    }
  };

  const handleTestNotification = async () => {
    await sendPracticeReminderNotification(userStats.streak || 1);
    triggerHapticFeedback('success');
  };

  const handleShareApp = async () => {
    triggerHapticFeedback('light');
    await shareUserAchievement(
      'Academia La Clave - Canto y Solfeo',
      `¡Estoy practicando canto y solfeo con una racha de ${userStats.streak} días en La Clave!`
    );
  };

  const handlePrecacheOffline = () => {
    setOfflineDownloading(true);
    setTimeout(() => {
      cacheAllContentLocally();
      setOfflineDownloaded(true);
      setOfflineDownloading(false);
      audioService.playSoftDing();
    }, 600);
  };

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const { updatedStats } = syncPendingOfflineProgress(userStats);
      onUpdateStats(updatedStats);
      setQueueCount(0);
      setSyncing(false);
      audioService.playSoftDing();
    }, 600);
  };

  const handleClose = () => {
    audioService.playCloseSound();
    onClose();
  };

  const handleSave = () => {
    audioService.playClickSound();
    onUpdateStats({
      name,
      vocalRange,
      avatarUrl,
      vocalRangeData: savedVocalRangeData ? { ...savedVocalRangeData, classification: vocalRange } : undefined,
    });
    try {
      localStorage.setItem('laclave_vocal_range_classification', vocalRange);
      const statsStr = localStorage.getItem('laclave_user_stats_v6');
      if (statsStr) {
        const parsed = JSON.parse(statsStr);
        parsed.name = name;
        parsed.avatarUrl = avatarUrl;
        parsed.vocalRange = vocalRange;
        localStorage.setItem('laclave_user_stats_v6', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Could not save classification to localStorage', e);
    }
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      handleClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 max-w-md sm:max-w-lg w-full space-y-5 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] transition-colors max-h-[88vh] overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          aria-label="Cerrar ajustes"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="organic-shape w-12 h-12 bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff] flex items-center justify-center shadow-xs shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-[#4648d4] dark:text-[#c0c1ff] uppercase tracking-wider block">
              Ajustes de Cuenta
            </span>
            <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
              Configuración
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <SettingsProfileForm
            name={name}
            onNameChange={setName}
            vocalRange={vocalRange}
            onVocalRangeChange={setVocalRange}
            avatarUrl={avatarUrl}
            onAvatarChange={setAvatarUrl}
            sessionUser={sessionUser}
            onRefreshSession={onRefreshSession}
          />

          <SettingsOfflineCard
            isOnline={isOnline}
            offlineDownloading={offlineDownloading}
            offlineDownloaded={offlineDownloaded}
            queueCount={queueCount}
            syncing={syncing}
            onPrecache={handlePrecacheOffline}
            onSync={handleManualSync}
            onStartSplash={onStartSplash}
            onClose={handleClose}
          />

          <SettingsTogglesList
            ambientSound={ambientSound}
            onToggleAmbientSound={onToggleAmbientSound}
            zenMode={zenMode}
            onToggleZenMode={onToggleZenMode}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            onInstallApp={onInstallApp}
            isInstalled={isInstalled}
            wakeLockActive={wakeLockActive}
            onToggleWakeLock={handleToggleWakeLock}
            onTestNotification={handleTestNotification}
            onShareApp={handleShareApp}
            onStartTour={onStartTour}
            onClose={handleClose}
          />

          <SettingsDiagnosticLogs
            logs={logs}
            showLogs={showLogs}
            onToggleShowLogs={() => setShowLogs(!showLogs)}
            onCopyLogs={handleCopyLogs}
            logsCopied={logsCopied}
            onClearLogs={() => {
              logger.clearLogs();
              triggerHapticFeedback('light');
            }}
          />
        </div>

        {savedNotice && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs">
            <Check className="w-4.5 h-4.5" />
            <span>¡Ajustes guardados correctamente!</span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3.5 sm:py-4 rounded-2xl tactile-btn-primary font-heading font-black text-sm cursor-pointer shadow-md tracking-wide"
        >
          Guardar Cambios
        </button>

        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } finally {
              window.location.href = '/login';
            }
          }}
          className="w-full py-3 rounded-2xl border border-red-500/20 hover:bg-red-500/10 text-red-500 font-heading font-bold text-xs cursor-pointer transition-colors"
        >
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
