import { Badge } from '../types';
import { EASY_SINGING_BADGES } from './badgesEasy';
import { MEDIUM_SINGING_BADGES } from './badgesMedium';
import { HARD_SINGING_BADGES } from './badgesHard';

export const BADGE_CATEGORIES = [
  'Afinación',
  'Academia',
  'Ritmo',
  'Herramientas',
  'Racha',
  'Práctica',
  'Maestría'
] as const;

export type BadgeCategory = typeof BADGE_CATEGORIES[number];

export { EASY_SINGING_BADGES, MEDIUM_SINGING_BADGES, HARD_SINGING_BADGES };

/**
 * 50 Singing Achievements for AfinApp
 * 10 Fáciles (Introductorias / Primeros Pasos)
 * 20 Medias (Desarrollo y Consistencia Técnica)
 * 20 Difíciles (Maestría y Alta Exigencia)
 */
export const ALL_50_SINGING_BADGES: Badge[] = [
  ...EASY_SINGING_BADGES,
  ...MEDIUM_SINGING_BADGES,
  ...HARD_SINGING_BADGES,
];

// Backward-compatibility alias
export const ALL_200_SINGING_BADGES: Badge[] = ALL_50_SINGING_BADGES;
