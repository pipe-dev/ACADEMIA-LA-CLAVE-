'use client';

import { useState, useEffect, useCallback } from 'react';
import { dbSave, dbLoad } from '@/lib/db';

const DB_KEY = 'afinapp_inventory';

export type ThemeId = 'sapphire' | 'galaxy';
export type SoundId = 'epic_fanfare';
export type AuraId = 'bronze_star' | 'fire' | 'lightning' | 'cosmic' | 'divine';
export type ConfettiId = 'deluxe_gold';

export type RewardId = ThemeId | SoundId | AuraId | ConfettiId | 'title_maestro' | 'vip_pass' | 'gold_piano';
export type RewardCategory = 'theme' | 'sound' | 'aura' | 'confetti' | 'badge';

export interface RewardDefinition {
  id: RewardId;
  category: RewardCategory;
  name: string;
  description: string;
  icon: string;
  requiredDays: number;
  milestoneName: string;
}

export const ALL_REWARDS: RewardDefinition[] = [
  // Themes
  { id: 'sapphire', category: 'theme', name: 'Tema Zafiro', description: 'Un azul profundo y elegante para toda la interfaz', icon: '💎', requiredDays: 30, milestoneName: '1 Mes' },
  { id: 'galaxy', category: 'theme', name: 'Tema Galaxia', description: 'Colores púrpura cósmico y estrellas', icon: '🌌', requiredDays: 240, milestoneName: '8 Meses' },
  // Sounds
  { id: 'epic_fanfare', category: 'sound', name: 'Fanfare Épica', description: 'Sonido de victoria más intenso y majestuoso', icon: '🎺', requiredDays: 15, milestoneName: 'Mitad de Mes' },
  // Auras
  { id: 'bronze_star', category: 'aura', name: 'Estrella de Bronce', description: 'Un borde dorado brillante alrededor de tu avatar', icon: '⭐', requiredDays: 7, milestoneName: '1 Semana' },
  { id: 'fire', category: 'aura', name: 'Aura de Fuego', description: 'Tu avatar envuelto en llamas ardientes', icon: '🔥', requiredDays: 337, milestoneName: '11 Meses (Sem. 1)' },
  { id: 'lightning', category: 'aura', name: 'Aura de Rayo', description: 'Destellos eléctricos rodean tu avatar', icon: '⚡', requiredDays: 344, milestoneName: '11 Meses (Sem. 2)' },
  { id: 'cosmic', category: 'aura', name: 'Aura Cósmica', description: 'Energía galáctica envuelve tu avatar', icon: '🌀', requiredDays: 351, milestoneName: '11 Meses (Sem. 3)' },
  { id: 'divine', category: 'aura', name: 'Estela Divina', description: 'Resplandor celestial puro', icon: '👼', requiredDays: 358, milestoneName: '11 Meses (Sem. 4)' },
  // Confetti
  { id: 'deluxe_gold', category: 'confetti', name: 'Confeti Deluxe', description: 'Confeti dorado y champagne premium', icon: '🎊', requiredDays: 120, milestoneName: '4 Meses' },
  // Badges (cosmetic only)
  { id: 'gold_piano', category: 'badge', name: 'Piano de Oro', description: 'Un logro legendario de persistencia', icon: '🏆', requiredDays: 90, milestoneName: '3 Meses' },
  { id: 'title_maestro', category: 'badge', name: 'Maestro Afinador', description: 'Título especial para los dedicados', icon: '🎓', requiredDays: 300, milestoneName: '10 Meses' },
  { id: 'vip_pass', category: 'badge', name: 'Pase VIP Vitalicio', description: 'El reconocimiento máximo', icon: '👑', requiredDays: 365, milestoneName: '1 Año' },
];

export interface InventoryState {
  unlocked: string[];
  equipped: {
    theme: ThemeId | null;
    sound: SoundId | null;
    aura: AuraId | null;
    confetti: ConfettiId | null;
  };
}

const DEFAULT_STATE: InventoryState = {
  unlocked: [],
  equipped: { theme: null, sound: null, aura: null, confetti: null },
};

export function useInventory() {
  const [state, setState] = useState<InventoryState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dbLoad<InventoryState>(DB_KEY).then(saved => {
      if (saved) setState(saved);
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  const persist = useCallback(async (newState: InventoryState) => {
    setState(newState);
    await dbSave(DB_KEY, newState);
  }, []);

  const checkAndUnlockNewRewards = useCallback((streak: number): RewardDefinition[] => {
    const newlyUnlocked: RewardDefinition[] = [];
    const currentUnlocked = new Set(state.unlocked);

    for (const reward of ALL_REWARDS) {
      if (streak >= reward.requiredDays && !currentUnlocked.has(reward.id)) {
        currentUnlocked.add(reward.id);
        newlyUnlocked.push(reward);
      }
    }

    if (newlyUnlocked.length > 0) {
      const newState: InventoryState = {
        ...state,
        unlocked: Array.from(currentUnlocked),
      };
      persist(newState);
    }

    return newlyUnlocked;
  }, [state, persist]);

  const isUnlocked = useCallback((id: RewardId) => {
    return state.unlocked.includes(id);
  }, [state.unlocked]);

  const equipReward = useCallback((reward: RewardDefinition) => {
    if (!state.unlocked.includes(reward.id)) return;

    const newEquipped = { ...state.equipped };
    switch (reward.category) {
      case 'theme': newEquipped.theme = reward.id as ThemeId; break;
      case 'sound': newEquipped.sound = reward.id as SoundId; break;
      case 'aura': newEquipped.aura = reward.id as AuraId; break;
      case 'confetti': newEquipped.confetti = reward.id as ConfettiId; break;
      default: return; // badges can't be "equipped"
    }

    persist({ ...state, equipped: newEquipped });
  }, [state, persist]);

  const unequipReward = useCallback((category: RewardCategory) => {
    if (category === 'badge') return;
    const newEquipped = { ...state.equipped };
    (newEquipped as any)[category] = null;
    persist({ ...state, equipped: newEquipped });
  }, [state, persist]);

  return {
    inventory: state,
    isLoaded,
    equippedTheme: state.equipped.theme,
    equippedSound: state.equipped.sound,
    equippedAura: state.equipped.aura,
    equippedConfetti: state.equipped.confetti,
    isUnlocked,
    equipReward,
    unequipReward,
    checkAndUnlockNewRewards,
    allRewards: ALL_REWARDS,
  };
}
