import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { TabType } from '../types';

export const TOUR_KEYS = {
  academia: 'laclave_tour_academia_v2',
  afinador: 'laclave_tour_afinador_v2',
  practica: 'laclave_tour_practica_v2',
  progreso: 'laclave_tour_progreso_v2',
} as const;

let activeDriverInstance: Driver | null = null;
let isTourRunning = false;

/**
 * Indica si hay un tour de Driver.js activo en la pantalla actualmente
 */
export function isTourActive(): boolean {
  if (isTourRunning) return true;
  if (typeof document !== 'undefined') {
    return Boolean(document.querySelector('.driver-popover') || document.querySelector('.driver-overlay'));
  }
  return false;
}

/**
 * Sección 1: Tour de la Academia y Ruta de Aprendizaje
 */
export function startAcademiaTour(onFinish?: () => void) {
  if (typeof window === 'undefined') return;
  if (isTourActive()) return;

  const steps: DriveStep[] = [
    {
      element: '#tour-header-profile',
      popover: {
        title: 'Academia La Clave: Tu Perfil',
        description: 'Aquí encuentras tus ajustes personales, días de membresía activos, cambio de tema (claro, oscuro o Zen) y la opción de repetir este tutorial cuando lo desees.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-header-streak',
      popover: {
        title: 'Fuego de Racha Diaria',
        description: 'Cantar al menos 5 minutos al día mantiene encendida tu llama de racha. Entre más días consecutivos practiques, mayores serán tus medallas y multiplicadores de XP.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#tour-academia-welcome',
      popover: {
        title: 'Tu Tesitura y Bienvenida',
        description: 'Este panel te saluda y te recuerda tu clasificación vocal (Tenor, Barítono, Soprano, etc.). Todas las notas y lecciones se calibran automáticamente a las frecuencias reales de tu voz.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-academia-first-node',
      popover: {
        title: 'Ruta de Aprendizaje y Nodos',
        description: 'Cada círculo es una lección interactiva de canto, técnica respiratoria o solfeo. Haz clic en el nodo desbloqueado para iniciar tu práctica paso a paso.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-bottom-nav',
      popover: {
        title: 'Navegación por Secciones',
        description: 'Usa la barra inferior para moverte entre las lecciones de la Academia, el Afinador Vocal, el Karaoke y tu Progreso general.',
        side: 'top',
        align: 'center',
      },
    },
  ];

  const validSteps = steps.filter((s) => {
    if (typeof s.element === 'string') {
      return Boolean(document.querySelector(s.element));
    }
    return true;
  });

  isTourRunning = true;
  activeDriverInstance = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.85,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido, a Cantar!',
    steps: validSteps.length > 0 ? validSteps : steps,
    onDestroyed: () => {
      isTourRunning = false;
      activeDriverInstance = null;
      localStorage.setItem(TOUR_KEYS.academia, 'true');
      window.dispatchEvent(new CustomEvent('laclave_tour_section_completed', { detail: { section: 'academia' } }));
      if (onFinish) onFinish();
    },
  });

  activeDriverInstance.drive();
}

/**
 * Sección 2: Tour detallado del Afinador Vocal en tiempo real
 */
export function startAfinadorTour(onFinish?: () => void) {
  if (typeof window === 'undefined') return;
  if (isTourActive()) return;

  const steps: DriveStep[] = [
    {
      element: '#tour-tuner-card',
      popover: {
        title: 'Afinador Vocal en Tiempo Real',
        description: 'Esta es tu herramienta principal de precisión. Captura tu voz mediante el micrófono de tu celular o computadora y calcula al instante la nota y frecuencia exacta en Hertz.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-tuner-gauge',
      popover: {
        title: 'Esfera y Calibrador Visual',
        description: 'Al cantar, la aguja te muestra tu desviación: hacia la izquierda si estás grave (bemol) y hacia la derecha si estás agudo (sostenido). ¡Cuando logres la afinación perfecta, la esfera se ilumina en VERDE brillante!',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-tuner-reference',
      popover: {
        title: 'Teclado Vocal y Tonos de Guía',
        description: 'Toca cualquiera de las teclas blancas o negras para escuchar el audio acústico de la nota con voz real humana. Escucha primero el tono y luego canta intentando igualarlo.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-tuner-stability',
      popover: {
        title: 'Gráfica de Estabilidad Vocal',
        description: 'Traza una línea continua con tu voz segundo a segundo. Te entrena para sostener notas largas y estables sin temblores ni caídas de diafragma dentro del corredor seguro.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-tuner-apparatus',
      popover: {
        title: 'Los 6 Aparatos de Gimnasia Vocal',
        description: 'Toca este botón para desplegar los 6 módulos de entrenamiento intensivo: Desafío de Estabilidad 10s, Ejercicios de Respiración diafragmática, Calibrador de Rango Vocal, Duelo Rápido, Evaluación Técnica de Voz y Escalas con Arpegios.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-tuner-history',
      popover: {
        title: 'Historial de Práctica y Precisión',
        description: 'Cada nota cantada con éxito queda archivada aquí con su margen de error en centésimas de semitono, permitiéndote comprobar cómo mejora tu afinación día a día.',
        side: 'top',
        align: 'center',
      },
    },
  ];

  const validSteps = steps.filter((s) => {
    if (typeof s.element === 'string') {
      return Boolean(document.querySelector(s.element));
    }
    return true;
  });

  isTourRunning = true;
  activeDriverInstance = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.85,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡A Afinar!',
    steps: validSteps.length > 0 ? validSteps : steps,
    onDestroyed: () => {
      isTourRunning = false;
      activeDriverInstance = null;
      localStorage.setItem(TOUR_KEYS.afinador, 'true');
      window.dispatchEvent(new CustomEvent('laclave_tour_section_completed', { detail: { section: 'afinador' } }));
      if (onFinish) onFinish();
    },
  });

  activeDriverInstance.drive();
}

/**
 * Sección 3: Tour del Karaoke y Práctica con Canciones
 */
export function startPracticaTour(onFinish?: () => void) {
  if (typeof window === 'undefined') return;
  if (isTourActive()) return;

  const steps: DriveStep[] = [
    {
      element: '#tour-practica-header',
      popover: {
        title: 'Karaoke & Práctica con Canciones',
        description: 'Canta canciones completas con la pista musical original, letra sincronizada en pantalla y evaluación de afinación en tiempo real.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-practica-search',
      popover: {
        title: 'Buscador de Canciones',
        description: 'Encuentra al instante tus canciones o artistas favoritos escribiendo su nombre aquí.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-practica-categories',
      popover: {
        title: 'Géneros y Colecciones Musicales',
        description: 'Explora listas curadas de éxitos: Pop & Baladas, Música Cristiana, Urbano Latino, Rock en Español, Música Mexicana y más.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-practica-first-track',
      popover: {
        title: 'Escenario de Karaoke Interactivo',
        description: 'Toca cualquier canción para entrar al escenario. Al cantar, el micrófono evalúa tus notas y un polígrafo visual te indicará cuántos puntos y combos acumulas.',
        side: 'top',
        align: 'center',
      },
    },
  ];

  const validSteps = steps.filter((s) => {
    if (typeof s.element === 'string') {
      return Boolean(document.querySelector(s.element));
    }
    return true;
  });

  isTourRunning = true;
  activeDriverInstance = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.85,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡A Cantar!',
    steps: validSteps.length > 0 ? validSteps : steps,
    onDestroyed: () => {
      isTourRunning = false;
      activeDriverInstance = null;
      localStorage.setItem(TOUR_KEYS.practica, 'true');
      window.dispatchEvent(new CustomEvent('laclave_tour_section_completed', { detail: { section: 'practica' } }));
      if (onFinish) onFinish();
    },
  });

  activeDriverInstance.drive();
}

/**
 * Sección 4: Tour de Progreso, Niveles e Insignias
 */
export function startProgresoTour(onFinish?: () => void) {
  if (typeof window === 'undefined') return;
  if (isTourActive()) return;

  const steps: DriveStep[] = [
    {
      element: '#tour-progreso-level',
      popover: {
        title: 'Nivel y Puntos de Experiencia (XP)',
        description: 'Aquí ves tu nivel artístico actual, puntos XP acumulados y cuánto te falta para subir de rango. Puedes compartir tus logros con un toque.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-progreso-goal',
      popover: {
        title: 'Meta Diaria de Práctica',
        description: 'Configura tus minutos de entrenamiento diario (10, 15 o 30 minutos). El círculo se irá llenando a medida que practiques lecciones o canciones.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-progreso-consistency',
      popover: {
        title: 'Registro Semanal y Racha',
        description: 'Monitorea qué días de la semana has cumplido tu práctica. La constancia es la clave para desarrollar una voz potente y afinada.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-progreso-badges',
      popover: {
        title: 'Insignias y Medallas de Canto',
        description: 'Colecciona más de 50 medallas especiales desbloqueables por afinar notas difíciles, mantener rachas largas y superar evaluaciones.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-progreso-quests',
      popover: {
        title: 'Misiones Diarias y Cofre de Recompensas',
        description: 'Completa desafíos diarios como afinar 5 notas o cantar 10 minutos para reclamar XP adicional y abrir el cofre de bonificación.',
        side: 'top',
        align: 'center',
      },
    },
  ];

  const validSteps = steps.filter((s) => {
    if (typeof s.element === 'string') {
      return Boolean(document.querySelector(s.element));
    }
    return true;
  });

  isTourRunning = true;
  activeDriverInstance = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.85,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Excelente!',
    steps: validSteps.length > 0 ? validSteps : steps,
    onDestroyed: () => {
      isTourRunning = false;
      activeDriverInstance = null;
      localStorage.setItem(TOUR_KEYS.progreso, 'true');
      window.dispatchEvent(new CustomEvent('laclave_tour_section_completed', { detail: { section: 'progreso' } }));
      if (onFinish) onFinish();
    },
  });

  activeDriverInstance.drive();
}

/**
 * Disparador inteligente por sección:
 * Ejecuta el tour correspondiente a la pestaña activa solo si el usuario no lo ha completado antes,
 * o forzosamente si se invoca de manera manual desde Ajustes.
 */
export function triggerSectionTour(tab: TabType, isManual = false) {
  if (typeof window === 'undefined') return;
  if (tab === 'racha') return;

  const key = TOUR_KEYS[tab as keyof typeof TOUR_KEYS];
  if (!isManual && key && localStorage.getItem(key) === 'true') {
    return;
  }

  // Esperar a que React monte los componentes de la vista en el DOM
  setTimeout(() => {
    if (isTourActive()) return;

    switch (tab) {
      case 'academia':
        startAcademiaTour();
        break;
      case 'afinador':
        startAfinadorTour();
        break;
      case 'practica':
        startPracticaTour();
        break;
      case 'progreso':
        startProgresoTour();
        break;
    }
  }, 400);
}

/**
 * Función de compatibilidad general:
 * Ejecuta el tour de la sección en la que el usuario se encuentra actualmente.
 */
export function startOnboardingTour(
  activeTab: TabType,
  _onChangeTab?: (tab: TabType) => void,
  isManualTrigger = false
) {
  triggerSectionTour(activeTab, isManualTrigger);
}
