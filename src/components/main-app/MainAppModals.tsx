import React from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'motion/react';
import { UserStats, LessonNode, TabType } from '../../types';
import { ZenOverlay } from '../ZenOverlay';
import { YouTubeAmbientPlayer } from '../YouTubeAmbientPlayer';
import { SplashScreen } from '../SplashScreen';
import { startOnboardingTour } from '../../utils/tour';
import { usePwaInstall } from '../../utils/usePwaInstall';
import { isVocalRangeCheckDue, snoozeVocalRangeCheck } from '../../utils/vocalRangeHelper';
import { VocalRangeCadencePrompt } from '../vocal-range/VocalRangeCadencePrompt';

// Code-split dynamic modals (loaded on-demand or preheated by SplashScreen)
const LessonModal = dynamic(() => import('../LessonModal').then((m) => m.LessonModal), { ssr: false });
const UnitCelebrationModal = dynamic(() => import('../UnitCelebrationModal').then((m) => m.UnitCelebrationModal), { ssr: false });
const Unit2CelebrationModal = dynamic(() => import('../Unit2CelebrationModal').then((m) => m.Unit2CelebrationModal), { ssr: false });
const Unit3CelebrationModal = dynamic(() => import('../Unit3CelebrationModal').then((m) => m.Unit3CelebrationModal), { ssr: false });
const Unit4Celebration = dynamic(() => import('./Unit4Celebration').then((m) => m.Unit4Celebration), { ssr: false });
const VoiceEvalModal = dynamic(() => import('../VoiceEvalModal').then((m) => m.VoiceEvalModal), { ssr: false });
const VocalRangeModal = dynamic(() => import('../VocalRangeModal').then((m) => m.VocalRangeModal), { ssr: false });
const StoreModal = dynamic(() => import('../StoreModal').then((m) => m.StoreModal), { ssr: false });
const RecoveryExamModal = dynamic(() => import('../RecoveryExamModal').then((m) => m.RecoveryExamModal), { ssr: false });
const SettingsModal = dynamic(() => import('../SettingsModal').then((m) => m.SettingsModal), { ssr: false });
const InstallPwaModal = dynamic(() => import('../InstallPwaModal').then((m) => m.InstallPwaModal), { ssr: false });

interface MainAppModalsProps {
  selectedNode: LessonNode | null;
  userStats: UserStats;
  zenMode: boolean;
  darkMode: boolean;
  ambientSound: boolean;
  isOnline: boolean;
  activeTab: TabType;
  showUnitCelebration: boolean;
  showUnit2Celebration: boolean;
  showUnit3Celebration: boolean;
  showUnit4Celebration: boolean;
  isVoiceEvalOpen: boolean;
  isVocalRangeOpen: boolean;
  onOpenVocalRangeModal?: () => void;
  isStoreOpen: boolean;
  isRecoveryExamOpen: boolean;
  isSettingsOpen: boolean;
  showZenOverlay: boolean;
  showSplash: boolean;
  pwaInstall: ReturnType<typeof usePwaInstall>;
  onCloseNode: () => void;
  onCompleteNode: (nodeId: string, xpReward: number) => void;
  onOpenUnit1Celebration: () => void;
  onOpenUnit2Celebration: () => void;
  onOpenUnit3Celebration: () => void;
  onOpenUnit4Celebration: () => void;
  onExitUnit4Celebration: () => void;
  onContinueToUnit2: () => void;
  onContinueToUnit3: () => void;
  onContinueToUnit4: () => void;
  onCloseVoiceEval: () => void;
  onCloseVocalRange: () => void;
  onCloseStore: () => void;
  onOpenStore: () => void;
  onCloseRecoveryExam: () => void;
  onOpenRecoveryExam: () => void;
  onCloseSettings: () => void;
  onToggleDarkMode: () => void;
  onToggleZenMode: () => void;
  onToggleAmbientSound: () => void;
  onGainLife: (amount?: number) => void;
  onLoseLife: (source: 'academia' | 'tuner' | 'karaoke') => void;
  onBuyLife: () => void;
  onUpdateStats: (updated: Partial<UserStats>) => void;
  onZenOverlayFinished: () => void;
  onFinishSplash: () => void;
  onStartSplash: () => void;
  onTabChange: (tab: TabType) => void;
  sessionUser?: {
    id: string;
    name: string;
    email: string;
    expiresAt: string;
    daysRemaining: number;
  } | null;
  onRefreshSession?: () => Promise<void> | void;
}

