import { useState, useEffect, useCallback, useRef } from 'react';
import { UserStats, DailyQuest, TabType } from '../../types';
import { INITIAL_USER_STATS, INITIAL_QUESTS } from '../../data/academyData';
import { evaluateBadges } from '../../utils/badgeHelper';
import { calculatePassiveRecharge } from '../../utils/livesEngine';
import { getLevelTitle, calculateLevelFromXP } from '../../utils/levelHelper';
import {
  getTodayStr,
  isStreakLitToday,
  subscribeStreakEligibleAction,
} from '../../utils/streakPrompt';
import { recordDayPracticeMinutes } from '../../utils/calendarWeekHelper';
import { recordDailyXpGain, recordDailyXpSnapshot } from '../../utils/xpEvolutionHelper';
import {
  loadDailyQuestsState,
  saveDailyQuestsState,
  processQuestProgress,
  subscribeQuestEvent,
  emitQuestEvent,
  DailyQuestsState,
  BONUS_CHEST_REWARD,
} from '../../utils/dailyQuestsEngine';
import { audioService } from '../../utils/audioService';
import { ToastItem } from '../ToastNotification';
import { useLivesState } from './useLivesState';
import { useUnitProgression } from './useUnitProgression';

interface UseGlobalGameStateParams {
  activeTab: TabType;
  isOnline: boolean;
  onOpenUnit1Celebration: () => void;
  onOpenUnit2Celebration: () => void;
  onOpenUnit3Celebration: () => void;
  onSetActiveTab: (tab: TabType) => void;
}

