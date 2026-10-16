'use client';
import React from 'react';
import {
  Volume2,
  Sparkles,
  Moon,
  Sun,
  Smartphone,
  Download,
  MonitorPlay,
  Bell,
  Share2,
  Compass,
} from 'lucide-react';

import { SettingsNotificationsCard } from './SettingsNotificationsCard';

interface SettingsTogglesListProps {
  ambientSound?: boolean;
  onToggleAmbientSound?: () => void;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onInstallApp?: () => void;
  isInstalled?: boolean;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  onTestNotification?: () => void;
  onShareApp: () => void;
  onStartTour?: () => void;
  onClose: () => void;
  streak?: number;
}

export const SettingsTogglesList: React.FC<SettingsTogglesListProps> = ({
  ambientSound = false,
  onToggleAmbientSound,
  zenMode = false,
  onToggleZenMode,
  darkMode = false,
  onToggleDarkMode,
  onInstallApp,
  isInstalled = false,
  wakeLockActive,
  onToggleWakeLock,
  onTestNotification,
  onShareApp,
  onStartTour,
  onClose,
  streak = 1,
}) => {
  return (
    <>
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
            aria-label="Alternar música ambient de naturaleza"
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
            aria-label="Alternar modo zen"
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
            aria-label="Alternar modo oscuro"
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
          onClick={onToggleWakeLock}
          aria-label="Alternar mantener pantalla encendida"
          className={`w-12 h-6.5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
            wakeLockActive ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
          }`}
        >
          <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
        </button>
      </div>

      {/* Feature 2: Duolingo-style Daily Practice Notifications */}
      <SettingsNotificationsCard streak={streak} />

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
          onClick={onShareApp}
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
            onClose();
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
    </>
  );
};
