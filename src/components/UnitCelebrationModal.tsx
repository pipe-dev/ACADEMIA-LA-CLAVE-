'use client';
import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audioService';

interface UnitCelebrationModalProps {
  isOpen: boolean;
  onContinueToUnit2: () => void;
}

export const UnitCelebrationModal: React.FC<UnitCelebrationModalProps> = ({
  isOpen,
  onContinueToUnit2
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const balloonRef = useRef<HTMLDivElement | null>(null);
  const stringPathRef = useRef<SVGPathElement | null>(null);

  const [taps, setTaps] = useState<number>(0);
  const tapsRef = useRef<number>(0);

  const [isPopped, setIsPopped] = useState<boolean>(false);
  const [showUnit2Button, setShowUnit2Button] = useState<boolean>(false);
  const [isWindSweeping, setIsWindSweeping] = useState<boolean>(false);
  const isWindSweepingRef = useRef<boolean>(false);

  useEffect(() => {
    tapsRef.current = taps;
  }, [taps]);

  useEffect(() => {
    isWindSweepingRef.current = isWindSweeping;
  }, [isWindSweeping]);

  // Guaranteed clean state reset every time celebration modal opens
  useEffect(() => {
    if (isOpen) {
      setTaps(0);
      tapsRef.current = 0;
      setIsPopped(false);
      setShowUnit2Button(false);
      setIsWindSweeping(false);
      isWindSweepingRef.current = false;
      entranceStartTimeRef.current = performance.now();
      if (balloonRef.current) {
        balloonRef.current.style.opacity = '0';
        balloonRef.current.style.transform = 'translate3d(0, 100vh, 0)';
      }
    }
  }, [isOpen]);

  const entranceStartTimeRef = useRef<number>(0);
  const cloudSpeed = 1.0;
  const cloudCount = 19;

  // Handle Balloon Tap Interaction
  const handleBalloonClick = () => {
    if (isPopped || taps >= 6 || isWindSweeping) return;

    const nextTap = taps + 1;
    setTaps(nextTap);

    if (nextTap <= 3) {
      audioService.playRubberStretchSound(nextTap);
    } else if (nextTap === 4) {
      audioService.playDryExplosionPopSound(1);
    } else if (nextTap === 5) {
      audioService.playDryExplosionPopSound(2);
    } else if (nextTap === 6) {
      audioService.playRubberStrainOverloadSound();

      setTimeout(() => {
        audioService.playDryExplosionPopSound(3);
        setIsPopped(true);
        triggerBackgroundConfettiBurst();

        setTimeout(() => {
          setShowUnit2Button(true);
        }, 450);
      }, 420);
    }
  };

  // Handle Continuar a la Unidad 2 Click (Wind Sweep Transition)
  const handleContinueClick = () => {
    if (isWindSweeping) return;
    setIsWindSweeping(true);
    audioService.playWindWhooshSound();

    setTimeout(() => {
      onContinueToUnit2();
    }, 750);
  };

  // Background Confetti Burst
  const triggerBackgroundConfettiBurst = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    confetti({
      particleCount: 120,
      spread: 360,
      startVelocity: 45,
      ticks: 300,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.45 },
      colors: ['#4648d4', '#818cf8', '#fbbf24', '#f59e0b', '#ec4899', '#22c55e', '#ffffff']
    });

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 25,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: ['#4648d4', '#818cf8', '#fbbf24', '#f59e0b', '#ec4899', '#22c55e', '#ffffff']
      });
      confetti({
        particleCount: 25,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ['#4648d4', '#818cf8', '#fbbf24', '#f59e0b', '#ec4899', '#22c55e', '#ffffff']
      });
    }, 250);
  };

  // Confetti Wall Canvas Engine
  useEffect(() => {
    if (!isOpen || !isPopped) return;

    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface ConfettiPiece {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      size: number;
      color: string;
      rotation: number;
      rotSpeed: number;
      vx: number;
      vy: number;
      settled: boolean;
      wobblePhase: number;
    }

    const colors = [
      '#4648d4', '#818cf8', '#fbbf24', '#f59e0b', '#ec4899', 
      '#22c55e', '#ffffff', '#a855f7', '#06b6d4', '#ef4444', '#eab308'
    ];
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < 3400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 28 + 6;
      const floorWeight = Math.sqrt(Math.random());
      const targetY = height * 0.62 + floorWeight * (height * 0.38);
      const targetX = Math.random() * width;

      pieces.push({
        x: width * 0.5,
        y: height * 0.45,
        targetX,
        targetY,
        size: Math.random() * 11 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        settled: false,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    let time = 0;
    const renderConfetti = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.03;

      const sweeping = isWindSweepingRef.current;

      pieces.forEach((p) => {
        if (sweeping) {
          // Wind gust sweeps confetti pieces off-screen to the right
          p.vx += 1.8;
          p.x += p.vx;
          p.y -= 1.2;
          p.rotation += 15;
        } else if (!p.settled) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95;
          p.vy = p.vy * 0.95 + 0.42;
          p.rotation += p.rotSpeed;

          if (p.y >= p.targetY) {
            p.y = p.targetY;
            p.settled = true;
          }
        } else {
          p.rotation += Math.sin(time + p.wobblePhase) * 0.4;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 3;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
        ctx.restore();
      });

      animFrameId = requestAnimationFrame(renderConfetti);
    };

    renderConfetti();

    return () => cancelAnimationFrame(animFrameId);
  }, [isOpen, isPopped]);

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
        const p = Math.min(1, ascentElapsed / ascentDuration); // 0 to 1
        // Smooth ease-out curve for gentle, majestic float upward into center
        const easeP = 1 - Math.pow(1 - p, 2.2);

        // Starts with top of balloon just touching the bottom edge of viewport
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

  // 2D Cloud Engine
  useEffect(() => {
    if (!isOpen) return;
    const bgCanvas = canvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    if (!bgCanvas || !fgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');
    if (!bgCtx || !fgCtx) return;

    let animFrameId: number;
    let width = (bgCanvas.width = fgCanvas.width = window.innerWidth);
    let height = (bgCanvas.height = fgCanvas.height = window.innerHeight);

    const handleResize = () => {
      if (!bgCanvas || !fgCanvas) return;
      width = bgCanvas.width = fgCanvas.width = window.innerWidth;
      height = bgCanvas.height = fgCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw2DCartoonCloud = (c: CanvasRenderingContext2D, x: number, y: number, scale: number, fillStyle: string, shadowColor: string, opacity: number = 1.0) => {
      c.save();
      c.translate(x, y);
      c.scale(scale, scale);
      c.globalAlpha = opacity;

      if (shadowColor && shadowColor !== 'transparent') {
        c.shadowColor = shadowColor;
        c.shadowOffsetY = 4;
        c.shadowBlur = 8;
      } else {
        c.shadowColor = 'transparent';
        c.shadowBlur = 0;
        c.shadowOffsetY = 0;
      }

      c.fillStyle = fillStyle;
      c.beginPath();

      c.arc(0, 0, 32, Math.PI * 0.5, Math.PI * 1.5);
      c.arc(28, -22, 38, Math.PI * 1.0, Math.PI * 1.85);
      c.arc(75, -28, 44, Math.PI * 1.15, Math.PI * 1.95);
      c.arc(122, -18, 36, Math.PI * 1.25, Math.PI * 2.0);
      c.arc(148, 4, 30, Math.PI * 1.6, Math.PI * 0.5);

      c.lineTo(-32, 32);
      c.closePath();
      c.fill();

      c.shadowColor = 'transparent';
      c.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c.beginPath();
      c.arc(75, -28, 40, Math.PI * 1.2, Math.PI * 1.8);
      c.fill();

      c.restore();
    };

    interface RisingTextureParticle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      isDarkTone: boolean;
    }

    interface CartoonCloud {
      x: number;
      y: number;
      scale: number;
      speed: number;
      opacity: number;
      color: string;
      shadowColor: string;
      category: 'cluster' | 'solo_main' | 'solo_mini';
      satellites: { offsetX: number; offsetY: number; scale: number }[];
    }

    interface ForegroundCloud {
      x: number;
      y: number;
      scale: number;
      speed: number;
      color: string;
      targetArea: 'balloon_body' | 'balloon_string';
    }

    const getRandomParticleTone = (): { color: string; isDarkTone: boolean } => {
      const isDark = Math.random() > 0.72;
      if (!isDark) {
        const whiteTones = ['#ffffff', '#fffdf5', '#fef9c3', '#fef08a'];
        return { color: whiteTones[Math.floor(Math.random() * whiteTones.length)], isDarkTone: false };
      } else {
        const darkTones = ['#c28528', '#c88c2a', '#a16207', '#92400e', '#78350f'];
        return { color: darkTones[Math.floor(Math.random() * darkTones.length)], isDarkTone: true };
      }
    };

    const createRandomCloud = (initialX?: number): CartoonCloud => {
      const colors = ['#ffffff', '#fffdf5', '#fef9c3'];
      const randType = Math.random();

      let category: 'cluster' | 'solo_main' | 'solo_mini' = 'cluster';
      let scale = 1;
      let satellites: { offsetX: number; offsetY: number; scale: number }[] = [];

      if (randType < 0.45) {
        category = 'cluster';
        scale = Math.random() * 0.5 + 0.6;
        const count = Math.floor(Math.random() * 3) + 1;
        for (let s = 0; s < count; s++) {
          satellites.push({
            offsetX: (Math.random() - 0.5) * 160 + 90,
            offsetY: (Math.random() - 0.5) * 40 + 10,
            scale: Math.random() * 0.35 + 0.25
          });
        }
      } else if (randType < 0.75) {
        category = 'solo_main';
        scale = Math.random() * 0.45 + 0.55;
        satellites = [];
      } else {
        category = 'solo_mini';
        scale = Math.random() * 0.25 + 0.25;
        satellites = [];
      }

      return {
        x: initialX !== undefined ? initialX : -300,
        y: Math.random() * (height * 0.85),
        scale,
        speed: (Math.random() * 0.4 + 0.3) * cloudSpeed,
        opacity: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        shadowColor: '#c88c2a',
        category,
        satellites
      };
    };

    const createForegroundCloud = (targetArea: 'balloon_body' | 'balloon_string', initialX?: number): ForegroundCloud => {
      const centerY = height * 0.5;
      const colors = ['#ffffff', '#fffdf5', '#fef9c3'];

      const scale = targetArea === 'balloon_body' 
        ? Math.random() * 0.15 + 0.28
        : Math.random() * 0.25 + 0.60;

      const yOffset = targetArea === 'balloon_body'
        ? (Math.random() - 0.5) * 100 - 30
        : Math.random() * 100 + 70;

      return {
        x: initialX !== undefined ? initialX : -300 - Math.random() * 400,
        y: centerY + yOffset,
        scale,
        speed: (Math.random() * 0.35 + 0.35) * cloudSpeed,
        color: colors[Math.floor(Math.random() * colors.length)],
        targetArea
      };
    };

    const bgTextureParticles: RisingTextureParticle[] = [];
    for (let f = 0; f < 55; f++) {
      const tone = getRandomParticleTone();
      bgTextureParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 7 + 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: - (Math.random() * 0.8 + 0.3) * cloudSpeed,
        alpha: tone.isDarkTone ? Math.random() * 0.35 + 0.2 : Math.random() * 0.3 + 0.15,
        color: tone.color,
        isDarkTone: tone.isDarkTone
      });
    }

    let bgClouds: CartoonCloud[] = [];
    for (let i = 0; i < cloudCount; i++) {
      bgClouds.push(createRandomCloud(Math.random() * (width + 400) - 200));
    }

    let fgClouds: ForegroundCloud[] = [
      createForegroundCloud('balloon_body', Math.random() * width),
      createForegroundCloud('balloon_body', Math.random() * width + 450),
      createForegroundCloud('balloon_string', Math.random() * width),
      createForegroundCloud('balloon_string', Math.random() * width + 550)
    ];

    const render = () => {
      bgCtx.clearRect(0, 0, width, height);
      fgCtx.clearRect(0, 0, width, height);

      // Sky Gradient
      const skyGrad = bgCtx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#fbbf24');
      skyGrad.addColorStop(0.55, '#f59e0b');
      skyGrad.addColorStop(1, '#d97706');
      bgCtx.fillStyle = skyGrad;
      bgCtx.fillRect(0, 0, width, height);

      // Deep Background Texture Particles
      bgTextureParticles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy * cloudSpeed;

        if (pt.y < -20) {
          pt.y = height + 20;
          pt.x = Math.random() * width;
          const newTone = getRandomParticleTone();
          pt.color = newTone.color;
          pt.isDarkTone = newTone.isDarkTone;
        }
        if (pt.x < -20) pt.x = width + 20;
        if (pt.x > width + 20) pt.x = -20;

        bgCtx.save();
        bgCtx.fillStyle = pt.color;
        bgCtx.globalAlpha = pt.alpha;
        bgCtx.shadowColor = pt.isDarkTone ? '#78350f' : '#c88c2a';
        bgCtx.shadowBlur = pt.isDarkTone ? 6 : 4;
        bgCtx.beginPath();
        bgCtx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
      });

      // Background Clouds
      bgClouds.forEach((cloud, index) => {
        cloud.x += cloud.speed;

        if (cloud.x > width + 300) {
          bgClouds[index] = createRandomCloud();
          return;
        }

        draw2DCartoonCloud(bgCtx, cloud.x, cloud.y, cloud.scale, cloud.color, '#c88c2a', 1.0);

        if (cloud.category === 'cluster' && cloud.satellites.length > 0) {
          cloud.satellites.forEach((sat) => {
            draw2DCartoonCloud(
              bgCtx,
              cloud.x + sat.offsetX * cloud.scale,
              cloud.y + sat.offsetY * cloud.scale,
              cloud.scale * sat.scale,
              cloud.color,
              '#c88c2a',
              1.0
            );
          });
        }
      });

      // Foreground Solid Clouds (NO GLOW)
      fgClouds.forEach((cloud, index) => {
        cloud.x += cloud.speed;

        if (cloud.x > width + 300) {
          fgClouds[index] = createForegroundCloud(cloud.targetArea);
          return;
        }

        draw2DCartoonCloud(fgCtx, cloud.x, cloud.y, cloud.scale, cloud.color, 'transparent', 1.0);
      });

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] w-screen h-screen overflow-hidden select-none bg-[#f59e0b] flex flex-col items-center justify-center p-6 transition-opacity duration-700 ${
        isWindSweeping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Canvas Engine (z-index 0) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Foreground Canvas Overlay Engine (z-index 15) */}
      <canvas ref={fgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-15" />

      {/* Persistent Solid Floor Confetti Block Canvas (z-index 20 - BEHIND BUTTON) */}
      <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

      {/* Centerpiece Area: Balloon / Unit 2 Button (z-index 50) */}
      <div className="relative z-50 flex flex-col items-center justify-center text-center my-auto w-full max-w-md pointer-events-auto">
        
        {/* BALLOON CONTAINER (Only visible while NOT popped) */}
        {!isPopped ? (
          <div className="relative flex flex-col items-center justify-center">
            <div
              ref={balloonRef}
              onClick={handleBalloonClick}
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

                {/* Text inside Balloon: UNIDAD 1 + STATIC GUIDE TEXT "toca para explotar" */}
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
              <svg className="w-20 h-32 -mt-0.5 overflow-visible filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" viewBox="0 0 50 120">
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
        ) : (
          /* Unit 2 Container Button (z-index 50) */
          showUnit2Button && (
            <div className="relative z-50 animate-bounce-subtle flex flex-col items-center justify-center w-full max-w-sm px-4">
              <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800">
                <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
                  <button
                    onClick={handleContinueClick}
                    className="w-full flex items-center justify-center px-6 py-3.5 rounded-full transition-all duration-75 relative border border-transparent btn-3d bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center gap-0.5">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-200 drop-shadow-sm leading-tight">
                        UNIDAD 2
                      </span>
                      <span className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                        CONTINUAR A LA UNIDAD 2
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
};
