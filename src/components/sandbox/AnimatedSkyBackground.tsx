'use client';

import React, { useEffect, useRef } from 'react';

export type SkyTheme = 'unit4' | 'unit1';

interface AnimatedSkyBackgroundProps {
  theme?: SkyTheme;
  cloudSpeed?: number;
  className?: string;
  dynamicDayCycle?: boolean;
  cycleDuration?: number; // Duracion por fase en segundos (default: 5.0)
}

type RGB = [number, number, number];

interface SkyPalette {
  top: RGB;
  mid: RGB;
  bottom: RGB;
  shadow: string;
}

interface CartoonCloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
  color: string;
  category: 'cluster' | 'solo_main' | 'solo_mini';
  satellites: { offsetX: number; offsetY: number; scale: number }[];
}

interface ForegroundCloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  color: string;
}

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

// Helpers matemáticos para generación randomizada y lerp suave
function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function getRandomDayPalette(): SkyPalette {
  return {
    top: [randomBetween(45, 68), randomBetween(70, 95), randomBetween(210, 240)],
    mid: [randomBetween(80, 110), randomBetween(115, 145), randomBetween(235, 255)],
    bottom: [randomBetween(50, 110), randomBetween(180, 215), randomBetween(245, 255)],
    shadow: '#5b5fce',
  };
}

function getRandomSunsetPalette(): SkyPalette {
  const variant = Math.random();
  if (variant < 0.5) {
    // Dorado coral
    return {
      top: [randomBetween(130, 165), randomBetween(45, 75), randomBetween(155, 195)],
      mid: [randomBetween(240, 255), randomBetween(95, 130), randomBetween(40, 75)],
      bottom: [randomBetween(250, 255), randomBetween(190, 225), randomBetween(70, 120)],
      shadow: '#9d348a',
    };
  } else {
    // Magenta crepuscular y ámbar
    return {
      top: [randomBetween(100, 140), randomBetween(35, 65), randomBetween(170, 210)],
      mid: [randomBetween(225, 255), randomBetween(75, 115), randomBetween(70, 110)],
      bottom: [randomBetween(250, 255), randomBetween(165, 205), randomBetween(90, 140)],
      shadow: '#7e22ce',
    };
  }
}

function getRandomNightPalette(): SkyPalette {
  const variant = Math.random();
  if (variant < 0.5) {
    // Azul medianoche profundo
    return {
      top: [randomBetween(8, 16), randomBetween(10, 20), randomBetween(38, 52)],
      mid: [randomBetween(20, 32), randomBetween(24, 38), randomBetween(65, 88)],
      bottom: [randomBetween(40, 65), randomBetween(35, 58), randomBetween(95, 130)],
      shadow: '#1e1b4b',
    };
  } else {
    // Índigo cósmico oscuro
    return {
      top: [randomBetween(12, 22), randomBetween(8, 16), randomBetween(42, 60)],
      mid: [randomBetween(28, 42), randomBetween(20, 32), randomBetween(75, 105)],
      bottom: [randomBetween(55, 80), randomBetween(35, 60), randomBetween(105, 145)],
      shadow: '#2e1065',
    };
  }
}

function getRandomDawnPalette(): SkyPalette {
  return {
    top: [randomBetween(65, 95), randomBetween(80, 115), randomBetween(195, 225)],
    mid: [randomBetween(210, 240), randomBetween(140, 175), randomBetween(180, 220)],
    bottom: [randomBetween(125, 165), randomBetween(205, 235), randomBetween(240, 255)],
    shadow: '#6366f1',
  };
}

