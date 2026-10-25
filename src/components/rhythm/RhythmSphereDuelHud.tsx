// src/components/rhythm/RhythmSphereDuelHud.tsx
// Overlays y HUD de duelo para Ritmo con Esfera 3D (< 310 lineas)

'use client';

import React from 'react';
import { Award, ShieldAlert, Activity, Zap, Flame, Smartphone, Users } from 'lucide-react';
export interface RhythmRoundPreviewItem {
  roundNumber: number;
  bpm: number;
  name: string;
  mode?: 'Fácil' | 'Medio' | 'Difícil' | 'Leyenda';
}

interface RhythmSphereDuelHudProps {
  phase: 'ready' | 'guide' | 'playing' | 'round_transition' | 'results';
  playerAccuracy: number;
  playerCombo: number;
  opponentAccuracy: number;
  opponentCombo: number;
  opponentName: string;
  opponentTargetAccuracy: number;
  bpm: number;
  currentRound: number;
  totalRounds: number;
  roundScores?: number[];
  roundName?: string;
  difficultyMode?: 'Fácil' | 'Medio' | 'Difícil' | 'Leyenda';
  roundsPreview?: RhythmRoundPreviewItem[];
  bannerNotice: string | null;
  mode: 'ghost_async' | 'realtime_p2p' | 'local';
  localTurn?: 1 | 2;
  p1LocalAccuracy?: number;
  p1LocalCombo?: number;
  showLocalTransitionOverlay?: boolean;
  showMatchOverOverlay: boolean;
  p1Won: boolean;
  isTie: boolean;
  onStartGame: () => void;
  onExit: () => void;
  onStartLocalTurn2?: () => void;
  onFinishDuel: () => void;
}

