'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CuteCharactersStatic } from '@/components/mascotas/CuteCharactersStatic';
import { AnimatedSkyBackground } from '@/components/login/AnimatedSkyBackground';
import { getSharedAudioContext } from '@/utils/useJellyAsmrAudio';
import styles from './CuteLogin.module.css';

/**
 * Login Oficial de AfinApp - Escenario Interactivo y Formulario
 * Izquierda: Escenario de los 4 personajes interactivos (Morado, Fucsia, Amarillo, Naranja)
 * Derecha: Formulario de inicio de sesión real conectado con /api/auth/login
 */
export default function LoginPage() {
  const [splashActive, setSplashActive] = useState(true);
  const [blobsReady, setBlobsReady] = useState(false);
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [eyeInteracted, setEyeInteracted] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wrong, setWrong] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accountAlert, setAccountAlert] = useState<{
    type: 'blocked' | 'expired' | 'error';
    title: string;
    message: string;
    whatsappUrl?: string;
  } | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const REGISTRATION_WHATSAPP_URL = `https://wa.me/573006269056?text=${encodeURIComponent(
    'Hola, quiero registrarme en AfinApp.'
  )}`;

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

  // Bloqueo estricto de scroll en móvil y escritorio: mantiene la pantalla 100% inmóvil
  const lockScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cargar credencial recordada
    try {
      const savedUser = localStorage.getItem('afinapp_remembered_username');
      if (savedUser) {
        setEmail(savedUser);
        setRememberMe(true);
      }
    } catch {}

    // Notificaciones contextuales de sesión expirada o bloqueada
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'expired') {
      setAccountAlert({
        type: 'expired',
        title: 'Membresía Expirada',
        message: 'Tu suscripción mensual ha finalizado. Renueva tu membresía para continuar practicando.',
        whatsappUrl: `https://wa.me/573006269056?text=${encodeURIComponent('Hola, mi membresía en AfinApp ha finalizado y deseo renovar mis días de acceso.')}`,
      });
      toast({
        variant: 'destructive',
        title: 'Suscripción finalizada',
        description: 'Tu suscripción mensual ha finalizado. Renueva tu membresía para continuar.',
      });
    } else if (reason === 'blocked') {
      setAccountAlert({
        type: 'blocked',
        title: 'Cuenta Suspendida',
        message: 'Tu cuenta ha sido bloqueada por la administración. Por favor comunícate para reactivar tu acceso.',
        whatsappUrl: `https://wa.me/573006269056?text=${encodeURIComponent('Hola, mi cuenta en AfinApp ha sido bloqueada y deseo solicitar reactivación.')}`,
      });
      toast({
        variant: 'destructive',
        title: 'Cuenta suspendida',
        description: 'Tu cuenta ha sido suspendida. Por favor contacta a la academia.',
      });
    } else if (reason === 'ended') {
      toast({
        variant: 'destructive',
        title: 'Sesión expirada',
        description: 'Tu sesión ha expirado. Por favor ingresa nuevamente.',
      });
    }

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
  }, [toast]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = email.trim();
    const cleanKey = password.trim();

    if (!cleanUsername || !cleanKey) {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      setWrong(false);
      requestAnimationFrame(() => {
        setWrong(true);
        wrongTimer.current = setTimeout(() => setWrong(false), 4000);
      });
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Por favor, ingresa tu correo y contraseña.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, key: cleanKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ACCOUNT_BLOCKED' || data.reason === 'blocked') {
          setAccountAlert({
            type: 'blocked',
            title: 'Cuenta Bloqueada / Suspendida',
            message: data.error || 'Esta cuenta ha sido bloqueada o suspendida por la administración de la academia.',
            whatsappUrl: `https://wa.me/573006269056?text=${encodeURIComponent(`Hola, mi cuenta en AfinApp (${cleanUsername}) está bloqueada o suspendida y deseo solicitar reactivación.`)}`,
          });
          toast({
            variant: 'destructive',
            title: 'Cuenta Bloqueada',
            description: data.error || 'Tu cuenta se encuentra bloqueada por la administración.',
            duration: 8000,
          });
          setIsLoading(false);
          return;
        }

        if (data.code === 'ACCOUNT_EXPIRED' || data.reason === 'expired') {
          setAccountAlert({
            type: 'expired',
            title: 'Membresía Expirada',
            message: data.error || 'Tu periodo de membresía ha expirado. Por favor renueva tus días de acceso para continuar practicando.',
            whatsappUrl: `https://wa.me/573006269056?text=${encodeURIComponent(`Hola, mi periodo de membresía en AfinApp (${cleanUsername}) ha vencido y deseo renovar mi acceso.`)}`,
          });
          toast({
            variant: 'destructive',
            title: 'Membresía Expirada',
            description: data.error || 'Tu suscripción ha finalizado. Renueva tu acceso.',
            duration: 8000,
          });
          setIsLoading(false);
          return;
        }

        setAccountAlert(null);
        throw new Error(data.error || 'Clave de acceso o correo incorrectos.');
      }

      setAccountAlert(null);

      try {
        if (rememberMe) {
          localStorage.setItem('afinapp_remembered_username', cleanUsername);
        } else {
          localStorage.removeItem('afinapp_remembered_username');
        }
      } catch {}

      toast({
        variant: 'accent',
        title: 'Acceso Concedido',
        description: 'Iniciando sesión en la academia...',
        duration: 3000,
      });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      setWrong(false);
      requestAnimationFrame(() => {
        setWrong(true);
        wrongTimer.current = setTimeout(() => setWrong(false), 4000);
      });
      toast({
        variant: 'destructive',
        title: 'Error de Acceso',
        description: err.message || 'Credenciales incorrectas o licencia expirada.',
      });
      setIsLoading(false);
    }
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#4648D4] select-none cursor-pointer p-4 transition-opacity duration-300"
          style={{ touchAction: 'none' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismissSplash();
            }}
            className="px-8 py-4 sm:px-10 sm:py-5 rounded-full font-extrabold text-lg sm:text-xl bg-[#6CF8BB] hover:bg-[#5ae6aa] text-[#004D32] shadow-[0_12px_36px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer tracking-wide"
          >
            Toca aquí
          </button>
        </div>
      )}

      {/* Motor de cielo animado con ciclo de día dinámico aleatorio (~7s por fase) */}
      <AnimatedSkyBackground
        theme="unit4"
        cloudSpeed={0.8}
        dynamicDayCycle={true}
        cycleDuration={7.0}
        randomizeDuration={true}
      />

      {/* Velo atmosférico sutil */}
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
        <div
          className={`min-w-0 relative flex flex-col justify-end items-center bg-[#e9e9e9] p-1.5 pb-8 sm:p-10 border-r border-slate-200 overflow-visible touch-none overscroll-none pointer-events-none transition-[z-index] duration-0 ${
            blobsReady ? 'z-30' : 'z-10'
          }`}
        >
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
                rememberChecked={rememberMe}
                onReady={setBlobsReady}
                className="w-full max-w-[560px]"
              />
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* LADO DERECHO: Formulario de Acceso con Glassmorfismo */}
        {/* ================================================== */}
        <div className="min-w-0 relative flex flex-col justify-center px-4 py-4 sm:py-14 sm:px-14 bg-white/40 backdrop-blur-2xl backdrop-saturate-[80%] z-20 border-l border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] overflow-hidden touch-none overscroll-none">
          <div
            className={`max-w-[340px] sm:max-w-[360px] mx-auto w-full ${
              isFieldFocused ? 'space-y-2.5 sm:space-y-5' : 'space-y-4 sm:space-y-5'
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

            {/* Banner Informativo de Bloqueo o Expiración */}
            {accountAlert && (
              <div
                className={`p-3 sm:p-4 rounded-2xl border text-left space-y-2.5 animate-in fade-in duration-200 shadow-md ${
                  accountAlert.type === 'blocked'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-950 dark:text-rose-100'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    accountAlert.type === 'blocked'
                      ? 'text-rose-800 dark:text-rose-300'
                      : 'text-amber-800 dark:text-amber-300'
                  }`}>
                    {accountAlert.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAccountAlert(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 p-0.5"
                  >
                    ✕
                  </button>
                </div>
                <p className={`text-xs leading-relaxed font-bold ${
                  accountAlert.type === 'blocked'
                    ? 'text-rose-900 dark:text-rose-200'
                    : 'text-amber-950 dark:text-amber-200'
                }`}>
                  {accountAlert.message}
                </p>
                {accountAlert.whatsappUrl && (
                  <a
                    href={accountAlert.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] sm:text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Contactar a la Academia por WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className={`${isFieldFocused ? 'space-y-2 sm:space-y-5 pt-0.5 sm:pt-1' : 'space-y-3 sm:space-y-5 pt-1 sm:pt-2'}`}>
              {/* Campo Email */}
              <div className="space-y-0.5 sm:space-y-1">
                <label htmlFor="static-email" className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Correo
                </label>
                <div className="relative">
                  <input
                    id="static-email"
                    name="email"
                    autoComplete="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleInputFocus('email')}
                    onBlur={() => handleInputBlur('email')}
                    disabled={isLoading}
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
                    name="password"
                    autoComplete="current-password"
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
                    disabled={isLoading}
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

              {/* Opción de recordar sesión */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-slate-400 bg-transparent text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 sm:h-4 sm:w-4 accent-slate-900 cursor-pointer"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-600 font-medium">Recordarme</span>
                </label>
              </div>

              {/* Botón Primario: Iniciar sesión */}
              <button
                type="submit"
                disabled={isLoading}
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
                onFocus={() => setSubmitHovered(true)}
                onBlur={() => setSubmitHovered(false)}
                className="w-full h-10 sm:h-12 rounded-full font-bold bg-[#111827] hover:bg-black text-white text-xs sm:text-base shadow-sm active:scale-[0.99] transition-all mt-2 sm:mt-3 whitespace-nowrap px-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </form>

            {/* Pie de registro */}
            <div className="text-center pt-1 sm:pt-3">
              <p className="text-[11px] sm:text-sm text-slate-500 font-normal leading-snug">
                ¿No tienes una cuenta?{' '}
                <a
                  href={REGISTRATION_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
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
