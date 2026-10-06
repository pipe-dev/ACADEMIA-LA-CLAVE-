import { useState, useEffect, useRef, useCallback } from 'react';
import { audioService } from '../../utils/audioService';
import { calculateCentsOff } from '../../utils/pitchUtils';
import { SOLFEGE_NOTES } from '../../data/academyData';
import { SolfegeNote } from '../../types';
import { FriendItem } from '../FriendsSection';
import { DuelResult, DuelGameState, DuelMode, P2PDataPacket } from './dueloTypes';
import { friendsSyncService } from '../../utils/friendsSyncService';
import { p2pDuelService } from '../../utils/p2pDuelService';
import confetti from 'canvas-confetti';

interface UseDuelEngineParams {
  isOpen: boolean;
  isEmbeddedView: boolean;
  opponent?: FriendItem | null;
  onGrantXp?: (amount: number) => void;
}

export function useDuelEngine({
  isOpen,
  isEmbeddedView,
  opponent,
  onGrantXp,
}: UseDuelEngineParams) {
  const [selectedNote, setSelectedNote] = useState<SolfegeNote>(SOLFEGE_NOTES[4]); // SOL (392 Hz)
  const [mode, setMode] = useState<DuelMode>('simulated');
  const [selectedOpponentName, setSelectedOpponentName] = useState<string>(
    opponent ? opponent.name : 'Camila Rios'
  );

  // Game state: 'setup' | 'connecting_p2p' | 'player1_singing' | 'player2_singing' | 'realtime_singing' | 'results'
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

  // General active status
  const [_statusText, setStatusText] = useState<string>('Manten la nota lo mas estable posible');
  const [p1Won, setP1Won] = useState<boolean>(false);

  // Refs for tracking pitch in loops
  const timerRef = useRef<number | null>(null);
  const lastVibeRef = useRef<number>(0);

  useEffect(() => {
    if (opponent) {
      setSelectedOpponentName(opponent.name);
    }
  }, [opponent]);

  // Clean up mic and P2P on modal close
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) {
      audioService.stopMicrophone();
      p2pDuelService.close();
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('setup');
    }
  }, [isOpen, isEmbeddedView]);

  const handlePlayReferenceSound = useCallback(() => {
    audioService.playClickSound();
    audioService.playFrequency(selectedNote.frequency, 1.5);
  }, [selectedNote.frequency]);

  const finishDuel = useCallback(
    (p1S: number, p2S: number, p1Sec: number, p2Sec: number) => {
      setGameState('results');
      const isWinner = p1S >= p2S;
      setP1Won(isWinner);

      if (isWinner) {
        audioService.playBadgeUnlockedSound();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        if (onGrantXp) onGrantXp(50);
      } else {
        audioService.playSoftDing();
        if (onGrantXp) onGrantXp(15);
      }

      // 1. Guardar en historial local
      try {
        const historyItem: DuelResult = {
          id: `duel_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          noteName: selectedNote.name,
          opponentName: selectedOpponentName,
          player1Score: p1S,
          player2Score: p2S,
          player1StabilitySec: p1Sec,
          player2StabilitySec: p2Sec,
          won: isWinner,
          duelType: 'pitch_duel'
        };

        const existing = localStorage.getItem('laclave_duel_history');
        const list = existing ? JSON.parse(existing) : [];
        const updated = [historyItem, ...list].slice(0, 10);
        localStorage.setItem('laclave_duel_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save duel history:', e);
      }

      // 2. Sincronizar resultado con Cloudflare D1 y actualizar balance cara a cara
      if (opponent?.code) {
        try {
          const myCode = localStorage.getItem('laclave_my_friend_code') || 'CLAVE-7782';
          friendsSyncService.recordDuelResult({
            challengerCode: myCode,
            opponentCode: opponent.code,
            targetNote: selectedNote.name,
            challengerScore: p1S,
            opponentScore: p2S,
            winnerCode: isWinner ? myCode : opponent.code,
            xpAwarded: isWinner ? 50 : 15,
            duelType: 'pitch_duel'
          });
        } catch (e) {
          console.warn('Could not sync duel result:', e);
        }
      }
    },
    [onGrantXp, opponent?.code, selectedNote.name, selectedOpponentName]
  );

  const startSimulatedPlayer2Turn = useCallback(
    (finalP1Score: number) => {
      setGameState('player2_singing');
      setStatusText(`${selectedOpponentName} esta cantando en vivo...`);

      let remaining = 10;
      let simTicks = 0;

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        remaining -= 1;
        setP2TimeLeft(remaining);

        // Simular estabilidad de tono (70% tasa de acierto)
        const simulatedInTune = Math.random() > 0.3;
        if (simulatedInTune) {
          simTicks += 0.8;
          const fakeFreq = selectedNote.frequency + (Math.random() * 4 - 2);
          setP2CurrentPitch(Math.round(fakeFreq));
          setP2PitchDiff(Math.round(Math.abs(fakeFreq - selectedNote.frequency)));
          setP2InTuneSeconds(Number(simTicks.toFixed(1)));
        } else {
          const fakeFreq = selectedNote.frequency + (Math.random() * 18 - 9);
          setP2CurrentPitch(Math.round(fakeFreq));
          setP2PitchDiff(Math.round(Math.abs(fakeFreq - selectedNote.frequency)));
        }

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);

          const baseSimScore = Math.floor(Math.random() * 30) + 55;
          const finalP2Score = Math.min(100, Math.max(30, baseSimScore));
          setP2Score(finalP2Score);

          finishDuel(finalP1Score, finalP2Score, p1InTuneSeconds, Number(simTicks.toFixed(1)));
        }
      }, 1000);
    },
    [finishDuel, p1InTuneSeconds, selectedNote.frequency, selectedOpponentName]
  );

  const startSingingLoop = useCallback((onFinish: (score: number, inTuneSec: number) => void) => {
    let inTuneTicks = 0;
    let remaining = 10;

    audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        setP1CurrentPitch(Math.round(pitchHz));
        const centsOff = calculateCentsOff(pitchHz, selectedNote.frequency);
        const absCents = Math.abs(centsOff);
        const diffHz = Math.abs(pitchHz - selectedNote.frequency);
        setP1PitchDiff(Math.round(diffHz));

        if (absCents <= 25) {
          inTuneTicks += 0.1;
          const currentInTuneSec = Number(inTuneTicks.toFixed(1));
          setP1InTuneSeconds(currentInTuneSec);

          const now = Date.now();
          if (now - lastVibeRef.current > 1000) {
            audioService.vibrateSuccess();
            lastVibeRef.current = now;
          }
        } else if (absCents > 45) {
          const now = Date.now();
          if (now - lastVibeRef.current > 1200) {
            audioService.vibrateError();
            lastVibeRef.current = now;
          }
        }

        // Si estamos en P2P, emitir paquete de tono en vivo
        if (mode === 'realtime_p2p') {
          p2pDuelService.sendPacket({
            type: 'pitch',
            hz: Math.round(pitchHz),
            centsDiff: Math.round(centsOff),
            inTune: absCents <= 25,
            score: Math.min(100, Math.round(inTuneTicks * 10)),
            timeLeft: remaining
          });
        }
      }
    });

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

  const startPlayer1Turn = useCallback(async () => {
    audioService.playClickSound();
    setP1InTuneSeconds(0);
    setP1TimeLeft(10);
    setP1CurrentPitch(null);
    setP1PitchDiff(null);

    // Modo 1: Duelo en Vivo P2P con WebRTC
    if (mode === 'realtime_p2p' && opponent) {
      setGameState('connecting_p2p');
      setP2pStatusMsg(`Conectando con ${opponent.name}...`);

      const myCode = localStorage.getItem('laclave_my_friend_code') || 'CLAVE-7782';

      p2pDuelService.onConnected = () => {
        setP2pStatusMsg('Conexion P2P establecida. Comenzando...');
        setGameState('player1_singing');
        startSingingLoop((score, inTuneSec) => {
          // Enviar finalizacion por P2P
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
        // Fallback suave a modo simulado si el amigo no esta disponible
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
        // Fallback inmediato
        setGameState('player1_singing');
        startSingingLoop((score) => {
          startSimulatedPlayer2Turn(score);
        });
      }
      return;
    }

    // Modo 2: Modo Simulado o Local (Pasa el microfono)
    setGameState('player1_singing');
    setStatusText('Canta ahora. Manten la nota ' + selectedNote.name);

    startSingingLoop((calculatedP1Score) => {
      if (mode === 'simulated') {
        startSimulatedPlayer2Turn(calculatedP1Score);
      } else {
        setGameState('player2_singing');
        setStatusText(`Turno de ${selectedOpponentName}. Pasa el microfono`);
      }
    });
  }, [finishDuel, mode, opponent, p1InTuneSeconds, p1Score, selectedNote.name, selectedOpponentName, startSimulatedPlayer2Turn, startSingingLoop]);

  const startLocalPlayer2Turn = useCallback(async () => {
    audioService.playClickSound();
    setP2InTuneSeconds(0);
    setP2TimeLeft(10);
    setP2CurrentPitch(null);
    setP2PitchDiff(null);
    setStatusText(`Canta ${selectedOpponentName}. Manten la nota ${selectedNote.name}`);

    let inTuneTicks = 0;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        setP2CurrentPitch(Math.round(pitchHz));
        const centsOff = calculateCentsOff(pitchHz, selectedNote.frequency);
        const absCents = Math.abs(centsOff);
        const diffHz = Math.abs(pitchHz - selectedNote.frequency);
        setP2PitchDiff(Math.round(diffHz));

        if (absCents <= 25) {
          inTuneTicks += 0.1;
          setP2InTuneSeconds(Number(inTuneTicks.toFixed(1)));
          const now = Date.now();
          if (now - lastVibeRef.current > 1000) {
            audioService.vibrateSuccess();
            lastVibeRef.current = now;
          }
        }
      }
    });

    if (!micSuccess) {
      alert('No se pudo iniciar el microfono para el Jugador 2.');
      setGameState('setup');
      return;
    }

    let remaining = 10;
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
  }, [finishDuel, p1InTuneSeconds, p1Score, selectedNote, selectedOpponentName]);

  const resetGame = useCallback(() => {
    audioService.playClickSound();
    p2pDuelService.close();
    setGameState('setup');
  }, []);

  return {
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
    startLocalPlayer2Turn,
    resetGame,
  };
}
