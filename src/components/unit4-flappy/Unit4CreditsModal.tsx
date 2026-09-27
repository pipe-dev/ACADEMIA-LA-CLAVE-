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
} from 'lucide-react';
import { audioService } from '@/utils/audioService';

interface Unit4CreditsModalProps {
  onRestart: () => void;
}

export const Unit4CreditsModal: React.FC<Unit4CreditsModalProps> = ({ onRestart }) => {
  const router = useRouter();
  // 0: Logro & Felicitación, 1: Humor pedagógico, 2: Créditos de producción, 3: Reconocimiento final fijo
  const [currentBlock, setCurrentBlock] = useState(0);

  // Subtle celebratory sparkles when credits begin
  useEffect(() => {
    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#ffffff'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  // Sequential presentation: each block stays still for ~2.2s, then transitions to next
  useEffect(() => {
    if (currentBlock < 3) {
      const timer = setTimeout(() => {
        setCurrentBlock((prev) => {
          const next = prev + 1;
          if (next === 3) {
            try {
              confetti({
                particleCount: 80,
                spread: 90,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#fbbf24', '#eab308', '#ffffff'],
              });
            } catch (e) {}
          }
          return next;
        });
      }, 2600); // 2.2s read time + animation buffer
      return () => clearTimeout(timer);
    }
  }, [currentBlock]);

  const handleSkip = () => {
    audioService.playClickSound();
    setCurrentBlock(3);
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
      {/* ZERO dark overlays: the game canvas, bright blue sky & golden cup stay 100% untouched */}

      {/* Discreet skip button in top-left corner */}
      {currentBlock < 3 && (
        <button
          onClick={handleSkip}
          className="absolute top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 text-[#451a03] text-xs font-black drop-shadow-sm transition-all cursor-pointer shadow-sm active:scale-95 pointer-events-auto"
        >
          <span>Saltar</span>
          <FastForward className="w-3.5 h-3.5 text-amber-700" />
        </button>
      )}

      {/* Phase 1: Sequential Credit Blocks (Stay still for 2s in lower sky, then leave) */}
      {currentBlock < 3 && (
        <div className="absolute left-0 right-0 top-[48%] bottom-[13%] flex items-center justify-center pointer-events-none z-20">
          <AnimatePresence mode="wait">
            {currentBlock === 0 && (
              <motion.div
                key="credit-block-0"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-sm px-4 text-center space-y-2 select-none"
              >
                <div className="text-xs sm:text-sm font-black tracking-widest uppercase text-amber-300 drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
                  ★ MÓDULO 4 SUPERADO CON ÉXITO ★
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white tracking-wide drop-shadow-[0_2px_0_rgba(69,26,3,0.85)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                  ¡Felicidades por Graduarte!
                </div>
                <div className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed max-w-xs mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Has culminado con éxito todo el ciclo formativo de la Academia. Hoy entiendes tu instrumento y sabes cómo colocar cada sonido en su lugar con precisión clínica.
                </div>
              </motion.div>
            )}

            {currentBlock === 1 && (
              <motion.div
                key="credit-block-1"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-sm px-4 text-center space-y-2 select-none"
              >
                <div className="text-xs font-black tracking-wider uppercase text-amber-300 drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
                  ✨ UN CONSEJO DE TUS PROFESORES ✨
                </div>
                <div className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Nunca olvides que la seguridad al cantar no se compra; se construye con paciencia, constancia y amor por tu voz.
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-200 italic leading-relaxed drop-shadow-[0_2px_0_rgba(69,26,3,0.85)] pt-0.5">
                  «La próxima vez que tomes un micrófono y sientas nervios... recuerda que si tiembla un poquito, siempre puedes fingir que es un vibrato profesional.» 😉
                </div>
              </motion.div>
            )}

            {currentBlock === 2 && (
              <motion.div
                key="credit-block-2"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-sm px-4 text-center space-y-2 select-none"
              >
                <div className="text-xs font-black tracking-widest uppercase text-amber-300 drop-shadow-[0_2px_0_rgba(69,26,3,0.85)] mb-0.5">
                  CRÉDITOS OFICIALES
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-amber-200/90 block text-[10px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
                      Intérprete Estrella
                    </span>
                    <span className="text-white text-base font-black drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
                      Tú
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-200/90 block text-[10px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
                      Dirección Pedagógica
                    </span>
                    <span className="text-white text-xs sm:text-sm font-black drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
                      Academia Musical La Clave
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-200/90 block text-[10px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
                      Tecnología & Evaluación
                    </span>
                    <span className="text-emerald-300 text-xs sm:text-sm font-black drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
                      AfinApp
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-200/90 block text-[10px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
                      Fans Número Uno
                    </span>
                    <span className="text-white text-xs font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      Todos los que creyeron en tu proceso
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Spacer so the CTA card docks in the bottom portion of screen */}
      <div className="flex-1 pointer-events-none" />

      {/* Phase 2: Fixed Official Recognition CTA Card (Academia View Design System) */}
      <AnimatePresence>
        {currentBlock === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
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
