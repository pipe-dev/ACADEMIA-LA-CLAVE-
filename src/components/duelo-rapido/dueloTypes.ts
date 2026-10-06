import { SolfegeNote } from '../../types';
import { FriendItem } from '../FriendsSection';

export type DuelType = 'pitch_duel' | 'rhythm_duel' | 'sky_run_duel';

export type DuelGameState = 
  | 'setup' 
  | 'connecting_p2p'
  | 'player1_singing' 
  | 'player2_singing' 
  | 'realtime_singing' 
  | 'unit4_arena'
  | 'results';

export type DuelMode = 'simulated' | 'local' | 'realtime_p2p' | 'ghost_async';

export interface DueloRapidoModalProps {
  isOpen?: boolean;
  onClose: () => void;
  opponent?: FriendItem | null;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
  initialDuelType?: DuelType;
}

export interface DuelResult {
  id: string;
  timestamp: string;
  noteName: string;
  opponentName: string;
  player1Score: number;
  player2Score: number;
  player1StabilitySec: number;
  player2StabilitySec: number;
  won: boolean;
  duelType?: DuelType;
}

// Protocolo extensible de paquetes en tiempo real por WebRTC DataChannel
export interface P2PPitchPacket {
  type: 'pitch';
  hz: number | null;
  centsDiff: number | null;
  inTune: boolean;
  score: number;
  timeLeft: number;
}

export interface P2PRhythmPacket {
  type: 'rhythm';
  hitAccuracy: 'perfect' | 'good' | 'miss';
  streak: number;
  score: number;
}

export interface P2PSkyRunPacket {
  type: 'sky_run';
  height: number;
  rot?: number;
  score: number;
  alive: boolean;
}

export interface P2PFinishPacket {
  type: 'finish';
  finalScore: number;
  stabilitySec: number;
}

export type P2PDataPacket = P2PPitchPacket | P2PRhythmPacket | P2PSkyRunPacket | P2PFinishPacket;
