import React, { useEffect, useRef } from 'react';

export interface NoteData {
  start: number;
  end: number;
  pitch: string;
}

export interface UserPitch {
  centsOff: number | null;
  note: string | null;
}

interface PolygraphCanvasProps {
  currentTime: number;
  userPitch: UserPitch;
  mockMelodyData?: NoteData[];
}

export function PolygraphCanvas({
  currentTime,
  userPitch,
  mockMelodyData = [],
}: PolygraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ currentTime, userPitch, mockMelodyData });

  useEffect(() => {
    propsRef.current = { currentTime, userPitch, mockMelodyData };
  }, [currentTime, userPitch, mockMelodyData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeObserver: ResizeObserver | null = null;
    
    let dpr = 1;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let centerX = 0;
    let centerY = 0;

    const onResize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvasWidth = (rect.width * dpr) | 0;
      canvasHeight = (rect.height * dpr) | 0;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      centerX = (canvasWidth / 2) | 0;
      centerY = (canvasHeight / 2) | 0;
    };

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        onResize();
      });
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', onResize);
    }
    onResize();

    let animationFrameId: number;
    let lastRenderTime = 0;
    const fpsInterval = 1000 / 30; // 33.33ms
    const PI2 = 2 * Math.PI;

    // Pre-allocate variables outside loop to avoid GC
    let i = 0;
    let len = 0;
    let noteStart = 0;
    let noteEnd = 0;
    let startX = 0;
    let endX = 0;
    let noteWidth = 0;
    let scaledPixelsPerSecond = 0;
    let scaledNoteHeight = 0;
    let scaledHalfNoteHeight = 0;
    let noteY = 0;
    let yOffset = 0;
    let userY = 0;
    let arcRadius = 0;
    
    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      
      const elapsed = time - lastRenderTime;
      if (elapsed < fpsInterval) {
        return;
      }
      lastRenderTime = time - (elapsed % fpsInterval);

      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const { currentTime, userPitch, mockMelodyData } = propsRef.current;
      scaledPixelsPerSecond = 100 * dpr;
      scaledNoteHeight = (20 * dpr) | 0;
      scaledHalfNoteHeight = (10 * dpr) | 0;
      noteY = (centerY - scaledHalfNoteHeight) | 0;

      // Draw melody notes
      ctx.fillStyle = '#64748b';
      len = mockMelodyData.length;
      for (i = 0; i < len; i++) {
        noteStart = mockMelodyData[i].start;
        noteEnd = mockMelodyData[i].end;
        
        startX = (centerX + (noteStart - currentTime) * scaledPixelsPerSecond) | 0;
        endX = (centerX + (noteEnd - currentTime) * scaledPixelsPerSecond) | 0;
        
        if (endX < 0 || startX > canvasWidth) {
          continue;
        }

        noteWidth = (endX - startX) | 0;
        if (noteWidth < 1) noteWidth = 1;
        
        ctx.fillRect(startX, noteY, noteWidth, scaledNoteHeight);
      }

      // Draw user pitch
      if (userPitch.note !== null && userPitch.centsOff !== null) {
        yOffset = (-userPitch.centsOff * dpr) | 0;
        userY = (centerY + yOffset) | 0;
        arcRadius = (6 * dpr) | 0;

        ctx.beginPath();
        ctx.arc(centerX, userY, arcRadius, 0, PI2);
        if (userPitch.centsOff >= -20 && userPitch.centsOff <= 20) {
          ctx.fillStyle = '#22c55e';
        } else {
          ctx.fillStyle = '#ef4444';
        }
        ctx.fill();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full bg-slate-900 rounded-lg"
    />
  );
}
