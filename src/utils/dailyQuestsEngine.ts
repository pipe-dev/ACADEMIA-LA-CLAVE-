import { DailyQuest } from '../types';
import { getTodayStr } from './streakPrompt';

export type QuestEventType =
  | 'NOTE_TUNED'            // Afinador: nota afinada (+1)
  | 'LEVEL_COMPLETED'       // Afinador: nivel ganado en Modo Niveles (+1)
  | 'PRACTICE_MINUTES'      // Minutos de práctica activa sumados (+N)
  | 'ACADEMY_LESSON_DONE'   // Academia: nodo o lección completada (+1)
  | 'VOCAL_RANGE_TESTED'    // Modal Rango Vocal: test completado (+1)
  | 'BREATHING_SESSION'     // Modal Respiración: ciclo completado (+1)
  | 'SCALE_TRAINED'         // Modal Escalas: secuencia completada (+1)
  | 'STABILITY_PASSED'      // Modal Estabilidad: reto superado (+1)
  | 'KARAOKE_COMPLETED';    // Práctica: canción finalizada (+1)

export interface QuestTemplate {
  id: string;
  category: 'tuner' | 'academy' | 'practice';
  eventType: QuestEventType;
  title: string;
  max: number;
  xpReward: number;
  iconType: 'note' | 'clock' | 'book' | 'zap' | 'mic' | 'activity' | 'wind' | 'music' | 'play';
}

export interface DailyQuestsState {
  date: string;
  quests: DailyQuest[];
  bonusChestClaimed: boolean;
  bonusChestReward: number;
}

export const BONUS_CHEST_REWARD = 50;
const STORAGE_KEY = 'laclave_daily_quests_v5';

// ─── Catálogo Maestro de Misiones (13 Misiones Reales) ───
// Slot 1: Afinación & Tono (Afinador)
export const SLOT_1_TUNER_POOL: QuestTemplate[] = [
  {
    id: 'tuner_notes_25',
    category: 'tuner',
    eventType: 'NOTE_TUNED',
    title: 'Afina 25 notas en el Afinador',
    max: 25,
    xpReward: 40,
    iconType: 'note',
  },
  {
    id: 'tuner_notes_50',
    category: 'tuner',
    eventType: 'NOTE_TUNED',
    title: 'Afina 50 notas en el Afinador',
    max: 50,
    xpReward: 70,
    iconType: 'note',
  },
  {
    id: 'tuner_notes_75',
    category: 'tuner',
    eventType: 'NOTE_TUNED',
    title: 'Afina 75 notas (Sesión Pro)',
    max: 75,
    xpReward: 90,
    iconType: 'note',
  },
  {
    id: 'tuner_level_win',
    category: 'tuner',
    eventType: 'LEVEL_COMPLETED',
    title: 'Supera 1 nivel en Modo Niveles',
    max: 1,
    xpReward: 80,
    iconType: 'zap',
  },
];

// Slot 2: Academia & Biometría de Voz
export const SLOT_2_ACADEMY_POOL: QuestTemplate[] = [
  {
    id: 'academy_lesson_1',
    category: 'academy',
    eventType: 'ACADEMY_LESSON_DONE',
    title: 'Completa 1 lección en la Academia',
    max: 1,
    xpReward: 60,
    iconType: 'book',
  },
  {
    id: 'academy_lesson_2',
    category: 'academy',
    eventType: 'ACADEMY_LESSON_DONE',
    title: 'Supera 2 lecciones o ejercicios',
    max: 2,
    xpReward: 90,
    iconType: 'book',
  },
  {
    id: 'vocal_range_eval',
    category: 'academy',
    eventType: 'VOCAL_RANGE_TESTED',
    title: 'Evalúa tu Rango Vocal en Afinador',
    max: 1,
    xpReward: 75,
    iconType: 'mic',
  },
  {
    id: 'vocal_stability_pass',
    category: 'academy',
    eventType: 'STABILITY_PASSED',
    title: 'Supera el Reto de Estabilidad Vocal',
    max: 1,
    xpReward: 65,
    iconType: 'activity',
  },
];

