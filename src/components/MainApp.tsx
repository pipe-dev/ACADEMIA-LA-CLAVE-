'use client';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabType, UserStats, Unit, LessonNode, DailyQuest, CompletedLessonEntry } from '../types';
import { INITIAL_USER_STATS, INITIAL_UNITS, INITIAL_QUESTS } from '../data/academyData';
import { evaluateBadges } from '../utils/badgeHelper';
import { audioService } from '../utils/audioService';
import dynamic from 'next/dynamic';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AcademiaView } from './AcademiaView';

// Code-split dynamic views with pre-loading fallback
const AfinadorView = dynamic(() => import('./AfinadorView').then(m => m.AfinadorView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Afinador...</div>
});
const PracticaView = dynamic(() => import('./PracticaView').then(m => m.PracticaView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Práctica...</div>
});
const ProgresoView = dynamic(() => import('./ProgresoView').then(m => m.ProgresoView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Progreso...</div>
});
const StreakFlameView = dynamic(() => import('./StreakFlameView').then(m => m.StreakFlameView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">Cargando Racha...</div>
});

// Code-split dynamic modals (loaded on-demand or preheated by SplashScreen)
const LessonModal = dynamic(() => import('./LessonModal').then(m => m.LessonModal), { ssr: false });
const UnitCelebrationModal = dynamic(() => import('./UnitCelebrationModal').then(m => m.UnitCelebrationModal), { ssr: false });
const Unit2CelebrationModal = dynamic(() => import('./Unit2CelebrationModal').then(m => m.Unit2CelebrationModal), { ssr: false });
const VoiceEvalModal = dynamic(() => import('./VoiceEvalModal').then(m => m.VoiceEvalModal), { ssr: false });
const VocalRangeModal = dynamic(() => import('./VocalRangeModal').then(m => m.VocalRangeModal), { ssr: false });
const StoreModal = dynamic(() => import('./StoreModal').then(m => m.StoreModal), { ssr: false });
const RecoveryExamModal = dynamic(() => import('./RecoveryExamModal').then(m => m.RecoveryExamModal), { ssr: false });
const SettingsModal = dynamic(() => import('./SettingsModal').then(m => m.SettingsModal), { ssr: false });
const InstallPwaModal = dynamic(() => import('./InstallPwaModal').then(m => m.InstallPwaModal), { ssr: false });