export const RhythmSphereDuelHud: React.FC<RhythmSphereDuelHudProps> = ({
  phase,
  playerAccuracy,
  playerCombo,
  opponentAccuracy,
  opponentCombo,
  opponentName,
  opponentTargetAccuracy,
  bpm,
  currentRound,
  totalRounds,
  roundScores = [],
  roundName,
  difficultyMode,
  roundsPreview = [],
  bannerNotice,
  mode,
  localTurn = 1,
  p1LocalAccuracy = 0,
  p1LocalCombo = 0,
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
  const leftLabel = isLocal ? (localTurn === 1 ? 'TU (J1)' : `${opponentName.slice(0, 10)} (J2)`) : 'TU';
  const rightLabel = isLocal ? (localTurn === 1 ? `${opponentName.slice(0, 10)} (J2)` : 'J1 (TU)') : opponentName;
  const rightAccuracyDisplay = isLocal && localTurn === 1 ? 'Espera' : `${opponentAccuracy}%`;

  return (
    <>
      {/* Barra superior de Duelo: Marcador Comparativo en Vivo */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pointer-events-none mb-2 w-full">
        {/* Jugador Activo */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-blue-500/40 shadow-lg shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 flex items-center justify-center font-heading font-black text-xs sm:text-sm text-white shadow-xs shrink-0">
            {isLocal ? `J${localTurn}` : 'TU'}
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-blue-400 leading-none truncate max-w-[65px] sm:max-w-[85px]">
              {leftLabel}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading font-black text-lg sm:text-2xl text-white leading-none">
                {playerAccuracy}%
              </span>
              {playerCombo > 1 && (
                <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-400">
                  x{playerCombo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badge Central: Ronda, BPM, Estilo y Modo */}
        <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-2xl border border-slate-700/80 shadow-md flex-1 max-w-[190px] sm:max-w-[240px]">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-heading font-black text-white leading-none">
            {isLocal ? <Smartphone className="w-3 h-3 text-blue-400 shrink-0" /> : <Activity className="w-3 h-3 text-blue-400 shrink-0" />}
            <span>R{currentRound}/{totalRounds}</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400">{bpm} BPM</span>
          </div>
          <div className="flex items-center gap-1 mt-1 leading-none">
            {difficultyMode && (
              <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1 py-0.2 rounded-xs border ${
                difficultyMode === 'Leyenda' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                difficultyMode === 'Difícil' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                difficultyMode === 'Medio' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {difficultyMode}
              </span>
            )}
            {roundName && (
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">
                {roundName}
              </span>
            )}
          </div>
        </div>

        {/* Rival / Jugador Esperando */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-purple-500/40 shadow-lg shrink-0">
          <div>
            <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-purple-400 text-right leading-none truncate max-w-[65px] sm:max-w-[85px]">
              {rightLabel}
            </div>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span className="font-heading font-black text-lg sm:text-2xl text-white text-right leading-none">
                {rightAccuracyDisplay}
              </span>
              {opponentCombo > 1 && !isLocal && (
                <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-400">
                  x{opponentCombo}
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-600 flex items-center justify-center font-heading font-black text-xs sm:text-sm text-white shadow-xs shrink-0">
            {isLocal ? (localTurn === 1 ? 'J2' : 'J1') : opponentName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Indicador de Rondas Completadas */}
      {roundScores.length > 0 && phase !== 'ready' && (
        <div className="flex items-center justify-center gap-2 mb-2 pointer-events-none">
          {Array.from({ length: totalRounds }).map((_, idx) => {
            const scoreVal = roundScores[idx];
            const isCurrent = idx === currentRound - 1;
            return (
              <div
                key={idx}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                  scoreVal !== undefined
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : isCurrent
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500'
                }`}
              >
                R{idx + 1}: {scoreVal !== undefined ? `${scoreVal}%` : isCurrent ? 'Activa' : '...'}
              </div>
            );
          })}
        </div>
      )}

      {/* Banner de Noticia / Transicion de Ronda */}
      {bannerNotice && (phase === 'playing' || phase === 'guide' || phase === 'round_transition') && (
        <div className="text-center mb-2 pointer-events-none">
          <span className="inline-block animate-bounce bg-blue-950/90 border border-blue-400 text-blue-200 text-xs font-heading font-black px-4 py-1.5 rounded-full shadow-lg">
            {bannerNotice}
          </span>
        </div>
      )}

      {/* Overlay de Inicio */}
      {phase === 'ready' && (
        <div className="fixed inset-0 z-[220] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
          <div className="bg-[#102034] border border-slate-700 p-6 rounded-3xl max-w-sm sm:max-w-md w-full text-center space-y-3.5 shadow-2xl pointer-events-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-md">
              {isLocal ? <Smartphone className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white">
                {isLocal ? `Turno ${localTurn}: ${leftLabel}` : 'Duelo de Ritmo'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isLocal
                  ? localTurn === 1
                    ? `Supera las ${totalRounds} rondas rotativas de ritmo y tempo dinamico (${roundsPreview[0]?.bpm ?? bpm} a ${roundsPreview[roundsPreview.length - 1]?.bpm ?? bpm} BPM). Al terminar, le pasaras el celular a ${opponentName}.`
                    : `Supera las mismas ${totalRounds} rondas rotativas intentando batir el ${p1LocalAccuracy}% de precision de Jugador 1.`
                  : mode === 'ghost_async'
                  ? `Compite contra el record de ${opponentName} (${opponentTargetAccuracy}% de precision) en ${totalRounds} rondas dinamicas.`
                  : `Compite en vivo contra ${opponentName} en ${totalRounds} rondas dinamicas de ritmo.`}
              </p>
            </div>

            {/* Preview visual de las 4 rondas generadas con modo de dificultad */}
            {roundsPreview.length > 0 && (
              <div className="space-y-1 text-left">
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">
                  Rondas generadas para este duelo:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {roundsPreview.map((r) => {
                    const badgeClass =
                      r.mode === 'Leyenda'
                        ? 'bg-purple-500/25 text-purple-300 border-purple-400/40'
                        : r.mode === 'Difícil'
                        ? 'bg-rose-500/25 text-rose-300 border-rose-400/40'
                        : r.mode === 'Medio'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-400/40'
                        : 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40';

                    return (
                      <div
                        key={r.roundNumber}
                        className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center justify-center text-center"
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black uppercase text-blue-400">R{r.roundNumber}</span>
                          {r.mode && (
                            <span className={`text-[6.5px] font-extrabold px-1 rounded-xs border ${badgeClass}`}>
                              {r.mode}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-black text-white mt-0.5">{r.bpm} BPM</span>
                        <span className="text-[7.5px] text-slate-400 truncate max-w-[60px] leading-tight mt-0.5">
                          {r.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-2xl bg-slate-800/80 text-left text-xs text-slate-300 space-y-0.5">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                <Zap className="w-3.5 h-3.5" />
                <span>Ejercicios Rotativos:</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Cada ronda cambia de velocidad y patron rítmico. Tu precision final es el promedio acumulado.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExit();
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-heading font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartGame();
                }}
                className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-heading font-black text-xs shadow-md cursor-pointer"
              >
                {isLocal ? `Comenzar Turno ${localTurn}` : 'Comenzar Duelo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Transicion Local: Pasa el Celular */}
      {showLocalTransitionOverlay && (
        <div className="fixed inset-0 z-[225] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md pointer-events-auto animate-fadeIn">
          <div className="bg-[#102034] border border-blue-500/50 p-6 rounded-3xl max-w-sm sm:max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-lg">
              <Smartphone className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-blue-400">
                Turno 1 Finalizado ({totalRounds} Rondas)
              </span>
              <h3 className="font-heading font-black text-2xl text-white mt-1">
                Pasa el celular a {opponentName}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                Jugador 1 promedio <span className="text-blue-400 font-bold">{p1LocalAccuracy}% de precision</span> (Combo max x{p1LocalCombo}). Ahora Jugador 2 debe intentar superarlo.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Precision promedio a batir</div>
              <div className="font-heading font-black text-3xl text-blue-400 mt-0.5">
                {p1LocalAccuracy}% <span className="text-sm font-bold text-slate-300">promedio</span>
              </div>
            </div>

            {roundsPreview.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 py-1">
                {roundsPreview.map((r) => {
                  const badgeClass =
                    r.mode === 'Leyenda'
                      ? 'bg-purple-500/25 text-purple-300 border-purple-400/40'
                      : r.mode === 'Difícil'
                      ? 'bg-rose-500/25 text-rose-300 border-rose-400/40'
                      : r.mode === 'Medio'
                      ? 'bg-amber-500/25 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40';

                  return (
                    <div key={r.roundNumber} className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="text-[8px] font-black uppercase text-blue-400">R{r.roundNumber}</span>
                        {r.mode && (
                          <span className={`text-[6.5px] font-extrabold px-0.5 rounded-xs border ${badgeClass}`}>
                            {r.mode}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-white mt-0.5">{r.bpm} BPM</div>
                      <div className="text-[7.5px] text-slate-400 truncate max-w-[60px]">{r.name}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={onStartLocalTurn2}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-heading font-black text-sm shadow-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Comenzar Turno de {opponentName}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay de Cierre del Duelo */}
      {showMatchOverOverlay && (
        <div className="fixed inset-0 z-[230] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm pointer-events-auto animate-fadeIn">
          <div className="bg-[#102034] border border-slate-700 p-6 rounded-3xl max-w-sm sm:max-w-md w-full text-center space-y-5 shadow-2xl">
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
                Resultado de las {totalRounds} Rondas
              </span>
              <h3 className="font-heading font-black text-2xl text-white mt-0.5">
                {isLocal
                  ? p1Won
                    ? 'VICTORIA DE JUGADOR 1 (TU)'
                    : isTie
                    ? 'EMPATE RITMICO'
                    : `VICTORIA DE ${opponentName.toUpperCase()}`
                  : p1Won
                  ? 'VICTORIA EN EL DUELO'
                  : isTie
                  ? 'EMPATE RITMICO'
                  : 'Buen Intento'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isLocal
                  ? p1Won
                    ? 'Jugador 1 tuvo mayor precision promedio (+50 XP)'
                    : isTie
                    ? 'Ambos jugadores promediaron exactamente la misma precision (+35 XP)'
                    : `${opponentName} supero la marca en este celular (+50 XP)`
                  : p1Won
                  ? `Superaste el ritmo de ${opponentName} en todas las rondas (+50 XP)`
                  : isTie
                  ? `Ambos empataron con ${playerAccuracy}% de precision (+35 XP)`
                  : `${opponentName} tuvo mejor precision en estas rondas (+20 XP por practica)`}
              </p>
            </div>

            {/* Comparativa final */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-blue-400 uppercase block">
                  {isLocal ? 'J1 (TU)' : 'Tu Precision'}
                </span>
                <span className="font-heading font-black text-2xl text-white">
                  {isLocal ? p1LocalAccuracy : playerAccuracy}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-purple-400 uppercase block">
                  {isLocal ? `J2 (${opponentName})` : opponentName}
                </span>
                <span className="font-heading font-black text-2xl text-white">
                  {isLocal ? playerAccuracy : opponentAccuracy}%
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onFinishDuel}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-heading font-black text-xs shadow-md cursor-pointer"
            >
              Ver Resumen y Reclamar XP
            </button>
          </div>
        </div>
      )}
    </>
  );
};
