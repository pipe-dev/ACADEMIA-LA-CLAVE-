import { useState, useEffect } from 'react';
import { audioService } from './audioService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if running inside an iframe (e.g., AI Studio preview)
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsModalOpen(false);
    };

    const handleOpenInstallModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('laclave_open_pwa_install_modal', handleOpenInstallModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('laclave_open_pwa_install_modal', handleOpenInstallModal);
    };
  }, []);

  const triggerNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const installApp = async () => {
    audioService.playClickSound();

    if (deferredPrompt) {
      // 1-click native browser install prompt
      await triggerNativeInstall();
    } else {
      // Show smooth installation helper modal (iframe, iOS, or direct browser)
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    try {
      sessionStorage.setItem('laclave_pwa_dismissed', 'true');
    } catch {}
    setIsModalOpen(false);
  };

  return {
    hasNativePrompt: !!deferredPrompt,
    isInstalled,
    isIOS,
    isInIframe,
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal,
    triggerNativeInstall,
    installApp
  };
}

