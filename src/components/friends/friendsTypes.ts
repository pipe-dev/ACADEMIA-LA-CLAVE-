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
  rhythmRecord?: number;
}

export const DEFAULT_VOCAL_AVATARS: { id: string; name: string; url: string }[] = [
  { id: 'soprano', name: 'Soprano', url: '/avatars/avatar-soprano.svg' },
  { id: 'tenor', name: 'Tenor', url: '/avatars/avatar-tenor.svg' },
  { id: 'mezzosoprano', name: 'Mezzosoprano', url: '/avatars/avatar-mezzosoprano.svg' },
  { id: 'baritono', name: 'Barítono', url: '/avatars/avatar-baritono.svg' },
  { id: 'contralto', name: 'Contralto', url: '/avatars/avatar-contralto.svg' },
  { id: 'bajo', name: 'Bajo', url: '/avatars/avatar-bajo.svg' },
  { id: 'armonia', name: 'Armonía', url: '/avatars/avatar-armonia.svg' },
  { id: 'acustico', name: 'Acústico', url: '/avatars/avatar-acustico.svg' }
];

export const INITIAL_DEMO_FRIENDS: FriendItem[] = [
  {
    id: 'f1',
    code: 'VOCAL-9821',
    name: 'Camila Ríos',
    avatar: '/avatars/avatar-soprano.svg',
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
    skyRunRecord: 14,
    rhythmRecord: 38
  },
  {
    id: 'f2',
    code: 'CANTO-4102',
    name: 'Mateo Fernández',
    avatar: '/avatars/avatar-tenor.svg',
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
    skyRunRecord: 10,
    rhythmRecord: 26
  },
  {
    id: 'f3',
    code: 'SOLFEO-8830',
    name: 'Sofía Mendoza',
    avatar: '/avatars/avatar-mezzosoprano.svg',
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
    skyRunRecord: 18,
    rhythmRecord: 44
  }
];

export const DEMO_FRIEND_DIRECTORY: Record<string, Omit<FriendItem, 'id'>> = {
  'VOCAL-2026': {
    code: 'VOCAL-2026',
    name: 'Lucas Barítono',
    avatar: '/avatars/avatar-baritono.svg',
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
    avatar: '/avatars/avatar-contralto.svg',
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
