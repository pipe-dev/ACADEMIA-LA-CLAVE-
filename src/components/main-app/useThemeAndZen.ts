import { useState, useEffect } from 'react';
import { audioService } from '../../utils/audioService';

export function useThemeAndZen() {
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

  // Zen Mode Transition Overlay
  const [showZenOverlay, setShowZenOverlay] = useState<boolean>(false);

  const handleToggleZenMode = () => {
    setZenMode((prev) => {
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
    setAmbientSound((prev) => {
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

  return {
    darkMode,
    setDarkMode,
    zenMode,
    setZenMode,
    ambientSound,
    setAmbientSound,
    showZenOverlay,
    setShowZenOverlay,
    handleToggleZenMode,
    handleToggleAmbientSound,
  };
}
