import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ClipboardList, CheckCircle2, Gift } from 'lucide-react';
import { DailyQuest } from '../../types';
import { audioService } from '../../utils/audioService';
import { cascadeContainerVariants, cascadeItemVariants } from './progresoTypes';

interface ProgresoQuestsSectionProps {
  quests: DailyQuest[];
  onClaimReward: (questId: string) => void;
  bonusChestClaimed?: boolean;
  bonusChestReward?: number;
  onClaimBonusChest?: () => void;
  zenMode?: boolean;
}

export const ProgresoQuestsSection: React.FC<ProgresoQuestsSectionProps> = ({
  quests,
  onClaimReward,
  bonusChestClaimed = false,
  bonusChestReward = 50,
  onClaimBonusChest,
  zenMode = false,
}) => {
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  const showNotice = (text: string) => {
    setClaimedNotice(text);
    setTimeout(() => {
      setClaimedNotice(null);
    }, 3500);
  };

  const handleClaimQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.claimed || !quest.completed) return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    onClaimReward(quest.id);
    showNotice(`¡Has reclamado +${quest.xpReward} XP por "${quest.title}"!`);
  };

  const handleClaim = () => {
    audioService.playClickSound();

    // 1. Reclamar primera misión completada no reclamada
    const completedUnclaimed = quests.find((q) => q.completed && !q.claimed);
    if (completedUnclaimed) {
      handleClaimQuest(completedUnclaimed.id);
      return;
    }

    // 2. Si todas las 3 misiones están completadas y reclamadas, pero falta el bono diario (+50 XP)
    const allClaimed = quests.length > 0 && quests.every((q) => q.claimed);
    if (allClaimed && !bonusChestClaimed && onClaimBonusChest) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#10b981', '#3b82f6'],
      });
      onClaimBonusChest();
      showNotice(`¡Has completado todas las misiones de hoy! (+${bonusChestReward} XP bono diario)`);
      return;
    }

    // 3. Si todo ya fue reclamado hoy
    if (allClaimed && bonusChestClaimed) {
      showNotice('¡Ya has reclamado todas las recompensas de hoy! Vuelve mañana.');
      return;
    }

    // 4. Si aún no hay misiones completadas para reclamar
    showNotice('Completa más misiones diarias para obtener recompensas.');
  };

  return (
    <div className="space-y-3">
      {/* Header Original */}
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-xl ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-[#4648d4] dark:text-[#c0c1ff]'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
        </div>
        <h3
          className={`font-heading font-bold text-lg ${
            zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
          }`}
        >
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
          const isClaimed = Boolean(quest.claimed);
          const isCompleted = quest.completed;

          return (
            <motion.div
              key={quest.id}
              variants={cascadeItemVariants}

              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (isCompleted && !isClaimed) {
                  handleClaimQuest(quest.id);
                }
              }}
              className={`rounded-3xl p-4 transition-all ${
                isCompleted
                  ? zenMode
                    ? 'bg-[#22252a] border border-[#e5b83b]/40 shadow-xs'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400/80 dark:border-emerald-600/80 shadow-xs'
                  : zenMode
                  ? 'bg-[#1b1c1e] border border-[#2e3138] shadow-sm'
                  : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f] shadow-sm'
              } ${isCompleted && !isClaimed ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-heading font-bold text-sm ${
                    zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                  }`}
                >
                  {quest.title}
                </span>

                {isClaimed ? (
                  <span
                    className={`text-xs font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
                      zenMode
                        ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        zenMode ? 'text-[#e5b83b]' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    />
                    ¡RECLAMADA!
                  </span>
                ) : isCompleted ? (
                  <span
                    className={`text-xs font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
                      zenMode
                        ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        zenMode ? 'text-[#e5b83b]' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    />
                    ¡COMPLETADO!
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    {quest.progress} / {quest.max}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div
                className={`w-full h-2.5 rounded-full overflow-hidden ${
                  zenMode ? 'bg-[#141619]' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    zenMode
                      ? 'bg-[#e5b83b]'
                      : isCompleted
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-[#4648d4]'
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Claim Notice banner */}
      {claimedNotice && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold text-center animate-bounce border ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/40'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          {claimedNotice}
        </div>
      )}

      {/* Claim Reward Primary Button */}
      <button
        type="button"
        onClick={handleClaim}
        className={`w-full py-4 rounded-full font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2 transition-all active:scale-[0.99] ${
          zenMode
            ? 'bg-[#e5b83b]  text-[#161719] shadow-[0_4px_0_0_#9a7212] font-black'
            : 'tactile-btn-primary'
        }`}
      >
        <Gift className={`w-5 h-5 ${zenMode ? 'text-[#161719]' : 'text-amber-300'}`} />
        <span>Reclamar Recompensa</span>
      </button>
    </div>
  );
};
