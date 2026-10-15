'use client';
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Unit, LessonNode, UserStats } from '../types';
import { audioService, playSuccessBellSound } from '../utils/audioService';
import { MAX_LIVES } from '../utils/livesEngine';
import { AcademiaWelcomeBanner } from './academia/AcademiaWelcomeBanner';
import { AcademiaNoLivesModal } from './academia/AcademiaNoLivesModal';
import { AcademiaUnitCard } from './academia/AcademiaUnitCard';

interface AcademiaViewProps {
  userStats: UserStats;
  units: Unit[];
  onSelectNode: (node: LessonNode) => void;
  onOpenVoiceEval?: () => void;
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
  justUnlockedNodeId,
  onClearJustUnlockedNode,
  zenMode = false,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  // Read saved vocal range from userStats or localStorage
  const activeVocalRange =
    userStats.vocalRange ||
    userStats.vocalRangeData?.classification ||
    (() => {
      try {
        const c = localStorage.getItem('laclave_vocal_range_classification');
        if (c) return c;
        const s = localStorage.getItem('laclave_vocal_range_saved');
        return s ? JSON.parse(s)?.classification : null;
      } catch {
        return null;
      }
    })();

  const savedRangeData =
    userStats.vocalRangeData ||
    (() => {
      try {
        const s = localStorage.getItem('laclave_vocal_range_saved');
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    })();

  const [showNoLivesModal, setShowNoLivesModal] = useState<boolean>(false);

  const handleUnitHeaderClick = (isUnlocked: boolean) => {
    if (!isUnlocked) {
      audioService.vibrate(18);
      audioService.playFrequency(180, 0.2);
    }
  };

  // Water Loading Bar Animation State
  const [animatingUnitId, setAnimatingUnitId] = useState<number | null>(unlockedUnitAnimationId ?? null);
  const [waterFillProgress, setWaterFillProgress] = useState<number>(0);
  const [isWaterFillComplete, setIsWaterFillComplete] = useState<boolean>(false);
  const [isFirstNodeIlluminated, setIsFirstNodeIlluminated] = useState<boolean>(false);

  const onClearRef = useRef(onClearUnlockedUnitAnimation);
  onClearRef.current = onClearUnlockedUnitAnimation;

  // Auto-scroll journey and celebratory unlock sequence
  useEffect(() => {
    if (unlockedUnitAnimationId) {
      setAnimatingUnitId(unlockedUnitAnimationId);
      setWaterFillProgress(0);
      setIsWaterFillComplete(false);
      setIsFirstNodeIlluminated(false);

      window.scrollTo({ top: 0, behavior: 'instant' });

      let scrollAnimFrameId: number;
      let fillAnimFrameId: number;
      let fillTimeoutId: NodeJS.Timeout;
      let nodeIlluminationTimeoutId: NodeJS.Timeout;
      const scrollDuration = 3400;

      const startTimer = setTimeout(() => {
        const targetEl =
          document.getElementById(`unit-card-${unlockedUnitAnimationId}`) ||
          document.getElementById('node-u2-node13');
        if (!targetEl) return;

        const startY = window.scrollY;
        const targetRect = targetEl.getBoundingClientRect();
        const targetY = Math.max(
          0,
          window.scrollY + targetRect.top - window.innerHeight / 2 + targetRect.height / 2
        );
        const distance = targetY - startY;

        let startTime: number | null = null;

        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const p = Math.min(1, elapsed / scrollDuration);
          const ease = 1 - Math.pow(1 - p, 3);
          window.scrollTo(0, startY + distance * ease);

          if (p < 1) {
            scrollAnimFrameId = requestAnimationFrame(step);
          } else {
            window.scrollTo(0, targetY);

            fillTimeoutId = setTimeout(() => {
              const fillDuration = 1800;
              audioService.playWaterFillSound(fillDuration / 1000);

              let fillStartTime: number | null = null;
              const fillStep = (fillTimestamp: number) => {
                if (!fillStartTime) fillStartTime = fillTimestamp;
                const fillElapsed = fillTimestamp - fillStartTime;
                const fillP = Math.min(1, fillElapsed / fillDuration);

                const easedProgress =
                  fillP < 0.5 ? 2 * fillP * fillP : 1 - Math.pow(-2 * fillP + 2, 2) / 2;

                setWaterFillProgress(easedProgress * 100);

                if (fillP < 1) {
                  fillAnimFrameId = requestAnimationFrame(fillStep);
                } else {
                  setWaterFillProgress(100);
                  setIsWaterFillComplete(true);

                  setTimeout(() => {
                    audioService.playUnitUnlockSound();
                  }, 60);

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

  // Active individual node celebration state
  const [celebratingNodeId, setCelebratingNodeId] = useState<string | null>(null);

  const onClearNodeRef = useRef(onClearJustUnlockedNode);
  onClearNodeRef.current = onClearJustUnlockedNode;

  useEffect(() => {
    if (justUnlockedNodeId) {
      const scrollTimer = setTimeout(() => {
        const targetEl = document.getElementById(`node-${justUnlockedNodeId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);

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

    if ((userStats.lives ?? MAX_LIVES) <= 0) {
      audioService.playHeartLostSound();
      setShowNoLivesModal(true);
      return;
    }

    audioService.playClickSound();
    audioService.vibrate(18);

    if (event && node.status !== 'completed') {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      const colors = ['#4648d4', '#818cf8', '#6366f1', '#6cf8bb', '#38bdf8', '#ffffff'];

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
    <div className="pb-6 pt-1 px-4 max-w-lg mx-auto space-y-6 animate-fadeIn">
      {/* Welcome Rotating Greeting Banner */}
      <AcademiaWelcomeBanner
        userName={userStats.name}
        streak={userStats.streak}
        activeVocalRange={activeVocalRange}
        savedRangeData={savedRangeData}
        zenMode={zenMode}
      />

      {/* Units Map Progression */}
      <div className="space-y-12">
        {units.map((unit, index) => (
          <AcademiaUnitCard
            key={unit.id}
            unit={unit}
            index={index}
            zenMode={zenMode}
            animatingUnitId={animatingUnitId}
            waterFillProgress={waterFillProgress}
            isWaterFillComplete={isWaterFillComplete}
            isFirstNodeIlluminated={isFirstNodeIlluminated}
            celebratingNodeId={celebratingNodeId}
            onUnitHeaderClick={handleUnitHeaderClick}
            onNodeClick={handleNodeClick}
          />
        ))}
      </div>

      {/* 0-Lives Gate Modal */}
      <AcademiaNoLivesModal
        isOpen={showNoLivesModal}
        userStats={userStats}
        zenMode={zenMode}
        onClose={() => setShowNoLivesModal(false)}
        onOpenRecoveryExam={onOpenRecoveryExam}
        onOpenStore={onOpenStore}
      />
    </div>
  );
};

export const AcademiaView = React.memo(AcademiaViewComponent);
export default AcademiaView;
