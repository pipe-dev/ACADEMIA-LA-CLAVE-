'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CuteCharactersStatic } from '@/components/sandbox/CuteCharactersStatic';
import { AnimatedSkyBackground } from '@/components/sandbox/AnimatedSkyBackground';
import styles from './CuteLogin.module.css';

/**
 * Sandbox Cute Login - Split card horizontal pura
 * Izquierda: Escenario de los 4 personajes interactivos (Morado, Fucsia, Amarillo, Naranja)
 * Derecha: Formulario de inicio de sesión limpio y minimalista
 */
export default function CuteLoginPage() {
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

  // Bloqueo estricto de scroll en móvil: mantiene la tarjeta firmemente arriba
  const lockScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        lockScrollToTop();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.visualViewport?.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('scroll', handleScroll);
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
    setWrong(true);
    wrongTimer.current = setTimeout(() => setWrong(false), 4000);
  };

  return (
    <main className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-6 lg:p-8 select-none overflow-hidden overscroll-none touch-manipulation sm:touch-auto relative">
      {/* Motor de cielo animado de la Unidad 4 */}
      <AnimatedSkyBackground theme="unit4" cloudSpeed={0.8} />

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
        <div className="min-w-0 relative flex flex-col justify-end items-center bg-[#e9e9e9] p-1.5 pb-8 sm:p-10 border-r border-slate-200 overflow-visible z-10">
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
        </div>

        {/* ================================================== */}
        {/* LADO DERECHO: Formulario de Acceso Minimalista      */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-center px-4 py-4 sm:py-14 sm:px-14 bg-white/60 backdrop-blur-xl backdrop-saturate-150 z-20 border-l border-white/40">
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