'use client';

import React from 'react';
import styles from './CuteCharacterAmarillo.module.css';
import {useTactileWave} from './CuteCharacterTactileCage';

export const CuteCharacterAmarillo: React.FC<{
  typing?: boolean;
  shy?: boolean;
  error?: boolean;
  blink?: boolean;
  wink?: boolean;
}> = ({ typing = false, shy = false, error = false, blink = false, wink = false }) => {
  const [gesture, setGesture] = React.useState('');
  const [peeking, setPeeking] = React.useState(false);
  const G = ['smile', 'small', 'flat'];

  // Sujeto y jalo hacia arriba: la jaula tactil reporta estiramiento activo
  const {isInteracting, stretch: jellyStretch} = useTactileWave();
  const pulled = isInteracting && jellyStretch > 0.06;

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

  React.useEffect(() => {
    if (!shy) {
      setPeeking(false);
      return;
    }
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const peek = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setPeeking(true);
        t = setTimeout(() => {
          if (!alive) return;
          setPeeking(false);
          t = setTimeout(peek, 3000 + Math.random() * 6000);
        }, 3000);
      }, 2500 + Math.random() * 7000);
    };
    peek();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [shy]);

  return (
    <div className={styles.stage}>
      <div className={styles['shadow-ambient']}></div>
      <div className={styles['shadow-contact']}></div>

<div className={styles['yellow-char']}>
          <div className={styles.reach}></div>
          <div
            className={`${styles['head-wag']}${
              pulled ? ' ' + styles.wag : ''
            }`}
          >
            <div
              className={`${peeking ? styles.face + ' ' + styles.peek : styles.face}${
                error ? ' ' + styles.err : ''
              }`}
            >
              <div className={`${styles['angry-brow']} ${styles.a}`}></div>
              <div className={`${styles['angry-brow']} ${styles.b}`}></div>
              <div
                className={
                  (peeking ? styles['peek-eye'] + ' ' : '') +
                  (blink ? styles.blink + ' ' : '') +
                  (wink ? styles.wink + ' ' : '') +
                  styles['eye-left']
                }
              ></div>
              <div
                className={
                  (peeking ? styles['peek-eye'] + ' ' : '') +
                  (blink ? styles.blink + ' ' : '') +
                  styles['eye-right']
                }
              ></div>
          <div className={(gesture ? styles['g-' + gesture] + ' ' : '') + styles['mouth-line']}></div>
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
};
