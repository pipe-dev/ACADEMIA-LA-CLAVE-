export interface SavedRangeData {
  minHz: number;
  maxHz: number;
  noteMin: string;
  noteMax: string;
  classification: string;
  gender?: 'masculino' | 'femenino';
}

export interface VocalRangeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSaveRange?: (rangeData: SavedRangeData) => void;
  isEmbeddedView?: boolean;
}

export type VocalRangeStep = 'intro' | 'lowest' | 'highest' | 'result';

export interface VoiceClassification {
  classification: string;
  description: string;
  tips: string[];
}
