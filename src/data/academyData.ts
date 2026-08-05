import { Unit, SolfegeNote, Song, DailyQuest, UserStats } from '../types';

export interface QuickScale {
  id: string;
  name: string;
  description: string;
  notes: { name: string; frequency: number; color: string }[];
}

export const QUICK_SCALES: QuickScale[] = [
  {
    id: 'c-major',
    name: 'Mayor (Do)',
    description: 'Escala diatónica fundamental de solfeo',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'RE', frequency: 293.66, color: '#f97316' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'FA', frequency: 349.23, color: '#22c55e' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'LA', frequency: 440.00, color: '#4338ca' },
      { name: 'SI', frequency: 493.88, color: '#8b5cf6' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
    ]
  },
  {
    id: 'pentatonic',
    name: 'Pentatónica',
    description: 'Ideal para improvisación y agilidad vocal',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'RE', frequency: 293.66, color: '#f97316' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'LA', frequency: 440.00, color: '#4338ca' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
    ]
  },
  {
    id: 'c-minor',
    name: 'Menor Natural',
    description: 'Sonoridad melancólica para expresión vocal',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'RE', frequency: 293.66, color: '#f97316' },
      { name: 'MIB', frequency: 311.13, color: '#a855f7' },
      { name: 'FA', frequency: 349.23, color: '#22c55e' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'LAB', frequency: 415.30, color: '#6366f1' },
      { name: 'SIB', frequency: 466.16, color: '#06b6d4' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
    ]
  },
  {
    id: 'arpeggio',
    name: 'Arpegio Mayor',
    description: 'Saltos interválicos para entonación limpia',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
    ]
  }
];

import { ALL_200_SINGING_BADGES } from './badgesData';

export const DEFAULT_BADGES = ALL_200_SINGING_BADGES;

export const INITIAL_USER_STATS: UserStats = {
  name: 'Alex',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  streak: 0,
  lives: 5,
  maxLives: 5,
  level: 1,
  levelTitle: 'Vocalista Principiante',
  xp: 0,
  maxXP: 100,
  lessonsCompleted: 0,
  practiceMinutes: 0,
  badges: ALL_200_SINGING_BADGES,
  xpHistory: [
    { day: 'Lun', xp: 0 },
    { day: 'Mar', xp: 0 },
    { day: 'Mié', xp: 0 },
    { day: 'Jue', xp: 0 },
    { day: 'Vie', xp: 0 },
    { day: 'Sáb', xp: 0 },
    { day: 'Hoy', xp: 0 }
  ],
  recentLessons: []
};

export const INITIAL_UNITS: Unit[] = [
  {
    id: 1,
    title: 'Unidad 1: Respiración',
    subtitle: 'Domina el apoyo diafragmático',
    color: '#4648d4',
    shadowColor: '#282a9e',
    nodes: [
      {
        id: 'u1-node1',
        unitId: 1,
        title: 'Conceptos',
        type: 'concept',
        status: 'current',
        iconName: 'Sparkles',
        tooltip: '¡EMPEZAR!',
        offsetPercentage: 0,
        xpReward: 20,
        instructions: 'Aprende los fundamentos de la postura y el apoyo diafragmático al cantar.'
      },
      {
        id: 'u1-node2',
        unitId: 1,
        title: 'Ejercicios',
        type: 'exercise',
        status: 'locked',
        iconName: 'Lock',
        offsetPercentage: 25,
        xpReward: 30,
        instructions: 'Inhala en 4 tiempos, sostén el aire en 4 y exhala suavemente produciendo una "S" constante.'
      },
      {
        id: 'u1-node3',
        unitId: 1,
        title: 'Control de Aire',
        type: 'control',
        status: 'locked',
        iconName: 'Lock',
        offsetPercentage: -15,
        xpReward: 50,
        audioPitchTarget: 220,
        instructions: 'Mantén una nota prolongada manteniendo la presión del aire estable sin fluctuaciones.'
      }
    ]
  },
  {
    id: 2,
    title: 'Unidad 2: Resonancia',
    subtitle: 'Encuentra tu brillo vocal',
    color: '#94a3b8',
    shadowColor: '#64748b',
    nodes: [
      {
        id: 'u2-node1',
        unitId: 2,
        title: 'Colocación de la Máscara',
        type: 'locked',
        status: 'locked',
        iconName: 'Lock',
        offsetPercentage: 10,
        xpReward: 40
      },
      {
        id: 'u2-node2',
        unitId: 2,
        title: 'Vocalización Sirena',
        type: 'locked',
        status: 'locked',
        iconName: 'Lock',
        offsetPercentage: -20,
        xpReward: 40
      },
      {
        id: 'u2-node3',
        unitId: 2,
        title: 'Examen Final',
        subTitle: 'Evaluación de Resonancia',
        type: 'exam',
        status: 'locked',
        iconName: 'Trophy',
        offsetPercentage: 0,
        xpReward: 100
      }
    ]
  }
];

