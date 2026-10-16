'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Unit, LessonNode } from '../../types';
import { Check, Wind, Lock, Trophy, Music, Mic, Zap, Drum, GraduationCap } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface AcademiaUnitCardProps {
  unit: Unit;
  index: number;
  zenMode?: boolean;
  animatingUnitId: number | null;
  waterFillProgress: number;
  isWaterFillComplete: boolean;
  isFirstNodeIlluminated: boolean;
  celebratingNodeId: string | null;
  onUnitHeaderClick: (isUnlocked: boolean) => void;
  onNodeClick: (node: LessonNode, e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export const AcademiaUnitCard: React.FC<AcademiaUnitCardProps> = ({
  unit,
  index,
  zenMode = false,
  animatingUnitId,
  waterFillProgress,
  isWaterFillComplete,
  isFirstNodeIlluminated,
  celebratingNodeId,
  onUnitHeaderClick,
  onNodeClick
}) => {
  const router = useRouter();
  const isThisUnitAnimating = animatingUnitId === unit.id;
  const isUnitUnlocked = isThisUnitAnimating
    ? isWaterFillComplete
    : unit.nodes.some((n) => n.status !== 'locked');

  const isUnit4 = unit.id === 4;
  const certUnlocked = isUnitUnlocked;
  const certificationOffset = -15;

  const offsets = [0, 45, -45, 0, 45, -45, 0, 45, -45, 0, 45, -45, 0, 45, -45];
  const nodePositions = unit.nodes.map((node, i) => ({
    node,
    xOffset: offsets[i % offsets.length]
  }));

  const allPathOffsets = isUnit4
    ? [...nodePositions.map((p) => p.xOffset), certificationOffset]
    : nodePositions.map((p) => p.xOffset);

  const certExtraDistance = 140;

  return (
    <div key={unit.id} id={`unit-card-${unit.id}`} className="space-y-6">
      {/* 3D Sunken Socket Outer Frame */}
      <div
        className={`w-full p-1.5 sm:p-[6px] rounded-full shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border ${
          zenMode
            ? 'bg-[#181a1d] border-[#2e3138] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.8)]'
            : 'bg-[#f1f5f9] dark:bg-[#0f172a] border-slate-200 dark:border-slate-800'
        }`}
      >
        <div
          className={`w-full p-2 flex flex-col items-center justify-center rounded-full shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border ${
            zenMode
              ? 'bg-[#121416] border-[#24272e] shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.9)]'
              : 'bg-[#e2e8f0] dark:bg-[#090d16] border-slate-300/40 dark:border-slate-900'
          }`}
        >
          {/* Unit Header Button */}
          <button
            onClick={() => onUnitHeaderClick(isUnitUnlocked)}
            className={`w-full flex items-center justify-center px-5 py-3.5 rounded-full transition-all duration-300 relative border border-transparent btn-3d overflow-hidden ${
              isUnitUnlocked
                ? zenMode
                  ? 'bg-[#22252a] text-[#f0ebe1] border-[#383c44] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.6)] active:translate-y-[2px] group cursor-pointer'
                  : 'bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer'
                : 'bg-[#dce9ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-pointer active:translate-y-[2px] active:shadow-[0px_1px_0px_0px_rgba(118,117,134,0.3)]'
            }`}
          >
            {/* Base Typography */}
            <div className="flex flex-col items-center text-center gap-0.5 pointer-events-none">
              <span
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm leading-tight ${
                  isUnitUnlocked
                    ? zenMode
                      ? 'text-[#e5b83b] font-black'
                      : 'text-indigo-200'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                Unidad {index + 1}
              </span>
              <span
                className={`text-lg sm:text-xl font-black leading-tight ${
                  isUnitUnlocked
                    ? zenMode
                      ? 'text-[#f0ebe1]'
                      : 'text-white drop-shadow-md'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {unit.title.replace(/^Unidad\s+\d+:\s*/i, '')}
              </span>
            </div>

            {/* WATER LOADING BAR OVERLAY */}
            {isThisUnitAnimating && !isWaterFillComplete && (
              <div
                className="absolute top-0 left-0 bottom-0 pointer-events-none rounded-full overflow-hidden z-20 transition-none"
                style={{
                  width: `${Math.max(0, Math.min(100, waterFillProgress))}%`
                }}
              >
                <div
                  className="absolute top-0 left-0 bottom-0 h-full bg-gradient-to-r from-[#383aba] via-[#4648d4] to-[#4f52e6] shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] flex items-center justify-center px-5 py-3.5 transition-none"
                  style={{
                    width: `${10000 / Math.max(0.1, waterFillProgress)}%`
                  }}
                >
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none rounded-t-full" />
                  <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent pointer-events-none rounded-b-full" />

                  <div className="flex flex-col items-center text-center gap-0.5 relative z-10 pointer-events-none">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-sm leading-tight text-indigo-200">
                      Unidad {index + 1}
                    </span>
                    <span className="text-lg sm:text-xl font-black leading-tight text-white drop-shadow-md">
                      {unit.title.replace(/^Unidad\s+\d+:\s*/i, '')}
                    </span>
                  </div>

                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <span className="absolute bottom-2 left-[12%] w-1.5 h-1.5 rounded-full bg-white/45 animate-pulse" />
                    <span className="absolute top-2.5 left-[30%] w-2 h-2 rounded-full bg-white/35 animate-pulse delay-100" />
                    <span className="absolute bottom-3 left-[55%] w-1 h-1 rounded-full bg-white/50 animate-pulse delay-200" />
                    <span className="absolute top-2 left-[78%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse delay-300" />
                  </div>
                </div>

                {waterFillProgress > 1 && waterFillProgress < 99 && (
                  <div
                    className="absolute top-0 bottom-0 right-0 pointer-events-none z-30 flex items-center translate-x-1/2"
                    style={{ width: '28px' }}
                  >
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

                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-cyan-200 via-white to-transparent blur-[2px]" />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-ping" />
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_8px_#a5f3fc]" />
                  </div>
                )}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Path Nodes Container */}
      <div className="relative flex flex-col items-center gap-12 pb-6 pt-4">
        {/* SVG Organic Path */}
        <div className="absolute inset-0 flex justify-center pointer-events-none z-0">
          <svg
            width="300"
            height={allPathOffsets.length * 130 + (isUnit4 ? certExtraDistance : 0)}
            className={`${zenMode ? 'text-[#2e3138]' : 'text-slate-200 dark:text-slate-800/60'} drop-shadow-sm`}
          >
            <path
              d={allPathOffsets.reduce((acc, xOffset, i) => {
                const x = 150 + xOffset;
                const isLastCertOffset = isUnit4 && i === allPathOffsets.length - 1;
                const y = isLastCertOffset ? i * 128 + 40 + certExtraDistance : i * 128 + 40;
                if (i === 0) return `M ${x} ${y}`;
                const prevX = 150 + allPathOffsets[i - 1];
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
        {nodePositions.map(({ node, xOffset }, i) => {
          const isCompleted = node.status === 'completed';
          const isThisNodeLockedUntilIllumination =
            isThisUnitAnimating && !isFirstNodeIlluminated && !isCompleted;
          const isCurrent = isThisNodeLockedUntilIllumination ? false : node.status === 'current';
          const isLocked = isThisNodeLockedUntilIllumination ? true : node.status === 'locked';
          const isExam = node.type === 'exam';
          const isThisNodeCelebrating =
            node.id === celebratingNodeId ||
            (isThisUnitAnimating && isFirstNodeIlluminated && isCurrent);

          return (
            <div
              key={node.id}
              id={`node-${node.id}`}
              className="relative z-10"
              style={{ transform: `translateX(${xOffset}px)` }}
            >
              {isCurrent && <div className="pulse-ring" />}

              {isThisNodeCelebrating && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [0.6, 1.45, 1.2], opacity: [0, 0.85, 0] }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 blur-md pointer-events-none z-0"
                />
              )}

              <motion.button
                id={index === 0 && i === 0 ? 'tour-academia-first-node' : undefined}
                onClick={(e) => onNodeClick(node, e)}
                data-locked={isLocked ? 'true' : undefined}
                animate={
                  isThisNodeCelebrating
                    ? {
                        scale: [0.85, 1.15, 1],
                        rotate: [0, -5, 3, 0],
                        transition: {
                          duration: 0.65,
                          times: [0, 0.55, 1],
                          ease: 'easeOut'
                        }
                      }
                    : {
                        scale: 1,
                        rotate: 0
                      }
                }
                whileHover={{ scale: isCurrent ? 1.08 : 1.04, rotate: isCurrent ? 5 : 0 }}
                whileTap={{ scale: 0.92, y: 2 }}
                transition={
                  isThisNodeCelebrating
                    ? {
                        duration: 0.65,
                        ease: 'easeOut'
                      }
                    : {
                        type: 'spring',
                        stiffness: 700,
                        damping: 14,
                        mass: 0.5
                      }
                }
                className={`flex items-center justify-center transition-all relative overflow-hidden ${
                  isExam
                    ? zenMode
                      ? 'rounded-[50%] transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#f5d56b] via-[#e5b83b] to-[#9a7212] text-[#161719] shadow-[0px_6px_0px_0px_rgba(0,0,0,0.6),inset_0px_4px_6px_rgba(255,255,255,0.4)] border border-[#fae188] cursor-pointer'
                      : `rounded-[50%] transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#ffe55c] via-[#f59e0b] to-[#92400e] text-white shadow-[0px_6px_0px_0px_rgba(100,45,10,1),0px_10px_15px_0px_rgba(245,158,11,0.5),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)] ring-2 ring-amber-300/40 cursor-pointer active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(100,45,10,1)] ${
                          isLocked ? 'opacity-90' : ''
                        }`
                    : isCompleted
                    ? zenMode
                      ? 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#3a3e47] via-[#2c3038] to-[#1f2228] text-[#f0ebe1] shadow-[0px_6px_0px_0px_rgba(0,0,0,0.6),inset_0px_3px_5px_rgba(255,255,255,0.2)] border border-[#4a505c] active:translate-y-1'
                      : 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-gradient-to-b from-[#00eb9c] via-[#00b077] to-[#005a3d] text-white shadow-[0px_6px_0px_0px_rgba(0,60,40,1),0px_10px_15px_0px_rgba(0,108,73,0.5),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)] ring-2 ring-[#00d08a]/30 active:translate-y-1 active:shadow-[0px_2px_0px_0px_rgba(0,60,40,1),0px_4px_8px_0px_rgba(0,108,73,0.3),inset_0px_4px_6px_rgba(255,255,255,0.8),inset_0px_-4px_6px_rgba(0,0,0,0.5)]'
                    : isCurrent
                    ? zenMode
                      ? 'rounded-[50%] cursor-pointer transition-colors w-[104px] h-[86px] bg-gradient-to-t from-[#f5d56b] via-[#e5b83b] to-[#b38615] text-[#161719] shadow-[0px_12px_0px_0px_#75550a,0px_16px_25px_0px_rgba(229,184,59,0.35),inset_0px_4px_6px_rgba(255,255,255,0.6)] border-2 border-[#fae188] -translate-y-3 active:translate-y-0'
                      : 'rounded-[50%] cursor-pointer transition-colors w-[104px] h-[86px] bg-gradient-to-t from-[#8f91ff] via-[#4648d4] to-[#1e1f7a] text-white shadow-[0px_16px_0px_0px_rgba(30,30,120,1),0px_24px_30px_0px_rgba(70,72,212,0.6),inset_0px_12px_15px_rgba(0,0,0,0.7),inset_0px_-6px_10px_rgba(255,255,255,0.8)] ring-2 ring-indigo-300 -translate-y-3 active:translate-y-0 active:shadow-[0px_4px_0px_0px_rgba(30,30,120,1),0px_8px_12px_0px_rgba(70,72,212,0.4),inset_0px_12px_15px_rgba(0,0,0,0.7),inset_0px_-6px_10px_rgba(255,255,255,0.8)]'
                    : isLocked
                    ? zenMode
                      ? 'rounded-full btn-3d w-20 h-20 bg-[#1f2125] text-slate-500 border border-[#2e3138] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.4)] cursor-pointer active:translate-y-1'
                      : 'rounded-full btn-3d w-20 h-20 bg-[#dce9ff] dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)] cursor-pointer active:translate-y-1 active:shadow-[0px_1px_0px_0px_rgba(118,117,134,0.3)]'
                    : 'rounded-[50%] cursor-pointer transition-colors w-[84px] h-[72px] bg-white/40 dark:bg-[#102034]/40 backdrop-blur-md text-slate-400 dark:text-slate-500 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.3),inset_0px_-2px_4px_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/10'
                }`}
              >
                {(!isLocked || isExam) && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 rounded-full h-1/2" />
                )}
                {isCompleted && !isExam && <Check className="w-8 h-8 stroke-[3]" />}
                {isCurrent &&
                  (node.iconName === 'Wind' ? (
                    <Wind className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  ) : node.iconName === 'Mic' || node.iconName === 'Mic2' ? (
                    <Mic className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  ) : node.iconName === 'Music' ? (
                    <Music className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  ) : node.iconName === 'Drum' || node.iconName === 'Clock' || unit.id === 3 ? (
                    <Drum className="w-9 h-9 stroke-[2.5] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  ) : (
                    <Zap className="w-9 h-9" />
                  ))}
                {isLocked && !isExam && <Lock className="w-7 h-7" />}
                {isExam && <Trophy className="w-8 h-8 text-amber-800 dark:text-amber-300" />}
              </motion.button>
            </div>
          );
        })}

        {/* 🎓 Unidad 4 Capstone: Cuadro de Examen Final & Certificación Oficial */}
        {isUnit4 && (
          <div
            id="node-certification"
            className="relative z-10 flex flex-col items-center mt-32 sm:mt-36"
            style={{ transform: `translateX(${certificationOffset}px)` }}
          >
            <motion.button
              disabled={!certUnlocked}
              onClick={(e) => {
                if (!certUnlocked) return;
                audioService.playClickSound();
                audioService.vibrate(20);
                try {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (rect.left + rect.width / 2) / window.innerWidth;
                  const y = (rect.top + rect.height / 2) / window.innerHeight;
                  confetti({
                    particleCount: 60,
                    spread: 80,
                    origin: { x, y },
                    colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1', '#ffffff']
                  });
                } catch {}
                router.push('/certification');
              }}
              whileHover={certUnlocked ? { scale: 1.05 } : undefined}
              whileTap={certUnlocked ? { scale: 0.95, y: 2 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 14, mass: 0.5 }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl sm:rounded-3xl transition-all relative overflow-hidden group w-[96px] h-[92px] sm:w-[104px] sm:h-[100px] ${
                certUnlocked
                  ? zenMode
                    ? 'bg-[#f5d56b] text-[#161719] border-2 border-[#fae188] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.4)] cursor-pointer'
                    : 'bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] text-white border-2 border-amber-300/80 shadow-[0px_4px_0px_0px_#92400e] active:translate-y-1 active:shadow-[0px_1px_0px_0px_#92400e] cursor-pointer'
                  : `cursor-not-allowed opacity-80 grayscale ${
                      zenMode
                        ? 'bg-[#1f2125] text-slate-500 border-2 border-[#2e3138] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.4)]'
                        : 'bg-[#dce9ff] dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-300/50 shadow-[0px_4px_0px_0px_rgba(118,117,134,0.3)]'
                    }`
              }`}
            >
              {/* Icono: Birrete cuando está activo, candado cuando está bloqueado */}
              {certUnlocked ? (
                <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:rotate-6" />
              ) : (
                <Lock className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 dark:text-slate-500" />
              )}

              {/* Cuadro label text: Examen Final */}
              <span
                className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider font-heading leading-tight mt-1 text-center ${
                  certUnlocked
                    ? 'text-white drop-shadow-sm'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                Examen<br />Final
              </span>
            </motion.button>

            {/* Sub-label badge */}
            <div
              className={`mt-2.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 backdrop-blur-sm border ${
                certUnlocked
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-400/10 border-slate-400/30 text-slate-400 dark:text-slate-500'
              }`}
            >
              {certUnlocked ? (
                <GraduationCap className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{certUnlocked ? 'Certificación' : 'Bloqueado'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
