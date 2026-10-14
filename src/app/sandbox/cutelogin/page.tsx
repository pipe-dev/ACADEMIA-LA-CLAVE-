'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CuteCharactersStatic } from '@/components/sandbox/CuteCharactersStatic';
import { AnimatedSkyBackground } from '@/components/sandbox/AnimatedSkyBackground';
import { getSharedAudioContext } from '@/utils/useJellyAsmrAudio';
import styles from './CuteLogin.module.css';

/**
 * Sandbox Cute Login - Split card horizontal pura
 * Izquierda: Escenario de los 4 personajes interactivos (Morado, Fucsia, Amarillo, Naranja)
 * Derecha: Formulario de inicio de sesión limpio y minimalista
 */
export default function CuteLoginPage() {
  const [splashActive, setSplashActive] = useState(true);
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [eyeInteracted, setEyeInteracted] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [wrong, setWrong] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Control dinámico para encoger la tarjeta solo al interactuar con campos
  const [isFieldFocused, setIsFieldFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordActive =
    passwordFocused ||
    (password.length > 0 && !emailFocused) ||
    (eyeInteracted && !emailFocused);

  const handleDismissSplash = () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {}
    setSplashActive(false);
  };

  // Bloqueo estricto de scroll en movil y escritorio: mantiene la pantalla 100% inmóvil
  const lockScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const originalHtmlTouchAction = document.documentElement.style.touchAction;
    const originalHtmlHeight = document.documentElement.style.height;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyWidth = document.body.style.width;
    const originalBodyHeight = document.body.style.height;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.touchAction = 'none';
    document.documentElement.style.height = '100%';

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';

    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const preventWheel = (e: WheelEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const preventScrollKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (isInput) return;
      const scrollKeys = ['Space', 'PageUp', 'PageDown', 'End', 'Home', 'ArrowUp', 'ArrowDown'];
      if (scrollKeys.includes(e.code) || scrollKeys.includes(e.key)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        lockScrollToTop();
      }
    };

    window.addEventListener('touchmove', preventTouchMove, { passive: false });
    window.addEventListener('wheel', preventWheel, { passive: false });
    window.addEventListener('keydown', preventScrollKeys);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.visualViewport?.addEventListener('scroll', handleScroll);
    window.visualViewport?.addEventListener('resize', handleScroll);

    lockScrollToTop();

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      document.documentElement.style.touchAction = originalHtmlTouchAction;
      document.documentElement.style.height = originalHtmlHeight;

      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.body.style.touchAction = originalBodyTouchAction;

      window.removeEventListener('touchmove', preventTouchMove);
      window.removeEventListener('wheel', preventWheel);
      window.removeEventListener('keydown', preventScrollKeys);
      window.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleInputFocus = (field: 'email' | 'password') => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFieldFocused(true);
    if (field === 'email') {
      setEmailFocused(true);
      setEyeInteracted(false);
    }
    if (field === 'password') setPasswordFocused(true);
    requestAnimationFrame(lockScrollToTop);
  };

  const handleInputBlur = (field: 'email' | 'password') => {
    if (field === 'email') setEmailFocused(false);
    if (field === 'password') setPasswordFocused(false);
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setIsFieldFocused(false);
    }, 120);
    requestAnimationFrame(lockScrollToTop);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    // Reiniciar temporalmente para asegurar que el trigger de error/glitch se dispare en cada intento
    setWrong(false);
    requestAnimationFrame(() => {
      setWrong(true);
      wrongTimer.current = setTimeout(() => setWrong(false), 4000);
    });
  };

  return (
    <main
      className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-6 lg:p-8 select-none overflow-hidden overscroll-none touch-none relative"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Splash inicial de un solo color plano de la paleta con botón en contraste */}
      {splashActive && (
        <div
          onClick={handleDismissSplash}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F172A] select-none cursor-pointer p-4 transition-opacity duration-300"
          style={{ touchAction: 'none' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismissSplash();
            }}
            className="px-8 py-4 sm:px-10 sm:py-5 rounded-full font-bold text-lg sm:text-xl bg-white text-[#0F172A] shadow-[0_10px_35px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer tracking-wide"
          >
            Toca aquí
          </button>
        </div>
      )}

      {/* Motor de cielo animado con ciclo de dia dinamico aleatorio (~7s por fase) */}
      <AnimatedSkyBackground
        theme="unit4"
        cloudSpeed={0.8}
        dynamicDayCycle={true}
        cycleDuration={7.0}
        randomizeDuration={true}
      />

      {/* Velo atmosférico sutil (Enfoque 2) */}
      <div className="fixed inset-0 z-[1] bg-slate-950/15 backdrop-blur-[1px] pointer-events-none" />

      {/* Contenedor principal de la tarjeta flotante */}
      <div
        className={`w-full max-w-[960px] sm:h-[620px] rounded-[24px] sm:rounded-[36px] bg-white/20 backdrop-blur-md shadow-[0_25px_60px_rgba(15,23,42,0.25)] overflow-hidden grid grid-cols-2 border border-white/50 shrink-0 relative z-10 ${styles.card} ${
          isFieldFocused ? styles.cardFocused : styles.cardIdle
        }`}
      >
        {/* ================================================== */}
        {/* LADO IZQUIERDO: Escenario de los 4 Personajes       */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-end items-center bg-[#e9e9e9] p-1.5 pb-8 sm:p-10 border-r border-slate-200 overflow-visible z-30 touch-none overscroll-none pointer-events-none">
          <div className="w-full max-w-[560px] pointer-events-auto">
            {!splashActive && (
              <CuteCharactersStatic
                excited={emailFocused}
                shy={isPasswordActive}
                reveal={showPassword}
                passwordLength={password.length}
                error={wrong}
                typing={emailFocused && email.length > 0}
                typingProgress={Math.min(email.length / 7, 1)}
                emailValid={isEmailValid}
                submitHovered={submitHovered}
                className="w-full max-w-[560px]"
              />
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* LADO DERECHO: Formulario de Acceso Minimalista      */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-center px-4 py-4 sm:py-14 sm:px-14 bg-white/60 backdrop-blur-xl backdrop-saturate-150 z-10 border-l border-white/40 overflow-hidden touch-none overscroll-none">
          <div
            className={`max-w-[340px] sm:max-w-[360px] mx-auto w-full ${
              isFieldFocused ? 'space-y-2.5 sm:space-y-6' : 'space-y-4 sm:space-y-6'
            }`}
          >
            {/* Titulares principales */}
            <div className="space-y-0.5 sm:space-y-1.5 text-left">
              <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-[#111827] leading-tight truncate sm:whitespace-normal">
                ¡Bienvenido!
              </h1>
              <p className="text-xs sm:text-base text-slate-500 font-normal leading-tight truncate sm:whitespace-normal">
                Ingresa tus datos
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className={`${isFieldFocused ? 'space-y-2 sm:space-y-6 pt-0.5 sm:pt-2' : 'space-y-3 sm:space-y-6 pt-1 sm:pt-2'}`}>
              {/* Campo Email */}
              <div className="space-y-0.5 sm:space-y-1">
                <label htmlFor="static-email" className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Correo
                </label>
                <div className="relative">
                  <input
                    id="static-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleInputFocus('email')}
                    onBlur={() => handleInputBlur('email')}
                    placeholder=""
                    style={{ touchAction: 'manipulation' }}
                    className="w-full bg-transparent border-b border-slate-400/80 py-1.5 sm:py-2.5 text-[16px] sm:text-base text-slate-900 focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="space-y-0.5 sm:space-y-1">
                <label htmlFor="static-password" className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <input
                    id="static-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (wrong) {
                        setWrong(false);
                        if (wrongTimer.current) {
                          clearTimeout(wrongTimer.current);
                          wrongTimer.current = null;
                        }
                      }
                    }}
                    onFocus={() => handleInputFocus('password')}
                    onBlur={() => handleInputBlur('password')}
                    placeholder=""
                    style={{ touchAction: 'manipulation' }}
                    className="w-full bg-transparent border-b border-slate-400/80 py-1.5 sm:py-2.5 pr-8 sm:pr-10 text-[16px] sm:text-base text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setEyeInteracted(true);
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 text-slate-600 hover:text-slate-900 transition-colors p-1.5"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Boton Primario: Iniciar sesion */}
              <button
                type="submit"
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
                onFocus={() => setSubmitHovered(true)}
                onBlur={() => setSubmitHovered(false)}
                className="w-full h-10 sm:h-12 rounded-full font-bold bg-[#111827] hover:bg-black text-white text-xs sm:text-base shadow-sm active:scale-[0.99] transition-all mt-2 sm:mt-4 whitespace-nowrap px-2"
              >
                Iniciar sesión
              </button>
            </form>

            {/* Pie de registro */}
            <div className="text-center pt-1 sm:pt-4">
              <p className="text-[11px] sm:text-sm text-slate-500 font-normal leading-snug">
                ¿No tienes una cuenta?{' '}
                <a
                  href="#signup"
                  onClick={(e) => e.preventDefault()}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Regístrate
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}