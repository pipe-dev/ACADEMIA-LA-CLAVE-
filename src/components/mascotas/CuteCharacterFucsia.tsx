'use client';

import React from 'react';
import styles from './CuteCharacterFucsia.module.css';

export interface CuteCharacterFucsiaRef {
  blush: () => void;
}

export interface CuteCharacterFucsiaProps {
  showShadows?: boolean;
  error?: boolean;
  blink?: boolean;
  faceRef?: React.Ref<HTMLDivElement>;
}

export const CuteCharacterFucsia = React.forwardRef<
  CuteCharacterFucsiaRef,
  CuteCharacterFucsiaProps
>(({ showShadows = true, error = false, blink = false, faceRef }, ref) => {
  const [blush, setBlush] = React.useState(false);
  const blushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [turned, setTurned] = React.useState(false);
  const turnTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!error) {
      setTurned(false);
      if (turnTimer.current) {
        clearTimeout(turnTimer.current);
        turnTimer.current = null;
      }
      return;
    }
    turnTimer.current = setTimeout(() => setTurned(true), 600);
    return () => {
      if (turnTimer.current) clearTimeout(turnTimer.current);
    };
  }, [error]);

  React.useImperativeHandle(
    ref,
    () => ({
      blush: () => {
        setBlush(true);
        if (blushTimer.current) clearTimeout(blushTimer.current);
        blushTimer.current = setTimeout(() => setBlush(false), 1600);
      },
    }),
    []
  );

  const charBody = (
    <div className={styles['fuchsia-char']}>
      <div className={styles['fuchsia-body']}>
        <div className={styles.reach}></div>
      </div>
      <div
        ref={faceRef}
        className={
          (error ? `${styles.err} ` : '') +
          (blush ? `${styles.blush} ` : '') +
          (turned ? `${styles.turn} ` : '') +
          styles.face
        }
      >
        <div className={styles.brows}>
          <div className={styles['brow-left']}></div>
          <div className={styles['brow-right']}></div>
        </div>
        <div className={styles.eyes}>
          <div className={`${styles.eye}${blink ? ' ' + styles.blink : ''}`}>
            <div className={styles.pupil}></div>
          </div>
          <div className={`${styles.eye}${blink ? ' ' + styles.blink : ''}`}>
            <div className={styles.pupil}></div>
          </div>
        </div>
        <div className={styles.cheeks}>
          <div className={styles['cheek-l']}></div>
          <div className={styles['cheek-r']}></div>
        </div>
      </div>
    </div>
  );

  if (!showShadows) {
    return charBody;
  }

  return (
    <div className={styles.stage}>
      <div className={styles['shadow-ambient']}></div>
      <div className={styles['shadow-contact']}></div>
      {charBody}
      <div className={styles.zzz} aria-hidden="true">
        <span className={styles.z}>z</span>
        <span className={styles.z}>z</span>
        <span className={styles.z}>z</span>
      </div>
    </div>
  );
});

CuteCharacterFucsia.displayName = 'CuteCharacterFucsia';