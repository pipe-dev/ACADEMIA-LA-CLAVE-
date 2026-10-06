export interface FriendItem {
  id: string;
  code: string;
  name: string;
  avatar: string;
  level: number;
  levelTitle: string;
  streak: number;
  xpThisWeek: number;
  vocalRange: string;
  statusText?: string;
  isOnline: boolean;
  duelsWonAgainst?: number;
  duelsLostAgainst?: number;
  lastDuelNote?: string;
  lastDuelScore?: number;
  lastNudgeSent?: boolean;
  joinedDate?: string;
  totalXp?: number;
  lessonsCompleted?: number;
  practiceMinutes?: number;
  stabilityScore?: number;
  badgesCount?: number;
  skyRunRecord?: number;
}

export const DEFAULT_VOCAL_AVATARS: { id: string; name: string; url: string }[] = [
  { id: 'soprano', name: 'Soprano', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'tenor', name: 'Tenor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'mezzosoprano', name: 'Mezzosoprano', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: 'baritono', name: 'Barítono', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'contralto', name: 'Contralto', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80' },
  { id: 'bajo', name: 'Bajo', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { id: 'armonia', name: 'Armonía', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'acustico', name: 'Acústico', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' }
];

export const INITIAL_DEMO_FRIENDS: FriendItem[] = [
  {
    id: 'f1',
    code: 'VOCAL-9821',
    name: 'Camila Ríos',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    level: 5,
    levelTitle: 'Soprano Aficionada',
    streak: 8,
    xpThisWeek: 1240,
    vocalRange: 'Soprano (Do4 - Do6)',
    statusText: 'Afino 12 notas hoy',
    isOnline: true,
    duelsWonAgainst: 3,
    duelsLostAgainst: 1,
    lastDuelNote: 'Sol4',
    lastDuelScore: 94,
    joinedDate: 'Marzo 2026',
    totalXp: 3840,
    lessonsCompleted: 18,
    practiceMinutes: 142,
    stabilityScore: 94,
    badgesCount: 14,
    skyRunRecord: 14
  },
  {
    id: 'f2',
    code: 'CANTO-4102',
    name: 'Mateo Fernández',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    level: 4,
    levelTitle: 'Tenor Lírico',
    streak: 5,
    xpThisWeek: 980,
    vocalRange: 'Tenor (La2 - Sol4)',
    statusText: 'Practicando apoyo diafragmático',
    isOnline: false,
    duelsWonAgainst: 2,
    duelsLostAgainst: 2,
    lastDuelNote: 'Mi3',
    lastDuelScore: 88,
    joinedDate: 'Febrero 2026',
    totalXp: 2950,
    lessonsCompleted: 12,
    practiceMinutes: 98,
    stabilityScore: 89,
    badgesCount: 9,
    skyRunRecord: 10
  },
  {
    id: 'f3',
    code: 'SOLFEO-8830',
    name: 'Sofía Mendoza',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    level: 6,
    levelTitle: 'Mezzosoprano Vocal',
    streak: 12,
    xpThisWeek: 1450,
    vocalRange: 'Mezzosoprano (La2 - La5)',
    statusText: 'En racha de 12 días seguidos',
    isOnline: true,
    duelsWonAgainst: 4,
    duelsLostAgainst: 3,
    lastDuelNote: 'La4',
    lastDuelScore: 98,
    joinedDate: 'Enero 2026',
    totalXp: 4920,
    lessonsCompleted: 26,
    practiceMinutes: 215,
    stabilityScore: 97,
    badgesCount: 19,
    skyRunRecord: 18
  }
];

export const DEMO_FRIEND_DIRECTORY: Record<string, Omit<FriendItem, 'id'>> = {
  'VOCAL-2026': {
    code: 'VOCAL-2026',
    name: 'Lucas Barítono',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    level: 3,
    levelTitle: 'Barítono Resonante',
    streak: 4,
    xpThisWeek: 720,
    vocalRange: 'Barítono (Mi2 - Mi4)',
    statusText: 'Listo para dueto de afinación',
    isOnline: true,
    duelsWonAgainst: 1,
    duelsLostAgainst: 0,
    lastDuelNote: 'Do3',
    lastDuelScore: 91,
    joinedDate: 'Abril 2026',
    totalXp: 2100,
    lessonsCompleted: 8,
    practiceMinutes: 75,
    stabilityScore: 88,
    badgesCount: 7
  },
  'CANTO-9941': {
    code: 'CANTO-9941',
    name: 'Elena Canto',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
    level: 7,
    levelTitle: 'Maestra de Solfeo',
    streak: 15,
    xpThisWeek: 1890,
    vocalRange: 'Contralto (Fa3 - Fa5)',
    statusText: 'Superó la lección de escalas',
    isOnline: false,
    duelsWonAgainst: 5,
    duelsLostAgainst: 4,
    lastDuelNote: 'Fa4',
    lastDuelScore: 96,
    joinedDate: 'Diciembre 2025',
    totalXp: 5800,
    lessonsCompleted: 34,
    practiceMinutes: 280,
    stabilityScore: 98,
    badgesCount: 23
  }
};

export interface FriendsSectionProps {
  userXp: number;
  userLevel: number;
  zenMode?: boolean;
}
