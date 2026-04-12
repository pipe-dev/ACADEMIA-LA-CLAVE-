'use client';

import { useCallback, useRef } from 'react';

/**
 * Cross-platform haptic feedback hook.
 * - Android: uses navigator.vibrate() 
 * - iOS/fallback: uses Web Audio API to produce a short low-frequency "thump"
 */
export function useHaptic() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Low-frequency audio thump for iOS fallback
  const audioThump = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.type = 'sine';
      
      if (intensity === 'light') {
        osc.frequency.setValueAtTime(60, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now); osc.stop(now + 0.04);
      } else if (intensity === 'medium') {
        osc.frequency.setValueAtTime(45, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now); osc.stop(now + 0.07);
      } else {
        osc.frequency.setValueAtTime(35, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
      }
    } catch (e) {
      // Silently fail
    }
  }, [getCtx]);

  /** Light tap - note selection, button clicks */
  const tapLight = useCallback(() => {
    if (canVibrate) navigator.vibrate(30);
    else audioThump('light');
  }, [canVibrate, audioThump]);

  /** Medium tap - correct note sung, progress */
  const tapMedium = useCallback(() => {
    if (canVibrate) navigator.vibrate(50);
    else audioThump('medium');
  }, [canVibrate, audioThump]);

  /** Heavy impact - note completed (bar full) */
  const tapHeavy = useCallback(() => {
    if (canVibrate) navigator.vibrate(80);
    else audioThump('heavy');
  }, [canVibrate, audioThump]);

  /** Double pulse - level completed */
  const tapSuccess = useCallback(() => {
    if (canVibrate) navigator.vibrate([60, 40, 100]);
    else {
      audioThump('medium');
      setTimeout(() => audioThump('heavy'), 100);
    }
  }, [canVibrate, audioThump]);

  /** Triple pulse - achievement unlocked */
  const tapTriumph = useCallback(() => {
    if (canVibrate) navigator.vibrate([50, 30, 50, 30, 150]);
    else {
      audioThump('light');
      setTimeout(() => audioThump('medium'), 80);
      setTimeout(() => audioThump('heavy'), 180);
    }
  }, [canVibrate, audioThump]);

  /** Error buzz */
  const tapError = useCallback(() => {
    if (canVibrate) navigator.vibrate(200);
    else audioThump('heavy');
  }, [canVibrate, audioThump]);

  return { tapLight, tapMedium, tapHeavy, tapSuccess, tapTriumph, tapError };
}