export const MainAppModals: React.FC<MainAppModalsProps> = ({
  selectedNode,
  userStats,
  zenMode,
  darkMode,
  ambientSound,
  isOnline,
  activeTab,
  showUnitCelebration,
  showUnit2Celebration,
  showUnit3Celebration,
  showUnit4Celebration,
  isVoiceEvalOpen,
  isVocalRangeOpen,
  onOpenVocalRangeModal,
  isStoreOpen,
  isRecoveryExamOpen,
  isSettingsOpen,
  showZenOverlay,
  showSplash,
  pwaInstall,
  onCloseNode,
  onCompleteNode,
  onOpenUnit1Celebration,
  onOpenUnit2Celebration,
  onOpenUnit3Celebration,
  onOpenUnit4Celebration,
  onExitUnit4Celebration,
  onContinueToUnit2,
  onContinueToUnit3,
  onContinueToUnit4,
  onCloseVoiceEval,
  onCloseVocalRange,
  onCloseStore,
  onOpenStore,
  onCloseRecoveryExam,
  onOpenRecoveryExam,
  onCloseSettings,
  onToggleDarkMode,
  onToggleZenMode,
  onToggleAmbientSound,
  onGainLife,
  onLoseLife,
  onBuyLife,
  onUpdateStats,
  onZenOverlayFinished,
  onFinishSplash,
  onStartSplash,
  onTabChange,
  sessionUser,
  onRefreshSession,
}) => {
  const [showCadencePrompt, setShowCadencePrompt] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (activeTab === 'progreso' || activeTab === 'afinador') {
      if (isVocalRangeCheckDue()) {
        setShowCadencePrompt(true);
      }
    }
  }, [activeTab]);
  return (
    <>
      {/* Interactive Modals */}
      {selectedNode && (
        <LessonModal
          node={selectedNode}
          userStats={userStats}
          onClose={onCloseNode}
          onCompleteNode={onCompleteNode}
          onOpenUnitCelebration={() => {
            const currentUnitId = selectedNode?.unitId ?? 1;
            onCloseNode();
            if (currentUnitId === 4) {
              onOpenUnit4Celebration();
            } else if (currentUnitId === 3) {
              onOpenUnit3Celebration();
            } else if (currentUnitId === 2) {
              onOpenUnit2Celebration();
            } else {
              onOpenUnit1Celebration();
            }
          }}
          onLoseLife={onLoseLife}
          onOpenRecoveryExam={onOpenRecoveryExam}
          onOpenStore={onOpenStore}
        />
      )}

      {/* Standalone Fullscreen Unit Culmination Celebration */}
      {showUnitCelebration && (
        <UnitCelebrationModal
          isOpen={showUnitCelebration}
          onContinueToUnit2={onContinueToUnit2}
        />
      )}

      {showUnit2Celebration && (
        <Unit2CelebrationModal
          isOpen={showUnit2Celebration}
          onContinue={onContinueToUnit3}
        />
      )}

      {showUnit3Celebration && (
        <Unit3CelebrationModal
          isOpen={showUnit3Celebration}
          onContinue={onContinueToUnit4}
          bpm={130}
        />
      )}

      {showUnit4Celebration && (
        <Unit4Celebration onExit={onExitUnit4Celebration} />
      )}

      {isVoiceEvalOpen && (
        <VoiceEvalModal onClose={onCloseVoiceEval} />
      )}

      {isVocalRangeOpen && (
        <VocalRangeModal
          backLabel="Volver al Gimnasio Vocal"
          onClose={onCloseVocalRange}
          onSaveRange={(rangeData) => {
            onUpdateStats({
              vocalRange: rangeData.classification,
              vocalRangeData: rangeData,
            });
          }}
        />
      )}

      {showCadencePrompt && !isVocalRangeOpen && !selectedNode && (
        <VocalRangeCadencePrompt
          isOpen={showCadencePrompt}
          onClose={() => setShowCadencePrompt(false)}
          onStartEvaluation={() => {
            setShowCadencePrompt(false);
            if (onOpenVocalRangeModal) onOpenVocalRangeModal();
          }}
          onSnooze={() => {
            snoozeVocalRangeCheck();
            setShowCadencePrompt(false);
          }}
          zenMode={zenMode}
        />
      )}

      {isStoreOpen && (
        <StoreModal
          userStats={userStats}
          onClose={onCloseStore}
          onBuyLives={onBuyLife}
          onOpenRecoveryExam={() => {
            onCloseStore();
            onOpenRecoveryExam();
          }}
          zenMode={zenMode}
        />
      )}

      {isRecoveryExamOpen && (
        <RecoveryExamModal
          userStats={userStats}
          onClose={onCloseRecoveryExam}
          onGainLife={() => onGainLife(1)}
          zenMode={zenMode}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          userStats={userStats}
          darkMode={zenMode ? true : darkMode}
          zenMode={zenMode}
          ambientSound={ambientSound}
          isOnline={isOnline}
          onToggleDarkMode={zenMode ? undefined : onToggleDarkMode}
          onToggleZenMode={onToggleZenMode}
          onToggleAmbientSound={onToggleAmbientSound}
          onStartTour={() => startOnboardingTour(activeTab, onTabChange, true)}
          onInstallApp={pwaInstall.installApp}
          isInstalled={pwaInstall.isInstalled}
          onClose={onCloseSettings}
          onUpdateStats={onUpdateStats}
          onStartSplash={onStartSplash}
          sessionUser={sessionUser}
          onRefreshSession={onRefreshSession}
        />
      )}

      {pwaInstall.isModalOpen && (
        <InstallPwaModal
          onClose={pwaInstall.closeModal}
          onTriggerNativeInstall={pwaInstall.triggerNativeInstall}
          hasNativePrompt={pwaInstall.hasNativePrompt}
          isIOS={pwaInstall.isIOS}
          isInIframe={pwaInstall.isInIframe}
        />
      )}

      {/* YouTube Zen Audio Player (144p quality, hidden video) */}
      {ambientSound && (
        <YouTubeAmbientPlayer
          isPlaying={ambientSound}
          onTogglePlay={onToggleAmbientSound}
        />
      )}

      {/* Zen Mode Transition Overlay */}
      <ZenOverlay
        show={showZenOverlay}
        onFinished={onZenOverlayFinished}
      />

      {/* Daily Vocal Tip Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            onFinish={onFinishSplash}
            userStats={userStats}
            onUpdateStats={onUpdateStats}
          />
        )}
      </AnimatePresence>
    </>
  );
};
