import { useEffect, RefObject } from 'react';

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

const draw2DCartoonCloud = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  fillStyle: string,
  shadowColor: string,
  opacity: number = 1.0
) => {
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

/**
 * Hook to manage the dual-canvas cartoon cloud and texture particle engine for Unit 1 celebration.
 */
export const useBalloonClouds = (
  bgCanvasRef: RefObject<HTMLCanvasElement | null>,
  fgCanvasRef: RefObject<HTMLCanvasElement | null>,
  isOpen: boolean
) => {
  useEffect(() => {
    if (!isOpen) return;
    const bgCanvas = bgCanvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    if (!bgCanvas || !fgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');
    if (!bgCtx || !fgCtx) return;

    let animFrameId: number;
    let width = (bgCanvas.width = fgCanvas.width = window.innerWidth);
    let height = (bgCanvas.height = fgCanvas.height = window.innerHeight);

    const cloudSpeed = 1.0;
    const cloudCount = 19;

    const handleResize = () => {
      if (!bgCanvas || !fgCanvas) return;
      width = bgCanvas.width = fgCanvas.width = window.innerWidth;
      height = bgCanvas.height = fgCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

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
            scale: Math.random() * 0.35 + 0.25
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
        shadowColor: '#c88c2a',
        category,
        satellites
      };
    };

    const createForegroundCloud = (
      targetArea: 'balloon_body' | 'balloon_string',
      initialX?: number
    ): ForegroundCloud => {
      const centerY = height * 0.5;
      const colors = ['#ffffff', '#fffdf5', '#fef9c3'];

      const scale =
        targetArea === 'balloon_body'
          ? Math.random() * 0.15 + 0.28
          : Math.random() * 0.25 + 0.6;

      const yOffset =
        targetArea === 'balloon_body'
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
        vy: -(Math.random() * 0.8 + 0.3) * cloudSpeed,
        alpha: tone.isDarkTone ? Math.random() * 0.35 + 0.2 : Math.random() * 0.3 + 0.15,
        color: tone.color,
        isDarkTone: tone.isDarkTone
      });
    }

    const bgClouds: CartoonCloud[] = [];
    for (let i = 0; i < cloudCount; i++) {
      bgClouds.push(createRandomCloud(Math.random() * (width + 400) - 200));
    }

    const fgClouds: ForegroundCloud[] = [
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
  }, [isOpen, bgCanvasRef, fgCanvasRef]);
};
