import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, Lock, Share2 } from 'lucide-react';
import { Badge } from '../../types';
import { audioService } from '../../utils/audioService';
import { getBadgeIcon } from './ProgresoChartsTooltips';

interface ProgresoBadgeModalProps {
  badge: Badge | null;
  onClose: () => void;
  onShareBadge: (badge: Badge) => void;
  zenMode?: boolean;
}

export const ProgresoBadgeModal: React.FC<ProgresoBadgeModalProps> = ({
  badge,
  onClose,
  onShareBadge,
  zenMode = false,
}) => {
  return (
    <AnimatePresence>
      {badge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md cursor-pointer"
          onClick={() => {
            audioService.playClickSound();
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden space-y-4 cursor-default ${
              zenMode
                ? 'bg-[#1b1c1e] border-2 border-[#e5b83b]/60'
                : 'bg-white dark:bg-[#102034] border-2 border-amber-400/80 dark:border-amber-500/60'
            }`}
          >
            {/* Glow backdrop behind badge */}
            <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
              zenMode ? 'bg-[#e5b83b]/10' : 'bg-amber-400/20'
            }`} />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 cursor-pointer ${
                zenMode
                  ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#383c44]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated Badge Header */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="relative">
                {/* Spinning decorative halo if unlocked */}
                {badge.unlocked && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    className={`absolute -inset-3 rounded-full border-2 border-dashed pointer-events-none ${
                      zenMode ? 'border-[#e5b83b]/50' : 'border-amber-400/60 dark:border-amber-300/40'
                    }`}
                  />
                )}

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.9, 1.1, 1] }}
                  transition={{ duration: 0.5, ease: 'backOut' }}
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg relative ${
                    zenMode
                      ? (badge.unlocked
                          ? 'bg-[#26292f] text-[#e5b83b] border-2 border-[#e5b83b]/60 shadow-[#e5b83b]/20'
                          : 'bg-[#161719] text-[#6d7482] border-2 border-[#2e3138]')
                      : (badge.unlocked
                          ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-amber-950 border-4 border-amber-200 shadow-amber-400/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700')
                  }`}
                >
                  {getBadgeIcon(badge.iconName, badge.unlocked)}
                </motion.div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 justify-center flex-wrap">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
                    zenMode
                      ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                      : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800'
                  }`}>
                    {badge.category}
                  </span>
                  {badge.difficulty && (
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      badge.difficulty === 'Fácil'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                        : badge.difficulty === 'Medio'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                        : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800'
                    }`}>
                      {badge.difficulty}
                    </span>
                  )}
                </div>
                <h3 className={`font-heading font-extrabold text-xl mt-2 leading-tight ${
                  zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                }`}>
                  {badge.title}
                </h3>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-bold border ${
              zenMode
                ? 'bg-[#22252a] text-[#ded9cf] border-[#2e3138]'
                : (badge.unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700')
            }`}>
              <div className="flex items-center gap-2">
                {badge.unlocked ? (
                  <Trophy className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-600 dark:text-emerald-400'}`} />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <span className={zenMode && badge.unlocked ? 'text-[#e5b83b]' : undefined}>
                  {badge.unlocked ? '¡Insignia Obtenida!' : 'En Progreso'}
                </span>
              </div>
              <span className={zenMode && badge.unlocked ? 'text-[#e5b83b]' : undefined}>
                {badge.progress} / {badge.maxProgress}
              </span>
            </div>

            {/* Description & Progress */}
            <div className="space-y-2 text-xs">
              <p className={`leading-relaxed font-medium ${zenMode ? 'text-[#9ea3ae]' : 'text-slate-600 dark:text-slate-300'}`}>
                {badge.description}
              </p>

              <div className={`w-full h-3 rounded-full overflow-hidden border ${
                zenMode ? 'bg-[#141619] border-[#2e3138]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    zenMode
                      ? 'bg-[#e5b83b]'
                      : (badge.unlocked ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-[#4648d4]')
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100))}%`
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onShareBadge(badge)}
                className={`w-full py-3 px-4 rounded-2xl font-heading font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  zenMode
                    ? 'bg-[#e5b83b] hover:bg-[#d6a930] text-[#161719] font-black'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir Insignia</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
