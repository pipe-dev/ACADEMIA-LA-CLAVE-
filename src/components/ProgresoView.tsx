'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { UserStats, DailyQuest, Badge } from '../types';
import { ALL_200_SINGING_BADGES, BADGE_CATEGORIES } from '../data/badgesData';
import { audioService } from '../utils/audioService';
import { FriendsSection } from './FriendsSection';
import { 
  shareUserAchievement, 
  triggerHapticFeedback 
} from '../utils/pwaFeatures';
import { logger } from '../utils/logger';
import { 
  Flame, CheckCircle2, Gift, ShoppingBag, Settings, ClipboardList, TrendingUp, Award, Clock, Music, Sparkles, BookOpen, BarChart2, Mic,
  Share2, ChevronDown, X, Search, Trophy, Lock, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

interface ProgresoViewProps {
  userStats: UserStats;
  quests: DailyQuest[];
  onClaimReward: (questId: string) => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
  onOpenVocalRangeModal?: () => void;
}

const getBadgeIcon = (iconName: string, unlocked: boolean) => {
  const className = `w-6 h-6 ${unlocked ? 'text-amber-500 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`;
  switch (iconName) {
    case 'Clock': return <Clock className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Music': return <Music className={className} />;
    case 'Award': return <Award className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const xpVal = payload[0].value;
    const dayLabel = label || payload[0].payload?.day || 'Día';
    return (
      <div className="bg-slate-900/95 dark:bg-[#0f1d2e] text-white p-3 rounded-2xl shadow-xl border-2 border-indigo-500/80 backdrop-blur-md text-xs space-y-1">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-1">
          <span className="font-extrabold text-indigo-300 uppercase tracking-wider">{dayLabel}</span>
          <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
            Día de práctica
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="font-heading font-extrabold text-lg text-emerald-400">{xpVal.toLocaleString()}</span>
          <span className="font-bold text-slate-300 text-[11px]">XP Total</span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          Toca o pasa el cursor para inspeccionar
        </p>
      </div>
    );
  }
  return null;
};

const MinutesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const mins = payload[0].value;
    const dayLabel = label || payload[0].payload?.day || 'Día';
    return (
      <div className="bg-slate-900/95 dark:bg-[#0f1d2e] text-white p-3 rounded-2xl shadow-xl border-2 border-emerald-500/80 backdrop-blur-md text-xs space-y-1">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-1">
          <span className="font-extrabold text-emerald-300 uppercase tracking-wider">{dayLabel}</span>
          <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
            Tiempo de Canto
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="font-heading font-extrabold text-lg text-emerald-400">{mins} min</span>
          <span className="font-bold text-slate-300 text-[11px]">practicados</span>
        </div>
      </div>
    );
  }
  return null;
};

const VocalRangeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0]?.payload;
    if (!dataItem) return null;
    return (
      <div className="bg-[#0b1828]/95 border border-indigo-500/40 p-3 rounded-2xl shadow-xl text-xs space-y-1 text-white backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-1">
          <span className="font-heading font-extrabold text-indigo-300">{label}</span>
          <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
            {dataItem.rangeLabel}
          </span>
        </div>
        <div className="pt-1 space-y-0.5">
          <p className="text-slate-300">
            Nota Grave: <strong className="text-indigo-400 font-extrabold">{dataItem.noteMin}</strong>
          </p>
          <p className="text-slate-300">
            Nota Aguda: <strong className="text-purple-400 font-extrabold">{dataItem.noteMax}</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Framer Motion cascade variants for smooth reveal of badges, medals & achievements
const cascadeContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const cascadeItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

export const ProgresoView: React.FC<ProgresoViewProps> = ({
  userStats,
  quests,
  onClaimReward,
  onOpenStore,
  onOpenSettings,
  onUpdateStats,
  onOpenVocalRangeModal
}) => {
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  // Web Share API Handler
  const handleShareProgress = async () => {
    audioService.playClickSound();
    triggerHapticFeedback('success');
    const currentBadges = (userStats.badges && userStats.badges.length >= 200) ? userStats.badges : ALL_200_SINGING_BADGES;
    const unlockedBadgesCount = currentBadges.filter((b) => b.unlocked).length;
    const title = 'Mi Progreso en Academia La Clave';
    const text = `¡Alcancé el Nivel ${userStats.level} (${userStats.levelTitle}) con ${userStats.streak} días de racha, ${userStats.xp} XP acumulados y ${unlockedBadgesCount} insignias en La Clave! #LaClaveApp`;

    const success = await shareUserAchievement(title, text);
    if (success) {
      logger.info('ProgresoView', 'Progreso compartido mediante Web Share API');
    }
  };

  // Read saved live vocal range from userStats or localStorage
  const savedVocalRange = userStats.vocalRangeData || (() => {
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const xpPercentage = Math.min(100, Math.round((userStats.xp / userStats.maxXP) * 100));

  const currentPracticeMinutes = userStats.practiceMinutes || 12;
  const dailyGoalMinutes = userStats.dailyGoalMinutes || 15;
  const goalPercentage = Math.min(100, Math.round((currentPracticeMinutes / dailyGoalMinutes) * 100));
  const isGoalReached = goalPercentage >= 100;

  // SVG Circular Ring Math
  const circleRadius = 40;
  const circleCircumference = 2 * Math.PI * circleRadius; // ~251.32
  const strokeDashoffset = circleCircumference - (circleCircumference * goalPercentage) / 100;

  const handleSelectGoal = (minutes: number) => {
    audioService.playClickSound();
    if (onUpdateStats) {
      onUpdateStats({ dailyGoalMinutes: minutes });
    }
  };

  const xpData = userStats.xpHistory && userStats.xpHistory.length > 0 ? userStats.xpHistory : [
    { day: 'Jue', xp: 820 },
    { day: 'Vie', xp: 910 },
    { day: 'Sáb', xp: 980 },
    { day: 'Dom', xp: 1050 },
    { day: 'Lun', xp: 1120 },
    { day: 'Mar', xp: 1190 },
    { day: 'Hoy', xp: userStats.xp }
  ];

  const weeklyMinutesData = [
    { day: 'Lun', minutes: 12 },
    { day: 'Mar', minutes: 18 },
    { day: 'Mié', minutes: 10 },
    { day: 'Jue', minutes: 22 },
    { day: 'Vie', minutes: 15 },
    { day: 'Sáb', minutes: 25 },
    { day: 'Hoy', minutes: currentPracticeMinutes },
  ];

  const totalWeeklyMinutes = weeklyMinutesData.reduce((sum, item) => sum + item.minutes, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);

  // 200 Singing Badges System
  const [badgeVisibleCount, setBadgeVisibleCount] = useState<number>(6);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<Badge | null>(null);
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<string>('Todas');
  const [badgeSearchQuery, setBadgeSearchQuery] = useState<string>('');

  const allBadges = (userStats.badges && userStats.badges.length >= 200) ? userStats.badges : ALL_200_SINGING_BADGES;

  // Las insignias desbloqueadas se verán al frente, desde la más reciente a la más vieja, y después las incompletas
  const sortedBadges = React.useMemo(() => {
    return [...allBadges].sort((a, b) => {
      // 1. Desbloqueadas al frente
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;

      // 2. Ambas desbloqueadas: de la más reciente a la más vieja
      if (a.unlocked && b.unlocked) {
        if (a.unlockedAt && b.unlockedAt) {
          const timeA = new Date(a.unlockedAt).getTime();
          const timeB = new Date(b.unlockedAt).getTime();
          if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
            return timeB - timeA;
          }
        }
        // Si no hay fecha o coinciden, ordenar por ID descendente (más recientes al inicio)
        const idA = parseInt(a.id.replace(/\D/g, '') || '0', 10);
        const idB = parseInt(b.id.replace(/\D/g, '') || '0', 10);
        return idB - idA;
      }

      // 3. Ambas bloqueadas: mayor progreso primero, luego orden por ID
      const pctA = a.maxProgress > 0 ? a.progress / a.maxProgress : 0;
      const pctB = b.maxProgress > 0 ? b.progress / b.maxProgress : 0;
      if (pctA !== pctB) {
        return pctB - pctA;
      }

      const idA = parseInt(a.id.replace(/\D/g, '') || '0', 10);
      const idB = parseInt(b.id.replace(/\D/g, '') || '0', 10);
      return idA - idB;
    });
  }, [allBadges]);

  const filteredBadges = React.useMemo(() => {
    return sortedBadges.filter(badge => {
      if ((selectedBadgeCategory === 'Completadas' || selectedBadgeCategory === 'Desbloqueadas') && !badge.unlocked) return false;
      if ((selectedBadgeCategory === 'Por completar' || selectedBadgeCategory === 'Bloqueadas') && badge.unlocked) return false;
      if (
        selectedBadgeCategory !== 'Todas' &&
        selectedBadgeCategory !== 'Completadas' &&
        selectedBadgeCategory !== 'Desbloqueadas' &&
        selectedBadgeCategory !== 'Por completar' &&
        selectedBadgeCategory !== 'Bloqueadas'
      ) {
        if (badge.category !== selectedBadgeCategory) return false;
      }
      if (badgeSearchQuery.trim()) {
        const q = badgeSearchQuery.toLowerCase();
        return badge.title.toLowerCase().includes(q) || badge.description.toLowerCase().includes(q) || badge.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sortedBadges, selectedBadgeCategory, badgeSearchQuery]);

  const displayedBadges = filteredBadges.slice(0, badgeVisibleCount);
  const totalUnlockedBadges = allBadges.filter((b) => b.unlocked).length;

  const handleOpenBadgeDetails = (badge: Badge) => {
    if (badge.unlocked) {
      audioService.playBadgeUnlockedSound();
    } else {
      audioService.playClickSound();
    }
    triggerHapticFeedback('light');
    setSelectedBadgeModal(badge);
  };

  const handleShareSingleBadge = async (badge: Badge) => {
    audioService.playClickSound();
    triggerHapticFeedback('success');
    const title = `Insignia: ${badge.title}`;
    const text = badge.unlocked
      ? `¡He desbloqueado la insignia de canto "${badge.title}" (${badge.category}) en Academia La Clave! #LaClaveApp`
      : `¡Estoy practicando para desbloquear la insignia "${badge.title}" en Academia La Clave! #LaClaveApp`;
    await shareUserAchievement(title, text);
  };

  const handleClaim = () => {
    audioService.playClickSound();
    audioService.playXpGainSound();

    const completedUnclaimed = quests.find(q => q.completed);
    if (completedUnclaimed) {
      onClaimReward(completedUnclaimed.id);
      setClaimedNotice(`¡Has reclamado +${completedUnclaimed.xpReward} XP!`);
    } else {
      setClaimedNotice('Completa más misiones diarias para obtener recompensas.');
    }

    setTimeout(() => setClaimedNotice(null), 3000);
  };

  const recentLessons = userStats.recentLessons || [];

  return (
    <div className="pb-36 pt-4 px-4 max-w-md mx-auto space-y-5 animate-fadeIn">
      {/* Level & XP Card */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-[#c6c5d7] uppercase tracking-wider">
              Nivel {userStats.level}
            </span>
            <h2 className="font-heading font-extrabold text-2xl text-[#0b1c30] dark:text-[#d3e4fe] leading-snug mt-0.5">
              {userStats.levelTitle}
            </h2>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="font-heading font-bold text-sm text-[#2c2abc] dark:text-[#c0c1ff]">
              {userStats.xp} / {userStats.maxXP}
            </span>
            <span className="text-xs text-slate-400 font-bold block mb-2">XP</span>
            
            {/* Web Share API Button */}
            <button
              type="button"
              onClick={handleShareProgress}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Compartir tus logros con Web Share API"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-indigo-50 dark:bg-slate-800 rounded-full overflow-hidden border border-indigo-100/80 dark:border-slate-700">
          <div 
            className="h-full bg-[#4648d4] dark:bg-[#4648d4] rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Meta de Entrenamiento Diaria con Progreso Circular */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4648d4] dark:text-[#c0c1ff]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                Meta de Práctica Diaria
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                Tu objetivo de minutos hoy
              </p>
            </div>
          </div>
          {isGoalReached && (
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-700 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Meta lograda
            </span>
          )}
        </div>

        {/* Circular Progress Display & Details */}
        <div className="flex items-center gap-4 pt-1">
          {/* Circular Ring SVG */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                className="stroke-[#4648d4] dark:stroke-[#6063ee] transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content inside Circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <span className="font-heading font-extrabold text-xl text-[#0b1c30] dark:text-[#d3e4fe] leading-tight">
                {currentPracticeMinutes}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                de {dailyGoalMinutes} min
              </span>
            </div>
          </div>

          {/* Goal Selector Buttons */}
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Ajusta tu meta diaria:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[10, 15, 30, 60].map((mins) => {
                const isSelected = dailyGoalMinutes === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => handleSelectGoal(mins)}
                    className={`py-2 px-2.5 rounded-2xl text-xs font-heading font-bold border press-effect transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#4648d4] text-white border-[#3b3dbf] shadow-md shadow-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{mins} min</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Racha Semanal - Registro de Días Consecutivos */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 px-1">
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span>Constancia Semanal</span>
          </span>
          <span className="text-slate-400 font-medium">
            {Math.min(7, userStats.streak)} de 7 días activos
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayLabel, idx) => {
            const isCompletedDay = idx < Math.min(7, userStats.streak);
            const isToday = idx === Math.min(6, userStats.streak - 1);
            return (
              <div
                key={dayLabel + idx}
                className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
                  isToday
                    ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-white border-orange-600 shadow-md scale-105'
                    : isCompletedDay
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-[10px] font-extrabold opacity-80">{dayLabel}</span>
                {isCompletedDay ? (
                  <Flame className={`w-4 h-4 mt-1 ${isToday ? 'fill-white text-white' : 'fill-orange-500 text-orange-500'}`} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen Semanal de Práctica con Gráfica de Barras */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0b1c30] dark:text-[#d3e4fe]">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                Resumen Semanal
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                Minutos de práctica por día
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-heading font-extrabold text-lg text-emerald-600 dark:text-emerald-400 block leading-none">
              {totalWeeklyMinutes} min
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ~{avgDailyMinutes} min/día
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-40 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyMinutesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
              />
              <Tooltip content={<MinutesTooltip />} />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {weeklyMinutesData.map((_entry, index) => {
                  const isToday = index === weeklyMinutesData.length - 1;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isToday ? '#10b981' : '#4648d4'} 
                      opacity={isToday ? 1 : 0.85}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* XP Evolution Chart (Últimos 7 días) */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0b1c30] dark:text-[#d3e4fe]">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4648d4] dark:text-[#c0c1ff]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                Evolución de XP
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                Últimos 7 días
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#4648d4] dark:text-[#c0c1ff] bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-full">
            +{xpData[xpData.length - 1].xp - xpData[0].xp} XP
          </span>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={xpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4648d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4648d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                domain={['dataMin - 50', 'dataMax + 50']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="xp" 
                stroke="#4648d4" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#xpGradient)"
                dot={{ r: 4, fill: '#4648d4', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#6cf8bb', strokeWidth: 3, stroke: '#005236' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolución de Rango Vocal (Tesitura) Chart */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0b1c30] dark:text-[#d3e4fe]">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                Progreso de Tesitura Vocal
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                Expansión de notas graves a agudas
              </p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
            2.8 Octavas
          </span>
        </div>

        {/* Current Range Highlights */}
        <div className="grid grid-cols-2 gap-2 bg-[#f8fafc] dark:bg-[#0b1828] p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nota Más Grave</span>
            <span className="font-heading font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
              {savedVocalRange ? savedVocalRange.noteMin : 'Sol2'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nota Más Aguda</span>
            <span className="font-heading font-extrabold text-sm text-purple-600 dark:text-purple-400">
              {savedVocalRange ? savedVocalRange.noteMax : 'Do5'}
            </span>
          </div>
        </div>

        {/* Live Vocal Range Test CTA Button */}
        {onOpenVocalRangeModal && (
          <button
            onClick={() => {
              audioService.playClickSound();
              onOpenVocalRangeModal();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-indigo-500/20 active:scale-98"
          >
            <Mic className="w-4 h-4 animate-bounce" />
            <span>{savedVocalRange ? `Clasificación: ${savedVocalRange.classification} (Volver a evaluar)` : '¡Evaluar mi Tesitura en Vivo con Micrófono!'}</span>
          </button>
        )}

        <div className="h-48 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={[
                { week: 'Sem 1', minPitch: 130, maxPitch: 330, noteMin: 'Do3', noteMax: 'Mi4', rangeLabel: 'Barítono / Contralto' },
                { week: 'Sem 2', minPitch: 122, maxPitch: 370, noteMin: 'Si2', noteMax: 'Fa#4', rangeLabel: 'Tenor Inicial' },
                { week: 'Sem 3', minPitch: 110, maxPitch: 440, noteMin: 'La2', noteMax: 'La4', rangeLabel: 'Tenor Ampliado' },
                { week: 'Sem 4', minPitch: 98,  maxPitch: 523, noteMin: 'Sol2', noteMax: 'Do5', rangeLabel: 'Tesitura Ampliada' }
              ]} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="vocalMaxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="vocalMinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis 
                dataKey="week" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
              />
              <Tooltip content={<VocalRangeTooltip />} />
              <Area 
                type="monotone" 
                dataKey="maxPitch" 
                name="Nota Aguda"
                stroke="#a855f7" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#vocalMaxGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="minPitch" 
                name="Nota Grave"
                stroke="#6366f1" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#vocalMinGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lecciones Recientes Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-[#0b1c30] dark:text-[#d3e4fe]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4648d4] dark:text-[#c0c1ff]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg">
                Lecciones Recientes
              </h3>
              <p className="text-xs text-slate-400 font-medium">Últimas lecciones completadas</p>
            </div>
          </div>
          {recentLessons.length > 0 && (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {recentLessons.length} lecciones
            </span>
          )}
        </div>

        {recentLessons.length === 0 ? (
          <div className="bg-white dark:bg-[#102034] rounded-2xl p-5 border border-slate-100 dark:border-[#1b2b3f] text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Aún no has completado lecciones recientes.
            </p>
            <p className="text-[11px] text-[#4648d4] dark:text-[#c0c1ff] font-bold">
              ¡Comienza tu primera lección en la pestaña 'Academia'!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentLessons.slice(0, 5).map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-[#102034] rounded-2xl p-3.5 border border-slate-100 dark:border-[#1b2b3f] shadow-xs flex items-center justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="font-heading font-bold text-xs text-[#0b1c30] dark:text-[#d3e4fe] truncate">
                      {lesson.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="truncate">{lesson.unitTitle || 'Academia'}</span>
                      <span>•</span>
                      <span>{lesson.completedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {lesson.score}%
                  </span>
                  <span className="text-[10px] font-extrabold text-[#4648d4] dark:text-[#c0c1ff]">
                    +{lesson.xpEarned} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insignias y Logros (200 Singing Badges System) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-[#0b1c30] dark:text-[#d3e4fe]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg">
                Insignias de Canto
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Toca cualquier insignia para ver detalles</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
            {totalUnlockedBadges} / {allBadges.length}
          </span>
        </div>

        {/* Search & Minimalist Filter Pills */}
        <div className="space-y-2">
          {/* Search Box - Minimalist */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={badgeSearchQuery}
              onChange={(e) => {
                setBadgeSearchQuery(e.target.value);
                setBadgeVisibleCount(12);
              }}
              placeholder="Buscar insignia..."
              className="w-full pl-8 pr-7 py-2 bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-[#1b2b3f] focus:border-amber-400/60 focus:bg-white dark:focus:bg-[#102034] rounded-xl text-xs text-[#0b1c30] dark:text-[#d3e4fe] placeholder:text-slate-400 transition-all focus:outline-none"
            />
            {badgeSearchQuery && (
              <button
                type="button"
                onClick={() => setBadgeSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Minimalist 3-Pill Segmented Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl text-xs font-medium">
            {[
              { id: 'Todas', label: 'Todas' },
              { id: 'Completadas', label: 'Completadas' },
              { id: 'Por completar', label: 'Por completar' }
            ].map((tab) => {
              const isActive =
                selectedBadgeCategory === tab.id ||
                (tab.id === 'Completadas' && selectedBadgeCategory === 'Desbloqueadas') ||
                (tab.id === 'Por completar' && selectedBadgeCategory === 'Bloqueadas');
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    audioService.playClickSound();
                    setSelectedBadgeCategory(tab.id);
                    setBadgeVisibleCount(12);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer truncate ${
                    isActive
                      ? 'bg-white dark:bg-[#102034] text-amber-700 dark:text-amber-300 shadow-2xs font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Badges List with Framer Motion Cascade Reveal */}
        <motion.div 
          key={`${selectedBadgeCategory}-${badgeSearchQuery}-${badgeVisibleCount}`}
          variants={cascadeContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3"
        >
          {displayedBadges.length === 0 ? (
            <motion.div 
              variants={cascadeItemVariants}
              className="bg-white dark:bg-[#102034] rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 text-xs border border-slate-100 dark:border-[#1b2b3f]"
            >
              No se encontraron insignias que coincidan con los filtros.
            </motion.div>
          ) : (
            displayedBadges.map((badge) => {
              const pct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));
              return (
                <motion.div 
                  key={badge.id}
                  variants={cascadeItemVariants}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenBadgeDetails(badge)}
                  className={`rounded-2xl p-4 transition-all flex items-start gap-3.5 border cursor-pointer relative overflow-hidden group ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-yellow-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20 border-amber-400/80 dark:border-amber-500/60 shadow-md'
                      : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-[#1b2b3f] opacity-90'
                  }`}
                >
                  {/* Subtle Glow backdrop for unlocked badge */}
                  {badge.unlocked && (
                    <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none animate-pulse" />
                  )}

                  {/* Badge Icon Container */}
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                      badge.unlocked
                        ? 'bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 border-2 border-amber-200 dark:border-amber-400 shadow-amber-300/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {getBadgeIcon(badge.iconName, badge.unlocked)}
                    </div>
                    {badge.unlocked && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white dark:border-slate-900 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                      </span>
                    )}
                  </div>

                  {/* Details & Progress */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe] truncate flex items-center gap-1.5">
                        <span>{badge.title}</span>
                        {badge.unlocked && (
                          <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />
                        )}
                      </h4>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                        badge.unlocked
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {badge.unlocked ? '¡Obtenida!' : `${badge.progress} / ${badge.maxProgress}`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {badge.description}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          badge.unlocked ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-[#4648d4]'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Load More Button */}
        {filteredBadges.length > badgeVisibleCount && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                setBadgeVisibleCount((prev) => Math.min(filteredBadges.length, prev + 15));
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Ver Más Insignias ({filteredBadges.length - badgeVisibleCount} restantes)</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Insignia */}
      <AnimatePresence>
        {selectedBadgeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md cursor-pointer"
            onClick={() => {
              audioService.playClickSound();
              setSelectedBadgeModal(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#102034] rounded-3xl border-2 border-amber-400/80 dark:border-amber-500/60 p-6 max-w-sm w-full shadow-2xl relative overflow-hidden space-y-4 cursor-default"
            >
              {/* Glow backdrop behind badge */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setSelectedBadgeModal(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Animated Badge Header */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="relative">
                  {/* Spinning decorative halo if unlocked */}
                  {selectedBadgeModal.unlocked && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-3 rounded-full border-2 border-dashed border-amber-400/60 dark:border-amber-300/40 pointer-events-none"
                    />
                  )}

                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.9, 1.1, 1] }}
                    transition={{ duration: 0.5, ease: 'backOut' }}
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg relative ${
                      selectedBadgeModal.unlocked
                        ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-amber-950 border-4 border-amber-200 shadow-amber-400/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {getBadgeIcon(selectedBadgeModal.iconName, selectedBadgeModal.unlocked)}
                  </motion.div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    {selectedBadgeModal.category}
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-[#0b1c30] dark:text-[#d3e4fe] mt-2 leading-tight">
                    {selectedBadgeModal.title}
                  </h3>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-bold ${
                selectedBadgeModal.unlocked
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedBadgeModal.unlocked ? (
                    <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedBadgeModal.unlocked ? '¡Insignia Obtenida!' : 'En Progreso'}
                  </span>
                </div>
                <span>
                  {selectedBadgeModal.progress} / {selectedBadgeModal.maxProgress}
                </span>
              </div>

              {/* Description & Progress */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedBadgeModal.description}
                </p>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedBadgeModal.unlocked ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-[#4648d4]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((selectedBadgeModal.progress / selectedBadgeModal.maxProgress) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleShareSingleBadge(selectedBadgeModal)}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-heading font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir Insignia</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Misiones Diarias Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[#0b1c30] dark:text-[#d3e4fe]">
          <ClipboardList className="w-5 h-5 text-[#4648d4] dark:text-[#c0c1ff]" />
          <h3 className="font-heading font-bold text-lg">
            Misiones Diarias
          </h3>
        </div>

        {/* Quests List with Framer Motion Cascade Reveal */}
        <motion.div 
          variants={cascadeContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {quests.map((quest) => {
            const pct = Math.min(100, Math.round((quest.progress / quest.max) * 100));
            return (
              <motion.div 
                key={quest.id}
                variants={cascadeItemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`rounded-3xl p-4 transition-all ${
                  quest.completed
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400/80 dark:border-emerald-600/80 shadow-xs'
                    : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
                    {quest.title}
                  </span>

                  {quest.completed ? (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ¡COMPLETADO!
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {quest.progress} / {quest.max}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      quest.completed ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-[#4648d4]'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Claim Notice banner */}
        {claimedNotice && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl text-xs font-bold text-center animate-bounce">
            {claimedNotice}
          </div>
        )}

        {/* Claim Reward Primary Button */}
        <button
          onClick={handleClaim}
          className="w-full py-4 rounded-full tactile-btn-primary font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
        >
          <Gift className="w-5 h-5 text-amber-300" />
          <span>Reclamar Recompensa</span>
        </button>
      </div>

      {/* Sección Amigos y Retos */}
      <FriendsSection userXp={userStats.xp} userLevel={userStats.level} />

      {/* Secondary Actions (Tienda & Configuración) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => {
            audioService.playClickSound();
            onOpenStore();
          }}
          className="py-3.5 px-4 rounded-full bg-white dark:bg-[#102034] border border-slate-200 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe] font-heading font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-[#1b2b3f] active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <ShoppingBag className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
          <span>Tienda</span>
        </button>

        <button
          onClick={() => {
            audioService.playClickSound();
            onOpenSettings();
          }}
          className="py-3.5 px-4 rounded-full bg-white dark:bg-[#102034] border border-slate-200 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe] font-heading font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-[#1b2b3f] active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <Settings className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
          <span>Configuración</span>
        </button>
      </div>
    </div>
  );
};

export default ProgresoView;
