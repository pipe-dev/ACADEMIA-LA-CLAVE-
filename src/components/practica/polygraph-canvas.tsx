"use client";

import React, { useEffect, useRef } from "react";

export interface NoteData {
  start: number;
  end: number;
  pitch: string;
  midi: number;
}

export interface CurvePoint {
  time: number;
  midi: number;
}

interface PolygraphCanvasProps {
  frequency: number;
  isDetecting: boolean;
  currentTime: number;
  melodyData: NoteData[];
  curveData?: CurvePoint[];
  onHitUpdate?: (isHit: boolean) => void;
}

interface Point {
  time: number;
  freq: number;
  midi: number;
  magnetMidi: number | null; 
  color: string;
}

export function PolygraphCanvas({ frequency, isDetecting, currentTime, melodyData, curveData, onHitUpdate }: PolygraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const freqRef = useRef(frequency);
  const detectingRef = useRef(isDetecting);
  const timeRef = useRef(currentTime);
  const melodyRef = useRef(melodyData);
  const curveRef = useRef(curveData);
  const onHitRef = useRef(onHitUpdate);
  
  const historyRef = useRef<Point[]>([]);

  useEffect(() => {
    freqRef.current = frequency;
    detectingRef.current = isDetecting;
    timeRef.current = currentTime;
    melodyRef.current = melodyData;
    curveRef.current = curveData;
    onHitRef.current = onHitUpdate;
  }, [frequency, isDetecting, currentTime, melodyData, curveData, onHitUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800;
    const H = 300;
    canvas.width = W;
    canvas.height = H;
    
    const PLAYHEAD_X = W * 0.33; 
    const PIXELS_PER_SEC = 150; 

    const mapMidiToY = (midi: number) => {
      const minMidi = 41; // F2 
      const maxMidi = 83; // B5 
      const normalized = (midi - minMidi) / (maxMidi - minMidi);
      const rawY = H - (normalized * H);
      return Math.max(12, Math.min(H - 12, rawY));
    };

    let animationId: number;
    let lastDrawTime = 0;
    const fpsInterval = 1000 / 30;

    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);

      if (!lastDrawTime) lastDrawTime = timestamp;
      const deltaTime = timestamp - lastDrawTime;
      
      if (deltaTime < fpsInterval) return;
      
      lastDrawTime = timestamp - (deltaTime % fpsInterval);

      const time = timeRef.current;
      const detecting = detectingRef.current;
      const freq = freqRef.current;
      const melody = melodyRef.current;
      const curve = curveRef.current;

      let isCurrentlyHitting = false;

      if (detecting && freq > 0) {
        let rawMidi = 12 * Math.log2(freq / 440) + 69;
        
        let magnetMidi = null;
        let pointColor = "#38bdf8"; 
        
        // Smart Unified Mode: Magnet + Scoring if there's an active block
        const activeBlock = melody.find(n => time >= n.start && time <= n.end);
        
        if (activeBlock) {
          let pitchClassDiff = Math.abs((rawMidi % 12) - (activeBlock.midi % 12));
          if (pitchClassDiff > 6) {
            pitchClassDiff = 12 - pitchClassDiff;
          }
          
          if (pitchClassDiff <= 0.8) {
            pointColor = "#10b981"; // Verde (Hit exacto + Imán)
            isCurrentlyHitting = true;
            magnetMidi = activeBlock.midi; 
          } else if (pitchClassDiff <= 2.5) {
            pointColor = "#f59e0b"; // Naranja (Cerca)
          } else {
            pointColor = "#ef4444"; // Rojo (Lejos)
          }
        } else if (curve) {
           // Fallback a curve fantasma si no hay bloques pero hay curva
           let expectedMidi: number | null = null;
           for (let i = 0; i < curve.length - 1; i++) {
               const p1 = curve[i];
               const p2 = curve[i+1];
               if (time >= p1.time && time <= p2.time) {
                   const t = (time - p1.time) / (p2.time - p1.time);
                   expectedMidi = p1.midi + t * (p2.midi - p1.midi);
                   break;
               }
           }
           
           if (expectedMidi !== null) {
              let pitchClassDiff = Math.abs((rawMidi % 12) - (expectedMidi % 12));
              if (pitchClassDiff > 6) pitchClassDiff = 12 - pitchClassDiff;

              if (pitchClassDiff <= 0.8) {
                pointColor = "#10b981"; // Verde
                isCurrentlyHitting = true;
                magnetMidi = expectedMidi; 
              } else if (pitchClassDiff <= 2.5) {
                pointColor = "#f59e0b"; 
              } else {
                pointColor = "#ef4444"; 
              }
           }
        }

        // Emitir estado de hit al componente padre
        if (onHitRef.current) {
            onHitRef.current(isCurrentlyHitting);
        }

        const lastPt = historyRef.current[historyRef.current.length - 1];
        
        if (lastPt && time < lastPt.time - 0.5) {
           historyRef.current = [];
        }

        const safeLastPt = historyRef.current[historyRef.current.length - 1];
        if (!safeLastPt || time > safeLastPt.time) {
            historyRef.current.push({ time, freq, midi: rawMidi, magnetMidi, color: pointColor });
        }
      } else {
        if (onHitRef.current && detecting) {
             onHitRef.current(false);
        }
      }

      const visibleMinTime = time - (PLAYHEAD_X / PIXELS_PER_SEC);
      while (historyRef.current.length > 0 && historyRef.current[0].time < visibleMinTime - 1) {
        historyRef.current.shift();
      }

      ctx.clearRect(0, 0, W, H);
      
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for(let i=0; i<H; i+=30) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
      }
      
      ctx.beginPath();
      ctx.moveTo(PLAYHEAD_X, 0);
      ctx.lineTo(PLAYHEAD_X, H);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw blocks always
      if (melody && melody.length > 0) {
        melody.forEach(note => {
          const xStart = PLAYHEAD_X + (note.start - time) * PIXELS_PER_SEC;
          const xEnd = PLAYHEAD_X + (note.end - time) * PIXELS_PER_SEC;
          const width = xEnd - xStart;
          const y = mapMidiToY(note.midi);
          
          if (xEnd > 0 && xStart < W) {
            const isActive = time >= note.start && time <= note.end;
            const isHitVFX = isActive && isCurrentlyHitting;
            
            ctx.fillStyle = isHitVFX ? "rgba(16, 185, 129, 0.4)" : (isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)");
            ctx.strokeStyle = isHitVFX ? "rgba(52, 211, 153, 0.8)" : (isActive ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.2)");
            ctx.lineWidth = isActive ? 2 : 1;
            
            ctx.beginPath();
            ctx.roundRect(xStart, y - 10, width, 20, 6);
            ctx.fill();
            ctx.stroke();
            
            if (isHitVFX) {
               ctx.shadowColor = "rgba(52, 211, 153, 0.8)";
               ctx.shadowBlur = 10;
               ctx.stroke();
               ctx.shadowBlur = 0;
            }

            ctx.fillStyle = isActive ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(note.pitch, xStart + 8, y + 4);
          }
        });
      } else if (curve) {
        // Fallback draw curve
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        let pathStarted = false;
        
        for (let i = 0; i < curve.length; i++) {
           const pt = curve[i];
           const x = PLAYHEAD_X + (pt.time - time) * PIXELS_PER_SEC;
           
           if (x > -50 && x < W + 50) {
               const y = mapMidiToY(pt.midi);
               const prevPt = i > 0 ? curve[i - 1] : null;
               
               if (!pathStarted || (prevPt && pt.time - prevPt.time > 0.15)) {
                   if (pathStarted) {
                      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                      ctx.stroke();
                   }
                   ctx.beginPath();
                   ctx.moveTo(x, y);
                   pathStarted = true;
               } else {
                   ctx.lineTo(x, y);
               }
           }
        }
        if (pathStarted) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.stroke();
        }
      }

      if (historyRef.current.length > 0) {
        let firstPoint = true;

        for (let i = 0; i < historyRef.current.length; i++) {
          const pt = historyRef.current[i];
          const x = PLAYHEAD_X + (pt.time - time) * PIXELS_PER_SEC;
          const y = mapMidiToY(pt.magnetMidi !== null ? pt.magnetMidi : pt.midi);
          
          const prevPt = i > 0 ? historyRef.current[i-1] : null;
          if (prevPt && (pt.time - prevPt.time > 0.15)) {
            firstPoint = true; 
          }

          if (firstPoint) {
            ctx.beginPath();
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = 6;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
            if (prevPt && (prevPt.color !== pt.color)) {
               ctx.stroke();
               ctx.beginPath();
               ctx.strokeStyle = pt.color;
               ctx.lineWidth = 6;
               ctx.lineCap = "round";
               ctx.lineJoin = "round";
               ctx.moveTo(x, y);
            }
          }
        }
        ctx.stroke();

        if (detecting && historyRef.current.length > 0) {
          const lastPt = historyRef.current[historyRef.current.length - 1];
          // Solo dibujar la cabeza si el último punto fue reciente (hace menos de 100ms)
          if (Math.abs(lastPt.time - time) < 0.1) {
            const headY = mapMidiToY(lastPt.magnetMidi !== null ? lastPt.magnetMidi : lastPt.midi);
            
            ctx.beginPath();
            ctx.arc(PLAYHEAD_X, headY, 10, 0, Math.PI * 2);
            ctx.fillStyle = lastPt.color;
            ctx.fill();
            ctx.shadowColor = lastPt.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative">
      <div className="absolute top-4 left-4 flex gap-2 items-center">
        <div className={`w-3 h-3 rounded-full ${isDetecting ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
      </div>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
    </div>
  );
}