export const SOLFEGE_NOTES: SolfegeNote[] = [
  { name: 'DO', letter: 'C', frequency: 261.63, bgColor: '#ef4444', shadowColor: '#b91c1c' },
  { name: 'RE', letter: 'D', frequency: 293.66, bgColor: '#f97316', shadowColor: '#c2410c' },
  { name: 'MI', letter: 'E', frequency: 329.63, bgColor: '#eab308', shadowColor: '#a16207' },
  { name: 'FA', letter: 'F', frequency: 349.23, bgColor: '#22c55e', shadowColor: '#15803d' },
  { name: 'SOL', letter: 'G', frequency: 392.00, bgColor: '#3b82f6', shadowColor: '#1d4ed8' },
  { name: 'LA', letter: 'A', frequency: 440.00, bgColor: '#4338ca', shadowColor: '#312e81' },
  { name: 'SI', letter: 'B', frequency: 493.88, bgColor: '#8b5cf6', shadowColor: '#6d28d9' }
];

export const SONGS_DATABASE: Song[] = [
  {
    id: 'song-1',
    title: 'Cántale al Señor',
    artist: 'Worship Collective',
    category: 'Christian Music',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 180,
    lyrics: [
      { time: 0, text: 'Mi corazón entona esta canción...', noteTip: 'Inhala profundo con el diafragma' },
      { time: 5, text: 'Cántale al Señor', noteTip: 'Manten la nota LA en resonancia alta' },
      { time: 12, text: 'Toda la tierra, cante al Señor...', noteTip: 'Vibrato suave en las vocales finales' },
      { time: 18, text: 'Grande es el Señor y digno de suprema alabanza', noteTip: 'Apertura de paladar blando' },
      { time: 26, text: 'Su gloria llena la creación entera', noteTip: 'Proyección limpia en resonadores' }
    ]
  },
  {
    id: 'song-2',
    title: 'Afinación Vocal Diaria',
    artist: 'Academia La Clave',
    category: 'Calentamiento Vocal',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 120,
    lyrics: [
      { time: 0, text: 'Do - Re - Mi - Fa - Sol - La - Si - Do', noteTip: 'Subiendo la escala diatónica' },
      { time: 8, text: 'Do - Si - La - Sol - Fa - Mi - Re - Do', noteTip: 'Bajando con respiración sostenida' },
      { time: 16, text: 'Trino de labios en arpegio mayor', noteTip: 'Relaja la mandíbula y cuello' }
    ]
  },
  {
    id: 'song-3',
    title: 'Sublime Gracia',
    artist: 'Ensambles Vocales',
    category: 'Christian Music',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 150,
    lyrics: [
      { time: 0, text: 'Sublime gracia del Señor', noteTip: 'Tono cálido de pecho' },
      { time: 6, text: 'Que a un infeliz salvó', noteTip: 'Modulación hacia voz mixta' },
      { time: 12, text: 'Fui ciego mas hoy veo yo', noteTip: 'Sostener sostenuto limpio' }
    ]
  }
];

export const INITIAL_QUESTS: DailyQuest[] = [
  {
    id: 'quest-1',
    title: 'Afina 50 notas',
    progress: 0,
    max: 50,
    completed: false,
    xpReward: 50,
    iconType: 'note'
  },
  {
    id: 'quest-2',
    title: 'Practica 10 minutos',
    progress: 0,
    max: 10,
    completed: false,
    xpReward: 80,
    iconType: 'clock'
  },
  {
    id: 'quest-3',
    title: 'Completa 2 lecciones',
    progress: 0,
    max: 2,
    completed: false,
    xpReward: 100,
    iconType: 'book'
  }
];
