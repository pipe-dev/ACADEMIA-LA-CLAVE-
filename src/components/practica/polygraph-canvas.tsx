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
  polygraphMode?: "C" | "A" | "B";
  onHitUpdate?: (isHit: boolean) => void;
}

interface VoicePoint {
  wallTime: number;
  y: number;
  midi: number;
  color: string;
  inTune: boolean;
  active: boolean;
}

export function PolygraphCanvas({
  frequency,
  isDetecting,
  currentTime,
  melodyData,
  curveData,
  onHitUpdate
}: PolygraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live refs to avoid recreation of requestAnimationFrame loop
  const freqRef = useRef(frequency);
  const detectingRef = useRef(isDetecting);
  const timeRef = useRef(currentTime);
  const melodyRef = useRef(melodyData);
  const curveRef = useRef(curveData);
  const onHitRef = useRef(onHitUpdate);

  // Continuous smoothing & history buffers
  const smoothYRef = useRef<number>(150);
  const historyRef = useRef<VoicePoint[]>([]);
  const lastRecordTimeRef = useRef<number>(0);
  const pitchBufferRef = useRef<number[]>([]);

  // Synchronize incoming props to refs
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

    let animationId: number;

    const DURATION_MS = 3800; // 3.8s rolling window across canvas
    const MIN_MIDI = 40; // E2 (~82Hz)
    const MAX_MIDI = 84; // C6 (~1046Hz)

    const mapMidiToY = (midi: number, height: number) => {
      const clampedMidi = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
      const normalized = (clampedMidi - MIN_MIDI) / (MAX_MIDI - MIN_MIDI);
      const padding = 20;
      // Invert Y so higher pitches appear higher up on canvas
      return height - padding - normalized * (height - padding * 2);
    };

    const draw = () => {
      const now = performance.now();

      // Handle High-DPI Display Scaling dynamically
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Playhead anchored at 36% of width
      const PLAYHEAD_X = Math.round(width * 0.36);
      const currentAudioTime = timeRef.current;
      const detecting = detectingRef.current;
      const freq = freqRef.current;
      const melody = melodyRef.current;

      // Rango vocal humano útil de canto (65 Hz a 1150 Hz)
      const isSinging = detecting && freq >= 65 && freq <= 1150;
      let rawMidi = 0;
      let isHit = false;
      let activeColor = "#38bdf8"; // Cyan eléctrico por defecto

      if (isSinging) {
        rawMidi = 12 * Math.log2(freq / 440) + 69;

        // Ventana deslizante para calcular la dispersión tonal (canto vs habla)
        pitchBufferRef.current.push(rawMidi);
        if (pitchBufferRef.current.length > 7) {
          pitchBufferRef.current.shift();
        }

        let minM = Infinity;
        let maxM = -Infinity;
        for (const m of pitchBufferRef.current) {
          if (m < minM) minM = m;
          if (m > maxM) maxM = m;
        }
        const pitchSpread = maxM - minM;
        // Canto sostenido: el pitch no salta bruscamente como en el habla (dispersión < 1.8 semitonos, permite vibrato natural)
        const isSingingSustained = pitchBufferRef.current.length >= 4 && pitchSpread < 1.8;

        // Verificar si hay una nota objetivo en la melodía en el segundo actual
        const activeNote = melody.find(
          n => currentAudioTime >= n.start && currentAudioTime <= n.end
        );

        if (activeNote) {
          let pitchDiff = Math.abs((rawMidi % 12) - (activeNote.midi % 12));
          if (pitchDiff > 6) pitchDiff = 12 - pitchDiff;

          if (pitchDiff <= 1.05 && isSingingSustained) {
            isHit = true;
            activeColor = "#10b981"; // Verde esmeralda (acierto afinado)
          } else if (pitchDiff <= 2.2) {
            activeColor = "#f59e0b"; // Ámbar (cerca pero no afinado)
            isHit = false;
          } else {
            activeColor = "#f43f5e"; // Rojo (desafinado)
            isHit = false;
          }
        } else if (melody && melody.length > 0) {
          // Si la pista tiene melodía pero hay un silencio instrumental: no dar puntos
          activeColor = "#38bdf8";
          isHit = false;
        } else {
          // Pista sin melodía pre-cargada:
          // Se premia el canto sostenido y musical (no el habla rápida ni el ruido ambiente)
          if (isSingingSustained) {
            isHit = true;
            activeColor = "#10b981"; // Verde afinado
          } else {
            activeColor = "#38bdf8"; // Cyan (habla o modulación en tránsito)
            isHit = false;
          }
        }

        // Notificar acierto al componente padre
        if (onHitRef.current) {
          onHitRef.current(isHit);
        }

        // Suavizar posición Y con LERP
        const targetY = mapMidiToY(rawMidi, height);
        smoothYRef.current += (targetY - smoothYRef.current) * 0.22;
      } else {
        pitchBufferRef.current = [];
        if (onHitRef.current && detecting) {
          onHitRef.current(false);
        }
      }

      // Record trail point every ~20ms
      if (now - lastRecordTimeRef.current >= 20) {
        lastRecordTimeRef.current = now;

        historyRef.current.push({
          wallTime: now,
          y: smoothYRef.current,
          midi: rawMidi,
          color: activeColor,
          inTune: isHit,
          active: isSinging
        });

        // Prune old points beyond the rolling window
        const cutoff = now - DURATION_MS;
        while (historyRef.current.length > 0 && historyRef.current[0].wallTime < cutoff) {
          historyRef.current.shift();
        }
      }

      // ─── 1. DIBUJAR 9 LÍNEAS HORIZONTALES SUTILES ───
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const totalGridLines = 9;
      const gridSpacing = height / (totalGridLines + 1);
      for (let i = 1; i <= totalGridLines; i++) {
        const y = Math.round(i * gridSpacing);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ─── 2. DIBUJAR BLOQUES DE MELODÍA ENTRANTES ───
      if (melody && melody.length > 0) {
        const PIXELS_PER_SEC = 120;
        melody.forEach(note => {
          const xStart = PLAYHEAD_X + (note.start - currentAudioTime) * PIXELS_PER_SEC;
          const xEnd = PLAYHEAD_X + (note.end - currentAudioTime) * PIXELS_PER_SEC;
          const noteWidth = Math.max(12, xEnd - xStart);
          const noteY = mapMidiToY(note.midi, height);

          if (xEnd > 0 && xStart < width) {
            const isNoteActive = currentAudioTime >= note.start && currentAudioTime <= note.end;
            const isNoteHit = isNoteActive && isHit;

            ctx.fillStyle = isNoteHit
              ? "rgba(16, 185, 129, 0.45)"
              : isNoteActive
              ? "rgba(99, 102, 241, 0.35)"
              : "rgba(255, 255, 255, 0.08)";

            ctx.strokeStyle = isNoteHit
              ? "rgba(52, 211, 153, 0.9)"
              : isNoteActive
              ? "rgba(165, 180, 252, 0.7)"
              : "rgba(255, 255, 255, 0.2)";

            ctx.lineWidth = isNoteActive ? 2 : 1;

            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(xStart, noteY - 10, noteWidth, 20, 6);
            } else {
              ctx.rect(xStart, noteY - 10, noteWidth, 20);
            }
            ctx.fill();
            ctx.stroke();

            // Texto de la nota
            ctx.fillStyle = isNoteActive ? "#ffffff" : "rgba(255, 255, 255, 0.4)";
            ctx.font = "bold 11px sans-serif";
            ctx.fillText(note.pitch, xStart + 6, noteY + 4);
          }
        });
      }

      // ─── 3. LÍNEA DEL PLAYHEAD (PULSO CENTRAL MÁS DELGADO Y CON MENOS ESPACIO ENTRE RAYITAS) ───
      ctx.beginPath();
      ctx.moveTo(PLAYHEAD_X, 0);
      ctx.lineTo(PLAYHEAD_X, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2.5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // ─── 4. DIBUJAR LA LÍNEA CONTINUA Y FLUIDA DE LA VOZ (RIBBON) ───
      const trail = historyRef.current;
      if (trail.length > 0) {
        // Mapear puntos con coordenadas absolutas en pantalla
        const screenPoints: { x: number; y: number; active: boolean; color: string }[] = [];

        for (let i = 0; i < trail.length; i++) {
          const pt = trail[i];
          const age = now - pt.wallTime;
          const px = PLAYHEAD_X - (age / DURATION_MS) * PLAYHEAD_X;

          if (px >= -20 && px <= PLAYHEAD_X) {
            screenPoints.push({
              x: px,
              y: pt.y,
              active: pt.active,
              color: pt.color
            });
          }
        }

        // Si está cantando activamente, conectar directamente con el playhead
        if (isSinging) {
          screenPoints.push({
            x: PLAYHEAD_X,
            y: smoothYRef.current,
            active: true,
            color: activeColor
          });
        }

        // Agrupar en segmentos continuos de voz activa
        const segments: { x: number; y: number; color: string }[][] = [];
        let currentSegment: { x: number; y: number; color: string }[] = [];

        for (let i = 0; i < screenPoints.length; i++) {
          const pt = screenPoints[i];
          if (pt.active) {
            currentSegment.push(pt);
          } else {
            if (currentSegment.length > 0) {
              segments.push(currentSegment);
              currentSegment = [];
            }
          }
        }
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }

        // Renderizar cada segmento como curva Bezier suave
        segments.forEach(segment => {
          if (segment.length < 2) return;

          const segColor = segment[segment.length - 1].color;

          // Área iluminada translúcida bajo la curva
          ctx.beginPath();
          ctx.moveTo(segment[0].x, segment[0].y);
          for (let i = 1; i < segment.length; i++) {
            const prev = segment[i - 1];
            const curr = segment[i];
            const cpX = (prev.x + curr.x) / 2;
            ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
          }
          ctx.lineTo(segment[segment.length - 1].x, height);
          ctx.lineTo(segment[0].x, height);
          ctx.closePath();

          const areaGrad = ctx.createLinearGradient(0, 0, 0, height);
          if (segColor === "#10b981") {
            areaGrad.addColorStop(0, "rgba(16, 185, 129, 0.22)");
            areaGrad.addColorStop(1, "rgba(16, 185, 129, 0.0)");
          } else if (segColor === "#f59e0b") {
            areaGrad.addColorStop(0, "rgba(245, 158, 11, 0.2)");
            areaGrad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
          } else {
            areaGrad.addColorStop(0, "rgba(56, 189, 248, 0.2)");
            areaGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
          }
          ctx.fillStyle = areaGrad;
          ctx.fill();

          // Trazo de la línea principal fluida con brillo
          ctx.beginPath();
          ctx.moveTo(segment[0].x, segment[0].y);
          for (let i = 1; i < segment.length; i++) {
            const prev = segment[i - 1];
            const curr = segment[i];
            const cpX = (prev.x + curr.x) / 2;
            ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
          }

          ctx.strokeStyle = segColor;
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.shadowColor = segColor;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });
      }

      // ─── 5. DIBUJAR CABEZA GUÍA DEL PLAYHEAD ───
      if (isSinging) {
        const headY = smoothYRef.current;

        // Halo pulsante exterior
        ctx.beginPath();
        ctx.arc(PLAYHEAD_X, headY, 12, 0, Math.PI * 2);
        ctx.fillStyle = activeColor === "#10b981"
          ? "rgba(16, 185, 129, 0.25)"
          : activeColor === "#f59e0b"
          ? "rgba(245, 158, 11, 0.25)"
          : "rgba(56, 189, 248, 0.25)";
        ctx.fill();

        // Núcleo brillante
        ctx.beginPath();
        ctx.arc(PLAYHEAD_X, headY, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Indicador tenue de reposo en el playhead
        ctx.beginPath();
        ctx.arc(PLAYHEAD_X, height / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();
      }

      ctx.restore();
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden relative select-none">
      {/* Indicador de grabación activa en la esquina superior izquierda */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center pointer-events-none">
        <div className={`w-3 h-3 rounded-full ${isDetecting ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
