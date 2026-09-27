// src/components/unit4-flappy/Unit4CreditsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Award,
  FastForward,
  GraduationCap,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { audioService } from '@/utils/audioService';

interface Unit4CreditsModalProps {
  onRestart: () => void;
}

export const Unit4CreditsModal: React.FC<Unit4CreditsModalProps> = ({ onRestart }) => {
  const router = useRouter();
  const [isFinishedRolling, setIsFinishedRolling] = useState(false);

  // Trigger initial subtle sparkles when credits begin
  useEffect(() => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#ffffff'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  // When rolling finishes and CTA card appears, fire celebratory confetti
  const handleCreditsEnd = () => {
    setIsFinishedRolling(true);
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#eab308', '#ffffff'],
      });
    } catch (e) {}
  };

  const handleNavigateToCertification = () => {
    audioService.playClickSound();
    router.push('/certification');
  };

  const handleRestart = () => {
    audioService.playClickSound();
    onRestart();
  };

  return (
    <div className="fixed inset-0 z-[250] pointer-events-auto flex flex-col justify-between overflow-hidden select-none">
      {/* Background cinematic vignette (allows canvas sky & golden trophy to remain visible) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Top Controls (matching Academia View header badges) */}
      <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#102034]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-[#4648d4] dark:text-[#c0c1ff] text-[11px] font-bold tracking-widest uppercase shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Graduación La Clave</span>
        </div>

        {!isFinishedRolling && (
          <button
            onClick={() => {
              audioService.playClickSound();
              handleCreditsEnd();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#102034]/90 hover:bg-white dark:hover:bg-[#102034] backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 pointer-events-auto"
          >
            <span>Saltar créditos</span>
            <FastForward className="w-3.5 h-3.5 text-amber-500" />
          </button>
        )}
      </div>

      {/* Phase 1: Rolling Movie Credits (Passes from bottom to top, fading out) */}
      <AnimatePresence>
        {!isFinishedRolling && (
          <div
            className="absolute inset-0 z-20 flex justify-center overflow-hidden pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)',
            }}
          >
            <motion.div
              initial={{ y: '100vh' }}
              animate={{ y: '-120%' }}
              transition={{
                duration: 16,
                ease: 'linear',
              }}
              onAnimationComplete={handleCreditsEnd}
              className="w-full max-w-md px-6 text-center space-y-12 self-start py-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
            >
              {/* 1. Logro & Felicitación */}
              <div className="space-y-3">
                <span className="text-xs sm:text-sm font-black tracking-[0.25em] uppercase text-amber-400">
                  ★ MÓDULO 4 SUPERADO CON ÉXITO ★
                </span>
                <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  ¡Felicidades por Graduarte!
                </h1>
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed max-w-sm mx-auto drop-shadow-md">
                  Has culminado con éxito todo el ciclo formativo de la Academia. Hoy entiendes tu instrumento y sabes cómo colocar cada sonido en su lugar con precisión clínica.
                </p>
              </div>

              {/* 2. Reflexión Pedagógica con Humor */}
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Un consejo de tus profesores</span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed drop-shadow-md">
                  Nunca olvides que la seguridad al cantar no se compra; se construye con paciencia, constancia y amor por tu voz.
                </p>
                <p className="text-sm sm:text-base text-amber-300 font-semibold italic drop-shadow-md">
                  «La próxima vez que tomes un micrófono y sientas nervios... recuerda que si tiembla un poquito, siempre puedes fingir que es un vibrato profesional.» 😉
                </p>
              </div>

              {/* 3. Créditos Oficiales de Producción */}
              <div className="space-y-4 max-w-xs mx-auto border-t border-b border-amber-400/30 py-6">
                <div className="text-xs font-black tracking-[0.2em] uppercase text-amber-400">
                  CRÉDITOS DE PRODUCCIÓN
                </div>
                <div className="space-y-2 text-sm text-slate-100 font-medium">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">Intérprete Estrella</span>
                    <span className="font-bold text-lg text-amber-300">Tú</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">Dirección Pedagógica</span>
                    <span className="font-bold text-white">Academia Musical La Clave</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">Tecnología & Evaluación</span>
                    <span className="font-bold text-emerald-400">AfinApp</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">Fans Número Uno</span>
                    <span className="font-medium text-slate-200">Todos los que creyeron en tu proceso</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spacer so the CTA card docks in the bottom portion of screen */}
      <div className="flex-1 pointer-events-none" />

      {/* Phase 2: Fixed Official Recognition CTA Card (Academia View Design System) */}
      <AnimatePresence>
        {isFinishedRolling && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-30 w-full max-w-sm sm:max-w-md mx-auto px-4 pb-3 sm:pb-4"
          >
            {/* 3D Sunken Socket Frame (Identical to Academia Unit Card & Dialogs) */}
            <div className="w-full p-1 sm:p-1.5 rounded-3xl bg-[#f1f5f9] dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.15),_inset_0_-2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.8)]">
              {/* Inner White/Navy Card (Identical to AcademiaView) */}
              <div className="w-full rounded-[22px] bg-white dark:bg-[#102034] p-4 sm:p-5 shadow-[0px_12px_28px_-6px_rgba(15,23,42,0.15)] border border-slate-200/70 dark:border-slate-800/80 text-center space-y-3">
                
                {/* Academia Icon Badge */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-sm">
                  <Award className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>

                {/* Typography matching Academia */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Reconocimiento Oficial
                  </span>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-[#0b1c30] dark:text-[#d3e4fe] leading-tight">
                    ¿Listo para el reconocimiento oficial?
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Si deseas certificarte con la <strong className="font-bold text-slate-800 dark:text-slate-200">Academia Musical La Clave</strong> y recibir tu diploma oficial, realiza tu examen final para avalar tus habilidades.
                  </p>
                </div>

                {/* Action Buttons (3D Tactile Buttons matching Academia View) */}
                <div className="space-y-1.5 pt-0.5">
                  {/* Primary 3D Tactile Gold Button */}
                  <button
                    onClick={handleNavigateToCertification}
                    className="w-full py-3 px-4 rounded-xl font-heading font-black text-xs sm:text-sm bg-gradient-to-b from-[#ffe55c] via-[#f59e0b] to-[#92400e] text-white shadow-[0px_5px_0px_0px_rgba(100,45,10,1),0px_8px_12px_0px_rgba(245,158,11,0.4),inset_0px_3px_5px_rgba(255,255,255,0.7),inset_0px_-3px_5px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0px_1px_0px_0px_rgba(100,45,10,1)] cursor-pointer flex items-center justify-center gap-2 transition-all group"
                  >
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:rotate-6 transition-transform" />
                    <span>Presentar Examen Final & Certificarme</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Secondary Academia Button */}
                  <button
                    onClick={handleRestart}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-bold font-heading text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Volver a la Academia</span>
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
