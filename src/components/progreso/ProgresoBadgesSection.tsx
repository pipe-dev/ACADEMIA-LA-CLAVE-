import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Award, Search, X, Trophy, Sparkles, ChevronDown } from 'lucide-react';
import { Badge } from '../../types';
import { audioService } from '../../utils/audioService';
import { shareUserAchievement, triggerHapticFeedback } from '../../utils/pwaFeatures';
import { cascadeContainerVariants, cascadeItemVariants } from './progresoTypes';
import { getBadgeIcon } from './ProgresoChartsTooltips';
import { ProgresoBadgeModal } from './ProgresoBadgeModal';

interface ProgresoBadgesSectionProps {
  allBadges: Badge[];
  zenMode?: boolean;
}

export const ProgresoBadgesSection: React.FC<ProgresoBadgesSectionProps> = ({
  allBadges,
  zenMode = false,
}) => {
  const [badgeVisibleCount, setBadgeVisibleCount] = useState<number>(6);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<Badge | null>(null);
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<string>('Todas');
  const [badgeSearchQuery, setBadgeSearchQuery] = useState<string>('');

  // Las insignias desbloqueadas se verán al frente, desde la más reciente a la más vieja, y después las incompletas
  const sortedBadges = useMemo(() => {
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

  const filteredBadges = useMemo(() => {
    return sortedBadges.filter((badge) => {
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

  return (
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
                  zenMode
                    ? (badge.unlocked
                        ? 'bg-[#22252a] border border-[#e5b83b]/50 shadow-md'
                        : 'bg-[#1b1c1e] border border-[#2e3138] opacity-90')
                    : (badge.unlocked
                        ? 'bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-yellow-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/20 border-amber-400/80 dark:border-amber-500/60 shadow-md'
                        : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-[#1b2b3f] opacity-90')
                }`}
              >
                {/* Subtle Glow backdrop for unlocked badge */}
                {badge.unlocked && (
                  <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full blur-xl pointer-events-none animate-pulse ${
                    zenMode ? 'bg-[#e5b83b]/10' : 'bg-amber-400/10'
                  }`} />
                )}

                {/* Badge Icon Container */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                    zenMode
                      ? (badge.unlocked
                          ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/40 shadow-xs'
                          : 'bg-[#161719] text-[#6d7482] border border-[#2e3138]')
                      : (badge.unlocked
                          ? 'bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 border-2 border-amber-200 dark:border-amber-400 shadow-amber-300/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700')
                  }`}>
                    {getBadgeIcon(badge.iconName, badge.unlocked)}
                  </div>
                  {badge.unlocked && (
                    <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border shadow-xs ${
                      zenMode
                        ? 'bg-[#e5b83b] text-[#161719] border-[#161719]'
                        : 'bg-amber-500 text-white border-white dark:border-slate-900'
                    }`}>
                      <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
                    </span>
                  )}
                </div>

                {/* Details & Progress */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-heading font-bold text-sm truncate flex items-center gap-1.5 ${
                      zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                    }`}>
                      <span>{badge.title}</span>
                      {badge.unlocked && (
                        <Trophy className={`w-3.5 h-3.5 shrink-0 inline ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
                      )}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 border ${
                      zenMode
                        ? (badge.unlocked
                            ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/40'
                            : 'bg-[#161719] text-[#8e95a5] border-[#2e3138]')
                        : (badge.unlocked
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent')
                    }`}>
                      {badge.unlocked ? '¡Obtenida!' : `${badge.progress} / ${badge.maxProgress}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {badge.difficulty && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                        badge.difficulty === 'Fácil'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                          : badge.difficulty === 'Medio'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40'
                          : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40'
                      }`}>
                        {badge.difficulty}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {badge.category}
                    </span>
                  </div>

                  <p className={`text-xs leading-snug line-clamp-2 ${zenMode ? 'text-[#9ea3ae]' : 'text-slate-600 dark:text-slate-400'}`}>
                    {badge.description}
                  </p>

                  {/* Progress bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden mt-1.5 ${zenMode ? 'bg-[#141619]' : 'bg-slate-200/80 dark:bg-slate-800'}`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        zenMode ? 'bg-[#e5b83b]' : (badge.unlocked ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-[#4648d4]')
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

      {/* Modal de Detalle de Insignia */}
      <ProgresoBadgeModal
        badge={selectedBadgeModal}
        onClose={() => setSelectedBadgeModal(null)}
        onShareBadge={handleShareSingleBadge}
        zenMode={zenMode}
      />
    </div>
  );
};
