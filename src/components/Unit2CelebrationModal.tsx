// src/components/Unit2CelebrationModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../utils/audioService';
import {
  playCrystalChime,
  playGlassLandingSound,
  playGlassShatterSound,
} from './unit2-celebration/glassAudio';
import { startShardsSimulation } from './unit2-celebration/glassShardsCanvas';
import { CrystalWineGlassSvg } from './unit2-celebration/CrystalWineGlassSvg';
import { AcousticResonanceBar } from './unit2-celebration/AcousticResonanceBar';
import { useGlassVoiceTension } from './unit2-celebration/useGlassVoiceTension';

interface Unit2CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

const hzToNoteName = (hz: number): string => {
  if (hz <= 0) return '';
  const noteNamesEs = [
    'Do',
    'Do#',
    'Re',
    'Re#',
    'Mi',
    'Fa',
    'Fa#',
    'Sol',
    'Sol#',
    'La',
    'La#',
    'Si',
  ];
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  const noteIdx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNamesEs[noteIdx]}${octave}`;
};

export const Unit2CelebrationModal: React.FC<Unit2CelebrationModalProps> = ({
  isOpen,
  onContinue,
}) => {
  const [isShattered, setIsShattered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Entrance drop animation
  const [isDroppingIn, setIsDroppingIn] = useState(true);
  const landingSoundTimerRef = useRef<NodeJS.Timeout>();
  const dropFinishTimerRef = useRef<NodeJS.Timeout>();

  // 2.5D Touch Interactivity
  const [surfaceAngle, setSurfaceAngle] = useState(0);
  const [isJiggling, setIsJiggling] = useState(false);
  const surfaceAngleRef = useRef(0);
  const surfaceVelRef = useRef(0);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const isDraggingRef = useRef(false);
  const jiggleTimeoutRef = useRef<NodeJS.Timeout>();

  const onShatter = () => {
    setIsShattered(true);
    playGlassShatterSound();
    audioService.play3StarFanfare();
  };

  const {
    isActive,
    progress,
    detectedPitch,
    handleStart,
    resetTension,
  } = useGlassVoiceTension({
    isOpen,
    isShattered,
    onShatter,
  });

  // Inertia momentum RAF loop
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const loop = () => {
      if (!isDraggingRef.current && Math.abs(surfaceVelRef.current) > 0.05) {
        surfaceAngleRef.current =
          (((surfaceAngleRef.current + surfaceVelRef.current) % 360) + 360) %
          360;
        surfaceVelRef.current *= 0.94;
        setSurfaceAngle(surfaceAngleRef.current);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDroppingIn) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingRef.current = true;

    const now = performance.now();
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: now };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    surfaceVelRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDroppingIn || !isDraggingRef.current || !lastPointerRef.current)
      return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);
    const dx = e.clientX - lastPointerRef.current.x;

    surfaceVelRef.current = (dx / dt) * 16;
    surfaceAngleRef.current =
      (((surfaceAngleRef.current + dx * 0.9) % 360) + 360) % 360;

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    setSurfaceAngle(surfaceAngleRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDroppingIn || !isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const now = performance.now();
    const start = pointerStartRef.current;

    if (start) {
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      const duration = now - start.time;
      if (dist < 20 && duration < 380) {
        playCrystalChime();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(12);
          } catch (_) {}
        }
        setIsJiggling(true);
        if (jiggleTimeoutRef.current) clearTimeout(jiggleTimeoutRef.current);
        jiggleTimeoutRef.current = setTimeout(
          () => setIsJiggling(false),
          450
        );

        if (!isActive) {
          handleStart();
        }
      }
    }
  };

  // Entrance & Lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsShattered(false);
      resetTension();
      setIsDroppingIn(true);

      if (landingSoundTimerRef.current)
        clearTimeout(landingSoundTimerRef.current);
      landingSoundTimerRef.current = setTimeout(() => {
        playGlassLandingSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([25, 45, 15]);
          } catch (_) {}
        }
      }, 395);

      if (dropFinishTimerRef.current)
        clearTimeout(dropFinishTimerRef.current);
      dropFinishTimerRef.current = setTimeout(() => {
        setIsDroppingIn(false);
        handleStart();
      }, 1100);
    } else {
      setIsDroppingIn(false);
      if (landingSoundTimerRef.current)
        clearTimeout(landingSoundTimerRef.current);
      if (dropFinishTimerRef.current)
        clearTimeout(dropFinishTimerRef.current);
    }

    return () => {
      if (landingSoundTimerRef.current)
        clearTimeout(landingSoundTimerRef.current);
      if (dropFinishTimerRef.current)
        clearTimeout(dropFinishTimerRef.current);
    };
  }, [isOpen, resetTension, handleStart]);

  // 1,000 Crystal Shards Canvas
  useEffect(() => {
    if (!isOpen || !isShattered || !canvasRef.current) return;
    const cleanup = startShardsSimulation(canvasRef.current);
    return cleanup;
  }, [isOpen, isShattered]);

  useEffect(() => {
    return () => {
      if (jiggleTimeoutRef.current) clearTimeout(jiggleTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b1828] overflow-hidden select-none">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] bg-center opacity-60 pointer-events-none" />

      {/* Central Glow Behind Glass */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -translate-y-6" />

      {/* 1,000 Crystal Glass Shards Simulation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {!isShattered ? (
        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
          <h2 className="text-white font-heading font-black text-2xl sm:text-3xl mb-4 text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight tracking-wide">
            Rompe la copa con tu nota más aguda
          </h2>

          <AcousticResonanceBar progress={progress} />

          <div
            className={`relative flex items-center justify-center py-4 cursor-grab active:cursor-grabbing touch-none select-none ${
              isDroppingIn ? 'animate-glass-drop' : ''
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="relative group p-2">
              <CrystalWineGlassSvg
                progress={progress}
                surfaceAngle={surfaceAngle}
                isJiggling={isJiggling}
              />
            </div>
          </div>

          {!isActive ? (
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2">
              <button
                onClick={handleStart}
                className="px-8 py-3.5 sm:py-4 rounded-full font-heading font-black text-base uppercase tracking-wider text-white bg-[#00b4d8] hover:bg-[#0096c7] shadow-[0_5px_0_0_#0077b6] active:translate-y-1 active:shadow-[0_1px_0_0_#0077b6] transition-all cursor-pointer flex items-center gap-2"
              >
                <span>🎤 Activar Micrófono</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                </span>
                <span className="text-cyan-300 font-bold text-sm tracking-wide">
                  {detectedPitch
                    ? `¡Voz captada: ${hzToNoteName(detectedPitch)} (${detectedPitch} Hz)! Rompiendo...`
                    : '¡Canta ahora con tu voz más aguda!'}
                </span>
              </div>
              <span className="text-slate-300 text-xs font-semibold tracking-wide">
                {progress > 0
                  ? `Tensión Acústica: ${Math.round(progress)}%`
                  : 'Esperando tu voz...'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-40 flex flex-col items-center justify-center animate-fade-in px-4">
          <div className="relative z-50 flex flex-col items-center justify-center w-full max-w-sm">
            <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-800">
              <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-900">
                <button
                  onClick={onContinue}
                  className="w-full flex items-center justify-center px-6 py-4 rounded-full transition-all duration-75 relative border border-transparent btn-3d bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-200 drop-shadow-sm leading-tight">
                      UNIDAD 3
                    </span>
                    <span className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                      CONTINUAR A LA UNIDAD 3
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
