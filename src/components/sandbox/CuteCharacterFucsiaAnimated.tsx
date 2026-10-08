'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import { CuteCharacterFucsia } from './CuteCharacterFucsia';
import styles from './CuteCharacterFucsia.module.css';

export interface CuteCharacterFucsiaAnimatedRef {
  replay: () => void;
}

interface CuteCharacterFucsiaAnimatedProps {
  autoPlay?: boolean;
  onComplete?: () => void;
}

export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>(({ autoPlay = true, onComplete }, ref) => {
  const carrierRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const squashRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const shadowContactRef = useRef<HTMLDivElement>(null);
  const shadowAmbientRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const buildTimeline = () => {
    if (!carrierRef.current || !rotatorRef.current || !squashRef.current) return null;

    const carrier = carrierRef.current;
    const rotator = rotatorRef.current;
    const squash = squashRef.current;
    const face = faceRef.current;
    const shadowContact = shadowContactRef.current;
    const shadowAmbient = shadowAmbientRef.current;

    const tl = gsap.timeline({
      paused: !autoPlay,
      onComplete,
    });

    // 0. ESTADO INICIAL: Colgado del techo invertido dentro del marco visible
    // y: -160 sitúa la base en el borde superior del card y la cabeza colgando a la vista
    tl.set(carrier, { x: 75, y: -160 })
      .set(rotator, { rotation: 196, transformOrigin: 'center center' })
      .set(squash, { scaleX: 1, scaleY: 1, skewX: 0, transformOrigin: 'bottom center' })
      .set(face, { y: 0, x: 0 })
      .set(shadowContact, { scaleX: 0.35, opacity: 0.08 })
      .set(shadowAmbient, { scaleX: 0.35, opacity: 0.05 });

    // =========================================================================
    // FASE 1: BALANCEO PENDULAR EN ONDAS SINUSOIDALES (Derecha -> Izquierda -> Retorno)
    // =========================================================================

    // Tramo 1: De derecha a izquierda
    tl.to(carrier, { x: -55, duration: 0.72, ease: 'sine.inOut' }, 'swingLeft')
      .to(carrier, { y: -175, duration: 0.36, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 'swingLeft')
      .to(rotator, { rotation: 162, duration: 0.72, ease: 'sine.inOut' }, 'swingLeft')
      // Onda de agua en skew
      .to(squash, { skewX: 20, duration: 0.36, ease: 'sine.inOut' }, 'swingLeft')
      .to(squash, { skewX: -10, duration: 0.36, ease: 'sine.inOut' })
      // Dilatacion y compresion senoidal
      .to(squash, { scaleY: 1.14, scaleX: 0.88, duration: 0.36, ease: 'sine.inOut' }, 'swingLeft')
      .to(squash, { scaleY: 0.92, scaleX: 1.09, duration: 0.36, ease: 'sine.inOut' }, 'swingLeft+=0.36')
      .to(face, { x: 6, duration: 0.36, ease: 'sine.inOut' }, 'swingLeft')
      .to(face, { x: -3, duration: 0.36, ease: 'sine.inOut' }, 'swingLeft+=0.36');

    // Tramo 2: Retorno hacia el centro de soltado (x: 0)
    tl.to(carrier, { x: 0, duration: 0.58, ease: 'sine.inOut' }, 'swingReturn')
      .to(carrier, { y: -165, duration: 0.29, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 'swingReturn')
      .to(rotator, { rotation: 194, duration: 0.58, ease: 'sine.inOut' }, 'swingReturn')
      .to(squash, { skewX: -22, duration: 0.29, ease: 'sine.inOut' }, 'swingReturn')
      .to(squash, { skewX: 5, duration: 0.29, ease: 'sine.inOut' })
      .to(squash, { scaleY: 1.16, scaleX: 0.86, duration: 0.29, ease: 'sine.inOut' }, 'swingReturn')
      .to(squash, { scaleY: 0.94, scaleX: 1.07, duration: 0.29, ease: 'sine.inOut' }, 'swingReturn+=0.29')
      .to(face, { x: -6, duration: 0.29, ease: 'sine.inOut' }, 'swingReturn')
      .to(face, { x: 2, duration: 0.29, ease: 'sine.inOut' }, 'swingReturn+=0.29');

    // =========================================================================
    // FASE 2: DESPRENDIMIENTO, VOLTERETA DE 180° Y CAÍDA ONDULANTE
    // =========================================================================

    // Anticipacion elástica antes de soltarse
    tl.to(squash, { scaleY: 0.90, scaleX: 1.11, duration: 0.07, ease: 'sine.out' });

    // Caida en Y acelerada hacia el suelo (y: 0)
    tl.to(carrier, { y: 0, duration: 0.42, ease: 'power3.in' }, 'fallAndFlip')
      // Giro de 180° hacia la posición vertical neutral (360°)
      .to(rotator, { rotation: 360, duration: 0.42, ease: 'sine.inOut' }, 'fallAndFlip')
      // Bamboleo senoidal en X durante la caida
      .to(carrier, { x: 14, duration: 0.14, ease: 'sine.inOut' }, 'fallAndFlip')
      .to(carrier, { x: -12, duration: 0.14, ease: 'sine.inOut' })
      .to(carrier, { x: 0, duration: 0.14, ease: 'sine.inOut' })
      // Ondulación del cuerpo en el aire
      .to(squash, { skewX: 18, duration: 0.14, ease: 'sine.inOut' }, 'fallAndFlip')
      .to(squash, { skewX: -16, duration: 0.14, ease: 'sine.inOut' })
      .to(squash, { skewX: 0, duration: 0.14, ease: 'sine.inOut' })
      // Estiramiento vertical hidrodinámico de gota en caida libre
      .to(squash, { scaleY: 1.34, scaleX: 0.76, duration: 0.16, ease: 'sine.in' }, 'fallAndFlip+=0.24')
      .to(face, { x: 0, y: -4, duration: 0.22, ease: 'sine.out' }, 'fallAndFlip')
      .to(shadowContact, { scaleX: 0.85, opacity: 0.28, duration: 0.22, ease: 'sine.in' }, 'fallAndFlip+=0.20');

    // =========================================================================
    // FASE 3: IMPACTO BALÍSTICO Y TEMBLOR ARMÓNICO DE GELATINA (Damped Harmonic Wave)
    // =========================================================================

    // Ciclo 0: Aplastamiento violento contra el piso (Splash / Valle)
    tl.to(squash, { scaleY: 0.42, scaleX: 1.65, skewX: 0, duration: 0.05, ease: 'sine.out' }, 'hit')
      .to(shadowContact, { scaleX: 1.70, opacity: 0.65, duration: 0.05, ease: 'sine.out' }, 'hit')
      .to(shadowAmbient, { scaleX: 1.50, opacity: 0.35, duration: 0.05, ease: 'sine.out' }, 'hit')
      .to(face, { y: 16, duration: 0.07, ease: 'sine.out' }, 'hit+=0.01')

      // Ciclo 1: Rebote elástico vertical explosivo con torsión senoidal
      .to(squash, { scaleY: 1.35, scaleX: 0.74, skewX: -8, duration: 0.07, ease: 'sine.inOut' })
      .to(face, { y: -10, duration: 0.07, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.75, opacity: 0.22, duration: 0.07, ease: 'sine.inOut' }, '<')

      // Ciclo 2: Valle de compresión secundaria
      .to(squash, { scaleY: 0.72, scaleX: 1.28, skewX: 6, duration: 0.07, ease: 'sine.inOut' })
      .to(face, { y: 8, duration: 0.07, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.30, opacity: 0.50, duration: 0.07, ease: 'sine.inOut' }, '<')

      // Ciclo 3: Rebote amortiguado
      .to(squash, { scaleY: 1.18, scaleX: 0.85, skewX: -4, duration: 0.06, ease: 'sine.inOut' })
      .to(face, { y: -5, duration: 0.06, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.86, opacity: 0.28, duration: 0.06, ease: 'sine.inOut' }, '<')

      // Ciclo 4: Compresión amortiguada
      .to(squash, { scaleY: 0.88, scaleX: 1.10, skewX: 2.5, duration: 0.06, ease: 'sine.inOut' })
      .to(face, { y: 3, duration: 0.06, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.12, opacity: 0.40, duration: 0.06, ease: 'sine.inOut' }, '<')

      // Ciclo 5: Micro-rebote elástico
      .to(squash, { scaleY: 1.06, scaleX: 0.95, skewX: -1.2, duration: 0.05, ease: 'sine.inOut' })
      .to(face, { y: -1.5, duration: 0.05, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.95, opacity: 0.33, duration: 0.05, ease: 'sine.inOut' }, '<')

      // Ciclo 6: Micro-compresión final
      .to(squash, { scaleY: 0.97, scaleX: 1.03, skewX: 0.6, duration: 0.05, ease: 'sine.inOut' })
      .to(face, { y: 0.8, duration: 0.05, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.03, opacity: 0.36, duration: 0.05, ease: 'sine.inOut' }, '<')

      // Asentamiento final al punto neutro
      .to(squash, { scaleY: 1.0, scaleX: 1.0, skewX: 0, duration: 0.15, ease: 'sine.out' })
      .to(face, { y: 0, duration: 0.15, ease: 'sine.out' }, '<')
      .to(shadowContact, { scaleX: 1.0, opacity: 0.38, duration: 0.15, ease: 'sine.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.15, ease: 'sine.out' }, '<');

    // =========================================================================
    // FASE 4: RESPIRACIÓN SINUSOIDAL INFINITA EN REPOSO (Idle vivo continuo)
    // =========================================================================
    tl.to(squash, {
      scaleY: 1.025,
      scaleX: 0.975,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
      .to(
        squash,
        {
          skewX: 1.2,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        '<'
      )
      .to(
        shadowContact,
        {
          scaleX: 1.04,
          opacity: 0.40,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        '<'
      );

    return tl;
  };

  useEffect(() => {
    timelineRef.current = buildTimeline();

    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    replay: () => {
      if (timelineRef.current) {
        timelineRef.current.restart();
      }
    },
  }));

  return (
    <div className={styles.stage}>
      <div ref={shadowAmbientRef} className={styles['shadow-ambient']} />
      <div ref={shadowContactRef} className={styles['shadow-contact']} />

      <div ref={carrierRef} className={styles.carrier}>
        <div ref={rotatorRef} className={styles.rotator}>
          <div ref={squashRef} className={styles.squash}>
            <CuteCharacterFucsia showShadows={false} faceRef={faceRef} />
          </div>
        </div>
      </div>
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
