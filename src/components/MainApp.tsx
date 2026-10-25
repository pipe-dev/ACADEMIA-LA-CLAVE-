'use client';
import { useState, useCallback } from 'react';
import { TabType, LessonNode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Mic } from 'lucide-react';
import { audioService } from '../utils/audioService';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { FabBatOnWeb, EvalFabSpiderWeb } from './ui/HalloweenDecorations';
import { ToastContainer } from './ToastNotification';
import { OfflineSyncBanner } from './OfflineSyncBanner';
import { TAB_ORDER } from './main-app/mainAppTypes';
import { useThemeAndZen } from './main-app/useThemeAndZen';
import { WebShareTargetBanner } from './main-app/WebShareTargetBanner';
import { useGlobalAppListeners } from './main-app/useGlobalAppListeners';
import { useGlobalGameState } from './main-app/useGlobalGameState';
import { useSessionGuard } from './main-app/useSessionGuard';
import { useCloudProgressSync } from './main-app/useCloudProgressSync';
import { MainAppContent } from './main-app/MainAppContent';
import { MainAppModals } from './main-app/MainAppModals';

export default function MainApp() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('academia');
  const [tabDirection, setTabDirection] = useState<number>(1);

  // Modals state
  const [selectedNode, setSelectedNode] = useState<LessonNode | null>(null);
  const [isVoiceEvalOpen, setIsVoiceEvalOpen] = useState<boolean>(false);
  const [isVocalRangeOpen, setIsVocalRangeOpen] = useState<boolean>(false);
  const [showUnitCelebration, setShowUnitCelebration] = useState<boolean>(false);
  const [showUnit2Celebration, setShowUnit2Celebration] = useState<boolean>(false);
  const [showUnit3Celebration, setShowUnit3Celebration] = useState<boolean>(false);
  const [showUnit4Celebration, setShowUnit4Celebration] = useState<boolean>(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);
  const [isRecoveryExamOpen, setIsRecoveryExamOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const currentIdx = TAB_ORDER[activeTab];
    const newIdx = TAB_ORDER[newTab];
    setTabDirection(newIdx > currentIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  // Theme & Zen State
  const {
    darkMode,
    setDarkMode,
    zenMode,
    ambientSound,
    showZenOverlay,
    setShowZenOverlay,
    handleToggleZenMode,
    handleToggleAmbientSound,
  } = useThemeAndZen();

  // App Listeners & PWA
  const { isOnline, sharedData, setSharedData, pwaInstall } = useGlobalAppListeners({
    userStreak: 1, // Will be updated via hook or userStats
    showSplash,
    activeTab,
    onTabChange: handleTabChange,
  });

  // Global Game State (UserStats, Quests, Units, Lives, Streak)
  const {
    userStats,
    setUserStats,
    quests,
    units,
    toasts,
    removeToast,
    progressBadgeCount,
    unlockedUnitAnimationId,
    setUnlockedUnitAnimationId,
    justUnlockedNodeId,
    setJustUnlockedNodeId,
    streakPromptOpen,
    setStreakPromptOpen,
    handleStreakIgniteComplete,
    handleCompleteNode,
    handleContinueToUnit2,
    handleContinueToUnit3,
    handleContinueToUnit4,
    handleUpdateNotesTuned,
    handleUpdatePracticeTime,
    handleUpdateStats,
    handleClaimReward,
    bonusChestClaimed,
    bonusChestReward,
    handleClaimBonusChest,
    handleLoseLife,
    handleGainLife,
    handleBuyLife,
    handleUseCourtesySong,
  } = useGlobalGameState({
    activeTab,
    isOnline,
    onOpenUnit1Celebration: () => {
      setSelectedNode(null);
      setShowUnitCelebration(true);
    },
    onOpenUnit2Celebration: () => {
      setSelectedNode(null);
      setShowUnit2Celebration(true);
    },
    onOpenUnit3Celebration: () => {
      setSelectedNode(null);
      setShowUnit3Celebration(true);
    },
    onSetActiveTab: setActiveTab,
  });

  // Live session guard: redirects to /login immediately if expired or blocked in DB
  const { sessionUser, checkSession } = useSessionGuard();

  // Cloud progress sync: bidirectional sync between DB and client
  useCloudProgressSync({
    userStats,
    setUserStats,
    isOnline,
  });

  // Evaluación del Módulo 4 (u4-node33.5): se marca completado al cerrar la celebración.
  const unit4ExamNode = units
    .flatMap((u) => u.nodes)
    .find(
      (n) =>
        n.unitId === 4 &&
        (n.type === 'exam' || Boolean(n.title?.toLowerCase().includes('evaluaci')))
    );

  return (
    <div className={`min-h-screen ${zenMode ? 'zen-mode bg-[#161719] text-[#ded9cf]' : 'bg-[#f8f9ff] dark:bg-[#071322] text-[#0b1c30] dark:text-[#d3e4fe]'} flex flex-col font-sans ${zenMode ? 'selection:bg-[#e5b83b] selection:text-[#161719]' : 'selection:bg-[#4648d4] selection:text-white'} antialiased transition-colors duration-200`}>
      {/* Toast Notifications System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <Header
        userStats={userStats}
        darkMode={darkMode}
        zenMode={zenMode}
        ambientSound={ambientSound}
        isOnline={isOnline}
        headerReady={!showSplash}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onToggleZenMode={handleToggleZenMode}
        onToggleAmbientSound={handleToggleAmbientSound}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFlameView={() => setActiveTab('racha')}
        onNavigateTab={handleTabChange}
        onNavigateToPractice={() => setActiveTab('practica')}
      />

      {/* Offline Status & Sync Engine Notification Banner */}
      <OfflineSyncBanner
        isOnline={isOnline}
        userStats={userStats}
        onUpdateStats={handleUpdateStats}
      />

      {/* Web Share Target Received Banner */}
      <WebShareTargetBanner
        sharedData={sharedData}
        onDismiss={() => setSharedData(null)}
      />

      {/* Main Tab Views & Content */}
      <MainAppContent
        activeTab={activeTab}
        tabDirection={tabDirection}
        userStats={userStats}
        units={units}
        quests={quests}
        zenMode={zenMode}
        darkMode={darkMode}
        unlockedUnitAnimationId={unlockedUnitAnimationId}
        justUnlockedNodeId={justUnlockedNodeId}
        streakPromptOpen={streakPromptOpen}
        onSelectNode={(node) => {
          setUnlockedUnitAnimationId(null);
          setSelectedNode(node);
        }}
        onOpenVoiceEval={() => setIsVoiceEvalOpen(true)}
        onClearUnlockedUnitAnimation={() => setUnlockedUnitAnimationId(null)}
        onClearJustUnlockedNode={() => setJustUnlockedNodeId(null)}
        onOpenUnitCelebration={() => {
          setUnlockedUnitAnimationId(null);
          setShowUnitCelebration(true);
        }}
        onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVocalRangeModal={() => setIsVocalRangeOpen(true)}
        onUpdateStats={handleUpdateStats}
        onLoseLife={handleLoseLife}
        onGainLife={handleGainLife}
        onUseCourtesySong={handleUseCourtesySong}
        onUpdateNotesTuned={handleUpdateNotesTuned}
        onUpdatePracticeTime={handleUpdatePracticeTime}
        onClaimReward={handleClaimReward}
        bonusChestClaimed={bonusChestClaimed}
        bonusChestReward={bonusChestReward}
        onClaimBonusChest={handleClaimBonusChest}
        onStreakPromptClose={() => setStreakPromptOpen(false)}
        onStreakIgniteComplete={handleStreakIgniteComplete}
        onTabChange={handleTabChange}
      />

      {/* Floating Action Button (FAB): Evaluar mi voz (Academia Tab Only - Pinned to Viewport) */}
      <AnimatePresence>
        {activeTab === 'academia' && (
          <div 
            style={{
              bottom: 'calc(4.75rem + max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px)))',
            }}
            className="fixed left-0 right-0 z-40 max-w-lg mx-auto pointer-events-none px-4 flex justify-end"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="pointer-events-auto"
            >
              <motion.button
                onClick={() => {
                  audioService.playClickSound();
                  setIsVoiceEvalOpen(true);
                }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 800, damping: 12, mass: 0.5 }}
                className={`flex items-center gap-2 px-6 py-4 rounded-full transition-colors duration-75 group cursor-pointer relative overflow-visible select-none touch-manipulation ${
                  zenMode
                    ? 'bg-[#e5b83b] text-[#161719] shadow-[0px_6px_0px_0px_#9a7212,0px_12px_20px_0px_rgba(229,184,59,0.3)] border border-[#f5d56b] active:translate-y-1'
                    : 'bg-[#6063EE] text-white shadow-[0px_6px_0px_0px_rgba(30,30,120,1),0px_12px_20px_0px_rgba(47,46,190,0.6),inset_0px_4px_6px_rgba(255,255,255,0.7),inset_0px_-4px_6px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1),0px_6px_10px_0px_rgba(47,46,190,0.4),inset_0px_2px_4px_rgba(255,255,255,0.5),inset_0px_-2px_4px_rgba(0,0,0,0.3)]'
                }`}
                aria-label="Evaluar mi voz"
              >
                {/* Telaraña pequeña anclada a la esquina superior derecha del botón */}
                <span className="absolute inset-0 rounded-full overflow-hidden z-10 pointer-events-none" aria-hidden="true">
                  <EvalFabSpiderWeb className="absolute -top-[15px] sm:-top-[18px] right-0 w-20 sm:w-24 h-auto" />
                </span>
                {/* Murciélago sobre el botón */}
                <FabBatOnWeb />
                <Mic className="w-6 h-6 font-bold animate-pulse" />
                <span className="font-bold font-heading text-sm">Evaluar mi voz</span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onChangeTab={handleTabChange} 
        progressBadgeCount={progressBadgeCount} 
        zenMode={zenMode}
      />

      {/* All Dynamic & Interactive Modals */}
      <MainAppModals
        selectedNode={selectedNode}
        userStats={userStats}
        zenMode={zenMode}
        darkMode={darkMode}
        ambientSound={ambientSound}
        isOnline={isOnline}
        activeTab={activeTab}
        showUnitCelebration={showUnitCelebration}
        showUnit2Celebration={showUnit2Celebration}
        showUnit3Celebration={showUnit3Celebration}
        showUnit4Celebration={showUnit4Celebration}
        isVoiceEvalOpen={isVoiceEvalOpen}
        isVocalRangeOpen={isVocalRangeOpen}
        isStoreOpen={isStoreOpen}
        isRecoveryExamOpen={isRecoveryExamOpen}
        isSettingsOpen={isSettingsOpen}
        showZenOverlay={showZenOverlay}
        showSplash={showSplash}
        pwaInstall={pwaInstall}
        onCloseNode={() => setSelectedNode(null)}
        onCompleteNode={handleCompleteNode}
        onOpenUnit1Celebration={() => setShowUnitCelebration(true)}
        onOpenUnit2Celebration={() => setShowUnit2Celebration(true)}
        onOpenUnit3Celebration={() => setShowUnit3Celebration(true)}
        onOpenUnit4Celebration={() => setShowUnit4Celebration(true)}
        onExitUnit4Celebration={() => {
          setShowUnit4Celebration(false);
          if (unit4ExamNode) {
            handleCompleteNode(unit4ExamNode.id, unit4ExamNode.xpReward);
          }
        }}
        onContinueToUnit2={() => {
          setShowUnitCelebration(false);
          handleContinueToUnit2();
        }}
        onContinueToUnit3={() => {
          setShowUnit2Celebration(false);
          handleContinueToUnit3();
        }}
        onContinueToUnit4={() => {
          setShowUnit3Celebration(false);
          handleContinueToUnit4();
        }}
        onCloseVoiceEval={() => setIsVoiceEvalOpen(false)}
        onOpenVocalRangeModal={() => setIsVocalRangeOpen(true)}
        onCloseVocalRange={() => setIsVocalRangeOpen(false)}
        onCloseStore={() => setIsStoreOpen(false)}
        onOpenStore={() => setIsStoreOpen(true)}
        onCloseRecoveryExam={() => setIsRecoveryExamOpen(false)}
        onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
        onCloseSettings={() => setIsSettingsOpen(false)}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onToggleZenMode={handleToggleZenMode}
        onToggleAmbientSound={handleToggleAmbientSound}
        onGainLife={handleGainLife}
        onLoseLife={handleLoseLife}
        onBuyLife={handleBuyLife}
        onUpdateStats={(updated) => setUserStats((prev) => ({ ...prev, ...updated }))}
        onZenOverlayFinished={() => setShowZenOverlay(false)}
        onFinishSplash={() => setShowSplash(false)}
        onStartSplash={() => setShowSplash(true)}
        onTabChange={handleTabChange}
        sessionUser={sessionUser}
        onRefreshSession={checkSession}
      />
    </div>
  );
}
