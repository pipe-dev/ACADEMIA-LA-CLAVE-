import { LessonNode, UserStats } from '../../types';

export interface LessonModalProps {
  node: LessonNode;
  userStats?: UserStats;
  onClose: () => void;
  onCompleteNode: (nodeId: string, xpReward: number) => void;
  onOpenUnitCelebration?: () => void;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export interface BalloonColorTheme {
  id: string;
  name: string;
  gradient: string;
  glowRgb: string;
  knotColor: string;
  bgCircle: string;
}

export const BALLOON_COLOR_THEMES: BalloonColorTheme[] = [
  {
    id: 'red',
    name: 'Rojo Carmesí',
    gradient: 'from-pink-400 via-rose-500 to-red-600',
    glowRgb: 'rgba(244, 63, 94, 0.4)',
    knotColor: 'bg-[#e11d48]',
    bgCircle: 'bg-rose-500'
  },
  {
    id: 'blue',
    name: 'Azul Eléctrico',
    gradient: 'from-cyan-300 via-blue-500 to-indigo-600',
    glowRgb: 'rgba(59, 130, 246, 0.4)',
    knotColor: 'bg-[#2563eb]',
    bgCircle: 'bg-blue-500'
  },
  {
    id: 'purple',
    name: 'Púrpura Mágico',
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-700',
    glowRgb: 'rgba(168, 85, 247, 0.4)',
    knotColor: 'bg-[#9333ea]',
    bgCircle: 'bg-purple-500'
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    gradient: 'from-emerald-300 via-teal-500 to-emerald-700',
    glowRgb: 'rgba(16, 185, 129, 0.4)',
    knotColor: 'bg-[#059669]',
    bgCircle: 'bg-emerald-500'
  },
  {
    id: 'amber',
    name: 'Dorado Solar',
    gradient: 'from-yellow-300 via-amber-400 to-orange-500',
    glowRgb: 'rgba(245, 158, 11, 0.4)',
    knotColor: 'bg-[#d97706]',
    bgCircle: 'bg-amber-400'
  }
];

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const CLASS_1_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '¿Cuál es la postura correcta?',
    options: [
      'Estar lo más rígido y tenso posible con los hombros levantados.',
      'Flexionar el cuello hacia adelante y sentarse encorvado.',
      'Hombros y piernas a la misma anchura y todo el cuerpo relajado, sin tensión excesiva.',
      'Mantener los brazos cruzados y las rodillas bloqueadas.'
    ],
    correctAnswer: 2,
    explanation: 'Tener los hombros y las piernas a la misma anchura con el cuerpo relajado ayuda a cantar de forma cómoda y sin tensiones.'
  },
  {
    id: 2,
    question: '¿Qué tipo de respiración es fundamental en el canto?',
    options: [
      'Respiración clavicular o de pecho alto.',
      'Respiración diafragmática.',
      'Respiración rápida por la boca.',
      'Respiración conteniendo el aire en la garganta.'
    ],
    correctAnswer: 1,
    explanation: 'La respiración diafragmática es la base del apoyo para cantar de manera sana y sostenida.'
  },
  {
    id: 3,
    question: '¿Cuáles son las zonas más comunes del cuerpo donde acumulamos tensión que perjudica la afinación?',
    options: [
      'La mandíbula, el cuello, la lengua y los hombros.',
      'Las rodillas y los talones del pie.',
      'Los dedos de las manos y las muñecas.',
      'La espalda baja y los omóplatos únicamente.'
    ],
    correctAnswer: 0,
    explanation: 'La mandíbula, el cuello, la lengua y los hombros son los principales acumuladores de tensión vocal.'
  },
  {
    id: 4,
    question: 'Para cantar frases largas sin sentir que te falta el aire, ¿cómo debes respirar correctamente?',
    options: [
      'Empujando todo el aire con fuerza de golpe al iniciar la frase.',
      'Reteniendo el aire en el pecho sin dejarlo salir.',
      'Respirando muy rápido después de cada palabra.',
      'Regulando el flujo de aire gastando solo el aire necesario y sin tensionar excesivamente la garganta.'
    ],
    correctAnswer: 3,
    explanation: 'Dosificar y regular el aire gastando solo lo necesario y sin tensar la garganta te permite sostener notas largas cómodamente.'
  }
];

