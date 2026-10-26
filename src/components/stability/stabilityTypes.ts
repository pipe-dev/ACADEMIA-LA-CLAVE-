import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';

export interface SavedVocalRangeData {
  noteMin?: string;
  noteMax?: string;
  minHz?: number;
  maxHz?: number;
  classification?: string;
  gender?: 'masculino' | 'femenino';
}

export type StabilityPhase = 'setup' | 'singing' | 'results';

export interface StabilityTrailPoint {
  time: number;
  centsOff: number;
  inTune: boolean;
}

export interface StabilityChallengeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
}
