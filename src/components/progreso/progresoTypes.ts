import { Variants } from 'motion/react';
import { UserStats, DailyQuest } from '../../types';

export interface ProgresoViewProps {
  userStats: UserStats;
  quests: DailyQuest[];
  onClaimReward: (questId: string) => void;
  bonusChestClaimed?: boolean;
  bonusChestReward?: number;
  onClaimBonusChest?: () => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
  onOpenVocalRangeModal?: () => void;
  zenMode?: boolean;
}

// Framer Motion cascade variants for smooth reveal of badges, medals & achievements
export const cascadeContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const cascadeItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};
