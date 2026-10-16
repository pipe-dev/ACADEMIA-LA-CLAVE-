import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { TabType } from '../types';

export const TOUR_STORAGE_KEY = 'laclave_tour_v2_completed';

/**
 * Sección 1: Tour detallado de la Academia
 */
export function startAcademiaTour(
  onChangeTab: (tab: TabType) => void,
  onFinish?: () => void
) {
  const steps: DriveStep[] = [
    {
      element: '#tour-header-profile',
      popover: {
        title: 'Academia La Clave: Tu Perfil',
        description: 'Aquí encuentras tus ajustes personales, días de membresía activos, modo oscuro, modo Zen nocturno y la opción de repetir este tutorial cuando lo desees.',
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

  // Si el primer nodo aún no está en el DOM, filtramos el paso para evitar errores
  const validSteps = steps.filter((s) => {
    if (typeof s.element === 'string') {
      return Boolean(document.querySelector(s.element));
    }
    return true;
  });

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.85,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: 'Ir al Afinador Vocal →',
    steps: validSteps.length > 0 ? validSteps : steps,
    onDestroyed: () => {
      if (onFinish) {
        onFinish();
      }
    },
  });

  driverObj.drive();
}

/**
 * Sección 2: Tour exhaustivo del Afinador Vocal en tiempo real
 */
export function startAfinadorTour(
  onFinish?: () => void
) {
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

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.85,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido, a Cantar!',
    steps: validSteps.length > 0 ? validSteps : steps,
    onDestroyed: () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      if (onFinish) {
        onFinish();
      }
    },
  });

  driverObj.drive();
}

/**
 * Orquestador principal del Tour Guiado Completo por Secciones
 */
export function startOnboardingTour(
  activeTab: TabType,
  onChangeTab: (tab: TabType) => void,
  isManualTrigger = false
) {
  // Si no es manual y ya se completó la versión 2 del tour, no abrir automáticamente
  if (!isManualTrigger) {
    const isCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (isCompleted === 'true') {
      return;
    }
  }

  // Si estamos en afinador y fue manual, podemos empezar en afinador directamente
  if (activeTab === 'afinador' && isManualTrigger) {
    startAfinadorTour();
    return;
  }

  // Asegurar que estamos en academia para la Sección 1
  if (activeTab !== 'academia') {
    onChangeTab('academia');
  }

  setTimeout(() => {
    startAcademiaTour(onChangeTab, () => {
      // Al terminar la sección de Academia, cambiamos ordenadamente al Afinador
      onChangeTab('afinador');
      setTimeout(() => {
        startAfinadorTour();
      }, 400);
    });
  }, 250);
}