export function useGlobalGameState({
  activeTab,
  isOnline,
  onOpenUnit1Celebration,
  onOpenUnit2Celebration,
  onOpenUnit3Celebration,
  onSetActiveTab,
}: UseGlobalGameStateParams) {
  // Toast Notifications State with strict deduplication
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    setToasts((prev) => {
      const isDuplicate = prev.some(
        (t) => t.type === toast.type && t.title === toast.title && t.description === toast.description
      );
      if (isDuplicate) return prev;
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      return [...prev, { ...toast, id }];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load persisted user stats with passive recharge applied (v6 for zero-absolute 50 authentic badges reset)
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const today = getTodayStr();
    try {
      const savedV6 = localStorage.getItem('laclave_user_stats_v6');
      if (savedV6) {
        const parsed = JSON.parse(savedV6);
        const recharged = calculatePassiveRecharge(parsed);
        const isToday = recharged.lastPracticeDate === today;
        const normalized: UserStats = {
          ...recharged,
          todayPracticeMinutes: isToday ? (recharged.todayPracticeMinutes || 0) : 0,
          lastPracticeDate: today,
          dailyGoalMinutes: recharged.dailyGoalMinutes || 15,
        };
        const lvl = calculateLevelFromXP(normalized.xp || 0);
        normalized.level = lvl.level;
        normalized.levelTitle = lvl.levelTitle;
        normalized.maxXP = lvl.maxXP;

        return {
          ...normalized,
          badges: evaluateBadges(normalized),
        };
      } else {
        // Absolute zero reset: purge legacy v5/v4 stats containing 175 dummy badges
        localStorage.removeItem('laclave_user_stats_v5');
        localStorage.removeItem('laclave_user_stats_v4');
        localStorage.removeItem('laclave_seen_progress_news_v2');
      }
    } catch {}

    const initialWithToday: UserStats = {
      ...INITIAL_USER_STATS,
      todayPracticeMinutes: 0,
      lastPracticeDate: today,
      dailyGoalMinutes: 15,
    };
    return {
      ...initialWithToday,
      badges: evaluateBadges(initialWithToday),
    };
  });

  // Load persisted daily quests with deterministic rotation & chest bonus (Enfoque A)
  const [dailyQuestsState, setDailyQuestsState] = useState<DailyQuestsState>(() => {
    return loadDailyQuestsState();
  });

  const quests = dailyQuestsState.quests;
  const bonusChestClaimed = dailyQuestsState.bonusChestClaimed;
  const bonusChestReward = dailyQuestsState.bonusChestReward || BONUS_CHEST_REWARD;

  // Track seen unlocked badges and completed quests for notification badge on BottomNav
  const [seenProgressCount, setSeenProgressCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('laclave_seen_progress_news_v2');
      if (saved !== null) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  const totalUnlockedBadges = (userStats.badges || []).filter((b) => b.unlocked).length;
  const totalCompletedQuests =
    quests.filter((q) => q.completed && !q.claimed).length +
    (quests.every((q) => q.completed) && !bonusChestClaimed ? 1 : 0);
  const totalProgressNews = totalUnlockedBadges + totalCompletedQuests;
  const progressBadgeCount = Math.max(0, totalProgressNews - seenProgressCount);

  // Clear unseen news count when activeTab === 'progreso'
  useEffect(() => {
    if (activeTab === 'progreso' && totalProgressNews !== seenProgressCount) {
      setSeenProgressCount(totalProgressNews);
      try {
        localStorage.setItem('laclave_seen_progress_news_v2', String(totalProgressNews));
      } catch {}
    }
  }, [activeTab, totalProgressNews, seenProgressCount]);

  // Sync userStats to localStorage
  useEffect(() => {
    localStorage.setItem('laclave_user_stats_v6', JSON.stringify(userStats));
    recordDailyXpSnapshot(userStats.xp || 0);
  }, [userStats]);

  // Dynamic Vocal Range auto-expansion listener: updates userStats & celebrates milestones
  useEffect(() => {
    const handleRangeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      if (!detail?.newRange) return;

      const newRange = detail.newRange;
      const result = detail.result;

      setUserStats((prev) => ({
        ...prev,
        vocalRange: newRange.classification,
        vocalRangeData: newRange,
      }));

      if (result?.expanded) {
        audioService.play3StarFanfare();
        const direction = result.expandedMax
          ? `aguda (${result.newMaxNote})`
          : `grave (${result.newMinNote})`;
        addToast({
          type: 'quest',
          title: '¡Expansión de Rango Vocal! 🎉',
          description: `¡Tu voz ha alcanzado la nota ${direction}! Tu tesitura ahora abarca ${result.newOctaves} octavas.`,
        });
      }
    };

    window.addEventListener('laclave_vocal_range_updated', handleRangeUpdate);
    return () => window.removeEventListener('laclave_vocal_range_updated', handleRangeUpdate);
  }, [addToast]);

  // Subscribe to Global Quest Events (Afinador, Academia, Karaoke, Biometría)
  useEffect(() => {
    return subscribeQuestEvent((type, amount) => {
      setDailyQuestsState((prev) => {
        const { updatedQuests, newlyCompleted } = processQuestProgress(prev.quests, type, amount);

        if (newlyCompleted.length > 0) {
          audioService.playBadgeUnlockedSound();
          newlyCompleted.forEach((q) => {
            addToast({
              type: 'quest',
              title: '¡Misión Diaria Completada!',
              description: `"${q.title}" (Reclama +${q.xpReward} XP)`,
              xpReward: q.xpReward,
            });
          });
        }

        const nextState: DailyQuestsState = {
          ...prev,
          quests: updatedQuests,
        };
        saveDailyQuestsState(nextState);
        return nextState;
      });
    });
  }, [addToast]);

  // Daily rotation check at midnight or when tab gets focused
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayStr();
      setDailyQuestsState((prev) => {
        if (prev.date !== today) {
          return loadDailyQuestsState();
        }
        return prev;
      });
    };

    window.addEventListener('focus', checkDateChange);
    const interval = setInterval(checkDateChange, 30000);
    return () => {
      window.removeEventListener('focus', checkDateChange);
      clearInterval(interval);
    };
  }, []);

  // Streak prompt overlay: appears after an action if streak was not ignited today
  const [streakPromptOpen, setStreakPromptOpen] = useState<boolean>(false);

  const openStreakPrompt = useCallback(() => {
    if (isStreakLitToday()) return;
    setStreakPromptOpen(true);
  }, []);

  useEffect(() => {
    return subscribeStreakEligibleAction(openStreakPrompt);
  }, [openStreakPrompt]);

  const handleStreakIgniteComplete = (newStreak: number) => {
    try {
      localStorage.setItem('laclave_last_streak_date', getTodayStr());
    } catch {}
    setUserStats((prev) => ({
      ...prev,
      streak: newStreak,
    }));
  };

  // Compose Lives State & Recharge Engine
  const {
    handleLoseLife,
    handleGainLife,
    handleBuyLife,
    handleUseCourtesySong,
  } = useLivesState({
    userStats,
    setUserStats,
    addToast,
  });

  // Compose Units Progression Engine
  const {
    units,
    unlockedUnitAnimationId,
    setUnlockedUnitAnimationId,
    justUnlockedNodeId,
    setJustUnlockedNodeId,
    handleCompleteNode,
    handleContinueToUnit2,
    handleContinueToUnit3,
    handleContinueToUnit4,
  } = useUnitProgression({
    setUserStats,
    addToast,
    isOnline,
    onOpenUnit1Celebration,
    onOpenUnit2Celebration,
    onOpenUnit3Celebration,
    onSetActiveTab,
  });

  const handleUpdateNotesTuned = (countToAdd: number) => {
    try {
      const cur = parseInt(localStorage.getItem('laclave_notes_tuned_total') || '0', 10);
      localStorage.setItem('laclave_notes_tuned_total', String(cur + countToAdd));
    } catch {}

    setUserStats((prev) => ({
      ...prev,
      badges: evaluateBadges(prev),
    }));

    emitQuestEvent('NOTE_TUNED', countToAdd);
  };

  const practiceSecondsBufferRef = useRef<number>(0);

  const handleUpdatePracticeTime = (secondsToAdd: number) => {
    practiceSecondsBufferRef.current += secondsToAdd;
    if (practiceSecondsBufferRef.current < 60) return;

    const minsToAdd = Math.floor(practiceSecondsBufferRef.current / 60);
    practiceSecondsBufferRef.current = practiceSecondsBufferRef.current % 60;
    if (minsToAdd <= 0) return;

    recordDayPracticeMinutes(minsToAdd);

    setUserStats((prev) => {
      const today = getTodayStr();
      const isToday = prev.lastPracticeDate === today;
      const currentTodayMins = isToday ? (prev.todayPracticeMinutes || 0) : 0;
      const newTodayMins = currentTodayMins + minsToAdd;
      const updatedTotalMins = (prev.practiceMinutes || 0) + minsToAdd;

      const updatedStats: UserStats = {
        ...prev,
        practiceMinutes: updatedTotalMins,
        todayPracticeMinutes: newTodayMins,
        lastPracticeDate: today,
      };
      return {
        ...updatedStats,
        badges: evaluateBadges(updatedStats),
      };
    });

    emitQuestEvent('PRACTICE_MINUTES', minsToAdd);
  };

  const handleClaimReward = (questId: string) => {
    const quest = dailyQuestsState.quests.find((q) => q.id === questId);
    if (!quest || quest.claimed || !quest.completed) return;

    setUserStats((prev) => {
      const newXP = prev.xp + quest.xpReward;
      recordDailyXpGain(quest.xpReward, newXP);
      const lvl = calculateLevelFromXP(newXP);
      if (lvl.level > prev.level) {
        addToast({
          type: 'level',
          title: `¡NIVEL ALCANZADO!`,
          description: `¡Subiste al Nivel ${lvl.level}: ${lvl.levelTitle}!`,
          levelNumber: lvl.level,
        });
      }
      const updated: UserStats = {
        ...prev,
        xp: newXP,
        level: lvl.level,
        maxXP: lvl.maxXP,
        levelTitle: lvl.levelTitle,
      };
      return {
        ...updated,
        badges: evaluateBadges(updated),
      };
    });

    audioService.playClickSound();
    audioService.playXpGainSound();
    addToast({
      type: 'xp',
      title: '¡Recompensa Reclamada!',
      description: `Has obtenido +${quest.xpReward} XP por "${quest.title}"`,
      xpReward: quest.xpReward,
    });

    setDailyQuestsState((prev) => {
      const updated: DailyQuestsState = {
        ...prev,
        quests: prev.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
      };
      saveDailyQuestsState(updated);
      return updated;
    });
  };

  const handleClaimBonusChest = () => {
    if (dailyQuestsState.bonusChestClaimed) return;
    const allCompleted = dailyQuestsState.quests.every((q) => q.completed);
    if (!allCompleted) return;

    const reward = dailyQuestsState.bonusChestReward || BONUS_CHEST_REWARD;
    setUserStats((prev) => {
      const newXP = prev.xp + reward;
      recordDailyXpGain(reward, newXP);
      const lvl = calculateLevelFromXP(newXP);
      if (lvl.level > prev.level) {
        addToast({
          type: 'level',
          title: `¡NIVEL ALCANZADO!`,
          description: `¡Subiste al Nivel ${lvl.level}: ${lvl.levelTitle}!`,
          levelNumber: lvl.level,
        });
      }
      const updated: UserStats = {
        ...prev,
        xp: newXP,
        level: lvl.level,
        maxXP: lvl.maxXP,
        levelTitle: lvl.levelTitle,
      };
      return {
        ...updated,
        badges: evaluateBadges(updated),
      };
    });

    audioService.play3StarFanfare();
    addToast({
      type: 'xp',
      title: '¡Cofre Diario Reclamado!',
      description: `¡Has completado todas las misiones de hoy! (+${reward} XP)`,
      xpReward: reward,
    });

    setDailyQuestsState((prev) => {
      const updated: DailyQuestsState = {
        ...prev,
        bonusChestClaimed: true,
      };
      saveDailyQuestsState(updated);
      return updated;
    });
  };

  const handleUpdateStats = useCallback((updated: Partial<UserStats>) => {
    setUserStats((prev) => {
      const merged: UserStats = { ...prev, ...updated };
      if (typeof updated.xp === 'number') {
        const diff = updated.xp - (prev.xp || 0);
        if (diff > 0) {
          recordDailyXpGain(diff, updated.xp);
        } else {
          recordDailyXpSnapshot(updated.xp);
        }
        const lvl = calculateLevelFromXP(updated.xp);
        if (lvl.level > prev.level) {
          addToast({
            type: 'level',
            title: `¡NIVEL ALCANZADO!`,
            description: `¡Subiste al Nivel ${lvl.level}: ${lvl.levelTitle}!`,
            levelNumber: lvl.level,
          });
        }
        merged.level = lvl.level;
        merged.levelTitle = lvl.levelTitle;
        merged.maxXP = lvl.maxXP;
      }
      return {
        ...merged,
        badges: evaluateBadges(merged),
      };
    });
  }, [addToast]);

  return {
    userStats,
    setUserStats,
    handleUpdateStats,
    quests,
    units,
    toasts,
    addToast,
    removeToast,
    progressBadgeCount,
    unlockedUnitAnimationId,
    setUnlockedUnitAnimationId,
    justUnlockedNodeId,
    setJustUnlockedNodeId,
    streakPromptOpen,
    setStreakPromptOpen,
    handleStreakIgniteComplete,
    handleCompleteNode,
    handleContinueToUnit2,
    handleContinueToUnit3,
    handleContinueToUnit4,
    handleUpdateNotesTuned,
    handleUpdatePracticeTime,
    handleClaimReward,
    bonusChestClaimed,
    bonusChestReward,
    handleClaimBonusChest,
    handleLoseLife,
    handleGainLife,
    handleBuyLife,
    handleUseCourtesySong,
  };
}
