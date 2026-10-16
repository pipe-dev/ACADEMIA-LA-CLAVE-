import { useState, useEffect, useRef } from 'react';
import { audioService } from '../../utils/audioService';
import { registerServiceWorker } from '../../utils/offlineSync';
import { usePwaInstall } from '../../utils/usePwaInstall';
import {
  updateAppIconBadge,
  getSharedTargetContent,
  SharedContent,
  enableScreenWakeLock,
  scheduleLocalPracticeAlarm,
} from '../../utils/pwaFeatures';
import { triggerSectionTour, isTourActive, TOUR_KEYS } from '../../utils/tour';
import { TabType } from '../../types';

interface UseGlobalAppListenersParams {
  userStreak: number;
  showSplash: boolean;
  activeTab: TabType;
  onTabChange: (newTab: TabType) => void;
}

export function useGlobalAppListeners({
  userStreak,
  showSplash,
  activeTab,
  onTabChange,
}: UseGlobalAppListenersParams) {
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
    updateAppIconBadge(userStreak || 0);
  }, [userStreak]);

  // Enable Screen Wake Lock and Daily Practice Reminders by default on application launch
  useEffect(() => {
    enableScreenWakeLock();
    scheduleLocalPracticeAlarm(20, 0, userStreak || 1, true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        enableScreenWakeLock();
        scheduleLocalPracticeAlarm(20, 0, userStreak || 1, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userStreak]);

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

  // Trigger onboarding tour for active tab if user hasn't seen it yet
  useEffect(() => {
    if (showSplash) return;
    const timer = setTimeout(() => {
      try {
        triggerSectionTour(activeTab, false);
      } catch (err) {
        console.warn('[Tour] Ignored section tour initialization error:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [showSplash, activeTab]);

  const pwaInstall = usePwaInstall();

  // Auto-prompt install modal only AFTER initial tutorial is completed and no tour is currently running
  useEffect(() => {
    if (showSplash || pwaInstall.isInstalled) return;

    const isDismissed = sessionStorage.getItem('laclave_pwa_dismissed') === 'true';
    if (isDismissed) return;

    let timer: NodeJS.Timeout | null = null;
    const scheduleInstallPrompt = (delayMs = 2500) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!isTourActive() && !pwaInstall.isInstalled) {
          pwaInstall.openModal();
        }
      }, delayMs);
    };

    const isAcademiaTourDone = localStorage.getItem(TOUR_KEYS.academia) === 'true';

    if (isAcademiaTourDone && !isTourActive()) {
      scheduleInstallPrompt(2000);
    } else {
      const handleTourCompleted = (e: Event) => {
        const customEvent = e as CustomEvent<{ section: string }>;
        if (customEvent.detail?.section === 'academia') {
          scheduleInstallPrompt(2500);
        }
      };

      window.addEventListener('laclave_tour_section_completed', handleTourCompleted);
      return () => {
        if (timer) clearTimeout(timer);
        window.removeEventListener('laclave_tour_section_completed', handleTourCompleted);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSplash, pwaInstall.isInstalled, pwaInstall.openModal]);

  return {
    isOnline,
    sharedData,
    setSharedData,
    pwaInstall,
  };
}
