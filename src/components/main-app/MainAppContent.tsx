import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { TabType, UserStats, Unit, LessonNode, DailyQuest } from '../../types';
import { AcademiaView } from '../AcademiaView';

// Code-split dynamic views with pre-loading fallback
const AfinadorView = dynamic(() => import('../AfinadorView').then((m) => m.AfinadorView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Afinador...</div>,
});
const PracticaView = dynamic(() => import('../PracticaView').then((m) => m.PracticaView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Práctica...</div>,
});
const ProgresoView = dynamic(() => import('../ProgresoView').then((m) => m.ProgresoView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Progreso...</div>,
});
const StreakFlameView = dynamic(() => import('../StreakFlameView').then((m) => m.StreakFlameView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Racha...</div>,
});

interface MainAppContentProps {
  activeTab: TabType;
  tabDirection: number;
  userStats: UserStats;
  units: Unit[];
  quests: DailyQuest[];
  zenMode: boolean;
  darkMode: boolean;
  unlockedUnitAnimationId: number | null;
  justUnlockedNodeId: string | null;
  streakPromptOpen: boolean;
  onSelectNode: (node: LessonNode) => void;
  onOpenVoiceEval: () => void;
  onClearUnlockedUnitAnimation: () => void;
  onClearJustUnlockedNode: () => void;
  onOpenUnitCelebration: () => void;
  onOpenRecoveryExam: () => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
  onOpenVocalRangeModal: () => void;
  onUpdateStats: (updated: Partial<UserStats>) => void;
  onLoseLife: (source: 'academia' | 'tuner' | 'karaoke') => void;
  onGainLife: (amount?: number) => void;
  onUseCourtesySong: () => void;
  onUpdateNotesTuned: (countToAdd: number) => void;
  onUpdatePracticeTime: (secondsToAdd: number) => void;
  onClaimReward: (questId: string) => void;
  bonusChestClaimed?: boolean;
  bonusChestReward?: number;
  onClaimBonusChest?: () => void;
  onStreakPromptClose: () => void;
  onStreakIgniteComplete: (newStreak: number) => void;
  onTabChange: (tab: TabType) => void;
}

export const MainAppContent: React.FC<MainAppContentProps> = ({
  activeTab,
  tabDirection,
  userStats,
  units,
  quests,
  zenMode,
  darkMode,
  unlockedUnitAnimationId,
  justUnlockedNodeId,
  streakPromptOpen,
  onSelectNode,
  onOpenVoiceEval,
  onClearUnlockedUnitAnimation,
  onClearJustUnlockedNode,
  onOpenUnitCelebration,
  onOpenRecoveryExam,
  onOpenStore,
  onOpenSettings,
  onOpenVocalRangeModal,
  onUpdateStats,
  onLoseLife,
  onGainLife,
  onUseCourtesySong,
  onUpdateNotesTuned,
  onUpdatePracticeTime,
  onClaimReward,
  bonusChestClaimed,
  bonusChestReward,
  onClaimBonusChest,
  onStreakPromptClose,
  onStreakIgniteComplete,
  onTabChange,
}) => {
  return (
    <>
      <main className="flex-1 w-full max-w-lg mx-auto overflow-x-hidden relative px-4 pb-[calc(5rem+max(0.4rem,var(--safe-bottom,env(safe-area-inset-bottom,0px))))] pt-[calc(4.75rem+var(--safe-top,env(safe-area-inset-top,0px)))]">
        <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            variants={{
              enter: (dir: number) => ({
                x: dir > 0 ? 24 : -24,
                opacity: 0,
              }),
              center: {
                x: 0,
                opacity: 1,
              },
              exit: (dir: number) => ({
                x: dir < 0 ? 24 : -24,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.18,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="w-full"
          >
            {activeTab === 'academia' && (
              <AcademiaView
                userStats={userStats}
                units={units}
                zenMode={zenMode}
                onSelectNode={onSelectNode}
                onOpenVoiceEval={onOpenVoiceEval}
                unlockedUnitAnimationId={unlockedUnitAnimationId}
                onClearUnlockedUnitAnimation={onClearUnlockedUnitAnimation}
                justUnlockedNodeId={justUnlockedNodeId}
                onClearJustUnlockedNode={onClearJustUnlockedNode}
                onOpenUnitCelebration={onOpenUnitCelebration}
                onOpenRecoveryExam={onOpenRecoveryExam}
                onOpenStore={onOpenStore}
              />
            )}

            {activeTab === 'afinador' && (
              <AfinadorView
                userStats={userStats}
                darkMode={zenMode ? true : darkMode}
                zenMode={zenMode}
                onUpdateQuestProgress={onUpdateNotesTuned}
                onUpdateStats={onUpdateStats}
                onLoseLife={onLoseLife}
                onOpenRecoveryExam={onOpenRecoveryExam}
                onOpenStore={onOpenStore}
              />
            )}

            {activeTab === 'practica' && (
              <PracticaView
                userStats={userStats}
                zenMode={zenMode}
                onUpdateQuestProgress={onUpdatePracticeTime}
                onLoseLife={onLoseLife}
                onGainLife={onGainLife}
                onUseCourtesySong={onUseCourtesySong}
                onOpenRecoveryExam={onOpenRecoveryExam}
                onOpenStore={onOpenStore}
              />
            )}

            {activeTab === 'progreso' && (
              <ProgresoView
                userStats={userStats}
                quests={quests}
                onClaimReward={onClaimReward}
                bonusChestClaimed={bonusChestClaimed}
                bonusChestReward={bonusChestReward}
                onClaimBonusChest={onClaimBonusChest}
                onOpenStore={onOpenStore}
                onOpenSettings={onOpenSettings}
                onUpdateStats={onUpdateStats}
                onOpenVocalRangeModal={onOpenVocalRangeModal}
                zenMode={zenMode}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fullscreen Streak Flame Overlay */}
      {(activeTab === 'racha' || streakPromptOpen) && (
        <StreakFlameView
          currentStreak={userStats.streak}
          onBack={() => {
            if (streakPromptOpen) {
              onStreakPromptClose();
            } else {
              onTabChange('academia');
            }
          }}
          onStreakUpdate={(newStreak) => {
            onStreakIgniteComplete(newStreak);
            onUpdateStats({
              xp: userStats.xp + 50,
            });
            if (streakPromptOpen) {
              setTimeout(onStreakPromptClose, 2000);
            }
          }}
        />
      )}
    </>
  );
};
