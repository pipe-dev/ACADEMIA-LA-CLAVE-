import confetti from 'canvas-confetti';
import { LessonNode } from '../../types';

// Persistent map storing playback positions across node views
export const nodeVideoPlaybackTimes = new Map<string, number>();

export const unlockOrientation = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitFullscreenElement) {
      try {
        await (document as any).webkitExitFullscreen?.();
      } catch {}
    }
    // @ts-ignore
    if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
      // @ts-ignore
      window.screen.orientation.unlock();
    }
  } catch (e) {
    console.warn('Could not unlock orientation or exit fullscreen', e);
  }
};

export const fireVideoConfetti = (
  canvas: HTMLCanvasElement | null,
  count: number = 40
) => {
  if (!canvas) return;

  try {
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    const myConfetti = confetti.create(canvas, {
      resize: false,
      useWorker: false
    });

    myConfetti({
      particleCount: count,
      spread: 60,
      startVelocity: 22 * dpr,
      scalar: 0.75 * dpr,
      ticks: 180,
      gravity: 0.9,
      origin: { y: 0.5 },
      colors: ['#4648d4', '#6063ee', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7']
    });
  } catch (e) {}
};

export const getTargetLoopCount = (node: LessonNode): number => {
  if (node.id === 'u1-node6' || node.title?.includes('Apoyo y Estabilidad')) return 2;
  if (node.id === 'u1-node3' || node.title?.includes('Capacidad Pulmonar')) return 3;
  if (typeof node.loopCount === 'number') return node.loopCount;
  if (node.instructions?.includes('2 repeticiones') || node.instructions?.includes('2 veces')) return 2;
  if (node.instructions?.includes('3 repeticiones') || node.instructions?.includes('3 veces')) return 3;
  if (node.instructions?.includes('4 repeticiones') || node.instructions?.includes('4 veces')) return 4;
  return 1;
};

export const attemptAutoPlay = (player: any) => {
  if (!player) return;
  try {
    player.unMute?.();
    player.setVolume?.(100);
    player.playVideo?.();
  } catch (e) {}
};
