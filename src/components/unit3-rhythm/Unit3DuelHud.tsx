// src/components/unit3-rhythm/Unit3DuelHud.tsx
// Overlays y HUD de duelo para Unit 3 Tambor con Esferas (< 280 lineas)

'use client';

import React from 'react';
import { Award, ShieldAlert, Drum, Zap, Timer, Flame, Smartphone, Users } from 'lucide-react';

interface Unit3DuelHudProps {
  phase: 'ready' | 'playing' | 'finished';
  playerCuts: number;
  opponentCuts: number;
  opponentName: string;
  opponentTargetCuts: number;
  timeLeft: number;
  bannerNotice: string | null;
  mode: 'ghost_async' | 'realtime_p2p' | 'local';
  localTurn?: 1 | 2;
  p1LocalCuts?: number;
  showLocalTransitionOverlay?: boolean;
  showMatchOverOverlay: boolean;
  p1Won: boolean;
  isTie: boolean;
  onStartGame: () => void;
  onExit: () => void;
  onStartLocalTurn2?: () => void;
  onFinishDuel: () => void;
}

export const Unit3DuelHud: React.FC<Unit3DuelHudProps> = ({
  phase,
  playerCuts,
  opponentCuts,
  opponentName,
  opponentTargetCuts,
  timeLeft,
  bannerNotice,
  mode,
  localTurn = 1,
  p1LocalCuts = 0,
  showLocalTransitionOverlay = false,
  showMatchOverOverlay,
  p1Won,
  isTie,
  onStartGame,
  onExit,
  onStartLocalTurn2,
  onFinishDuel,
}) => {
  const isLocal = mode === 'local';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = timeLeft <= 10 && phase === 'playing';

  const leftLabel = isLocal ? (localTurn === 1 ? 'TU (J1)' : `${opponentName.slice(0, 10)} (J2)`) : 'TU';
  const rightLabel = isLocal ? (localTurn === 1 ? `${opponentName.slice(0, 10)} (J2)` : 'J1 (TU)') : opponentName;
  const rightDisplay = isLocal && localTurn === 1 ? 'Espera' : opponentCuts;

  return (
    <>
      {/* Barra superior de Duelo: Marcador y Reloj de 1 Minuto */}
      <div className="absolute top-4 left-4 right-4 z-[210] flex items-center justify-between pointer-events-none">
        {/* Tu Contador / Jugador Activo */}
        <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-500/40 shadow-lg">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-heading font-black text-xs text-white shadow-xs">
            {isLocal ? `J${localTurn}` : 'TU'}
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold text-amber-400 leading-none">
              {leftLabel}
            </div>
            <div className="font-heading font-black text-xl text-white leading-none mt-0.5">
              {playerCuts}
            </div>
          </div>
        </div>

        {/* Cronometro Central de 1 Minuto */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-lg transition-colors ${
            isTimeCritical
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-black/60 border-slate-700/80 text-white'
          }`}
        >
          <Timer className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-amber-400'}`} />
          <span className="font-mono font-black text-base tracking-wider">
            {formattedTime}
          </span>
          <span className="text-[10px] font-heading font-bold text-slate-400 uppercase hidden sm:inline">
            {isLocal ? `T${localTurn}` : '1 MIN'}
          </span>
        </div>

        {/* Contador Rival / Turno Esperando */}
        <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-purple-500/40 shadow-lg">
          <div>
            <div className="text-[10px] uppercase font-extrabold text-purple-400 text-right leading-none">
              {rightLabel}
            </div>
            <div className="font-heading font-black text-xl text-white text-right leading-none mt-0.5">
              {rightDisplay}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-heading font-black text-xs text-white shadow-xs">
            {isLocal ? (localTurn === 1 ? 'J2' : 'J1') : opponentName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Banner de Estado en Vivo */}
      {bannerNotice && phase === 'playing' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[210] pointer-events-none animate-bounce bg-purple-950/90 border border-purple-400 text-purple-200 text-xs font-heading font-black px-4 py-1.5 rounded-full shadow-xl">
          {bannerNotice}
        </div>
      )}

      {/* Overlay de Inicio */}
      {phase === 'ready' && (
        <div className="absolute inset-0 z-[220] flex flex-col items-center justify-center p-6 bg-black/50 backdrop-blur-[3px]">
          <div className="bg-[#102034]/95 border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl pointer-events-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-md">
              {isLocal ? <Smartphone className="w-7 h-7" /> : <Drum className="w-7 h-7" />}
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white">
                {isLocal ? `Turno ${localTurn}: ${leftLabel}` : 'Duelo de Tambor y Ritmo'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isLocal
                  ? localTurn === 1
                    ? `Corta tantas esferas como puedas en 60 segundos. Luego le pasaras el celular a ${opponentName}.`
                    : `Tienes 60 segundos para superar la marca de ${p1LocalCuts} esferas de Jugador 1.`
                  : mode === 'ghost_async'
                  ? `Desafio de 1 minuto contra el record de ${opponentName} (${opponentTargetCuts} esferas). El que corte mas esferas gana.`
                  : `Desafio en vivo de 1 minuto contra ${opponentName}. El que corte mas esferas gana.`}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 text-left text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Instrucciones:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Desliza tu dedo o raton sobre las esferas que rebotan para cortarlas. Las doradas otorgan cortes dobles.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExit();
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-heading font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartGame();
                }}
                className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-heading font-black text-xs shadow-md cursor-pointer"
              >
                {isLocal ? `Comenzar Turno ${localTurn} (60s)` : 'Comenzar Duelo (60s)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Transicion Local: Pasa el Celular */}
      {showLocalTransitionOverlay && (
        <div className="absolute inset-0 z-[225] flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md pointer-events-auto animate-fadeIn">
          <div className="bg-[#102034] border border-amber-500/50 p-6 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
              <Smartphone className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400">
                Turno 1 Finalizado (60s)
              </span>
              <h3 className="font-heading font-black text-2xl text-white mt-1">
                Pasa el celular a {opponentName}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                Jugador 1 logro cortar <span className="text-amber-400 font-bold">{p1LocalCuts} esferas</span>. Ahora Jugador 2 tiene 60 segundos para superarlo.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Marca a batir</div>
              <div className="font-heading font-black text-3xl text-amber-400 mt-0.5">
                {p1LocalCuts} <span className="text-sm font-bold text-slate-300">esferas</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartLocalTurn2}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-heading font-black text-sm shadow-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Comenzar Turno de {opponentName} (60s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay de Cierre del Duelo tras Cumplirse el Tiempo */}
      {showMatchOverOverlay && (
        <div className="absolute inset-0 z-[230] flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-sm pointer-events-auto animate-fadeIn">
          <div className="bg-[#102034] border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
                p1Won
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isTie
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {p1Won ? (
                <Award className="w-9 h-9" />
              ) : isTie ? (
                <Flame className="w-9 h-9" />
              ) : (
                <ShieldAlert className="w-9 h-9" />
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                Fin del Duelo de Tambor
              </span>
              <h3 className="font-heading font-black text-2xl text-white mt-0.5">
                {isLocal
                  ? p1Won
                    ? 'VICTORIA DE JUGADOR 1 (TU)'
                    : isTie
                    ? 'EMPATE EN EL TAMBOR'
                    : `VICTORIA DE ${opponentName.toUpperCase()}`
                  : p1Won
                  ? 'VICTORIA EN EL DUELO'
                  : isTie
                  ? 'EMPATE EN EL TAMBOR'
                  : 'Buen Intento'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isLocal
                  ? p1Won
                    ? 'Jugador 1 corto mas esferas en este celular (+50 XP)'
                    : isTie
                    ? `Ambos cortaron exactamente ${playerCuts} esferas (+35 XP)`
                    : `${opponentName} supero la marca en este celular (+50 XP)`
                  : p1Won
                  ? `Cortaste mas esferas que ${opponentName} en 60 segundos (+50 XP)`
                  : isTie
                  ? `Ambos empataron con ${playerCuts} esferas (+35 XP)`
                  : `${opponentName} corto mas esferas en este minuto (+20 XP por practica)`}
              </p>
            </div>

            {/* Comparativa final */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">
                  {isLocal ? 'J1 (TU)' : 'Tus Cortes'}
                </span>
                <span className="font-heading font-black text-2xl text-white">
                  {isLocal ? p1LocalCuts : playerCuts} esferas
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-purple-400 uppercase block">
                  {isLocal ? `J2 (${opponentName})` : opponentName}
                </span>
                <span className="font-heading font-black text-2xl text-white">
                  {isLocal ? playerCuts : opponentCuts} esferas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onFinishDuel}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-heading font-black text-xs shadow-md cursor-pointer"
            >
              Ver Resumen y Reclamar XP
            </button>
          </div>
        </div>
      )}
    </>
  );
};
