import React, { useEffect, useRef } from 'react';
import { audioService } from '../../utils/audioService';

export const AudioWaveformVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const analyser = audioService.getAnalyser();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        // 1. Draw Frequency Spectrum Bars
        const barCount = 22;
        const barWidth = canvas.width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength / 4));
          const value = freqData[index] || 0;
          const barHeight = (value / 255) * (canvas.height * 0.75);
          const x = i * (barWidth + 2) + 1;
          const y = canvas.height - barHeight;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, y);
          gradient.addColorStop(0, 'rgba(70, 72, 212, 0.2)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.9)');

          ctx.fillStyle = gradient;
          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // 2. Draw Smooth Time-Domain Wave Line
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#4648d4';
        ctx.shadowColor = 'rgba(70, 72, 212, 0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      } else {
        // Fallback pulsing animated wave if analyser isn't active
        const time = Date.now() / 150;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#4648d4';
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += 2) {
          const y = canvas.height / 2 + Math.sin(x * 0.08 + time) * 10 * Math.sin(time * 0.3);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-[#eff4ff] dark:bg-[#0b1828] p-3 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-2 text-center transition-colors">
      <canvas
        ref={canvasRef}
        width={320}
        height={85}
        className="w-full h-20 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs shadow-inner"
      />
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#4648d4] dark:text-[#c0c1ff]">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>AudioContext: Analizando Tono & Micro-afinación en Tiempo Real</span>
      </div>
    </div>
  );
};
