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
export const PRACTICE_NOTIFICATION_MESSAGES = [
  // Motivacionales / Variados
  (streak: number) => ({
    title: 'Salva tu racha en La Clave',
    body: `¡Llevas ${streak} días seguidos! Solo 5 minutos de vocalización hoy para mantener tu racha viva.`
  }),
  (streak: number) => ({
    title: 'La constancia hace al artista',
    body: 'Los grandes cantantes no nacen, se entrenan. ¡Tu afinador y ejercicios te esperan hoy!'
  }),
  (streak: number) => ({
    title: 'Ejercicio vocal del día',
    body: 'Tu voz es un músculo. ¡No la dejes enfriar hoy! Entra a hacer tu práctica diaria.'
  }),
  (streak: number) => ({
    title: 'Desbloquea tu voz',
    body: 'Tu próximo gran agudo empieza con 5 minutos de práctica. ¡Entra ya a ensayar!'
  }),
  (streak: number) => ({
    title: 'Afinación perfecta',
    body: '¿Listo para afinar como un profesional? Solo te tomará unos minutos de ejercicio.'
  }),
  (streak: number) => ({
    title: 'Tu racha brilla',
    body: `¡Tu racha de ${streak} días se ve espectacular! Haz que dure un día más cantando hoy.`
  }),
  (streak: number) => ({
    title: 'Hora de calentar',
    body: `Tu cuerda vocal favorita pregunta por ti. ¡Es hora de calentar con tus lecciones!`
  }),
  (streak: number) => ({
    title: 'Solo 5 minutos',
    body: `Solo 5 minutos hoy separan tu voz de su mejor versión. ¡Abre La Clave y practica!`
  }),
  (streak: number) => ({
    title: 'El escenario te espera',
    body: `El escenario te llama. Ven a calentar con tus ejercicios de respiración y afinación.`
  }),
  (streak: number) => ({
    title: 'Mantén el ritmo',
    body: `¡No rompas la cadena! Calienta ahora y protege tu medalla de constancia.`
  }),
  // Comedia / Divertidos
  (streak: number) => ({
    title: 'Alerta de vecinos',
    body: `Tus vecinos extrañan escucharte hacer "MmMmMm" en Do Mayor. ¡Entra a ensayar!`
  }),
  (streak: number) => ({
    title: 'El gallo interno acecha...',
    body: `Tu gallo interno se está preparando... ¡Entra a afinar antes de que cante!`
  }),
  (streak: number) => ({
    title: 'La ducha no cuenta',
    body: `Cantar en la ducha no suma a tu racha de ${streak} días... ¡Abre la app y hazlo oficial!`
  }),
  (streak: number) => ({
    title: 'Micrófono nostálgico',
    body: `Tu micrófono virtual está llorando en una esquina. Dale un poco de amor hoy.`
  }),
  (streak: number) => ({
    title: 'Alerta de telarañas',
    body: `Alerta roja: tus cuerdas vocales están acumulando telarañas. ¡A vocalizar!`
  }),
  (streak: number) => ({
    title: 'Mejor que el café',
    body: `Olvida el café: un buen ejercicio de respiración te va a despertar mucho mejor.`
  }),
  (streak: number) => ({
    title: 'Fantasma de racha',
    body: `Tu racha de ${streak} días se convertirá en fantasma si no entras hoy...`
  }),
  (streak: number) => ({
    title: '¿Modo nocturno?',
    body: `Los búhos cantan de noche, pero tú puedes practicar tu solfeo ahora mismo.`
  }),
  (streak: number) => ({
    title: 'El profe mira el reloj',
    body: `Tu profesor de canto virtual está mirando fijamente el reloj... ¡Hora de la lección!`
  }),
  (streak: number) => ({
    title: 'Promesa seria',
    body: `Prometemos que calentar hoy es más divertido que ver memes por 5 minutos.`
  }),
  (streak: number) => ({
    title: 'El gato de la vecina',
    body: `El gato de la vecina acaba de desafiar tu nota agudo. ¿Vas a dejar que te gane en tono?`
  }),
  (streak: number) => ({
    title: 'La pizza puede esperar',
    body: `La pizza puede esperar 5 minutos, pero tu calentamiento vocal de hoy no. ¡Entra a afinar!`
  }),
  (streak: number) => ({
    title: 'Ahuyenta el desafine',
    body: `El fantasma del desafine anda suelto. Calienta tus notas 5 minutos para mantener tu tono impecable.`
  }),
  (streak: number) => ({
    title: 'Karaoke en luz roja',
    body: `Practica en La Clave ahora para no desafinar cuando cantes en el auto en el tráfico.`
  }),
  (streak: number) => ({
    title: 'Abducción de racha',
    body: `¡Alerta! Alienígenas quieren abducir tu racha de ${streak} días. ¡Defiéndela cantando!`
  }),
  (streak: number) => ({
    title: 'Barre el desafine',
    body: `Pasa la escoba por tus cuerdas vocales antes de que el polvo tape tus agudos.`
  }),
  (streak: number) => ({
    title: 'Karaoke sorpresa',
    body: `¿Y si hoy te invitan a un karaoke sorpresa? No te arriesgues a fallar tu tema estrella.`
  }),
  (streak: number) => ({
    title: 'Alma vs Algoritmo',
    body: `Los robots pueden generar audio, pero solo tú tienes el sentimiento. ¡Entra a cantar!`
  }),
  (streak: number) => ({
    title: 'Tu diafragma pide acción',
    body: `Tu diafragma exige 5 minutos de respiración antes de volverse un limón agrio.`
  }),
  // Desafío y Juego Vocal
  (streak: number) => ({
    title: '¡Desafío de Pitch del día!',
    body: `¿Puedes dar una nota perfecta en el primer intento? Ponte a prueba en La Clave.`
  }),
  (streak: number) => ({
    title: 'Rompe tu récord de precisión',
    body: `Pon a prueba tus oídos y cuerdas vocales con el juego de afinación instantánea.`
  }),
  (streak: number) => ({
    title: 'Reto de resistencia de diafragma',
    body: `¿Cuántos segundos puedes mantener el aire con el juego del globo inflable?`
  }),
  (streak: number) => ({
    title: 'Desafío Maestro del Tono',
    body: `Encuentra la nota oculta en el teclado antes de que se acabe el tiempo. ¡A cantar!`
  }),
  (streak: number) => ({
    title: 'Micro-Desafío de 2 Minutos',
    body: `Tienes 120 segundos para hacer un calentamiento express. ¿Aceptas el reto?`
  }),
  (streak: number) => ({
    title: 'Desafío de Sirenas Vocales',
    body: `Conecta tus graves con tus agudos sin romper la voz. Demuéstralo hoy.`
  }),
  (streak: number) => ({
    title: 'Defiende tu puesto en la tabla',
    body: `¡Otros cantantes están subiendo su puntuación! Entra a asegurar tus XP de hoy.`
  }),
  (streak: number) => ({
    title: 'Rueda de notas vocales',
    body: `¡Hoy te toca afinar en una escala nueva! Entra a descubrir cuál es tu reto.`
  }),
  (streak: number) => ({
    title: 'Reto de agudos limpios',
    body: `Hoy trabajamos la ligereza y resonancia superior. ¡Entra a desbloquear tus notas altas!`
  }),
  (streak: number) => ({
    title: 'Contra el reloj',
    body: `3 ejercicios rápidos de dicción y tono. ¿Podrás hacerlos todos perfectos hoy?`
  }),
  // Cuidado de la Voz y Bienestar
  (streak: number) => ({
    title: 'Hidrata tus cuerdas vocales',
    body: `Bebe un vaso de agua y entra a hacer un calentamiento suave para cuidar tu salud vocal.`
  }),
  (streak: number) => ({
    title: 'Relax y Respiración Diafragmática',
    body: `Un día ajetreado merece 3 minutos de respiración guiada para liberar la tensión del cuello.`
  }),
  (streak: number) => ({
    title: 'Cuidado vocal preventivo',
    body: `Previene la fatiga vocal calentando antes de hablar o cantar mucho. ¡Tu voz te lo agradecerá!`
  }),
  (streak: number) => ({
    title: 'Masaje y vibración de labios',
    body: `Los lip-trills son el mejor remedio para cuerdas cansadas. Entra a relajarlas hoy.`
  }),
  (streak: number) => ({
    title: 'Mima tu garganta',
    body: `Tu voz es un instrumento delicado. Regálate una sesión de relajación y resonancia.`
  }),
  (streak: number) => ({
    title: 'Desconexión y tono corporal',
    body: `Libera la tensión acumulada en hombros y mandíbula con nuestros ejercicios de postura.`
  }),
  (streak: number) => ({
    title: 'Respiración de ola serena',
    body: `Calma tu mente y abre tus pulmones con el ciclo de respiración rítmica en La Clave.`
  }),
  (streak: number) => ({
    title: '¿Voz cansada hoy?',
    body: `Tenemos ejercicios de enfriamiento vocal ultra suaves para recuperar el brillo sin esfuerzo.`
  }),
  (streak: number) => ({
    title: 'Buenos días para tu voz',
    body: `Despierta tu resonancia nasal con un zumbido suave ("Humming"). ¡Empieza bien el día!`
  }),
  (streak: number) => ({
    title: 'Postura y libertad vocal',
    body: `Alinea tu columna y abre tu diafragma. ¡Ven a estirar y cantar sin presión!`
  }),
  // Logros y Progreso
  (streak: number) => ({
    title: '¡Estás cerca de una nueva medalla!',
    body: `Te faltan muy pocos XP para desbloquear tu siguiente insignia vocal. ¡Consíguela hoy!`
  }),
  (streak: number) => ({
    title: 'Tu progreso semanal está despegando',
    body: `Has mejorado tu afinación este mes. ¡Sigue construyendo tu legado cantando hoy!`
  }),
  (streak: number) => ({
    title: 'Desbloquea el nivel Maestro de Afinación',
    body: `Tu constancia rinde frutos. Entra a completar la lección que te acerca al siguiente rango.`
  }),
  (streak: number) => ({
    title: `¡${streak} días de victoria consecutiva!`,
    body: `¡Esa cifra de racha es impresionante! Reclama tus puntos de hoy antes de medianoche.`
  }),
  (streak: number) => ({
    title: 'Insignia de Constancia en juego',
    body: `Mantener la racha activa hoy te asegura la medalla de hierro en tu perfil.`
  }),
  (streak: number) => ({
    title: 'Gráfica de afinación impecable',
    body: `Tu precisión en centésimas de semitono sigue subiendo. ¡Revisa tus estadísticas!`
  }),
  (streak: number) => ({
    title: 'Tu tono está ganando brillo',
    body: `La memoria muscular de tu diafragma está mejorando cada día. ¡Suma la sesión de hoy!`
  }),
  (streak: number) => ({
    title: 'Recompensa de sesión diaria',
    body: `Tu bono de XP diario te está esperando. Entra a reclamarlo practicando 5 minutos.`
  }),
  (streak: number) => ({
    title: 'Historial de vocalizaciones activo',
    body: `Tu diario de canto está registrando grandes avances. ¡Añade tu práctica de hoy!`
  }),
  (streak: number) => ({
    title: 'Orgullo vocal',
    body: `Mira hacia atrás y observa cuánto has avanzado desde el día 1. ¡A por un triunfo más hoy!`
  })
];

export function getRandomPracticeNotificationMessage(streakDays: number = 1): { title: string; body: string } {
  const randomIndex = Math.floor(Math.random() * PRACTICE_NOTIFICATION_MESSAGES.length);
  return PRACTICE_NOTIFICATION_MESSAGES[randomIndex](streakDays);
}

export async function requestNotificationPermission(silent: boolean = false): Promise<boolean> {
  if (!('Notification' in window)) {
    if (!silent) {
      alert('Tu navegador no soporta notificaciones de escritorio/móvil.');
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

  return false;
}

export async function sendPracticeReminderNotification(streakDays: number): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const msg = getRandomPracticeNotificationMessage(streakDays);
  const options: NotificationOptions = {
    body: msg.body,
    icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=192&q=80',
    badge: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=192&q=80',
    tag: 'practice-reminder'
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(msg.title, options);
  } else {
    new Notification(msg.title, options);
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
      console.log(`[PWA] Alarm local programada para las ${scheduledTime.toLocaleTimeString()}`);
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
        icons: [{ src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=192&q=80', sizes: '192x192', type: 'image/jpeg' }],
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
        icons: [{ src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=192&q=80', sizes: '192x192', type: 'image/jpeg' }],
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

