'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Flame, Heart, Sun, Moon, Sparkles, Volume2, VolumeX, WifiOff, Trophy, Award, Crown } from 'lucide-react';
import { UserStats } from '../../types';
import { audioService } from '../../utils/audioService';
import { MAX_LIVES } from '../../utils/livesEngine';
import { HeaderButtonsSpiderWeb } from '../ui/HalloweenDecorations';

interface HeaderRightControlsProps {
  userStats: UserStats;
  streak: number;
  zenMode?: boolean;
  darkMode?: boolean;
  ambientSound?: boolean;
  isOnline?: boolean;
  onOpenStreakModal: () => void;
  onOpenLivesModal: () => void;
  onToggleAmbientSound?: () => void;
  onToggleZenMode?: () => void;
  onToggleDarkMode?: () => void;
}

export const HeaderRightControls: React.FC<HeaderRightControlsProps> = ({
  userStats,
  streak,
  zenMode = false,
  darkMode = false,
  ambientSound = false,
  isOnline = true,
  onOpenStreakModal,
  onOpenLivesModal,
  onToggleAmbientSound,
  onToggleZenMode,
  onToggleDarkMode
}) => {
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

  return (
    <div className="flex items-center gap-2">
      {/* Offline Cache Indicator Badge */}
      {!isOnline && (
        <div 
          className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full shadow-2xs ${
            zenMode
              ? 'bg-[#1f2125] border-[#e5b83b]/40 text-[#e5b83b]'
              : 'bg-amber-100 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-200'
          }`}
          title="Modo Sin Conexión - Lecciones y progresos guardados en caché local"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="text-[10px] font-extrabold hidden sm:inline">Modo Caché</span>
        </div>
      )}

      {/* 3 Header buttons with hanging spiderweb */}
      <div className="relative flex items-center gap-2">
        <HeaderButtonsSpiderWeb />

        {/* Streak Pill (Interactive) */}
      <motion.button
        id="tour-header-streak"
        onClick={() => {
          audioService.playSoftDing();
          onOpenStreakModal();
        }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`relative z-10 flex items-center gap-1.5 border px-2.5 py-1 rounded-full shadow-2xs cursor-pointer ${
          zenMode
            ? 'bg-[#1f2125] border-[#2e3138] text-[#f0ebe1]'
            : streakPillStyle
        }`}
        title="Ver Hitos y Racha de Práctica"
      >
        {streakBadgeIcon}
        <span className="font-heading font-extrabold text-xs md:text-sm">
          {streak}
        </span>
        <Flame className={`w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse ${
          zenMode
            ? 'text-[#e5b83b] fill-[#e5b83b]'
            : 'text-orange-500 fill-orange-500'
        }`} />
      </motion.button>

      {/* Energy / Hearts Pill */}
      <motion.button 
        onClick={() => {
          audioService.playClickSound();
          onOpenLivesModal();
        }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`relative z-10 flex items-center gap-1.5 border px-2.5 py-1 rounded-full shadow-inner  cursor-pointer transition-all ${
          zenMode
            ? 'bg-[#1f2125] border-[#2e3138] text-[#ded9cf]'
            : (userStats.lives ?? MAX_LIVES) === 0
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse'
              : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 border-red-200/50 dark:border-red-800/50 text-[#0b1c30] dark:text-[#d3e4fe]'
        }`}
        title="Estado de vidas y recarga"
      >
        <span className="font-heading font-bold text-xs md:text-sm">
          {userStats.lives ?? MAX_LIVES}
        </span>
        <motion.div
          key={userStats.lives}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
            zenMode
              ? 'text-[#e5b83b] fill-[#e5b83b]'
              : (userStats.lives ?? MAX_LIVES) === 0
                ? 'text-rose-400 fill-transparent'
                : 'text-red-500 fill-red-500'
          }`} />
        </motion.div>
      </motion.button>

      {/* Ambient Nature Sound Toggle Button */}
      {onToggleAmbientSound && zenMode && (
        <motion.button
          onClick={() => {
            audioService.playClickSound();
            onToggleAmbientSound();
          }}
          whileTap={{ scale: 0.9 }}
          className={`relative z-10 p-1.5 rounded-full border cursor-pointer shadow-2xs flex items-center gap-1 ${
            ambientSound
              ? (zenMode 
                  ? 'bg-[#26292f] border-[#e5b83b] text-[#e5b83b] animate-pulse'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-pulse')
              : (zenMode
                  ? 'bg-[#1f2125] border-[#2e3138] text-[#99958d] '
                  : 'bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 ')
          }`}
          title={ambientSound ? 'Desactivar Música Ambiental de Naturaleza' : 'Activar Música Ambiental (Sonidos de la Naturaleza)'}
          aria-label="Toggle Ambient Nature Sound"
        >
          {ambientSound ? (
            <Volume2 className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-600 dark:text-emerald-400'}`} />
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
          whileTap={{ scale: 0.9 }}
          className={`relative z-10 p-1.5 rounded-full border cursor-pointer shadow-2xs flex items-center gap-1 ${
            zenMode
              ? 'bg-[#e5b83b] border-[#f5d56b] text-[#161719]'
              : 'bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 '
          }`}
          title={zenMode ? 'Desactivar Enfoque Nocturno' : 'Activar Enfoque Nocturno (Modo Zen)'}
          aria-label="Toggle Zen Mode"
        >
          <Sparkles className={`w-4 h-4 ${zenMode ? 'fill-[#161719] text-[#161719]' : ''}`} />
          {zenMode && (
            <span className="text-[10px] font-bold pr-1 hidden sm:inline text-[#161719]">Zen</span>
          )}
        </motion.button>
      )}
      </div>

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
              ? (zenMode 
                  ? 'bg-[#22252a] border-[#e5b83b]/50 justify-end'
                  : 'bg-[#0f1d30] border-[#223652] justify-end shadow-inner')
              : (zenMode
                  ? 'bg-[#22252a] border-[#383c44] justify-start'
                  : 'bg-indigo-50/90 border-indigo-200/80 justify-start')
          }`}
          title={darkMode ? 'Modo Oscuro Activo - Cambiar a Modo Claro' : 'Modo Claro Activo - Cambiar a Modo Oscuro'}
          aria-label="Toggle dark mode"
        >
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md ${
              darkMode
                ? (zenMode ? 'bg-[#e5b83b] text-[#161719]' : 'bg-[#4648d4] text-white')
                : (zenMode ? 'bg-[#383c44] text-[#ded9cf]' : 'bg-amber-400 text-slate-950')
            }`}
          >
            {darkMode ? (
              <Moon className={`w-3.5 h-3.5 ${zenMode ? 'fill-[#161719] text-[#161719]' : 'fill-white text-white'}`} />
            ) : (
              <Sun className={`w-3.5 h-3.5 ${zenMode ? 'fill-[#ded9cf] text-[#ded9cf]' : 'fill-slate-950 text-slate-950'}`} />
            )}
          </motion.div>
        </button>
      )}
    </div>
  );
};
