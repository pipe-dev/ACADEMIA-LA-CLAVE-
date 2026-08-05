import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { TabType } from '../types';

export function startOnboardingTour(
  activeTab: TabType,
  onChangeTab: (tab: TabType) => void,
  isManualTrigger = false
) {
  // If not manual trigger and already completed, skip
  if (!isManualTrigger) {
    const isCompleted = localStorage.getItem('laclave_tour_completed');
    if (isCompleted === 'true') {
      return;
    }
  }

  // Ensure we start at academia if we want to show academia steps first
  if (activeTab !== 'academia') {
    onChangeTab('academia');
  }

  let driverObj: Driver;

  const steps: DriveStep[] = [
    {
      element: '#tour-header-profile',
      popover: {
        title: '¡Bienvenido a La Clave!',
        description: 'Tu plataforma de canto, solfeo y afinación. Presiona aquí para ver tu perfil, modo oscuro, o repetir este tour guiado.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-bottom-nav',
      popover: {
        title: 'Navegación por Secciones',
        description: 'Usa el menú inferior para moverte entre las lecciones de la Academia, el Gimnasio Vocal con Afinador, el Karaoke y tu Progreso.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-academia-welcome',
      popover: {
        title: 'Mapa de Aprendizaje',
        description: 'Sigue la ruta pedagógica de unidades. Haz clic en los nodos circulares desbloqueados para tomar lecciones prácticas.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-nav-afinador',
      popover: {
        title: 'Gimnasio Vocal y Afinador',
        description: 'Ahora iremos al Afinador en Tiempo Real para aprender a usar el micrófono de forma correcta.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-tuner-card',
      popover: {
        title: 'Afinador en Tiempo Real',
        description: 'Captura el tono de tu voz con el micrófono del dispositivo y calcula en tiempo real la nota exacta y su frecuencia en Hz.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-tuner-gauge',
      popover: {
        title: 'Indicador de Afinidad',
        description: 'Si cantas muy grave, la aguja estará hacia la izquierda (Bemol). Si estás agudo, hacia la derecha. ¡Busca el centro VERDE!',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-tuner-reference',
      popover: {
        title: 'Tonos de Referencia',
        description: 'Haz clic en las notas de Solfeo (DO, RE, MI...) o en las teclas de notas para escuchar el tono objetivo antes de cantar.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-tuner-apparatus',
      popover: {
        title: 'Aparatos de Gimnasia Vocal',
        description: 'Entrena tu diafragma con ejercicios de respiración, desafía tu estabilidad de 10 segundos, o compite en Duelos Vocales.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-header-streak',
      popover: {
        title: 'Mantén tu Racha',
        description: 'Completa al menos 1 lección o práctica al día para encender tu fuego de racha y desbloquear medallas de constancia. ¡A cantar!',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#071322',
    overlayOpacity: 0.8,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido, a Cantar!',
    steps: steps,
    onHighlightStarted: (_element, step) => {
      // Auto-switch tabs when reaching tuner steps
      if (step.element === '#tour-tuner-card' || step.element === '#tour-tuner-gauge' || step.element === '#tour-tuner-reference' || step.element === '#tour-tuner-apparatus') {
        onChangeTab('afinador');
      } else if (step.element === '#tour-academia-welcome' || step.element === '#tour-academia-tip') {
        onChangeTab('academia');
      }
    },
    onDestroyed: () => {
      localStorage.setItem('laclave_tour_completed', 'true');
    }
  });

  driverObj.drive();
}
