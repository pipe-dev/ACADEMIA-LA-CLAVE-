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
  const bodyRef = useRef<HTMLDivElement>(null);
  const shadowContactRef = useRef<HTMLDivElement>(null);
  const shadowAmbientRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const buildTimeline = () => {
    if (!carrierRef.current || !bodyRef.current) return null;

    const carrier = carrierRef.current;
    const body = bodyRef.current;
    const shadowContact = shadowContactRef.current;
    const shadowAmbient = shadowAmbientRef.current;

    const tl = gsap.timeline({
      paused: !autoPlay,
      onComplete,
    });

    // Estado inicial: arriba a la derecha, invertido 180 deg (de cabeza)
    tl.set(carrier, { x: 110, y: -280 })
      .set(body, { rotation: 180, transformOrigin: 'top center', scaleX: 1, scaleY: 1 })
      .set(shadowContact, { scaleX: 0.3, opacity: 0.08 })
      .set(shadowAmbient, { scaleX: 0.3, opacity: 0.05 })

      // FASE 1: Balanceo pendular de entrada (derecha a izquierda)
      .to(carrier, { x: -50, duration: 0.65, ease: 'sine.inOut' })
      .to(body, { rotation: 162, duration: 0.65, ease: 'sine.inOut' }, '<')

      // FASE 2: Retorno pendular y preparacion de soltado (izquierda a derecha)
      .to(carrier, { x: 0, duration: 0.55, ease: 'sine.inOut' })
      .to(body, { rotation: 195, duration: 0.55, ease: 'sine.inOut' }, '<')

      // FASE 3: Desprendimiento, caida balistica acelerada y estiramiento en aire
      .set(body, { transformOrigin: 'center center' })
      .to(carrier, { y: 0, duration: 0.40, ease: 'power3.in' })
      .to(body, { rotation: 360, duration: 0.40, ease: 'power1.inOut' }, '<')
      .to(body, { scaleY: 1.14, scaleX: 0.88, duration: 0.14, ease: 'power2.in' }, '-=0.14')
      .to(shadowContact, { scaleX: 0.8, opacity: 0.25, duration: 0.20, ease: 'power2.in' }, '-=0.20')

      // FASE 4: Contacto en suelo, Squash elastico y disipacion procedural
      .set(body, { transformOrigin: 'bottom center' })
      .to(body, { scaleY: 0.76, scaleX: 1.22, duration: 0.08, ease: 'power2.out' })
      .to(shadowContact, { scaleX: 1.25, opacity: 0.45, duration: 0.08, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.15, opacity: 0.22, duration: 0.08, ease: 'power2.out' }, '<')
      .to(body, { scaleY: 1.0, scaleX: 1.0, duration: 0.48, ease: 'elastic.out(1.2, 0.35)' })
      .to(shadowContact, { scaleX: 1.0, opacity: 0.35, duration: 0.48, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.48, ease: 'power2.out' }, '<');

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
        <div ref={bodyRef} className={styles.bodyMotion}>
          <CuteCharacterFucsia showShadows={false} />
        </div>
      </div>
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
