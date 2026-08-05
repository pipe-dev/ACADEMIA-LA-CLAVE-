import { Badge, UserStats } from '../types';
import { ALL_200_SINGING_BADGES } from '../data/badgesData';

export function evaluateBadges(stats: UserStats): Badge[] {
  const baseBadges = stats.badges && stats.badges.length >= 200 ? stats.badges : ALL_200_SINGING_BADGES;

  return baseBadges.map((badge) => {
    let currentProgress = 0;
    let unlocked = false;

    // Evaluate progress dynamically based on user stats
    if (badge.category === 'Constancia y Racha') {
      currentProgress = Math.min(badge.maxProgress, stats.streak ?? 0);
    } else if (badge.category === 'Maestría Vocal') {
      if (badge.title.includes('XP')) {
        currentProgress = Math.min(badge.maxProgress, stats.xp ?? 0);
      } else if (badge.title.includes('Nivel')) {
        const lvlMatch = badge.title.match(/\d+/);
        const reqLvl = lvlMatch ? parseInt(lvlMatch[0], 10) : badge.maxProgress;
        currentProgress = (stats.level ?? 1) >= reqLvl ? badge.maxProgress : Math.min(badge.maxProgress, (stats.level ?? 1) - 1);
      } else {
        currentProgress = Math.min(badge.maxProgress, stats.lessonsCompleted ?? 0);
      }
    } else if (badge.category === 'Respiración y Diafragma' || badge.category === 'Salud Vocal') {
      currentProgress = Math.min(badge.maxProgress, stats.practiceMinutes ?? 0);
    } else if (badge.category === 'Afinación y Solfeo') {
      currentProgress = Math.min(badge.maxProgress, (stats.lessonsCompleted ?? 0) * 2);
    } else {
      const generalVal = (stats.lessonsCompleted ?? 0) + Math.floor((stats.practiceMinutes ?? 0) / 3);
      currentProgress = Math.min(badge.maxProgress, generalVal);
    }

    if (currentProgress >= badge.maxProgress && badge.maxProgress > 0) {
      unlocked = true;
    }

    const unlockedAt = unlocked
      ? (badge.unlockedAt && badge.unlockedAt !== '¡Hoy!' ? badge.unlockedAt : new Date().toISOString())
      : undefined;

    return {
      ...badge,
      progress: currentProgress,
      unlocked,
      unlockedAt
    };
  });
}
