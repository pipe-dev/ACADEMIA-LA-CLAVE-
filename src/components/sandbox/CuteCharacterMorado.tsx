'use client';

import React, {useEffect, useRef} from 'react';
import styles from './CuteCharacterMorado.module.css';
import {useTactileWave} from './CuteCharacterTactileCage';

const DEFAULT_MORADO_PATH =
  'M 46 0 L 204 0 Q 250 0 250 46 L 250 382 Q 250 400 232 400 L 18 400 Q 0 400 0 382 L 0 46 Q 0 0 46 0 Z';

function getMoradoSinuousPath(amp: number, phase: number): string {
  if (amp <= 0.005) {
    return DEFAULT_MORADO_PATH;
  }

  const H = 336; // Altura de pared entre esquinas redondeadas (382 - 46)
  const ys = [46, 100, 160, 220, 280, 340, 382];

  // Pared derecha con ondas sinuosas fluidas dentro del lienzo
  const ptsR: [number, number][] = [];
  for (const y of ys) {
    const t = (y - 46) / H;
    const env = Math.sin(Math.PI * t);
    const wave = 0.5 + 0.5 * Math.sin(2.4 * Math.PI * t * 1.8 - phase);
    const disp = amp * 20 * wave * env;
    ptsR.push([250 - disp, y]);
  }

  // Pared izquierda con ondas sinuosas en contrafase fluida
  const ptsL: [number, number][] = [];
  for (let i = ys.length - 1; i >= 0; i--) {
    const y = ys[i];
    const t = (y - 46) / H;
    const env = Math.sin(Math.PI * t);
    const wave = 0.5 + 0.5 * Math.sin(2.4 * Math.PI * t * 1.8 - phase + Math.PI);
    const disp = amp * 20 * wave * env;
    ptsL.push([0 + disp, y]);
  }

  const cmd: string[] = ['M 46 0 L 204 0 Q 250 0 250 46'];
  for (let i = 0; i < ptsR.length - 1; i++) {
    const p0 = ptsR[i];
    const p1 = ptsR[i + 1];
    const dy = p1[1] - p0[1];
    const cp1 = [p0[0], p0[1] + dy * 0.45];
    const cp2 = [p1[0], p1[1] - dy * 0.45];
    cmd.push(
      `C ${cp1[0].toFixed(1)} ${cp1[1].toFixed(1)}, ${cp2[0].toFixed(1)} ${cp2[1].toFixed(1)}, ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`
    );
  }

  cmd.push('Q 250 400 232 400 L 18 400 Q 0 400 0 382');

  for (let i = 0; i < ptsL.length - 1; i++) {
    const p0 = ptsL[i];
    const p1 = ptsL[i + 1];
    const dy = p1[1] - p0[1];
    const cp1 = [p0[0], p0[1] + dy * 0.45];
    const cp2 = [p1[0], p1[1] - dy * 0.45];
    cmd.push(
      `C ${cp1[0].toFixed(1)} ${cp1[1].toFixed(1)}, ${cp2[0].toFixed(1)} ${cp2[1].toFixed(1)}, ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`
    );
  }

  cmd.push('Q 0 0 46 0 Z');
  return cmd.join(' ');
}

export const CuteCharacterMorado: React.FC<{ typing?: boolean }> = () => {
  const { waveAmp, wavePhase } = useTactileWave();
  const pathRef = useRef<SVGPathElement>(null);
  const charRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isWavy = waveAmp > 0.005;
    if (charRef.current) {
      if (isWavy) {
        const pathStr = getMoradoSinuousPath(waveAmp, wavePhase);
        if (pathRef.current) {
          pathRef.current.setAttribute('d', pathStr);
        }
        charRef.current.style.clipPath = `path("${pathStr}")`;
      } else {
        if (pathRef.current) {
          pathRef.current.setAttribute('d', DEFAULT_MORADO_PATH);
        }
        charRef.current.style.clipPath = 'none';
      }
    }
  }, [waveAmp, wavePhase]);

  return (
    <div className={styles.stage}>
      {/* ClipPath dinamico para sinuosidad liquida durante estiramiento y caida */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="purple-dynamic-clip" clipPathUnits="userSpaceOnUse">
            <path ref={pathRef} d={DEFAULT_MORADO_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div ref={charRef} className={styles['purple-char']}>
        <div className={styles.reach}></div>
        <div className={styles.face}>
          <div className={styles.eyes}>
            <div className={styles.eye}>
              <div className={styles.pupil}></div>
            </div>
            <div className={styles.eye}>
              <div className={styles.pupil}></div>
            </div>
          </div>
          <div className={styles['mouth-wrap']}>
            <div className={styles.mouth}>
              <svg
                width="44"
                height="14"
                viewBox="-8 0 44 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.mouthSvg}
              >
                <path
                  d="M -4 3.5 Q 14 9 32 3.2"
                  stroke="#201a26"
                  strokeWidth="4.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <svg
              width="44"
              height="14"
              viewBox="-8 0 44 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.oMouth}
            >
              <ellipse
                cx="14"
                cy="7"
                rx="4.5"
                ry="6"
                fill="none"
                stroke="#201a26"
                strokeWidth="4.6"
              />
            </svg>
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
