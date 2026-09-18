'use client';
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Unit, LessonNode, UserStats } from '../types';
import { Check, Wind, Lock, Trophy, Music, Mic, Sparkles, Heart, Clock, Zap, ShoppingBag, X, Drum } from 'lucide-react';
import { audioService, playSuccessBellSound } from '../utils/audioService';
import { getTimeToNextLife, MAX_LIVES } from '../utils/livesEngine';

interface AcademiaViewProps {
  userStats: UserStats;
  units: Unit[];
  onSelectNode: (node: LessonNode) => void;
  onOpenVoiceEval: () => void;
  unlockedUnitAnimationId?: number | null;
  onClearUnlockedUnitAnimation?: () => void;
  onOpenUnitCelebration?: () => void;
  justUnlockedNodeId?: string | null;
  onClearJustUnlockedNode?: () => void;
  zenMode?: boolean;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

const AcademiaViewComponent: React.FC<AcademiaViewProps> = ({
  userStats,
  units,
  onSelectNode,
  onOpenVoiceEval,
  unlockedUnitAnimationId,
  onClearUnlockedUnitAnimation,
  onOpenUnitCelebration,
  justUnlockedNodeId,
  onClearJustUnlockedNode,
  zenMode = false,
  onOpenRecoveryExam,
  onOpenStore
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

  // Lives Gate & passive timer state
  const [showNoLivesModal, setShowNoLivesModal] = useState<boolean>(false);
  const [timeToNextLife, setTimeToNextLife] = useState(() => getTimeToNextLife(userStats));

  useEffect(() => {
    if (!showNoLivesModal || (userStats.lives ?? MAX_LIVES) >= MAX_LIVES) return;
    setTimeToNextLife(getTimeToNextLife(userStats));
    const timer = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(timer);
  }, [showNoLivesModal, userStats]);

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

  const handleUnitHeaderClick = (isUnlocked: boolean) => {
    if (!isUnlocked) {
      audioService.vibrate(18);
      audioService.playFrequency(180, 0.2);
    }
  };

  // State for Water Loading Bar Animation on the Unit Header
  const [animatingUnitId, setAnimatingUnitId] = useState<number | null>(unlockedUnitAnimationId ?? null);
  const [waterFillProgress, setWaterFillProgress] = useState<number>(0);
  const [isWaterFillComplete, setIsWaterFillComplete] = useState<boolean>(false);
  const [isFirstNodeIlluminated, setIsFirstNodeIlluminated] = useState<boolean>(false);

  const onClearRef = useRef(onClearUnlockedUnitAnimation);
  onClearRef.current = onClearUnlockedUnitAnimation;

  // Auto-scroll journey and celebratory unlock sequence when a unit is freshly unlocked
  // Rolls smoothly from Node 1 of Unit 1 down through all confirmed green nodes, then slows down at Unit 2
  // Once stopped at Unit 2 (which is initially grey), the bar fills up like water from left to right with primary color!
  // After the bar finishes filling and unlocks, the first node illuminates with a radiant glow and victory bell chime!
  useEffect(() => {
    if (unlockedUnitAnimationId) {
      setAnimatingUnitId(unlockedUnitAnimationId);
      setWaterFillProgress(0);
      setIsWaterFillComplete(false);
      setIsFirstNodeIlluminated(false);

      // 1. Immediately place view at the very top of Unit 1 so Node 1 is fully visible in green
      window.scrollTo({ top: 0, behavior: 'instant' });

      let scrollAnimFrameId: number;
      let fillAnimFrameId: number;
      let fillTimeoutId: NodeJS.Timeout;
      let nodeIlluminationTimeoutId: NodeJS.Timeout;
      const scrollDuration = 3400; // 3.4s of smooth cinematic descent through confirmed green nodes

      // Allow 500ms for the user to register Unit 1 and Node 1 in confirmed green before starting descent
      const startTimer = setTimeout(() => {
        const targetEl = document.getElementById(`unit-card-${unlockedUnitAnimationId}`) || document.getElementById('node-u2-node13');
        if (!targetEl) return;

        const startY = window.scrollY;
        const targetRect = targetEl.getBoundingClientRect();
        const targetY = Math.max(0, window.scrollY + targetRect.top - (window.innerHeight / 2) + (targetRect.height / 2));
        const distance = targetY - startY;

        let startTime: number | null = null;

        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const p = Math.min(1, elapsed / scrollDuration);

          // Easing: easeOutCubic delivers steady travel through all green nodes and a gentle "slow down" upon arrival
          const ease = 1 - Math.pow(1 - p, 3);
          window.scrollTo(0, startY + distance * ease);

          if (p < 1) {
            scrollAnimFrameId = requestAnimationFrame(step);
          } else {
            // Arrived at Unit 2: The camera has stopped completely!
            // Snap to exact target position
            window.scrollTo(0, targetY);

            // Notice Unit 2 is initially displayed in its GREY locked state.
            // Pause 280ms so the user registers the grey bar, then begin water loading fill!
            fillTimeoutId = setTimeout(() => {
              const fillDuration = 1800; // 1.8s liquid water filling animation from left to right
              audioService.playWaterFillSound(fillDuration / 1000);

              let fillStartTime: number | null = null;
              const fillStep = (fillTimestamp: number) => {
                if (!fillStartTime) fillStartTime = fillTimestamp;
                const fillElapsed = fillTimestamp - fillStartTime;
                const fillP = Math.min(1, fillElapsed / fillDuration);

                // Fluid liquid ease (gentle acceleration and smooth deceleration)
                const easedProgress = fillP < 0.5
                  ? 2 * fillP * fillP
                  : 1 - Math.pow(-2 * fillP + 2, 2) / 2;

                setWaterFillProgress(easedProgress * 100);

                if (fillP < 1) {
                  fillAnimFrameId = requestAnimationFrame(fillStep);
                } else {
                  // 100% Filled with water!
                  setWaterFillProgress(100);
                  setIsWaterFillComplete(true);

                  // Stage 1: Padlock snap + triumphant rising arpeggio on the Unit Bar!
                  setTimeout(() => {
                    audioService.playUnitUnlockSound();
                  }, 60);

                  // Stage 2: AFTER unit bar finishes filling & arpeggio concludes (720ms),
                  // illuminate the first node with a celebratory spring pop & crystal victory bell!
                  nodeIlluminationTimeoutId = setTimeout(() => {
                    setIsFirstNodeIlluminated(true);
                    try {
                      if (typeof playSuccessBellSound === 'function') {
                        playSuccessBellSound();
                      } else if (typeof audioService?.playSuccessBellSound === 'function') {
                        audioService.playSuccessBellSound();
                      } else if (typeof audioService?.playZenChimeSound === 'function') {
                        audioService.playZenChimeSound();
                      }
                    } catch (err) {
                      console.warn('Error triggering victory bell sound:', err);
                    }
                  }, 720);
                }
              };

              fillAnimFrameId = requestAnimationFrame(fillStep);
            }, 280);
          }
        };

        scrollAnimFrameId = requestAnimationFrame(step);
      }, 500);

      const clearTimer = setTimeout(() => {
        setAnimatingUnitId(null);
        setWaterFillProgress(0);
        setIsWaterFillComplete(true);
        setIsFirstNodeIlluminated(true);
        onClearRef.current?.();
      }, 9800);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(fillTimeoutId);
        clearTimeout(nodeIlluminationTimeoutId);
        clearTimeout(clearTimer);
        cancelAnimationFrame(scrollAnimFrameId);
        cancelAnimationFrame(fillAnimFrameId);
        onClearRef.current?.();
      };
    } else {
      setAnimatingUnitId(null);
      setWaterFillProgress(0);
      setIsWaterFillComplete(false);
      setIsFirstNodeIlluminated(false);
    }
  }, [unlockedUnitAnimationId]);

