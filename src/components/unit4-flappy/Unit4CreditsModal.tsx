// src/components/unit4-flappy/Unit4CreditsModal.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Award,
  CheckCircle2,
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

  useEffect(() => {
    // Ráfaga celebratoria de confeti dorado y esmeralda al emerger los créditos
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#ffffff'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  const handleNavigateToCertification = () => {
    audioService.playClickSound();
    router.push('/certification');
  };

  const handleRestart = () => {
    audioService.playClickSound();
    onRestart();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-700 select-none">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-950/90 border border-amber-500/40 p-5 sm:p-6 shadow-[0_0_80px_rgba(245,158,11,0.25)] text-center space-y-4 scrollbar-thin scrollbar-thumb-amber-500/20">
        {/* Header Icon & Trophy */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
            <Trophy className="w-7 h-7" />
          </div>
        </div>

        {/* 1. Logro & Felicitación */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black tracking-widest uppercase text-amber-400">
            ¡Módulo 4 Superado con Éxito!
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
            ¡Felicidades por Graduarte!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
            Has culminado con éxito todo el ciclo formativo de la Academia. Hoy entiendes tu instrumento y sabes cómo colocar cada sonido en su lugar con precisión clínica.
          </p>
        </div>

        {/* 2. Reflexión Pedagógica con Humor */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-200/90 leading-relaxed text-left space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Un consejo de tus profesores:</span>
          </div>
          <p>
            Nunca olvides que la seguridad al cantar no se compra; se construye con paciencia, constancia y amor por tu voz.
          </p>
          <p className="text-amber-100 font-semibold italic">
            La próxima vez que tomes un micrófono y sientas nervios... recuerda que si tiembla un poquito, siempre puedes fingir que es un vibrato profesional. 😉
          </p>
        </div>

        {/* 3. Créditos Oficiales */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5 space-y-2 text-left text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-1">
            Créditos de Producción
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Intérprete Estrella:</span>
              <span className="font-bold text-amber-300">Tú</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Dirección Pedagógica:</span>
              <span className="font-bold text-white">Academia Musical La Clave</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">• Tecnología & Evaluación:</span>
              <span className="font-bold text-emerald-400">AfinApp</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">• Fans Número Uno:</span>
              <span className="font-medium text-slate-300">Todos los que creyeron en tu proceso</span>
            </div>
          </div>
        </div>

        {/* 4. Bloque de Certificación & Botón Principal */}
        <div className="rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-600/10 border border-amber-500/30 p-4 space-y-2.5 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>¿Listo para el reconocimiento oficial?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Si deseas certificarte con la <strong>Academia Musical La Clave</strong> y recibir tu diploma oficial de graduación, realiza tu examen final para comprobar y avalar todas tus habilidades vocales.
          </p>

          <Button
            onClick={handleNavigateToCertification}
            className="w-full h-11 rounded-2xl font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <GraduationCap className="w-4 h-4 text-slate-950" />
            <span>Presentar Examen Final & Certificarme</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Button>
        </div>

        {/* Botón Secundario */}
        <div className="pt-1">
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
    </div>
  );
};
