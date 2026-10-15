'use client';
import React, { useState, useEffect } from 'react';
import { Flame, X, CheckCircle2, Trophy, Award, Crown } from 'lucide-react';
import { audioService } from '../../utils/audioService';
import { isStreakLitToday } from '../../utils/streakPrompt';
import { DYNAMIC_STREAK_ACTIONS } from './headerTypes';

interface HeaderStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  zenMode?: boolean;
  onOpenFlameView?: () => void;
  onNavigateTab?: (tab: 'academia' | 'afinador' | 'practica') => void;
  onNavigateToPractice?: () => void;
}

export const HeaderStreakModal: React.FC<HeaderStreakModalProps> = ({
  isOpen,
  onClose,
  streak,
  zenMode = false,
  onOpenFlameView,
  onNavigateTab,
  onNavigateToPractice
}) => {
  const [isLitToday, setIsLitToday] = useState<boolean>(false);
  const [dynamicActionIndex, setDynamicActionIndex] = useState<number>(() => Math.floor(Math.random() * 3));

  useEffect(() => {
    if (isOpen) {
      setIsLitToday(isStreakLitToday());
      setDynamicActionIndex(prev => (prev + 1) % DYNAMIC_STREAK_ACTIONS.length);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeAction = DYNAMIC_STREAK_ACTIONS[dynamicActionIndex];

  const handleDynamicNavigate = () => {
    audioService.playClickSound();
    onClose();
    if (onNavigateTab) {
      onNavigateTab(activeAction.tab);
    } else if (onNavigateToPractice) {
      onNavigateToPractice();
    }
  };

  const isMilestone7 = streak >= 7;
  const isMilestone30 = streak >= 30;
  const isMilestone100 = streak >= 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-6 animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={() => {
        audioService.playCloseSound();
        onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#102034] rounded-3xl p-4 sm:p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scaleIn relative my-auto max-h-[82vh] overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            audioService.playCloseSound();
            onClose();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-orange-100 dark:bg-orange-950/60 border-2 border-orange-400/80 flex items-center justify-center mx-auto shadow-md">
            <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 fill-orange-500 animate-bounce" />
          </div>
          <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-[#d3e4fe]">
            {streak} Días de Racha
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-tight">
            Completa al menos 1 lección o práctica al día para mantener encendido tu fuego vocal.
          </p>
        </div>

        {/* Hitos Milestones Cards */}
        <div className="space-y-2 pt-0.5">
          <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            Hitos de Constancia Vocal
          </h4>

          {/* Hito 7 días */}
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
            isMilestone7
              ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
                  7 Días - Cantante Constante
                </h5>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isMilestone7 ? '¡Hito alcanzado!' : `${Math.min(7, streak)} / 7 días completados`}
                </p>
              </div>
            </div>
            {isMilestone7 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">{Math.round((streak / 7) * 100)}%</span>
            )}
          </div>

          {/* Hito 30 días */}
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
            isMilestone30
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
                  30 Días - Maestro de Solfeo
                </h5>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isMilestone30 ? '¡Hito alcanzado!' : `${Math.min(30, streak)} / 30 días completados`}
                </p>
              </div>
            </div>
            {isMilestone30 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">{Math.round((streak / 30) * 100)}%</span>
            )}
          </div>

          {/* Hito 100 días */}
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
            isMilestone100
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
                  100 Días - Leyenda Vocal
                </h5>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isMilestone100 ? '¡Hito Leyenda!' : `${Math.min(100, streak)} / 100 días completados`}
                </p>
              </div>
            </div>
            {isMilestone100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">{Math.round((streak / 100) * 100)}%</span>
            )}
          </div>
        </div>

        {/* Acciones de Racha Contextuales */}
        <div className="space-y-2 pt-1">
          {!isLitToday ? (
            <>
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
                <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium leading-tight">
                  Tu fuego vocal aún no se ha encendido hoy.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {onOpenFlameView && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFlameView();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all"
                  >
                    <span>Encender Fuego de Hoy (+50 XP)</span>
                    <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200 shrink-0" />
                  </button>
                )}

                {(onNavigateTab || onNavigateToPractice) && (
                  <button
                    type="button"
                    onClick={handleDynamicNavigate}
                    className={`w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 border ${
                      zenMode
                        ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <span>{activeAction.unlitText}</span>
                    <span className={`material-symbols-outlined text-[16px] leading-none shrink-0 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} style={{ fontSize: '16px' }}>
                      {activeAction.icon}
                    </span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
                zenMode
                  ? 'bg-[#26292f] border-[#e5b83b]/30'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60'
              }`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                <p className={`text-[11px] font-medium leading-tight ${zenMode ? 'text-[#f0ebe1]' : 'text-emerald-800 dark:text-emerald-200'}`}>
                  Racha protegida hoy. Llevas {streak} días de constancia.
                </p>
              </div>

              {(onNavigateTab || onNavigateToPractice) && (
                <button
                  type="button"
                  onClick={handleDynamicNavigate}
                  className={`w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs cursor-pointer shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                    zenMode
                      ? 'bg-[#e5b83b] text-[#161719] shadow-[0_3px_0_0_#9a7212] font-black'
                      : 'bg-[#4648d4] text-white hover:brightness-110'
                  }`}
                >
                  <span>{activeAction.litText}</span>
                  <span className={`material-symbols-outlined text-[16px] leading-none shrink-0 ${zenMode ? 'text-[#161719]' : 'text-white/90'}`} style={{ fontSize: '16px' }}>
                    {activeAction.icon}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
