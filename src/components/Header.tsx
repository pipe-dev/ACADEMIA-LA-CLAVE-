'use client';
import React, { useState } from 'react';
import { audioService } from '../utils/audioService';
import { HeaderProps } from './header/headerTypes';
import { HeaderRightControls } from './header/HeaderRightControls';
import { HeaderStreakModal } from './header/HeaderStreakModal';
import { HeaderLivesModal } from './header/HeaderLivesModal';

export type { HeaderProps } from './header/headerTypes';

const HeaderComponent: React.FC<HeaderProps> = ({
  userStats,
  darkMode = false,
  zenMode = false,
  ambientSound = false,
  isOnline = true,
  onToggleDarkMode,
  onToggleZenMode,
  onToggleAmbientSound,
  onOpenStore,
  onOpenRecoveryExam,
  onOpenSettings,
  onOpenFlameView,
  onNavigateTab,
  onNavigateToPractice
}) => {
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isLivesModalOpen, setIsLivesModalOpen] = useState<boolean>(false);

  const streak = userStats.streak || 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0b1c30]/80 backdrop-blur-xl px-4 pt-[calc(var(--safe-top,env(safe-area-inset-top,0px))+0.625rem)] pb-2.5 border-b border-white/40 dark:border-white/10 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.05)] flex items-center justify-between transition-colors max-w-lg mx-auto">
        {/* Left: Avatar & Title */}
        <div 
          id="tour-header-profile"
          onClick={() => {
            audioService.playClickSound();
            if (onOpenSettings) onOpenSettings();
          }}
          className="flex items-center gap-2.5 cursor-pointer group press-effect"
          title="Ver Perfil y Configuración"
        >
          <div className="w-9 h-9 rounded-full border-2 border-[#4648d4]/30 bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-200 shadow-xs group-hover:border-[#4648d4] transition-colors">
            {userStats.avatarUrl ? (
              <img 
                src={userStats.avatarUrl} 
                alt={userStats.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>img</span>
            )}
          </div>
          <div>
            <h1 className={`font-heading font-bold text-base md:text-lg leading-tight transition-colors ${
              zenMode
                ? 'text-[#f0ebe1]'
                : 'text-[#2c2abc] dark:text-[#c0c1ff] group-hover:text-[#4648d4]'
            }`}>
              AFINAPP
            </h1>
          </div>
        </div>

        {/* Right: Streak, Lives, Zen, Audio & Dark Mode Controls */}
        <HeaderRightControls
          userStats={userStats}
          streak={streak}
          zenMode={zenMode}
          darkMode={darkMode}
          ambientSound={ambientSound}
          isOnline={isOnline}
          onOpenStreakModal={() => setIsStreakModalOpen(true)}
          onOpenLivesModal={() => setIsLivesModalOpen(true)}
          onToggleAmbientSound={onToggleAmbientSound}
          onToggleZenMode={onToggleZenMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </header>

      {/* Racha de Práctica y Hitos Modal */}
      <HeaderStreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={streak}
        zenMode={zenMode}
        onOpenFlameView={onOpenFlameView}
        onNavigateTab={onNavigateTab}
        onNavigateToPractice={onNavigateToPractice}
      />

      {/* Lives Popover / Modal Dialog */}
      <HeaderLivesModal
        isOpen={isLivesModalOpen}
        onClose={() => setIsLivesModalOpen(false)}
        userStats={userStats}
        zenMode={zenMode}
        onOpenRecoveryExam={onOpenRecoveryExam}
        onOpenStore={onOpenStore}
      />
    </>
  );
};

export const Header = React.memo(HeaderComponent);
export default Header;
