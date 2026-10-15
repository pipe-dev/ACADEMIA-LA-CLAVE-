import { NoteInfo } from '../../utils/voicePlaybackService';

export interface TunerPitchChallengeViewProps {
  difficultyLabel: string;
  levelNumber: number;
  subtitle?: string;
  notes: NoteInfo[];
  toleranceCents?: number;
  gender?: 'masculino' | 'femenino';
  vocalRangeData?: any;
  zenMode?: boolean;
  darkMode?: boolean;
  onSuccess: () => void;
}
