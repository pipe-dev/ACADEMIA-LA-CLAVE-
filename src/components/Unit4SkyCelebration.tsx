// src/components/Unit4SkyCelebration.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { unit4World } from '../utils/unit4WorldState';

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

export const Unit4SkyCelebration: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudSpeed = 1.0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Pre-renderizado de nubes offscreen: elimina shadowBlur (el mayor cuello de botella en móviles)
    const cloudSprites = new Map<string, HTMLCanvasElement>();
    const SPRITE_W = 320;
    const SPRITE_H = 220;
    const SPRITE_OX = 70;
    const SPRITE_OY = 110;

    const getCloudSprite = (color: string, withShadow: boolean): HTMLCanvasElement => {
      const key = `${color}_${withShadow}`;
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
        sCtx.shadowColor = '#5b5fce';
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

    // Precalentar sprites comunes
    const baseColors = ['#ffffff', '#fffdf5', '#fef9c3'];
    baseColors.forEach((col) => {
      getCloudSprite(col, true);
      getCloudSprite(col, false);
    });

    let cloudCount = 1 + Math.floor(Math.random() * 9);
    let targetCount = cloudCount;
    let changeTimer = 0;
    let lastRender = 0;
    let skyGradCache: CanvasGradient | null = null;

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
      } else {
        const darkTones = ['#8b8ff0', '#818cf8', '#6366f1', '#4f52e6', '#383aba'];
        return { color: darkTones[Math.floor(Math.random() * darkTones.length)], isDarkTone: true };
      }
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
    for (let f = 0; f < 20; f++) {
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

      if (unit4World.phase === 'playing') {
        changeTimer -= dtSec;
        if (changeTimer <= 0) {
          targetCount = Math.floor(Math.random() * 10);
          changeTimer = 3 + Math.random() * 4;
        }
      }

      // Sky Gradient
      if (!skyGradCache) {
        const sg = ctx.createLinearGradient(0, 0, 0, height);
        sg.addColorStop(0, '#4648d4');
        sg.addColorStop(0.55, '#6063ee');
        sg.addColorStop(1, '#38bdf8');
        skyGradCache = sg;
      }
      ctx.fillStyle = skyGradCache;
      ctx.fillRect(0, 0, width, height);

      // Deep Background Texture Particles
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

        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Background Clouds (Offscreen Sprite blits - 60 FPS)
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

        drawCloudSprite(ctx, cloud.x, cloud.y, cloud.scale, cloud.color, true, cloud.opacity);

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
              cloud.opacity
            );
          }
        }
      }

      // Foreground Solid Clouds (Offscreen Sprite blits - 60 FPS)
      for (let index = 0; index < fgClouds.length; index++) {
        const cloud = fgClouds[index];
        cloud.x += cloud.speed;

        if (cloud.x > width + 300) {
          fgClouds[index] = createForegroundCloud();
          continue;
        }

        drawCloudSprite(ctx, cloud.x, cloud.y, cloud.scale, cloud.color, false, 1.0);
      }
    };

    render(performance.now());

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden select-none bg-[#38bdf8] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
    </div>
  );
};
