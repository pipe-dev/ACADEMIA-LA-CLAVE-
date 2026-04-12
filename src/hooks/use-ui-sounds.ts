'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'click' | 'success' | 'whoosh' | 'error' | 'star' | 'levelUp' | 'lifeDown' | 'fanfare' | 'streak' | 'perfectStreak';

export function useUISounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((type: SoundType, epicMode: boolean = false) => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const makeOsc = (freq: number, oscType: OscillatorType = 'sine', startAt = now, dur = 0.1, vol = 0.12) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, startAt);
        gain.gain.setValueAtTime(vol, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + dur);
      };

      switch (type) {
        case 'click':
          makeOsc(800, 'sine', now, 0.06, 0.1);
          makeOsc(1200, 'triangle', now, 0.04, 0.04);
          break;

        case 'success':
          if (epicMode) {
            // Epic layered success chord
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
              makeOsc(freq, 'sine', now + i * 0.08, 0.3, 0.14);
              makeOsc(freq * 1.5, 'triangle', now + i * 0.08, 0.25, 0.04);
              makeOsc(freq * 2, 'sine', now + i * 0.08, 0.2, 0.02);
            });
          } else {
            makeOsc(523.25, 'sine', now, 0.15, 0.12);
            makeOsc(659.25, 'sine', now + 0.1, 0.15, 0.12);
            makeOsc(783.99, 'sine', now + 0.2, 0.2, 0.12);
            makeOsc(523.25, 'triangle', now, 0.15, 0.04);
          }
          break;

        case 'whoosh':
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
          g.gain.setValueAtTime(0.04, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now); osc.stop(now + 0.2);
          break;

        case 'error':
          makeOsc(250, 'square', now, 0.12, 0.08);
          makeOsc(180, 'square', now + 0.08, 0.15, 0.08);
          break;

        case 'star':
          // Magical ascending sparkle
          makeOsc(880, 'sine', now, 0.1, 0.1);
          makeOsc(1100, 'sine', now + 0.06, 0.1, 0.1);
          makeOsc(1320, 'sine', now + 0.12, 0.15, 0.1);
          makeOsc(1760, 'triangle', now + 0.12, 0.2, 0.05);
          break;

        case 'levelUp':
          // Triumphant major chord arpeggio
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            makeOsc(freq, 'sine', now + i * 0.08, 0.25, 0.12);
            makeOsc(freq * 2, 'triangle', now + i * 0.08, 0.2, 0.03);
          });
          break;

        case 'lifeDown':
          // Descending sad tone
          makeOsc(400, 'sine', now, 0.15, 0.1);
          makeOsc(300, 'sine', now + 0.1, 0.15, 0.1);
          makeOsc(200, 'sine', now + 0.2, 0.25, 0.1);
          break;

        case 'fanfare':
          if (epicMode) {
            // Grand epic brass fanfare with octave layers
            const epicNotes = [523.25, 523.25, 659.25, 783.99, 783.99, 1046.50, 1318.51, 1567.98];
            epicNotes.forEach((freq, i) => {
              makeOsc(freq, 'sawtooth', now + i * 0.1, 0.25, 0.07);
              makeOsc(freq, 'sine', now + i * 0.1, 0.3, 0.1);
              makeOsc(freq * 0.5, 'sine', now + i * 0.1, 0.3, 0.04);
              makeOsc(freq * 2, 'triangle', now + i * 0.1, 0.15, 0.02);
            });
          } else {
            // Royal brass-like fanfare
            const fanfareNotes = [523.25, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.50];
            fanfareNotes.forEach((freq, i) => {
              makeOsc(freq, 'sawtooth', now + i * 0.12, 0.18, 0.06);
              makeOsc(freq, 'sine', now + i * 0.12, 0.2, 0.08);
            });
          }
          break;

        case 'streak':
          // Fire crackle effect
          makeOsc(600, 'sine', now, 0.08, 0.08);
          makeOsc(900, 'triangle', now + 0.05, 0.1, 0.06);
          makeOsc(1200, 'sine', now + 0.1, 0.15, 0.08);
          break;

        case 'perfectStreak':
          // Ethereal magical sound for 10 perfect notes
          [880, 1100, 1320, 1540, 1760, 2090].forEach((freq, i) => {
            makeOsc(freq, 'sine', now + i * 0.06, 0.4, 0.08);
            makeOsc(freq * 0.5, 'triangle', now + i * 0.06, 0.3, 0.03);
          });
          break;
      }
    } catch (e) {
      // Silently fail on audio errors
    }
  }, [getCtx]);

  return { play };
}
