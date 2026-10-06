// src/components/rhythm/RhythmSphereDuelArena.tsx
// Arena de Duelo de Ritmo - 4 Rondas Dinamicas Rotativas (< 450 lineas)

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RhythmStageArena } from './RhythmStageArena';
import { RhythmTriggers } from './RhythmTriggers';
import { RhythmSphereDuelHud } from './RhythmSphereDuelHud';
import { useRhythmEngine } from './useRhythmEngine';
import { RhythmPhase } from './rhythmTypes';
import { rhythmPatterns } from '../../data/tunerLevelsData';
import { p2pDuelService } from '../../utils/p2pDuelService';
import { audioService } from '../../utils/audioService';

export interface DuelRhythmRoundConfig {
  roundNumber: number;
  levelNumber: number;
  bpm: number;
  name: string;
  mode: 'Fácil' | 'Medio' | 'Difícil' | 'Leyenda';
}

// Catalogo completo de niveles del afinador (niveles 7 a 28, de 80 a 290 BPM)
export const RHYTHM_LEVEL_META: Record<number, { bpm: number; name: string; mode: 'Fácil' | 'Medio' | 'Difícil' | 'Leyenda' }> = {
  // Modo Fácil (80 a 130 BPM)
  7: { bpm: 80, name: 'Pulso Lento', mode: 'Fácil' },
  8: { bpm: 90, name: 'Contratiempo', mode: 'Fácil' },
  9: { bpm: 100, name: 'Pulso Base', mode: 'Fácil' },
  10: { bpm: 110, name: 'Marcha', mode: 'Fácil' },
  11: { bpm: 120, name: 'Compas 4/4', mode: 'Fácil' },
  12: { bpm: 130, name: 'Sincopa Pop', mode: 'Fácil' },

  // Modo Medio (140 a 170 BPM)
  13: { bpm: 140, name: 'Rock Groove', mode: 'Medio' },
  14: { bpm: 150, name: 'Redoble', mode: 'Medio' },
  15: { bpm: 160, name: 'Upbeat Disco', mode: 'Medio' },
  16: { bpm: 170, name: 'Funk Sincopado', mode: 'Medio' },

  // Modo Difícil (180 a 210 BPM)
  17: { bpm: 180, name: 'Latin Fusion', mode: 'Difícil' },
  18: { bpm: 190, name: 'Furia Ritmica', mode: 'Difícil' },
  19: { bpm: 200, name: 'Aceleracion', mode: 'Difícil' },
  20: { bpm: 210, name: 'Tormenta', mode: 'Difícil' },

  // Modo Leyenda / Maestro (220 a 290 BPM)
  21: { bpm: 220, name: 'Maestria Veloz', mode: 'Leyenda' },
  22: { bpm: 230, name: 'Breakbeat', mode: 'Leyenda' },
  23: { bpm: 240, name: 'Hiper Groove', mode: 'Leyenda' },
  24: { bpm: 250, name: 'Desafio Extremo', mode: 'Leyenda' },
  25: { bpm: 260, name: 'Fuego Puro', mode: 'Leyenda' },
  26: { bpm: 270, name: 'Supersonico', mode: 'Leyenda' },
  27: { bpm: 280, name: 'Trance Ritmico', mode: 'Leyenda' },
  28: { bpm: 290, name: 'Limite Maximo', mode: 'Leyenda' },
};

/**
 * Genera una serie rotativa de 4 rondas de ritmo sin repeticiones.
 * Selecciona progresiones variadas garantizando la participacion activa
 * de ejercicios de Modo Medio, Modo Dificil y Modo Leyenda.
 */
