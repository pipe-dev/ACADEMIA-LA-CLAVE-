'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { Flame, Heart, Sun, Moon, Sparkles, Volume2, VolumeX, WifiOff, Trophy, Award, Crown, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeaderProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  ambientSound?: boolean;
  isOnline?: boolean;
  onToggleDarkMode?: () => void;
  onToggleZenMode?: () => void;
  onToggleAmbientSound?: () => void;
  onOpenStore?: () => void;
  onOpenSettings?: () => void;
  onOpenFlameView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userStats,
  darkMode = false,
  zenMode = false,
  ambientSound = false,
  isOnline = true,
  onToggleDarkMode,
  onToggleZenMode,
  onToggleAmbientSound,
  onOpenStore,
  onOpenSettings,
  onOpenFlameView
}) => {
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);

  const streak = userStats.streak || 0;
  const isMilestone7 = streak >= 7;
  const isMilestone30 = streak >= 30;
  const isMilestone100 = streak >= 100;

  let streakBadgeIcon = null;
  let streakPillStyle = "bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-[#0b1c30] dark:text-[#d3e4fe]";

  if (isMilestone100) {
    streakBadgeIcon = <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-bounce" />;
    streakPillStyle = "bg-amber-100 dark:bg-amber-950/90 border-amber-400 dark:border-amber-600 ring-2 ring-amber-300 dark:ring-amber-500/60 shadow-md text-amber-950 dark:text-amber-100";
  } else if (isMilestone30) {
    streakBadgeIcon = <Award className="w-3.5 h-3.5 text-indigo-600 fill-indigo-300 animate-pulse" />;
    streakPillStyle = "bg-indigo-100 dark:bg-indigo-950/90 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-500/60 shadow-md text-indigo-950 dark:text-indigo-100";
  } else if (isMilestone7) {
    streakBadgeIcon = <Trophy className="w-3.5 h-3.5 text-orange-600 fill-orange-400 animate-pulse" />;
    streakPillStyle = "bg-orange-100 dark:bg-orange-950/90 border-orange-400 dark:border-orange-600 ring-2 ring-orange-300 dark:ring-orange-500/60 shadow-md text-orange-950 dark:text-orange-100";
  }

  const handleCelebrate = () => {
    audioService.playSoftDing();
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#f97316', '#eab308', '#6366f1', '#10b981', '#ec4899']
    });
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-[#f8f9ff]/98 dark:bg-[#0b1c30]/98 px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        {/* Left: Avatar & Title */}
        <div 
          id="tour-header-profile"
          onClick={() => {
            audioService.playClickSound();
            if (onOpenSettings) onOpenSettings();
          }}
          className="flex items-center gap-2.5 cursor-pointer group press-effect"
          title="Ver Perfil y Configuración"
        >
          <div className="w-9 h-9 rounded-full border-2 border-[#4648d4]/30 bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-200 shadow-xs group-hover:border-[#4648d4] transition-colors">
            {userStats.avatarUrl ? (
              <img 
                src={userStats.avatarUrl} 
                alt={userStats.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>img</span>
            )}
          </div>
          <div>
            <h1 className="font-heading font-bold text-base md:text-lg text-[#2c2abc] dark:text-[#c0c1ff] leading-tight group-hover:text-[#4648d4] transition-colors">
              AFINAPP
            </h1>
          </div>
        </div>

        {/* Right: Streak, Lives & Offline Indicator */}
        <div className="flex items-center gap-2">
          {/* Offline Cache Indicator Badge */}
          {!isOnline && (
            <div 
              className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700/80 px-2.5 py-1 rounded-full shadow-2xs text-amber-800 dark:text-amber-200"
              title="Modo Sin Conexión - Lecciones y progresos guardados en caché local"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="text-[10px] font-extrabold hidden sm:inline">Modo Caché</span>
            </div>
          )}

          {/* Streak Pill (Interactive) */}
          <motion.button
            id="tour-header-streak"
            onClick={() => {
              audioService.playSoftDing();
              setIsStreakModalOpen(true);
            }}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full shadow-2xs cursor-pointer ${streakPillStyle}`}
            title="Ver Hitos y Racha de Práctica"
          >
            {streakBadgeIcon}
            <span className="font-heading font-extrabold text-xs md:text-sm">
              {streak}
            </span>
            <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500 fill-orange-500 animate-pulse" />
          </motion.button>

          {/* Energy / Hearts Pill */}
          <motion.button 
            onClick={() => {
              audioService.playClickSound();
              if (onOpenStore) onOpenStore();
            }}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex items-center gap-1 bg-[#eff4ff] dark:bg-[#102034] border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-2xs hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
            title="Obtener más vidas"
          >
            <span className="font-heading font-bold text-xs md:text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
              {userStats.lives}
            </span>
            <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 fill-red-500" />
          </motion.button>

          {/* Ambient Nature Sound Toggle Button (especially in Zen Mode) */}
          {onToggleAmbientSound && zenMode && (
            <motion.button
              onClick={() => {
                audioService.playClickSound();
                onToggleAmbientSound();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded-full border cursor-pointer shadow-2xs flex items-center gap-1 ${
                ambientSound
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-pulse'
                  : 'bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
              title={ambientSound ? 'Desactivar Música Ambiental de Naturaleza' : 'Activar Música Ambiental (Sonidos de la Naturaleza)'}
              aria-label="Toggle Ambient Nature Sound"
            >
              {ambientSound ? (
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-[10px] font-bold pr-1 hidden sm:inline">
                {ambientSound ? 'Lluvia' : 'Sonido'}
              </span>
            </motion.button>
          )}

          {/* Zen Mode / Enfoque Nocturno Toggle Button */}
          {onToggleZenMode && (
            <motion.button
              onClick={() => {
                audioService.playClickSound();
                onToggleZenMode();
              }}
              whileHover={{ scale: 1.1, rotate: zenMode ? 15 : -15 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded-full border cursor-pointer shadow-2xs flex items-center gap-1 ${
                zenMode
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600'
              }`}
              title={zenMode ? 'Desactivar Enfoque Nocturno' : 'Activar Enfoque Nocturno (Modo Zen)'}
              aria-label="Toggle Zen Mode"
            >
              <Sparkles className={`w-4 h-4 ${zenMode ? 'fill-amber-400 text-amber-500 animate-pulse' : ''}`} />
              {zenMode && (
                <span className="text-[10px] font-bold pr-1 hidden sm:inline">Zen</span>
              )}
            </motion.button>
          )}

          {/* Dark / Light Mode Toggle Switch */}
          {onToggleDarkMode && (
            <button
              type="button"
              id="tour-header-darkmode"
              onClick={() => {
                audioService.playClickSound();
                onToggleDarkMode();
              }}
              className={`w-12 h-6.5 rounded-full p-0.5 border cursor-pointer flex items-center transition-all shadow-2xs ${
                darkMode
                  ? 'bg-amber-950/80 border-amber-500/50 justify-end'
                  : 'bg-indigo-100 border-indigo-200 justify-start'
              }`}
              title={darkMode ? 'Modo Oscuro Activo - Cambiar a Modo Claro' : 'Modo Claro Activo - Cambiar a Modo Oscuro'}
              aria-label="Toggle dark mode"
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md ${
                  darkMode
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-[#4648d4] text-white'
                }`}
              >
                {darkMode ? (
                  <Sun className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                ) : (
                  <Moon className="w-3.5 h-3.5 fill-white text-white" />
                )}
              </motion.div>
            </button>
          )}
        </div>
      </header>

      {/* Racha de Práctica y Hitos Modal */}
      {isStreakModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-6 animate-fadeIn overflow-y-auto cursor-pointer"
          onClick={() => {
            audioService.playCloseSound();
            setIsStreakModalOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-[#102034] rounded-3xl p-4 sm:p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scaleIn relative my-auto max-h-[82vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                audioService.playCloseSound();
                setIsStreakModalOpen(false);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 pt-1">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-orange-100 dark:bg-orange-950/60 border-2 border-orange-400/80 flex items-center justify-center mx-auto shadow-md">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 fill-orange-500 animate-bounce" />
              </div>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-[#d3e4fe]">
                {streak} Días de Racha
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-tight">
                Completa al menos 1 lección o práctica al día para mantener encendido tu fuego vocal.
              </p>
            </div>

            {/* Hitos Milestones Cards */}
            <div className="space-y-2 pt-0.5">
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hitos de Constancia Vocal
              </h4>

              {/* Hito 7 días */}
              <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                isMilestone7
                  ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
                      7 Días - Cantante Constante
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isMilestone7 ? '¡Hito alcanzado!' : `${Math.min(7, streak)} / 7 días completados`}
                    </p>
                  </div>
                </div>
                {isMilestone7 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">{Math.round((streak / 7) * 100)}%</span>
                )}
              </div>

              {/* Hito 30 días */}
              <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                isMilestone30
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
                      30 Días - Maestro de Solfeo
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isMilestone30 ? '¡Hito alcanzado!' : `${Math.min(30, streak)} / 30 días completados`}
                    </p>
                  </div>
                </div>
                {isMilestone30 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">{Math.round((streak / 30) * 100)}%</span>
                )}
              </div>

              {/* Hito 100 días */}
              <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                isMilestone100
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
                      100 Días - Leyenda Vocal
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isMilestone100 ? '¡Hito Leyenda!' : `${Math.min(100, streak)} / 100 días completados`}
                    </p>
                  </div>
                </div>
                {isMilestone100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">{Math.round((streak / 100) * 100)}%</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {onOpenFlameView && (
                <button
                  type="button"
                  onClick={() => {
                    setIsStreakModalOpen(false);
                    onOpenFlameView();
                  }}
                  className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading font-black text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
                >
                  <Flame className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200 animate-pulse" />
                  <span>Ver Llama</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCelebrate}
                className={`py-2.5 px-2 rounded-xl tactile-btn-primary font-heading font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${!onOpenFlameView ? 'col-span-2' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                <span>¡Confeti!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
