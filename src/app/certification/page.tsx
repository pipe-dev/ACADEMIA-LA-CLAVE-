// src/app/certification/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  GraduationCap,
  Lock,
  Music,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { audioService } from '@/utils/audioService';
import { CautionTapeRibbon } from '@/components/ui/CautionTapeRibbon';

export default function CertificationPage() {
  const handleBack = () => {
    audioService.playClickSound();
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden select-none">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" onClick={handleBack}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-2xl bg-slate-900/80 border-white/10 text-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Volver a la Academia</span>
            </Button>
          </Link>

          <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            Certificación Oficial
          </span>
        </div>

        {/* Certificate Card Preview (with Caution Ribbon) */}
        <div className="relative rounded-3xl bg-slate-950/80 border border-amber-500/40 p-6 sm:p-10 shadow-[0_0_60px_rgba(245,158,11,0.15)] backdrop-blur-xl overflow-hidden text-center space-y-6">
          {/* Construction Caution Tape Ribbon */}
          <CautionTapeRibbon
            text="Disponible Pronto"
            angle="-rotate-[14deg]"
            size="md"
            className="-left-16 top-10"
          />

          {/* Certificate Header Banner */}
          <div className="space-y-2 pt-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
              <Award className="w-8 h-8" />
            </div>
            <div className="text-xs font-black tracking-widest uppercase text-amber-400/80">
              Academia Musical La Clave
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight text-white">
              Certificado de Maestría Vocal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Aval oficial de entrenamiento técnico en respiración, afinación tonal, ritmo y registro vocal.
            </p>
          </div>

          {/* Certificate Body Preview */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 sm:p-6 space-y-4 text-left">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Competencias Acreditadas:
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Control diafragmático & soporte</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Afinación cromática de precisión</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sincronización rítmica & compás</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Agilidad y flexibilidad de registro</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Verificación con AfinApp Engine
              </span>
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-amber-400" />
                Evaluación Final Requerida
              </span>
            </div>
          </div>

          {/* Explanation Notice */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-200/90 leading-relaxed text-center max-w-lg mx-auto">
            <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
            <p>
              Estamos preparando la mesa de evaluación y validación de exámenes junto con los profesores de la{' '}
              <strong>Academia Musical La Clave</strong>. ¡Muy pronto podrás rendir tu examen práctico final y reclamar tu diploma oficial certificado!
            </p>
          </div>

          {/* Action button back */}
          <div className="pt-2">
            <Link href="/" onClick={handleBack}>
              <Button className="w-full sm:w-auto px-8 h-12 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer">
                Entendido, volver a practicar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
