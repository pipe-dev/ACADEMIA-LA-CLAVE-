'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CuteCharactersStatic } from '@/components/sandbox/CuteCharactersStatic';

/**
 * Sandbox Cute Login - Split card horizontal
 * Blobs estaticos y visibles siempre arriba en movil y desktop.
 * Bloqueado contra scroll y auto-zoom para que nunca se corte con el teclado.
 */
export default function CuteLoginPage() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [eyeInteracted, setEyeInteracted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [wrong, setWrong] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isPasswordActive =
    passwordFocused ||
    (password.length > 0 && !emailFocused) ||
    (eyeInteracted && !emailFocused);

  // Bloqueo estricto de scroll en movil: mantiene la tarjeta firmemente arriba
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
    requestAnimationFrame(lockScrollToTop);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setWrong(true);
    wrongTimer.current = setTimeout(() => setWrong(false), 4000);
  };

  return (
    <main className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-start sm:justify-center bg-[#e5e9ee] p-2 sm:p-6 lg:p-8 pt-[max(4px,env(safe-area-inset-top))] select-none overflow-hidden overscroll-none touch-manipulation sm:touch-auto">
      {/* Card split: 50%+5px escena / 50%-5px formulario, altura calibrada a 370px en movil */}
      <div className="w-full max-w-[960px] h-[370px] sm:h-auto sm:min-h-[580px] rounded-[24px] sm:rounded-[36px] bg-white shadow-[0_25px_60px_rgba(15,23,42,0.18)] overflow-hidden grid grid-cols-[calc(50%+5px)_calc(50%-5px)] border border-slate-200/60 shrink-0">
        {/* ================================================== */}
        {/* LADO IZQUIERDO: Escenario de los 4 Personajes       */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-end items-center bg-[#e9e9e9] p-1.5 pb-8 sm:p-10 border-r border-slate-200 overflow-visible z-20">
          <div className="w-full flex items-end justify-center pb-2 sm:pb-1 overflow-visible">
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
              rememberChecked={rememberMe}
              className="w-full max-w-[560px]"
            />
          </div>
        </div>

        {/* ================================================== */}
        {/* LADO DERECHO: Formulario de Acceso Minimalista      */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-center pl-3.5 pr-2.5 pt-2 pb-6 sm:py-14 sm:px-14 bg-white z-0">
          <div className="max-w-[340px] mx-auto w-full space-y-1.5 sm:space-y-6">
            {/* Titulares principales */}
            <div className="space-y-0 sm:space-y-1.5 text-left">
              <h1 className="text-lg sm:text-4xl font-extrabold tracking-tight text-[#111827] leading-tight truncate sm:whitespace-normal">
                ¡Bienvenido!
              </h1>
              <p className="text-[11px] sm:text-sm text-slate-500 font-normal leading-tight truncate sm:whitespace-normal">
                Ingresa tus datos
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-5 pt-0.5 sm:pt-1">
              {/* Campo Email */}
              <div className="space-y-0 sm:space-y-1">
                <label htmlFor="static-email" className="block text-[11px] sm:text-xs font-semibold text-slate-700">
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
                    className="w-full bg-transparent border-b border-slate-300 py-1 sm:py-2 text-[16px] sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="space-y-0 sm:space-y-1">
                <label htmlFor="static-password" className="block text-[11px] sm:text-xs font-semibold text-slate-700">
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
                    className="w-full bg-transparent border-b border-slate-300 py-1 sm:py-2 pr-7 sm:pr-8 text-[16px] sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setEyeInteracted(true);
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 text-slate-500 hover:text-slate-900 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Fila Recordarme / Forgot password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] sm:text-xs pt-0.5 gap-1 sm:gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 font-medium shrink-0">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3 w-3 sm:h-3.5 sm:w-3.5"
                  />
                  <span className="truncate">Recordarme</span>
                </label>
                <a href="#forgot" className="text-slate-500 hover:text-slate-900 transition-colors truncate">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Boton Primario: Iniciar sesion */}
              <button
                type="submit"
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
                onFocus={() => setSubmitHovered(true)}
                onBlur={() => setSubmitHovered(false)}
                className="w-full h-8 sm:h-11 rounded-full font-bold bg-[#111827] hover:bg-black text-white text-xs sm:text-sm shadow-sm active:scale-[0.99] transition-all mt-1 sm:mt-3"
              >
                Iniciar sesión
              </button>

              {/* Boton Secundario: Iniciar sesion con Google */}
              <button
                type="button"
                className="w-full h-7 sm:h-11 rounded-full font-semibold border border-slate-200 bg-[#f9fafb] hover:bg-slate-100 text-slate-700 text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-none transition-all"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="truncate sm:hidden">Google</span>
                <span className="hidden sm:inline truncate">Iniciar sesión con Google</span>
              </button>
            </form>

            {/* Pie de registro */}
            <div className="text-center pt-0.5 sm:pt-3">
              <p className="text-[10px] sm:text-xs text-slate-500 font-normal">
                ¿No tienes una cuenta?{' '}
                <a href="#signup" className="font-semibold text-slate-900 hover:underline">
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