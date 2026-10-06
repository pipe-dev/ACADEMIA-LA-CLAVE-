'use client';
import React from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import { Swords, ArrowLeft, Trophy, Drum } from 'lucide-react';
import { DueloRapidoModalProps, DuelResult } from './duelo-rapido/dueloTypes';
import { useDuelEngine } from './duelo-rapido/useDuelEngine';
import { DuelSetupView } from './duelo-rapido/DuelSetupView';
import { DuelSingingView } from './duelo-rapido/DuelSingingView';
import { DuelResultsView } from './duelo-rapido/DuelResultsView';
import { Unit4DuelArena } from './unit4-flappy/Unit4DuelArena';
import { Unit3DuelArena } from './unit3-rhythm/Unit3DuelArena';

export type { DueloRapidoModalProps, DuelResult };

export const DueloRapidoModal: React.FC<DueloRapidoModalProps> = ({
  isOpen = true,
  onClose,
  opponent = null,
  onGrantXp,
  isEmbeddedView = false,
  initialDuelType = 'pitch_duel',
}) => {
  const {
    duelType,
    setDuelType,
    selectedNote,
    setSelectedNote,
    mode,
    setMode,
    selectedOpponentName,
    gameState,
    p1TimeLeft,
    p1InTuneSeconds,
    p1CurrentPitch,
    p1PitchDiff,
    p1Score,
    p2TimeLeft,
    p2InTuneSeconds,
    p2CurrentPitch,
    p2Score,
    p1Won,
    p2pRoomId,
    p2pStatusMsg,
    handlePlayReferenceSound,
    startPlayer1Turn,
    finishUnit4Arena,
    finishUnit3Arena,
    startLocalPlayer2Turn,
    resetGame,
  } = useDuelEngine({
    isOpen,
    isEmbeddedView,
    opponent,
    onGrantXp,
    initialDuelType,
  });

  if (!isOpen && !isEmbeddedView) return null;

  // Si estamos en la arena de tambor y ritmo de la Unit 3, renderizamos a pantalla completa
  if (gameState === 'unit3_arena') {
    return (
      <Unit3DuelArena
        opponentName={selectedOpponentName}
        opponentTargetCuts={opponent?.rhythmRecord ?? Math.max(20, (opponent?.level ?? 1) * 6 + 10)}
        mode={mode === 'realtime_p2p' ? 'realtime_p2p' : 'ghost_async'}
        onFinishDuel={finishUnit3Arena}
        onExit={resetGame}
      />
    );
  }

  // Si estamos en la arena de vuelo de la Unit 4, renderizamos a pantalla completa
  if (gameState === 'unit4_arena') {
    return (
      <Unit4DuelArena
        opponentName={selectedOpponentName}
        opponentTargetScore={opponent?.skyRunRecord ?? Math.max(6, (opponent?.level ?? 1) * 3 + 2)}
        mode={mode === 'realtime_p2p' ? 'realtime_p2p' : 'ghost_async'}
        onFinishDuel={finishUnit4Arena}
        onExit={resetGame}
      />
    );
  }

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] w-full rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-md space-y-5 relative">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            audioService.playCloseSound();
            onClose();
          }}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato Competitivo
        </span>
      </div>

      {/* Title Banner */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl shrink-0 ${
          duelType === 'sky_run_duel'
            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300'
            : duelType === 'rhythm_duel'
            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300'
            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300'
        }`}>
          {duelType === 'sky_run_duel' ? (
            <Trophy className="w-6 h-6" />
          ) : duelType === 'rhythm_duel' ? (
            <Drum className="w-6 h-6" />
          ) : (
            <Swords className="w-6 h-6" />
          )}
        </div>
        <div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            {duelType === 'sky_run_duel'
              ? 'Carrera Celeste (Unit 4)'
              : duelType === 'rhythm_duel'
              ? 'Duelo de Tambor (Unit 3)'
              : 'Duelo Rapido Vocal'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {duelType === 'sky_run_duel'
              ? 'Vuela esquivando tubos con tu voz en vivo o contra la sombra de tu amigo'
              : duelType === 'rhythm_duel'
              ? 'Corta la mayor cantidad de esferas rebotando en el tambor en 1 minuto'
              : 'Compara estabilidad y precision afinando la misma nota'}
          </p>
        </div>
      </div>

      {/* SETUP PHASE */}
      {gameState === 'setup' && (
        <DuelSetupView
          duelType={duelType}
          onSelectDuelType={setDuelType}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onPlayReferenceSound={handlePlayReferenceSound}
          mode={mode}
          onSelectMode={setMode}
          selectedOpponentName={selectedOpponentName}
          opponentRecord={opponent?.skyRunRecord ?? Math.max(6, (opponent?.level ?? 1) * 3 + 2)}
          opponentRhythmRecord={opponent?.rhythmRecord ?? Math.max(20, (opponent?.level ?? 1) * 6 + 10)}
          onStartDuel={startPlayer1Turn}
        />
      )}

      {/* CONNECTING P2P PHASE */}
      {gameState === 'connecting_p2p' && (
        <div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
          <h4 className="font-heading font-black text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
            Conectando en Vivo P2P...
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {p2pStatusMsg || `Esperando a ${selectedOpponentName}...`}
          </p>
          {p2pRoomId && (
            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-500">
              Sala: {p2pRoomId}
            </div>
          )}
        </div>
      )}

      {/* SINGING PHASES (AFINACION) */}
      {(gameState === 'player1_singing' || gameState === 'player2_singing') && (
        <DuelSingingView
          isPlayer1={gameState === 'player1_singing'}
          selectedNote={selectedNote}
          selectedOpponentName={selectedOpponentName}
          mode={mode}
          p1TimeLeft={p1TimeLeft}
          p1CurrentPitch={p1CurrentPitch}
          p1PitchDiff={p1PitchDiff}
          p1InTuneSeconds={p1InTuneSeconds}
          p2TimeLeft={p2TimeLeft}
          p2CurrentPitch={p2CurrentPitch}
          p2InTuneSeconds={p2InTuneSeconds}
          onStartLocalP2Turn={startLocalPlayer2Turn}
        />
      )}

      {/* RESULTS PHASE */}
      {gameState === 'results' && (
        <DuelResultsView
          p1Won={p1Won}
          p1Score={p1Score}
          p1InTuneSeconds={p1InTuneSeconds}
          p2Score={p2Score}
          p2InTuneSeconds={p2InTuneSeconds}
          selectedOpponentName={selectedOpponentName}
          duelType={duelType}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-default"
      >
        {innerContent}
      </motion.div>
    </div>
  );
};

export default DueloRapidoModal;
