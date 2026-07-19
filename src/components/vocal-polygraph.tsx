"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, CheckCircle2, Play, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface VocalPolygraphProps {
  direction: 'up' | 'down';
  duration: number; // in seconds
  onComplete: () => void;
  title?: string;
}

export function VocalPolygraph({ direction, duration, onComplete, title }: VocalPolygraphProps) {
  const { start, stop, frequency, isDetecting } = usePitchDetection();
  
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const dataPointsRef = useRef<{time: number, freq: number}[]>([]);
  const animationRef = useRef<number | null>(null);

  const startExercise = async () => {
    try {
      await start();
      setIsActive(true);
      setIsCompleted(false);
      setTimeLeft(duration);
      dataPointsRef.current = [];
      startTimeRef.current = Date.now();
      draw();
    } catch (e) {
      console.error(e);
    }
  };

  const stopExercise = useCallback(() => {
    stop();
    setIsActive(false);
    setIsCompleted(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    // Draw one last time to ensure final state
    draw();
  }, [stop]);

  // Main timer
  useEffect(() => {
    if (!isActive || !startTimeRef.current) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current!;
      const remaining = Math.max(0, duration - elapsed / 1000);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        stopExercise();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, duration, stopExercise]);

  // Record data points
  useEffect(() => {
    if (isActive && startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      // Only record valid frequencies, or 0 if silent
      dataPointsRef.current.push({
        time: elapsed,
        freq: frequency
      });
    }
  }, [frequency, isActive]);

  // Canvas drawing logic
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw baseline
    const baseY = direction === 'up' ? height - 20 : 20;
    
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.moveTo(0, baseY);
    ctx.lineTo(width, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw graph
    if (dataPointsRef.current.length > 0) {
      ctx.beginPath();
      
      // Determine max frequency to scale
      // For high notes, typical max might be around 1000Hz. Let's set a dynamic max based on data, but with a minimum bound.
      let maxFreq = 0;
      let minFreq = 10000;
      dataPointsRef.current.forEach(dp => {
        if (dp.freq > 0) {
          if (dp.freq > maxFreq) maxFreq = dp.freq;
          if (dp.freq < minFreq) minFreq = dp.freq;
        }
      });

      // Fixed scaling range for stability
      const scaleRange = direction === 'up' ? 1000 : 500; 

      const points = dataPointsRef.current;
      
      let isFirstValid = true;
      
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        // Map time to X (0 to duration)
        const x = (point.time / (duration * 1000)) * width;
        
        if (point.freq > 0) {
          // Map freq to Y
          let y;
          if (direction === 'up') {
             // Map 0 -> baseY, 1000Hz -> 0
             const clampedFreq = Math.min(point.freq, scaleRange);
             y = baseY - (clampedFreq / scaleRange) * (height - 40);
          } else {
             // down: map 0 -> baseY, 500Hz -> height
             const clampedFreq = Math.min(point.freq, scaleRange);
             y = baseY + (clampedFreq / scaleRange) * (height - 40);
          }

          if (isFirstValid) {
            ctx.moveTo(x, y);
            isFirstValid = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }

      ctx.strokeStyle = direction === 'up' ? "#d946ef" : "#3b82f6"; // Fuchsia for UP, Blue for DOWN
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      
      // Draw a glowing dot at the head if active
      if (isActive && points.length > 0) {
         const lastPoint = points[points.length - 1];
         if (lastPoint.freq > 0) {
             const x = (lastPoint.time / (duration * 1000)) * width;
             let y;
             if (direction === 'up') {
                const clampedFreq = Math.min(lastPoint.freq, scaleRange);
                y = baseY - (clampedFreq / scaleRange) * (height - 40);
             } else {
                const clampedFreq = Math.min(lastPoint.freq, scaleRange);
                y = baseY + (clampedFreq / scaleRange) * (height - 40);
             }
             
             ctx.beginPath();
             ctx.arc(x, y, 6, 0, Math.PI * 2);
             ctx.fillStyle = "#ffffff";
             ctx.fill();
             ctx.shadowColor = direction === 'up' ? "#d946ef" : "#3b82f6";
             ctx.shadowBlur = 10;
             ctx.fill();
             ctx.shadowBlur = 0;
         }
      }
    }

    if (isActive) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [direction, duration, isActive]);

  useEffect(() => {
    // Initial draw to show the baseline
    draw();
    return () => {
      stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, [draw, stop]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-500">
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-black">{title || (direction === 'up' ? "Canta tu nota más aguda" : "Canta tu nota más grave")}</h3>
        <p className="text-sm text-muted-foreground">
          {isCompleted 
            ? "¡Excelente registro!" 
            : isActive 
              ? `Mantenla constante durante los ${duration} segundos...` 
              : "Presiona Empezar y canta fuerte."}
        </p>
      </div>

      {/* Canvas Container */}
      <div className="relative w-full max-w-md h-48 bg-black/40 rounded-3xl border-2 border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
        <canvas 
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-full object-contain"
        />
        
        {/* Overlay when not active and not completed */}
        {!isActive && !isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <Activity className="w-12 h-12 text-white/20" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {!isActive && !isCompleted ? (
          <Button 
            onClick={startExercise}
            className="rounded-full w-20 h-20 shadow-lg bg-primary hover:bg-primary/90 text-white transition-all hover:scale-105 active:scale-95"
          >
            <Mic className="w-8 h-8" />
          </Button>
        ) : isActive ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-black font-mono text-primary animate-pulse">
              {timeLeft.toFixed(1)}s
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Grabando...
            </p>
          </div>
        ) : (
          <Button 
            onClick={onComplete}
            className="h-12 px-8 rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black animate-bounce gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
