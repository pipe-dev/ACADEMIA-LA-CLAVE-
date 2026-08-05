'use client';
import React, { useEffect, useRef } from 'react';
import { audioService } from '../utils/audioService';

interface AudioParticleCanvasProps {
  isTuningActive: boolean;
  detectedPitch: number | null;
  volume: number; // 0 to 1
  isPitchMatched: boolean;
  selectedNoteName: string;
  targetFrequency: number;
  darkMode?: boolean;
  zenMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  baseRadius: number;
  hue: number;
  alpha: number;
  pulseOffset: number;
  sparkle: boolean;
}

export const AudioParticleCanvas: React.FC<AudioParticleCanvasProps> = React.memo(({
  isTuningActive,
  detectedPitch,
  volume,
  isPitchMatched,
  selectedNoteName: _selectedNoteName,
  targetFrequency,
  darkMode = false,
  zenMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep fresh refs for high-frequency props to prevent animation loop restarts
  const propsRef = useRef({
    isTuningActive,
    detectedPitch,
    volume,
    isPitchMatched,
    targetFrequency,
    darkMode,
    zenMode,
  });

  useEffect(() => {
    propsRef.current = {
      isTuningActive,
      detectedPitch,
      volume,
      isPitchMatched,
      targetFrequency,
      darkMode,
      zenMode,
    };
  }, [isTuningActive, detectedPitch, volume, isPitchMatched, targetFrequency, darkMode, zenMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Initialize particles (36 particles for mobile performance)
    const particleCount = 36;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const orbitRadius = 42 + Math.random() * 45;
      particles.push({
        x: 0,
        y: 0,
        angle,
        angularSpeed: (0.006 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1),
        orbitRadius,
        baseRadius: 2 + Math.random() * 2.5,
        hue: 220 + Math.random() * 40,
        alpha: 0.4 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
        sparkle: Math.random() > 0.7,
      });
    }

    const rippleRings: { radius: number; maxRadius: number; alpha: number; hue: number }[] = [];
    let lastRippleTime = 0;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    handleResize();

    let fftBuffer = new Uint8Array(32);

    let smoothVol = 0;
    let smoothHue = 230;

    const render = (timestamp: number) => {
      if (width === 0 || height === 0) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      // Handle HiDPI scaling cleanly on every frame after clearRect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const centerX = width / 2;
      const centerY = height / 2;

      const {
        isTuningActive,
        detectedPitch,
        volume,
        isPitchMatched,
        targetFrequency,
        darkMode,
        zenMode,
      } = propsRef.current;

      // Audio calculations
      const rawVol = isTuningActive ? Math.min(1, volume * 10) : 0;
      smoothVol += (rawVol - smoothVol) * 0.15; // Smooth volume transition

      const analyser = audioService.getAnalyser();
      if (isTuningActive && analyser) {
        if (fftBuffer.length !== analyser.frequencyBinCount) {
          fftBuffer = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(fftBuffer);
      }

      // Calculate Target Hue dynamically based on pitch accuracy (Red -> Yellow -> Green)
      let targetHue = 230; // Default Indigo when idle
      if (isPitchMatched) {
        targetHue = 150; // Emerald Green
      } else if (isTuningActive && detectedPitch && detectedPitch > 40) {
        const diff = Math.abs(detectedPitch - targetFrequency);
        if (diff <= 10) {
          targetHue = 145; // Green
        } else if (diff <= 30) {
          // Close: Interpolate between Amber/Yellow (48°) and Green (145°)
          const factor = (30 - diff) / (30 - 10);
          targetHue = 48 + factor * 97;
        } else if (diff <= 75) {
          // Far: Interpolate between Red (0°) and Amber/Yellow (48°)
          const factor = (75 - diff) / (75 - 30);
          targetHue = 0 + factor * 48;
        } else {
          targetHue = 0; // Pure Red when very off
        }
      } else if (zenMode) {
        targetHue = 38 + Math.sin(timestamp * 0.001) * 8; // Zen warm amber
      }
      smoothHue += (targetHue - smoothHue) * 0.1;

      const isDark = darkMode || document.documentElement.classList.contains('dark');
      const isZen = zenMode || document.documentElement.classList.contains('zen-mode');

      // 1. Central Core Glow
      const glowRadius = 45 + smoothVol * 30 + (isPitchMatched ? 20 : 0);
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        8,
        centerX,
        centerY,
        glowRadius + 25
      );

      if (isPitchMatched) {
        glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        glowGrad.addColorStop(0.6, 'rgba(52, 211, 153, 0.18)');
        glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else if (isZen) {
        glowGrad.addColorStop(0, `hsla(${smoothHue}, 80%, 60%, ${0.15 + smoothVol * 0.3})`);
        glowGrad.addColorStop(0.7, `hsla(${smoothHue}, 70%, 50%, ${0.04 + smoothVol * 0.12})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      } else if (isDark) {
        glowGrad.addColorStop(0, `hsla(${smoothHue}, 90%, 65%, ${0.22 + smoothVol * 0.35})`);
        glowGrad.addColorStop(0.7, `hsla(${smoothHue}, 85%, 55%, ${0.06 + smoothVol * 0.15})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        glowGrad.addColorStop(0, `hsla(${smoothHue}, 85%, 55%, ${0.2 + smoothVol * 0.3})`);
        glowGrad.addColorStop(0.7, `hsla(${smoothHue}, 75%, 45%, ${0.05 + smoothVol * 0.1})`);
        glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius + 25, 0, Math.PI * 2);
      ctx.fill();

      // 2. Wave Rings when mic is active
      if (isTuningActive && smoothVol > 0.03) {
        for (let r = 0; r < 3; r++) {
          const ringR = 46 + r * 16 + Math.sin(timestamp * 0.004 + r * 1.5) * (8 * smoothVol);
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
          ctx.lineWidth = 1.2 + smoothVol * 1.5;
          ctx.strokeStyle = isPitchMatched
            ? `rgba(52, 211, 153, ${0.5 - r * 0.12})`
            : `hsla(${smoothHue}, 80%, 60%, ${0.35 - r * 0.1 + smoothVol * 0.2})`;
          ctx.stroke();
        }
      }

      // 3. Victory shockwaves (throttled)
      if (isPitchMatched && timestamp - lastRippleTime > 350) {
        lastRippleTime = timestamp;
        rippleRings.push({
          radius: 35,
          maxRadius: Math.min(width, height) * 0.5,
          alpha: 0.75,
          hue: isZen ? 42 : 150,
        });
      }

      for (let i = rippleRings.length - 1; i >= 0; i--) {
        const ring = rippleRings[i];
        ring.radius += 2.8;
        ring.alpha -= 0.018;
        if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
          rippleRings.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.strokeStyle = `hsla(${ring.hue}, 85%, 60%, ${ring.alpha})`;
          ctx.stroke();
        }
      }

      // 4. Update and Render Particles
      const speedMultiplier = isPitchMatched ? 2.0 : 1 + smoothVol * 2.2;

      particles.forEach((p, idx) => {
        p.angle += p.angularSpeed * speedMultiplier;

        // FFT frequency reactive bounce
        let fftBoost = 0;
        if (fftBuffer.length > 0) {
          const bin = idx % Math.min(16, fftBuffer.length);
          fftBoost = (fftBuffer[bin] / 255) * 18 * (smoothVol + 0.2);
        }

        const targetOrbit = p.orbitRadius + smoothVol * 25 + fftBoost + (isPitchMatched ? Math.sin(p.angle * 3) * 10 : 0);
        const targetX = centerX + Math.cos(p.angle) * targetOrbit;
        const targetY = centerY + Math.sin(p.angle) * targetOrbit;

        p.x += (targetX - p.x) * 0.15;
        p.y += (targetY - p.y) * 0.15;

        // Color interpolation
        p.hue += (smoothHue - p.hue) * 0.08;

        const pulse = Math.sin(timestamp * 0.003 + p.pulseOffset) * 0.8;
        const r = Math.max(1, p.baseRadius + smoothVol * 2 + pulse + (isPitchMatched ? 1 : 0));

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

        const pSat = isZen ? 75 : 85;
        const pLight = isZen ? 65 : isDark ? 65 : 52;
        const pAlpha = Math.min(1, p.alpha + smoothVol * 0.4 + (isPitchMatched ? 0.3 : 0));

        ctx.fillStyle = `hsla(${p.hue}, ${pSat}%, ${pLight}%, ${pAlpha})`;
        ctx.fill();
      });

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden rounded-2xl">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
});
