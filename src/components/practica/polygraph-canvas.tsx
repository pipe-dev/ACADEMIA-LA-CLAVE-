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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        }
      }
    });
    resizeObserver.observe(canvas);

    let animationFrameId: number;
    let lastRenderTime = 0;
    const fpsInterval = 1000 / 30; // 33.33ms

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      
      const elapsed = time - lastRenderTime;
      if (elapsed < fpsInterval) {
        return;
      }
      lastRenderTime = time - (elapsed % fpsInterval);

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const { currentTime, userPitch, mockMelodyData } = propsRef.current;
      const pixelsPerSecond = 100;
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw melody notes
      ctx.fillStyle = '#64748b'; // slate-500
      for (const note of mockMelodyData) {
        const startX = centerX + (note.start - currentTime) * pixelsPerSecond;
        const endX = centerX + (note.end - currentTime) * pixelsPerSecond;
        
        if (endX < 0 || startX > width) {
          continue;
        }

        const noteWidth = endX - startX;
        const noteHeight = 20;
        const noteY = centerY - noteHeight / 2;
        
        ctx.beginPath();
        ctx.roundRect(startX, noteY, Math.max(1, noteWidth), noteHeight, 4);
        ctx.fill();
      }

      // Draw user pitch
      if (userPitch.note !== null && userPitch.centsOff !== null) {
        const yOffset = -userPitch.centsOff;
        const userY = centerY + yOffset;

        ctx.beginPath();
        ctx.arc(centerX, userY, 6, 0, 2 * Math.PI);
        if (userPitch.centsOff >= -20 && userPitch.centsOff <= 20) {
          ctx.fillStyle = '#22c55e'; // green-500
        } else {
          ctx.fillStyle = '#ef4444'; // red-500
        }
        ctx.fill();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full bg-slate-900 rounded-lg"
    />
  );
}
