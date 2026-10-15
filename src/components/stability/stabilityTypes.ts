import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';

export interface SavedVocalRangeData {
  noteMin?: string;
  noteMax?: string;
  minHz?: number;
  maxHz?: number;
  classification?: string;
}

export type StabilityPhase = 'setup' | 'singing' | 'results';

export interface StabilityChallengeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
}
