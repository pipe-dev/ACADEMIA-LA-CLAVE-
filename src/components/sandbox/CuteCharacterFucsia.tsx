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
