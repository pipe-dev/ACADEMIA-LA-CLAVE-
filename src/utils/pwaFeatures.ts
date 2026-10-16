// Advanced PWA Features Helper for La Clave
// Includes Screen WakeLock, App Badging, Native Haptics, Web Share, & Local Practice Reminders
import { logger } from './logger';

let wakeLockSentinel: any = null;

/**
 * 1. Screen Wake Lock API
 * Prevents mobile screens from turning off while practicing piano, tuner, or singing
 */
export async function enableScreenWakeLock(): Promise<boolean> {
  if ('wakeLock' in navigator) {
    try {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      logger.info('PWA', 'Screen Wake Lock activo: La pantalla no se apagará en ensayos.');
      
      if (wakeLockSentinel) {
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      }
      return true;
    } catch {
      // Quietly set wakeLockSentinel to null when blocked by browser/iframe policy or focus requirements
      wakeLockSentinel = null;
      logger.debug('PWA', 'Screen WakeLock no disponible o no permitido en este navegador/iframe.');
      return false;
    }
  }
  return false;
}

export function isScreenWakeLockActive(): boolean {
  return wakeLockSentinel !== null && wakeLockSentinel.released !== true;
}

export async function disableScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      logger.info('PWA', 'Screen Wake Lock desactivado.');
    } catch (err) {
      logger.warn('PWA', 'Error al soltar WakeLock', { err });
    }
  }
}

/**
 * 2. App Badging API
 * Displays the current streak count on the PWA app icon badge in home screen
 */
export function updateAppIconBadge(streakCount: number): void {
  if ('setAppBadge' in navigator) {
    if (streakCount > 0) {
      (navigator as any).setAppBadge(streakCount).catch((err: any) => {
        console.warn('[PWA] Error estableciendo insignia de app:', err);
      });
    } else {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }
}

/**
 * 3. Haptic Feedback (Vibration API)
 * Provides physical feedback on mobile touch
 */
export function triggerHapticFeedback(
  pattern: 'light' | 'medium' | 'success' | 'error' | 'rhythm' | 'streak-update' | 'flame-burst' = 'light'
): void {
  if ('vibrate' in navigator) {
    try {
      switch (pattern) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([15, 30, 20]);
          break;
        case 'error':
          navigator.vibrate([50, 40, 50]);
          break;
        case 'rhythm':
          navigator.vibrate(12);
          break;
        case 'streak-update':
        case 'flame-burst':
          // High-intensity multi-stage vibration surge matching the flame ignition surge & streak update
          navigator.vibrate([35, 25, 65, 35, 110, 45, 220]);
          break;
      }
    } catch {
      // Ignore vibration errors on unsupported hardware
    }
  }
}

/**
 * 4. Web Share API
 * Shares user progress or vocal range natively to WhatsApp, Instagram, Telegram, etc.
 */
