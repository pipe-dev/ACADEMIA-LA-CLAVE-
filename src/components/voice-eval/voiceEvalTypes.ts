export interface VoiceEvalModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isEmbeddedView?: boolean;
}

export interface PitchSample {
  pitchHz: number;
  volume: number;
  timestamp: number;
}

export interface TunerHistoryItem {
  id: string;
  noteName: string;
  noteColor: string;
  targetFreq: number;
  detectedFreq: number;
  diffHz: number;
  timestamp: string;
}

export interface VocalRangeSavedData {
  noteMin?: string;
  noteMax?: string;
  minHz?: number;
  maxHz?: number;
  classification?: string;
  gender?: 'masculino' | 'femenino';
}
