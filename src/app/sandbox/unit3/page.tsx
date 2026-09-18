// src/app/sandbox/unit3/page.tsx
'use client';

import React, { useState } from 'react';
import { Unit3CelebrationModal } from '../../../components/Unit3CelebrationModal';
import { Drum, Play, Volume2, VolumeX, Sparkles, Sliders, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Unit3SandboxPage() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [forceVictory, setForceVictory] = useState<boolean>(false);
  const [forceTimeout, setForceTimeout] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<{
    lastOffsetMs: number;
    isOnBeat: boolean;
  }>({
    lastOffsetMs: 0,
    isOnBeat: false,
  });

  const handleOpen = () => {
    setForceVictory(false);
    setForceTimeout(false);
    setIsOpen(true);
  };

  const handleForceVictory = () => {
    setForceTimeout(false);
    setForceVictory(true);
    setIsOpen(true);
  };

  const handleForceTimeout = () => {
    setForceVictory(false);
    setForceTimeout(true);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col items-center justify-start p-4 sm:p-8 overflow-x-hidden select-none">
      {/* Background Military Technical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:28px_28px] opacity-60 pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-2xl z-10 flex items-center justify-between mb-6">
        <Link
          href="/sandbox/unit"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Sandbox Unidades</span>
        </Link>

        <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
          Unidad 3 • Cinemática Táctica
        </span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.4)] mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Drum className="w-8 h-8 text-amber-400 stroke-[2.5]" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
          Sandbox: Desactiva la Bomba
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
          Cinemática de finalización de la <strong>Unidad 3 ("Tempo y Coordinación")</strong>. Corta los cables con swipe
          táctil o ratón estilo <em>Fruit Ninja</em> al compás del metrónomo para salvar el circuito y desbloquear el Trofeo Dorado de Baquetas.
        </p>

        {/* Primary Action Button */}
        <button
          onClick={handleOpen}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-slate-950 font-black text-base sm:text-lg shadow-[0_6px_0_#0369a1] hover:shadow-[0_2px_0_#0369a1] hover:translate-y-[2px] transition-all flex items-center gap-2.5 mb-8 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Iniciar Cinemática (120 BPM)</span>
        </button>

        {/* Telemetry & Debug Control Center */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-md shadow-2xl text-left mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Panel de Configuración y Telemetría</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* BPM Slider */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
                <span className="text-slate-400">Tempo Metrónomo:</span>
                <span className="text-amber-400 font-bold">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                step="5"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>60 Largo</span>
                <span>120 Moderato (Default)</span>
                <span>160 Presto</span>
              </div>
            </div>

            {/* Mute Toggle */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="block text-xs font-mono text-slate-300 font-bold mb-0.5">
                  Audio Sintetizado
                </span>
                <span className="block text-[10px] text-slate-500">
                  Web Audio API (Ticks, Whoosh, Steam, Fanfarria)
                </span>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleForceVictory}
              className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Forzar Victoria (Trofeo)</span>
            </button>
            <button
              onClick={handleForceTimeout}
              className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Forzar Timeout (Puff Humo)</span>
            </button>
          </div>

          {/* Telemetry Indicator */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Último corte registrado:</span>
            {telemetry.lastOffsetMs > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Offset: {telemetry.lastOffsetMs}ms</span>
                {telemetry.isOnBeat ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ¡A tiempo!
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Fuera de beat
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-600">Aún sin cortes</span>
            )}
          </div>
        </div>
      </div>

      {/* Celebration Modal Mount */}
      <Unit3CelebrationModal
        isOpen={isOpen}
        onContinue={() => {
          setIsOpen(false);
          setForceVictory(false);
          setForceTimeout(false);
        }}
        initialBpm={bpm}
        isMuted={isMuted}
        debugForceVictory={forceVictory}
        debugForceTimeout={forceTimeout}
        onTelemetryUpdate={(data) => setTelemetry(data)}
      />
    </div>
  );
}
