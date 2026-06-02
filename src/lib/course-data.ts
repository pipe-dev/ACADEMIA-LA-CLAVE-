export interface CourseExercise {
  level: number; // 1 = Fácil, 2 = Medio, 3 = Difícil, etc.
  type: 'inhale-hold-exhale' | 'inhale-exhale' | 'pitch-matching' | 'vocal-range-polygraph';
  description: string;
  // For breathing:
  inhaleSeconds?: number;
  holdSeconds?: number;
  exhaleSeconds?: number;
  // For tuner:
  noteCount?: number;
  // For vocal polygraph:
  polygraphDirection?: 'up' | 'down';
  polygraphDuration?: number;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  focus: 'Respiración' | 'Afinación' | 'Tempo' | 'Técnica Vocal';
  exercises: CourseExercise[];
}

// Helper to generate 3 levels of exercises for a lesson
function createExercises(
  type: 'inhale-hold-exhale' | 'inhale-exhale',
  baseInhale: number,
  baseHold: number,
  baseExhale: number,
  focusText: string
): CourseExercise[] {
  const isThreeStep = type === 'inhale-hold-exhale';
  
  return [
    {
      level: 1,
      type,
      inhaleSeconds: baseInhale,
      holdSeconds: isThreeStep ? baseHold : 0,
      exhaleSeconds: baseExhale,
      description: `Ejercicio 1 (Fácil): Inhala en ${baseInhale}s${isThreeStep ? `, mantén ${baseHold}s` : ''} y exhala lento en ${baseExhale}s.`
    },
    {
      level: 2,
      type,
      inhaleSeconds: baseInhale + 1,
      holdSeconds: isThreeStep ? baseHold + 1 : 0,
      exhaleSeconds: baseExhale + 3,
      description: `Ejercicio 2 (Medio): Incrementa tu capacidad. Inhala en ${baseInhale + 1}s${isThreeStep ? `, mantén ${baseHold + 1}s` : ''} y exhala lento en ${baseExhale + 3}s.`
    },
    {
      level: 3,
      type,
      inhaleSeconds: baseInhale + 1,
      holdSeconds: isThreeStep ? baseHold + 2 : 0,
      exhaleSeconds: baseExhale + 6,
      description: `Ejercicio 3 (Difícil): Reto de control. Inhala en ${baseInhale + 1}s${isThreeStep ? `, mantén ${baseHold + 2}s` : ''} y exhala lento en ${baseExhale + 6}s.`
    }
  ];
}

