'use client';
import React from 'react';
import { motion } from 'motion/react';
import { TabType } from '../types';
import { audioService } from '../utils/audioService';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  progressBadgeCount?: number;
  zenMode?: boolean;
}

const NAV_ITEMS: { id: TabType; label: string; icon: string }[] = [
  { id: 'academia', label: 'Academia', icon: 'map' },
  { id: 'afinador', label: 'Afinador', icon: 'graphic_eq' },
  { id: 'practica', label: 'Práctica', icon: 'mic_external_on' },
  { id: 'progreso', label: 'Progreso', icon: 'insights' }
];

const BottomNavComponent: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onChangeTab, 
  progressBadgeCount = 0,
  zenMode = false
}) => {
  const handleSelect = (e: React.MouseEvent, tab: TabType) => {
    e.preventDefault();
    if (tab !== activeTab) {
      audioService.playTransitionSound();
    } else {
      audioService.playClickSound();
    }
    onChangeTab(tab);
  };

  return (
    <nav 
      id="tour-bottom-nav" 
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl rounded-t-3xl flex justify-around items-center px-4 pt-2 pb-[max(0.4rem,var(--safe-bottom,env(safe-area-inset-bottom,0px)))] border-t border-x select-none max-w-lg mx-auto ${
        zenMode
          ? 'bg-[#191b1f]/95 border-[#2e3138] shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.6)]'
          : 'bg-white/85 dark:bg-[#0b1c30]/90 border-white/50 dark:border-white/10 shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.08)]'
      }`}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const hasRedDot = item.id === 'progreso' && progressBadgeCount > 0;

        return (
          <button
            key={item.id}
            id={`tour-nav-${item.id}`}
            onClick={(e) => handleSelect(e, item.id)}
            className={`relative flex flex-1 max-w-[88px] flex-col items-center justify-center min-w-[50px] min-h-[44px] px-1.5 py-1 rounded-full transition-colors cursor-pointer select-none touch-manipulation focus:outline-hidden ${
              zenMode
                ? isActive
                  ? 'text-[#161719] font-black'
                  : 'text-[#ded9cf] hover:text-white'
                : isActive
                ? 'text-[#005236] dark:text-white font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#4648d4] dark:hover:text-indigo-300'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className={`absolute inset-0 rounded-full -z-10 ${
                  zenMode
                    ? 'bg-[#e5b83b] shadow-[0_3px_0_0_#9a7212]'
                    : 'bg-[#6cf8bb] shadow-[0_3px_0_0_#005236] dark:bg-[#4648d4] dark:shadow-[0_3px_0_0_#2b2db5]'
                }`}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <div className="relative">
              <span className={`material-symbols-outlined transition-transform duration-200 ${isActive ? 'scale-110 font-bold' : ''}`}>
                {item.icon}
              </span>
              {hasRedDot && (
                <span className={`absolute -top-1 -right-2 font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 shadow-md animate-pulse ${
                  zenMode
                    ? 'bg-[#e5b83b] text-[#161719] border-[#191b1f]'
                    : 'bg-red-600 text-white border-white dark:border-slate-900'
                }`}>
                  {progressBadgeCount > 99 ? '99+' : progressBadgeCount}
                </span>
              )}
            </div>
            <span className={`font-label-sm text-label-sm ${isActive ? 'font-black' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export const BottomNav = React.memo(BottomNavComponent);
export default BottomNav;

