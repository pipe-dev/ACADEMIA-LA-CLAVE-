"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOTAL_LOTES = 600;
const DELAY_MS = 60000; // 60 segundos entre cada lote para no romper el servidor

export default function AdminNotificaciones() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentLote, setCurrentLote] = useState(0);
  const { toast } = useToast();
  
  // Usamos useRef para mantener el estado actual dentro del setInterval
  const isSendingRef = useRef(isSending);
  const currentLoteRef = useRef(currentLote);

  useEffect(() => {
    isSendingRef.current = isSending;
    currentLoteRef.current = currentLote;
  }, [isSending, currentLote]);

  const iniciarCampana = async () => {
    if (!title || !body) {
      toast({ title: "Error", description: "El título y el mensaje son obligatorios.", variant: "destructive" });
      return;
    }

    if (confirm(`¿Estás seguro de lanzar la campaña MASIVA (El Cartero Inmortal)?\n\nEsto enviará la notificación a los ${TOTAL_LOTES} lotes en segundo plano.\nTardará aproximadamente ${TOTAL_LOTES} minutos en terminar.\n\n✅ Podrás cerrar esta pestaña o apagar tu PC apenas termine de cargar.`)) {
      setIsSending(true);
      try {
        const response = await fetch("/api/notifications/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body })
        });
        
        if (response.ok) {
          toast({
            title: "¡El Cron Job ha comenzado! 🎉",
            description: "La campaña se está enviando en segundo plano. Puedes cerrar esta ventana.",
          });
          setTitle("");
          setBody("");
        } else {
          toast({ title: "Error", description: "Falló la conexión con Google Sheets.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Fallo de red.", variant: "destructive" });
      } finally {
        setIsSending(false);
      }
    }
  };

  const enviarInstantaneo = async () => {
    if (!title || !body) {
      toast({ title: "Error", description: "El título y el mensaje son obligatorios.", variant: "destructive" });
      return;
    }

    if (confirm(`¿Lanzar Envío Instantáneo?\n\nEsto enviará el mensaje inmediatamente a TODOS los usuarios a la vez.\n\n⚠️ Úsalo solo si tienes pocos usuarios, si tienes cientos de miles podría tumbar tus servidores cuando abran la app.`)) {
      setIsSending(true);
      try {
        const response = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, lote: 'ALL' })
        });
        
        if (response.ok) {
          toast({
            title: "¡Enviado!",
            description: "Notificación instantánea enviada con éxito.",
          });
        } else {
          toast({ title: "Error", description: "Falló el envío instantáneo.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Fallo de red.", variant: "destructive" });
      } finally {
        setIsSending(false);
      }
    }
  };

  const enviarLote = async (loteTarget: number) => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, lote: loteTarget })
      });
      
      if (!response.ok) {
        console.error(`Error enviando al lote ${loteTarget}`);
      }
    } catch (err) {
      console.error(`Fallo de red en lote ${loteTarget}`, err);
    }
  };

  // (Se eliminó el useEffect con el setInterval porque ahora el bucle lo hace Google Apps Script)

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-xl glass-panel border-white/10 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Lanzador de Campañas</CardTitle>
              <CardDescription className="text-slate-400">
                Sistema de "Goteo Extremo" para {TOTAL_LOTES} lotes
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isSending && currentLote === 0 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Título de la Notificación</label>
                <Input 
                  placeholder="Ej: ¡Nueva clase de canto disponible!" 
                  className="bg-black/50 border-white/10 text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mensaje</label>
                <Textarea 
                  placeholder="Ej: Entra ahora y descubre los nuevos ejercicios para afinar tu voz..." 
                  className="bg-black/50 border-white/10 text-white min-h-[100px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-200 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                  Tienes dos opciones de envío. Usa el <strong>Instantáneo</strong> para tus primeros usuarios (testing). Usa el <strong>Goteo Extremo</strong> cuando la app sea viral (cientos de miles) y <strong>podrás cerrar la pestaña sin problema</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={enviarInstantaneo} 
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-md rounded-xl flex flex-col gap-1 h-auto"
                >
                  <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Envío Instantáneo</span>
                  <span className="text-xs font-normal opacity-80">(Para fase Beta / Pocos usuarios)</span>
                </Button>

                <Button 
                  onClick={iniciarCampana} 
                  disabled={isSending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-md rounded-xl flex flex-col gap-1 h-auto"
                >
                  <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Goteo Extremo (Automático)</span>
                  <span className="text-xs font-normal opacity-80">(100% Segundo Plano)</span>
                </Button>
              </div>
            </>
          )}

          {/* Progreso del envío local eliminado ya que ahora es asíncrono */}
        </CardContent>
      </Card>
    </div>
  );
}
