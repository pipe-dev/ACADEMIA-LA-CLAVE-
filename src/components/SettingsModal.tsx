'use client';
import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { X, Sliders, ShieldCheck, Check, Moon, Sun, Sparkles, Volume2, HardDrive, Wifi, WifiOff, Compass, RefreshCw, Download, CheckCircle2, Smartphone, Bell, MonitorPlay, Share2, Terminal, Copy, Trash2 } from 'lucide-react';
import { cacheAllContentLocally, getOfflineQueue, isContentCachedLocally, syncPendingOfflineProgress } from '../utils/offlineSync';
import { enableScreenWakeLock, disableScreenWakeLock, sendPracticeReminderNotification, triggerHapticFeedback, shareUserAchievement, startBackgroundFetchDownload, scheduleLocalPracticeAlarm, isScreenWakeLockActive } from '../utils/pwaFeatures';
import { logger, LogEntry } from '../utils/logger';

interface SettingsModalProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  ambientSound?: boolean;
  isOnline?: boolean;
  onToggleDarkMode?: () => void;
  onToggleZenMode?: () => void;
  onToggleAmbientSound?: () => void;
  onStartTour?: () => void;
  onInstallApp?: () => void;
  isInstalled?: boolean;
  onClose: () => void;
  onUpdateStats: (updated: Partial<UserStats>) => void;
  onStartSplash?: () => void;
}

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
  onStartSplash
}) => {
  const [name, setName] = useState<string>(userStats.name);
  const [savedVocalRangeData] = useState<{ minHz: number; maxHz: number; noteMin: string; noteMax: string; classification: string } | null>(() => {
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

  useEffect(() => {
    audioService.playOpenSound();
    logger.info('Settings', 'Ajustes abiertos por el usuario');

    // Ensure Wake Lock is enabled and reflect state
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
      vocalRangeData: savedVocalRangeData ? { ...savedVocalRangeData, classification: vocalRange } : undefined
    });
    try {
      localStorage.setItem('laclave_vocal_range_classification', vocalRange);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer" onClick={handleClose}>
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 max-w-md sm:max-w-lg w-full space-y-5 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] transition-colors max-h-[88vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
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

        {/* Profile Settings Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-[#d3e4fe] focus:outline-none focus:ring-2 focus:ring-[#4648d4] shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
              Clasificación Vocal Predeterminada
            </label>
            <select
              value={vocalRange}
              onChange={(e) => setVocalRange(e.target.value)}
              className="w-full bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-[#d3e4fe] focus:outline-none focus:ring-2 focus:ring-[#4648d4] shadow-2xs cursor-pointer"
            >
              <option value="Soprano">Soprano (Agudo Femenino)</option>
              <option value="Mezzosoprano">Mezzosoprano (Medio Femenino)</option>
              <option value="Alto">Contralto / Alto (Grave Femenino)</option>
              <option value="Tenor">Tenor (Agudo Masculino)</option>
              <option value="Barítono">Barítono (Medio Masculino)</option>
              <option value="Bajo">Bajo (Grave Masculino)</option>
            </select>
          </div>

          {/* Unified Offline & Cache Card */}
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
              <span className={`text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 w-fit whitespace-nowrap ${
                isOnline
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 animate-pulse'
              }`}>
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
                onClick={handlePrecacheOffline}
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
                onClick={handleManualSync}
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

          {/* Ambient Nature Sound Toggle Item */}
          {onToggleAmbientSound && (
            <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Volume2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe]">
                    Música Ambient de Naturaleza
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Sonidos relajantes que te calman mientras disfrutas tu app
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleAmbientSound}
                className={`w-12 h-6.5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
                  ambientSound ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          )}

          {/* Zen Mode / Enfoque Nocturno Toggle Item */}
          {onToggleZenMode && (
            <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe]">
                    Enfoque Nocturno (Modo Zen)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Contrastes suaves para practicar antes de dormir
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleZenMode}
                className={`w-12 h-6.5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
                  zenMode ? 'bg-amber-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          )}

          {/* Dark Mode Toggle Item */}
          {zenMode ? (
            <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs opacity-80">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Moon className="w-5 h-5 text-[#e5b83b] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe]">
                    Modo Oscuro
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Fijado en oscuro por Modo Zen
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-[#e5b83b] border border-amber-500/30">
                Fijo
              </span>
            </div>
          ) : onToggleDarkMode ? (
            <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Sun className="w-5 h-5 text-[#4648d4] shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe]">
                    Modo Oscuro
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {darkMode ? 'Tema oscuro activo' : 'Tema claro activo'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`w-12 h-6.5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
                  darkMode ? 'bg-[#4648d4] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          ) : null}

          {/* Single Install App Button */}
          {onInstallApp && (
            <button
              type="button"
              onClick={() => {
                onInstallApp();
              }}
              className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs cursor-pointer hover:border-emerald-400 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe] flex items-center gap-1.5">
                    <span>Instalar App</span>
                    {isInstalled && (
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Instalada</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isInstalled ? 'Aplicación instalada en el dispositivo' : 'Instalar en la pantalla de inicio'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 px-3 py-1.5 bg-white dark:bg-[#102034] rounded-xl shadow-2xs shrink-0 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>{isInstalled ? 'Abrir' : 'Instalar'}</span>
              </span>
            </button>
          )}

          {/* Feature 1: Screen Keep Awake */}
          <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MonitorPlay className={`w-5 h-5 shrink-0 ${wakeLockActive ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe] flex items-center gap-1.5">
                  <span>Pantalla Siempre Encendida</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Evita que la pantalla se apague mientras ensayas o afinas tu voz
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleWakeLock}
              className={`w-12 h-6.5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
                wakeLockActive ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Feature 2: Daily Notifications */}
          <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Bell className="w-5 h-5 text-[#4648d4] dark:text-[#c0c1ff] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe] flex items-center gap-1.5">
                  <span>Recordatorio Diario de Ensayo</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Recibe un aviso diario para mantener tu racha activa.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await scheduleLocalPracticeAlarm(20, 0, userStats.streak || 1);
                handleTestNotification();
              }}
              className="text-xs font-black text-[#4648d4] dark:text-[#c0c1ff] px-3 py-1.5 bg-white dark:bg-[#102034] border border-indigo-100 dark:border-indigo-900 rounded-xl shadow-2xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shrink-0 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-[#4648d4] dark:text-[#c0c1ff]" />
              <span>Probar</span>
            </button>
          </div>

          {/* Feature 3: Share Progress */}
          <div className="flex items-center justify-between gap-3 bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe] flex items-center gap-1.5">
                  <span>Compartir mi Racha</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Comparte tus logros directamente en tus redes o chats
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShareApp}
              className="text-xs font-black text-emerald-700 dark:text-emerald-300 px-3 py-1.5 bg-white dark:bg-[#102034] border border-emerald-100 dark:border-emerald-900 rounded-xl shadow-2xs cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50 shrink-0 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>

          {/* Guided Tour Re-trigger Button */}
          {onStartTour && (
            <button
              type="button"
              onClick={() => {
                handleClose();
                setTimeout(() => {
                  onStartTour();
                }, 150);
              }}
              className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 p-3.5 sm:p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs cursor-pointer hover:border-indigo-400 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Compass className="w-5 h-5 text-[#4648d4] dark:text-[#c0c1ff] shrink-0 group-hover:rotate-45 transition-transform" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe]">
                    Tour Guiado Interactivo
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Repasar cómo usar las lecciones y el afinador
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-[#4648d4] dark:text-[#c0c1ff] px-3 py-1.5 bg-white dark:bg-[#102034] rounded-xl shadow-2xs shrink-0 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Iniciar</span>
              </span>
            </button>
          )}



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
                  onClick={handleCopyLogs}
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
                  onClick={() => {
                    logger.clearLogs();
                    triggerHapticFeedback('light');
                  }}
                  className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-800/60"
                  title="Limpiar registro de logs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
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
      </div>
    </div>
  );
};

export default SettingsModal;
