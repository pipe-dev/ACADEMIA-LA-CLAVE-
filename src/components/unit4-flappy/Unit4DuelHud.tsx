// src/components/unit4-flappy/Unit4DuelHud.tsx
// Overlays y HUD de duelo para Unit4DuelArena (< 280 lineas)

'use client';

import React from 'react';
import { Trophy, Volume2, Mic, Zap, ShieldAlert, Award, Smartphone, Users } from 'lucide-react';
import { Phase } from './unit4Types';

interface Unit4DuelHudProps {
  phase: Phase;
  playerScore: number;
  opponentScore: number;
  opponentName: string;
  opponentCrashed: boolean;
  opponentTargetScore: number;
  micActive: boolean;
  bannerNotice: string | null;
  mode: 'ghost_async' | 'realtime_p2p' | 'local';
  localTurn?: 1 | 2;
  p1LocalScore?: number;
  showLocalTransitionOverlay?: boolean;
  showMatchOverOverlay: boolean;
  p1Won: boolean;
  onStartGame: () => void;
  onExit: () => void;
  onStartLocalTurn2?: () => void;
  onFinishDuel: (playerScore: number, opponentScore: number, won: boolean) => void;
}

export const Unit4DuelHud: React.FC<Unit4DuelHudProps> = ({
  phase,
  playerScore,
  opponentScore,
  opponentName,
  opponentCrashed,
  opponentTargetScore,
  micActive,
  bannerNotice,
  mode,
  localTurn = 1,
  p1LocalScore = 0,
  showLocalTransitionOverlay = false,
  showMatchOverOverlay,
  p1Won,
  onStartGame,
  onExit,
  onStartLocalTurn2,
  onFinishDuel,
}) => {
  const isLocal = mode === 'local';
  const leftLabel = isLocal ? (localTurn === 1 ? 'TU (J1)' : `${opponentName.slice(0, 10)} (J2)`) : 'TU';
  const rightLabel = isLocal ? (localTurn === 1 ? `${opponentName.slice(0, 10)} (J2)` : 'J1 (TU)') : opponentName;
  const rightScoreDisplay = isLocal && localTurn === 1 ? 'Espera' : opponentScore;

  return (
    <>
      {/* Barra superior de Duelo: Marcador Comparativo en Vivo */}
      <div className="absolute top-4 left-4 right-4 z-[210] flex items-center justify-between pointer-events-none">
        {/* Tu Puntaje / Jugador Activo */}
        <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-500/40 shadow-lg">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-heading font-black text-xs text-white shadow-xs">
            {isLocal ? `J${localTurn}` : 'TU'}
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold text-amber-400 leading-none">
              {leftLabel}
            </div>
            <div className="font-heading font-black text-xl text-white leading-none mt-0.5">
              {playerScore}
            </div>
          </div>
        </div>

        {/* Badge Central de Modo */}
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-[11px] font-heading font-bold text-slate-300 flex items-center gap-1.5 shadow-md">
          {isLocal ? <Smartphone className="w-3.5 h-3.5 text-amber-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isLocal ? `Pasa Celular - Turno ${localTurn}` : 'Carrera Celeste 1v1'}</span>
        </div>

        {/* Puntaje Rival / Turno Esperando */}
        <div
          className={`flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-lg ${
            opponentCrashed ? 'border-red-500/40 opacity-80' : 'border-purple-500/40'
          }`}
        >
          <div>
            <div className="text-[10px] uppercase font-extrabold text-purple-400 text-right leading-none">
              {rightLabel}
            </div>
            <div className="font-heading font-black text-xl text-white text-right leading-none mt-0.5">
              {rightScoreDisplay}
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-black text-xs text-white shadow-xs ${
              opponentCrashed ? 'bg-red-600' : 'bg-purple-600'
            }`}
          >
            {isLocal ? (localTurn === 1 ? 'J2' : 'J1') : (opponentCrashed ? 'X' : opponentName.slice(0, 2).toUpperCase())}
          </div>
        </div>
      </div>

      {/* Indicador de Microfono Activo */}
      {micActive && phase !== 'ready' && (
        <div className="absolute top-16 right-4 z-[210] pointer-events-none flex items-center gap-1.5 rounded-full bg-amber-950/70 px-2.5 py-1 text-amber-200 text-xs shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold">Voz activa</span>
        </div>
      )}

      {/* Banner de Estado de Choque del Rival o Noticia */}
      {bannerNotice && phase === 'playing' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[210] pointer-events-none animate-bounce bg-purple-950/90 border border-purple-400 text-purple-200 text-xs font-heading font-black px-4 py-1.5 rounded-full shadow-xl">
          {bannerNotice}
        </div>
      )}

      {/* Overlay de Inicio */}
      {phase === 'ready' && (
        <div className="absolute inset-0 z-[220] flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-[#102034]/95 border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl pointer-events-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              {isLocal ? <Smartphone className="w-7 h-7" /> : <Trophy className="w-7 h-7" />}
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white">
                {isLocal ? `Turno ${localTurn}: ${leftLabel}` : 'Duelo de Vuelo Vocal'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isLocal
                  ? localTurn === 1
                    ? `Vuela lo mas lejos que puedas esquivando tubos. Al chocar, le pasaras el celular a ${opponentName}.`
                    : `Turno de ${opponentName}. Intenta superar la marca de ${p1LocalScore} tubos de Jugador 1.`
                  : mode === 'ghost_async'
                  ? `Vence la sombra de ${opponentName}. Su record es de ${opponentTargetScore} tubos antes de chocar.`
                  : `Vuela en vivo contra ${opponentName} en tiempo real.`}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 text-left text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Control por Voz o Tactil:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Emite un sonido vocal o toca la pantalla para aletear y esquivar los tubos.
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
                {isLocal ? `Comenzar Turno ${localTurn}` : 'Comenzar Carrera'}
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
                Turno 1 Terminado
              </span>
              <h3 className="font-heading font-black text-2xl text-white mt-1">
                Pasa el celular a {opponentName}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                Jugador 1 logro <span className="text-amber-400 font-bold">{p1LocalScore} tubos</span>. Ahora le toca al Jugador 2 intentar superarlo.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Marca a batir</div>
              <div className="font-heading font-black text-3xl text-amber-400 mt-0.5">
                {p1LocalScore} <span className="text-sm font-bold text-slate-300">tubos</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartLocalTurn2}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 text-white font-heading font-black text-sm shadow-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Comenzar Turno de {opponentName}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay de Cierre del Duelo tras Choque Final */}
      {showMatchOverOverlay && (
        <div className="absolute inset-0 z-[230] flex flex-col items-center justify-center p-6 bg-black/75 backdrop-blur-sm pointer-events-auto animate-fadeIn">
          <div className="bg-[#102034] border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
                p1Won ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {p1Won ? <Award className="w-9 h-9" /> : <ShieldAlert className="w-9 h-9" />}
            </div>

            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                Fin de la Carrera
              </span>
              <h3 className="font-heading font-black text-2xl text-white mt-0.5">
                {isLocal
                  ? p1Won
                    ? 'VICTORIA DE JUGADOR 1 (TU)'
                    : playerScore === opponentScore
                    ? 'EMPATE EN LA CARRERA'
                    : `VICTORIA DE ${opponentName.toUpperCase()}`
                  : p1Won
                  ? 'VICTORIA EN EL DUELO'
                  : 'Buen Intento'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isLocal
                  ? p1Won
                    ? `Jugador 1 llego mas lejos en este celular (+50 XP)`
                    : playerScore === opponentScore
                    ? 'Ambos volaron exactamente la misma distancia (+35 XP)'
                    : `${opponentName} supero la marca en este celular (+50 XP)`
                  : p1Won
                  ? `Superaste a ${opponentName} en la Carrera Celeste (+50 XP)`
                  : `${opponentName} llego mas lejos esta vez (+20 XP por practica)`}
              </p>
            </div>

            {/* Comparativa final */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">
                  {isLocal ? 'J1 (TU)' : 'Tu Puntuacion'}
                </span>
                <span className="font-heading font-black text-2xl text-white">
                  {isLocal ? (localTurn === 2 ? opponentScore : playerScore) : playerScore} pts
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-purple-400 uppercase block">
                  {isLocal ? `J2 (${opponentName})` : opponentName}
                </span>
                <span className="font-heading font-black text-2xl text-white">
                  {isLocal ? (localTurn === 2 ? playerScore : opponentScore) : opponentScore} pts
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onFinishDuel(playerScore, opponentScore, p1Won)}
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
