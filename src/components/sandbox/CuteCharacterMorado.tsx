'use client';

import React, {useEffect, useId, useRef} from 'react';
import gsap from 'gsap';
import styles from './CuteCharacterMorado.module.css';

export interface CuteCharacterMoradoProps {
  typing?: boolean;
  playIntroDrop?: boolean;
  onDropImpact?: () => void;
}

function getMoradoSinuousPath(s: number, w: number): string {
  const clampedS = Math.max(-0.4, Math.min(0.95, s));
  const x1 = 232 - 16 * clampedS - 5 * Math.sin(w);
  const x2 = 244 + 6 * clampedS + 6 * Math.sin(w + 1.8);
  const x3 = 248 + 2 * clampedS + 3 * Math.sin(w + 3.2);

  const xl1 = 250 - x1;
  const xl2 = 250 - x2;
  const xl3 = 250 - x3;

  return `M 46 0 L 204 0 Q 245 0 245 46 C ${242 - 10 * clampedS} 90 ${x1} 120 ${x1} 160 C ${x1 + 4} 200 ${x2} 235 ${x2} 275 C ${x2 - 2} 315 ${x3} 350 ${x3} 382 Q ${x3} 400 ${x3 - 22} 400 L ${xl3 + 22} 400 Q ${xl3} 400 ${xl3} 382 C ${xl3} 350 ${xl2 - 2} 315 ${xl2} 275 C ${xl2} 235 ${xl1 - 4} 200 ${xl1} 160 C ${xl1} 120 ${8 + 10 * clampedS} 90 5 46 Q 5 0 46 0 Z`;
}

export const CuteCharacterMorado: React.FC<CuteCharacterMoradoProps> = ({
  playIntroDrop = true,
  onDropImpact,
}) => {
  const rawId = useId();
  const clipId = `morado-sinuous-${rawId.replace(/:/g, '')}`;

  const dropRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const squashRef = useRef(0);
  const velSquashRef = useRef(0);
  const waveRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Oscilador armonico amortiguado para el squash tras impacto o interaccion
      const springForce = -130 * squashRef.current - 9.5 * velSquashRef.current;
      velSquashRef.current += springForce * dt;
      squashRef.current += velSquashRef.current * dt;

      // Ondulacion fluida continua de las paredes sinuosas
      waveRef.current += dt * 3.2;

      if (pathRef.current) {
        const d = getMoradoSinuousPath(squashRef.current, waveRef.current);
        pathRef.current.setAttribute('d', d);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playIntroDrop || !dropRef.current) return;

    const el = dropRef.current;
    // Caida inicial suave por gravedad desde arriba
    gsap.fromTo(
      el,
      {
        y: -240,
        scaleY: 1.16,
        scaleX: 0.88,
      },
      {
        y: 0,
        scaleY: 1,
        scaleX: 1,
        duration: 0.48,
        ease: 'power2.in',
        onComplete: () => {
          // Momento del impacto en el suelo
          squashRef.current = 0.90;
          velSquashRef.current = -14;
          onDropImpact?.();

          // Rebote elastico secundario del contenedor
          gsap.fromTo(
            el,
            {scaleY: 0.78, scaleX: 1.25},
            {
              scaleY: 1,
              scaleX: 1,
              duration: 1.3,
              ease: 'elastic.out(1.15, 0.32)',
            }
          );
        },
      }
    );
  }, [playIntroDrop, onDropImpact]);

  const handleCharClick = () => {
    // Al tocarlo directamente, inyectar onda sinuosa
    squashRef.current = Math.min(0.8, squashRef.current + 0.45);
    velSquashRef.current -= 8;
  };

  return (
    <div className={styles.stage} onClick={handleCharClick}>
      {/* Definicion vectorial del clip-path sinuoso dinamico */}
      <svg
        width="0"
        height="0"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path
              ref={pathRef}
              d={getMoradoSinuousPath(0, 0)}
            />
          </clipPath>
        </defs>
      </svg>

      <div ref={dropRef} className={styles.dropWrapper}>
        <div
          className={styles['purple-char']}
          style={
            {
              '--morado-clip': `url(#${clipId})`,
            } as React.CSSProperties
          }
        >
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
    </div>
  );
};
