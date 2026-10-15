import { UserStats } from '../../types';

export interface DynamicStreakAction {
  tab: 'practica' | 'academia' | 'afinador';
  name: string;
  litText: string;
  unlitText: string;
  icon: string;
}

export const DYNAMIC_STREAK_ACTIONS: DynamicStreakAction[] = [
  {
    tab: 'practica',
    name: 'Práctica',
    litText: 'Seguir Cantando en Karaoke',
    unlitText: 'Cantar para Asegurar Racha',
    icon: 'mic_external_on',
  },
  {
    tab: 'academia',
    name: 'Academia',
    litText: 'Continuar Lecciones en Academia',
    unlitText: 'Completar Lección para Asegurar Racha',
    icon: 'map',
  },
  {
    tab: 'afinador',
    name: 'Afinador',
    litText: 'Entrenar Oído en el Afinador',
    unlitText: 'Vocalizar para Asegurar Racha',
    icon: 'graphic_eq',
  },
];

export interface HeaderProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  ambientSound?: boolean;
  isOnline?: boolean;
  onToggleDarkMode?: () => void;
  onToggleZenMode?: () => void;
  onToggleAmbientSound?: () => void;
  onOpenStore?: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenSettings?: () => void;
  onOpenFlameView?: () => void;
  onNavigateTab?: (tab: 'academia' | 'afinador' | 'practica') => void;
  onNavigateToPractice?: () => void;
}
