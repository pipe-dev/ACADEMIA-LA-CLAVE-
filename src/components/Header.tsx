'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { Flame, Heart, Sun, Moon, Sparkles, Volume2, VolumeX, WifiOff, Trophy, Award, Crown, X, CheckCircle2, Clock, Zap, ShoppingBag } from 'lucide-react';
import { isStreakLitToday } from '../utils/streakPrompt';
import { getTimeToNextLife, MAX_LIVES } from '../utils/livesEngine';

interface DynamicStreakAction {
  tab: 'practica' | 'academia' | 'afinador';
  name: string;
  litText: string;
  unlitText: string;
  icon: string;
}

const DYNAMIC_STREAK_ACTIONS: DynamicStreakAction[] = [
  {
    tab: 'practica',
    name: 'Práctica',
    litText: 'Seguir Cantando en Karaoke',
    unlitText: 'Cantar para Asegurar Racha',
    icon: 'mic_external_on',
  },
  {
    tab: 'academia',
    name: 'Academia',
    litText: 'Continuar Lecciones en Academia',
    unlitText: 'Completar Lección para Asegurar Racha',
    icon: 'map',
  },
  {
    tab: 'afinador',
    name: 'Afinador',
    litText: 'Entrenar Oído en el Afinador',
    unlitText: 'Vocalizar para Asegurar Racha',
    icon: 'graphic_eq',
  },
];

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
  onOpenRecoveryExam?: () => void;
  onOpenSettings?: () => void;
  onOpenFlameView?: () => void;
  onNavigateTab?: (tab: 'academia' | 'afinador' | 'practica') => void;
  onNavigateToPractice?: () => void;
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
  onOpenRecoveryExam,
  onOpenSettings,
  onOpenFlameView,
  onNavigateTab,
  onNavigateToPractice
}) => {
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isLitToday, setIsLitToday] = useState<boolean>(false);
  const [dynamicActionIndex, setDynamicActionIndex] = useState<number>(() => Math.floor(Math.random() * 3));

  // Lives popover/modal state and passive countdown timer
  const [isLivesModalOpen, setIsLivesModalOpen] = useState<boolean>(false);
  const [timeToNextLife, setTimeToNextLife] = useState(() => getTimeToNextLife(userStats));

  useEffect(() => {
    if ((userStats.lives ?? MAX_LIVES) >= MAX_LIVES) {
      setTimeToNextLife({ remainingMs: 0, formatted: '00:00' });
      return;
    }
    setTimeToNextLife(getTimeToNextLife(userStats));
    const interval = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(interval);
  }, [userStats]);

  useEffect(() => {
    if (isStreakModalOpen) {
      setIsLitToday(isStreakLitToday());
      setDynamicActionIndex(prev => (prev + 1) % DYNAMIC_STREAK_ACTIONS.length);
    }
  }, [isStreakModalOpen]);

  const activeAction = DYNAMIC_STREAK_ACTIONS[dynamicActionIndex];

  const handleDynamicNavigate = () => {
    audioService.playClickSound();
    setIsStreakModalOpen(false);
    if (onNavigateTab) {
      onNavigateTab(activeAction.tab);
    } else if (onNavigateToPractice) {
      onNavigateToPractice();
    }
  };

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


  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0b1c30]/80 backdrop-blur-xl px-4 py-3 border-b border-white/40 dark:border-white/10 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.05)] flex items-center justify-between transition-colors max-w-lg mx-auto">
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
            <h1 className={`font-heading font-bold text-base md:text-lg leading-tight transition-colors ${
              zenMode
                ? 'text-[#f0ebe1]'
                : 'text-[#2c2abc] dark:text-[#c0c1ff] group-hover:text-[#4648d4]'
            }`}>
              AFINAPP
            </h1>
          </div>
        </div>

        {/* Right: Streak, Lives & Offline Indicator */}
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
            className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full shadow-2xs cursor-pointer ${
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
              setIsLivesModalOpen(true);
            }}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-full shadow-inner hover:brightness-110 cursor-pointer transition-all ${
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
                  ? (zenMode 
                      ? 'bg-[#26292f] border-[#e5b83b] text-[#e5b83b] animate-pulse'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-pulse')
                  : (zenMode
                      ? 'bg-[#1f2125] border-[#2e3138] text-[#99958d] hover:text-[#e5b83b]'
                      : 'bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600')
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
              whileHover={{ scale: 1.1, rotate: zenMode ? 15 : -15 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded-full border cursor-pointer shadow-2xs flex items-center gap-1 ${
                zenMode
                  ? 'bg-[#e5b83b] border-[#f5d56b] text-[#161719]'
                  : 'bg-[#eff4ff] dark:bg-[#102034] border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600'
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

            {/* Acciones de Racha Contextuales */}
            <div className="space-y-2 pt-1">
              {!isLitToday ? (
                <>
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium leading-tight">
                      Tu fuego vocal aún no se ha encendido hoy.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {onOpenFlameView && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsStreakModalOpen(false);
                          onOpenFlameView();
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all"
                      >
                        <span>Encender Fuego de Hoy (+50 XP)</span>
                        <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200 shrink-0" />
                      </button>
                    )}

                    {(onNavigateTab || onNavigateToPractice) && (
                      <button
                        type="button"
                        onClick={handleDynamicNavigate}
                        className={`w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 border ${
                          zenMode
                            ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <span>{activeAction.unlitText}</span>
                        <span className={`material-symbols-outlined text-[16px] leading-none shrink-0 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} style={{ fontSize: '16px' }}>
                          {activeAction.icon}
                        </span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
                    zenMode
                      ? 'bg-[#26292f] border-[#e5b83b]/30'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                    <p className={`text-[11px] font-medium leading-tight ${zenMode ? 'text-[#f0ebe1]' : 'text-emerald-800 dark:text-emerald-200'}`}>
                      Racha protegida hoy. Llevas {streak} días de constancia.
                    </p>
                  </div>

                  {(onNavigateTab || onNavigateToPractice) && (
                    <button
                      type="button"
                      onClick={handleDynamicNavigate}
                      className={`w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs cursor-pointer shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                        zenMode
                          ? 'bg-[#e5b83b] text-[#161719] shadow-[0_3px_0_0_#9a7212] font-black'
                          : 'bg-[#4648d4] text-white hover:brightness-110'
                      }`}
                    >
                      <span>{activeAction.litText}</span>
                      <span className={`material-symbols-outlined text-[16px] leading-none shrink-0 ${zenMode ? 'text-[#161719]' : 'text-white/90'}`} style={{ fontSize: '16px' }}>
                        {activeAction.icon}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lives Popover / Modal Dialog */}
      {isLivesModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsLivesModalOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl relative border transition-all ${
              zenMode
                ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
                : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-slate-800 text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLivesModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Visual Icon and Title */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/10 border border-rose-500/30 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="font-heading font-black text-lg sm:text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
                  {(userStats.lives ?? MAX_LIVES) >= MAX_LIVES ? 'Vidas al Máximo' : 'Tus Vidas'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(userStats.lives ?? MAX_LIVES) >= MAX_LIVES
                    ? 'Tienes tus 5 vidas completas para entrenar'
                    : `Tienes ${userStats.lives ?? 0} de ${MAX_LIVES} vidas disponibles`}
                </p>
              </div>

              {/* Visual 5-Hearts Row */}
              <div className="flex items-center gap-2 py-1">
                {Array.from({ length: MAX_LIVES }).map((_, i) => {
                  const isFilled = i < (userStats.lives ?? MAX_LIVES);
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                        isFilled
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFilled ? 'fill-rose-500 text-rose-500' : 'fill-transparent'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Passive Timer Card (if lives < MAX_LIVES) */}
              {(userStats.lives ?? MAX_LIVES) < MAX_LIVES ? (
                <div className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left ${
                  zenMode
                    ? 'bg-[#22252a] border-[#2e3138]'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Recarga pasiva
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Siguiente vida en {timeToNextLife.formatted}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">
                    {timeToNextLife.formatted}
                  </div>
                </div>
              ) : (
                <div className={`w-full p-3 rounded-2xl border flex items-center gap-2.5 text-left ${
                  zenMode
                    ? 'bg-[#22252a] border-[#2e3138]'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                }`}>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Tus vidas están completamente recargadas.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2 pt-2">
                {(userStats.lives ?? MAX_LIVES) < MAX_LIVES && onOpenRecoveryExam && (
                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setIsLivesModalOpen(false);
                      onOpenRecoveryExam();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                    <span>Entrenar para ganar 1 vida (Gratis)</span>
                  </button>
                )}

                {(userStats.lives ?? MAX_LIVES) < MAX_LIVES && onOpenStore && (
                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setIsLivesModalOpen(false);
                      onOpenStore();
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                      zenMode
                        ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    <span>Recargar en la Tienda</span>
                  </button>
                )}

                {(userStats.lives ?? MAX_LIVES) >= MAX_LIVES && (
                  <button
                    onClick={() => setIsLivesModalOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#4648d4] text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