  // Active individual node celebration state (crystal bell chime, scale pop, and two-tone radiant glow)
  const [celebratingNodeId, setCelebratingNodeId] = useState<string | null>(null);

  const onClearNodeRef = useRef(onClearJustUnlockedNode);
  onClearNodeRef.current = onClearJustUnlockedNode;

  useEffect(() => {
    if (justUnlockedNodeId) {
      // 1. Initial smooth camera glide toward the unlocked node while modal finishes unmounting (400ms)
      const scrollTimer = setTimeout(() => {
        const targetEl = document.getElementById(`node-${justUnlockedNodeId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);

      // 2. Delayed celebration trigger at ~1500ms: user is fully settled in AcademiaView
      // Triggers the scale pop, bicolor radiant glow, and crystal victory bell sound
      const celebrationTimer = setTimeout(() => {
        setCelebratingNodeId(justUnlockedNodeId);

        try {
          if (typeof playSuccessBellSound === 'function') {
            playSuccessBellSound();
          } else if (typeof audioService?.playSuccessBellSound === 'function') {
            audioService.playSuccessBellSound();
          } else if (typeof audioService?.playZenChimeSound === 'function') {
            audioService.playZenChimeSound();
          }
        } catch (err) {
          console.warn('Error playing node victory bell sound:', err);
        }
      }, 1500);

      // 3. Clear animation celebration state after radiant glow completes (4200ms)
      const clearTimer = setTimeout(() => {
        setCelebratingNodeId(null);
        onClearNodeRef.current?.();
      }, 4200);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(celebrationTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [justUnlockedNodeId]);

  const handleNodeClick = (node: LessonNode, event?: React.MouseEvent<HTMLButtonElement>) => {
    const isTemporarilyLocked = animatingUnitId !== null && !isFirstNodeIlluminated;
    if (node.status === 'locked' || isTemporarilyLocked) {
      audioService.vibrate(18);
      audioService.playFrequency(180, 0.2);
      return;
    }

    // Gate on 0 lives
    if ((userStats.lives ?? MAX_LIVES) <= 0) {
      audioService.playHeartLostSound();
      setShowNoLivesModal(true);
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
          className={`backdrop-blur-2xl p-5 sm:p-6 rounded-3xl relative overflow-hidden transition-all cursor-pointer active:scale-[0.98] select-none h-[112px] flex flex-col justify-center group ${
            zenMode
              ? 'bg-[#1f2125] border border-[#2e3138] shadow-[0px_4px_20px_rgba(0,0,0,0.5)]'
              : 'bg-[#ffffff] dark:bg-[#102034] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.05)] border border-white/80 dark:border-white/10 hover:shadow-[0px_12px_40px_0px_rgba(70,72,212,0.15)]'
          }`}
        >
          {/* Subtle gradient orb behind the card */}
          {!zenMode && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          )}

          <div className="relative z-10 space-y-1 max-w-[85%]">
            <h2 className={`font-heading font-black text-lg sm:text-xl shrink-0 ${
              zenMode
                ? 'text-[#f0ebe1]'
                : 'bg-gradient-to-r from-[#4648d4] to-indigo-400 dark:from-indigo-300 dark:to-[#c0c1ff] bg-clip-text text-transparent'
            }`}>
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
            const isThisUnitAnimating = (animatingUnitId ?? unlockedUnitAnimationId) === unit.id;
            const isUnitUnlocked = isThisUnitAnimating 
              ? isWaterFillComplete 
              : (unit.id === 1 || unit.nodes.some(n => n.status === 'current' || n.status === 'completed'));
            const isJustUnlocked = isThisUnitAnimating && isWaterFillComplete;

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
                  id={`unit-card-${unit.id}`}
                  className={`w-full p-1 sm:p-[5px] rounded-full transition-all duration-500 ${
                    isJustUnlocked
                      ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-100 dark:ring-offset-slate-900 shadow-[0_0_35px_rgba(251,191,36,0.85)] scale-[1.02]'
                      : 'bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
                    
                    {/* Tarjeta Incrustada */}
                    <div 
                      data-locked={!isUnitUnlocked ? 'true' : undefined}
                      onClick={() => handleUnitHeaderClick(isUnitUnlocked)}
                      className={`w-full flex items-center justify-center px-5 py-3.5 rounded-full transition-all duration-300 relative border border-transparent btn-3d overflow-hidden ${
                      isUnitUnlocked 
                        ? (zenMode
                            ? "bg-[#22252a] text-[#f0ebe1] border-[#383c44] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.6)] active:translate-y-[2px] group cursor-pointer"
                            : "bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer")
                        : "bg-[#dce9ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-pointer active:translate-y-[2px] active:shadow-[0px_1px_0px_0px_rgba(118,117,134,0.3)]"
                    }`}>
                      {/* Base Typography (Grey when locked, white when unlocked) */}
                      <div className="flex flex-col items-center text-center gap-0.5 pointer-events-none">
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm leading-tight ${
                          isUnitUnlocked 
                            ? (zenMode ? "text-[#e5b83b] font-black" : "text-indigo-200")
                            : "text-slate-400 dark:text-slate-500"
                        }`}>
                          Unidad {index + 1}
                        </span>
                        <span className={`text-lg sm:text-xl font-black leading-tight ${
                          isUnitUnlocked 
                            ? (zenMode ? "text-[#f0ebe1]" : "text-white drop-shadow-md")
                            : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {unit.title.replace(/^Unidad\s+\d+:\s*/i, '')}
                        </span>
                      </div>

                      {/* WATER LOADING BAR OVERLAY (Liquid filling from left to right with primary color) */}
                      {isThisUnitAnimating && !isWaterFillComplete && (
                        <div 
                          className="absolute top-0 left-0 bottom-0 pointer-events-none rounded-full overflow-hidden z-20 transition-none"
                          style={{
                            width: `${Math.max(0, Math.min(100, waterFillProgress))}%`
                          }}
                        >
                          {/* Inner container with calculated inverse width so text stays centered without squeezing */}
                          <div 
                            className="absolute top-0 left-0 bottom-0 h-full bg-gradient-to-r from-[#383aba] via-[#4648d4] to-[#4f52e6] shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] flex items-center justify-center px-5 py-3.5 transition-none"
                            style={{
                              width: `${10000 / Math.max(0.1, waterFillProgress)}%`
                            }}
                          >
                            {/* Water Surface Gloss & Bottom Depth */}
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none rounded-t-full" />
                            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent pointer-events-none rounded-b-full" />

                            {/* Crisp White / Indigo Typography under the water */}
                            <div className="flex flex-col items-center text-center gap-0.5 relative z-10 pointer-events-none">
                              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm leading-tight text-indigo-200">
                                Unidad {index + 1}
                              </span>
                              <span className="text-lg sm:text-xl font-black leading-tight text-white drop-shadow-md">
                                {unit.title.replace(/^Unidad\s+\d+:\s*/i, '')}
                              </span>
                            </div>

                            {/* Floating Micro-bubbles inside the liquid */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              <span className="absolute bottom-2 left-[12%] w-1.5 h-1.5 rounded-full bg-white/45 animate-pulse" />
                              <span className="absolute top-2.5 left-[30%] w-2 h-2 rounded-full bg-white/35 animate-pulse delay-100" />
                              <span className="absolute bottom-3 left-[55%] w-1 h-1 rounded-full bg-white/50 animate-pulse delay-200" />
                              <span className="absolute top-2 left-[78%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse delay-300" />
                            </div>
                          </div>

                          {/* Dynamic Water Wave Front Crest & Foam Shimmer at the leading edge */}
                          {waterFillProgress > 1 && waterFillProgress < 99 && (
                            <div 
                              className="absolute top-0 bottom-0 right-0 pointer-events-none z-30 flex items-center translate-x-1/2"
                              style={{ width: '28px' }}
                            >
                              {/* Fluid Undulating Wave SVG */}
                              <svg 
                                className="w-full h-full overflow-visible text-white/40"
                                viewBox="0 0 28 100" 
                                preserveAspectRatio="none"
                              >
                                <path 
                                  d="M 12 0 Q 24 25 14 50 T 18 100 L 0 100 L 0 0 Z" 
                                  fill="rgba(255, 255, 255, 0.25)" 
                                />
                                <path 
                                  d="M 14 0 Q 26 25 16 50 T 20 100" 
                                  stroke="rgba(255, 255, 255, 0.95)" 
                                  strokeWidth="3" 
                                  fill="none" 
                                />
                              </svg>

                              {/* Luminous Foam & Light Glow */}
                              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-cyan-200 via-white to-transparent blur-[2px]" />
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-ping" />
                              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_8px_#a5f3fc]" />
                            </div>
                          )}
                        </div>
                      )}

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
                      className={`${zenMode ? 'text-[#2e3138]' : 'text-slate-200 dark:text-slate-800/60'} drop-shadow-sm`}
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
                    const isThisNodeLockedUntilIllumination = isThisUnitAnimating && !isFirstNodeIlluminated && !isCompleted;
                    const isCurrent = isThisNodeLockedUntilIllumination ? false : (node.status === 'current');
                    const isLocked = isThisNodeLockedUntilIllumination ? true : (node.status === 'locked');
                    const isExam = node.type === 'exam';
                    const isThisNodeCelebrating =
                      (node.id === celebratingNodeId) ||
                      (isThisUnitAnimating && isFirstNodeIlluminated && isCurrent);

                    return (
                      <div 
                        key={node.id} 
                        id={`node-${node.id}`}
                        className="relative z-10"
                        style={{ transform: `translateX(${xOffset}px)` }}
                      >
                        {/* Pulse ring for active current node */}
                        {isCurrent && <div className="pulse-ring" />}

                        {/* Radiant celebratory glow when the node is freshly unlocked */}
                        {isThisNodeCelebrating && (
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: [0.6, 1.45, 1.2], opacity: [0, 0.85, 0] }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 blur-md pointer-events-none z-0"
                          />
                        )}

                        {/* Circular Node Button */}
                        <motion.button
                          onClick={(e) => handleNodeClick(node, e)}
                          data-locked={isLocked ? 'true' : undefined}
                          animate={isThisNodeCelebrating ? {
                            scale: [0.85, 1.15, 1],
                            rotate: [0, -5, 3, 0],
                            transition: {
                              duration: 0.65,
                              times: [0, 0.55, 1],
                              ease: 'easeOut'
                            }
                          } : {
                            scale: 1,
                            rotate: 0
                          }}
                          whileHover={{ scale: isCurrent ? 1.08 : 1.04, rotate: isCurrent ? 5 : 0 }}
                          whileTap={{ scale: 0.92, y: 2 }}
                          transition={isThisNodeCelebrating ? {
                            duration: 0.65,
                            ease: 'easeOut'
                          } : {
                            type: 'spring',
                            stiffness: 700,
                            damping: 14,
                            mass: 0.5
                          }}
                          className={`flex items-center justify-center transition-all relative overflow-hidden ${
                            isExam
                              ? (zenMode
                                  ? 'rounded-[50%] transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#f5d56b] via-[#e5b83b] to-[#9a7212] text-[#161719] shadow-[0px_6px_0px_0px_rgba(0,0,0,0.6),inset_0px_4px_6px_rgba(255,255,255,0.4)] border border-[#fae188] cursor-pointer'
                                  : `rounded-[50%] transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#ffe55c] via-[#f59e0b] to-[#92400e] text-white shadow-[0px_6px_0px_0px_rgba(100,45,10,1),0px_10px_15px_0px_rgba(245,158,11,0.5),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)] ring-2 ring-amber-300/40 cursor-pointer active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(100,45,10,1)] ${isLocked ? 'opacity-90' : ''}`)
                              : isCompleted
                              ? (zenMode
                                  ? 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#3a3e47] via-[#2c3038] to-[#1f2228] text-[#f0ebe1] shadow-[0px_6px_0px_0px_rgba(0,0,0,0.6),inset_0px_3px_5px_rgba(255,255,255,0.2)] border border-[#4a505c] active:translate-y-1'
                                  : 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#00eb9c] via-[#00b077] to-[#005a3d] text-white shadow-[0px_6px_0px_0px_rgba(0,60,40,1),0px_10px_15px_0px_rgba(0,108,73,0.5),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)] ring-2 ring-[#00d08a]/30 active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(0,60,40,1),0px_4px_8px_0px_rgba(0,108,73,0.3),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)]')
                              : isCurrent
                              ? (zenMode
                                  ? 'rounded-[50%] cursor-pointer transition-colors w-[104px] h-[86px] bg-gradient-to-t from-[#f5d56b] via-[#e5b83b] to-[#b38615] text-[#161719] shadow-[0px_12px_0px_0px_#75550a,0px_16px_25px_0px_rgba(229,184,59,0.35),inset_0px_4px_6px_rgba(255,255,255,0.6)] border-2 border-[#fae188] -translate-y-3 active:translate-y-0'
                                  : 'rounded-[50%] cursor-pointer transition-colors w-[104px] h-[86px] bg-gradient-to-t from-[#8f91ff] via-[#4648d4] to-[#1e1f7a] text-white shadow-[0px_16px_0px_0px_rgba(30,30,120,1),0px_24px_30px_0px_rgba(70,72,212,0.6),inset_0px_12px_15px_rgba(0,0,0,0.7),inset_0px_-6px_10px_rgba(255,255,255,0.8)] ring-2 ring-indigo-300 -translate-y-3 active:translate-y-0 active:shadow-[0px_4px_0px_0px_rgba(30,30,120,1),0px_8px_12px_0px_rgba(70,72,212,0.4),inset_0px_12px_15px_rgba(0,0,0,0.7),inset_0px_-6px_10px_rgba(255,255,255,0.8)]')
                              : isLocked
                              ? (zenMode
                                  ? 'rounded-full btn-3d w-20 h-20 bg-[#1f2125] text-slate-500 border border-[#2e3138] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.4)] cursor-pointer active:translate-y-1'
                                  : 'rounded-full btn-3d w-20 h-20 bg-[#dce9ff] dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-pointer active:translate-y-1 active:shadow-[0px_1px_0px_0px_rgba(118,117,134,0.3)]')
                              : 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-white/40 dark:bg-[#102034]/40 backdrop-blur-md text-slate-400 dark:text-slate-500 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.3),inset_0px_-2px_4px_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/10'
                          }`}
                        >
                          {/* Pseudo-element for extra top glass sheen */}
                          {(!isLocked || isExam) && (
                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 rounded-full h-1/2" />
                          )}
                          {isCompleted && !isExam && <Check className="w-8 h-8 stroke-[3]" />}
                          {isCurrent && (
                            node.iconName === 'Wind' ? (
                              <Wind className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            ) : node.iconName === 'Mic' || node.iconName === 'Mic2' ? (
                              <Mic className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            ) : node.iconName === 'Music' ? (
                              <Music className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            ) : node.iconName === 'Drum' || node.iconName === 'Clock' || unit.id === 3 ? (
                              <Drum className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            ) : (
                              <Sparkles className="w-9 h-9" />
                            )
                          )}
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
          className={`flex items-center gap-2 px-6 py-4 rounded-full transition-colors duration-75 group cursor-pointer relative overflow-hidden ${
            zenMode
              ? 'bg-[#e5b83b] text-[#161719] shadow-[0px_6px_0px_0px_#9a7212,0px_12px_20px_0px_rgba(229,184,59,0.3)] border border-[#f5d56b] active:translate-y-1'
              : 'bg-[#6063EE] text-white shadow-[0px_6px_0px_0px_rgba(30,30,120,1),0px_12px_20px_0px_rgba(47,46,190,0.6),inset_0px_4px_6px_rgba(255,255,255,0.7),inset_0px_-4px_6px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1),0px_6px_10px_0px_rgba(47,46,190,0.4),inset_0px_2px_4px_rgba(255,255,255,0.5),inset_0px_-2px_4px_rgba(0,0,0,0.3)]'
          }`}
        >
          <Mic className="w-6 h-6 font-bold group-hover:rotate-12 transition-transform animate-pulse" />
          <span className="font-bold font-heading text-sm">Evaluar mi voz</span>
        </motion.button>
      </div>

      {/* 0-Lives Gate Modal */}
      {showNoLivesModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowNoLivesModal(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl relative border text-center space-y-4 ${
              zenMode
                ? 'bg-[#1a1b1e] border-[#2e3138] text-[#ded9cf]'
                : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-slate-800 text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNoLivesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
              <Heart className="w-8 h-8 fill-transparent text-rose-500 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
                ¡Te has quedado sin vidas!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Para acceder a las lecciones y exámenes de la Academia necesitas al menos 1 vida.
              </p>
            </div>

            {/* Passive timer */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left ${
              zenMode
                ? 'bg-[#22252a] border-[#2e3138]'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Recarga pasiva en
                </span>
              </div>
              <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">
                {timeToNextLife.formatted}
              </span>
            </div>

            {/* Options */}
            <div className="space-y-2 pt-1">
              {onOpenRecoveryExam && (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setShowNoLivesModal(false);
                    onOpenRecoveryExam();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  <span>Entrenar para ganar 1 vida (Gratis)</span>
                </button>
              )}

              {onOpenStore && (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setShowNoLivesModal(false);
                    onOpenStore();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    zenMode
                      ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  <span>Recargar en la Tienda</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AcademiaView = React.memo(AcademiaViewComponent);
export default AcademiaView;

