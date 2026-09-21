// src/app/sandbox/unit3/page.tsx
'use client';

import React, { useState } from 'react';
import { Unit3CelebrationModal } from '../../../components/Unit3CelebrationModal';
import { Drum, Play, Volume2, VolumeX, ArrowLeft, Sliders } from 'lucide-react';
import Link from 'next/link';

export default function Unit3SandboxPage() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [testStartBeat, setTestStartBeat] = useState<number>(1);
  const [testShowTrophy, setTestShowTrophy] = useState<boolean>(false);

  const openGame = () => {
    setTestStartBeat(1);
    setTestShowTrophy(false);
    setIsOpen(true);
  };

  const openGoldenSphere = () => {
    setTestStartBeat(4);
    setTestShowTrophy(false);
    setIsOpen(true);
  };

  const openTrophyDirect = () => {
    setTestShowTrophy(true);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-white relative flex flex-col items-center justify-start p-4 sm:p-8 overflow-x-hidden select-none">
      {/* Background Soft Lighting Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e293b30_0%,#070d18_80%)] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-xl z-10 flex items-center justify-between mb-8">
        <Link
          href="/sandbox/unit"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Link>

        <span className="text-xs px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-mono">
          Unidad 3 • Percusión y Tempo
        </span>
      </div>

      {/* Central Card */}
      <div className="w-full max-w-xl z-10 flex flex-col items-center text-center">
        {/* Floating 3D Drum Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-[0_10px_30px_rgba(245,158,11,0.35)] mb-6 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center border border-yellow-100/30">
            <Drum className="w-10 h-10 text-amber-400 stroke-[2.5]" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          Cinemática de Percusión
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
          Las esferas 3D rebotan sobre el gran bombo orquestal al compás de 120 BPM. Córtalas con swipe en el aire para liberar el Trofeo Dorado de Baquetas.
        </p>

        {/* Primary Action Button */}
        <button
          onClick={openGame}
          className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 rounded-2xl text-slate-950 font-black text-lg shadow-[0_6px_0_#b45309] hover:shadow-[0_2px_0_#b45309] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 mb-4 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Iniciar Cinemática 3D (Completa)</span>
        </button>

        {/* Direct Element Iteration Buttons */}
        <div className="flex flex-wrap gap-2.5 w-full justify-center mb-8">
          <button
            onClick={openGoldenSphere}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-bold font-mono transition-all cursor-pointer"
          >
            Probar Esfera Dorada (Beat 4)
          </button>
          <button
            onClick={openTrophyDirect}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold font-mono transition-all cursor-pointer"
          >
            Ver Trofeo Final 3D
          </button>
        </div>

        {/* Minimalist Controls */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md text-left">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Ajustes Rápidos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BPM Slider */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60">
              <div className="flex justify-between items-center mb-1 text-xs font-mono">
                <span className="text-slate-400">Tempo:</span>
                <span className="text-amber-400 font-bold">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                step="5"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Mute Button */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Audio Percusivo</span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal Mount */}
      <Unit3CelebrationModal
        isOpen={isOpen}
        onContinue={() => setIsOpen(false)}
        bpm={bpm}
        isMuted={isMuted}
        testStartBeat={testStartBeat}
        testShowTrophy={testShowTrophy}
      />
    </div>
  );
}
