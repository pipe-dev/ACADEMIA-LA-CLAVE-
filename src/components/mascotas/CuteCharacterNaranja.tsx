'use client';

import React from 'react';
import styles from './CuteCharacterNaranja.module.css';

export interface CuteCharacterNaranjaRef {
  poke: () => void;
}

export const CuteCharacterNaranja = React.forwardRef<
  CuteCharacterNaranjaRef,
  { typing?: boolean; error?: boolean; blink?: boolean }
>(({ typing = false, error = false, blink = false }, ref) => {
  const [gesture, setGesture] = React.useState('');
  const tongueTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const G = ['smile', 'small', 'flat'];

  React.useEffect(() => {
    if (!typing) {
      setGesture('');
      return;
    }
    const t = setTimeout(
      () => setGesture(G[Math.floor(Math.random() * G.length)]),
      500 + Math.random() * 900
    );
    return () => clearTimeout(t);
  }, [typing]);

  React.useImperativeHandle(
    ref,
    () => ({
      poke: () => {
        setGesture('tongue');
        if (tongueTimer.current) clearTimeout(tongueTimer.current);
        tongueTimer.current = setTimeout(() => {
          setGesture((prev) => (prev === 'tongue' ? '' : prev));
        }, 1600);
      },
    }),
    []
  );

  return (
    <div className={styles.stage}>
      <div className={styles['shadow-ground']}></div>
      <div className={styles['shadow-contact']}></div>

      <div className={styles['character-orange']}>
        <div className={styles.reach}></div>
        <div className={styles.face}>
          <div className={styles.eyes}>
            <div className={`${styles.eye}${blink ? ' ' + styles.blink : ''}`}></div>
            <div className={`${styles.eye}${blink ? ' ' + styles.blink : ''}`}></div>
          </div>
          <div
            className={
              (gesture ? styles['g-' + gesture] + ' ' : '') +
              (error ? styles.err + ' ' : '') +
              styles['mouth-wrap']
            }
          >
            <div className={styles.mouth}></div>
            <div className={styles.tongue}></div>
          </div>
        </div>
      </div>
      <div className={styles.zzz} aria-hidden="true">
        <span className={styles.z}>z</span>
        <span className={styles.z}>z</span>
        <span className={styles.z}>z</span>
      </div>
    </div>
  );
});

CuteCharacterNaranja.displayName = 'CuteCharacterNaranja';
