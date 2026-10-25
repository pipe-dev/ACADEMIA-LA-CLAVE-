import { UserStats } from '../../types';

export interface SettingsModalProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  ambientSound?: boolean;
  isOnline?: boolean;
  onToggleDarkMode?: () => void;
  onToggleZenMode?: () => void;
  onToggleAmbientSound?: () => void;
  onStartTour?: () => void;
  onInstallApp?: () => void;
  isInstalled?: boolean;
  onClose: () => void;
  onUpdateStats: (updated: Partial<UserStats>) => void;
  onStartSplash?: () => void;
  sessionUser?: {
    id: string;
    name: string;
    email: string;
    expiresAt: string;
    daysRemaining: number;
  } | null;
  onRefreshSession?: () => Promise<void> | void;
}

export interface SavedVocalRangeData {
  minHz: number;
  maxHz: number;
  noteMin: string;
  noteMax: string;
  classification: string;
  gender?: 'masculino' | 'femenino';
}