export function generateDuelRhythmPlaylist(seedLevels?: number[]): DuelRhythmRoundConfig[] {
  if (seedLevels && seedLevels.length === 4) {
    return seedLevels.map((lvl, idx) => {
      const meta = RHYTHM_LEVEL_META[lvl] || {
        bpm: 80 + (lvl - 7) * 10,
        name: `Nivel ${lvl}`,
        mode: (lvl >= 21 ? 'Leyenda' : lvl >= 17 ? 'Difícil' : lvl >= 13 ? 'Medio' : 'Fácil') as 'Fácil' | 'Medio' | 'Difícil' | 'Leyenda',
      };
      return {
        roundNumber: idx + 1,
        levelNumber: lvl,
        bpm: meta.bpm,
        name: meta.name,
        mode: meta.mode,
      };
    });
  }

  // 4 Curvas de progresion rotativas garantizando presencia de Medio, Dificil y Leyenda
  const curves = [
    [[8, 9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20], [21, 22, 23, 24]], // Facil -> Medio -> Dificil -> Leyenda
    [[13, 14], [17, 18, 19], [21, 22, 23], [24, 25, 26, 27, 28]],               // Medio -> Dificil -> Leyenda -> Leyenda Extrema
    [[11, 12, 13], [14, 15, 16], [18, 19, 20], [22, 23, 25]],                   // Sincopado: Facil/Medio -> Medio -> Dificil -> Leyenda
    [[14, 15, 16], [17, 18], [19, 20], [23, 24, 26, 27]],                       // Virtuoso: Medio -> Dificil -> Dificil -> Leyenda Suprema
  ];

  const selectedCurve = curves[Math.floor(Math.random() * curves.length)];
  const chosenLevels = selectedCurve.map((pool) => pool[Math.floor(Math.random() * pool.length)]);

  return chosenLevels.map((lvl, idx) => {
    const meta = RHYTHM_LEVEL_META[lvl] || {
      bpm: 80 + (lvl - 7) * 10,
      name: `Nivel ${lvl}`,
      mode: (lvl >= 21 ? 'Leyenda' : lvl >= 17 ? 'Difícil' : lvl >= 13 ? 'Medio' : 'Fácil') as 'Fácil' | 'Medio' | 'Difícil' | 'Leyenda',
    };
    return {
      roundNumber: idx + 1,
      levelNumber: lvl,
      bpm: meta.bpm,
      name: meta.name,
      mode: meta.mode,
    };
  });
}

interface RhythmRoundRunnerProps {
  roundConfig: DuelRhythmRoundConfig;
  autoStart: boolean;
  onRoundComplete: (score: number) => void;
  onLiveUpdate: (score: number, combo: number, phase: RhythmPhase) => void;
  onTapInstrument?: (instrument: 'kick' | 'clap', score: number, combo: number) => void;
}

const RhythmRoundRunner: React.FC<RhythmRoundRunnerProps> = ({
  roundConfig,
  autoStart,
  onRoundComplete,
  onLiveUpdate,
  onTapInstrument,
}) => {
  const lastScoreRef = useRef<number>(0);
  const pattern = rhythmPatterns[roundConfig.levelNumber] || [
    { time: 0, instrument: 'kick' },
    { time: 500, instrument: 'clap' },
    { time: 1000, instrument: 'kick' },
    { time: 1500, instrument: 'clap' },
  ];

  const {
    phase,
    score,
    floatingTexts,
    combo,
    countInNumber,
    ballControls,
    handleTap,
    startExercise,
  } = useRhythmEngine({
    pattern,
    bpm: roundConfig.bpm,
    onSuccess: (finalScore) => {
      lastScoreRef.current = finalScore;
      onRoundComplete(finalScore);
    },
    onFail: (finalScore) => {
      const s = finalScore ?? lastScoreRef.current;
      onRoundComplete(s);
    },
    autoStart,
  });

  useEffect(() => {
    onLiveUpdate(score, combo, phase);
  }, [score, combo, phase, onLiveUpdate]);

  const handleTriggerTap = useCallback(
    (instrument: 'kick' | 'clap') => {
      handleTap(instrument);
      if (onTapInstrument) {
        onTapInstrument(instrument, score, combo);
      }
    },
    [handleTap, onTapInstrument, score, combo]
  );

  return (
    <div className="w-full h-full flex-1 flex flex-col justify-between min-h-0">
      <div className="w-full flex-1 min-h-[300px] flex flex-col">
        <RhythmStageArena
          phase={phase}
          countInNumber={countInNumber}
          score={score}
          ballControls={ballControls}
          floatingTexts={floatingTexts}
          combo={combo}
        />
      </div>
      <div className="w-full shrink-0 pt-2 sm:pt-3">
        <RhythmTriggers
          phase={phase}
          onTap={handleTriggerTap}
          onRetry={startExercise}
        />
      </div>
    </div>
  );
};

