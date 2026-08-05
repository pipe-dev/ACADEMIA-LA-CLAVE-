'use client';
import React from 'react';
import { motion } from 'motion/react';
import { TabType } from '../types';
import { audioService } from '../utils/audioService';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  progressBadgeCount?: number;
}

const NAV_ITEMS: { id: TabType; label: string; icon: string }[] = [
  { id: 'academia', label: 'Academia', icon: 'map' },
  { id: 'afinador', label: 'Afinador', icon: 'graphic_eq' },
  { id: 'practica', label: 'Práctica', icon: 'mic_external_on' },
  { id: 'progreso', label: 'Progreso', icon: 'insights' }
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, progressBadgeCount = 0 }) => {
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
    <nav id="tour-bottom-nav" className="fixed bottom-0 left-0 w-full z-50 bg-white/98 dark:bg-[#102034]/98 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl flex justify-around items-center px-1 sm:px-4 pt-1.5 pb-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-800 select-none">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const hasRedDot = item.id === 'progreso' && progressBadgeCount > 0;

        return (
          <button
            key={item.id}
            id={`tour-nav-${item.id}`}
            onClick={(e) => handleSelect(e, item.id)}
            className={`relative flex flex-1 max-w-[88px] flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 py-1 rounded-full transition-colors cursor-pointer select-none touch-manipulation focus:outline-hidden ${
              isActive
                ? 'text-on-secondary-container dark:text-indigo-200'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-secondary-container dark:bg-indigo-950/80 rounded-full shadow-[0_3px_0_0_#005236] dark:shadow-[0_3px_0_0_#4648d4] -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <div className="relative">
              <span className={`material-symbols-outlined transition-transform duration-200 ${isActive ? 'scale-110 font-bold' : ''}`}>
                {item.icon}
              </span>
              {hasRedDot && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
                  {progressBadgeCount > 99 ? '99+' : progressBadgeCount}
                </span>
              )}
            </div>
            <span className={`font-label-sm text-label-sm ${isActive ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

