import { Badge } from '../types';

// Categories of 200 Singing Achievements
export const BADGE_CATEGORIES = [
  'Respiración y Diafragma',
  'Afinación y Solfeo',
  'Resonancia y Color Vocal',
  'Agilidad Vocal y Melismas',
  'Tesitura y Extensión',
  'Ritmo y Tiempo',
  'Constancia y Racha',
  'Repertorio y Escenario',
  'Salud Vocal',
  'Maestría Vocal'
] as const;

export type BadgeCategory = typeof BADGE_CATEGORIES[number];

// Helper to generate 200 authentic singing achievements
function generate200SingingBadges(): Badge[] {
  const badges: Badge[] = [];

  // Category 1: Respiración y Diafragma (20)
  const respTitles = [
    'Primer Soplido Diafragmático', 'Respiración de Apoyo I', 'Respiración de Apoyo II', 'Control del Flujo de Aire', 'Sostén Abdominal',
    'Trino de Labios Básico', 'Trino de Lengua Fluido', 'Exhalación en "S" Continua', 'Respiración Intercostal', 'Apoyo en Notas Largas',
    'Presión Subglótica Estable', 'Capacidad Pulmonar Nivel 1', 'Capacidad Pulmonar Nivel 2', 'Apoyo sin Tensión Cervical', 'Anclaje Laringeo Cero Tensión',
    'Apertura Costal Total', 'Dosificación de Aire Maestra', 'Respiración Silenciosa Profunda', 'Inspiración Relámpago', 'Gigante de la Respiración Vocal'
  ];

  // Category 2: Afinación y Solfeo (20)
  const afinTitles = [
    'Primera Nota Afinada', 'Afinación en Do Mayor', 'Oído Atento I', 'Oído Atento II', 'Intonación Limpia Do-Re-Mi',
    'Afinador de Precisión', 'Salto de Tercera Mayor', 'Salto de Quinta Justa', 'Afinación de Notas Tenidas', 'Afinación de Semitonos',
    'Solfeo Cantado Nivel Básico', 'Solfeo Cantado Intermedio', 'Solfeo Cantado Avanzado', 'Oído Absoluto en Proceso', 'Intervalo de Octava sin Desfase',
    'Escala Diatónica Impecable', 'Afinación con Micrófono', 'Dictado Melódico Básico', 'Lectura Cantada Fluida', 'Virtuoso de la Entonación'
  ];

  // Category 3: Resonancia y Color Vocal (20)
  const resTitles = [
    'Enfoque en la Máscara', 'Levantamiento de Paladar Blando', 'Paso por el Vestíbulo Laringeo', 'Twang Básico', 'Twang Brillante y Proyectado',
    'Sonido Cálido y Redondo', 'Resonancia Faríngea', 'Formantes de la Voz', 'Proyección sin Cuerdas Forzadas', 'Vocalización Abierta',
    'Impostación Vocal Básica', 'Color Metálico Limpio', 'Brillo en la Zona Media', 'Amplificación Natural', 'Voz de Pecho Resonante',
    'Conexión Faríngea Superior', 'Sorbete de Resonancia', 'Eliminación del Sonido Engolado', 'Voz Brillante sin Fatiga', 'Rey de la Resonancia'
  ];

  // Category 4: Agilidad Vocal y Melismas (20)
  const agilTitles = [
    'Primer Riff Vocal', 'Melisma de 3 Notas', 'Melisma de 5 Notas', 'Agilidad en Escala Pentatónica', 'Staccato Vocal Limpio',
    'Acentuación Ligera', 'Trinos Rápidos', 'Adornos en Arpegio', 'Escala Menor Rápida', 'Flidez en Cambios de Nota',
    'Velocidad Melódica I', 'Velocidad Melódica II', 'Articulación Ágil de Vocales', 'Riffs & Runs Estilo R&B', 'Acentos de Agilidad',
    'Independencia Laringea', 'Escalas de Agilidad Extrema', 'Precision en Pasajes Rápidos', 'Cascada de Notas Vocales', 'Maestro de Melismas'
  ];

  // Category 5: Tesitura y Extensión (20)
  const tesiTitles = [
    'Descubriendo mi Rango Vocal', 'Primer C4 Alcanzado', 'Llegando al C5 con Facilidad', 'Explorando Notas Graves', 'Conexión a Voz de Cabeza',
    'Transición Suave de Registro', 'Voz Mixta Inicial', 'Voz Mixta Potente', 'Dominio del Passaggio', 'Extensión de 1.5 Octavas',
    'Extensión de 2 Octavas', 'Extensión de 2.5 Octavas', 'Extensión de 3 Octavas', 'Silbido Vocal (Whistle Tone)', 'Resonancia Bája Profunda',
    'Paso Ligero a Falsete', 'Eliminación del Quiebre Vocal', 'Flexibilidad de Registros', 'Control Total del Passaggio', 'Vocalista de Extensión Titánica'
  ];

  // Category 6: Ritmo y Tiempo (20)
  const ritmTitles = [
    'Primer Pulso Sincronizado', 'Metrónomo Vocal 60 BPM', 'Metrónomo Vocal 90 BPM', 'Metrónomo Vocal 120 BPM', 'Canto en Compás de 4/4',
    'Canto en Compás de 3/4 (Vals)', 'Síncopa Vocal Básica', 'Síncopa Vocal Avanzada', 'Acentuación en Contratiempo', 'Entrada a Tiempo Limpia',
    'Ritmo de Cumbia y Pop', 'Ritmo de Rock y Ballad', 'Subdivisión de Corcheas', 'Subdivisión de Semicorcheas', 'Mantener el Tiempo a Capella',
    'Polirritmia Vocal Inicial', 'Precisión Rítmica de Silencios', 'Apertura Rítmica de Frases', 'Groove Vocal Inquebrantable', 'Reloj de Precisión Rítmica'
  ];

  // Category 7: Constancia y Racha (20)
  const rachTitles = [
    'Primer Día de Canto', 'Racha de 3 Días', 'Racha de 7 Días (Semana Completa)', 'Racha de 14 Días', 'Racha de 21 Días (Nuevo Hábito)',
    'Racha de 30 Días (Mes Ininterrumpido)', 'Racha de 50 Días', 'Racha de 75 Días', 'Racha de 100 Días (Leyenda Vocal)', 'Racha de 150 Días',
    'Racha de 200 Días', 'Madrugador Vocal (Práctica en la Mañana)', 'Cantante Nocturno', 'Fines de Semana de Canto', 'Práctica sin Faltar en Fiestas',
    'Constancia de Bronce', 'Constancia de Plata', 'Constancia de Oro', 'Constancia de Diamante', 'Guardián Definitivo de la Racha'
  ];

  // Category 8: Repertorio y Escenario (20)
  const repTitles = [
    'Primera Canción Cantada', 'Canción de Nivel Básico', 'Canción de Nivel Intermedio', 'Canción de Nivel Avanzado', 'Estudio de Karaoke I',
    'Estudio de Karaoke II', 'Interpretación Emotiva', 'Dominio de la Dinámica (Suave/Fuerte)', 'Crescendo y Decrescendo Vocal', 'Canto con Micrófono',
    'Postura Escénica Relajada', 'Expresión Facial Abierta', 'Dominio del Escenario', 'Memorización de Letra Completa', 'Canto a Capella Impecable',
    'Dueto Vocal Armónico', 'Versatilidad de Géneros Musicales', 'Canto con Pista Completa', 'Interpretación Memorable', 'Estrella Principal del Escenario'
  ];

  // Category 9: Salud Vocal (20)
  const saludTitles = [
    'Calentamiento Vocal Completo', 'Enfriamiento Vocal Post-Práctica', 'Hidratación Vocal Adecuada', 'Postura Alineada y Erguida', 'Relajación de Mandíbula',
    'Cuello Libre de Tensiones', 'Cero Fatiga tras Práctica', 'Higiene Vocal Diaria', 'Vocalización con Sorbete (SOVT)', 'Fonación en Tubo de Resonancia',
    'Masaje Laringeo de Descanso', 'Reposo Vocal Consciente', 'Prevención de Hiperfunción', 'Uso Correcto de la Voz Hablada', 'Voz Descansada y Fresca',
    'Garganta Hidratada siempre', 'Control de Humedad', 'Protector de Cuerdas Vocales', 'Conciencia Corporal Total', 'Maestro del Cuidado Vocal'
  ];

  // Category 10: Maestría Vocal (20)
  const maesTitles = [
    'Primeros 100 XP Acumulados', '500 XP Acumulados', '1000 XP Acumulados', '2500 XP Acumulados', '5000 XP Acumulados',
    '10,000 XP Acumulados', '25,000 XP Acumulados', '50,000 XP Acumulados', 'Primeras 5 Lecciones Completas', '15 Lecciones Completas',
    '30 Lecciones Completas', '50 Lecciones Completas', '100 Lecciones Completas', 'Nivel 5 Alcanzado', 'Nivel 10 Alcanzado',
    'Nivel 15 Alcanzado', 'Nivel 20 Alcanzado', 'Nivel 30 Alcanzado', 'Leyenda Suprema de La Clave', 'Canto Perfecto 200/200'
  ];

  const categoryConfigs: { cat: BadgeCategory; titles: string[]; iconNames: string[] }[] = [
    { cat: 'Respiración y Diafragma', titles: respTitles, iconNames: ['Clock', 'Flame', 'Sparkles', 'Award', 'CheckCircle2'] },
    { cat: 'Afinación y Solfeo', titles: afinTitles, iconNames: ['Music', 'Award', 'Sparkles', 'CheckCircle2'] },
    { cat: 'Resonancia y Color Vocal', titles: resTitles, iconNames: ['Sparkles', 'Award', 'Music'] },
    { cat: 'Agilidad Vocal y Melismas', titles: agilTitles, iconNames: ['Flame', 'Music', 'Sparkles'] },
    { cat: 'Tesitura y Extensión', titles: tesiTitles, iconNames: ['Award', 'Music', 'Flame'] },
    { cat: 'Ritmo y Tiempo', titles: ritmTitles, iconNames: ['Clock', 'CheckCircle2', 'Music'] },
    { cat: 'Constancia y Racha', titles: rachTitles, iconNames: ['Flame', 'Clock', 'Award'] },
    { cat: 'Repertorio y Escenario', titles: repTitles, iconNames: ['Award', 'Music', 'Sparkles'] },
    { cat: 'Salud Vocal', titles: saludTitles, iconNames: ['CheckCircle2', 'Clock', 'Sparkles'] },
    { cat: 'Maestría Vocal', titles: maesTitles, iconNames: ['Award', 'Flame', 'Sparkles', 'Music'] },
  ];

  let idCounter = 1;

  for (const group of categoryConfigs) {
    group.titles.forEach((title, idx) => {
      let maxVal = (idx + 1) * 10; // Default scaled fallback

      if (group.cat === 'Constancia y Racha') {
        const numMatch = title.match(/\d+/);
        maxVal = numMatch ? parseInt(numMatch[0], 10) : (idx === 0 ? 1 : (idx + 1) * 10);
      } else if (group.cat === 'Maestría Vocal') {
        const numMatch = title.match(/[\d,]+/);
        if (numMatch) {
          maxVal = parseInt(numMatch[0].replace(/,/g, ''), 10);
        } else {
          maxVal = (idx + 1) * 10; // Leyenda Suprema, Canto Perfecto
        }
      } else if (group.cat === 'Respiración y Diafragma' || group.cat === 'Salud Vocal') {
        // Tracks practiceMinutes
        maxVal = (idx + 1) * 30; 
      } else if (group.cat === 'Afinación y Solfeo') {
        // Tracks lessonsCompleted * 2
        maxVal = (idx + 1) * 10;
      } else {
        // General category tracking (lessons + minutes/3)
        maxVal = (idx + 1) * 15;
      }

      const icon = group.iconNames[idx % group.iconNames.length];

      badges.push({
        id: `badge_vocal_${idCounter}`,
        title: title,
        description: `Objetivo ${idCounter}: Ejercicio de ${group.cat.toLowerCase()} para perfeccionar la técnica vocal.`,
        category: group.cat,
        iconName: icon,
        unlocked: false,
        unlockedAt: undefined,
        progress: 0,
        maxProgress: maxVal,
      });

      idCounter++;
    });
  }

  return badges;
}

export const ALL_200_SINGING_BADGES: Badge[] = generate200SingingBadges();