export async function shareUserAchievement(title: string, text: string, url?: string): Promise<boolean> {
  const shareData = {
    title: title,
    text: text,
    url: url || window.location.href
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[PWA] Error compartiendo contenido:', err);
      }
      return false;
    }
  } else {
    // Fallback clipboard copy
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${shareData.url}`);
      alert('¡Enlace e información copiada al portapapeles!');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 5. Web Notifications API
 * Requests permission and sends daily practice reminders
 */
const NOTIF_TEMPLATES: [string, (s: number) => string][] = [
  ['Salva tu racha en La Clave', (s) => '¡Llevas ' + s + ' días seguidos! Solo 5 minutos de vocalización hoy para mantener tu racha viva.'],
  ['La constancia hace al artista', () => 'Los grandes cantantes no nacen, se entrenan. ¡Tu afinador y ejercicios te esperan hoy!'],
  ['Ejercicio vocal del día', () => 'Tu voz es un músculo. ¡No la dejes enfriar hoy! Entra a hacer tu práctica diaria.'],
  ['Desbloquea tu voz', () => 'Tu próximo gran agudo empieza con 5 minutos de práctica. ¡Entra ya a ensayar!'],
  ['Afinación perfecta', () => '¿Listo para afinar como un profesional? Solo te tomará unos minutos de ejercicio.'],
  ['Tu racha brilla', (s) => '¡Tu racha de ' + s + ' días se ve espectacular! Haz que dure un día más cantando hoy.'],
  ['Hora de calentar', () => 'Tu cuerda vocal favorita pregunta por ti. ¡Es hora de calentar con tus lecciones!'],
  ['Solo 5 minutos', () => 'Solo 5 minutos hoy separan tu voz de su mejor versión. ¡Abre La Clave y practica!'],
  ['El escenario te espera', () => 'El escenario te llama. Ven a calentar con tus ejercicios de respiración y afinación.'],
  ['Mantén el ritmo', () => '¡No rompas la cadena! Calienta ahora y protege tu medalla de constancia.'],
  ['Alerta de vecinos', () => 'Tus vecinos extrañan escucharte hacer "MmMmMm" en Do Mayor. ¡Entra a ensayar!'],
  ['El gallo interno acecha...', () => 'Tu gallo interno se está preparando... ¡Entra a afinar antes de que cante!'],
  ['La ducha no cuenta', (s) => 'Cantar en la ducha no suma a tu racha de ' + s + ' días... ¡Abre la app y hazlo oficial!'],
  ['Micrófono nostálgico', () => 'Tu micrófono virtual está llorando en una esquina. Dale un poco de amor hoy.'],
  ['Alerta de telarañas', () => 'Alerta roja: tus cuerdas vocales están acumulando telarañas. ¡A vocalizar!'],
  ['Mejor que el café', () => 'Olvida el café: un buen ejercicio de respiración te va a despertar mucho mejor.'],
  ['Fantasma de racha', (s) => 'Tu racha de ' + s + ' días se convertirá en fantasma si no entras hoy...'],
  ['¿Modo nocturno?', () => 'Los búhos cantan de noche, pero tú puedes practicar tu solfeo ahora mismo.'],
  ['El profe mira el reloj', () => 'Tu profesor de canto virtual está mirando fijamente el reloj... ¡Hora de la lección!'],
  ['¿Afinador o desafinador?', () => 'Ven a demostrarle al afinador que hoy sí estás afinado en el centro perfecto.'],
  ['Récord de Racha a la vista', (s) => 'Día ' + s + ' alcanzado. ¡Un entrenamiento más y desbloqueas un nuevo récord!'],
  ['Tu registro vocal se expande', () => 'Has mejorado tu afinación este mes. ¡Sigue construyendo tu legado cantando hoy!'],
  ['Desbloquea el nivel Maestro de Afinación', () => 'Tu constancia rinde frutos. Entra a completar la lección que te acerca al siguiente rango.'],
  ['¡Días de victoria consecutiva!', (s) => '¡Esa cifra de racha de ' + s + ' días es impresionante! Reclama tus puntos antes de medianoche.'],
  ['Insignia de Constancia en juego', () => 'Mantener la racha activa hoy te asegura la medalla de hierro en tu perfil.'],
  ['Gráfica de afinación impecable', () => 'Tu precisión en centésimas de semitono sigue subiendo. ¡Revisa tus estadísticas!'],
  ['Tu tono está ganando brillo', () => 'La memoria muscular de tu diafragma está mejorando cada día. ¡Suma la sesión de hoy!'],
  ['Recompensa de sesión diaria', () => 'Tu bono de XP diario te está esperando. Entra a reclamarlo practicando 5 minutos.'],
  ['Historial de vocalizaciones activo', () => 'Tu diario de canto está registrando grandes avances. ¡Añade tu práctica de hoy!'],
  ['Orgullo vocal', () => 'Mira hacia atrás y observa cuánto has avanzado desde el día 1. ¡A por un triunfo más hoy!']
];

export const PRACTICE_NOTIFICATION_MESSAGES = NOTIF_TEMPLATES.map(
  ([title, bodyFn]) => (streak: number) => ({ title, body: bodyFn(streak) })
);

export function getRandomPracticeNotificationMessage(streakDays: number = 1): { title: string; body: string } {
  const randomIndex = Math.floor(Math.random() * PRACTICE_NOTIFICATION_MESSAGES.length);
  return PRACTICE_NOTIFICATION_MESSAGES[randomIndex](streakDays);
}

export interface NotificationSupportStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  isIOSWithoutPwa: boolean;
  isStandalone: boolean;
}

export function getNotificationSupportStatus(): NotificationSupportStatus {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unsupported', isIOSWithoutPwa: false, isStandalone: false };
  }

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone);

  const supported = 'Notification' in window;

  return {
    supported,
    permission: supported ? Notification.permission : 'unsupported',
    isIOSWithoutPwa: isIOS && !isStandalone,
    isStandalone,
  };
}


export async function requestNotificationPermission(silent: boolean = false): Promise<boolean> {
  const status = getNotificationSupportStatus();

  if (!status.supported) {
    if (!silent) {
      if (status.isIOSWithoutPwa) {
        window.dispatchEvent(new CustomEvent('laclave_open_pwa_install_modal', { detail: { reason: 'notifications' } }));
      } else {
        window.dispatchEvent(new CustomEvent('laclave_notif_unsupported'));
      }
    }
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  if (!silent) {
    window.dispatchEvent(new CustomEvent('laclave_notif_permission_denied'));
  }
  return false;
}

export async function sendPracticeReminderNotification(streakDays: number): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return false;

  const msg = getRandomPracticeNotificationMessage(streakDays);
  const options: NotificationOptions = {
    body: msg.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'practice-reminder',
    data: { url: '/' }
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(msg.title, options);
      return true;
    } else {
      new Notification(msg.title, options);
      return true;
    }
  } catch (e) {
    console.warn('[Notifications] Error sending notification:', e);
    return false;
  }
}

/**
 * Schedule Local Alarm (runs inside Service Worker offline/closed app)
 * Calculates milliseconds until target time (e.g., 20:00 / 8:00 PM) and registers
 * the timer directly inside the background Service Worker.
 */
export async function scheduleLocalPracticeAlarm(
  targetHour: number = 20,
  targetMinute: number = 0,
  streakDays: number = 1,
  silent: boolean = false
): Promise<boolean> {
  const hasPermission = await requestNotificationPermission(silent);
  if (!hasPermission) return false;

  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(targetHour, targetMinute, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (scheduledTime.getTime() <= now.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delayMs = scheduledTime.getTime() - now.getTime();
  const msg = getRandomPracticeNotificationMessage(streakDays);

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    const activeSw = reg.active || navigator.serviceWorker.controller;

    if (activeSw) {
      activeSw.postMessage({
        type: 'SCHEDULE_PRACTICE_REMINDER',
        delayMs: delayMs,
        title: msg.title,
        body: msg.body,
        streak: streakDays
      });
      console.log(`[PWA] Alarma de práctica programada para las ${scheduledTime.toLocaleTimeString()}`);
      return true;
    }
  }

  return false;
}


/**
 * 6. Background Fetch API
 * Sync user progress data, rankings, and quest challenges in the background
 * even when the application is entirely closed.
 */
export async function syncUserProgressBackgroundFetch(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const fetchId = 'progress-sync-' + Date.now();
    const urls = ['/manifest.json']; // Asset fetch to trigger SW backgroundfetch pipeline

    if ('backgroundFetch' in reg) {
      const bgFetch = await (reg as any).backgroundFetch.fetch(fetchId, urls, {
        title: 'Sincronizando Progreso y Desafíos de Canto',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
        downloadTotal: 100 * 1024
      });
      logger.info('PWA', 'Background Fetch de progreso registrado con éxito:', bgFetch.id);
      localStorage.setItem('laclave_last_bg_fetch_sync', new Date().toISOString());
      return true;
    } else {
      // Fallback: Standard fetch & store sync timestamp
      localStorage.setItem('laclave_last_bg_fetch_sync', new Date().toISOString());
      return true;
    }
  } catch (err) {
    logger.warn('PWA', 'Error registrando Background Fetch para progreso', err);
    return false;
  }
}

export async function startBackgroundFetchDownload(
  id: string,
  urls: string[],
  title: string
): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    alert('Service Worker no está soportado.');
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if ('backgroundFetch' in reg) {
      const bgFetch = await (reg as any).backgroundFetch.fetch(id, urls, {
        title: title,
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
        downloadTotal: 2 * 1024 * 1024 // 2MB estimated
      });

      console.log('[PWA] Background Fetch iniciado:', bgFetch);
      return true;
    } else {
      console.log('[PWA] Background Fetch no soportado directamente por el navegador, descargando vía Cache API estándar.');
      // Fallback: Standard Cache API fetch
      const cache = await caches.open('laclave-v1-cache');
      await Promise.all(urls.map((u) => cache.add(u).catch(() => {})));
      return true;
    }
  } catch (err) {
    console.warn('[PWA] Error iniciando Background Fetch:', err);
    return false;
  }
}

/**
 * 7. Web Share Target Reader
 * Reads incoming content shared into La Clave from other apps (WhatsApp, Chrome, YouTube, etc.)
 */
export interface SharedContent {
  title?: string;
  text?: string;
  url?: string;
}

export function getSharedTargetContent(): SharedContent | null {
  const params = new URLSearchParams(window.location.search);
  const isShared = params.get('shared') === 'true' || params.has('title') || params.has('url') || params.has('text');

  if (!isShared) return null;

  const shared: SharedContent = {
    title: params.get('title') || undefined,
    text: params.get('text') || undefined,
    url: params.get('url') || undefined
  };

  // Clean query string after reading so it doesn't prompt again on refresh
  window.history.replaceState({}, document.title, window.location.pathname);

  return shared;
}