function getPhasePalette(phase: number): SkyPalette {
  switch (phase % 4) {
    case 0:
      return getRandomDayPalette();
    case 1:
      return getRandomSunsetPalette();
    case 2:
      return getRandomNightPalette();
    case 3:
      return getRandomDawnPalette();
    default:
      return getRandomDayPalette();
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRGB(c1: RGB, c2: RGB, t: number): RGB {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function rgbToString(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export const AnimatedSkyBackground: React.FC<AnimatedSkyBackgroundProps> = ({
  theme = 'unit4',
  cloudSpeed = 1.0,
  className = '',
  dynamicDayCycle = true,
  cycleDuration = 5.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isUnit4 = theme === 'unit4';

    // Paletas de sombras y tonos según la unidad seleccionada
    const shadowColor = isUnit4 ? '#5b5fce' : '#c88c2a';
    const darkParticleTones = isUnit4
      ? ['#8b8ff0', '#818cf8', '#6366f1', '#4f52e6', '#383aba']
      : ['#c28528', '#c88c2a', '#a16207', '#92400e', '#78350f'];

    // Pre-renderizado de nubes offscreen para máximo rendimiento (60 fps sin lag)
    const cloudSprites = new Map<string, HTMLCanvasElement>();
    const SPRITE_W = 320;
    const SPRITE_H = 220;
    const SPRITE_OX = 70;
    const SPRITE_OY = 110;

    const getCloudSprite = (color: string, withShadow: boolean): HTMLCanvasElement => {
      const key = `${color}_${withShadow}_${theme}`;
      const existing = cloudSprites.get(key);
      if (existing) return existing;

      const c = document.createElement('canvas');
      c.width = SPRITE_W;
      c.height = SPRITE_H;
      const sCtx = c.getContext('2d');
      if (!sCtx) return c;

      sCtx.save();
      sCtx.translate(SPRITE_OX, SPRITE_OY);

      if (withShadow) {
        sCtx.shadowColor = shadowColor;
        sCtx.shadowOffsetY = 4;
        sCtx.shadowBlur = 8;
      }

      sCtx.fillStyle = color;
      sCtx.beginPath();
      sCtx.arc(0, 0, 32, Math.PI * 0.5, Math.PI * 1.5);
      sCtx.arc(28, -22, 38, Math.PI * 1.0, Math.PI * 1.85);
      sCtx.arc(75, -28, 44, Math.PI * 1.15, Math.PI * 1.95);
      sCtx.arc(122, -18, 36, Math.PI * 1.25, Math.PI * 2.0);
      sCtx.arc(148, 4, 30, Math.PI * 1.6, Math.PI * 0.5);
      sCtx.lineTo(-32, 32);
      sCtx.closePath();
      sCtx.fill();

      sCtx.shadowColor = 'transparent';
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      sCtx.beginPath();
      sCtx.arc(75, -28, 40, Math.PI * 1.2, Math.PI * 1.8);
      sCtx.fill();

      sCtx.restore();
      cloudSprites.set(key, c);
      return c;
    };

    const baseColors = ['#ffffff', '#fffdf5', '#fef9c3'];
    baseColors.forEach((col) => {
      getCloudSprite(col, true);
      getCloudSprite(col, false);
    });

    let cloudCount = 10;
    let targetCount = cloudCount;
    let changeTimer = 4;
    let lastRender = 0;
    let skyGradCache: CanvasGradient | null = null;

    // Estado del ciclo de día dinámico
    let currentPhase = 0; // 0: Día, 1: Atardecer, 2: Noche, 3: Amanecer
    let currentFrom: SkyPalette = getRandomDayPalette();
    let currentTo: SkyPalette = getRandomSunsetPalette();
    let cycleTimer = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      skyGradCache = null;
    };
    window.addEventListener('resize', handleResize);

    const getRandomParticleTone = (): { color: string; isDarkTone: boolean } => {
      const isDark = Math.random() > 0.72;
      if (!isDark) {
        const whiteTones = ['#ffffff', '#fffdf5', '#fef9c3', '#fef08a'];
        return { color: whiteTones[Math.floor(Math.random() * whiteTones.length)], isDarkTone: false };
      }
      return {
        color: darkParticleTones[Math.floor(Math.random() * darkParticleTones.length)],
        isDarkTone: true,
      };
    };

    const createRandomCloud = (initialX?: number): CartoonCloud => {
      const colors = ['#ffffff', '#fffdf5', '#fef9c3'];
      const randType = Math.random();

      let category: 'cluster' | 'solo_main' | 'solo_mini' = 'cluster';
      let scale = 1;
      const satellites: { offsetX: number; offsetY: number; scale: number }[] = [];

      if (randType < 0.45) {
        category = 'cluster';
        scale = Math.random() * 0.5 + 0.6;
        const count = Math.floor(Math.random() * 3) + 1;
        for (let s = 0; s < count; s++) {
          satellites.push({
            offsetX: (Math.random() - 0.5) * 160 + 90,
            offsetY: (Math.random() - 0.5) * 40 + 10,
            scale: Math.random() * 0.35 + 0.25,
          });
        }
      } else if (randType < 0.75) {
        category = 'solo_main';
        scale = Math.random() * 0.45 + 0.55;
      } else {
        category = 'solo_mini';
        scale = Math.random() * 0.25 + 0.25;
      }

      return {
        x: initialX !== undefined ? initialX : -300,
        y: Math.random() * (height * 0.85),
        scale,
        speed: (Math.random() * 0.4 + 0.3) * cloudSpeed,
        opacity: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        category,
        satellites,
      };
    };

    const createForegroundCloud = (initialX?: number): ForegroundCloud => {
      const colors = ['#ffffff', '#fffdf5', '#fef9c3'];
      return {
        x: initialX !== undefined ? initialX : -300 - Math.random() * 400,
        y: Math.random() * (height * 0.8),
        scale: Math.random() * 0.25 + 0.28,
        speed: (Math.random() * 0.35 + 0.35) * cloudSpeed,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    const bgTextureParticles: RisingTextureParticle[] = [];
    for (let f = 0; f < 22; f++) {
      const tone = getRandomParticleTone();
      bgTextureParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 6 + 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.8 + 0.3) * cloudSpeed,
        alpha: tone.isDarkTone ? Math.random() * 0.35 + 0.2 : Math.random() * 0.3 + 0.15,
        color: tone.color,
        isDarkTone: tone.isDarkTone,
      });
    }

    const bgClouds: CartoonCloud[] = [];
    for (let i = 0; i < cloudCount; i++) {
      bgClouds.push(createRandomCloud(Math.random() * (width + 400) - 200));
    }

    const fgClouds: ForegroundCloud[] = [
      createForegroundCloud(Math.random() * width),
      createForegroundCloud(Math.random() * width + 450),
      createForegroundCloud(Math.random() * width),
      createForegroundCloud(Math.random() * width + 550),
    ];

    const drawCloudSprite = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      color: string,
      withShadow: boolean,
      opacity: number
    ) => {
      const sprite = getCloudSprite(color, withShadow);
      c.save();
      c.translate(x, y);
      c.scale(scale, scale);
      c.globalAlpha = opacity;
      c.drawImage(sprite, -SPRITE_OX, -SPRITE_OY);
      c.restore();
    };

    const FRAME_MS = 1000 / 60;
    let acc = 0;

    const render = (now: number) => {
      animFrameId = requestAnimationFrame(render);
      acc += now - lastRender;
      lastRender = now;
      if (acc < FRAME_MS - 2) return;
      const dtSec = Math.min(0.05, acc / 1000);
      acc = 0;

      changeTimer -= dtSec;
      if (changeTimer <= 0) {
        targetCount = 6 + Math.floor(Math.random() * 8);
        changeTimer = 4 + Math.random() * 5;
      }

      // Factores de noche y atardecer para el cielo y las partículas
      let nightFactor = 0;
      let sunsetFactor = 0;

      // Degradado del cielo
      if (dynamicDayCycle) {
        cycleTimer += dtSec;
        const progress = Math.min(1, cycleTimer / cycleDuration);
        // Suavizado cosenoidal (ease-in-out)
        const smoothT = (1 - Math.cos(progress * Math.PI)) / 2;

        if (currentPhase === 0) {
          // Día -> Atardecer
          sunsetFactor = smoothT;
        } else if (currentPhase === 1) {
          // Atardecer -> Noche
          sunsetFactor = 1 - smoothT;
          nightFactor = smoothT;
        } else if (currentPhase === 2) {
          // Noche -> Amanecer
          nightFactor = 1 - smoothT;
        }

        const currentTop = lerpRGB(currentFrom.top, currentTo.top, smoothT);
        const currentMid = lerpRGB(currentFrom.mid, currentTo.mid, smoothT);
        const currentBottom = lerpRGB(currentFrom.bottom, currentTo.bottom, smoothT);

        const sg = ctx.createLinearGradient(0, 0, 0, height);
        sg.addColorStop(0, rgbToString(currentTop));
        sg.addColorStop(0.55, rgbToString(currentMid));
        sg.addColorStop(1, rgbToString(currentBottom));
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, width, height);

        if (cycleTimer >= cycleDuration) {
          cycleTimer = 0;
          currentFrom = currentTo;
          currentPhase = (currentPhase + 1) % 4;
          const nextPhase = (currentPhase + 1) % 4;
          currentTo = getPhasePalette(nextPhase);
        }
      } else {
        if (!skyGradCache) {
          const sg = ctx.createLinearGradient(0, 0, 0, height);
          if (isUnit4) {
            sg.addColorStop(0, '#4648d4');
            sg.addColorStop(0.55, '#6063ee');
            sg.addColorStop(1, '#38bdf8');
          } else {
            sg.addColorStop(0, '#fbbf24');
            sg.addColorStop(0.55, '#f59e0b');
            sg.addColorStop(1, '#d97706');
          }
          skyGradCache = sg;
        }
        ctx.fillStyle = skyGradCache;
        ctx.fillRect(0, 0, width, height);
      }

      // Partículas de textura ascendentes (con adaptación a noche/atardecer)
      for (let i = 0; i < bgTextureParticles.length; i++) {
        const pt = bgTextureParticles[i];
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

        let alpha = pt.alpha;
        let pColor = pt.color;

        if (nightFactor > 0.05) {
          // Modo estrellas titilantes en noche
          const twinkle = (Math.sin(now * 0.005 + i * 1.6) + 1) * 0.5;
          alpha = pt.alpha * (1 - nightFactor) + (0.35 + 0.55 * twinkle) * nightFactor;
          pColor = i % 2 === 0 ? '#ffffff' : '#fef08a';
        } else if (sunsetFactor > 0.1 && pt.isDarkTone) {
          // Modo calidez en atardecer
          pColor = '#fdba74';
        }

        ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Nubes de fondo con sombras suaves
      for (let i = bgClouds.length - 1; i >= 0; i--) {
        const cloud = bgClouds[i];
        cloud.x += cloud.speed;

        if (cloud.x > width + 300) {
          if (bgClouds.length < targetCount) {
            bgClouds.splice(i, 1, createRandomCloud(), createRandomCloud());
          } else if (bgClouds.length > targetCount) {
            bgClouds.splice(i, 1);
          } else {
            bgClouds[i] = createRandomCloud();
          }
          continue;
        }

        const cloudOpacity = nightFactor > 0.1 ? cloud.opacity * (1 - 0.25 * nightFactor) : cloud.opacity;
        drawCloudSprite(ctx, cloud.x, cloud.y, cloud.scale, cloud.color, true, cloudOpacity);

        if (cloud.category === 'cluster' && cloud.satellites.length > 0) {
          for (let s = 0; s < cloud.satellites.length; s++) {
            const sat = cloud.satellites[s];
            drawCloudSprite(
              ctx,
              cloud.x + sat.offsetX * cloud.scale,
              cloud.y + sat.offsetY * cloud.scale,
              cloud.scale * sat.scale,
              cloud.color,
              true,
              cloudOpacity
            );
          }
        }
      }

      // Nubes de primer plano
      for (let index = 0; index < fgClouds.length; index++) {
        const cloud = fgClouds[index];
        cloud.x += cloud.speed;

        if (cloud.x > width + 300) {
          fgClouds[index] = createForegroundCloud();
          continue;
        }

        const fgOpacity = nightFactor > 0.1 ? 1.0 - 0.2 * nightFactor : 1.0;
        drawCloudSprite(ctx, cloud.x, cloud.y, cloud.scale, cloud.color, false, fgOpacity);
      }
    };

    render(performance.now());

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, [theme, cloudSpeed, dynamicDayCycle, cycleDuration]);

  return (
    <div className={`fixed inset-0 z-0 w-screen h-screen overflow-hidden select-none pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
