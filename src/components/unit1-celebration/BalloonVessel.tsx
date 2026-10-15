'use client';
import React, { useEffect, useRef } from 'react';

interface BalloonVesselProps {
  isOpen: boolean;
  taps: number;
  isPopped: boolean;
  isWindSweeping: boolean;
  onBalloonClick: () => void;
}

export const BalloonVessel: React.FC<BalloonVesselProps> = ({
  isOpen,
  taps,
  isPopped,
  isWindSweeping,
  onBalloonClick
}) => {
  const balloonRef = useRef<HTMLDivElement | null>(null);
  const stringPathRef = useRef<SVGPathElement | null>(null);
  const tapsRef = useRef<number>(taps);
  const isWindSweepingRef = useRef<boolean>(isWindSweeping);
  const entranceStartTimeRef = useRef<number>(0);

  useEffect(() => {
    tapsRef.current = taps;
  }, [taps]);

  useEffect(() => {
    isWindSweepingRef.current = isWindSweeping;
  }, [isWindSweeping]);

  // Entrance reset
  useEffect(() => {
    if (isOpen) {
      entranceStartTimeRef.current = performance.now();
      if (balloonRef.current) {
        balloonRef.current.style.opacity = '0';
        balloonRef.current.style.transform = 'translate3d(0, 100vh, 0)';
      }
    }
  }, [isOpen]);

  // Direct GPU Physics Engine (Balloon Entrance & Motion)
  useEffect(() => {
    if (!isOpen) return;
    const balloon = balloonRef.current;
    const stringPath = stringPathRef.current;
    if (!balloon) return;

    let animFrameId: number;
    const skyOnlyDelay = 50; // 50ms: Bare minimum sky flash before balloon emerges
    const ascentDuration = 1600; // 1.6s smooth, slower, majestic ascent from bottom to center

    entranceStartTimeRef.current = performance.now();
    const waveFreq = 0.0022;

    const animateBalloon = (now: number) => {
      if (isPopped) return;
      if (isWindSweepingRef.current) {
        balloon.style.opacity = '0';
        return;
      }

      const elapsed = now - entranceStartTimeRef.current;

      if (elapsed < skyOnlyDelay) {
        balloon.style.opacity = '0';
        animFrameId = requestAnimationFrame(animateBalloon);
        return;
      }

      const ascentElapsed = elapsed - skyOnlyDelay;

      // Entrance Vertical Ascent: enters immediately from outside bottom centered
      let translateY = 0;
      let baseScale = 1.0;
      let zIndex = 30;

      if (ascentElapsed < ascentDuration) {
        const p = Math.min(1, ascentElapsed / ascentDuration);
        const easeP = 1 - Math.pow(1 - p, 2.2);

        const startY = Math.round(window.innerHeight * 0.5 + 110);
        translateY = (1 - easeP) * startY;
        baseScale = 0.85 + easeP * 0.15;

        if (p <= 0.35) zIndex = 2;
        else if (p <= 0.7) zIndex = 6;
        else zIndex = 30;
      }

      balloon.style.opacity = '1';

      const currentTaps = tapsRef.current;
      let tapMultiplier = 1.0;
      if (currentTaps === 1) tapMultiplier = 1.25;
      if (currentTaps === 2) tapMultiplier = 1.55;
      if (currentTaps >= 3) tapMultiplier = 1.9;

      const finalScale = baseScale * tapMultiplier;

      let shakeIntensity = 0;
      if (currentTaps === 3) shakeIntensity = 2;
      else if (currentTaps === 4) shakeIntensity = 4;
      else if (currentTaps === 5) shakeIntensity = 7;
      else if (currentTaps === 6) shakeIntensity = 14;

      const shakeX = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity : 0;
      const shakeY = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity : 0;

      const currentAmp = 16;
      const translateX = Math.sin(elapsed * waveFreq) * currentAmp + shakeX;
      const translateYFinal = translateY + shakeY;
      const rotate = Math.cos(elapsed * waveFreq) * (currentAmp * 0.1);

      balloon.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateYFinal.toFixed(2)}px, 0) scale(${finalScale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`;
      balloon.style.zIndex = `${zIndex}`;

      if (stringPath) {
        const t = elapsed * 0.0016;
        const flex1 = Math.sin(t) * 28;
        const flex2 = -Math.sin(t + 0.4) * 26;
        const flex3 = Math.sin(t * 1.2 + 0.8) * 18;

        const d = `M 25 0 C ${25 + flex1} 32, ${25 + flex2} 70, ${25 + flex3} 115`;
        stringPath.setAttribute('d', d);
      }

      animFrameId = requestAnimationFrame(animateBalloon);
    };

    animFrameId = requestAnimationFrame(animateBalloon);

    return () => cancelAnimationFrame(animFrameId);
  }, [isOpen, isPopped]);

  if (isPopped) return null;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        ref={balloonRef}
        onClick={onBalloonClick}
        className="relative flex flex-col items-center justify-center cursor-pointer select-none"
        style={{
          willChange: 'transform, opacity',
          opacity: 0,
          transform: 'translate3d(0, 100vh, 0)',
          filter: 'drop-shadow(0 28px 40px rgba(0, 0, 0, 0.65))'
        }}
      >
        {/* 3D Spherical Shaded Indigo Balloon Body */}
        <div
          className="w-36 h-44 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] bg-gradient-to-tr from-[#818cf8] via-[#4648d4] to-[#12134e] relative overflow-hidden flex items-center justify-center border border-indigo-300/40"
          style={{
            boxShadow: `
              inset -14px -20px 32px rgba(0, 0, 0, 0.8),
              inset 0 0 28px rgba(0, 0, 0, 0.6),
              inset 8px 10px 18px rgba(255, 255, 255, 0.45)
            `
          }}
        >
          {/* Specular Curved Highlights */}
          <div className="absolute top-3 left-4 w-12 h-16 bg-white/45 rounded-full blur-[2px] transform -rotate-25 pointer-events-none" />
          <div className="absolute top-5 left-7 w-4 h-6 bg-white/75 rounded-full blur-[1px] transform -rotate-25 pointer-events-none" />
          <div className="absolute bottom-4 right-5 w-16 h-8 bg-black/40 rounded-full blur-[4px] pointer-events-none" />

          {/* Dark Purple Tree-Root Cracking Overlay */}
          {taps >= 4 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
              viewBox="0 0 144 176"
            >
              <path
                d="M 72 30 L 64 60 L 50 82 L 58 112 L 42 142 M 64 60 L 86 74 L 98 96 M 50 82 L 30 92"
                fill="none"
                stroke="#0a0724"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 72 30 L 64 60 L 50 82 L 58 112 L 42 142 M 64 60 L 86 74 L 98 96 M 50 82 L 30 92"
                fill="none"
                stroke="#181048"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {taps >= 5 && (
                <>
                  <path
                    d="M 94 45 L 84 66 L 104 88 L 90 120 L 108 146 M 84 66 L 70 70 M 104 88 L 118 104"
                    fill="none"
                    stroke="#0a0724"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 94 45 L 84 66 L 104 88 L 90 120 L 108 146 M 84 66 L 70 70 M 104 88 L 118 104"
                    fill="none"
                    stroke="#181048"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {taps >= 6 && (
                <>
                  <path
                    d="M 36 50 L 55 70 L 32 98 L 52 124 M 55 70 L 75 62 M 72 22 L 78 50 M 58 112 L 78 132 L 68 154"
                    fill="none"
                    stroke="#060417"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 36 50 L 55 70 L 32 98 L 52 124 M 55 70 L 75 62 M 72 22 L 78 50 M 58 112 L 78 132 L 68 154"
                    fill="none"
                    stroke="#181048"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
          )}

          {/* Text inside Balloon: UNIDAD 1 + STATIC GUIDE TEXT */}
          <div className="z-10 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white select-none px-2">
            <span className="font-heading font-black text-2xl block leading-none tracking-wider">
              UNIDAD 1
            </span>
            <span className="text-[9px] font-medium block text-indigo-100/90 mt-1.5 leading-tight max-w-[110px] mx-auto">
              toca para explotar
            </span>
          </div>
        </div>

        {/* 3D Indigo Balloon Knot */}
        <div
          className="w-5 h-3 rounded-b-md -mt-0.5 bg-[#1b1c6e] relative shadow-md"
          style={{
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.8), 0 3px 6px rgba(0,0,0,0.6)'
          }}
        />

        {/* Predominant Double S-Curve Dotted String */}
        <svg
          className="w-20 h-32 -mt-0.5 overflow-visible filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
          viewBox="0 0 50 120"
        >
          <path
            ref={stringPathRef}
            d="M 25 0 C 10 32, 40 70, 25 115"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.0"
            strokeDasharray="4 3"
            strokeLinecap="round"
            className="opacity-95"
          />
        </svg>
      </div>
    </div>
  );
};
