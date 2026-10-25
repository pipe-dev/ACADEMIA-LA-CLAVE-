import React from 'react';
import { Share2 } from 'lucide-react';
import { UserStats } from '../../types';
import { ALL_50_SINGING_BADGES } from '../../data/badgesData';
import { audioService } from '../../utils/audioService';
import { shareUserAchievement, triggerHapticFeedback } from '../../utils/pwaFeatures';
import { logger } from '../../utils/logger';

interface ProgresoLevelCardProps {
  userStats: UserStats;
  zenMode?: boolean;
}

export const ProgresoLevelCard: React.FC<ProgresoLevelCardProps> = ({
  userStats,
  zenMode = false,
}) => {
  const handleShareProgress = async () => {
    audioService.playClickSound();
    triggerHapticFeedback('success');
    const currentBadges = userStats.badges && userStats.badges.length === 50 ? userStats.badges : ALL_50_SINGING_BADGES;
    const unlockedBadgesCount = currentBadges.filter((b) => b.unlocked).length;
    const title = 'Mi Progreso en Academia La Clave';
    const text = `¡Alcancé el Nivel ${userStats.level} (${userStats.levelTitle}) con ${userStats.streak} días de racha, ${userStats.xp} XP acumulados y ${unlockedBadgesCount} insignias en La Clave! #LaClaveApp`;

    const success = await shareUserAchievement(title, text);
    if (success) {
      logger.info('ProgresoView', 'Progreso compartido mediante Web Share API');
    }
  };

  const xpPercentage = userStats.maxXP > 0
    ? Math.min(100, Math.round((userStats.xp / userStats.maxXP) * 100))
    : 0;

  return (
    <div className={`rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors relative overflow-hidden ${
      zenMode
        ? 'bg-[#1b1c1e] border border-[#2e3138]'
        : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            zenMode ? 'text-[#e5b83b]' : 'text-slate-500 dark:text-[#c6c5d7]'
          }`}>
            Nivel {userStats.level}
          </span>
          <h2 className={`font-heading font-extrabold text-2xl leading-snug mt-0.5 ${
            zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
          }`}>
            {userStats.levelTitle}
          </h2>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className={`font-heading font-bold text-sm ${
            zenMode ? 'text-[#e5b83b]' : 'text-[#2c2abc] dark:text-[#c0c1ff]'
          }`}>
            {userStats.xp} / {userStats.maxXP}
          </span>
          <span className="text-xs text-slate-400 font-bold block mb-2">XP</span>
          
          {/* Web Share API Button */}
          <button
            type="button"
            onClick={handleShareProgress}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              zenMode
                ? 'bg-[#2e3138] text-[#e5b83b]  border border-[#383c44]'
                : 'bg-indigo-600  text-white'
            }`}
            title="Compartir tus logros con Web Share API"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-3.5 rounded-full overflow-hidden border ${
        zenMode
          ? 'bg-[#141619] border-[#2e3138]'
          : 'bg-indigo-50 dark:bg-slate-800 border-indigo-100/80 dark:border-slate-700'
      }`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 shadow-xs ${
            zenMode ? 'bg-[#e5b83b]' : 'bg-[#4648d4]'
          }`}
          style={{ width: `${xpPercentage}%` }}
        />
      </div>
    </div>
  );
};
