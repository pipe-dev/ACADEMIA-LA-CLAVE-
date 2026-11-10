'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  // 1. Instant optimistic state: pill and color switch in < 1ms at frame 0
  const [optimisticTab, setOptimisticTab] = useState<TabType>(activeTab);

  useEffect(() => {
    setOptimisticTab(activeTab);
  }, [activeTab]);

  const handleTriggerTab = useCallback((tab: TabType) => {
    // If tapping already active tab, just play click sound and avoid redundant state cycles
    if (tab === optimisticTab && tab === activeTab) {
      try {
        audioService.playClickSound();
      } catch {}
      return;
    }

    // 1. Optimistic feedback first
    setOptimisticTab(tab);

    // 2. Propagate tab change to parent
    onChangeTab(tab);

    // Apagar micrófono en hardware al salir a pestañas de contenido multimedia o progreso
    if (tab === 'academia' || tab === 'progreso') {
      audioService.stopMicrophone(true);
    }

    // 3. Audio feedback executed non-blockingly AFTER initiating view transition
    try {
      if (tab !== activeTab) {
        audioService.playTransitionSound();
      } else {
        audioService.playClickSound();
      }
    } catch {}
  }, [activeTab, optimisticTab, onChangeTab]);

  return (
    <nav 
      id="tour-bottom-nav" 
      style={{
        paddingBottom: 'calc(max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 0.35rem)',
      }}
      className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex items-stretch px-1 pt-1 border-t border-x select-none max-w-lg mx-auto ${
        zenMode
          ? 'bg-[#191b1f] border-[#2e3138] shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.6)]'
          : 'bg-white dark:bg-[#0b1c30] border-slate-200 dark:border-slate-800 shadow-[0px_-6px_25px_0px_rgba(0,0,0,0.08)]'
      }`}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = optimisticTab === item.id;
        const hasRedDot = item.id === 'progreso' && progressBadgeCount > 0;

        return (
          <button
            key={item.id}
            id={`tour-nav-${item.id}`}
            type="button"
            onPointerDown={(e) => {
              // Trigger immediately on pointerdown (touch or primary mouse click)
              // This bypasses iOS momentum scroll cancellation and 300ms delays
              if (e.button !== undefined && e.button !== 0) return;
              handleTriggerTab(item.id);
            }}
            onClick={(e) => {
              // Fallback solely for keyboard navigation (Enter / Space have detail === 0)
              if (e.detail === 0) {
                handleTriggerTab(item.id);
              }
            }}
            className="flex-1 self-stretch min-h-[50px] py-1 px-0.5 flex flex-col items-center justify-center relative touch-manipulation cursor-pointer select-none focus:outline-hidden"
            aria-label={item.label}
            aria-selected={isActive}
            role="tab"
          >
            {/* Visual centered pill container with pointer-events-none */}
            <div
              className={`relative w-full max-w-[88px] min-h-[44px] flex flex-col items-center justify-center px-1.5 py-1 rounded-full transition-colors pointer-events-none ${
                zenMode
                  ? isActive
                    ? 'text-[#161719] font-black'
                    : 'text-[#ded9cf]'
                  : isActive
                  ? 'text-[#005236] dark:text-white font-black'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={`absolute inset-0 rounded-full -z-10 pointer-events-none ${
                    zenMode
                      ? 'bg-[#e5b83b] shadow-[0_3px_0_0_#9a7212]'
                      : 'bg-[#6cf8bb] shadow-[0_3px_0_0_#005236] dark:bg-[#4648d4] dark:shadow-[0_3px_0_0_#2b2db5]'
                  }`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative pointer-events-none">
                <span className={`material-symbols-outlined transition-transform duration-200 pointer-events-none ${isActive ? 'scale-110 font-bold' : ''}`}>
                  {item.icon}
                </span>
                {hasRedDot && (
                  <span className={`absolute -top-1 -right-2 font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 shadow-md animate-pulse pointer-events-none ${
                    zenMode
                      ? 'bg-[#e5b83b] text-[#161719] border-[#191b1f]'
                      : 'bg-red-600 text-white border-white dark:border-slate-900'
                  }`}>
                    {progressBadgeCount > 99 ? '99+' : progressBadgeCount}
                  </span>
                )}
              </div>
              <span className={`font-label-sm text-label-sm pointer-events-none ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export const BottomNav = React.memo(BottomNavComponent);
export default BottomNav;
