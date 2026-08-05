'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audioService';
import { triggerHapticFeedback } from '../utils/pwaFeatures';

interface StreakFlameViewProps {
  currentStreak: number;
  onBack?: () => void;
  onStreakUpdate?: (newStreak: number) => void;
}

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  symbol?: string;
  rotation?: number;
  vRot?: number;
}

export const StreakFlameView: React.FC<StreakFlameViewProps> = ({
  currentStreak,
  onBack,
  onStreakUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dragProgress, setDragProgress] = useState<number>(0); // 0 to 1
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isIgnited, setIsIgnited] = useState<boolean>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.setItem ? localStorage.getItem('laclave_last_streak_date') === today : false;
    } catch {
      return false;
    }
  });

  const [displayStreak, setDisplayStreak] = useState<number>(currentStreak);

  const dragProgressRef = useRef<number>(0);
  const isIgnitedRef = useRef<boolean>(isIgnited);
  const displayStreakRef = useRef<number>(displayStreak);
  const startYRef = useRef<number>(0);
  const currentTouchYRef = useRef<number>(0);
  const lastSoundTimeRef = useRef<number>(0);
  const particlesRef = useRef<FlameParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    isIgnitedRef.current = isIgnited;
  }, [isIgnited]);

  const prevDisplayStreakRef = useRef<number>(displayStreak);

  useEffect(() => {
    if (prevDisplayStreakRef.current !== displayStreak) {
      // High-intensity haptic pattern when streak number updates
      triggerHapticFeedback('streak-update');
      prevDisplayStreakRef.current = displayStreak;
    }
    displayStreakRef.current = displayStreak;
  }, [displayStreak]);

  // Complete Ignition Trigger
  const handleIgniteComplete = useCallback(() => {
    if (isIgnited) return;

    const newStreak = currentStreak + 1;
    setIsIgnited(true);
    setIsDragging(false);
    dragProgressRef.current = 1;
    setDragProgress(1);
    setDisplayStreak(newStreak);

    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('laclave_last_streak_date', today);
    } catch {}

    audioService.playStreakIgnitionSound();
    triggerHapticFeedback('streak-update');

    try {
      if (typeof window !== 'undefined' && confetti) {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.55 },
          colors: ['#ff4500', '#ffa500', '#ffd700', '#4648d4', '#10b981']
        });
      }
    } catch (err) {
      console.warn('[Confetti] Ignored error:', err);
    }

    if (onStreakUpdate) {
      onStreakUpdate(newStreak);
    }
  }, [currentStreak, isIgnited, onStreakUpdate]);

  // 2D Flame & Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let lastWidth = 0;
    let lastHeight = 0;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : (container.clientWidth || window.innerWidth);
      const height = rect.height > 0 ? rect.height : (container.clientHeight || (window.innerHeight - 120));
      if (width <= 0 || height <= 0) return;

      if (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2) {
        lastWidth = width;
        lastHeight = height;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', updateCanvasSize);

    let startTime = performance.now();

    const render = (nowTime: number) => {
      const elapsed = (nowTime - startTime) / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      const prog = dragProgressRef.current;
      const ignited = isIgnitedRef.current;
      const intensity = ignited ? 1.0 : prog;

      const centerX = width / 2;
      const flameHeight = (190 + intensity * 150) * Math.min(1.35, Math.max(0.75, height / 450));
      const flameWidth = (110 + intensity * 60) * Math.min(1.35, Math.max(0.75, width / 400));
      const baseY = height * 0.50 + flameHeight * 0.38;

      // --- 1. Floating Soft Base Glow ---
      const baseGrad = ctx.createRadialGradient(centerX, baseY, 5, centerX, baseY, flameWidth * 1.6);
      baseGrad.addColorStop(0, ignited ? 'rgba(255, 140, 0, 0.3)' : `rgba(255, 100, 0, ${0.05 + intensity * 0.18})`);
      baseGrad.addColorStop(0.5, ignited ? 'rgba(255, 100, 0, 0.12)' : `rgba(255, 80, 0, ${0.02 + intensity * 0.08})`);
      baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, baseY, flameWidth * 1.4, flameWidth * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- 2. Multi-layer Organic 2D Flame Shapes ---
      const drawFlameLayer = (
        colorStops: Array<[number, string]>,
        widthFactor: number,
        heightFactor: number,
        waveSpeed: number
      ) => {
        const topY = baseY - flameHeight * heightFactor;
        const bottomY = baseY + flameHeight * 0.12 * heightFactor;
        const w = flameWidth * widthFactor;

        const cp1x = centerX - w + Math.sin(elapsed * waveSpeed) * 14 * (0.4 + intensity * 0.6);
        const cp1y = baseY - flameHeight * heightFactor * 0.4;

        const cp2x = centerX - w * 0.3 + Math.sin(elapsed * waveSpeed * 1.3 + 1) * 16 * (0.4 + intensity * 0.6);
        const cp2y = baseY - flameHeight * heightFactor * 0.8;

        const cp3x = centerX + w * 0.3 + Math.cos(elapsed * waveSpeed * 1.2 + 2) * 16 * (0.4 + intensity * 0.6);
        const cp3y = baseY - flameHeight * heightFactor * 0.8;

        const cp4x = centerX + w + Math.cos(elapsed * waveSpeed + 3) * 14 * (0.4 + intensity * 0.6);
        const cp4y = baseY - flameHeight * heightFactor * 0.4;

        const grad = ctx.createLinearGradient(centerX, bottomY, centerX, topY);
        for (let i = 0; i < colorStops.length; i++) {
          grad.addColorStop(colorStops[i][0], colorStops[i][1]);
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(centerX - w * 0.8, baseY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, centerX + Math.sin(elapsed * 4) * 6, topY);
        ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, centerX + w * 0.8, baseY);
        // Soft rounded bottom base curve instead of a flat horizontal line
        ctx.quadraticCurveTo(centerX, bottomY, centerX - w * 0.8, baseY);
        ctx.closePath();
        ctx.fill();
      };

      ctx.globalCompositeOperation = 'lighter';

      // Layer 1: Outer Red/Orange Glow (Feathered base and tip)
      drawFlameLayer(
        [
          [0.0, 'rgba(255, 40, 0, 0.0)'],
          [0.15, 'rgba(255, 40, 0, 0.75)'],
          [0.6, 'rgba(255, 90, 0, 0.55)'],
          [1.0, 'rgba(255, 160, 0, 0.0)']
        ],
        1.1,
        1.0,
        3.2
      );

      // Layer 2: Mid Golden Yellow Flame
      drawFlameLayer(
        [
          [0.0, 'rgba(255, 120, 0, 0.0)'],
          [0.15, 'rgba(255, 120, 0, 0.85)'],
          [0.55, 'rgba(255, 200, 0, 0.8)'],
          [1.0, 'rgba(255, 240, 150, 0.0)']
        ],
        0.75,
        0.82,
        4.0
      );

      // Layer 3: Inner White Core
      drawFlameLayer(
        [
          [0.0, 'rgba(255, 255, 255, 0.0)'],
          [0.12, 'rgba(255, 255, 255, 0.95)'],
          [0.6, 'rgba(255, 235, 180, 0.85)'],
          [1.0, 'rgba(255, 255, 255, 0.0)']
        ],
        0.42,
        0.58,
        5.2
      );

      ctx.globalCompositeOperation = 'source-over';

      // --- Draw streak number in brown inside central core ---
      const streakNum = displayStreakRef.current;
      const numFontSize = Math.max(48, Math.min(92, Math.round(flameWidth * 0.52)));
      const numberY = baseY - flameHeight * 0.28;

      const textWaveX = Math.sin(elapsed * 2.2) * (1.5 + intensity * 2) + Math.sin(elapsed * 1.1) * 1;
      const textWaveY = Math.cos(elapsed * 1.8) * (1 + intensity * 1);
      const textSkewX = Math.sin(elapsed * 2.0) * (0.02 + intensity * 0.02);
      const textScaleY = 1 + Math.sin(elapsed * 2.4) * 0.02;

      ctx.save();
      ctx.translate(centerX + textWaveX, numberY + textWaveY);
      ctx.transform(1, 0, textSkewX, textScaleY, 0, 0);
      ctx.font = `900 ${numFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5c2406';
      ctx.fillText(String(streakNum), 0, 0);
      ctx.restore();

      // --- 3. Optimized Particle Physics System ---
      const particles = particlesRef.current;
      const maxParticles = 35;

      // Spawn capped ember particles
      if (particles.length < maxParticles) {
        const spawnCount = ignited ? 2 : Math.random() < prog * 2 ? 1 : 0;
        for (let i = 0; i < spawnCount && particles.length < maxParticles; i++) {
          particles.push({
            x: centerX + (Math.random() - 0.5) * flameWidth * 0.7,
            y: baseY - Math.random() * 15,
            vx: (Math.random() - 0.5) * (1.2 + intensity * 1.5),
            vy: - (1.5 + Math.random() * 2 + intensity * 2),
            radius: 2 + Math.random() * (2.5 + intensity * 1.5),
            color: Math.random() > 0.4 ? '#ffd700' : Math.random() > 0.5 ? '#ff4500' : '#ffffff',
            alpha: 0.9,
            life: 0,
            maxLife: 30 + Math.random() * 25
          });
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + Math.sin(elapsed * 4 + i) * 0.4;
        p.y += p.vy;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife || p.y < 0) {
          particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Pointer Swipe Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    currentTouchYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (!isIgnited) {
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    currentTouchYRef.current = e.clientY;

    if (!isDragging || isIgnited) return;
    const deltaY = startYRef.current - e.clientY;
    const targetDistance = 140;
    const progress = Math.min(1, Math.max(0, deltaY / targetDistance));

    // Update ref immediately for 60fps canvas loop without heavy React re-renders
    dragProgressRef.current = progress;

    // Throttle React state updates for UI badge
    if (Math.abs(progress - dragProgress) > 0.04 || progress === 1 || progress === 0) {
      setDragProgress(progress);
    }

    // Audio pitch feedback
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 120 && progress > 0.05) {
      lastSoundTimeRef.current = now;
      audioService.playFlameSwellSound(progress);
    }

    if (progress >= 0.98) {
      handleIgniteComplete();
    }
  };

  const handlePointerUp = () => {
    if (isIgnited) return;
    setIsDragging(false);
    currentTouchYRef.current = 0;
    if (dragProgressRef.current < 0.98) {
      dragProgressRef.current = 0;
      setDragProgress(0);
    }
  };

  // Lock body scrolling while flame screen is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-[#f8faff] dark:bg-[#0a121e] text-[#0b1c30] dark:text-[#d3e4fe] flex flex-col justify-between overflow-hidden touch-none overscroll-none select-none p-4 pb-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      {/* Header with Back Button */}
      <div className="z-50 flex items-center justify-between pointer-events-none pt-2 px-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            audioService.playCloseSound();
            if (onBack) onBack();
          }}
          className="pointer-events-auto p-3 rounded-full bg-white/95 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-md transition-all active:scale-95"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main 2D Canvas Interactive Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="flex-1 w-full max-w-xl mx-auto flex flex-col items-center justify-center relative touch-none select-none cursor-grab active:cursor-grabbing overflow-hidden my-auto"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full relative z-10 pointer-events-none"
        />

        {/* Interactive Swipe Guidance Overlay & Hint */}
        {!isIgnited ? (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5"
          >
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-amber-400 dark:border-amber-500/50 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 shadow-xl whitespace-nowrap">
              <ChevronUp className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Desliza ↑ sobre la llama ({Math.round(dragProgress * 100)}%)</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5"
          >
            <div className="bg-[#380b03]/90 dark:bg-[#280702]/95 backdrop-blur-md border border-[#852107]/80 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#ffd3ba] dark:text-[#ffcbb0] shadow-xl whitespace-nowrap">
              <span>¡Racha Encendida Hoy!</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StreakFlameView;



