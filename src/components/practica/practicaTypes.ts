import { UserStats } from '../../types';

export interface CatalogTrack {
  id: string;
  rank?: number;
  title: string;
  artist: string;
  category: string;
  genre?: string;
  thumbnail: string;
}

export interface PracticaViewProps {
  userStats: UserStats;
  onUpdateQuestProgress?: (seconds: number) => void;
  zenMode?: boolean;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onGainLife?: () => void;
  onUseCourtesySong?: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export interface ComboTextItem {
  id: number;
  text: string;
  color: string;
}

export interface KaraokeScore {
  videoId: string;
  trackName: string;
  artistName: string;
  score: number;
  stars: number;
  date: number;
}

export const saveKaraokeScore = async (score: KaraokeScore): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('afinapp_karaoke_history');
    const history: KaraokeScore[] = raw ? JSON.parse(raw) : [];
    history.unshift(score);
    localStorage.setItem('afinapp_karaoke_history', JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.error('Error guardando en historial:', err);
  }
};
