'use client';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Unit, LessonNode, UserStats } from '../types';
import { Check, Wind, Lock, Trophy, Music, Mic, Sparkles } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface AcademiaViewProps {
  userStats: UserStats;
  units: Unit[];
  onSelectNode: (node: LessonNode) => void;
  onOpenVoiceEval: () => void;
}

export const AcademiaView: React.FC<AcademiaViewProps> = ({
  userStats,
  units,
  onSelectNode,
  onOpenVoiceEval
}) => {
  // Read saved vocal range from userStats or localStorage
  const activeVocalRange = userStats.vocalRange || userStats.vocalRangeData?.classification || (() => {
    try {
      const c = localStorage.getItem('laclave_vocal_range_classification');
      if (c) return c;
      const s = localStorage.getItem('laclave_vocal_range_saved');
      return s ? JSON.parse(s)?.classification : null;
    } catch {
      return null;
    }
  })();

  const savedRangeData = userStats.vocalRangeData || (() => {
    try {
      const s = localStorage.getItem('laclave_vocal_range_saved');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  // Interactive carousel card messages
  const [currentMsgIndex, setCurrentMsgIndex] = useState<number>(0);

  const subtextMessages = [
    {
      id: 'streak',
      text: (
        <>
          Tu racha de <strong className="font-semibold text-slate-800 dark:text-[#d3e4fe]">{userStats.streak} días</strong> está inspirando a otros. ¡Sigue así!
        </>
      )
    },
    ...(activeVocalRange
      ? [
          {
            id: 'range',
            text: (
              <>
                Tu rango actual es de <strong className="font-semibold text-[#4648d4] dark:text-[#c0c1ff]">{activeVocalRange}</strong> {savedRangeData ? `(${savedRangeData.noteMin} - ${savedRangeData.noteMax})` : ''}.
              </>
            )
          },
          {
            id: 'exercises',
            text: (
              <>
                Los ejercicios sugeridos están ajustados a la frecuencia de tu rango (<strong className="font-semibold text-emerald-600 dark:text-emerald-400">{activeVocalRange}</strong>).
              </>
            )
          }
        ]
      : [])
  ];

  useEffect(() => {
    if (subtextMessages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % subtextMessages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [subtextMessages.length]);

  const handleNextMessage = () => {
    if (subtextMessages.length <= 1) return;
    audioService.playClickSound();
    setCurrentMsgIndex((prev) => (prev + 1) % subtextMessages.length);
  };

  const handleNodeClick = (node: LessonNode, event?: React.MouseEvent<HTMLButtonElement>) => {
    audioService.playClickSound();
    audioService.vibrate(18);

    if (node.status === 'locked') {
      audioService.playFrequency(180, 0.2);
      return;
    }

    // Trigger soft confetti explosion over the node
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: node.status === 'completed' ? 40 : 25,
        spread: 60,
        startVelocity: 22,
        ticks: 200,
        origin: { x, y },
        colors: node.status === 'completed' 
          ? ['#10b981', '#34d399', '#059669', '#f59e0b', '#fbbf24']
          : ['#4648d4', '#818cf8', '#6366f1', '#6cf8bb', '#38bdf8']
      });
    }

    onSelectNode(node);
  };

  return (
    <div className="pb-36 pt-4 px-4 max-w-lg mx-auto space-y-6 animate-fadeIn">
      {/* Welcome Section - Interactive Rotating Card */}
      <section id="tour-academia-welcome" className="mb-2">
        <div
          onClick={handleNextMessage}
          className="bg-white dark:bg-[#102034] p-5 sm:p-6 rounded-3xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-[#1b2b3f] relative overflow-hidden transition-all cursor-pointer active:scale-[0.99] select-none h-[112px] flex flex-col justify-center"
        >
          <div className="relative z-10 space-y-1 max-w-[85%]">
            <h2 className="font-heading font-bold text-lg sm:text-xl text-[#4648d4] dark:text-[#c0c1ff] shrink-0">
              ¡Hola, {userStats.name}!
            </h2>
            <div className="h-10 flex items-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMsgIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-600 dark:text-[#c6c5d7] text-xs sm:text-sm leading-snug"
                >
                  {subtextMessages[currentMsgIndex]?.text}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Music Decor Icon */}
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-[#4648d4] dark:text-[#c0c1ff]">
            <Music className="w-28 h-28" />
          </div>
        </div>
      </section>

      {/* Learning Path Units */}
      <div id="tour-academia-map" className="node-path-container flex flex-col items-center gap-12">
        {(() => {
          let globalNodeIdx = 0;

          return units.map((unit) => {
            const isPrimaryUnit = unit.id === 1;

            // Pre-calculate node coordinates for this unit with a pronounced serpentine S-path
            const serpentineSequence = [0, 80, 110, 70, 0, -80, -110, -70];
            const nodePositions = unit.nodes.map((node) => {
              const currentGlobal = globalNodeIdx;
              globalNodeIdx++;
              const xOffset = serpentineSequence[currentGlobal % serpentineSequence.length];
              return { node, xOffset };
            });

            return (
              <div key={unit.id} className="w-full space-y-8">
                {/* Unit Header Banner */}
                <div 
                  className={`px-6 py-4 rounded-2xl shadow-md transition-colors ${
                    isPrimaryUnit 
                      ? 'bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(47,46,190,1)]' 
                      : 'bg-[#dce9ff] dark:bg-[#102034] text-[#0b1c30] dark:text-[#d3e4fe] border border-slate-200/80 dark:border-[#1b2b3f] shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)]'
                  }`}
                >
                  <h3 className={`font-heading font-bold text-lg ${isPrimaryUnit ? 'text-white' : 'text-[#0b1c30] dark:text-[#d3e4fe]'}`}>
                    {unit.title}
                  </h3>
                  <p className={`text-xs mt-0.5 font-medium ${isPrimaryUnit ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {unit.subtitle}
                  </p>
                </div>

                {/* Path Nodes Container */}
                <div className="relative flex flex-col items-center gap-12 pb-6">
                  {/* Render Nodes */}
                  {nodePositions.map(({ node, xOffset }) => {
                    const isCompleted = node.status === 'completed';
                    const isCurrent = node.status === 'current';
                    const isLocked = node.status === 'locked';
                    const isExam = node.type === 'exam';

                    return (
                      <div 
                        key={node.id} 
                        className="relative z-10"
                        style={{ transform: `translateX(${xOffset}px)` }}
                      >
                        {/* Pulse ring for active current node */}
                        {isCurrent && <div className="pulse-ring" />}

                        {/* Circular Node Button */}
                        <motion.button
                          onClick={(e) => handleNodeClick(node, e)}
                          disabled={isLocked}
                          whileHover={!isLocked ? { scale: 1.1, rotate: isCurrent ? 3 : 0 } : undefined}
                          whileTap={!isLocked ? { scale: 0.92 } : undefined}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className={`rounded-full flex items-center justify-center btn-3d cursor-pointer transition-all ${
                            isCurrent ? 'w-24 h-24 bg-[#4648d4] text-white shadow-[0px_6px_0px_0px_rgba(47,46,190,1)] active-glow' : 'w-20 h-20'
                          } ${
                            isCompleted
                              ? 'bg-[#006c49] text-white shadow-[0px_4px_0px_0px_rgba(0,108,73,1)]'
                              : isCurrent
                              ? ''
                              : isExam
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shadow-[0px_4px_0px_0px_rgba(130,81,0,0.5)] border border-amber-300 dark:border-amber-700'
                              : 'bg-[#dce9ff] dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-not-allowed'
                          }`}
                        >
                          {isCompleted && <Check className="w-8 h-8 stroke-[3]" />}
                          {isCurrent && (node.iconName === 'Wind' ? <Wind className="w-9 h-9 stroke-[2.5]" /> : <Sparkles className="w-9 h-9" />)}
                          {isLocked && <Lock className="w-7 h-7" />}
                          {isExam && <Trophy className="w-8 h-8 text-amber-800 dark:text-amber-300" />}
                        </motion.button>

                        {/* Node Label Underneath */}
                        {(!isLocked || isExam) && (
                          <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading font-bold text-xs ${
                            isCompleted ? 'text-[#006c49] dark:text-emerald-400' : isCurrent ? 'text-[#4648d4] dark:text-[#c0c1ff]' : 'text-amber-800 dark:text-amber-300'
                          }`}>
                            {node.title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* FAB: Evaluar mi voz */}
      <div className="fixed bottom-24 right-6 z-40">
        <motion.button
          onClick={() => {
            audioService.playClickSound();
            onOpenVoiceEval();
          }}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-center gap-2 bg-[#6063ee] dark:bg-[#4648d4] text-white px-6 py-4 rounded-full shadow-[0px_6px_0px_0px_rgba(47,46,190,1)] active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(47,46,190,1)] transition-all group cursor-pointer border border-white/20"
        >
          <Mic className="w-6 h-6 font-bold group-hover:rotate-12 transition-transform animate-pulse" />
          <span className="font-bold font-heading text-sm">Evaluar mi voz</span>
        </motion.button>
      </div>
    </div>
  );
};

