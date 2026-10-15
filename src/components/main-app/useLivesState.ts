import { useEffect, Dispatch, SetStateAction } from 'react';
import { UserStats } from '../../types';
import { audioService } from '../../utils/audioService';
import {
  calculatePassiveRecharge,
  getTimeToNextLife,
  applyLifeDeduction,
  applyLifeAward,
  applyLifePurchase,
  MAX_LIVES,
} from '../../utils/livesEngine';
import { ToastItem } from '../ToastNotification';

interface UseLivesStateParams {
  userStats: UserStats;
  setUserStats: Dispatch<SetStateAction<UserStats>>;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
}

export function useLivesState({
  userStats,
  setUserStats,
  addToast,
}: UseLivesStateParams) {
  // Passive life recharge: targeted timeout + tab visibility listener (0% idle CPU)
  useEffect(() => {
    if ((userStats.lives ?? MAX_LIVES) >= MAX_LIVES) return;

    const checkAndRecharge = () => {
      setUserStats((prev) => {
        if ((prev.lives ?? MAX_LIVES) >= MAX_LIVES) return prev;
        const recharged = calculatePassiveRecharge(prev);
        if ((recharged.lives ?? 0) > (prev.lives ?? 0)) {
          setTimeout(() => {
            audioService.playHeartGainedSound();
            addToast({
              type: 'heart',
              title: '¡Vida regenerada!',
              description: `Recuperaste 1 vida de forma pasiva (${recharged.lives}/${MAX_LIVES})`,
            });
          }, 0);
          return recharged;
        }
        return prev;
      });
    };

    checkAndRecharge();

    const { remainingMs } = getTimeToNextLife(userStats);
    const delay = Math.max(500, remainingMs + 100);
    const timer = setTimeout(checkAndRecharge, delay);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRecharge();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userStats.lives, userStats.lastLifeLostAt, setUserStats, addToast]);

  const handleLoseLife = (_source: 'academia' | 'tuner' | 'karaoke') => {
    let livesRemaining = -1;
    setUserStats((prev) => {
      if ((prev.lives ?? MAX_LIVES) <= 0) return prev;
      const updated = applyLifeDeduction(prev);
      livesRemaining = updated.lives;
      return updated;
    });

    if (livesRemaining >= 0) {
      audioService.playHeartLostSound();
      addToast({
        type: 'warning',
        title: 'Perdiste 1 vida',
        description: livesRemaining > 0
          ? `Te quedan ${livesRemaining} de ${MAX_LIVES} vidas`
          : '¡Te has quedado sin vidas! Entrena o recarga en la tienda para continuar',
      });
    }
  };

  const handleGainLife = (amount: number = 1) => {
    let newLives = -1;
    setUserStats((prev) => {
      const currentLives = prev.lives ?? MAX_LIVES;
      if (currentLives >= MAX_LIVES) return prev;
      const updated = applyLifeAward(prev, amount);
      newLives = updated.lives;
      return updated;
    });

    if (newLives > 0) {
      audioService.playHeartGainedSound();
      addToast({
        type: 'heart',
        title: '¡Vida recuperada!',
        description: `Ahora tienes ${newLives} de ${MAX_LIVES} vidas`,
      });
    }
  };

  const handleBuyLife = () => {
    let resultCost = 0;
    let resultError = '';
    setUserStats((prev) => {
      const res = applyLifePurchase(prev);
      if (!res.success) {
        resultError = res.error || 'No se pudo comprar la vida';
        return prev;
      }
      resultCost = res.cost;
      return res.updatedStats;
    });

    if (resultError) {
      addToast({
        type: 'warning',
        title: 'Compra no completada',
        description: resultError,
      });
    } else if (resultCost > 0) {
      audioService.playHeartGainedSound();
      addToast({
        type: 'heart',
        title: '¡Vida adquirida!',
        description: `Has recuperado 1 vida por ${resultCost} XP`,
      });
    }
  };

  const handleUseCourtesySong = () => {
    setUserStats((prev) => ({
      ...prev,
      hasUsedCourtesySong: true,
    }));
  };

  return {
    handleLoseLife,
    handleGainLife,
    handleBuyLife,
    handleUseCourtesySong,
  };
}
