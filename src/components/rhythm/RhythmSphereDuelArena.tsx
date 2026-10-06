// src/components/rhythm/RhythmSphereDuelArena.tsx
// Arena de Duelo de Ritmo con Esfera 3D (< 300 lineas)

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RhythmStageArena } from './RhythmStageArena';
import { RhythmTriggers } from './RhythmTriggers';
import { RhythmSphereDuelHud } from './RhythmSphereDuelHud';
import { useRhythmEngine } from './useRhythmEngine';
import { RhythmPatternItem } from './rhythmTypes';
import { p2pDuelService } from '../../utils/p2pDuelService';

const DUEL_BPM = 120;

// Patron de 2 compases energetico de 120 BPM (9 toques)
const DUEL_PATTERN: RhythmPatternItem[] = [
  { time: 0, instrument: 'kick' },
  { time: 500, instrument: 'clap' },
  { time: 1000, instrument: 'kick' },
  { time: 1250, instrument: 'kick' },
  { time: 1500, instrument: 'clap' },
  { time: 2000, instrument: 'kick' },
  { time: 2500, instrument: 'clap' },
  { time: 3000, instrument: 'kick' },
  { time: 3500, instrument: 'clap' },
];

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
  const [arenaPhase, setArenaPhase] = useState<'ready' | 'playing' | 'results'>('ready');
  const [opponentAccuracy, setOpponentAccuracy] = useState<number>(0);
  const [opponentCombo, setOpponentCombo] = useState<number>(0);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Estados especificos para modo local 2 jugadores
  const [localTurn, setLocalTurn] = useState<1 | 2>(1);
  const [p1LocalAccuracy, setP1LocalAccuracy] = useState<number>(0);
  const [p1LocalCombo, setP1LocalCombo] = useState<number>(0);
  const [showLocalTransitionOverlay, setShowLocalTransitionOverlay] = useState<boolean>(false);
  const [showMatchOverOverlay, setShowMatchOverOverlay] = useState<boolean>(false);

  const localTurnRef = useRef<1 | 2>(1);
  const p1LocalAccuracyRef = useRef<number>(0);
  const p1LocalComboRef = useRef<number>(0);
  const lastScoreRef = useRef<number>(0);

  const handleRoundFinished = useCallback(
    (finalScoreVal: number) => {
      lastScoreRef.current = finalScoreVal;

      if (mode === 'local' && localTurnRef.current === 1) {
        p1LocalAccuracyRef.current = finalScoreVal;
        setP1LocalAccuracy(finalScoreVal);
        setTimeout(() => {
          setShowLocalTransitionOverlay(true);
        }, 750);
        return;
      }

      if (mode === 'ghost_async') {
        setOpponentAccuracy(opponentTargetAccuracy);
      }

      setTimeout(() => {
        setShowMatchOverOverlay(true);
      }, 750);
    },
    [mode, opponentTargetAccuracy]
  );

  const {
    phase: enginePhase,
    score,
    floatingTexts,
    combo,
    countInNumber,
    ballControls,
    handleTap,
    startExercise,
  } = useRhythmEngine({
    pattern: DUEL_PATTERN,
    bpm: DUEL_BPM,
    onSuccess: (finalScore) => handleRoundFinished(finalScore),
    onFail: (finalScore) => handleRoundFinished(finalScore ?? lastScoreRef.current),
    autoStart: false,
  });

  // Guardar maximo combo
  useEffect(() => {
    if (combo > (localTurnRef.current === 1 ? p1LocalComboRef.current : 0)) {
      if (localTurnRef.current === 1) {
        p1LocalComboRef.current = combo;
        setP1LocalCombo(combo);
      }
    }
  }, [combo]);

  // Transmision P2P WebRTC
  const handleDuelTap = useCallback(
    (instrument: 'kick' | 'clap') => {
      handleTap(instrument);
      if (mode === 'realtime_p2p') {
        p2pDuelService.sendPacket({
          type: 'rhythm_pattern',
          score,
          combo,
          tapsCount: 1,
          precision: score,
        });
      }
    },
    [handleTap, mode, score, combo]
  );

  useEffect(() => {
    if (mode !== 'realtime_p2p') return;

    p2pDuelService.onPacket = (packet) => {
      if (packet.type === 'rhythm_pattern') {
        setOpponentAccuracy(packet.precision);
        setOpponentCombo(packet.combo);
      }
    };

    return () => {
      p2pDuelService.onPacket = null;
    };
  }, [mode]);

  const handleStartGame = useCallback(() => {
    setArenaPhase('playing');
    setShowMatchOverOverlay(false);
    setShowLocalTransitionOverlay(false);
    startExercise();
  }, [startExercise]);

  const handleStartLocalTurn2 = useCallback(() => {
    localTurnRef.current = 2;
    setLocalTurn(2);
    setOpponentAccuracy(p1LocalAccuracyRef.current);
    setShowLocalTransitionOverlay(false);
    setArenaPhase('ready');
  }, []);

  // Comparaciones en vivo para banner
  useEffect(() => {
    if (enginePhase === 'playing') {
      if (mode === 'local' && localTurnRef.current === 2) {
        const diff = score - p1LocalAccuracyRef.current;
        if (diff > 5) setBannerNotice(`¡Superando a J1 por +${diff}%!`);
        else if (diff < -5) setBannerNotice(`J1 lidera por ${Math.abs(diff)}%`);
      } else if (mode === 'ghost_async') {
        const diff = score - opponentTargetAccuracy;
        if (diff > 5) setBannerNotice(`¡Superando a ${opponentName}!`);
      }
    }
  }, [enginePhase, mode, score, opponentTargetAccuracy, opponentName]);

  const finalPlayerScore = mode === 'local' ? p1LocalAccuracy : score;
  const finalOpponentScore = mode === 'local' ? score : opponentAccuracy;
  const p1Won = mode === 'local' ? p1LocalAccuracy > score : score > opponentAccuracy;
  const isTie = mode === 'local' ? p1LocalAccuracy === score : score === opponentAccuracy;

  const handleFinish = () => {
    onFinishDuel(finalPlayerScore, finalOpponentScore, p1Won);
  };

  const displayPhase = arenaPhase === 'ready' ? 'ready' : enginePhase;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 select-none bg-gradient-to-b from-[#0a1128] via-[#0c1836] to-[#080d1e] text-white overflow-hidden">
      <div className="w-full max-w-md bg-[#102034]/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative">
        <RhythmSphereDuelHud
          phase={displayPhase}
          playerAccuracy={score}
          playerCombo={combo}
          opponentAccuracy={mode === 'local' && localTurn === 2 ? p1LocalAccuracy : opponentAccuracy}
          opponentCombo={opponentCombo}
          opponentName={opponentName}
          opponentTargetAccuracy={mode === 'local' ? p1LocalAccuracy : opponentTargetAccuracy}
          bpm={DUEL_BPM}
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

        {/* Escenario de Salto de la Esfera 3D */}
        <RhythmStageArena
          phase={enginePhase}
          countInNumber={countInNumber}
          score={score}
          ballControls={ballControls}
          floatingTexts={floatingTexts}
          combo={combo}
        />

        {/* Botones Tactiles de Bombo y Palmas */}
        <div className="mt-3">
          <RhythmTriggers
            phase={enginePhase}
            onTap={handleDuelTap}
            onRetry={handleStartGame}
          />
        </div>
      </div>
    </div>
  );
};

export default RhythmSphereDuelArena;
