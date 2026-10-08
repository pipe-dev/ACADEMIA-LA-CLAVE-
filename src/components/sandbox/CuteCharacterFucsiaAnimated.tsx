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

    // 1. ESTADO INICIAL: Colgado del techo invertido (cabeza abajo, base arriba)
    tl.set(carrier, { x: 100, y: -450 })
      .set(rotator, { rotation: 195, transformOrigin: 'center center' })
      .set(squash, { scaleX: 1, scaleY: 1, skewX: 0, transformOrigin: 'bottom center' })
      .set(face, { y: 0, x: 0 })
      .set(shadowContact, { scaleX: 0.3, opacity: 0.08 })
      .set(shadowAmbient, { scaleX: 0.3, opacity: 0.05 })

      // FASE 1: Balanceo pendular hacia la izquierda con flexión de látigo
      .to(carrier, { x: -60, duration: 0.65, ease: 'sine.inOut' })
      .to(carrier, { y: -475, duration: 0.32, ease: 'sine.out', yoyo: true, repeat: 1 }, '<')
      .to(rotator, { rotation: 162, duration: 0.65, ease: 'sine.inOut' }, '<')
      .to(
        squash,
        {
          skewX: 18,
          scaleY: 1.14,
          scaleX: 0.88,
          duration: 0.65,
          ease: 'sine.inOut',
        },
        '<'
      )
      .to(face, { x: 6, duration: 0.65, ease: 'sine.inOut' }, '<')

      // FASE 2: Retorno pendular hacia el centro de soltado (x: 0) con látigo inverso
      .to(carrier, { x: 0, duration: 0.55, ease: 'sine.inOut' })
      .to(rotator, { rotation: 192, duration: 0.55, ease: 'sine.inOut' }, '<')
      .to(
        squash,
        {
          skewX: -20,
          scaleY: 1.15,
          scaleX: 0.87,
          duration: 0.55,
          ease: 'sine.inOut',
        },
        '<'
      )
      .to(face, { x: -6, duration: 0.55, ease: 'sine.inOut' }, '<')

      // FASE 3: Desprendimiento y caída libre acelerada con voltereta de 180°
      // Anticipación breve de compresión antes de soltarse
      .to(squash, { scaleY: 0.92, scaleX: 1.09, duration: 0.06, ease: 'power1.out' })
      // Caída acelerada hacia el suelo (y: 0)
      .to(carrier, { y: 0, duration: 0.38, ease: 'power3.in' }, 'fall')
      // Giro de 180° hacia la posición neutra (360° / 0°)
      .to(rotator, { rotation: 360, duration: 0.38, ease: 'power1.inOut' }, 'fall')
      // Deformación de gota líquida estirada en el aire
      .to(
        squash,
        {
          scaleY: 1.36,
          scaleX: 0.74,
          skewX: 0,
          duration: 0.18,
          ease: 'power2.in',
        },
        'fall+=0.18'
      )
      .to(face, { x: 0, duration: 0.2, ease: 'power1.out' }, 'fall')
      .to(shadowContact, { scaleX: 0.85, opacity: 0.28, duration: 0.2, ease: 'power2.in' }, 'fall+=0.18')

      // FASE 4: IMPACTO BALÍSTICO Y DISIPACIÓN DE FLAN / GELATINA (7 ciclos rápidos)
      // Onda 0: Aplastamiento violento contra el suelo (Splash)
      .to(squash, {
        scaleY: 0.40,
        scaleX: 1.70,
        skewX: 0,
        duration: 0.05,
        ease: 'power2.out',
      })
      .to(shadowContact, { scaleX: 1.75, opacity: 0.65, duration: 0.05 }, '<')
      .to(shadowAmbient, { scaleX: 1.50, opacity: 0.35, duration: 0.05 }, '<')
      .to(face, { y: 18, duration: 0.07, ease: 'power2.out' }, '<0.01')

      // Onda 1: Expansión vertical elástica explosiva con torsión
      .to(squash, {
        scaleY: 1.35,
        scaleX: 0.74,
        skewX: -8,
        duration: 0.07,
        ease: 'power1.out',
      })
      .to(face, { y: -10, duration: 0.07, ease: 'power1.out' }, '<')
      .to(shadowContact, { scaleX: 0.75, opacity: 0.22, duration: 0.07 }, '<')

      // Onda 2: Segunda compresión violenta
      .to(squash, {
        scaleY: 0.72,
        scaleX: 1.28,
        skewX: 6,
        duration: 0.07,
        ease: 'sine.inOut',
      })
      .to(face, { y: 8, duration: 0.07, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.30, opacity: 0.50, duration: 0.07 }, '<')

      // Onda 3: Tercer rebote
      .to(squash, {
        scaleY: 1.18,
        scaleX: 0.85,
        skewX: -4,
        duration: 0.06,
        ease: 'sine.inOut',
      })
      .to(face, { y: -5, duration: 0.06, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.86, opacity: 0.28, duration: 0.06 }, '<')

      // Onda 4: Cuarta compresión amortiguada
      .to(squash, {
        scaleY: 0.88,
        scaleX: 1.10,
        skewX: 2.5,
        duration: 0.06,
        ease: 'sine.inOut',
      })
      .to(face, { y: 3, duration: 0.06, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.12, opacity: 0.40, duration: 0.06 }, '<')

      // Onda 5: Micro-rebote elástico
      .to(squash, {
        scaleY: 1.06,
        scaleX: 0.95,
        skewX: -1.2,
        duration: 0.05,
        ease: 'sine.inOut',
      })
      .to(face, { y: -1.5, duration: 0.05, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.95, opacity: 0.33, duration: 0.05 }, '<')

      // Onda 6: Micro-compresión final
      .to(squash, {
        scaleY: 0.97,
        scaleX: 1.03,
        skewX: 0.6,
        duration: 0.05,
        ease: 'sine.inOut',
      })
      .to(face, { y: 0.8, duration: 0.05, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.03, opacity: 0.36, duration: 0.05 }, '<')

      // Onda 7: Asentamiento final al punto neutro
      .to(squash, {
        scaleY: 1.0,
        scaleX: 1.0,
        skewX: 0,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(face, { y: 0, duration: 0.15, ease: 'power2.out' }, '<')
      .to(shadowContact, { scaleX: 1.0, opacity: 0.38, duration: 0.15, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.15, ease: 'power2.out' }, '<')

      // FASE 5: Respiración gelatinosa sutil en reposo (Idle continuo)
      .to(squash, {
        scaleY: 1.025,
        scaleX: 0.975,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

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
