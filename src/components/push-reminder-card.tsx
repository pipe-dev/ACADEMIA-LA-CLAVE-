'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PushReminderCard() {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Tag user in OneSignal for daily reminder journey
        if (typeof window !== 'undefined' && (window as any).OneSignal) {
          try {
            await (window as any).OneSignal.User.addTag('daily_reminder', 'true');
          } catch (e) {
            console.warn('OneSignal tag failed', e);
          }
        }
        // Show a test notification
        new Notification('🔥 ¡Recordatorios Activados!', {
          body: 'Te avisaremos todos los días para que no pierdas tu racha de práctica.',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.error('Notification permission request failed', e);
    }
    setLoading(false);
  };

  if (permission === 'denied') return null;

  return (
    <Card className={cn(
      "overflow-hidden border-0 transition-all",
      permission === 'granted'
        ? "bg-gradient-to-r from-emerald-400/10 to-emerald-600/5"
        : "bg-gradient-to-r from-amber-400/10 to-orange-500/5"
    )}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          permission === 'granted' ? "bg-emerald-500/20" : "bg-amber-500/20"
        )}>
          {permission === 'granted'
            ? <Check className="w-5 h-5 text-emerald-500" />
            : <Bell className="w-5 h-5 text-amber-500" />
          }
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-bold">
            {permission === 'granted' ? 'Recordatorios Activos' : 'Recordatorio de Práctica'}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
            {permission === 'granted'
              ? 'Te avisaremos diariamente para mantener tu racha.'
              : 'Actívalos y no pierdas tu racha de afinación.'}
          </p>
        </div>
        {permission !== 'granted' && (
          <Button
            onClick={handleEnable}
            size="sm"
            disabled={loading}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
          >
            {loading ? '...' : 'Activar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
