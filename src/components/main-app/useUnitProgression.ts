import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Unit, UserStats, DailyQuest, CompletedLessonEntry, TabType } from '../../types';
import { INITIAL_UNITS } from '../../data/academyData';
import { evaluateBadges } from '../../utils/badgeHelper';
import { getLevelTitle, calculateLevelFromXP } from '../../utils/levelHelper';
import { emitStreakEligibleAction, getTodayStr } from '../../utils/streakPrompt';
import { queueOfflineAction } from '../../utils/offlineSync';
import { recordDailyXpGain } from '../../utils/xpEvolutionHelper';
import { emitQuestEvent } from '../../utils/dailyQuestsEngine';
import { ToastItem } from '../ToastNotification';

interface UseUnitProgressionParams {
  setUserStats: Dispatch<SetStateAction<UserStats>>;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  isOnline: boolean;
  onOpenUnit1Celebration: () => void;
  onOpenUnit2Celebration: () => void;
  onOpenUnit3Celebration: () => void;
  onSetActiveTab: (tab: TabType) => void;
}

export function useUnitProgression({
  setUserStats,
  addToast,
  isOnline,
  onOpenUnit1Celebration,
  onOpenUnit2Celebration,
  onOpenUnit3Celebration,
  onSetActiveTab,
}: UseUnitProgressionParams) {
  // Load persisted units. Content (titles, instructions, etc.) always comes from
  // INITIAL_UNITS so source edits propagate; only the user's progress (node status)
  // is restored from localStorage.
  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem('laclave_units_v8');
    if (saved) {
      try {
        const parsed: Unit[] = JSON.parse(saved);
        const savedStatus = new Map<string, Unit['nodes'][number]['status']>();
        parsed.forEach((u) => u.nodes?.forEach((n) => savedStatus.set(n.id, n.status)));

        const merged: Unit[] = INITIAL_UNITS.map((u) => ({
          ...u,
          nodes: u.nodes.map((n) => {
            const status = savedStatus.get(n.id);
            return status ? { ...n, status } : { ...n };
          }),
        }));

        // Self-healing check: If u1-node12.5 is completed, ensure Unit 2 node 1 (u2-node13) is unlocked!
        const u1Exam = merged[0]?.nodes?.find((n) => n.id === 'u1-node12.5');
        if (u1Exam && u1Exam.status === 'completed' && merged[1]?.nodes[0]?.status === 'locked') {
          merged[1].nodes[0].status = 'current';
        }
        return merged;
      } catch {}
    }
    return INITIAL_UNITS;
  });

  const [unlockedUnitAnimationId, setUnlockedUnitAnimationId] = useState<number | null>(null);
  const [justUnlockedNodeId, setJustUnlockedNodeId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('laclave_units_v8', JSON.stringify(units));
  }, [units]);

  // Complete a lesson node
  const handleCompleteNode = (nodeId: string, xpReward: number) => {
    emitStreakEligibleAction();
    const targetNode = units.flatMap((u) => u.nodes).find((n) => n.id === nodeId);
    const targetUnit = units.find((u) => u.nodes.some((n) => n.id === nodeId));

    const isLastNodeOfUnit1 = nodeId === 'u1-node12.5' || 
                              (targetUnit?.id === 1 && (targetNode?.type === 'exam' || Boolean(targetNode?.title?.toLowerCase().includes('evaluaci')))) ||
                              (targetUnit?.id === 1 && targetUnit.nodes[targetUnit.nodes.length - 1]?.id === nodeId);
    const isLastNodeOfUnit2 = nodeId === 'u2-node20.5' || 
                              (targetUnit?.id === 2 && (targetNode?.type === 'exam' || Boolean(targetNode?.title?.toLowerCase().includes('evaluaci')))) ||
                              (targetUnit?.id === 2 && targetUnit.nodes[targetUnit.nodes.length - 1]?.id === nodeId);
    const isLastNodeOfUnit3 = nodeId === 'u3-node28.5' || 
                              (targetUnit?.id === 3 && (targetNode?.type === 'exam' || Boolean(targetNode?.title?.toLowerCase().includes('evaluaci')))) ||
                              (targetUnit?.id === 3 && targetUnit.nodes[targetUnit.nodes.length - 1]?.id === nodeId);

    if (isLastNodeOfUnit1) {
      setUnlockedUnitAnimationId(null);
      onOpenUnit1Celebration();
      emitQuestEvent('ACADEMY_LESSON_DONE', 1);
      return;
    }

    if (isLastNodeOfUnit2) {
      setUnlockedUnitAnimationId(null);
      onOpenUnit2Celebration();
      emitQuestEvent('ACADEMY_LESSON_DONE', 1);
      return;
    }

    if (isLastNodeOfUnit3) {
      setUnlockedUnitAnimationId(null);
      onOpenUnit3Celebration();
      emitQuestEvent('ACADEMY_LESSON_DONE', 1);
      return;
    }

    if (targetNode?.status === 'completed') {
      emitQuestEvent('ACADEMY_LESSON_DONE', 1);
      return;
    }

    const newLessonEntry: CompletedLessonEntry = {
      id: `${nodeId}-${Date.now()}`,
      title: targetNode ? targetNode.title : 'Lección Práctica',
      unitTitle: targetUnit ? targetUnit.title : 'Academia',
      completedAt: `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      score: 100,
      xpEarned: xpReward,
    };

    let newlyUnlockedNodeId: string | null = null;
    const completedUnit = units.find((u) => u.nodes.some((n) => n.id === nodeId));
    if (completedUnit) {
      const completedNodeIdx = completedUnit.nodes.findIndex((n) => n.id === nodeId);
      if (completedNodeIdx !== -1 && completedNodeIdx + 1 < completedUnit.nodes.length) {
        newlyUnlockedNodeId = completedUnit.nodes[completedNodeIdx + 1].id;
      }
    }

    if (newlyUnlockedNodeId && !isLastNodeOfUnit1 && !isLastNodeOfUnit2) {
      setJustUnlockedNodeId(null);
      setTimeout(() => {
        setJustUnlockedNodeId(newlyUnlockedNodeId);
      }, 150);
    }

    setUnits((prevUnits) => {
      const completedUnitIdx = prevUnits.findIndex((u) => u.nodes.some((n) => n.id === nodeId));
      const completedNodeIdx = completedUnitIdx !== -1 
        ? prevUnits[completedUnitIdx].nodes.findIndex((n) => n.id === nodeId)
        : -1;
      
      const isLastNodeOfUnit = completedUnitIdx !== -1 && completedNodeIdx === prevUnits[completedUnitIdx].nodes.length - 1;

      return prevUnits.map((u, uIdx) => ({
        ...u,
        nodes: u.nodes.map((n, nIdx) => {
          if (n.id === nodeId) {
            return { ...n, status: 'completed' as const };
          }
          if (uIdx === completedUnitIdx && nIdx === completedNodeIdx + 1 && n.status === 'locked') {
            return { ...n, status: 'current' as const };
          }
          if (isLastNodeOfUnit && uIdx === completedUnitIdx + 1 && nIdx === 0 && n.status === 'locked') {
            return { ...n, status: 'current' as const };
          }
          return n;
        }),
      }));
    });

    setUserStats((prev) => {
      const newXP = prev.xp + xpReward;
      recordDailyXpGain(xpReward, newXP);
      const lvl = calculateLevelFromXP(newXP);
      if (lvl.level > prev.level) {
        addToast({
          type: 'level',
          title: `¡NIVEL ALCANZADO!`,
          description: `¡Subiste al Nivel ${lvl.level}: ${lvl.levelTitle}!`,
          levelNumber: lvl.level,
        });
      }
      const today = getTodayStr();
      const isToday = prev.lastPracticeDate === today;
      const updatedCount = (prev.lessonsCompleted || 0) + 1;
      const updatedMins = (prev.practiceMinutes || 0) + 5;
      const updatedTodayMins = (isToday ? (prev.todayPracticeMinutes || 0) : 0) + 5;
      const prevRecent = prev.recentLessons || [];
      const updatedRecent = [newLessonEntry, ...prevRecent.filter((r) => r.id !== newLessonEntry.id)].slice(0, 5);

      const updatedStats: UserStats = {
        ...prev,
        xp: newXP,
        level: lvl.level,
        maxXP: lvl.maxXP,
        levelTitle: lvl.levelTitle,
        lessonsCompleted: updatedCount,
        practiceMinutes: updatedMins,
        todayPracticeMinutes: updatedTodayMins,
        lastPracticeDate: today,
        recentLessons: updatedRecent,
      };

      const newBadges = evaluateBadges(updatedStats);
      const prevUnlockedCount = (prev.badges || []).filter((b) => b.unlocked).length;
      const newUnlockedCount = newBadges.filter((b) => b.unlocked).length;

      if (newUnlockedCount > prevUnlockedCount) {
        const newlyUnlocked = newBadges.filter((b) => b.unlocked && !(prev.badges || []).find((pb) => pb.id === b.id && pb.unlocked));
        newlyUnlocked.forEach((b) => {
          addToast({
            type: 'badge',
            title: '¡Insignia Desbloqueada!',
            description: b.title,
            badgeName: b.title,
          });
        });
      }

      let savedVocalClassification = null;
      let savedVocalRangeData = null;
      try {
        savedVocalClassification = localStorage.getItem('laclave_vocal_range_classification');
        const savedRange = localStorage.getItem('laclave_vocal_range_saved');
        if (savedRange) savedVocalRangeData = JSON.parse(savedRange);
      } catch {}

      return {
        ...updatedStats,
        ...(savedVocalClassification ? { vocalRange: savedVocalClassification } : {}),
        ...(savedVocalRangeData ? { vocalRangeData: savedVocalRangeData } : {}),
        badges: newBadges,
      };
    });

    if (!isOnline) {
      queueOfflineAction({
        type: 'LESSON_COMPLETE',
        payload: { nodeId, xpEarned: xpReward },
      });
    }

    emitQuestEvent('ACADEMY_LESSON_DONE', 1);
  };

  const handleContinueToUnit2 = () => {
    setUnits((prevUnits) => {
      const updated = prevUnits.map((u) => {
        if (u.id === 1) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const })),
          };
        }
        if (u.id === 2) {
          const hasCompletedInUnit2 = u.nodes.some((n) => n.status === 'completed');
          const hasCurrentInUnit2 = u.nodes.some((n) => n.status === 'current');

          return {
            ...u,
            nodes: u.nodes.map((n, idx) => {
              if (n.status === 'completed') return n;
              if (idx === 0 && !hasCompletedInUnit2 && !hasCurrentInUnit2) {
                return { ...n, status: 'current' as const };
              }
              return n;
            }),
          };
        }
        return u;
      });
      try {
        localStorage.setItem('laclave_units_v8', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserStats((prev) => {
      const newXP = prev.xp + 100;
      const lvl = calculateLevelFromXP(newXP);
      const today = getTodayStr();
      const isToday = prev.lastPracticeDate === today;
      const updatedStats: UserStats = {
        ...prev,
        xp: newXP,
        level: lvl.level,
        maxXP: lvl.maxXP,
        levelTitle: lvl.levelTitle,
        lessonsCompleted: (prev.lessonsCompleted || 0) + 1,
        practiceMinutes: (prev.practiceMinutes || 0) + 10,
        todayPracticeMinutes: (isToday ? (prev.todayPracticeMinutes || 0) : 0) + 10,
        lastPracticeDate: today,
      };
      try {
        localStorage.setItem('laclave_user_stats_v6', JSON.stringify(updatedStats));
      } catch {}
      return updatedStats;
    });

    onSetActiveTab('academia');
    setUnlockedUnitAnimationId(null);
    setTimeout(() => {
      setUnlockedUnitAnimationId(2);
    }, 60);
  };

  const handleContinueToUnit3 = () => {
    setUnits((prevUnits) => {
      const updated = prevUnits.map((u) => {
        if (u.id === 2) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const })),
          };
        }
        if (u.id === 3) {
          const hasCompletedInUnit3 = u.nodes.some((n) => n.status === 'completed');
          const hasCurrentInUnit3 = u.nodes.some((n) => n.status === 'current');

          return {
            ...u,
            nodes: u.nodes.map((n, idx) => {
              if (n.status === 'completed') return n;
              if (idx === 0 && !hasCompletedInUnit3 && !hasCurrentInUnit3) {
                return { ...n, status: 'current' as const };
              }
              return n;
            }),
          };
        }
        return u;
      });
      try {
        localStorage.setItem('laclave_units_v8', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserStats((prev) => {
      const newXP = prev.xp + 100;
      const lvl = calculateLevelFromXP(newXP);
      const today = getTodayStr();
      const isToday = prev.lastPracticeDate === today;
      const updatedStats: UserStats = {
        ...prev,
        xp: newXP,
        level: lvl.level,
        maxXP: lvl.maxXP,
        levelTitle: lvl.levelTitle,
        lessonsCompleted: (prev.lessonsCompleted || 0) + 1,
        practiceMinutes: (prev.practiceMinutes || 0) + 10,
        todayPracticeMinutes: (isToday ? (prev.todayPracticeMinutes || 0) : 0) + 10,
        lastPracticeDate: today,
      };
      try {
        localStorage.setItem('laclave_user_stats_v6', JSON.stringify(updatedStats));
      } catch {}
      return updatedStats;
    });

    onSetActiveTab('academia');
    setUnlockedUnitAnimationId(null);
    setTimeout(() => {
      setUnlockedUnitAnimationId(3);
    }, 60);
  };

  const handleContinueToUnit4 = () => {
    setUnits((prevUnits) => {
      const updated = prevUnits.map((u) => {
        if (u.id === 3) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const })),
          };
        }
        if (u.id === 4) {
          const hasCompletedInUnit4 = u.nodes.some((n) => n.status === 'completed');
          const hasCurrentInUnit4 = u.nodes.some((n) => n.status === 'current');

          return {
            ...u,
            nodes: u.nodes.map((n, idx) => {
              if (n.status === 'completed') return n;
              if (idx === 0 && !hasCompletedInUnit4 && !hasCurrentInUnit4) {
                return { ...n, status: 'current' as const };
              }
              return n;
            }),
          };
        }
        return u;
      });
      try {
        localStorage.setItem('laclave_units_v8', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserStats((prev) => {
      const newXP = prev.xp + 100;
      const lvl = calculateLevelFromXP(newXP);
      const today = getTodayStr();
      const isToday = prev.lastPracticeDate === today;
      const updatedStats: UserStats = {
        ...prev,
        xp: newXP,
        level: lvl.level,
        maxXP: lvl.maxXP,
        levelTitle: lvl.levelTitle,
        lessonsCompleted: (prev.lessonsCompleted || 0) + 1,
        practiceMinutes: (prev.practiceMinutes || 0) + 10,
        todayPracticeMinutes: (isToday ? (prev.todayPracticeMinutes || 0) : 0) + 10,
        lastPracticeDate: today,
      };
      try {
        localStorage.setItem('laclave_user_stats_v6', JSON.stringify(updatedStats));
      } catch {}
      return updatedStats;
    });

    onSetActiveTab('academia');
    setUnlockedUnitAnimationId(null);
    setTimeout(() => {
      setUnlockedUnitAnimationId(4);
    }, 60);
  };

  return {
    units,
    unlockedUnitAnimationId,
    setUnlockedUnitAnimationId,
    justUnlockedNodeId,
    setJustUnlockedNodeId,
    handleCompleteNode,
    handleContinueToUnit2,
    handleContinueToUnit3,
    handleContinueToUnit4,
  };
}
