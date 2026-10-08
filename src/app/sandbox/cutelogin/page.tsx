'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CuteCharactersStatic } from '@/components/sandbox/CuteCharactersStatic';

/**
 * Sandbox Cute Login - Fase 1: Diseno Plano y Estatico
 * Recreacion 1:1 de los 4 personajes y el formulario del video
 * con animacion de entrada escalonada por personaje.
 */
export default function CuteLoginPage() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [wrong, setWrong] = useState(false);
  const wrongTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setWrong(true);
    wrongTimer.current = setTimeout(() => setWrong(false), 4000);
  };

  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center bg-[#e5e9ee] p-2.5 sm:p-6 lg:p-8 select-none overflow-y-auto">
      {/* Contenedor Split Card principal: horizontal 50/50 notable tanto en movil como en desktop */}
      <div className="w-full max-w-[960px] min-h-[490px] sm:min-h-[580px] rounded-[28px] sm:rounded-[36px] bg-white shadow-[0_25px_60px_rgba(15,23,42,0.18)] overflow-hidden grid grid-cols-2 border border-slate-200/60 my-auto">
        {/* ========================================================= */}
        {/* LADO IZQUIERDO: Escenario de los 4 Personajes (50% Split) */}
        {/* ========================================================= */}
        <div className="relative flex flex-col justify-end items-center bg-[#e9e9e9] p-2 sm:p-10 border-r border-slate-200 overflow-hidden">
          <div className="w-full flex items-end justify-center pb-1">
            <CuteCharactersStatic
              excited={emailFocused}
              shy={passwordFocused}
              reveal={showPassword}
              error={wrong}
              typing={emailFocused && email.length > 0}
              typingProgress={Math.min(email.length / 7, 1)}
              className="w-full max-w-[420px]"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* LADO DERECHO: Formulario de Acceso Minimalista (50% Split) */}
        {/* ========================================================= */}
        <div className="flex flex-col justify-center px-4 py-5 sm:px-14 sm:py-14 bg-white overflow-hidden">
          <div className="max-w-[340px] mx-auto w-full space-y-3 sm:space-y-6">
            {/* Isotipo de marca geometrico */}
            <div className="flex justify-start">
              <svg className="w-7 h-7 sm:w-[34px] sm:h-[34px]" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 2L31 10.5V23.5L17 32L3 23.5V10.5L17 2Z" fill="#111827" />
                <path d="M17 5L28 11.5L17 18L6 11.5L17 5Z" fill="#ffffff" fillOpacity="0.9" />
                <path d="M17 18L28 11.5V22.5L17 29V18Z" fill="#1f2937" />
                <path d="M6 11.5L17 18V29L6 22.5V11.5Z" fill="#111827" />
              </svg>
            </div>

            {/* Titulares principales */}
            <div className="space-y-1 sm:space-y-1.5 text-left">
              <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-[#111827] leading-tight">
                Welcome back!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-tight">
                Please enter your details
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-5 pt-1">
              {/* Campo Email */}
              <div className="space-y-1">
                <label htmlFor="static-email" className="block text-xs font-semibold text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="static-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder=""
                    className="w-full bg-transparent border-b border-slate-300 py-1.5 sm:py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="space-y-1">
                <label htmlFor="static-password" className="block text-xs font-semibold text-slate-700">
                  Password
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
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder=""
                    className="w-full bg-transparent border-b border-slate-300 py-1.5 sm:py-2 pr-7 sm:pr-8 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 text-slate-500 hover:text-slate-900 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Fila Remember me / Forgot password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs pt-0.5 gap-1.5 sm:gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
                  />
                  <span className="truncate">Remember me</span>
                </label>
                <a href="#forgot" className="text-slate-500 hover:text-slate-900 transition-colors truncate">
                  Forgot password?
                </a>
              </div>

              {/* Boton Primario: Log in (negro redondeado) */}
              <button
                type="submit"
                className="w-full h-10 sm:h-11 rounded-full font-bold bg-[#111827] hover:bg-black text-white text-xs sm:text-sm shadow-sm active:scale-[0.99] transition-all mt-2 sm:mt-3"
              >
                Log in
              </button>

              {/* Boton Secundario: Log in with Google */}
              <button
                type="button"
                className="w-full h-9 sm:h-11 rounded-full font-semibold border border-slate-200 bg-[#f9fafb] hover:bg-slate-100 text-slate-700 text-xs flex items-center justify-center gap-2 shadow-none transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span className="truncate">Log in with Google</span>
              </button>
            </form>

            {/* Pie de registro */}
            <div className="text-center pt-1 sm:pt-3">
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Don't have an account?{' '}
                <a href="#signup" className="font-semibold text-slate-900 hover:underline">
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
