'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabType, UserStats, Unit, LessonNode, DailyQuest, CompletedLessonEntry } from '../types';
import { INITIAL_USER_STATS, INITIAL_UNITS, INITIAL_QUESTS } from '../data/academyData';
import { evaluateBadges } from '../utils/badgeHelper';
import { audioService } from '../utils/audioService';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AcademiaView } from './AcademiaView';
import { AfinadorView } from './AfinadorView';
import { PracticaView } from './PracticaView';
import { ProgresoView } from './ProgresoView';
import { LessonModal } from './LessonModal';
import { VoiceEvalModal } from './VoiceEvalModal';
import { VocalRangeModal } from './VocalRangeModal';
import { StoreModal } from './StoreModal';
import { SettingsModal } from './SettingsModal';
import { StreakFlameView } from './StreakFlameView';

import { InstallPwaModal } from './InstallPwaModal';
import { ZenOverlay } from './ZenOverlay';
import { YouTubeAmbientPlayer } from './YouTubeAmbientPlayer';
import { SplashScreen } from './SplashScreen';
import { startOnboardingTour } from '../utils/tour';
import { OfflineSyncBanner } from './OfflineSyncBanner';
import { registerServiceWorker, queueOfflineAction } from '../utils/offlineSync';
import { usePwaInstall } from '../utils/usePwaInstall';
import { updateAppIconBadge, getSharedTargetContent, SharedContent, enableScreenWakeLock, scheduleLocalPracticeAlarm } from '../utils/pwaFeatures';
import { ToastContainer, ToastItem } from './ToastNotification';
import { getLevelTitle } from '../utils/levelHelper';
import { Share2, X } from 'lucide-react';

