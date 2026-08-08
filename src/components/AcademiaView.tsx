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
  onReplayUnitCelebration?: () => void;
}

export const AcademiaView: React.FC<AcademiaViewProps> = ({
  userStats,
  units,
  onSelectNode,
  onOpenVoiceEval,
  onReplayUnitCelebration
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

  const handleUnitHeaderClick = (isPrimary: boolean) => {
    if (!isPrimary) {
      audioService.vibrate(18);
      audioService.playFrequency(180, 0.2);
    }
  };

  const handleNodeClick = (node: LessonNode, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (node.status === 'locked') {
      audioService.vibrate(18);
      audioService.playFrequency(180, 0.2);
      return;
    }

    audioService.playClickSound();
    audioService.vibrate(18);

    // Trigger soft confetti explosion over the node (only if it's not already completed)
    if (event && node.status !== 'completed') {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      const colors = ['#4648d4', '#818cf8', '#6366f1', '#6cf8bb', '#38bdf8', '#ffffff'];

      // Cinematic Two-burst confetti
      try {
        confetti({
          particleCount: 50,
          spread: 80,
          startVelocity: 30,
          ticks: 300,
          gravity: 0.8,
          scalar: 1.2,
          origin: { x, y },
          colors
        });
      } catch (e) {}
      setTimeout(() => {
        try {
          confetti({
            particleCount: 20,
            spread: 120,
            startVelocity: 45,
            ticks: 200,
            gravity: 1.2,
            scalar: 0.8,
            origin: { x, y },
            colors
          });
        } catch (e) {}
      }, 150);
    }

    onSelectNode(node);
  };

  return (
    <div className="pb-36 pt-4 px-4 max-w-lg mx-auto space-y-6 animate-fadeIn">
      {/* Welcome Section - Interactive Rotating Card */}
      <section id="tour-academia-welcome" className="mb-2">
        <div
          onClick={handleNextMessage}
          className="bg-[#ffffff] dark:bg-[#102034] backdrop-blur-2xl p-5 sm:p-6 rounded-3xl shadow-[0px_8px_32px_0px_rgba(0,0,0,0.05)] border border-white/80 dark:border-white/10 relative overflow-hidden transition-all cursor-pointer hover:shadow-[0px_12px_40px_0px_rgba(70,72,212,0.15)] active:scale-[0.98] select-none h-[112px] flex flex-col justify-center group"
        >
          {/* Subtle gradient orb behind the card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 space-y-1 max-w-[85%]">
            <h2 className="font-heading font-black text-lg sm:text-xl bg-gradient-to-r from-[#4648d4] to-indigo-400 dark:from-indigo-300 dark:to-[#c0c1ff] bg-clip-text text-transparent shrink-0">
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

          return units.map((unit, index) => {
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
                <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800">
                  <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
                    
                    {/* Tarjeta Incrustada */}
                    <div 
                      data-locked={!isPrimaryUnit ? 'true' : undefined}
                      onClick={() => handleUnitHeaderClick(isPrimaryUnit)}
                      className={`w-full flex items-center justify-center px-5 py-3.5 rounded-full transition-all duration-75 relative border border-transparent btn-3d ${
                      isPrimaryUnit 
                        ? "bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
                        : "bg-[#dce9ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-pointer active:translate-y-[2px] active:shadow-[0px_1px_0px_0px_rgba(118,117,134,0.3)]"
                    }`}>
                      <div className="flex flex-col items-center text-center gap-0.5">
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm leading-tight ${
                          isPrimaryUnit ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          Unidad {index + 1}
                        </span>
                        <span className={`text-lg sm:text-xl font-black leading-tight ${
                          isPrimaryUnit ? "text-white drop-shadow-md" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {unit.title.replace(/^Unidad\s+\d+:\s*/i, '')}
                        </span>

                        {isPrimaryUnit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              audioService.playClickSound();
                              if (onReplayUnitCelebration) {
                                onReplayUnitCelebration();
                              }
                            }}
                            className="mt-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300 text-amber-300 text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-md press-effect cursor-pointer"
                            title="Revivir Celebración Épica de Unidad"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-300" />
                            <span>REVIVIR CELEBRACIÓN ÉPICA</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Path Nodes Container */}
                <div className="relative flex flex-col items-center gap-12 pb-6 pt-4">
                  
                  {/* SVG Organic Path */}
                  <div className="absolute inset-0 flex justify-center pointer-events-none z-0">
                    <svg 
                      width="300" 
                      height={nodePositions.length * 130} 
                      className="text-slate-200 dark:text-slate-800/60 drop-shadow-sm"
                    >
                      <path
                        d={nodePositions.reduce((acc, { xOffset }, i) => {
                          const x = 150 + xOffset;
                          const y = i * 128 + 40;
                          if (i === 0) return `M ${x} ${y}`;
                          const prevX = 150 + nodePositions[i-1].xOffset;
                          const prevY = (i - 1) * 128 + 40;
                          const midY = (prevY + y) / 2;
                          return `${acc} C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
                        }, '')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

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
                          data-locked={isLocked ? 'true' : undefined}
                          whileHover={{ scale: isCurrent ? 1.08 : 1.04, rotate: isCurrent ? 5 : 0 }}
                          whileTap={{ scale: 0.92, y: 2 }}
                          transition={{ type: 'spring', stiffness: 800, damping: 12, mass: 0.5 }}
                          className={`flex items-center justify-center transition-all relative overflow-hidden ${
                            isExam
                              ? `rounded-[50%] transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#ffe55c] via-[#f59e0b] to-[#92400e] text-white shadow-[0px_6px_0px_0px_rgba(100,45,10,1),0px_10px_15px_0px_rgba(245,158,11,0.5),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)] ring-2 ring-amber-300/40 cursor-pointer active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(100,45,10,1)] ${isLocked ? 'opacity-90' : ''}`
                              : isLocked
                              ? 'rounded-full btn-3d w-20 h-20 bg-[#dce9ff] dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-pointer active:translate-y-1 active:shadow-[0px_1px_0px_0px_rgba(118,117,134,0.3)]'
                              : isCurrent
                              ? 'rounded-[50%] cursor-pointer transition-colors w-[104px] h-[86px] bg-gradient-to-t from-[#8f91ff] via-[#4648d4] to-[#1e1f7a] text-white shadow-[0px_16px_0px_0px_rgba(30,30,120,1),0px_24px_30px_0px_rgba(70,72,212,0.6),inset_0px_12px_15px_rgba(0,0,0,0.7),inset_0px_-6px_10px_rgba(255,255,255,0.8)] ring-2 ring-indigo-300 -translate-y-3 active:translate-y-0 active:shadow-[0px_4px_0px_0px_rgba(30,30,120,1),0px_8px_12px_0px_rgba(70,72,212,0.4),inset_0px_12px_15px_rgba(0,0,0,0.7),inset_0px_-6px_10px_rgba(255,255,255,0.8)]'
                              : isCompleted
                              ? 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#00eb9c] via-[#00b077] to-[#005a3d] text-white shadow-[0px_6px_0px_0px_rgba(0,60,40,1),0px_10px_15px_0px_rgba(0,108,73,0.5),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)] ring-2 ring-[#00d08a]/30 active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(0,60,40,1),0px_4px_8px_0px_rgba(0,108,73,0.3),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)]'
                              : 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-white/40 dark:bg-[#102034]/40 backdrop-blur-md text-slate-400 dark:text-slate-500 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.3),inset_0px_-2px_4px_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/10'
                          }`}
                        >
                          {/* Pseudo-element for extra top glass sheen */}
                          {(!isLocked || isExam) && (
                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 rounded-full h-1/2" />
                          )}
                          {isCompleted && <Check className="w-8 h-8 stroke-[3]" />}
                          {isCurrent && (node.iconName === 'Wind' ? <Wind className="w-9 h-9 stroke-[2.5]" /> : <Sparkles className="w-9 h-9" />)}
                          {isLocked && !isExam && <Lock className="w-7 h-7" />}
                          {isExam && <Trophy className="w-8 h-8 text-amber-800 dark:text-amber-300" />}
                        </motion.button>
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
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 800, damping: 12, mass: 0.5 }}
          className="flex items-center gap-2 bg-[#6063EE] text-white px-6 py-4 rounded-full shadow-[0px_6px_0px_0px_rgba(30,30,120,1),0px_12px_20px_0px_rgba(47,46,190,0.6),inset_0px_4px_6px_rgba(255,255,255,0.7),inset_0px_-4px_6px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1),0px_6px_10px_0px_rgba(47,46,190,0.4),inset_0px_2px_4px_rgba(255,255,255,0.5),inset_0px_-2px_4px_rgba(0,0,0,0.3)] transition-colors duration-75 group cursor-pointer relative overflow-hidden"
        >
          <Mic className="w-6 h-6 font-bold group-hover:rotate-12 transition-transform animate-pulse" />
          <span className="font-bold font-heading text-sm">Evaluar mi voz</span>
        </motion.button>
      </div>
    </div>
  );
};