export const lessons: Lesson[] = [
  {
    id: 1,
    title: "Clase 1: Introducción al Canto y Técnica Vocal",
    description: "Descubre el camino del canto, los objetivos de este curso interactivo y cómo utilizar las herramientas para tu desarrollo vocal.",
    youtubeId: "1q3ND4XPzIg",
    duration: "10:15",
    focus: "Técnica Vocal",
    exercises: [] // Introducción (Sin ejercicios)
  },
  {
    id: 2,
    title: "Clase 2: Ejercicios de Respiración Guiada (Patrón Rítmico)",
    description: "Práctica de respiración corta guiada. Observa el video e imita el patrón respiratorio. Se reproducirá en bucle 4 veces para asimilar la técnica.",
    youtubeId: "OL4G_0u-Yy4",
    duration: "12:30",
    focus: "Respiración",
    exercises: [] // YouTube Short, loops 4 times
  },
  {
    id: 3,
    title: "Clase 3: Ejercicios de Respiración Guiada (Capacidad Pulmonar)",
    description: "Rutina corta de respiración para aumentar la elasticidad y capacidad diafragmática. El video se repetirá en bucle 4 veces.",
    youtubeId: "BNln3ltV5Vg",
    duration: "15:45",
    focus: "Respiración",
    exercises: [] // YouTube Short, loops 4 times
  },
  {
    id: 4,
    title: "Clase 4: Ejercicios de Respiración Guiada (Dosificación de Aire)",
    description: "Entrenamiento corto de dosificación y control de la exhalación constante. Sigue e imita el patrón rítmico (4 repeticiones).",
    youtubeId: "szhsvOCvnMM",
    duration: "09:20",
    focus: "Respiración",
    exercises: [] // YouTube Short, loops 4 times
  },
  {
    id: 5,
    title: "Clase 5: Ejercicios de Respiración Guiada (Apoyo y Estabilidad)",
    description: "Rutina corta intensiva de respiración para fortalecer los músculos abdominales e intercostales de apoyo (4 repeticiones).",
    youtubeId: "dv97n1Hl0XM",
    duration: "11:10",
    focus: "Respiración",
    exercises: [] // YouTube Short, loops 4 times
  },
  {
    id: 6,
    title: "Clase 6: Rutina Avanzada de Control de Aire",
    description: "Ejercicios de resistencia para prolongar tu capacidad respiratoria y mantener la presión de aire de forma estable.",
    youtubeId: "gkUIJ2x79vU",
    duration: "14:05",
    focus: "Respiración",
    exercises: [] // Rutina Avanzada (Sin ejercicios prácticos, incluye cuestionario)
  },
  {
    id: 7,
    title: "Clase 7: Fisiología Vocal y Funcionamiento de la Voz",
    description: "Conoce cómo funcionan tus cuerdas vocales, la laringe y los resonadores para entender tu instrumento desde adentro.",
    youtubeId: "CR5fWk5qbCk",
    duration: "08:50",
    focus: "Técnica Vocal",
    exercises: [] // Fisiología Vocal (Sin ejercicios)
  },
  {
    id: 8,
    title: "Clase 8: Ejercicios de Afinación y Entonación",
    description: "Entrenamiento auditivo y vocal para aprender a afinar notas individuales con precisión.",
    youtubeId: "hCqCiYE9OUY",
    duration: "13:20",
    focus: "Afinación",
    exercises: [] // Vídeo práctico como ejercicio
  },
  {
    id: 9,
    title: "Clase 9: Calentamiento Vocal Básico",
    description: "Prepara tus cuerdas vocales y resonadores para evitar fatigas utilizando técnicas de vibración de labios y fonación.",
    youtubeId: "2t2sj8X1hVY",
    duration: "16:15",
    focus: "Técnica Vocal",
    exercises: [] // Vídeo práctico como ejercicio
  },
  {
    id: 10,
    title: "Clase 10: Afinación de Intervalos Simples",
    description: "Aprende a pasar de una nota a otra de forma limpia y afinada controlando la presión de aire de apoyo.",
    youtubeId: "tHe_dL7ujW0",
    duration: "11:45",
    focus: "Afinación",
    exercises: [] // Vídeo práctico como ejercicio
  },
  {
    id: 11,
    title: "Clase 11: Respiración Diafragmática Compleja",
    description: "Ejercicios de respiración y apoyo avanzados con tiempos de retención y exhalación muy exigentes para mayor estabilidad.",
    youtubeId: "v3dcyo4_Q8M",
    duration: "18:30",
    focus: "Respiración",
    exercises: [] // Vídeo práctico como ejercicio
  },
  {
    id: 12,
    title: "Clase 12: Configuración de Cuerdas Vocales (Grosor y Registro)",
    description: "Aprende a adaptar tus cuerdas vocales para producir sonidos delgados (agudos) y gruesos (graves), preparándote para afinar con flexibilidad.",
    youtubeId: "u9EApwwRBa4",
    duration: "12:10",
    focus: "Técnica Vocal",
    exercises: []
  },
  {
    id: 12.5,
    title: "Evaluación del Módulo 1 (Clases 1 a 12)",
    description: "Evaluación práctica de 7 preguntas para afianzar los conocimientos adquiridos en las primeras 12 clases sobre postura, respiración, fisiología vocal y configuración de cuerdas.",
    youtubeId: "", // Vacío para no renderizar video y mostrar el panel especial
    duration: "10:00",
    focus: "Técnica Vocal",
    exercises: [] // No tiene ejercicios prácticos
  },
  {
    id: 13,
    title: "Clase 13: Afinación de la Voz Hablada al Canto",
    description: "Conecta la afinación de tu voz hablada con la voz cantada para lograr una entonación natural y afinada.",
    youtubeId: "Xxedcl77oK4",
    duration: "07:55",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 14,
    title: "Clase 14: Vocalización e Intervalos de Tercera",
    description: "Ejercicios guiados de vocalización en intervalos de tercera para estructurar tu entonación básica.",
    youtubeId: "-eY1k-DPP2c",
    duration: "13:40",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 15,
    title: "Clase 15: Entonación de Escalas Mayores",
    description: "Aprende a entonar y afinar de forma consecutiva los pasos y notas de la escala mayor.",
    youtubeId: "n8s_8jXsxOU",
    duration: "10:50",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 16,
    title: "Clase 16: Control de Afinación con Metrónomo",
    description: "Mantén el tono afinado y estable mientras te acoplas al compás rítmico de un metrónomo.",
    youtubeId: "GDbP8fVKpQM",
    duration: "14:50",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 17,
    title: "Clase 17: Dinámicas Vocales y Afinación",
    description: "Aprende a controlar la afinación cantando piano (suave) y forte (fuerte) sin perder el apoyo de aire.",
    youtubeId: "YnB2y4Qc0xs",
    duration: "12:45",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 18,
    title: "Clase 18: Ejercicios de Vocalización Dinámica",
    description: "Vocalizaciones y arpegios rápidos para agilizar la respuesta y afinación de tus cuerdas vocales.",
    youtubeId: "l-ohLa84uZE",
    duration: "17:20",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 19,
    title: "Clase 19: Estabilidad de Tono en Notas Largas",
    description: "Ejercicios guiados para mantener notas sostenidas perfectamente estables y afinadas hasta el final.",
    youtubeId: "j6TPCq6CWGg",
    duration: "11:30",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 20,
    title: "Clase 20: Rutina Completa de Afinación y Oído",
    description: "Consolida tu oído musical con una rutina integral que desafía la afinación de diferentes intervalos.",
    youtubeId: "Kzlp8mnn2Mo",
    duration: "13:10",
    focus: "Afinación",
    exercises: []
  },
  {
    id: 20.5,
    title: "Evaluación del Módulo 2 (Afinación)",
    description: "Pon a prueba tu afinación y oído musical superando 5 niveles secuenciales de precisión vocal.",
    youtubeId: "",
    duration: "10:00",
    focus: "Afinación",
    exercises: [
      { level: 1, type: 'pitch-matching', noteCount: 3, description: "Nivel 1: Afina 3 notas consecutivas." },
      { level: 2, type: 'pitch-matching', noteCount: 4, description: "Nivel 2: Afina 4 notas consecutivas." },
      { level: 3, type: 'pitch-matching', noteCount: 4, description: "Nivel 3: Consolida tu precisión con 4 notas." },
      { level: 4, type: 'pitch-matching', noteCount: 5, description: "Nivel 4: Afina 5 notas consecutivas." },
      { level: 5, type: 'pitch-matching', noteCount: 5, description: "Nivel 5: Prueba final de afinación con 5 notas." }
    ]
  },
  {
    id: 21,
    title: "Clase 21: Introducción al Tempo y Ritmo",
    description: "Aprende los conceptos básicos del tempo, velocidad, pulso musical y cómo coordinarlo con tu voz.",
    youtubeId: "IMeZnOpy6U4",
    duration: "15:00",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 22,
    title: "Clase 22: Figuras Musicales y Patrones Rítmicos",
    description: "Explora la duración de las figuras de tiempo (negras, corcheas) y practica la lectura y canto de patrones rítmicos.",
    youtubeId: "uv216ZjuTuY",
    duration: "12:20",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 23,
    title: "Clase 23: Thumb Dance Challenge - Coordinación Rítmica",
    description: "Un divertido desafío de juego táctil para coordinar el pulso visual de la pantalla con tus dedos al ritmo.",
    youtubeId: "8LqsbbBrGDQ",
    duration: "14:15",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 24,
    title: "Clase 24: El Ritmo en la Interpretación del Cantante",
    description: "Explicación ampliada de cómo el ritmo influye en la frase musical, la dicción y la colocación del aire del cantante.",
    youtubeId: "eOlQLFrcenM",
    duration: "13:00",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 25,
    title: "Clase 25: Thumb Dance Challenge 2 - Desafío Avanzado",
    description: "Lleva tu coordinación al límite con un segundo desafío interactivo de ritmo táctil y visual.",
    youtubeId: "mWpFwlH3338",
    duration: "10:40",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 26,
    title: "Clase 26: Cantar con Pulso Estable y Oído Rítmico",
    description: "Aprende técnicas para mantener un tempo estable a lo largo de una canción completa y entrenar tu oído rítmico.",
    youtubeId: "PxUqFigvv5U",
    duration: "16:50",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 27,
    title: "Clase 27: Sentir el Ritmo - Práctica con Cumbia",
    description: "Video ejercicio práctico de sincronización y sabor rítmico utilizando una base musical de cumbia.",
    youtubeId: "HrskUXUwX9s",
    duration: "14:40",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 28,
    title: "Clase 28: Sincronización Rítmica con Repertorio",
    description: "Video ejercicio práctico para aplicar tu tempo estable cantando sobre una base de género diferente.",
    youtubeId: "Yxgf7IGDvow",
    duration: "17:10",
    focus: "Tempo",
    exercises: []
  },
  {
    id: 29,
    title: "Clase 29: Agilidad Vocal, Velocidad y Precisión",
    description: "Aprende a interpretar pasajes melódicos veloces, melismas y notas rápidas con limpieza, ritmo y afinación.",
    youtubeId: "rIRqYcDqTIU",
    duration: "11:55",
    focus: "Técnica Vocal",
    exercises: createExercises("inhale-exhale", 4, 0, 13, "de la Clase 29")
  },
  {
    id: 30,
    title: "Clase 30: El Vibrato como Recurso Expresivo",
    description: "Aprende a modular la laringe para generar un vibrato sano y libre de tensión, aplicándolo a tus canciones.",
    youtubeId: "DABqZ3yVmis",
    duration: "06:40",
    focus: "Técnica Vocal",
    exercises: createExercises("inhale-hold-exhale", 4, 3, 8, "de la Clase 30")
  },
  {
    id: 31,
    title: "Clase 31: Articulación y Dicción Vocal",
    description: "Ejercicios de articulación (mandíbula, lengua y labios) para pronunciar con absoluta claridad cada palabra al cantar.",
    youtubeId: "1htIT_p4KVU",
    duration: "15:20",
    focus: "Técnica Vocal",
    exercises: []
  },
  {
    id: 32,
    title: "Clase 32: Resonancia y Coloratura de la Voz",
    description: "Aprende a modificar la forma del tracto vocal y usar resonadores de pecho, boca y cabeza para enriquecer tu timbre vocal.",
    youtubeId: "_TYaO9iDOcg",
    duration: "14:10",
    focus: "Técnica Vocal",
    exercises: []
  },
  {
    id: 33,
    title: "Clase 33: Identidad Vocal y Conclusión del Curso",
    description: "Explora y define tu estilo propio, descubriendo si tu voz tiende a un sonido brillante, nasal u oscuro. ¡Felicidades por graduarte!",
    youtubeId: "kiwDw7Rkqqw",
    duration: "18:00",
    focus: "Técnica Vocal",
    exercises: []
  }
];