const TAB_ORDER: Record<TabType, number> = {
  academia: 0,
  afinador: 1,
  practica: 2,
  progreso: 3,
  racha: 4
};

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('academia');
  const [tabDirection, setTabDirection] = useState<number>(1);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const currentIdx = TAB_ORDER[activeTab];
    const newIdx = TAB_ORDER[newTab];
    setTabDirection(newIdx > currentIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  // Load persisted user stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('laclave_user_stats_v5');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          badges: evaluateBadges(parsed)
        };
      } catch {}
    }
    return {
      ...INITIAL_USER_STATS,
      badges: evaluateBadges(INITIAL_USER_STATS)
    };
  });

  // Load persisted daily quests
  const [quests, setQuests] = useState<DailyQuest[]>(() => {
    const saved = localStorage.getItem('laclave_quests_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_QUESTS;
  });

  // Track seen unlocked badges and completed quests for the red notification badge on the BottomNav "Progreso" button
  const [seenProgressCount, setSeenProgressCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('laclave_seen_progress_news_v2');
      if (saved !== null) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  const totalUnlockedBadges = (userStats.badges || []).filter((b) => b.unlocked).length;
  const totalCompletedQuests = quests.filter((q) => q.completed).length;
  const totalProgressNews = totalUnlockedBadges + totalCompletedQuests;

  const progressBadgeCount = Math.max(0, totalProgressNews - seenProgressCount);

  // Clear unseen news count when activeTab === 'progreso'
  useEffect(() => {
    if (activeTab === 'progreso' && totalProgressNews !== seenProgressCount) {
      setSeenProgressCount(totalProgressNews);
      try {
        localStorage.setItem('laclave_seen_progress_news_v2', String(totalProgressNews));
      } catch {}
    }
  }, [activeTab, totalProgressNews, seenProgressCount]);

  // Load persisted units
  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem('laclave_units_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_UNITS;
  });

  // Modals state
  const [selectedNode, setSelectedNode] = useState<LessonNode | null>(null);
  const [isVoiceEvalOpen, setIsVoiceEvalOpen] = useState<boolean>(false);
  const [isVocalRangeOpen, setIsVocalRangeOpen] = useState<boolean>(false);

  // Global haptic and auditory feedback listener for 3D buttons and interactive elements
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactiveEl = target.closest('button, [role="button"], .btn-3d, .press-effect, .tactile-btn-primary, .tactile-btn-success, .tactile-btn-warning');
      if (interactiveEl) {
        audioService.vibrate(14);
        if (interactiveEl.classList.contains('tactile-btn-success') || interactiveEl.classList.contains('btn-3d')) {
          audioService.playSoftDing();
        } else {
          audioService.playClickSound();
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  // Register Service Worker for offline PWA capability
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Update PWA App Badge on home screen with current streak count
  useEffect(() => {
    updateAppIconBadge(userStats.streak || 0);
  }, [userStats.streak]);

  // Enable Screen Wake Lock and Daily Practice Reminders by default on application launch
  useEffect(() => {
    enableScreenWakeLock();
    scheduleLocalPracticeAlarm(20, 0, userStats.streak || 1, true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        enableScreenWakeLock();
        scheduleLocalPracticeAlarm(20, 0, userStats.streak || 1, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userStats.streak]);

  // Read Web Share Target incoming content from other apps
  const [sharedData, setSharedData] = useState<SharedContent | null>(null);
  useEffect(() => {
    try {
      const incoming = getSharedTargetContent();
      if (incoming && (incoming.title || incoming.text || incoming.url)) {
        setSharedData(incoming);
      }
    } catch (err) {
      console.warn('[WebShareTarget] Error reading incoming content:', err);
    }
  }, []);

  // Auto-start onboarding tour for new users after splash screen
  useEffect(() => {
    if (showSplash) return;
    const timer = setTimeout(() => {
      try {
        startOnboardingTour(activeTab, handleTabChange, false);
      } catch (err) {
        console.warn('[Tour] Ignored tour initialization error:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [showSplash]);
  const {
    hasNativePrompt,
    isInstalled,
    isIOS,
    isInIframe,
    isModalOpen,
    openModal,
    closeModal,
    triggerNativeInstall,
    installApp
  } = usePwaInstall();

  // Auto-prompt install modal when app detects user has not installed the app
  useEffect(() => {
    if (showSplash) return;
    if (!isInstalled) {
      const isDismissed = sessionStorage.getItem('laclave_pwa_dismissed') === 'true';
      if (!isDismissed) {
        const timer = setTimeout(() => {
          openModal();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [showSplash, isInstalled, openModal]);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showZenOverlay, setShowZenOverlay] = useState<boolean>(false);

  const handleStreakIgniteComplete = (newStreak: number) => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('laclave_last_streak_date', todayStr);
    } catch {}
    setUserStats(prev => ({
      ...prev,
      streak: newStreak
    }));
  };

  // Dark Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('laclave_dark_mode') === 'true';
  });

  // Zen Mode (Enfoque Nocturno) state
  const [zenMode, setZenMode] = useState<boolean>(() => {
    return localStorage.getItem('laclave_zen_mode') === 'true';
  });

  // Ambient Nature Sound State
  const [ambientSound, setAmbientSound] = useState<boolean>(false);

  // Online / Offline Cache State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleZenMode = () => {
    setZenMode(prev => {
      const next = !prev;
      if (next) {
        setShowZenOverlay(true);
        // Automatically start soothing nature sound when Zen mode turns on
        setAmbientSound(true);
        audioService.startAmbientNatureSound();
      } else {
        setAmbientSound(false);
        audioService.stopAmbientNatureSound();
      }
      return next;
    });
  };

  const handleToggleAmbientSound = () => {
    setAmbientSound(prev => {
      const next = !prev;
      if (next) {
        audioService.startAmbientNatureSound();
      } else {
        audioService.stopAmbientNatureSound();
      }
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('laclave_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('laclave_zen_mode', String(zenMode));
    if (zenMode) {
      document.documentElement.classList.add('zen-mode');
      document.body.classList.add('zen-mode');
    } else {
      document.documentElement.classList.remove('zen-mode');
      document.body.classList.remove('zen-mode');
    }
  }, [zenMode]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('laclave_user_stats_v5', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('laclave_units_v2', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('laclave_quests_v3', JSON.stringify(quests));
  }, [quests]);

  // Complete a lesson node
  const handleCompleteNode = (nodeId: string, xpReward: number) => {
    // Find node and unit titles
    const targetNode = units.flatMap(u => u.nodes).find(n => n.id === nodeId);
    const targetUnit = units.find(u => u.nodes.some(n => n.id === nodeId));

    const newLessonEntry: CompletedLessonEntry = {
      id: `${nodeId}-${Date.now()}`,
      title: targetNode ? targetNode.title : 'Lección Práctica',
      unitTitle: targetUnit ? targetUnit.title : 'Academia',
      completedAt: `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      score: 100,
      xpEarned: xpReward
    };

    // 1. Update node status
    setUnits((prevUnits) =>
      prevUnits.map((u) => ({
        ...u,
        nodes: u.nodes.map((n, idx) => {
          if (n.id === nodeId) {
            return { ...n, status: 'completed' as const };
          }
          // If previous node completed, unlock next node if locked
          const prevNode = u.nodes[idx - 1];
          if (prevNode && prevNode.id === nodeId && n.status === 'locked') {
            return { ...n, status: 'current' as const };
          }
          return n;
        })
      }))
    );

    // 2. Award XP & check level up & update recentLessons
    setUserStats((prev) => {
      const newXP = prev.xp + xpReward;
      let newLevel = prev.level;
      let newMaxXP = prev.maxXP;
      if (newXP >= prev.maxXP) {
        newLevel += 1;
        newMaxXP += 500;
        addToast({
          type: 'level',
          title: `¡NIVEL ALCANZADO!`,
          description: `¡Subiste al Nivel ${newLevel}: ${getLevelTitle(newLevel)}!`,
          levelNumber: newLevel
        });
      }
      const updatedCount = (prev.lessonsCompleted || 0) + 1;
      const updatedMins = (prev.practiceMinutes || 0) + 5;
      const prevRecent = prev.recentLessons || [];
      const updatedRecent = [newLessonEntry, ...prevRecent.filter(r => r.id !== newLessonEntry.id)].slice(0, 5);

      const updatedStats = {
        ...prev,
        xp: newXP,
        level: newLevel,
        maxXP: newMaxXP,
        levelTitle: getLevelTitle(newLevel),
        lessonsCompleted: updatedCount,
        practiceMinutes: updatedMins,
        recentLessons: updatedRecent
      };

      const newBadges = evaluateBadges(updatedStats);
      const prevUnlockedCount = (prev.badges || []).filter(b => b.unlocked).length;
      const newUnlockedCount = newBadges.filter(b => b.unlocked).length;

      if (newUnlockedCount > prevUnlockedCount) {
        const newlyUnlocked = newBadges.filter(b => b.unlocked && !(prev.badges || []).find(pb => pb.id === b.id && pb.unlocked));
        newlyUnlocked.forEach(b => {
          addToast({
            type: 'badge',
            title: '¡Insignia Desbloqueada!',
            description: b.title,
            badgeName: b.title
          });
        });
      }

      return {
        ...updatedStats,
        badges: newBadges
      };
    });

    if (!isOnline) {
      queueOfflineAction({
        type: 'LESSON_COMPLETE',
        payload: { nodeId, xpEarned: xpReward }
      });
    }

    // 3. Update "Completa 2 lecciones" quest progress
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'quest-3' && !q.completed) {
          const nextVal = Math.min(q.max, q.progress + 1);
          const isNowCompleted = nextVal >= q.max;
          if (isNowCompleted) {
            addToast({
              type: 'quest',
              title: '¡Misión Completada!',
              description: `"${q.title}" (Reclama +${q.xpReward} XP)`,
              xpReward: q.xpReward
            });
          }
          return {
            ...q,
            progress: nextVal,
            completed: isNowCompleted
          };
        }
        return q;
      })
    );
  };

  // Update Quest Progress (e.g. from Afinador or Practica)
  const handleUpdateNotesTuned = (countToAdd: number) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'quest-1' && !q.completed) {
          const nextVal = Math.min(q.max, q.progress + countToAdd);
          const isNowCompleted = nextVal >= q.max;
          if (isNowCompleted) {
            addToast({
              type: 'quest',
              title: '¡Misión Completada!',
              description: `"${q.title}" (Reclama +${q.xpReward} XP)`,
              xpReward: q.xpReward
            });
          }
          return {
            ...q,
            progress: nextVal,
            completed: isNowCompleted
          };
        }
        return q;
      })
    );
  };

  const handleUpdatePracticeTime = (secondsToAdd: number) => {
    const minsToAdd = Math.ceil(secondsToAdd / 60);

    setUserStats((prev) => {
      const updatedMins = (prev.practiceMinutes || 0) + minsToAdd;
      const updatedStats = {
        ...prev,
        practiceMinutes: updatedMins
      };
      return {
        ...updatedStats,
        badges: evaluateBadges(updatedStats)
      };
    });

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'quest-2' && !q.completed) {
          const nextVal = Math.min(q.max, q.progress + minsToAdd);
          const isNowCompleted = nextVal >= q.max;
          if (isNowCompleted) {
            addToast({
              type: 'quest',
              title: '¡Misión Completada!',
              description: `"${q.title}" (Reclama +${q.xpReward} XP)`,
              xpReward: q.xpReward
            });
          }
          return {
            ...q,
            progress: nextVal,
            completed: isNowCompleted
          };
        }
        return q;
      })
    );
  };

  // Claim Daily Quest Reward
  const handleClaimReward = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    setUserStats((prev) => {
      const newXP = prev.xp + quest.xpReward;
      let newLevel = prev.level;
      let newMaxXP = prev.maxXP;
      if (newXP >= prev.maxXP) {
        newLevel += 1;
        newMaxXP += 500;
        addToast({
          type: 'level',
          title: `¡NIVEL ALCANZADO!`,
          description: `¡Subiste al Nivel ${newLevel}: ${getLevelTitle(newLevel)}!`,
          levelNumber: newLevel
        });
      }
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        maxXP: newMaxXP,
        levelTitle: getLevelTitle(newLevel)
      };
    });

    addToast({
      type: 'xp',
      title: '¡Recompensa Reclamada!',
      description: `Has obtenido +${quest.xpReward} XP por la misión`,
      xpReward: quest.xpReward
    });

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, progress: 0, completed: false } : q))
    );
  };

  // Buy lives in store
  const handleBuyLives = () => {
    setUserStats((prev) => ({
      ...prev,
      lives: prev.maxLives,
      xp: Math.max(0, prev.xp - 50)
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#071322] text-[#0b1c30] dark:text-[#d3e4fe] flex flex-col font-sans selection:bg-[#4648d4] selection:text-white antialiased transition-colors duration-200">
      {/* Toast Notifications System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <Header
        userStats={userStats}
        darkMode={darkMode}
        zenMode={zenMode}
        ambientSound={ambientSound}
        isOnline={isOnline}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
        onToggleZenMode={handleToggleZenMode}
        onToggleAmbientSound={handleToggleAmbientSound}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFlameView={() => setActiveTab('racha')}
      />

      {/* Offline Status & Sync Engine Notification Banner */}
      <OfflineSyncBanner
        isOnline={isOnline}
        userStats={userStats}
        onUpdateStats={(updated) => setUserStats(prev => ({ ...prev, ...updated }))}
      />

      {/* Web Share Target Received Banner */}
      {sharedData && (
        <div className="mx-4 mt-2 max-w-lg sm:mx-auto bg-gradient-to-r from-indigo-900 to-[#102034] text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-start gap-3 animate-fadeIn">
          <div className="p-2 bg-indigo-600 rounded-xl shrink-0">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
              Recibido vía Web Share Target
            </div>
            <h4 className="text-xs font-bold truncate text-white mt-0.5">
              {sharedData.title || sharedData.text || 'Elemento compartido desde otra App'}
            </h4>
            {sharedData.url && (
              <p className="text-[11px] text-indigo-200 truncate mt-0.5">{sharedData.url}</p>
            )}
            <p className="text-[10px] text-slate-300 mt-1">
              ¡Importado a La Clave! Ya puedes usarlo en tus ejercicios.
            </p>
          </div>
          <button
            onClick={() => setSharedData(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-lg mx-auto overflow-x-hidden relative px-4 pb-32 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-2">
        <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            variants={{
              enter: (dir: number) => ({
                x: dir > 0 ? 24 : -24,
                opacity: 0
              }),
              center: {
                x: 0,
                opacity: 1
              },
              exit: (dir: number) => ({
                x: dir < 0 ? 24 : -24,
                opacity: 0
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.18,
              ease: [0.25, 1, 0.5, 1]
            }}
            className="w-full"
          >
            {activeTab === 'academia' && (
              <AcademiaView
                userStats={userStats}
                units={units}
                onSelectNode={(node) => setSelectedNode(node)}
                onOpenVoiceEval={() => setIsVoiceEvalOpen(true)}
              />
            )}

            {activeTab === 'afinador' && (
              <AfinadorView
                userStats={userStats}
                darkMode={darkMode}
                zenMode={zenMode}
                onUpdateQuestProgress={handleUpdateNotesTuned}
                onUpdateStats={(updated) => setUserStats(prev => ({ ...prev, ...updated }))}
              />
            )}

            {activeTab === 'practica' && (
              <PracticaView
                userStats={userStats}
                onUpdateQuestProgress={handleUpdatePracticeTime}
              />
            )}

            {activeTab === 'progreso' && (
              <ProgresoView
                userStats={userStats}
                quests={quests}
                onClaimReward={handleClaimReward}
                onOpenStore={() => setIsStoreOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onUpdateStats={(updated) => setUserStats(prev => ({ ...prev, ...updated }))}
                onOpenVocalRangeModal={() => setIsVocalRangeOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fullscreen Streak Flame Overlay */}
      {activeTab === 'racha' && (
        <StreakFlameView
          currentStreak={userStats.streak}
          onBack={() => setActiveTab('academia')}
          onStreakUpdate={(newStreak) => {
            handleStreakIgniteComplete(newStreak);
            setUserStats(prev => ({
              ...prev,
              xp: prev.xp + 50
            }));
          }}
        />
      )}

      {/* Bottom Floating Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} progressBadgeCount={progressBadgeCount} />

      {/* Interactive Modals */}
      {selectedNode && (
        <LessonModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onCompleteNode={handleCompleteNode}
        />
      )}

      {isVoiceEvalOpen && (
        <VoiceEvalModal onClose={() => setIsVoiceEvalOpen(false)} />
      )}

      {isVocalRangeOpen && (
        <VocalRangeModal
          onClose={() => setIsVocalRangeOpen(false)}
          onSaveRange={(rangeData) => {
            setUserStats((prev) => ({
              ...prev,
              vocalRange: rangeData.classification,
              vocalRangeData: rangeData
            }));
          }}
        />
      )}

      {isStoreOpen && (
        <StoreModal
          userStats={userStats}
          onClose={() => setIsStoreOpen(false)}
          onBuyLives={handleBuyLives}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          userStats={userStats}
          darkMode={darkMode}
          zenMode={zenMode}
          ambientSound={ambientSound}
          isOnline={isOnline}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          onToggleZenMode={handleToggleZenMode}
          onToggleAmbientSound={handleToggleAmbientSound}
          onStartTour={() => startOnboardingTour(activeTab, handleTabChange, true)}
          onInstallApp={installApp}
          isInstalled={isInstalled}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateStats={(updated) => setUserStats((prev) => ({ ...prev, ...updated }))}
          onStartSplash={() => setShowSplash(true)}
        />
      )}

      {isModalOpen && (
        <InstallPwaModal
          onClose={closeModal}
          onTriggerNativeInstall={triggerNativeInstall}
          hasNativePrompt={hasNativePrompt}
          isIOS={isIOS}
          isInIframe={isInIframe}
        />
      )}

      {/* YouTube Zen Audio Player (144p quality, hidden video) */}
      <YouTubeAmbientPlayer
        isPlaying={ambientSound}
        onTogglePlay={handleToggleAmbientSound}
      />

      {/* Zen Mode Transition Overlay */}
      <ZenOverlay
        show={showZenOverlay}
        onFinished={() => setShowZenOverlay(false)}
      />

      {/* Daily Vocal Tip Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
