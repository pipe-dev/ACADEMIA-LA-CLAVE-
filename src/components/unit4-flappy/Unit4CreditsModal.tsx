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
import { Button } from '@/components/ui/button';
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

      {/* Top Controls: Skip button during rolling credits */}
      <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-widest uppercase">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Graduación La Clave</span>
        </div>

        {!isFinishedRolling && (
          <button
            onClick={() => {
              audioService.playClickSound();
              handleCreditsEnd();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/20 hover:border-amber-400/50 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-md active:scale-95 pointer-events-auto"
          >
            <span>Saltar créditos</span>
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
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

      {/* Phase 2: Fixed Official Recognition CTA Card (Fades in once credits finish) */}
      <AnimatePresence>
        {isFinishedRolling && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-30 w-full max-w-md mx-auto px-4 pb-6 sm:pb-8"
          >
            <div className="rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-amber-500/40 p-5 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>¿Listo para el reconocimiento oficial?</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-sm mx-auto">
                Si deseas certificarte con la <strong>Academia Musical La Clave</strong> y recibir tu diploma oficial de graduación, realiza tu examen final para comprobar y avalar todas tus habilidades vocales.
              </p>

              {/* Botón Principal: Certificación */}
              <Button
                onClick={handleNavigateToCertification}
                className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <GraduationCap className="w-5 h-5 text-slate-950" />
                <span>Presentar Examen Final & Certificarme</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Button>

              {/* Botón Secundario: Volver */}
              <div>
                <Button
                  variant="ghost"
                  onClick={handleRestart}
                  className="text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl gap-1.5 cursor-pointer py-1.5 px-4 h-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Volver a la Academia</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
