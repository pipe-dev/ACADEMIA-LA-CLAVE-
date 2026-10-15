import { useState, useEffect } from 'react';
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
import { startOnboardingTour } from '../../utils/tour';
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

  // Auto-start onboarding tour for new users after splash screen
  useEffect(() => {
    if (showSplash) return;
    const timer = setTimeout(() => {
      try {
        startOnboardingTour(activeTab, onTabChange, false);
      } catch (err) {
        console.warn('[Tour] Ignored tour initialization error:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [showSplash, activeTab, onTabChange]);

  const pwaInstall = usePwaInstall();

  // Auto-prompt install modal when app detects user has not installed the app
  useEffect(() => {
    if (showSplash) return;
    if (!pwaInstall.isInstalled) {
      const isDismissed = sessionStorage.getItem('laclave_pwa_dismissed') === 'true';
      if (!isDismissed) {
        const timer = setTimeout(() => {
          pwaInstall.openModal();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [showSplash, pwaInstall.isInstalled, pwaInstall.openModal]);

  return {
    isOnline,
    sharedData,
    setSharedData,
    pwaInstall,
  };
}
