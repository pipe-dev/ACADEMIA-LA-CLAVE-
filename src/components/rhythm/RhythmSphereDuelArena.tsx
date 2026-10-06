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
}

// Catalogo completo de niveles del afinador (niveles 7 a 28, de 80 a 290 BPM)
export const RHYTHM_LEVEL_META: Record<number, { bpm: number; name: string }> = {
  7: { bpm: 80, name: 'Pulso Lento' },
  8: { bpm: 90, name: 'Contratiempo' },
  9: { bpm: 100, name: 'Pulso Base' },
  10: { bpm: 110, name: 'Marcha' },
  11: { bpm: 120, name: 'Compas 4/4' },
  12: { bpm: 130, name: 'Sincopa Pop' },
  13: { bpm: 140, name: 'Rock Groove' },
  14: { bpm: 150, name: 'Redoble' },
  15: { bpm: 160, name: 'Upbeat Disco' },
  16: { bpm: 170, name: 'Funk Sincopado' },
  17: { bpm: 180, name: 'Latin Fusion' },
  18: { bpm: 190, name: 'Furia Ritmica' },
  19: { bpm: 200, name: 'Aceleracion' },
  20: { bpm: 210, name: 'Tormenta' },
  21: { bpm: 220, name: 'Maestria Veloz' },
  22: { bpm: 230, name: 'Breakbeat' },
  23: { bpm: 240, name: 'Hiper Groove' },
  24: { bpm: 250, name: 'Desafio Extremo' },
  25: { bpm: 260, name: 'Fuego Puro' },
  26: { bpm: 270, name: 'Supersonico' },
  27: { bpm: 280, name: 'Trance Ritmico' },
  28: { bpm: 290, name: 'Limite Maximo' },
};

/**
 * Genera una serie rotativa de 4 rondas de ritmo sin repeticiones.
 * Empieza en cualquier tempo aleatorio (80 a 150 BPM) y escala de forma dinamica
 * rotando ejercicios del afinador para que nunca sea el mismo desafio dos veces.
 */
export function generateDuelRhythmPlaylist(seedLevels?: number[]): DuelRhythmRoundConfig[] {
  if (seedLevels && seedLevels.length === 4) {
    return seedLevels.map((lvl, idx) => {
      const meta = RHYTHM_LEVEL_META[lvl] || {
        bpm: 80 + (lvl - 7) * 10,
        name: `Nivel ${lvl}`,
      };
      return {
        roundNumber: idx + 1,
        levelNumber: lvl,
        bpm: meta.bpm,
        name: meta.name,
      };
    });
  }

  // Nivel de apertura aleatorio (niveles 7 a 14: 80 a 150 BPM)
  const startPool = [7, 8, 9, 10, 11, 12, 13, 14];
  const r1 = startPool[Math.floor(Math.random() * startPool.length)];

  // Rondas subsiguientes con saltos dinamicos de +1 a +4 niveles
  const step1 = 1 + Math.floor(Math.random() * 4);
  const r2 = Math.min(22, r1 + step1);

  const step2 = 1 + Math.floor(Math.random() * 4);
  const r3 = Math.min(25, Math.max(r2 + 1, r2 + step2));

  const step3 = 1 + Math.floor(Math.random() * 4);
  const r4 = Math.min(28, Math.max(r3 + 1, r3 + step3));

  const chosenLevels = [r1, r2, r3, r4];

  return chosenLevels.map((lvl, idx) => {
    const meta = RHYTHM_LEVEL_META[lvl] || {
      bpm: 80 + (lvl - 7) * 10,
      name: `Nivel ${lvl}`,
    };
    return {
      roundNumber: idx + 1,
      levelNumber: lvl,
      bpm: meta.bpm,
      name: meta.name,
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
    <>
      <RhythmStageArena
        phase={phase}
        countInNumber={countInNumber}
        score={score}
        ballControls={ballControls}
        floatingTexts={floatingTexts}
        combo={combo}
      />
      <div className="mt-3">
        <RhythmTriggers
          phase={phase}
          onTap={handleTriggerTap}
          onRetry={startExercise}
        />
      </div>
    </>
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
      setBannerNotice(`¡Ronda ${roundIndexRef.current + 1} completada: ${roundScoreVal}%! Siguiente: ${nextRound.name} (${nextRound.bpm} BPM)`);
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 select-none bg-gradient-to-b from-[#0a1128] via-[#0c1836] to-[#080d1e] text-white overflow-hidden">
      <div className="w-full max-w-md bg-[#102034]/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative">
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

        {/* Runner de la ronda activa con reinicio limpio por clave */}
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
  );
};

export default RhythmSphereDuelArena;
