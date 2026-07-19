'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, User, Loader2, Play } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !key.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Por favor, ingresa tu usuario y código de acceso.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, key }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      toast({
        variant: 'accent',
        title: '¡Acceso Concedido!',
        description: 'Iniciando sesión en la academia...',
        duration: 3000,
      });

      router.push('/clases');
      router.refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Acceso',
        description: err.message || 'Credenciales incorrectas o licencia expirada.',
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-yellow-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10 animate-in fade-in-50 slide-in-from-bottom duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-yellow-300">
            AfinApp
          </h1>
          <p className="text-sm sm:text-base text-emerald-200/60 font-medium max-w-xs mx-auto">
            Desbloquea tu potencial vocal y afina tu voz con precisión clínica.
          </p>
        </div>

        <Card className="bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)] rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-black text-center text-white">Ingreso a la Academia</CardTitle>
            <CardDescription className="text-center text-xs text-muted-foreground">
              Ingresa tus datos para verificar tu suscripción mensual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Usuario (Estudiante)
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="ejemplo@correo.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 bg-slate-950/60 border-white/10 rounded-2xl h-12 focus-visible:ring-emerald-500 text-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Código de Acceso
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="key"
                    type="password"
                    placeholder="Ingresa tu clave de acceso"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 bg-slate-950/60 border-white/10 rounded-2xl h-12 focus-visible:ring-emerald-500 text-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validando licencia...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Ingresar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
