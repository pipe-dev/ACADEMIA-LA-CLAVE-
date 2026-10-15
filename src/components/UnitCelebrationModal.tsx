'use client';
import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../utils/audioService';
import { useBalloonClouds } from './unit1-celebration/balloonCloudsCanvas';
import {
  useBalloonConfetti,
  triggerBackgroundConfettiBurst
} from './unit1-celebration/balloonConfettiCanvas';
import { BalloonVessel } from './unit1-celebration/BalloonVessel';

interface UnitCelebrationModalProps {
  isOpen: boolean;
  onContinueToUnit2: () => void;
}

export const UnitCelebrationModal: React.FC<UnitCelebrationModalProps> = ({
  isOpen,
  onContinueToUnit2
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [taps, setTaps] = useState<number>(0);
  const [isPopped, setIsPopped] = useState<boolean>(false);
  const [showUnit2Button, setShowUnit2Button] = useState<boolean>(false);
  const [isWindSweeping, setIsWindSweeping] = useState<boolean>(false);
  const isWindSweepingRef = useRef<boolean>(false);

  useEffect(() => {
    isWindSweepingRef.current = isWindSweeping;
  }, [isWindSweeping]);

  // Guaranteed clean state reset every time celebration modal opens
  useEffect(() => {
    if (isOpen) {
      setTaps(0);
      setIsPopped(false);
      setShowUnit2Button(false);
      setIsWindSweeping(false);
      isWindSweepingRef.current = false;
    }
  }, [isOpen]);

  // Dual-Canvas Cartoon Clouds & Particles Engine
  useBalloonClouds(canvasRef, fgCanvasRef, isOpen);

  // 3,400-piece Settling & Sweeping Confetti Wall Engine
  useBalloonConfetti(confettiCanvasRef, isOpen, isPopped, isWindSweepingRef);

  // Handle Balloon Tap Interaction
  const handleBalloonClick = () => {
    if (isPopped || taps >= 6 || isWindSweeping) return;

    const nextTap = taps + 1;
    setTaps(nextTap);

    if (nextTap <= 3) {
      audioService.playRubberStretchSound(nextTap);
    } else if (nextTap === 4) {
      audioService.playDryExplosionPopSound(1);
    } else if (nextTap === 5) {
      audioService.playDryExplosionPopSound(2);
    } else if (nextTap === 6) {
      audioService.playRubberStrainOverloadSound();

      setTimeout(() => {
        audioService.playDryExplosionPopSound(3);
        setIsPopped(true);
        triggerBackgroundConfettiBurst();

        setTimeout(() => {
          setShowUnit2Button(true);
        }, 450);
      }, 420);
    }
  };

  // Handle Continuar a la Unidad 2 Click (Wind Sweep Transition)
  const handleContinueClick = () => {
    if (isWindSweeping) return;
    setIsWindSweeping(true);
    audioService.playWindWhooshSound();

    setTimeout(() => {
      onContinueToUnit2();
    }, 750);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] w-screen h-screen overflow-hidden select-none bg-[#f59e0b] flex flex-col items-center justify-center p-6 transition-opacity duration-700 ${
        isWindSweeping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Canvas Engine (z-index 0) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Foreground Canvas Overlay Engine (z-index 15) */}
      <canvas ref={fgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-15" />

      {/* Persistent Solid Floor Confetti Block Canvas (z-index 20 - BEHIND BUTTON) */}
      <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

      {/* Centerpiece Area: Balloon / Unit 2 Button (z-index 50) */}
      <div className="relative z-50 flex flex-col items-center justify-center text-center my-auto w-full max-w-md pointer-events-auto">
        
        {/* BALLOON VESSEL (Only visible while NOT popped) */}
        <BalloonVessel
          isOpen={isOpen}
          taps={taps}
          isPopped={isPopped}
          isWindSweeping={isWindSweeping}
          onBalloonClick={handleBalloonClick}
        />

        {/* Unit 2 Container Button (z-index 50) */}
        {isPopped && showUnit2Button && (
          <div className="relative z-50 animate-bounce-subtle flex flex-col items-center justify-center w-full max-w-sm px-4">
            <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.2),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-200 dark:border-slate-800">
              <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#e2e8f0] dark:bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(15,23,42,0.35),_inset_0_-2px_4px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-300/40 dark:border-slate-900">
                <button
                  onClick={handleContinueClick}
                  className="w-full flex items-center justify-center px-6 py-3.5 rounded-full transition-all duration-75 relative border border-transparent btn-3d bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-200 drop-shadow-sm leading-tight">
                      UNIDAD 2
                    </span>
                    <span className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                      CONTINUAR A LA UNIDAD 2
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
