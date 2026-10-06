// src/components/unit4-flappy/Unit4CreditsModal.tsx
'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Award,
  RotateCcw,
} from 'lucide-react';
import { audioService } from '@/utils/audioService';

interface Unit4CreditsModalProps {
  onRestart: () => void;
  onExit?: () => void;
}

export const Unit4CreditsModal: React.FC<Unit4CreditsModalProps> = ({ onRestart, onExit }) => {
  const router = useRouter();
  const [isFinishedRolling, setIsFinishedRolling] = useState(false);
  const creditsScrollRef = useRef<HTMLDivElement | null>(null);
  // null hasta que se mide el contenido: la animación SOLO se monta con los
  // valores reales, así el primer texto aparece de inmediato en el borde
  // inferior (sin esperar a que suba desde una posición por defecto).
  const [creditsAnim, setCreditsAnim] = useState<{
    startY: number;
    endY: number;
    duration: number;
    ctaDelayMs: number;
    ctaTravel: number;
    ctaDuration: number;
  } | null>(null);
  const [ctaTriggered, setCtaTriggered] = useState(false);

  // Mide el contenido y calcula el recorrido para que el primer texto asome
  // al instante y la ÚLTIMA frase salga por completo antes del talón CTA.
  useLayoutEffect(() => {
    const el = creditsScrollRef.current;
    if (!el) return;
    const win = el.parentElement;
    const windowH = win ? win.clientHeight : window.innerHeight * 0.4;
    const contentH = el.scrollHeight;
    // Primer texto ya asoma por el borde inferior (sin espera).
    const startY = Math.max(0, windowH - 20);
    // Final: la última frase ya salió por arriba (sin recorrer de más, para
    // que el CTA aparezca justo después de que se va el último texto).
    const endY = -contentH - 16;
    const travel = startY - endY;
    // Velocidad constante y muy lenta (px/s): el scroll SIEMPRE es legible
    // sin importar cuánto contenido haya. Mínimo 26s.
    const duration = Math.max(26, Math.round(travel / 20));
    const speed = travel / duration;

    // Cuando la última frase ("Todos los que creyeron...") llega a la MITAD
    // de la franja, el CTA empieza a subir a la MISMA velocidad px/s: se
    // revela lento y queda arriba exacto cuando termina el último texto.
    const lastMidY = windowH * 0.5 - (contentH - 34);
    const ctaTravel = Math.max(24, lastMidY - endY);
    const ctaDuration = Math.max(0.8, ctaTravel / speed);
    const ctaDelayMs = Math.max(0, ((startY - lastMidY) / travel) * duration * 1000);
    setCreditsAnim({ startY, endY, duration, ctaDelayMs, ctaTravel, ctaDuration });
  }, []);

  // Lanzar confetti suave al iniciar creditos
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

  const handleCreditsEnd = () => {
    setIsFinishedRolling(true);
    audioService.playSuccessBellSound();
    try {
      confetti({
        particleCount: 70,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#eab308', '#ffffff'],
      });
    } catch (e) {}
  };

  const handleNavigateToCertification = () => {
    audioService.playClickSound();
    if (onExit) onExit();
    router.push('/certification');
  };

  const handleRestart = () => {
    audioService.playClickSound();
    if (onExit) onExit();
    else onRestart();
  };

  // Programa el arranque del CTA justo cuando la última frase llega al medio
  useEffect(() => {
    if (!creditsAnim) return;
    if (isFinishedRolling) return;
    const t = window.setTimeout(
      () => setCtaTriggered(true),
      creditsAnim.ctaDelayMs
    );
    return () => window.clearTimeout(t);
  }, [creditsAnim, isFinishedRolling]);

  const ctaNatural = ctaTriggered && !!creditsAnim;
  const ctaInitialY = ctaNatural ? creditsAnim!.ctaTravel : 220;
  const ctaTransition = ctaNatural
    ? { duration: creditsAnim!.ctaDuration, ease: 'linear' as const }
    : { duration: 0.85, ease: 'easeOut' as const };

  return (
    <div className="fixed inset-0 z-[250] pointer-events-auto flex flex-col justify-between overflow-hidden select-none">
      {/* ZERO dark overlays: the game canvas, bright blue sky & golden cup stay 100% untouched */}

      {/* Phase 1: Rolling Credits STRICTLY bounded between bottom and BEFORE the cup */}
      <AnimatePresence>
        {!isFinishedRolling && (
          <div
            className="absolute left-0 right-0 top-[47%] bottom-[13%] overflow-hidden pointer-events-none z-20 flex justify-center"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            {/* Pasada de medición: oculta para medir el alto del contenido */}
            {!creditsAnim && (
              <div
                ref={creditsScrollRef}
                aria-hidden
                className="pointer-events-none opacity-0 w-full max-w-sm px-4 text-center space-y-10 py-6"
              >
                <CreditsBlocks />
              </div>
            )}
            {/* Pasada de animación: crawl lento (22s) desde abajo */}
            {creditsAnim && (
              <motion.div
                key="credits-crawl"
                initial={{ y: creditsAnim.startY }}
                animate={{ y: creditsAnim.endY }}
                transition={{ duration: creditsAnim.duration, ease: 'linear' }}
                onAnimationComplete={handleCreditsEnd}
                className="w-full max-w-sm px-4 text-center space-y-10 py-6"
              >
                <CreditsBlocks />
              </motion.div>
            )}
          </div>
              )}
      </AnimatePresence>

      {/* Spacer so the CTA card docks in the bottom portion of screen */}
      <div className="flex-1 pointer-events-none" />

      {/* Phase 2: Fixed Official Recognition CTA Card (Academia View Design System) */}
      <AnimatePresence>
        {(isFinishedRolling || ctaTriggered) && (
          <motion.div
            initial={{ opacity: 0, y: ctaInitialY }}
            animate={{ opacity: 1, y: 0 }}
            transition={ctaTransition}
            className="relative z-30 w-full pb-3 sm:pb-4"
          >
            {/* Pasto con varios arbustos DETRÁS del CTA (colores del juego) */}
            <div aria-hidden className="pointer-events-none absolute -bottom-2 left-0 right-0 z-10">
              {/* Tierra */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-[#92400e] to-[#451a03]" />
              {/* Pasto */}
              <div className="h-24 w-full bg-gradient-to-b from-[#84cc16] via-[#4d7c0f] to-[#365314]" />
              {/* Arbustos */}
              <div className="absolute -top-4 left-[2%] h-14 w-20 rounded-[50%] bg-[#84cc16] shadow-[inset_-8px_-10px_0_rgba(0,0,0,0.18)]" />
              <div className="absolute -top-7 left-[15%] h-16 w-24 rounded-[50%] bg-[#4d7c0f] shadow-[inset_-10px_-12px_0_rgba(0,0,0,0.22)]" />
              <div className="absolute -top-3 left-[34%] h-11 w-16 rounded-[50%] bg-[#65a30d]" />
              <div className="absolute -top-2 right-[36%] h-11 w-16 rounded-[50%] bg-[#3f6212] shadow-[inset_-6px_-8px_0_rgba(0,0,0,0.2)]" />
              <div className="absolute -top-7 right-[12%] h-16 w-24 rounded-[50%] bg-[#4d7c0f] shadow-[inset_-10px_-12px_0_rgba(0,0,0,0.22)]" />
              <div className="absolute -top-3 right-[2%] h-14 w-20 rounded-[50%] bg-[#65a30d]" />
            </div>
            <div className="relative z-30 w-full max-w-sm sm:max-w-md mx-auto px-4">
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
                  {/* Primary Gold Button */}
                  <button
                    onClick={handleNavigateToCertification}
                    className="w-full py-3 px-4 rounded-xl font-heading font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Certificarme ahora</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>

                  {/* Secondary Button (subrayado por debajo) */}
                  <button
                    onClick={handleRestart}
                    className="w-full py-1.5 px-3 text-xs font-bold font-heading text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    <span className="underline underline-offset-4">Volver a la Academia</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreditsBlocks: React.FC = () => {
  return (
    <>
      {/* 1. Logro & Felicitación (Styled like "Grítale al pato para hacerlo volar") */}
      <div className="space-y-2">
        <div className="text-xs sm:text-sm font-black tracking-widest uppercase text-amber-300 drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
          ★ MÓDULO 4 SUPERADO CON ÉXITO ★
        </div>
        <div className="text-2xl sm:text-3xl font-black font-heading text-white tracking-wide drop-shadow-[0_2px_0_rgba(69,26,3,0.85)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          ¡Felicidades por Graduarte!
        </div>
        <div className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed max-w-xs mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Has culminado con éxito todo el ciclo formativo de la Academia. Hoy entiendes tu instrumento y sabes cómo colocar cada sonido en su lugar con precisión clínica.
        </div>
      </div>

      {/* 2. Reflexión Pedagógica con Humor */}
      <div className="space-y-2.5 max-w-xs mx-auto">
        <div className="text-xs font-black tracking-wider uppercase text-amber-300 drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
          UN CONSEJO DE TUS PROFESORES
        </div>
        <div className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Nunca olvides que la seguridad al cantar no se compra; se construye con paciencia, constancia y amor por tu voz.
        </div>
        <div className="text-xs sm:text-sm font-extrabold text-amber-200 italic leading-relaxed drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
          «La proxima vez que tomes un microfono y sientas nervios... recuerda que si tiembla un poquito, siempre puedes fingir que es un vibrato profesional.»
        </div>
      </div>

      {/* 3. Créditos Oficiales de Producción */}
      <div className="space-y-3.5 max-w-xs mx-auto py-2">
        <div className="text-xs font-black tracking-widest uppercase text-amber-300 drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
          CRÉDITOS OFICIALES
        </div>
        <div className="space-y-2.5">
          <div>
            <span className="text-amber-200/90 block text-[11px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
              Intérprete Estrella
            </span>
            <span className="text-white text-base sm:text-lg font-black drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
              Tú
            </span>
          </div>
          <div>
            <span className="text-amber-200/90 block text-[11px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
              Dirección Pedagógica
            </span>
            <span className="text-white text-sm sm:text-base font-black drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
              Academia Musical La Clave
            </span>
          </div>
          <div>
            <span className="text-amber-200/90 block text-[11px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
              Tecnología & Evaluación
            </span>
            <span className="text-emerald-300 text-sm sm:text-base font-black drop-shadow-[0_2px_0_rgba(69,26,3,0.85)]">
              AfinApp Engine
            </span>
          </div>
          <div>
            <span className="text-amber-200/90 block text-[11px] font-black uppercase tracking-wider drop-shadow-[0_1px_0_rgba(69,26,3,0.85)]">
              Fans Número Uno
            </span>
            <span className="text-white text-xs sm:text-sm font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Todos los que creyeron en tu proceso
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