import {
  calculatePassiveRecharge,
  getTimeToNextLife,
  applyLifeDeduction,
  applyLifeAward,
  applyLifePurchase,
  MAX_LIVES
} from '../utils/livesEngine';

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
import { emitStreakEligibleAction, getTodayStr, isStreakLitToday, subscribeStreakEligibleAction } from '../utils/streakPrompt';

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

  // Toast Notifications State with strict deduplication
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    setToasts((prev) => {
      // Prevent duplicate toasts in queue with same type, title, and description
      const isDuplicate = prev.some(
        (t) => t.type === toast.type && t.title === toast.title && t.description === toast.description
      );
      if (isDuplicate) return prev;
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      return [...prev, { ...toast, id }];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const currentIdx = TAB_ORDER[activeTab];
    const newIdx = TAB_ORDER[newTab];
    setTabDirection(newIdx > currentIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  // Load persisted user stats with passive recharge applied
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('laclave_user_stats_v5');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        const recharged = calculatePassiveRecharge(parsed);
        return {
          ...recharged,
          badges: evaluateBadges(recharged)
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
    const saved = localStorage.getItem('laclave_units_v8');
    if (saved) {
      try {
        const parsed: Unit[] = JSON.parse(saved);
        // Self-healing check: If u1-node12.5 is completed, ensure Unit 2 node 1 (u2-node13) is unlocked!
        const u1Exam = parsed[0]?.nodes?.find(n => n.id === 'u1-node12.5');
        if (u1Exam && u1Exam.status === 'completed' && parsed[1]?.nodes[0]?.status === 'locked') {
          parsed[1].nodes[0].status = 'current';
        }
        return parsed;
      } catch {}
    }
    return INITIAL_UNITS;
  });

  // Modals state
  const [selectedNode, setSelectedNode] = useState<LessonNode | null>(null);
  const [isVoiceEvalOpen, setIsVoiceEvalOpen] = useState<boolean>(false);
  const [isVocalRangeOpen, setIsVocalRangeOpen] = useState<boolean>(false);
  const [unlockedUnitAnimationId, setUnlockedUnitAnimationId] = useState<number | null>(null);
  const [justUnlockedNodeId, setJustUnlockedNodeId] = useState<string | null>(null);
  const [showUnitCelebration, setShowUnitCelebration] = useState<boolean>(false);
  const [showUnit2Celebration, setShowUnit2Celebration] = useState<boolean>(false);

  // Global haptic and auditory feedback listener for 3D buttons and interactive elements
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactiveEl = target.closest('button, [role="button"], .btn-3d, .press-effect, .tactile-btn-primary, .tactile-btn-success, .tactile-btn-warning');
      if (interactiveEl) {
        const isLockedEl = interactiveEl.getAttribute('data-locked') === 'true' ||
                           interactiveEl.classList.contains('node-locked') ||
                           interactiveEl.classList.contains('cursor-not-allowed') ||
                           interactiveEl.hasAttribute('disabled');

        audioService.vibrate(14);
        if (isLockedEl) {
          return;
        }

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
  const [isRecoveryExamOpen, setIsRecoveryExamOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showZenOverlay, setShowZenOverlay] = useState<boolean>(false);

  // Streak prompt overlay: aparece después de una acción si la racha no fue encendida hoy
  const [streakPromptOpen, setStreakPromptOpen] = useState<boolean>(false);
  const openStreakPrompt = () => {
    if (isStreakLitToday()) return;
    setStreakPromptOpen(true);
  };

  useEffect(() => {
    return subscribeStreakEligibleAction(openStreakPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStreakIgniteComplete = (newStreak: number) => {
    try {
      localStorage.setItem('laclave_last_streak_date', getTodayStr());
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
    const effectiveDark = zenMode || darkMode;
    if (effectiveDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode, zenMode]);

  useEffect(() => {
    localStorage.setItem('laclave_zen_mode', String(zenMode));
    if (zenMode) {
      document.documentElement.classList.add('zen-mode', 'dark');
      document.body.classList.add('zen-mode', 'dark');
    } else {
      document.documentElement.classList.remove('zen-mode');
      document.body.classList.remove('zen-mode');
      if (!darkMode) {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }, [zenMode, darkMode]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('laclave_user_stats_v5', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('laclave_units_v8', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('laclave_quests_v3', JSON.stringify(quests));
  }, [quests]);

  // Complete a lesson node
  const handleCompleteNode = (nodeId: string, xpReward: number) => {
    emitStreakEligibleAction();
    // Find node and unit titles
    const targetNode = units.flatMap(u => u.nodes).find(n => n.id === nodeId);
    const targetUnit = units.find(u => u.nodes.some(n => n.id === nodeId));

    // Unit 1 Completion Trigger: Open Unit Celebratory Balloon Modal first
    const isLastNodeOfUnit1 = nodeId === 'u1-node12.5' || 
                              (targetUnit?.id === 1 && (targetNode?.type === 'exam' || Boolean(targetNode?.title?.toLowerCase().includes('evaluaci')))) ||
                              (targetUnit?.id === 1 && targetUnit.nodes[targetUnit.nodes.length - 1]?.id === nodeId);
    const isLastNodeOfUnit2 = nodeId === 'u2-node20.5' || 
                              (targetUnit?.id === 2 && (targetNode?.type === 'exam' || Boolean(targetNode?.title?.toLowerCase().includes('evaluaci')))) ||
                              (targetUnit?.id === 2 && targetUnit.nodes[targetUnit.nodes.length - 1]?.id === nodeId);

    if (isLastNodeOfUnit1) {
      setUnlockedUnitAnimationId(null);
      setSelectedNode(null);
      setShowUnitCelebration(true);
      return;
    }

    if (isLastNodeOfUnit2) {
      setUnlockedUnitAnimationId(null);
      setSelectedNode(null);
      setShowUnit2Celebration(true);
      return;
    }

    // Prevent duplicate rewards if already completed
    if (targetNode?.status === 'completed') {
      return;
    }

    const newLessonEntry: CompletedLessonEntry = {
      id: `${nodeId}-${Date.now()}`,
      title: targetNode ? targetNode.title : 'Lección Práctica',
      unitTitle: targetUnit ? targetUnit.title : 'Academia',
      completedAt: `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      score: 100,
      xpEarned: xpReward
    };

    // 1. Determine next unlocked node for celebratory illumination & bell chime
    let newlyUnlockedNodeId: string | null = null;
    const completedUnit = units.find((u) => u.nodes.some((n) => n.id === nodeId));
    if (completedUnit) {
      const completedNodeIdx = completedUnit.nodes.findIndex((n) => n.id === nodeId);
      if (completedNodeIdx !== -1 && completedNodeIdx + 1 < completedUnit.nodes.length) {
        newlyUnlockedNodeId = completedUnit.nodes[completedNodeIdx + 1].id;
      }
    }

    if (newlyUnlockedNodeId && !isLastNodeOfUnit1 && !isLastNodeOfUnit2) {
      setJustUnlockedNodeId(null);
      setTimeout(() => {
        setJustUnlockedNodeId(newlyUnlockedNodeId);
      }, 150);
    }

    // 2. Update node status across unit boundaries
    setUnits((prevUnits) => {
      const completedUnitIdx = prevUnits.findIndex((u) => u.nodes.some((n) => n.id === nodeId));
      const completedNodeIdx = completedUnitIdx !== -1 
        ? prevUnits[completedUnitIdx].nodes.findIndex((n) => n.id === nodeId)
        : -1;
      
      const isLastNodeOfUnit = completedUnitIdx !== -1 && completedNodeIdx === prevUnits[completedUnitIdx].nodes.length - 1;

      return prevUnits.map((u, uIdx) => ({
        ...u,
        nodes: u.nodes.map((n, nIdx) => {
          if (n.id === nodeId) {
            return { ...n, status: 'completed' as const };
          }
          // Unlock next node in the same unit
          if (uIdx === completedUnitIdx && nIdx === completedNodeIdx + 1 && n.status === 'locked') {
            return { ...n, status: 'current' as const };
          }
          // Cross-Unit Unlock: If completing the last node of a unit, unlock 1st node of the NEXT unit!
          if (isLastNodeOfUnit && uIdx === completedUnitIdx + 1 && nIdx === 0 && n.status === 'locked') {
            return { ...n, status: 'current' as const };
          }
          return n;
        })
      }));
    });

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

      // Read saved vocal range from localStorage if available
      let savedVocalClassification = null;
      let savedVocalRangeData = null;
      try {
        savedVocalClassification = localStorage.getItem('laclave_vocal_range_classification');
        const savedRange = localStorage.getItem('laclave_vocal_range_saved');
        if (savedRange) savedVocalRangeData = JSON.parse(savedRange);
      } catch {}

      return {
        ...updatedStats,
        ...(savedVocalClassification ? { vocalRange: savedVocalClassification } : {}),
        ...(savedVocalRangeData ? { vocalRangeData: savedVocalRangeData } : {}),
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

  // When clicking "CONTINUAR A LA UNIDAD 2" in the balloon celebration modal
  const handleContinueToUnit2 = () => {
    setShowUnitCelebration(false);
    setUnits((prevUnits) => {
      const updated = prevUnits.map((u) => {
        if (u.id === 1) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
          };
        }
        if (u.id === 2) {
          const hasCompletedInUnit2 = u.nodes.some((n) => n.status === 'completed');
          const hasCurrentInUnit2 = u.nodes.some((n) => n.status === 'current');

          return {
            ...u,
            nodes: u.nodes.map((n, idx) => {
              // Never downgrade already completed nodes!
              if (n.status === 'completed') return n;
              if (idx === 0 && !hasCompletedInUnit2 && !hasCurrentInUnit2) {
                return { ...n, status: 'current' as const };
              }
              return n;
            })
          };
        }
        return u;
      });
      try {
        localStorage.setItem('laclave_units_v8', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Award XP and stats for completing the unit 1 exam if not already awarded
    const targetNode = units.flatMap((u) => u.nodes).find((n) => n.id === 'u1-node12.5');
    if (targetNode?.status !== 'completed') {
      setUserStats((prev) => {
        const newXP = prev.xp + 100;
        let newLevel = prev.level;
        let newMaxXP = prev.maxXP;
        if (newXP >= prev.maxXP) {
          newLevel += 1;
          newMaxXP += 500;
        }
        const updatedStats = {
          ...prev,
          xp: newXP,
          level: newLevel,
          maxXP: newMaxXP,
          levelTitle: getLevelTitle(newLevel),
          lessonsCompleted: (prev.lessonsCompleted || 0) + 1,
          practiceMinutes: (prev.practiceMinutes || 0) + 10
        };
        try {
          localStorage.setItem('laclave_user_stats_v5', JSON.stringify(updatedStats));
        } catch {}
        return updatedStats;
      });
    }

    setActiveTab('academia');
    setUnlockedUnitAnimationId(null);
    setTimeout(() => {
      setUnlockedUnitAnimationId(2);
    }, 60);
  };

  const handleContinueToUnit3 = () => {
    setShowUnit2Celebration(false);
    setUnits((prevUnits) => {
      const updated = prevUnits.map((u) => {
        if (u.id === 2) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
          };
        }
        if (u.id === 3) {
          const hasCompletedInUnit3 = u.nodes.some((n) => n.status === 'completed');
          const hasCurrentInUnit3 = u.nodes.some((n) => n.status === 'current');

          return {
            ...u,
            nodes: u.nodes.map((n, idx) => {
              if (n.status === 'completed') return n;
              if (idx === 0 && !hasCompletedInUnit3 && !hasCurrentInUnit3) {
                return { ...n, status: 'current' as const };
              }
              return n;
            })
          };
        }
        return u;
      });
      try {
        localStorage.setItem('laclave_units_v8', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const targetNode = units.flatMap((u) => u.nodes).find((n) => n.id === 'u2-node20.5');
    if (targetNode?.status !== 'completed') {
      setUserStats((prev) => {
        const newXP = prev.xp + 100;
        let newLevel = prev.level;
        let newMaxXP = prev.maxXP;
        if (newXP >= prev.maxXP) {
          newLevel += 1;
          newMaxXP += 500;
        }
        const updatedStats = {
          ...prev,
          xp: newXP,
          level: newLevel,
          maxXP: newMaxXP,
          levelTitle: getLevelTitle(newLevel),
          lessonsCompleted: (prev.lessonsCompleted || 0) + 1,
          practiceMinutes: (prev.practiceMinutes || 0) + 10
        };
        try {
          localStorage.setItem('laclave_user_stats_v5', JSON.stringify(updatedStats));
        } catch {}
        return updatedStats;
      });
    }

    setActiveTab('academia');
    setUnlockedUnitAnimationId(null);
    setTimeout(() => {
      setUnlockedUnitAnimationId(3);
    }, 60);
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

  // Passive life recharge: targeted timeout + tab visibility listener (0% idle CPU)
  useEffect(() => {
    if ((userStats.lives ?? MAX_LIVES) >= MAX_LIVES) return;

    const checkAndRecharge = () => {
      setUserStats((prev) => {
        if ((prev.lives ?? MAX_LIVES) >= MAX_LIVES) return prev;
        const recharged = calculatePassiveRecharge(prev);
        if ((recharged.lives ?? 0) > (prev.lives ?? 0)) {
          // Schedule side effects outside this state updater
          setTimeout(() => {
            audioService.playHeartGainedSound();
            addToast({
              type: 'heart',
              title: '¡Vida regenerada!',
              description: `Recuperaste 1 vida de forma pasiva (${recharged.lives}/${MAX_LIVES})`
            });
          }, 0);
          return recharged;
        }
        return prev;
      });
    };

    // Check immediately in case recharge time passed while idle
    checkAndRecharge();

    // Schedule exact timeout until next life is due
    const { remainingMs } = getTimeToNextLife(userStats);
    const delay = Math.max(500, remainingMs + 100);

    const timer = setTimeout(checkAndRecharge, delay);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRecharge();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userStats.lives, userStats.lastLifeLostAt, addToast]);

  // Centralized life management handlers
  const handleLoseLife = (source: 'academia' | 'tuner' | 'karaoke') => {
    let livesRemaining = -1;
    setUserStats((prev) => {
      if ((prev.lives ?? MAX_LIVES) <= 0) return prev;
      const updated = applyLifeDeduction(prev);
      livesRemaining = updated.lives;
      return updated;
    });

    if (livesRemaining >= 0) {
      audioService.playHeartLostSound();
      addToast({
        type: 'warning',
        title: 'Perdiste 1 vida',
        description: livesRemaining > 0
          ? `Te quedan ${livesRemaining} de ${MAX_LIVES} vidas`
          : '¡Te has quedado sin vidas! Entrena o recarga en la tienda para continuar'
      });
    }
  };

  const handleGainLife = (amount: number = 1) => {
    let newLives = -1;
    setUserStats((prev) => {
      const currentLives = prev.lives ?? MAX_LIVES;
      if (currentLives >= MAX_LIVES) return prev;
      const updated = applyLifeAward(prev, amount);
      newLives = updated.lives;
      return updated;
    });

    if (newLives > 0) {
      audioService.playHeartGainedSound();
      addToast({
        type: 'heart',
        title: '¡Vida recuperada!',
        description: `Ahora tienes ${newLives} de ${MAX_LIVES} vidas`
      });
    }
  };

  const handleBuyLife = () => {
    let resultCost = 0;
    let resultError = '';
    setUserStats((prev) => {
      const res = applyLifePurchase(prev);
      if (!res.success) {
        resultError = res.error || 'No se pudo comprar la vida';
        return prev;
      }
      resultCost = res.cost;
      return res.updatedStats;
    });

    if (resultError) {
      addToast({
        type: 'warning',
        title: 'Compra no completada',
        description: resultError
      });
    } else if (resultCost > 0) {
      audioService.playHeartGainedSound();
      addToast({
        type: 'heart',
        title: '¡Vida adquirida!',
        description: `Has recuperado 1 vida por ${resultCost} XP`
      });
    }
  };

  const handleUseCourtesySong = () => {
    setUserStats((prev) => ({
      ...prev,
      hasUsedCourtesySong: true
    }));
  };

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
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
        onToggleZenMode={handleToggleZenMode}
        onToggleAmbientSound={handleToggleAmbientSound}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFlameView={() => setActiveTab('racha')}
        onNavigateTab={(tab) => handleTabChange(tab)}
        onNavigateToPractice={() => setActiveTab('practica')}
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
      <main className="flex-1 w-full max-w-lg mx-auto overflow-x-hidden relative px-4 pb-32 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-20 pt-[calc(4.5rem+env(safe-area-inset-top))]">
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
                zenMode={zenMode}
                onSelectNode={(node) => {
                  setUnlockedUnitAnimationId(null);
                  setSelectedNode(node);
                }}
                onOpenVoiceEval={() => setIsVoiceEvalOpen(true)}
                unlockedUnitAnimationId={unlockedUnitAnimationId}
                onClearUnlockedUnitAnimation={() => setUnlockedUnitAnimationId(null)}
                justUnlockedNodeId={justUnlockedNodeId}
                onClearJustUnlockedNode={() => setJustUnlockedNodeId(null)}
                onOpenUnitCelebration={() => {
                  setUnlockedUnitAnimationId(null);
                  setShowUnitCelebration(true);
                }}
                onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
                onOpenStore={() => setIsStoreOpen(true)}
              />
            )}

            {activeTab === 'afinador' && (
              <AfinadorView
                userStats={userStats}
                darkMode={zenMode ? true : darkMode}
                zenMode={zenMode}
                onUpdateQuestProgress={handleUpdateNotesTuned}
                onUpdateStats={(updated) => setUserStats(prev => ({ ...prev, ...updated }))}
                onLoseLife={handleLoseLife}
                onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
                onOpenStore={() => setIsStoreOpen(true)}
              />
            )}

            {activeTab === 'practica' && (
              <PracticaView
                userStats={userStats}
                zenMode={zenMode}
                onUpdateQuestProgress={handleUpdatePracticeTime}
                onLoseLife={handleLoseLife}
                onGainLife={() => handleGainLife(1)}
                onUseCourtesySong={handleUseCourtesySong}
                onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
                onOpenStore={() => setIsStoreOpen(true)}
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
              setStreakPromptOpen(false);
            } else {
              setActiveTab('academia');
            }
          }}
          onStreakUpdate={(newStreak) => {
            handleStreakIgniteComplete(newStreak);
            setUserStats(prev => ({
              ...prev,
              xp: prev.xp + 50
            }));
            if (streakPromptOpen) {
              setTimeout(() => setStreakPromptOpen(false), 2000);
            }
          }}
        />
      )}

      {/* Bottom Floating Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onChangeTab={handleTabChange} 
        progressBadgeCount={progressBadgeCount} 
        zenMode={zenMode}
      />

      {/* Interactive Modals */}
      {selectedNode && (
        <LessonModal
          node={selectedNode}
          userStats={userStats}
          onClose={() => setSelectedNode(null)}
          onCompleteNode={handleCompleteNode}
          onOpenUnitCelebration={() => {
            setUnlockedUnitAnimationId(null);
            setSelectedNode(null);
            setShowUnitCelebration(true);
          }}
          onLoseLife={handleLoseLife}
          onOpenRecoveryExam={() => setIsRecoveryExamOpen(true)}
          onOpenStore={() => setIsStoreOpen(true)}
        />
      )}

      {/* Standalone Fullscreen Unit Culmination Celebration */}
      {showUnitCelebration && (
        <UnitCelebrationModal
          isOpen={showUnitCelebration}
          onContinueToUnit2={handleContinueToUnit2}
        />
      )}

      {showUnit2Celebration && (
        <Unit2CelebrationModal
          isOpen={showUnit2Celebration}
          onContinue={handleContinueToUnit3}
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
          onBuyLives={handleBuyLife}
          onOpenRecoveryExam={() => {
            setIsStoreOpen(false);
            setIsRecoveryExamOpen(true);
          }}
          zenMode={zenMode}
        />
      )}

      {isRecoveryExamOpen && (
        <RecoveryExamModal
          userStats={userStats}
          onClose={() => setIsRecoveryExamOpen(false)}
          onGainLife={() => handleGainLife(1)}
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
          onToggleDarkMode={zenMode ? undefined : () => setDarkMode(prev => !prev)}
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
      {ambientSound && (
        <YouTubeAmbientPlayer
          isPlaying={ambientSound}
          onTogglePlay={handleToggleAmbientSound}
        />
      )}

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
