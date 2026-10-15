'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, User, Loader2, Play, Eye, EyeOff, Cloud, Sun } from 'lucide-react';
import { AnimatedSkyBackground, SkyTheme } from '@/components/sandbox/AnimatedSkyBackground';

/**
 * Sandbox Login Page
 * Prototipado con el motor de cielo animado de las cinematicas de la Unidad 1 y Unidad 4.
 */
export default function SandboxLoginPage() {
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [skyTheme, setSkyTheme] = useState<SkyTheme>('unit4');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('afinapp_remembered_username');
      if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true);
      }
    } catch {
      // Ignorar restricciones en entornos aislados
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanKey = key.trim();

    if (!cleanUsername || !cleanKey) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Ingresa tu usuario y clave de acceso.',
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
        throw new Error(data.error || 'Credenciales invalidas');
      }

      try {
        if (rememberMe) {
          localStorage.setItem('afinapp_remembered_username', cleanUsername);
        } else {
          localStorage.removeItem('afinapp_remembered_username');
        }
      } catch {
        // Continuar si localStorage falla
      }

      toast({
        variant: 'accent',
        title: 'Acceso Concedido',
        description: 'Autenticacion correcta.',
      });

      router.push('/');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Acceso',
        description: err.message || 'Error al validar las credenciales.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Motor de cielo animado con nubes y particulas ascendentes (Unidad 1 y Unidad 4) */}
      <AnimatedSkyBackground theme={skyTheme} />

      {/* Selector superior para alternar entre el cielo de Unidad 4 y Unidad 1 */}
      <div className="relative z-20 mb-6 flex items-center gap-2 p-1.5 rounded-full bg-slate-950/40 backdrop-blur-md border border-white/20 shadow-lg">
        <button
          type="button"
          onClick={() => setSkyTheme('unit4')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            skyTheme === 'unit4'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Cielo Unidad 4 (Azul)</span>
        </button>
        <button
          type="button"
          onClick={() => setSkyTheme('unit1')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            skyTheme === 'unit1'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Cielo Unidad 1 (Dorado)</span>
        </button>
      </div>

      {/* Contenedor de la tarjeta de inicio de sesion con vidrio esmerilado */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-950/45 backdrop-blur-2xl border border-white/25 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] text-white space-y-6 animate-in fade-in-50 duration-500">
        <div className="text-center space-y-1.5">
          <p className="text-[10px] uppercase font-bold tracking-widest text-sky-300">
            Sandbox Login - Escenario Cinemático
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            Ingreso a AfinApp
          </h1>
          <p className="text-xs text-slate-200/80 max-w-xs mx-auto">
            Personaliza aqui tu experiencia visual con el cielo cinemático en tiempo real.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sandbox-user" className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-300" />
              <Input
                id="sandbox-user"
                type="text"
                autoComplete="username"
                placeholder="ejemplo@correo.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-slate-950/60 border-white/20 text-white placeholder:text-slate-400 rounded-2xl h-12 text-sm focus-visible:ring-sky-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sandbox-key" className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Clave de Acceso
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-300" />
              <Input
                id="sandbox-key"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ingresa tu clave de alumno"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isLoading}
                className="pl-10 pr-11 bg-slate-950/60 border-white/20 text-white placeholder:text-slate-400 rounded-2xl h-12 text-sm focus-visible:ring-sky-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-200 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-sky-400 focus:ring-sky-400 h-4 w-4 accent-sky-500"
              />
              <span>Recordar usuario en este equipo</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
