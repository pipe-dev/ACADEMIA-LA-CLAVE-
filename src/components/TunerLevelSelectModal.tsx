'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Star, Lock, X, Flame, Trophy, Play, Music, Drum, Brain } from 'lucide-react';
import { Difficulty, ChallengeDifficulty, difficultySettings, difficultyLevels, ProgressState } from '../data/tunerLevelsData';
import { audioService } from '../utils/audioService';

interface TunerLevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStartLevel: (diff: Difficulty, level: number) => void;
  progress: ProgressState;
  userStreak: number;
}

export const TunerLevelSelectModal: React.FC<TunerLevelSelectModalProps> = ({
  isOpen,
  onClose,
  selectedDifficulty,
  onSelectDifficulty,
  onStartLevel,
  progress,
  userStreak
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const difficulties: { key: Difficulty; label: string; desc: string; badge?: string }[] = [
    { key: 'Calentamiento', label: 'Calentamiento', desc: '12 ejercicios variados sin límite de vidas' },
    { key: 'Fácil', label: 'Fácil', desc: '12 niveles (Afinación y Ritmo 80-130 BPM)' },
    { key: 'Medio', label: 'Medio', desc: '20 niveles (Arpegios, Melodías y Ritmo)' },
    { key: 'Difícil', label: 'Difícil', desc: '24 niveles (Simon Says y Alta Velocidad)' },
    { key: 'Maestro', label: 'Maestro', desc: '14 niveles (Afinación ±10¢ y Ritmo 220-290 BPM)', badge: 'Racha 60d' }
  ];

  const currentLevelCount = difficultySettings[selectedDifficulty]?.levelCount || 12;

  const isLevelLocked = (diff: Difficulty, lvl: number): boolean => {
    if (diff === 'Calentamiento') return false;
    if (lvl === 1 && diff !== 'Maestro') return false;

    const challengeDiff = diff as ChallengeDifficulty;
    const diffProgress = progress?.[challengeDiff] || {};

    // 1. A level with stars already earned can NEVER be locked
    if ((diffProgress[lvl] || 0) > 0) return false;

    // 2. Maestro requires streak >= 60 for uncompleted levels
    if (diff === 'Maestro' && (userStreak || 0) < 60) return true;

    // 3. Level 1 is always unlocked (if Maestro streak check passed)
    if (lvl === 1) return false;

    // 4. Unlocked if immediately preceding level has >= 1 star
    if ((diffProgress[lvl - 1] || 0) > 0) return false;

    // 5. Unlocked if any higher level in this difficulty has already been beaten
    const hasHigherCompleted = Object.entries(diffProgress).some(
      ([lStr, s]) => Number(lStr) > lvl && Number(s) > 0
    );
    if (hasHigherCompleted) return false;

    return true;
  };

  const getLevelStars = (diff: Difficulty, lvl: number): number => {
    if (diff === 'Calentamiento') return 0;
    return progress?.[diff as ChallengeDifficulty]?.[lvl] || 0;
  };

  const getLevelType = (diff: Difficulty, lvl: number): { label: string; icon: React.ReactNode } => {
    if (diff === 'Calentamiento') return { label: 'Mix', icon: <Music className="w-3.5 h-3.5" /> };
    const diffArr = difficultyLevels[diff as ChallengeDifficulty];
    const isRhythm = diffArr && diffArr[lvl - 1] === 0;
    if (isRhythm) return { label: 'Ritmo', icon: <Drum className="w-3.5 h-3.5 text-amber-500" /> };
    if (diff === 'Fácil' && (lvl === 4 || lvl === 6)) return { label: 'Melodía', icon: <Music className="w-3.5 h-3.5 text-indigo-500" /> };
    if (diff === 'Medio' && (lvl === 1 || lvl % 2 === 0)) return { label: 'Arpegio', icon: <Music className="w-3.5 h-3.5 text-blue-500" /> };
    if (diff === 'Difícil' && lvl % 3 === 0) return { label: 'Simon', icon: <Brain className="w-3.5 h-3.5 text-purple-500" /> };
    return { label: 'Afinar', icon: <Music className="w-3.5 h-3.5 text-emerald-500" /> };
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#102034] rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-[#1b2b3f] space-y-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white">
              Desafíos de Afinación
            </h3>
          </div>
          <button
            onClick={() => {
              audioService.playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 shrink-0 [&::-webkit-scrollbar]:hidden">
          {difficulties.map(d => {
            const isSelected = selectedDifficulty === d.key;
            return (
              <button
                key={d.key}
                onClick={() => {
                  audioService.playClickSound();
                  onSelectDifficulty(d.key);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4648d4] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Levels Grid */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
          <div className="grid grid-cols-4 gap-2.5 pt-1">
            {Array.from({ length: currentLevelCount }, (_, idx) => {
              const lvl = idx + 1;
              const locked = isLevelLocked(selectedDifficulty, lvl);
              const stars = getLevelStars(selectedDifficulty, lvl);
              const typeInfo = getLevelType(selectedDifficulty, lvl);

              return (
                <button
                  key={lvl}
                  disabled={locked}
                  onClick={() => {
                    audioService.playClickSound();
                    onStartLevel(selectedDifficulty, lvl);
                  }}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between min-h-[76px] transition-all cursor-pointer ${
                    locked
                      ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 opacity-60 cursor-not-allowed'
                      : stars > 0
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 hover:scale-105 shadow-xs'
                      : 'bg-white dark:bg-[#0b1828] border-slate-200 dark:border-slate-700 hover:border-[#4648d4] dark:hover:border-[#5356e8] hover:scale-105 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-400">
                      #{lvl}
                    </span>
                    {typeInfo.icon}
                  </div>

                  {locked ? (
                    <Lock className="w-5 h-5 text-slate-400 my-1" />
                  ) : (
                    <span className="text-base font-heading font-black text-slate-800 dark:text-white">
                      L{lvl}
                    </span>
                  )}

                  {/* Stars footer */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 ${
                          s <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
