'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { CuteCharactersStatic } from '@/components/sandbox/CuteCharactersStatic';
import { useJellyAsmrAudio } from '@/utils/useJellyAsmrAudio';
import styles from './CuteLogin.module.css';

/**
 * Sandbox Cute Login / Register interactivo unificado
 * Card split con transicion in-place fluida:
 * - Login: Blobs a la izquierda, formulario claro a la derecha.
 * - Register: Blobs cruzan en caravana a la derecha, formulario oscuro a la izquierda.
 * Al tocar cualquier campo la tarjeta se adapta sin cortes.
 */
export default function CuteLoginPage() {
  // Modo de vista: false = Iniciar sesion, true = Registro
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { playSlideTransition } = useJellyAsmrAudio();

  // Estados de Login
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [eyeInteracted, setEyeInteracted] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);

  // Estados de Registro
  const [regName, setRegName] = useState('');
  const [regNameFocused, setRegNameFocused] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regEmailFocused, setRegEmailFocused] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordFocused, setRegPasswordFocused] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regEyeInteracted, setRegEyeInteracted] = useState(false);
  const [regSubmitHovered, setRegSubmitHovered] = useState(false);
  const [regTerms, setRegTerms] = useState(false);

  // Estados de error y adaptacion reactiva
  const [wrong, setWrong] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFieldFocused, setIsFieldFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deteccion de parametro en URL para iniciar en registro si es llamado desde /cuteregister
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'register' || window.location.hash === '#register') {
        setIsRegisterMode(true);
      }
    }
  }, []);

  // Controladores de transicion fluida in-place
  const handleSwitchToRegister = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsFieldFocused(false);
    playSlideTransition();
    setIsRegisterMode(true);
    setEmailFocused(false);
    setPasswordFocused(false);
    setSubmitHovered(false);
  };

  const handleSwitchToLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsFieldFocused(false);
    playSlideTransition();
    setIsRegisterMode(false);
    setRegNameFocused(false);
    setRegEmailFocused(false);
    setRegPasswordFocused(false);
    setRegSubmitHovered(false);
  };

  // Variables activas segun el modo actual
  const isNameActive = isRegisterMode && regNameFocused;
  const isEmailActive = isRegisterMode ? regEmailFocused : emailFocused;
  const activeEmail = isRegisterMode ? regEmail : email;
  const isCurrentEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activeEmail);

  const isPasswordFocusedActive = isRegisterMode ? regPasswordFocused : passwordFocused;
  const activePassword = isRegisterMode ? regPassword : password;
  const activeShowPassword = isRegisterMode ? showRegPassword : showPassword;
  const activeEyeInteracted = isRegisterMode ? regEyeInteracted : eyeInteracted;

  const isCurrentPasswordActive =
    isPasswordFocusedActive ||
    (activePassword.length > 0 && !isEmailActive && !isNameActive) ||
    (activeEyeInteracted && !isEmailActive && !isNameActive);

  const activeSubmitHovered = isRegisterMode ? regSubmitHovered : submitHovered;

  // Bloqueo de scroll para mantener la tarjeta en posición óptima
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

  const handleRegInputFocus = (field: 'name' | 'email' | 'password') => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFieldFocused(true);
    if (field === 'name') setRegNameFocused(true);
    if (field === 'email') {
      setRegEmailFocused(true);
      setRegEyeInteracted(false);
    }
    if (field === 'password') setRegPasswordFocused(true);
    requestAnimationFrame(lockScrollToTop);
  };

  const handleRegInputBlur = (field: 'name' | 'email' | 'password') => {
    if (field === 'name') setRegNameFocused(false);
    if (field === 'email') setRegEmailFocused(false);
    if (field === 'password') setRegPasswordFocused(false);
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setIsFieldFocused(false);
    }, 120);
    requestAnimationFrame(lockScrollToTop);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setWrong(true);
    wrongTimer.current = setTimeout(() => setWrong(false), 4000);
  };

  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setWrong(true);
    wrongTimer.current = setTimeout(() => setWrong(false), 4000);
  };

  return (
    <main className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-start sm:justify-center bg-[#e5e9ee] p-2 sm:p-6 lg:p-8 select-none overflow-hidden overscroll-none touch-manipulation sm:touch-auto">
      {/* Card unificada: contenedor base con escenario en ambas mitades y capa deslizante interactiva */}
      <div
        className={`w-full rounded-[24px] sm:rounded-[36px] bg-[#e9e9e9] shadow-[0_25px_60px_rgba(15,23,42,0.18)] overflow-hidden grid grid-cols-2 border border-slate-200/60 shrink-0 relative ${styles.card} ${
          isFieldFocused ? styles.cardFocused : styles.cardIdle
        }`}
      >
        {/* ================================================== */}
        {/* BASE IZQUIERDA: Escenario de los Personajes         */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-end items-center bg-[#e9e9e9] p-1.5 pb-8 sm:p-10 border-r border-slate-200/60 overflow-visible z-20">
          <div className="w-full flex items-end justify-center pb-2 sm:pb-1 overflow-visible">
            <CuteCharactersStatic
              excited={isEmailActive || isNameActive}
              nameFocused={isNameActive}
              shy={isCurrentPasswordActive}
              reveal={activeShowPassword}
              passwordLength={activePassword.length}
              error={wrong}
              typing={
                (isEmailActive && activeEmail.length > 0) ||
                (isNameActive && regName.length > 0)
              }
              typingProgress={
                isNameActive
                  ? Math.min(regName.length / 7, 1)
                  : Math.min(activeEmail.length / 7, 1)
              }
              emailValid={isCurrentEmailValid}
              submitHovered={activeSubmitHovered}
              caravanToRight={isRegisterMode}
              className="w-full max-w-[560px]"
            />
          </div>
        </div>

        {/* ================================================== */}
        {/* BASE DERECHA: Escenario receptor para la caravana   */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-end items-center bg-[#e9e9e9] p-1.5 pb-8 sm:p-10 border-l border-slate-200/60 overflow-visible z-10" />

        {/* ================================================== */}
        {/* CAPA DESLIZANTE SUPERIOR: Formulario Dinámico       */}
        {/* ================================================== */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-[50.2%] z-30 flex flex-col justify-center px-4 py-4 sm:py-14 sm:px-14 overflow-hidden ${
            isRegisterMode
              ? 'bg-[#0f172a] text-white border-r border-slate-800 shadow-[12px_0_35px_rgba(0,0,0,0.18)]'
              : 'bg-white text-slate-900 border-l border-slate-200 shadow-[-12px_0_35px_rgba(0,0,0,0.06)]'
          }`}
          style={{
            transform: isRegisterMode ? 'translateX(0%)' : 'translateX(99.6%)',
            transition:
              'transform 650ms cubic-bezier(0.16, 1, 0.3, 1), background-color 450ms ease, border-color 450ms ease, box-shadow 450ms ease',
          }}
        >
          {/* ================================================ */}
          {/* VISTA 1: Formulario de Iniciar Sesión (Modo Claro) */}
          {/* ================================================ */}
          <div
            className={`max-w-[340px] sm:max-w-[360px] mx-auto w-full transition-all duration-300 ${
              isFieldFocused ? 'space-y-2.5 sm:space-y-6' : 'space-y-4 sm:space-y-6'
            } ${
              isRegisterMode
                ? 'opacity-0 pointer-events-none hidden'
                : 'opacity-100 block'
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

            {/* Formulario Login */}
            <form
              onSubmit={handleLoginSubmit}
              className={`${
                isFieldFocused
                  ? 'space-y-2 sm:space-y-6 pt-0.5 sm:pt-2'
                  : 'space-y-3 sm:space-y-6 pt-1 sm:pt-2'
              }`}
            >
              {/* Campo Correo */}
              <div className="space-y-0.5 sm:space-y-1">
                <label
                  htmlFor="cutelogin-email"
                  className="block text-xs sm:text-sm font-semibold text-slate-700"
                >
                  Correo
                </label>
                <div className="relative">
                  <input
                    id="cutelogin-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleInputFocus('email')}
                    onBlur={() => handleInputBlur('email')}
                    placeholder=""
                    className="w-full bg-transparent border-b border-slate-300 py-1.5 sm:py-2.5 text-[16px] sm:text-base text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-0.5 sm:space-y-1">
                <label
                  htmlFor="cutelogin-password"
                  className="block text-xs sm:text-sm font-semibold text-slate-700"
                >
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <input
                    id="cutelogin-password"
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
                    className="w-full bg-transparent border-b border-slate-300 py-1.5 sm:py-2.5 pr-8 sm:pr-10 text-[16px] sm:text-base text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setEyeInteracted(true);
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 text-slate-500 hover:text-slate-900 transition-colors p-1.5"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón Primario: Iniciar sesión */}
              <button
                type="submit"
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
                onFocus={() => setSubmitHovered(true)}
                onBlur={() => setSubmitHovered(false)}
                className="w-full h-10 sm:h-12 rounded-full font-bold bg-[#111827] hover:bg-black text-white text-xs sm:text-base shadow-sm active:scale-[0.99] transition-all mt-2 sm:mt-4"
              >
                Iniciar sesión
              </button>
            </form>

            {/* Enlace para cambiar a Registro con animación in-place */}
            <div className="text-center pt-1 sm:pt-4">
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer bg-transparent border-none p-0 inline font-inherit"
                >
                  Regístrate
                </button>
              </p>
            </div>
          </div>

          {/* ================================================ */}
          {/* VISTA 2: Formulario de Registro (Modo Oscuro)    */}
          {/* ================================================ */}
          <div
            className={`max-w-[340px] sm:max-w-[360px] mx-auto w-full transition-all duration-300 ${
              isFieldFocused ? 'space-y-2 sm:space-y-5' : 'space-y-3 sm:space-y-5'
            } ${
              !isRegisterMode
                ? 'opacity-0 pointer-events-none hidden'
                : 'opacity-100 block'
            }`}
          >
            {/* Titulares principales */}
            <div className="space-y-0.5 sm:space-y-1.5 text-left">
              <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight truncate sm:whitespace-normal">
                ¡Únete a AfinApp!
              </h1>
              <p className="text-xs sm:text-base text-slate-400 font-normal leading-tight truncate sm:whitespace-normal">
                Crea tu cuenta gratis
              </p>
            </div>

            {/* Formulario Registro */}
            <form
              onSubmit={handleRegSubmit}
              className={`${
                isFieldFocused
                  ? 'space-y-1.5 sm:space-y-4 pt-0 sm:pt-1'
                  : 'space-y-2.5 sm:space-y-4 pt-0.5 sm:pt-1'
              }`}
            >
              {/* Campo Nombre */}
              <div className="space-y-0.5 sm:space-y-1">
                <label
                  htmlFor="reg-name"
                  className="block text-xs sm:text-sm font-semibold text-slate-300"
                >
                  Nombre
                </label>
                <div className="relative">
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    onFocus={() => handleRegInputFocus('name')}
                    onBlur={() => handleRegInputBlur('name')}
                    placeholder=""
                    className="w-full bg-transparent border-b border-slate-600 py-1 sm:py-2 text-[16px] sm:text-base text-white focus:outline-none focus:border-slate-200 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Correo */}
              <div className="space-y-0.5 sm:space-y-1">
                <label
                  htmlFor="reg-email"
                  className="block text-xs sm:text-sm font-semibold text-slate-300"
                >
                  Correo
                </label>
                <div className="relative">
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    onFocus={() => handleRegInputFocus('email')}
                    onBlur={() => handleRegInputBlur('email')}
                    placeholder=""
                    className="w-full bg-transparent border-b border-slate-600 py-1 sm:py-2 text-[16px] sm:text-base text-white focus:outline-none focus:border-slate-200 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-0.5 sm:space-y-1">
                <label
                  htmlFor="reg-password"
                  className="block text-xs sm:text-sm font-semibold text-slate-300"
                >
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (wrong) {
                        setWrong(false);
                        if (wrongTimer.current) {
                          clearTimeout(wrongTimer.current);
                          wrongTimer.current = null;
                        }
                      }
                    }}
                    onFocus={() => handleRegInputFocus('password')}
                    onBlur={() => handleRegInputBlur('password')}
                    placeholder=""
                    className="w-full bg-transparent border-b border-slate-600 py-1 sm:py-2 pr-8 sm:pr-10 text-[16px] sm:text-base text-white focus:outline-none focus:border-slate-200 transition-colors"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setRegEyeInteracted(true);
                      setShowRegPassword((prev) => !prev);
                    }}
                    aria-label={showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 text-slate-400 hover:text-white transition-colors p-1.5"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox Términos y Condiciones */}
              <button
                type="button"
                onClick={() => setRegTerms((prev) => !prev)}
                className="flex items-start gap-2.5 text-left pt-0.5 sm:pt-1 w-full"
              >
                <span
                  className={`mt-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    regTerms ? 'bg-[#6366f1] border-[#6366f1]' : 'border-slate-500'
                  }`}
                >
                  {regTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-[11px] sm:text-sm text-slate-400 font-normal leading-snug">
                  Acepto los{' '}
                  <span className="text-slate-200 underline underline-offset-2">Términos</span>{' '}
                  y la{' '}
                  <span className="text-slate-200 underline underline-offset-2">
                    Política de Privacidad
                  </span>
                </span>
              </button>

              {/* Botón Primario: Crear cuenta */}
              <button
                type="submit"
                onMouseEnter={() => setRegSubmitHovered(true)}
                onMouseLeave={() => setRegSubmitHovered(false)}
                onFocus={() => setRegSubmitHovered(true)}
                onBlur={() => setRegSubmitHovered(false)}
                className="w-full h-10 sm:h-12 rounded-full font-bold bg-white hover:bg-slate-200 text-[#0f172a] text-xs sm:text-base shadow-sm active:scale-[0.99] transition-all mt-1 sm:mt-2"
              >
                Crear cuenta
              </button>
            </form>

            {/* Enlace para cambiar a Login con animación in-place */}
            <div className="text-center pt-1 sm:pt-3">
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="font-semibold text-slate-200 hover:underline cursor-pointer bg-transparent border-none p-0 inline font-inherit"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}