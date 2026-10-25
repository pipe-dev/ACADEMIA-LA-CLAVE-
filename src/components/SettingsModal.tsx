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

const VOCAL_PRESETS: Record<string, SavedVocalRangeData> = {
  Bajo: { classification: 'Bajo', gender: 'masculino', noteMin: 'Mi2', noteMax: 'Mi4', minHz: 82.41, maxHz: 329.63 },
  Barítono: { classification: 'Barítono', gender: 'masculino', noteMin: 'La2', noteMax: 'Sol4', minHz: 110.0, maxHz: 392.0 },
  Tenor: { classification: 'Tenor', gender: 'masculino', noteMin: 'Do3', noteMax: 'La4', minHz: 130.81, maxHz: 440.0 },
  Alto: { classification: 'Contralto', gender: 'femenino', noteMin: 'Fa3', noteMax: 'Fa5', minHz: 174.61, maxHz: 698.46 },
  Contralto: { classification: 'Contralto', gender: 'femenino', noteMin: 'Fa3', noteMax: 'Fa5', minHz: 174.61, maxHz: 698.46 },
  Mezzosoprano: { classification: 'Mezzosoprano', gender: 'femenino', noteMin: 'La3', noteMax: 'La5', minHz: 220.0, maxHz: 880.0 },
  Soprano: { classification: 'Soprano', gender: 'femenino', noteMin: 'Do4', noteMax: 'Do6', minHz: 261.63, maxHz: 1046.5 },
};

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
  const [savedVocalRangeData, setSavedVocalRangeData] = useState<SavedVocalRangeData | null>(() => {
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

  useEffect(() => {
    if (userStats.name) setName(userStats.name);
    if (userStats.avatarUrl) setAvatarUrl(userStats.avatarUrl);
    if (userStats.vocalRange) setVocalRange(userStats.vocalRange);
    if (userStats.vocalRangeData) setSavedVocalRangeData(userStats.vocalRangeData);
  }, [userStats.name, userStats.avatarUrl, userStats.vocalRange, userStats.vocalRangeData]);

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

    const trimmedName = name.trim() || userStats.name || 'Vocalista';
    const finalAvatar = avatarUrl || userStats.avatarUrl || '';
    const determinedGender: 'masculino' | 'femenino' =
      (vocalRange === 'Tenor' || vocalRange === 'Barítono' || vocalRange === 'Bajo') ? 'masculino' : 'femenino';

    const targetRangeData: SavedVocalRangeData = (savedVocalRangeData && savedVocalRangeData.classification === vocalRange)
      ? { ...savedVocalRangeData, gender: determinedGender }
      : (VOCAL_PRESETS[vocalRange] || { classification: vocalRange, gender: determinedGender });

    const updatedStats = {
      name: trimmedName,
      vocalRange,
      avatarUrl: finalAvatar,
      vocalRangeData: targetRangeData,
    };

    onUpdateStats(updatedStats);

    // 1. Direct overwrite in all dedicated and composite localStorage keys
    try {
      localStorage.setItem('laclave_user_name', trimmedName);
      localStorage.setItem('laclave_user_avatar', finalAvatar);
      localStorage.setItem('laclave_profile_configured', 'true');
      localStorage.setItem('laclave_voice_gender', determinedGender);
      localStorage.setItem('laclave_vocal_range_classification', vocalRange);
      localStorage.setItem('laclave_vocal_range_saved', JSON.stringify(targetRangeData));

      const statsStr = localStorage.getItem('laclave_user_stats_v6');
      const parsed = statsStr ? JSON.parse(statsStr) : {};
      parsed.name = trimmedName;
      parsed.avatarUrl = finalAvatar;
      parsed.vocalRange = vocalRange;
      parsed.vocalRangeData = targetRangeData;
      parsed.isConfigured = true;
      localStorage.setItem('laclave_user_stats_v6', JSON.stringify(parsed));

      const cachedUser = localStorage.getItem('laclave_cached_session_user_v1');
      if (cachedUser) {
        const u = JSON.parse(cachedUser);
        u.name = trimmedName;
        localStorage.setItem('laclave_cached_session_user_v1', JSON.stringify(u));
      }
    } catch (e) {
      console.warn('Could not persist profile to localStorage', e);
    }

    // 2. Immediately push update to server API so DB user record and progress are updated right away
    try {
      fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xp: userStats.xp || 0,
          level: userStats.level || 1,
          streak: userStats.streak || 0,
          name: trimmedName,
          progressData: JSON.stringify({
            userStats: { ...userStats, ...updatedStats },
            unitsProgress: localStorage.getItem('laclave_units_v8'),
            dailyQuests: localStorage.getItem('laclave_daily_quests_state_v2'),
            vocalRange: JSON.stringify(targetRangeData),
            vocalRangeClassification: vocalRange,
            voiceGender: determinedGender,
          }),
        }),
      }).catch(() => {});
    } catch {}

    // 3. Dispatch force sync event so useCloudProgressSync immediately updates without debounce delay
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('laclave_force_cloud_sync'));
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
          className={`absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full shadow-xs cursor-pointer active:scale-90 transition-transform z-10 ${
            zenMode
              ? 'bg-[#26292f] border border-[#2e3138] text-rose-400'
              : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/70 text-rose-500 dark:text-rose-400'
          }`}
          aria-label="Cerrar ajustes"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-16">
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
          className="w-full py-3 rounded-2xl border border-red-500/20 text-red-500 font-heading font-bold text-xs cursor-pointer transition-colors"
        >
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
