export type TabType = 'academia' | 'afinador' | 'practica' | 'progreso' | 'racha';

export interface XpHistoryEntry {
  day: string;
  xp: number;
}

export interface CompletedLessonEntry {
  id: string;
  title: string;
  unitTitle?: string;
  completedAt: string;
  score: number; // percentage (0 - 100)
  xpEarned: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string; // 'Flame' | 'Clock' | 'CheckCircle2' | 'Award' | 'Sparkles' | 'Music'
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  difficulty?: 'Fácil' | 'Medio' | 'Difícil';
}

export interface UserStats {
  name: string;
  avatarUrl: string;
  streak: number;
  lives: number;
  maxLives: number;
  lastLifeLostAt?: number | null;
  lifePurchaseCount?: number;
  hasUsedCourtesySong?: boolean;
  level: number;
  levelTitle: string;
  xp: number;
  maxXP: number;
  lessonsCompleted?: number;
  practiceMinutes?: number;
  todayPracticeMinutes?: number;
  lastPracticeDate?: string;
  dailyGoalMinutes?: number;
  badges?: Badge[];
  xpHistory?: XpHistoryEntry[];
  recentLessons?: CompletedLessonEntry[];
  vocalRange?: string;
  vocalRangeData?: {
    minHz: number;
    maxHz: number;
    noteMin: string;
    noteMax: string;
    classification: string;
  };
}

export type NodeStatus = 'completed' | 'current' | 'locked';
export type NodeType = 'concept' | 'exercise' | 'control' | 'locked' | 'exam';

export interface LessonNode {
  id: string;
  unitId: number;
  title: string;
  subTitle?: string;
  type: NodeType;
  status: NodeStatus;
  iconName: string;
  offsetPercentage: number; // For zig-zag layout (-30 to +30 %)
  tooltip?: string;
  xpReward: number;
  instructions?: string;
  audioPitchTarget?: number; // target frequency in Hz for pitch quiz
  isDownloaded?: boolean;
  youtubeId?: string;
  duration?: string;
  loopCount?: number;
}

export interface Unit {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  shadowColor: string;
  nodes: LessonNode[];
}

export interface SolfegeNote {
  name: string;      // "DO", "RE", "MI", "FA", "SOL", "LA", "SI"
  letter: string;    // "C", "D", "E", "F", "G", "A", "B"
  frequency: number; // Hz (e.g. 440 Hz for LA)
  bgColor: string;   // Tailind / hex color
  shadowColor: string;
  octave?: number;
}

export interface SongLyricLine {
  time: number; // in seconds
  text: string;
  noteTip?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  coverUrl: string;
  durationSeconds: number;
  lyrics: SongLyricLine[];
}

export interface DailyQuest {
  id: string;
  title: string;
  progress: number;
  max: number;
  completed: boolean;
  claimed?: boolean;
  xpReward: number;
  iconType: 'note' | 'clock' | 'book' | 'zap' | 'mic' | 'activity' | 'wind' | 'music' | 'play';
  category?: 'tuner' | 'academy' | 'practice';
  eventType?: string;
}

export interface VoiceEvaluationResult {
  score: number;
  pitchAccuracy: number;
  breathSupport: number;
  toneWarmth: number;
  rangeDetected: string; // e.g. "Tenor (A2 - G4)"
  feedbackMsg: string;
  strengths: string[];
  recommendations: string[];
  centsDeviationAvg?: number;
  pitchStability?: number;
  tunerHistorySummary?: {
    totalNotesTuned: number;
    avgDiffHz: number;
    biasTrend: 'agudo' | 'grave' | 'equilibrado';
    mostPracticedNote?: string;
  };
  improvementPoints?: string[];
  insufficientAudio?: boolean;
}
