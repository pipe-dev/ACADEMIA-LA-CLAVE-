'use client';

import React from 'react';
import styles from './CuteCharacterFucsia.module.css';

export interface CuteCharacterFucsiaProps {
  showShadows?: boolean;
  faceRef?: React.Ref<HTMLDivElement>;
}

export const CuteCharacterFucsia: React.FC<CuteCharacterFucsiaProps> = ({
  showShadows = true,
  faceRef,
}) => {
  const charBody = (
    <div className={styles['fuchsia-char']}>
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="water-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence id="water-turbulence" type="fractalNoise" baseFrequency="0.015" numOctaves="1" result="noise" />
          <feDisplacementMap id="water-displacement" in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className={styles['fuchsia-body']}></div>
      <div ref={faceRef} className={styles.face}>
        <div className={styles.eyes}>
          <div className={styles.eye}>
            <div className={styles.pupil}></div>
          </div>
          <div className={styles.eye}>
            <div className={styles.pupil}></div>
          </div>
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
    </div>
  );
};