// Slot 3: Gimnasia Vocal, Práctica & Tiempo
export const SLOT_3_PRACTICE_POOL: QuestTemplate[] = [
  {
    id: 'breathing_session',
    category: 'practice',
    eventType: 'BREATHING_SESSION',
    title: 'Realiza 1 sesión de Respiración',
    max: 1,
    xpReward: 50,
    iconType: 'wind',
  },
  {
    id: 'scales_trained',
    category: 'practice',
    eventType: 'SCALE_TRAINED',
    title: 'Entrena 1 escala en el modal Escalas',
    max: 1,
    xpReward: 60,
    iconType: 'music',
  },
  {
    id: 'practice_time_5',
    category: 'practice',
    eventType: 'PRACTICE_MINUTES',
    title: 'Entrena al menos 5 minutos hoy',
    max: 5,
    xpReward: 50,
    iconType: 'clock',
  },
  {
    id: 'practice_time_15',
    category: 'practice',
    eventType: 'PRACTICE_MINUTES',
    title: 'Alcanza 15 minutos de práctica diaria',
    max: 15,
    xpReward: 80,
    iconType: 'clock',
  },
  {
    id: 'karaoke_song_1',
    category: 'practice',
    eventType: 'KARAOKE_COMPLETED',
    title: 'Canta 1 canción en Práctica (Karaoke)',
    max: 1,
    xpReward: 70,
    iconType: 'play',
  },
];

// Hash determinista de fecha para rotación coordinada
function hashDateString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateDailyQuests(dateStr: string): DailyQuest[] {
  const hash = hashDateString(dateStr);
  const q1 = SLOT_1_TUNER_POOL[hash % SLOT_1_TUNER_POOL.length];
  const q2 = SLOT_2_ACADEMY_POOL[Math.floor(hash / 7) % SLOT_2_ACADEMY_POOL.length];
  const q3 = SLOT_3_PRACTICE_POOL[Math.floor(hash / 49) % SLOT_3_PRACTICE_POOL.length];

  return [q1, q2, q3].map((template) => ({
    id: `${template.id}_${dateStr}`,
    title: template.title,
    progress: 0,
    max: template.max,
    completed: false,
    claimed: false,
    xpReward: template.xpReward,
    iconType: template.iconType,
    category: template.category,
    eventType: template.eventType,
  }));
}

export function loadDailyQuestsState(): DailyQuestsState {
  const today = getTodayStr();
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: DailyQuestsState = JSON.parse(saved);
        if (parsed.date === today && Array.isArray(parsed.quests) && parsed.quests.length === 3) {
          return parsed;
        }
      }
    }
  } catch {}

  const newState: DailyQuestsState = {
    date: today,
    quests: generateDailyQuests(today),
    bonusChestClaimed: false,
    bonusChestReward: BONUS_CHEST_REWARD,
  };

  saveDailyQuestsState(newState);
  return newState;
}

export function saveDailyQuestsState(state: DailyQuestsState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}

export function processQuestProgress(
  currentQuests: DailyQuest[],
  eventType: QuestEventType,
  amount: number
): { updatedQuests: DailyQuest[]; newlyCompleted: DailyQuest[] } {
  const newlyCompleted: DailyQuest[] = [];

  const updatedQuests = currentQuests.map((quest) => {
    if (quest.eventType === eventType && !quest.completed) {
      const nextProgress = Math.min(quest.max, quest.progress + amount);
      const isNowCompleted = nextProgress >= quest.max;
      const updated = {
        ...quest,
        progress: nextProgress,
        completed: isNowCompleted,
      };
      if (isNowCompleted && !quest.completed) {
        newlyCompleted.push(updated);
      }
      return updated;
    }
    return quest;
  });

  return { updatedQuests, newlyCompleted };
}

// ─── Despachador de Eventos Global Desacoplado ───
export function emitQuestEvent(type: QuestEventType, amount: number = 1): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('laclave_quest_event', {
        detail: { type, amount },
      })
    );
  } catch (e) {
    console.warn('[dailyQuestsEngine] emitQuestEvent error:', e);
  }
}

export function subscribeQuestEvent(
  callback: (type: QuestEventType, amount: number) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ type: QuestEventType; amount: number }>).detail;
    if (detail && detail.type) {
      callback(detail.type, detail.amount ?? 1);
    }
  };
  window.addEventListener('laclave_quest_event', handler);
  return () => window.removeEventListener('laclave_quest_event', handler);
}

// Formateador de tiempo restante hasta la medianoche
export function getTimeUntilMidnight(): { hours: number; minutes: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`,
  };
}
