export interface RhythmPatternItem {
  time: number;
  instrument: 'clap' | 'kick';
}

export interface TunerRhythmViewProps {
  level: number;
  pattern: RhythmPatternItem[];
  bpm?: number;
  onSuccess: (score: number) => void;
  onFail?: (score?: number) => void;
  onExit?: () => void;
  hideExitButton?: boolean;
}

export type RhythmPhase = 'guide' | 'playing' | 'results';

export interface FloatingFeedbackText {
  id: number;
  text: string;
  color: string;
  side: 'left' | 'right';
}

export interface UserTapRecord {
  time: number;
  instrument: 'clap' | 'kick';
  pulseIndex?: number;
  deviationMs?: number;
}