export const UNIT_1_EXAM_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '¿Cuál es la postura correcta?',
    options: [
      'Estar lo más rígido y tenso posible con los hombros levantados.',
      'Flexionar el cuello hacia adelante y sentarse encorvado.',
      'Hombros y piernas a la misma anchura y todo el cuerpo relajado, sin tensión excesiva.',
      'Mantener los brazos cruzados y las rodillas bloqueadas.'
    ],
    correctAnswer: 2,
    explanation: 'Tener los hombros y las piernas a la misma anchura con el cuerpo relajado ayuda a cantar de forma cómoda y sin tensiones.'
  },
  {
    id: 2,
    question: '¿Qué tipo de respiración es fundamental en el canto?',
    options: [
      'Respiración clavicular o de pecho alto.',
      'Respiración diafragmática.',
      'Respiración rápida por la boca.',
      'Respiración conteniendo el aire en la garganta.'
    ],
    correctAnswer: 1,
    explanation: 'La respiración diafragmática es la base del apoyo para cantar de manera sana y sostenida.'
  },
  {
    id: 3,
    question: '¿Cuáles son las zonas más comunes del cuerpo donde acumulamos tensión que perjudica la afinación?',
    options: [
      'La mandíbula, el cuello, la lengua y los hombros.',
      'Las rodillas y los talones del pie.',
      'Los dedos de las manos y las muñecas.',
      'La espalda baja y los omóplatos únicamente.'
    ],
    correctAnswer: 0,
    explanation: 'La mandíbula, el cuello, la lengua y los hombros son los principales acumuladores de tensión vocal.'
  },
  {
    id: 4,
    question: 'Para cantar frases largas sin sentir que te falta el aire, ¿cómo debes respirar correctamente?',
    options: [
      'Empujando todo el aire con fuerza de golpe al iniciar la frase.',
      'Reteniendo el aire en el pecho sin dejarlo salir.',
      'Respirando muy rápido después de cada palabra.',
      'Regulando el flujo de aire gastando solo el aire necesario y sin tensionar excesivamente la garganta.'
    ],
    correctAnswer: 3,
    explanation: 'Dosificar y regular el aire gastando solo lo necesario y sin tensar la garganta te permite sostener notas largas cómodamente.'
  },
  {
    id: 5,
    question: 'Si durante el calentamiento sientes dolor o tensión excesiva en la garganta, ¿cuál es el paso correcto a seguir?',
    options: [
      'Continuar con más intensidad para que el músculo se acostumbre.',
      'Detenerse, relajar, revisar la técnica de respiración y hacer ejercicios más suaves como sirenas de labio.',
      'Tomar una bebida muy fría para desinflamar al instante y seguir.',
      'Cantar canciones agudas directamente para forzar la apertura de la laringe.'
    ],
    correctAnswer: 1,
    explanation: 'El dolor o tensión es un indicador de que algo anda mal. Detenerse y reiniciar con ejercicios suaves asegura que no lastimes tu voz antes de empezar.'
  },
  {
    id: 6,
    question: '¿Dónde se ubican exactamente las cuerdas vocales?',
    options: [
      'En el paladar blando, cerca de la campanilla.',
      'En la laringe (la caja de la voz), detrás del cartílago tiroides.',
      'Dentro de la tráquea, justo antes de los pulmones.',
      'En la cavidad nasal, para resonar el aire.'
    ],
    correctAnswer: 1,
    explanation: "Las cuerdas (o pliegues) vocales están protegidas dentro de la laringe, ubicadas horizontalmente justo detrás del cartílago tiroides (la 'manzana de Adán')."
  },
  {
    id: 7,
    question: '¿Qué cambio físico experimentan las cuerdas vocales al producir sonidos agudos (como en voz de cabeza)?',
    options: [
      'Se vuelven más cortas, gruesas y vibran lentamente.',
      'Se separan por completo para dejar salir más aire.',
      'Se estiran, se vuelven más delgadas (finitas) y vibran mucho más rápido.',
      'Se endurecen como huesos y no vibran, solo resuenan.'
    ],
    correctAnswer: 2,
    explanation: 'Para alcanzar notas más altas (frecuencias mayores), las cuerdas vocales se alargan y adelgazan, permitiéndoles vibrar a mayor velocidad.'
  }
];

