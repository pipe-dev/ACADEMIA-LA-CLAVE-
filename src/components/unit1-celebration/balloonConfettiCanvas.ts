import { useEffect, RefObject, MutableRefObject } from 'react';
import confetti from 'canvas-confetti';

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

const CONFETTI_COLORS = [
  '#4648d4', '#818cf8', '#fbbf24', '#f59e0b', '#ec4899',
  '#22c55e', '#ffffff', '#a855f7', '#06b6d4', '#ef4444', '#eab308'
];

/**
 * Triggers background dual-cannon and central confetti bursts.
 */
export const triggerBackgroundConfettiBurst = () => {
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

/**
 * Hook to manage 3,400-piece settling confetti wall canvas and wind-sweeping physics.
 */
export const useBalloonConfetti = (
  confettiCanvasRef: RefObject<HTMLCanvasElement | null>,
  isOpen: boolean,
  isPopped: boolean,
  isWindSweepingRef: MutableRefObject<boolean>
) => {
  useEffect(() => {
    if (!isOpen || !isPopped) return;

    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

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
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
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
  }, [isOpen, isPopped, confettiCanvasRef, isWindSweepingRef]);
};