interface RhythmSphereDuelArenaProps {
  opponentName: string;
  opponentTargetAccuracy?: number;
  mode: 'ghost_async' | 'realtime_p2p' | 'local';
  onFinishDuel: (playerScore: number, opponentScore: number, won: boolean) => void;
  onExit: () => void;
}

export const RhythmSphereDuelArena: React.FC<RhythmSphereDuelArenaProps> = ({
  opponentName,
  opponentTargetAccuracy = 85,
  mode,
  onFinishDuel,
  onExit,
}) => {
  // Serie rotativa de 4 rondas generadas dinamicamente
  const [roundsPlaylist, setRoundsPlaylist] = useState<DuelRhythmRoundConfig[]>(() => generateDuelRhythmPlaylist());
  const [arenaPhase, setArenaPhase] = useState<'ready' | 'playing' | 'round_transition'>('ready');
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [liveCombo, setLiveCombo] = useState<number>(0);
  const [liveEnginePhase, setLiveEnginePhase] = useState<RhythmPhase>('guide');

  const [p1Accuracy, setP1Accuracy] = useState<number>(0);
  const [opponentAccuracy, setOpponentAccuracy] = useState<number>(mode === 'ghost_async' ? opponentTargetAccuracy : 0);
  const [opponentCombo, setOpponentCombo] = useState<number>(0);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Estados para modo local 2 jugadores
  const [localTurn, setLocalTurn] = useState<1 | 2>(1);
  const [p1LocalAccuracy, setP1LocalAccuracy] = useState<number>(0);
  const [p1LocalCombo, setP1LocalCombo] = useState<number>(0);
  const [p2Accuracy, setP2Accuracy] = useState<number>(0);
  const [showLocalTransitionOverlay, setShowLocalTransitionOverlay] = useState<boolean>(false);
  const [showMatchOverOverlay, setShowMatchOverOverlay] = useState<boolean>(false);

  const localTurnRef = useRef<1 | 2>(1);
  const roundIndexRef = useRef<number>(0);
  const roundScoresRef = useRef<number[]>([]);
  const p1LocalAccuracyRef = useRef<number>(0);
  const p1LocalComboRef = useRef<number>(0);
  const roundsPlaylistRef = useRef<DuelRhythmRoundConfig[]>(roundsPlaylist);

  useEffect(() => {
    roundsPlaylistRef.current = roundsPlaylist;
  }, [roundsPlaylist]);

  const handleLiveUpdate = useCallback((scoreVal: number, comboVal: number, phaseVal: RhythmPhase) => {
    setLiveScore(scoreVal);
    setLiveCombo(comboVal);
    setLiveEnginePhase(phaseVal);
  }, []);

  // Guardar maximo combo en local turn 1
  useEffect(() => {
    if (liveCombo > (localTurnRef.current === 1 ? p1LocalComboRef.current : 0)) {
      if (localTurnRef.current === 1) {
        p1LocalComboRef.current = liveCombo;
        setP1LocalCombo(liveCombo);
      }
    }
  }, [liveCombo]);

  const handleRoundComplete = useCallback((roundScoreVal: number) => {
    const updatedScores = [...roundScoresRef.current, roundScoreVal];
    roundScoresRef.current = updatedScores;
    setRoundScores(updatedScores);

    const activePlaylist = roundsPlaylistRef.current;
    if (roundIndexRef.current < activePlaylist.length - 1) {
      const nextIdx = roundIndexRef.current + 1;
      const nextRound = activePlaylist[nextIdx];
      setArenaPhase('round_transition');
      setBannerNotice(`¡Ronda ${roundIndexRef.current + 1} completada: ${roundScoreVal}%! Siguiente: [${nextRound.mode}] ${nextRound.name} (${nextRound.bpm} BPM)`);
      audioService.playSuccessBellSound();

      setTimeout(() => {
        roundIndexRef.current = nextIdx;
        setCurrentRoundIndex(nextIdx);
        setBannerNotice(null);
        setArenaPhase('playing');
      }, 1400);
    } else {
      const overall = Math.round(updatedScores.reduce((acc, curr) => acc + curr, 0) / updatedScores.length);
      audioService.playBadgeUnlockedSound();

      if (mode === 'local' && localTurnRef.current === 1) {
        p1LocalAccuracyRef.current = overall;
        setP1LocalAccuracy(overall);
        setBannerNotice(`¡Turno 1 completado con ${overall}% promedio!`);
        setTimeout(() => {
          setShowLocalTransitionOverlay(true);
        }, 750);
      } else {
        if (mode === 'local') {
          setP2Accuracy(overall);
        } else {
          setP1Accuracy(overall);
        }
        if (mode === 'ghost_async') {
          setOpponentAccuracy(opponentTargetAccuracy);
        }
        setTimeout(() => {
          setShowMatchOverOverlay(true);
        }, 750);
      }
    }
  }, [mode, opponentTargetAccuracy]);

  // Transmision P2P WebRTC
  const handleTapInstrument = useCallback(
    (instrument: 'kick' | 'clap', scoreVal: number, comboVal: number) => {
      if (mode === 'realtime_p2p') {
        p2pDuelService.sendPacket({
          type: 'rhythm_pattern',
          score: scoreVal,
          combo: comboVal,
          tapsCount: 1,
          precision: scoreVal,
        });
      }
    },
    [mode]
  );

  useEffect(() => {
    if (mode !== 'realtime_p2p') return;

    // Enviar sincronizacion de la serie de 4 rondas al conectarse
    p2pDuelService.sendPacket({
      type: 'rhythm_pattern',
      score: 0,
      combo: 0,
      tapsCount: 0,
      precision: 0,
      roundLevels: roundsPlaylist.map((r) => r.levelNumber),
    });

    p2pDuelService.onPacket = (packet) => {
      if (packet.type === 'rhythm_pattern') {
        setOpponentAccuracy(packet.precision);
        setOpponentCombo(packet.combo);
        if (packet.roundLevels && packet.roundLevels.length === 4) {
          const synced = generateDuelRhythmPlaylist(packet.roundLevels);
          setRoundsPlaylist(synced);
        }
      }
    };

    return () => {
      p2pDuelService.onPacket = null;
    };
  }, [mode, roundsPlaylist]);

  const handleStartGame = useCallback(() => {
    setArenaPhase('playing');
    setShowMatchOverOverlay(false);
    setShowLocalTransitionOverlay(false);
    setBannerNotice(null);
  }, []);

  const handleStartLocalTurn2 = useCallback(() => {
    localTurnRef.current = 2;
    setLocalTurn(2);
    roundIndexRef.current = 0;
    setCurrentRoundIndex(0);
    roundScoresRef.current = [];
    setRoundScores([]);
    setLiveScore(0);
    setLiveCombo(0);
    setBannerNotice(null);
    setShowLocalTransitionOverlay(false);
    setOpponentAccuracy(p1LocalAccuracyRef.current);
    setArenaPhase('ready');
  }, []);

  // Comparaciones en vivo para banner
  useEffect(() => {
    if (arenaPhase === 'playing') {
      if (mode === 'local' && localTurnRef.current === 2) {
        const diff = liveScore - p1LocalAccuracyRef.current;
        if (diff > 5) setBannerNotice(`¡Superando a J1 por +${diff}%!`);
        else if (diff < -5) setBannerNotice(`J1 lidera por ${Math.abs(diff)}%`);
      } else if (mode === 'ghost_async') {
        const diff = liveScore - opponentTargetAccuracy;
        if (diff > 5) setBannerNotice(`¡Superando a ${opponentName}!`);
      }
    }
  }, [arenaPhase, mode, liveScore, opponentTargetAccuracy, opponentName]);

  const finalPlayerScore = mode === 'local' ? p1LocalAccuracy : p1Accuracy;
  const finalOpponentScore = mode === 'local' ? p2Accuracy : (mode === 'ghost_async' ? opponentTargetAccuracy : opponentAccuracy);
  const p1Won = mode === 'local' ? p1LocalAccuracy > p2Accuracy : finalPlayerScore > finalOpponentScore;
  const isTie = mode === 'local' ? p1LocalAccuracy === p2Accuracy : finalPlayerScore === finalOpponentScore;

  const handleFinish = () => {
    onFinishDuel(finalPlayerScore, finalOpponentScore, p1Won);
  };

  const currentRoundConfig = roundsPlaylist[currentRoundIndex] || roundsPlaylist[0];

  const displayPhase: 'ready' | 'guide' | 'playing' | 'round_transition' | 'results' =
    showMatchOverOverlay
      ? 'results'
      : arenaPhase === 'ready'
      ? 'ready'
      : arenaPhase === 'round_transition'
      ? 'round_transition'
      : (liveEnginePhase as any);

  const displayedAccuracy =
    arenaPhase === 'round_transition'
      ? roundScores[roundScores.length - 1] ?? liveScore
      : showMatchOverOverlay
      ? (mode === 'local' ? p2Accuracy : p1Accuracy)
      : liveScore;

  return (
    <div className="fixed inset-0 z-[120] select-none touch-none bg-gradient-to-b from-[#080d1e] via-[#0d1b33] to-[#060a17] text-white overflow-hidden flex flex-col items-center justify-between p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-lg md:max-w-xl h-full flex flex-col justify-between relative z-10">
        <div className="w-full shrink-0">
          <RhythmSphereDuelHud
            phase={displayPhase}
            playerAccuracy={displayedAccuracy}
            playerCombo={liveCombo}
            opponentAccuracy={mode === 'local' && localTurn === 2 ? p1LocalAccuracy : opponentAccuracy}
            opponentCombo={opponentCombo}
            opponentName={opponentName}
            opponentTargetAccuracy={mode === 'local' ? p1LocalAccuracy : opponentTargetAccuracy}
            bpm={currentRoundConfig.bpm}
            currentRound={currentRoundIndex + 1}
            totalRounds={roundsPlaylist.length}
            roundScores={roundScores}
            roundName={currentRoundConfig.name}
            difficultyMode={currentRoundConfig.mode}
            roundsPreview={roundsPlaylist}
            bannerNotice={bannerNotice}
            mode={mode}
            localTurn={localTurn}
            p1LocalAccuracy={p1LocalAccuracy}
            p1LocalCombo={p1LocalCombo}
            showLocalTransitionOverlay={showLocalTransitionOverlay}
            showMatchOverOverlay={showMatchOverOverlay}
            p1Won={p1Won}
            isTie={isTie}
            onStartGame={handleStartGame}
            onExit={onExit}
            onStartLocalTurn2={handleStartLocalTurn2}
            onFinishDuel={handleFinish}
          />
        </div>

        {/* Runner de la ronda activa con reinicio limpio por clave */}
        <div className="w-full flex-1 flex flex-col justify-between my-2 sm:my-3 min-h-0">
          <RhythmRoundRunner
            key={`round-runner-${localTurn}-${currentRoundIndex}-${currentRoundConfig.levelNumber}`}
            roundConfig={currentRoundConfig}
            autoStart={arenaPhase === 'playing'}
            onRoundComplete={handleRoundComplete}
            onLiveUpdate={handleLiveUpdate}
            onTapInstrument={handleTapInstrument}
          />
        </div>
      </div>
    </div>
  );
};

export default RhythmSphereDuelArena;
