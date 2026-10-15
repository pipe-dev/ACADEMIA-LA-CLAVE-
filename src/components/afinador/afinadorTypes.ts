import { UserStats } from '../../types';

export interface TunedHistoryItem {
  id: string;
  noteName: string;
  noteColor: string;
  targetFreq: number;
  detectedFreq: number;
  diffHz: number;
  timestamp: string;
}

export interface AfinadorViewProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  onUpdateQuestProgress?: (notesTunedCount: number) => void;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export type TunerSubView =
  | 'escalas'
  | 'respiracion'
  | 'estabilidad'
  | 'duelo'
  | 'tesitura'
  | 'evaluacion'
  | null;