// Evaluación del Módulo 4 (u4-node33.5): 1 pregunta por clase del módulo
// (agilidad, vibrato, articulación/dicción, resonancia/coloratura e identidad vocal).
export const UNIT_4_EXAM_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '¿Cuál es la clave para cantar melismas y pasajes rápidos con limpieza y precisión?',
    options: [
      'Forzar la garganta con golpes de aire fuertes para que las notas suenen rápido.',
      'Mantener el apoyo de aire estable y una articulación relajada, sin tensar la garganta.',
      'Mover la mandíbula exageradamente en cada nota para marcar la velocidad.',
      'Subir el volumen al máximo en cada nota para no desafinar.'
    ],
    correctAnswer: 1,
    explanation: 'La agilidad nace de un flujo de aire constante y de articulaciones relajadas; la fuerza o la mandíbula tensa bloquean las notas rápidas.'
  },
  {
    id: 2,
    question: '¿Cómo se produce un vibrato sano y expresivo?',
    options: [
      'Temblando la mandíbula de forma forzada para simular la vibración.',
      'Con una oscilación regular y natural del tono, producto del equilibrio de la laringe y libre de tensión.',
      'Moviendo la cabeza rápidamente de lado a lado mientras se sostiene la nota.',
      'Contrayendo el cuello con fuerza para que la voz oscile.'
    ],
    correctAnswer: 1,
    explanation: 'El vibrato sano es una fluctuación periódica del tono que surge de una laringe relajada y equilibrada; forzarlo con mandíbula o cuello genera tensión dañina.'
  },
  {
    id: 3,
    question: '¿Qué debe entrenarse para lograr una dicción clara al cantar?',
    options: [
      'Únicamente la respiración, porque la dicción no se puede trabajar.',
      'La lengua, los labios y la mandíbula, con agilidad y sin tensión excesiva.',
      'La fuerza de las cuerdas vocales, apretándolas para marcar cada sílaba.',
      'El volumen de la voz, gritando cada consonante.'
    ],
    correctAnswer: 1,
    explanation: 'La articulación depende de la lengua, los labios y la mandíbula ágiles y relajados, que moldean con claridad las vocales y consonantes.'
  },
  {
    id: 4,
    question: '¿Cómo se enriquece el color y la resonancia de la voz?',
    options: [
      'Gritando para que la voz suene más brillante y potente.',
      'Modificando la forma del tracto vocal y usando resonadores de pecho, boca y cabeza.',
      'Conteniendo el aire en la garganta para que el sonido rebote.',
      'Cantando siempre en el mismo registro para no cambiar el timbre.'
    ],
    correctAnswer: 1,
    explanation: 'Al cambiar la forma del tracto vocal y activar distintos resonadores (pecho, boca, cabeza) se modula el color y la riqueza del timbre.'
  },
  {
    id: 5,
    question: '¿Qué te permite descubrir y desarrollar tu identidad vocal?',
    options: [
      'Imitar siempre a otros cantantes para no equivocarte.',
      'Reconocer tu timbre natural (brillante, nasal u oscuro) y elegir un repertorio que lo favorezca.',
      'Cantar solo notas agudas para demostrar más técnica.',
      'Evitar tu registro cómodo y forzar siempre uno más agudo.'
    ],
    correctAnswer: 1,
    explanation: 'Conocer la tendencia natural de tu timbre y tu repertorio te permite desarrollar un estilo propio, sano y auténtico.'
  }
];
