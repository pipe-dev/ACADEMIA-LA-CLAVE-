import { useState, useEffect, useRef, useCallback } from 'react';
import { audioService } from '../../utils/audioService';
import { calculateCentsOff } from '../../utils/pitchUtils';
import { SOLFEGE_NOTES } from '../../data/academyData';
import { SolfegeNote } from '../../types';
import { FriendItem } from '../FriendsSection';
import { DuelGameState, DuelMode, DuelType, P2PDataPacket } from './dueloTypes';
import { friendsSyncService } from '../../utils/friendsSyncService';
import { p2pDuelService } from '../../utils/p2pDuelService';
import confetti from 'canvas-confetti';

interface UseDuelEngineParams {
  isOpen: boolean;
  isEmbeddedView: boolean;
  opponent?: FriendItem | null;
  onGrantXp?: (amount: number) => void;
  initialDuelType?: DuelType;
}

export function useDuelEngine({
  isOpen,
  isEmbeddedView,
  opponent,
  onGrantXp,
  initialDuelType = 'pitch_duel',
}: UseDuelEngineParams) {
  const [duelType, setDuelType] = useState<DuelType>(initialDuelType);
  const [selectedNote, setSelectedNote] = useState<SolfegeNote>(SOLFEGE_NOTES[4]); // SOL (392 Hz)
  const [mode, setMode] = useState<DuelMode>('simulated');
  const [selectedOpponentName, setSelectedOpponentName] = useState<string>(
    opponent ? opponent.name : 'Camila Rios'
  );

  const [gameState, setGameState] = useState<DuelGameState>('setup');

  // Player 1 Stats
  const [p1TimeLeft, setP1TimeLeft] = useState<number>(10);
  const [p1InTuneSeconds, setP1InTuneSeconds] = useState<number>(0);
  const [p1CurrentPitch, setP1CurrentPitch] = useState<number | null>(null);
  const [p1PitchDiff, setP1PitchDiff] = useState<number | null>(null);
  const [p1Score, setP1Score] = useState<number>(0);

  // Player 2 Stats
  const [p2TimeLeft, setP2TimeLeft] = useState<number>(10);
  const [p2InTuneSeconds, setP2InTuneSeconds] = useState<number>(0);
  const [p2CurrentPitch, setP2CurrentPitch] = useState<number | null>(null);
  const [_p2PitchDiff, setP2PitchDiff] = useState<number | null>(null);
  const [p2Score, setP2Score] = useState<number>(0);

  // P2P State
  const [p2pRoomId, setP2pRoomId] = useState<string | null>(null);
  const [p2pStatusMsg, setP2pStatusMsg] = useState<string>('');
  const [p1Won, setP1Won] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (opponent) {
      setSelectedOpponentName(opponent.name);
    }
  }, [opponent]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioService.stopMicrophone();
      p2pDuelService.close();
    };
  }, []);

  const handlePlayReferenceSound = useCallback(() => {
    audioService.playFrequency(selectedNote.frequency, 1.2);
  }, [selectedNote]);

  const finishDuel = useCallback((finalP1: number, finalP2: number, inTuneSecP1: number, inTuneSecP2: number) => {
    const userWon = finalP1 >= finalP2;
    setP1Won(userWon);
    setGameState('results');

    const xpEarned = userWon ? 50 : 20;
    if (onGrantXp) onGrantXp(xpEarned);

    const myCode = typeof window !== 'undefined' ? (localStorage.getItem('laclave_my_friend_code') || 'MI_CODIGO') : 'MI_CODIGO';
    friendsSyncService.recordDuelResult({
      challengerCode: myCode,
      opponentCode: opponent ? opponent.code : 'LOCAL_P2',
      targetNote: duelType === 'sky_run_duel' ? 'Carrera Celeste' : selectedNote.name,
      challengerScore: finalP1,
      opponentScore: finalP2,
      winnerCode: userWon ? myCode : (opponent ? opponent.code : 'LOCAL_P2'),
      xpAwarded: xpEarned,
      duelType: duelType,
    });

    if (userWon) {
      audioService.playSuccessBellSound();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } else {
      audioService.playSadDefeatSound();
    }
  }, [duelType, onGrantXp, opponent, selectedNote.name]);

  const startSingingLoop = useCallback(async (onFinish: (score: number, inTuneSec: number) => void) => {
    let inTuneTicks = 0;
    let remaining = 10;
    const targetFreq = selectedNote.frequency;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 0) {
        setP1CurrentPitch(pitchHz);
        const cents = calculateCentsOff(pitchHz, targetFreq);
        setP1PitchDiff(cents);

        const isAccurate = Math.abs(cents) <= 25;
        if (isAccurate) {
          inTuneTicks += 0.1;
          setP1InTuneSeconds(Number(inTuneTicks.toFixed(1)));
        }

        if (mode === 'realtime_p2p') {
          p2pDuelService.sendPacket({
            type: 'pitch',
            hz: pitchHz,
            centsDiff: cents,
            inTune: isAccurate,
            score: Math.min(100, Math.round(inTuneTicks * 10)),
            timeLeft: remaining
          });
        }
      }
    });

    if (!micSuccess) {
      alert('Por favor concede acceso al microfono para participar en el duelo.');
      setGameState('setup');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setP1TimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        audioService.stopMicrophone();

        const calculatedP1Score = Math.min(100, Math.round(inTuneTicks * 10));
        setP1Score(calculatedP1Score);
        onFinish(calculatedP1Score, Number(inTuneTicks.toFixed(1)));
      }
    }, 1000);
  }, [mode, selectedNote.frequency]);

  const startSimulatedPlayer2Turn = useCallback((p1FinalScore: number) => {
    setGameState('player2_singing');
    let remaining = 10;
    let p2Ticks = 0;

    const targetAccuracy = opponent ? (opponent.stabilityScore || 85) / 100 : 0.85;

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setP2TimeLeft(remaining);

      if (Math.random() < targetAccuracy) {
        p2Ticks += 0.8;
      } else {
        p2Ticks += 0.2;
      }
      setP2InTuneSeconds(Number(p2Ticks.toFixed(1)));

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);

        const variance = Math.floor(Math.random() * 20) - 10;
        const calculatedP2Score = Math.min(100, Math.max(30, Math.round(targetAccuracy * 100) + variance));
        setP2Score(calculatedP2Score);
        finishDuel(p1FinalScore, calculatedP2Score, p1InTuneSeconds, Number(p2Ticks.toFixed(1)));
      }
    }, 1000);
  }, [finishDuel, opponent, p1InTuneSeconds]);

  const startPlayer1Turn = useCallback(async () => {
    audioService.playClickSound();
    setP1InTuneSeconds(0);
    setP1TimeLeft(10);
    setP1CurrentPitch(null);
    setP1PitchDiff(null);

    // Si es Carrera Celeste (Unit 4), pasar a la arena de vuelo
    if (duelType === 'sky_run_duel') {
      if (mode === 'realtime_p2p' && opponent) {
        setGameState('connecting_p2p');
        setP2pStatusMsg(`Conectando pista de vuelo con ${opponent.name}...`);
        const myCode = localStorage.getItem('laclave_my_friend_code') || 'CLAVE-7782';

        p2pDuelService.onConnected = () => {
          setP2pStatusMsg('Conexion P2P establecida. Comenzando...');
          setGameState('unit4_arena');
        };

        p2pDuelService.onError = () => {
          setP2pStatusMsg('Pasando a Modo Fantasma con la sombra de tu amigo...');
          setTimeout(() => {
            setGameState('unit4_arena');
          }, 1200);
        };

        try {
          const roomId = await p2pDuelService.createRoom(myCode, opponent.code, 'Carrera Celeste', 'sky_run_duel');
          setP2pRoomId(roomId);
        } catch {
          setGameState('unit4_arena');
        }
        return;
      }

      setGameState('unit4_arena');
      return;
    }

    // Duelo de Afinacion Pura
    if (mode === 'realtime_p2p' && opponent) {
      setGameState('connecting_p2p');
      setP2pStatusMsg(`Conectando con ${opponent.name}...`);
      const myCode = localStorage.getItem('laclave_my_friend_code') || 'CLAVE-7782';

      p2pDuelService.onConnected = () => {
        setP2pStatusMsg('Conexion P2P establecida. Comenzando...');
        setGameState('player1_singing');
        startSingingLoop((score, inTuneSec) => {
          p2pDuelService.sendPacket({
            type: 'finish',
            finalScore: score,
            stabilitySec: inTuneSec
          });
        });
      };

      p2pDuelService.onPacket = (packet: P2PDataPacket) => {
        if (packet.type === 'pitch') {
          setP2CurrentPitch(packet.hz);
          setP2PitchDiff(packet.centsDiff);
          setP2Score(packet.score);
          setP2TimeLeft(packet.timeLeft);
        } else if (packet.type === 'finish') {
          setP2Score(packet.finalScore);
          setP2InTuneSeconds(packet.stabilitySec);
          finishDuel(p1Score, packet.finalScore, p1InTuneSeconds, packet.stabilitySec);
        }
      };

      p2pDuelService.onError = () => {
        setP2pStatusMsg('No se pudo conectar en vivo. Pasando a Modo Fantasma...');
        setTimeout(() => {
          setGameState('player1_singing');
          startSingingLoop((score) => {
            startSimulatedPlayer2Turn(score);
          });
        }, 1200);
      };

      try {
        const roomId = await p2pDuelService.createRoom(myCode, opponent.code, selectedNote.name, 'pitch_duel');
        setP2pRoomId(roomId);
      } catch {
        setGameState('player1_singing');
        startSingingLoop((score) => {
          startSimulatedPlayer2Turn(score);
        });
      }
      return;
    }

    setGameState('player1_singing');
    startSingingLoop((score) => {
      if (mode === 'simulated') {
        startSimulatedPlayer2Turn(score);
      } else if (mode === 'local') {
        setGameState('player2_singing');
      }
    });
  }, [duelType, mode, opponent, selectedNote.name, startSingingLoop, startSimulatedPlayer2Turn, finishDuel, p1InTuneSeconds, p1Score]);

  const finishUnit4Arena = useCallback((playerScoreVal: number, opponentScoreVal: number, won: boolean) => {
    setP1Score(playerScoreVal);
    setP2Score(opponentScoreVal);
    setP1Won(won);
    setGameState('results');

    const xpEarned = won ? 50 : 20;
    if (onGrantXp) onGrantXp(xpEarned);

    const myCode = typeof window !== 'undefined' ? (localStorage.getItem('laclave_my_friend_code') || 'MI_CODIGO') : 'MI_CODIGO';
    friendsSyncService.recordDuelResult({
      challengerCode: myCode,
      opponentCode: opponent ? opponent.code : 'GHOST_RIVAL',
      targetNote: 'Carrera Celeste',
      challengerScore: playerScoreVal,
      opponentScore: opponentScoreVal,
      winnerCode: won ? myCode : (opponent ? opponent.code : 'GHOST_RIVAL'),
      xpAwarded: xpEarned,
      duelType: 'sky_run_duel',
    });

    if (won) {
      audioService.playSuccessBellSound();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } else {
      audioService.playSadDefeatSound();
    }
  }, [onGrantXp, opponent]);

  const startLocalPlayer2Turn = useCallback(async () => {
    let inTuneTicks = 0;
    let remaining = 10;
    const targetFreq = selectedNote.frequency;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 0) {
        setP2CurrentPitch(pitchHz);
        const cents = calculateCentsOff(pitchHz, targetFreq);
        if (Math.abs(cents) <= 25) {
          inTuneTicks += 0.1;
          setP2InTuneSeconds(Number(inTuneTicks.toFixed(1)));
        }
      }
    });

    if (!micSuccess) {
      alert('No se pudo iniciar el microfono para el Jugador 2.');
      setGameState('setup');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setP2TimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        audioService.stopMicrophone();

        const calculatedP2Score = Math.min(100, Math.round(inTuneTicks * 10));
        setP2Score(calculatedP2Score);
        finishDuel(p1Score, calculatedP2Score, p1InTuneSeconds, Number(inTuneTicks.toFixed(1)));
      }
    }, 1000);
  }, [finishDuel, p1InTuneSeconds, p1Score, selectedNote]);

  const resetGame = useCallback(() => {
    audioService.playClickSound();
    p2pDuelService.close();
    setGameState('setup');
  }, []);

  return {
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
    startLocalPlayer2Turn,
    resetGame,
  };
}
