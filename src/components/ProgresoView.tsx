'use client';
import React from 'react';
import { ALL_50_SINGING_BADGES } from '../data/badgesData';
import { audioService } from '../utils/audioService';
import { getTodayStr } from '../utils/streakPrompt';
import { getCalendarWeekData } from '../utils/calendarWeekHelper';
import { getXpEvolutionData } from '../utils/xpEvolutionHelper';
import { FriendsSection } from './FriendsSection';
import { ProgresoViewProps } from './progreso/progresoTypes';
import { ProgresoLevelCard } from './progreso/ProgresoLevelCard';
import { ProgresoDailyGoalCard } from './progreso/ProgresoDailyGoalCard';
import { ProgresoConsistencyStreak } from './progreso/ProgresoConsistencyStreak';
import { ProgresoWeeklyChart } from './progreso/ProgresoWeeklyChart';
import { ProgresoXpChart } from './progreso/ProgresoXpChart';
import { ProgresoVocalRangeSection } from './progreso/ProgresoVocalRangeSection';
import { ProgresoRecentLessons } from './progreso/ProgresoRecentLessons';
import { ProgresoBadgesSection } from './progreso/ProgresoBadgesSection';
import { ProgresoQuestsSection } from './progreso/ProgresoQuestsSection';
import { ProgresoFooterActions } from './progreso/ProgresoFooterActions';

export const ProgresoView: React.FC<ProgresoViewProps> = ({
  userStats,
  quests,
  onClaimReward,
  bonusChestClaimed,
  bonusChestReward,
  onClaimBonusChest,
  onOpenStore,
  onOpenSettings,
  onUpdateStats,
  onOpenVocalRangeModal,
  zenMode = false,
}) => {
  // Read saved live vocal range from userStats or localStorage
  const savedVocalRange = userStats.vocalRangeData || (() => {
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const today = getTodayStr();
  const isToday = userStats.lastPracticeDate === today;
  const currentPracticeMinutes = isToday ? (userStats.todayPracticeMinutes || 0) : 0;
  const dailyGoalMinutes = userStats.dailyGoalMinutes || 15;

  const handleSelectGoal = (minutes: number) => {
    audioService.playClickSound();
    if (onUpdateStats) {
      onUpdateStats({ dailyGoalMinutes: minutes });
    }
  };

  const weekData = getCalendarWeekData(currentPracticeMinutes);

  const xpEvolution = getXpEvolutionData(userStats.xp || 0);
  const xpData = xpEvolution.points;

  const weeklyMinutesData = weekData.days.map((d) => ({
    day: d.chartLabel,
    minutes: d.minutes,
    isToday: d.isToday,
  }));

  const allBadges = (userStats.badges && userStats.badges.length === 50) ? userStats.badges : ALL_50_SINGING_BADGES;
  const recentLessons = userStats.recentLessons || [];

  return (
    <div className={`pb-6 pt-1 px-4 max-w-md mx-auto space-y-5 animate-fadeIn ${zenMode ? 'text-[#ded9cf]' : ''}`}>
      {/* Level & XP Card with Web Share */}
      <div id="tour-progreso-level">
        <ProgresoLevelCard
          userStats={userStats}
          zenMode={zenMode}
        />
      </div>

      {/* Meta de Entrenamiento Diaria con Progreso Circular */}
      <div id="tour-progreso-goal">
        <ProgresoDailyGoalCard
          currentPracticeMinutes={currentPracticeMinutes}
          dailyGoalMinutes={dailyGoalMinutes}
          onSelectGoal={handleSelectGoal}
          zenMode={zenMode}
        />
      </div>

      {/* Racha Semanal - Registro de Días Consecutivos */}
      <div id="tour-progreso-consistency">
        <ProgresoConsistencyStreak
          streak={userStats.streak}
          days={weekData.days}
          activeDaysCount={weekData.activeDaysCount}
          zenMode={zenMode}
        />
      </div>

      {/* Resumen Semanal de Práctica con Gráfica de Barras */}
      <ProgresoWeeklyChart
        weeklyMinutesData={weeklyMinutesData}
        totalWeeklyMinutes={weekData.totalWeeklyMinutes}
        avgDailyMinutes={weekData.avgDailyMinutes}
        zenMode={zenMode}
      />

      {/* XP Evolution Chart (Últimos 7 días) */}
      <ProgresoXpChart
        xpData={xpData}
        xpGained={xpEvolution.xpGained}
        zenMode={zenMode}
      />

      {/* Evolución de Rango Vocal (Tesitura) Chart */}
      <ProgresoVocalRangeSection
        savedVocalRange={savedVocalRange}
        onOpenVocalRangeModal={onOpenVocalRangeModal}
        zenMode={zenMode}
      />

      {/* Lecciones Recientes Section */}
      <ProgresoRecentLessons
        recentLessons={recentLessons}
        zenMode={zenMode}
      />

      {/* Insignias y Logros (200 Singing Badges System) */}
      <div id="tour-progreso-badges">
        <ProgresoBadgesSection
          allBadges={allBadges}
          zenMode={zenMode}
        />
      </div>

      {/* Misiones Diarias Section */}
      <div id="tour-progreso-quests">
        <ProgresoQuestsSection
          quests={quests}
          onClaimReward={onClaimReward}
          bonusChestClaimed={bonusChestClaimed}
          bonusChestReward={bonusChestReward}
          onClaimBonusChest={onClaimBonusChest}
          zenMode={zenMode}
        />
      </div>

      {/* Sección Amigos y Retos */}
      <FriendsSection
        userXp={userStats.xp}
        userLevel={userStats.level}
        zenMode={zenMode}
      />

      {/* Secondary Actions (Tienda & Configuración) */}
      <ProgresoFooterActions
        onOpenStore={onOpenStore}
        onOpenSettings={onOpenSettings}
        zenMode={zenMode}
      />
    </div>
  );
};

export default ProgresoView;
