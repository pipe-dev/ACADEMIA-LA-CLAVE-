import { Badge, UserStats } from '../types';
import { ALL_200_SINGING_BADGES } from '../data/badgesData';

export function evaluateBadges(stats: UserStats): Badge[] {
  // Siempre usar la fuente de verdad para los requerimientos (maxProgress)
  const baseBadges = [...ALL_200_SINGING_BADGES];
  const userBadgesMap = new Map((stats.badges || []).map(b => [b.id, b]));

  return baseBadges.map((badge) => {
    const userBadge = userBadgesMap.get(badge.id);
    let currentProgress = 0;
    // Si ya estaba desbloqueada por el usuario (y no es un falso positivo), lo respetamos.
    // Sin embargo, para arreglar el bug de los que ya se les desbloqueó por error, 
    // reevaluaremos todo desde 0 usando el nuevo maxProgress.
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
      ? (userBadge?.unlockedAt && userBadge.unlockedAt !== '¡Hoy!' ? userBadge.unlockedAt : new Date().toISOString())
      : undefined;

    return {
      ...badge,
      progress: currentProgress,
      unlocked,
      unlockedAt
    };
  });
}
