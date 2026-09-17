import { Unit, SolfegeNote, Song, DailyQuest, UserStats } from '../types';

export interface QuickScale {
  id: string;
  name: string;
  description: string;
  notes: { name: string; frequency: number; color: string }[];
}

export const QUICK_SCALES: QuickScale[] = [
  {
    id: 'c-major',
    name: 'Mayor (Do)',
    description: 'Escala diatónica fundamental de solfeo',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'RE', frequency: 293.66, color: '#f97316' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'FA', frequency: 349.23, color: '#22c55e' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'LA', frequency: 440.00, color: '#4338ca' },
      { name: 'SI', frequency: 493.88, color: '#8b5cf6' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
    ]
  },
  {
    id: 'pentatonic',
    name: 'Pentatónica',
    description: 'Ideal para improvisación y agilidad vocal',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'RE', frequency: 293.66, color: '#f97316' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'LA', frequency: 440.00, color: '#4338ca' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
    ]
  },
  {
    id: 'c-minor',
    name: 'Menor Natural',
    description: 'Sonoridad melancólica para expresión vocal',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'RE', frequency: 293.66, color: '#f97316' },
      { name: 'MIB', frequency: 311.13, color: '#a855f7' },
      { name: 'FA', frequency: 349.23, color: '#22c55e' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'LAB', frequency: 415.30, color: '#6366f1' },
      { name: 'SIB', frequency: 466.16, color: '#06b6d4' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
    ]
  },
  {
    id: 'arpeggio',
    name: 'Arpegio Mayor',
    description: 'Saltos interválicos para entonación limpia',
    notes: [
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'DO', frequency: 523.25, color: '#ec4899' },
      { name: 'SOL', frequency: 392.00, color: '#3b82f6' },
      { name: 'MI', frequency: 329.63, color: '#eab308' },
      { name: 'DO', frequency: 261.63, color: '#ef4444' },
    ]
  }
];

import { ALL_200_SINGING_BADGES } from './badgesData';

export const DEFAULT_BADGES = ALL_200_SINGING_BADGES;

export const INITIAL_USER_STATS: UserStats = {
  name: 'Alex',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  streak: 0,
  lives: 5,
  maxLives: 5,
  lastLifeLostAt: null,
  lifePurchaseCount: 0,
  hasUsedCourtesySong: false,
  level: 1,
  levelTitle: 'Vocalista Principiante',
  xp: 0,
  maxXP: 100,
  lessonsCompleted: 0,
  practiceMinutes: 0,
  badges: ALL_200_SINGING_BADGES,
  xpHistory: [
    { day: 'Lun', xp: 0 },
    { day: 'Mar', xp: 0 },
    { day: 'Mié', xp: 0 },
    { day: 'Jue', xp: 0 },
    { day: 'Vie', xp: 0 },
    { day: 'Sáb', xp: 0 },
    { day: 'Hoy', xp: 0 }
  ],
  recentLessons: []
};

export const INITIAL_UNITS: Unit[] = [
  {
    'id': 1,
    'title': 'Unidad 1: Respiración y Fisiología Vocal',
    'subtitle': 'Domina el apoyo diafragmático',
    'color': '#4648d4',
    'shadowColor': '#282a9e',
    'nodes': [
      {
        'id': 'u1-node1',
        'unitId': 1,
        'title': 'Introducción al Canto y Técnica Vocal',
        'subTitle': '10:15',
        'type': 'concept',
        'status': 'current',
        'iconName': 'Wind',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Descubre el camino del canto, los objetivos de este curso interactivo y cómo utilizar las herramientas para tu desarrollo vocal.',
        'youtubeId': '1q3ND4XPzIg',
        'duration': '10:15'
      },
      {
        'id': 'u1-node2',
        'unitId': 1,
        'title': 'Ejercicios de Respiración Guiada (Patrón Rítmico)',
        'subTitle': '12:30',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Práctica de respiración corta guiada. Observa el video e imita el patrón respiratorio. Se reproducirá en bucle 4 veces para asimilar la técnica.',
        'youtubeId': 'OL4G_0u-Yy4',
        'duration': '12:30',
        'loopCount': 4
      },
      {
        'id': 'u1-node3',
        'unitId': 1,
        'title': 'Ejercicios de Respiración Guiada (Capacidad Pulmonar)',
        'subTitle': '15:45',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 25,
        'xpReward': 30,
        'instructions': 'Rutina corta de respiración para aumentar la elasticidad y capacidad diafragmática. El video se repetirá en bucle 3 veces.',
        'youtubeId': 'BNln3ltV5Vg',
        'duration': '15:45',
        'loopCount': 3
      },
      {
        'id': 'u1-node4',
        'unitId': 1,
        'title': 'Anclaje Vocal Avanzado (5-5-10)',
        'subTitle': 'Resistencia Extrema para Cantantes',
        'type': 'control',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 15,
        'xpReward': 40,
        'instructions': 'Ejercicio del Globo: Inhala 5s, Retén 5s, Exhala 10s con anclaje intercostal profundo para resistencia extrema.',
        'duration': '5-5-10'
      },
      {
        'id': 'u1-node5',
        'unitId': 1,
        'title': 'Rutina Avanzada de Control de Aire',
        'subTitle': '14:05',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Ejercicios de resistencia para prolongar tu capacidad respiratoria y mantener la presión de aire de forma estable.',
        'youtubeId': 'gkUIJ2x79vU',
        'duration': '14:05',
        'loopCount': 1
      },
      {
        'id': 'u1-node6',
        'unitId': 1,
        'title': 'Ejercicios de Respiración Guiada (Apoyo y Estabilidad)',
        'subTitle': '11:10',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': -15,
        'xpReward': 30,
        'instructions': 'Rutina corta intensiva de respiración para fortalecer los músculos abdominales e intercostales de apoyo (2 repeticiones).',
        'youtubeId': 'dv97n1Hl0XM',
        'duration': '11:10',
        'loopCount': 2
      },
      {
        'id': 'u1-node7',
        'unitId': 1,
        'title': 'Fisiología Vocal y Funcionamiento de la Voz',
        'subTitle': '08:50',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': -25,
        'xpReward': 30,
        'instructions': 'Conoce cómo funcionan tus cuerdas vocales, la laringe y los resonadores. Al finalizar la clase, realizarás tu Diagnóstico Vocal Rápido para descubrir tu tipo de voz y personalizar toda la app a tu rango vocal.',
        'youtubeId': 'CR5fWk5qbCk',
        'duration': '08:50'
      },
      {
        'id': 'u1-node8',
        'unitId': 1,
        'title': 'Ejercicios de Afinación y Entonación',
        'subTitle': '13:20',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': -15,
        'xpReward': 30,
        'instructions': 'Entrenamiento auditivo y vocal para aprender a afinar notas individuales con precisión.',
        'youtubeId': 'hCqCiYE9OUY',
        'duration': '13:20'
      },
      {
        'id': 'u1-node9',
        'unitId': 1,
        'title': 'Calentamiento Vocal Básico',
        'subTitle': '16:15',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Prepara tus cuerdas vocales y resonadores para evitar fatigas utilizando técnicas de vibración de labios y fonación.',
        'youtubeId': '2t2sj8X1hVY',
        'duration': '16:15'
      },
      {
        'id': 'u1-node10',
        'unitId': 1,
        'title': 'Vocalización y Entonación con Vocales',
        'subTitle': '11:45',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Ejercicio práctico de vocalización para afinar notas e intervalos entonando con las vocales (A, E, I, O, U), manteniendo una colocación y resonancia vocal limpia.',
        'youtubeId': 'tHe_dL7ujW0',
        'duration': '11:45'
      },
      {
        'id': 'u1-node11',
        'unitId': 1,
        'title': 'Respiración Diafragmática Compleja',
        'subTitle': '18:30',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 25,
        'xpReward': 30,
        'instructions': 'Ejercicios avanzados de resistencia pulmonar y vocalización intensa con tiempos de retención y exhalación muy exigentes para maximizar la estabilidad y potencia vocal.',
        'youtubeId': 'v3dcyo4_Q8M',
        'duration': '18:30'
      },
      {
        'id': 'u1-node12',
        'unitId': 1,
        'title': 'Configuración de Cuerdas Vocales (Grosor y Registro)',
        'subTitle': '12:10',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Wind',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Aprende a adaptar tus cuerdas vocales para producir sonidos delgados (agudos) y gruesos (graves), preparándote para afinar con flexibilidad.',
        'youtubeId': 'u9EApwwRBa4',
        'duration': '12:10'
      },
      {
        'id': 'u1-node12.5',
        'unitId': 1,
        'title': 'Evaluación del Módulo 1 (Clases 1 a 12)',
        'subTitle': 'Evaluación del Módulo 1 (Clases 1 a 12)',
        'type': 'exam',
        'status': 'locked',
        'iconName': 'Trophy',
        'offsetPercentage': 0,
        'xpReward': 100,
        'instructions': 'Evaluación práctica de 7 preguntas para afianzar los conocimientos adquiridos en las primeras 12 clases sobre postura, respiración, fisiología vocal y configuración de cuerdas.',
        'youtubeId': '',
        'duration': '10:00'
      }
    ]
  },
  {
    'id': 2,
    'title': 'Unidad 2: Afinación y Oído Musical',
    'subtitle': 'Encuentra tu centro tonal',
    'color': '#059669',
    'shadowColor': '#047857',
    'nodes': [
      {
        'id': 'u2-node13',
        'unitId': 2,
        'title': 'Afinación de la Voz Hablada al Canto',
        'subTitle': '07:55',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Conecta la afinación de tu voz hablada con la voz cantada para lograr una entonación natural y afinada.',
        'youtubeId': 'Xxedcl77oK4',
        'duration': '07:55'
      },
      {
        'id': 'u2-node14',
        'unitId': 2,
        'title': 'Vocalización e Intervalos de Tercera',
        'subTitle': '13:40',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Ejercicios guiados de vocalización en intervalos de tercera para estructurar tu entonación básica.',
        'youtubeId': '-eY1k-DPP2c',
        'duration': '13:40'
      },
      {
        'id': 'u2-node15',
        'unitId': 2,
        'title': 'Entonación de Escalas Mayores',
        'subTitle': '10:50',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': 25,
        'xpReward': 30,
        'instructions': 'Aprende a entonar y afinar de forma consecutiva los pasos y notas de la escala mayor.',
        'youtubeId': 'n8s_8jXsxOU',
        'duration': '10:50'
      },
      {
        'id': 'u2-node16',
        'unitId': 2,
        'title': 'Control de Afinación con Metrónomo',
        'subTitle': '14:50',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Mantén el tono afinado y estable mientras te acoplas al compás rítmico de un metrónomo.',
        'youtubeId': 'GDbP8fVKpQM',
        'duration': '14:50'
      },
      {
        'id': 'u2-node17',
        'unitId': 2,
        'title': 'Dinámicas Vocales y Afinación',
        'subTitle': '12:45',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Aprende a controlar la afinación cantando piano (suave) y forte (fuerte) sin perder el apoyo de aire.',
        'youtubeId': 'YnB2y4Qc0xs',
        'duration': '12:45'
      },
      {
        'id': 'u2-node18',
        'unitId': 2,
        'title': 'Ejercicios de Vocalización Dinámica',
        'subTitle': '17:20',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': -15,
        'xpReward': 30,
        'instructions': 'Vocalizaciones y arpegios rápidos para agilizar la respuesta y afinación de tus cuerdas vocales.',
        'youtubeId': 'l-ohLa84uZE',
        'duration': '17:20'
      },
      {
        'id': 'u2-node19',
        'unitId': 2,
        'title': 'Estabilidad de Tono en Notas Largas',
        'subTitle': '11:30',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': -25,
        'xpReward': 30,
        'instructions': 'Ejercicios guiados para mantener notas sostenidas perfectamente estables y afinadas hasta el final.',
        'youtubeId': 'j6TPCq6CWGg',
        'duration': '11:30'
      },
      {
        'id': 'u2-node20',
        'unitId': 2,
        'title': 'Rutina Completa de Afinación y Oído',
        'subTitle': '13:10',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Mic2',
        'offsetPercentage': -15,
        'xpReward': 30,
        'instructions': 'Consolida tu oído musical con una rutina integral que desafía la afinación de diferentes intervalos.',
        'youtubeId': 'Kzlp8mnn2Mo',
        'duration': '13:10'
      },
      {
        'id': 'u2-node20.5',
        'unitId': 2,
        'title': 'Evaluación del Módulo 2 (Afinación)',
        'subTitle': 'Evaluación del Módulo 2 (Afinación)',
        'type': 'exam',
        'status': 'locked',
        'iconName': 'Trophy',
        'offsetPercentage': 0,
        'xpReward': 100,
        'instructions': 'Supera el nivel 1 de afinación en Modo Fácil afinando correctamente cada una de las 3 notas para certificar tu oído en esta unidad.',
        'youtubeId': '',
        'duration': '10:00'
      }
    ]
  },
  {
    'id': 3,
    'title': 'Unidad 3: Tempo y Coordinación',
    'subtitle': 'Domina el pulso rítmico',
    'color': '#d97706',
    'shadowColor': '#b45309',
    'nodes': [
      {
        'id': 'u3-node21',
        'unitId': 3,
        'title': 'Introducción al Tempo y Ritmo',
        'subTitle': '15:00',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Clock',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Aprende los conceptos básicos del tempo, velocidad, pulso musical y cómo coordinarlo con tu voz.',
        'youtubeId': 'IMeZnOpy6U4',
        'duration': '15:00'
      },
      {
        'id': 'u3-node22',
        'unitId': 3,
        'title': 'Figuras Musicales y Patrones Rítmicos',
        'subTitle': '12:20',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Clock',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Explora la duración de las figuras de tiempo (negras, corcheas) y practica la lectura y canto de patrones rítmicos.',
        'youtubeId': 'uv216ZjuTuY',
        'duration': '12:20'
      },
      {
        'id': 'u3-node23',
        'unitId': 3,
        'title': 'Thumb Dance Challenge - Coordinación Rítmica',
        'subTitle': '14:15',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Dumbbell',
        'offsetPercentage': 25,
        'xpReward': 30,
        'instructions': 'Un divertido desafío de juego táctil para coordinar el pulso visual de la pantalla con tus dedos al ritmo.',
        'youtubeId': '8LqsbbBrGDQ',
        'duration': '14:15'
      },
      {
        'id': 'u3-node24',
        'unitId': 3,
        'title': 'El Ritmo en la Interpretación del Cantante',
        'subTitle': '13:00',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Clock',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Explicación ampliada de cómo el ritmo influye en la frase musical, la dicción y la colocación del aire del cantante.',
        'youtubeId': 'eOlQLFrcenM',
        'duration': '13:00'
      },
      {
        'id': 'u3-node25',
        'unitId': 3,
        'title': 'Thumb Dance Challenge 2 - Desafío Avanzado',
        'subTitle': '10:40',
        'type': 'exercise',
        'status': 'locked',
        'iconName': 'Dumbbell',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Lleva tu coordinación al límite con un segundo desafío interactivo de ritmo táctil y visual.',
        'youtubeId': 'mWpFwlH3338',
        'duration': '10:40'
      },
      {
        'id': 'u3-node26',
        'unitId': 3,
        'title': 'Cantar con Pulso Estable y Oído Rítmico',
        'subTitle': '16:50',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Clock',
        'offsetPercentage': -15,
        'xpReward': 30,
        'instructions': 'Aprende técnicas para mantener un tempo estable a lo largo de una canción completa y entrenar tu oído rítmico.',
        'youtubeId': 'PxUqFigvv5U',
        'duration': '16:50'
      },
      {
        'id': 'u3-node27',
        'unitId': 3,
        'title': 'Sentir el Ritmo - Práctica con Cumbia',
        'subTitle': '14:40',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Clock',
        'offsetPercentage': -25,
        'xpReward': 30,
        'instructions': 'Video ejercicio práctico de sincronización y sabor rítmico utilizando una base musical de cumbia.',
        'youtubeId': 'HrskUXUwX9s',
        'duration': '14:40'
      },
      {
        'id': 'u3-node28',
        'unitId': 3,
        'title': 'Sincronización Rítmica con Repertorio',
        'subTitle': '17:10',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'Clock',
        'offsetPercentage': -15,
        'xpReward': 30,
        'instructions': 'Video ejercicio práctico para aplicar tu tempo estable cantando sobre una base de género diferente.',
        'youtubeId': 'Yxgf7IGDvow',
        'duration': '17:10'
      },
      {
        'id': 'u3-node28.5',
        'unitId': 3,
        'title': 'Evaluación del Módulo 3 (Tempo y Ritmo)',
        'subTitle': 'Evaluación del Módulo 3 (Tempo y Ritmo)',
        'type': 'exam',
        'status': 'locked',
        'iconName': 'Trophy',
        'offsetPercentage': 0,
        'xpReward': 100,
        'instructions': 'Evaluación práctica interactiva de sincronización rítmica y figuras musicales.',
        'youtubeId': '',
        'duration': '10:00'
      }
    ]
  },
  {
    'id': 4,
    'title': 'Unidad 4: Expresión, Dicción y Estilo',
    'subtitle': 'Agilidad y vibrato',
    'color': '#db2777',
    'shadowColor': '#be185d',
    'nodes': [
      {
        'id': 'u4-node29',
        'unitId': 4,
        'title': 'Agilidad Vocal, Velocidad y Precisión',
        'subTitle': '11:55',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'PlayCircle',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Aprende a interpretar pasajes melódicos veloces, melismas y notas rápidas con limpieza, ritmo y afinación.',
        'youtubeId': 'rIRqYcDqTIU',
        'duration': '11:55'
      },
      {
        'id': 'u4-node30',
        'unitId': 4,
        'title': 'El Vibrato como Recurso Expresivo',
        'subTitle': '06:40',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'PlayCircle',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Aprende a modular la laringe para generar un vibrato sano y libre de tensión, aplicándolo a tus canciones.',
        'youtubeId': 'DABqZ3yVmis',
        'duration': '06:40'
      },
      {
        'id': 'u4-node31',
        'unitId': 4,
        'title': 'Articulación y Dicción Vocal',
        'subTitle': '15:20',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'PlayCircle',
        'offsetPercentage': 25,
        'xpReward': 30,
        'instructions': 'Ejercicios de articulación (mandíbula, lengua y labios) para pronunciar con absoluta claridad cada palabra al cantar.',
        'youtubeId': '1htIT_p4KVU',
        'duration': '15:20'
      },
      {
        'id': 'u4-node32',
        'unitId': 4,
        'title': 'Resonancia y Coloratura de la Voz',
        'subTitle': '14:10',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'PlayCircle',
        'offsetPercentage': 15,
        'xpReward': 30,
        'instructions': 'Aprende a modificar la forma del tracto vocal y usar resonadores de pecho, boca y cabeza para enriquecer tu timbre vocal.',
        'youtubeId': '_TYaO9iDOcg',
        'duration': '14:10'
      },
      {
        'id': 'u4-node33',
        'unitId': 4,
        'title': 'Identidad Vocal y Conclusión del Curso',
        'subTitle': '18:00',
        'type': 'concept',
        'status': 'locked',
        'iconName': 'PlayCircle',
        'offsetPercentage': 0,
        'xpReward': 30,
        'instructions': 'Explora y define tu estilo propio, descubriendo si tu voz tiende a un sonido brillante, nasal u oscuro. ¡Felicidades por graduarte!',
        'youtubeId': 'kiwDw7Rkqqw',
        'duration': '18:00'
      },
      {
        'id': 'u4-node33.5',
        'unitId': 4,
        'title': 'Evaluación Final (Módulo 4)',
        'subTitle': 'Evaluación Final (Módulo 4)',
        'type': 'exam',
        'status': 'locked',
        'iconName': 'Trophy',
        'offsetPercentage': -15,
        'xpReward': 100,
        'instructions': 'Examen final del curso. Pon a prueba toda tu agilidad, dicción y resonancia.',
        'youtubeId': '',
        'duration': '15:00'
      }
    ]
  }
];

export const SOLFEGE_NOTES: SolfegeNote[] = [
  { name: 'DO', letter: 'C', frequency: 261.63, bgColor: '#ef4444', shadowColor: '#b91c1c' },
  { name: 'RE', letter: 'D', frequency: 293.66, bgColor: '#f97316', shadowColor: '#c2410c' },
  { name: 'MI', letter: 'E', frequency: 329.63, bgColor: '#eab308', shadowColor: '#a16207' },
  { name: 'FA', letter: 'F', frequency: 349.23, bgColor: '#22c55e', shadowColor: '#15803d' },
  { name: 'SOL', letter: 'G', frequency: 392.00, bgColor: '#3b82f6', shadowColor: '#1d4ed8' },
  { name: 'LA', letter: 'A', frequency: 440.00, bgColor: '#4338ca', shadowColor: '#312e81' },
  { name: 'SI', letter: 'B', frequency: 493.88, bgColor: '#8b5cf6', shadowColor: '#6d28d9' }
];

export const SONGS_DATABASE: Song[] = [
  {
    id: 'song-1',
    title: 'Cántale al Señor',
    artist: 'Worship Collective',
    category: 'Christian Music',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 180,
    lyrics: [
      { time: 0, text: 'Mi corazón entona esta canción...', noteTip: 'Inhala profundo con el diafragma' },
      { time: 5, text: 'Cántale al Señor', noteTip: 'Manten la nota LA en resonancia alta' },
      { time: 12, text: 'Toda la tierra, cante al Señor...', noteTip: 'Vibrato suave en las vocales finales' },
      { time: 18, text: 'Grande es el Señor y digno de suprema alabanza', noteTip: 'Apertura de paladar blando' },
      { time: 26, text: 'Su gloria llena la creación entera', noteTip: 'Proyección limpia en resonadores' }
    ]
  },
  {
    id: 'song-2',
    title: 'Afinación Vocal Diaria',
    artist: 'Academia La Clave',
    category: 'Calentamiento Vocal',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 120,
    lyrics: [
      { time: 0, text: 'Do - Re - Mi - Fa - Sol - La - Si - Do', noteTip: 'Subiendo la escala diatónica' },
      { time: 8, text: 'Do - Si - La - Sol - Fa - Mi - Re - Do', noteTip: 'Bajando con respiración sostenida' },
      { time: 16, text: 'Trino de labios en arpegio mayor', noteTip: 'Relaja la mandíbula y cuello' }
    ]
  },
  {
    id: 'song-3',
    title: 'Sublime Gracia',
    artist: 'Ensambles Vocales',
    category: 'Christian Music',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 150,
    lyrics: [
      { time: 0, text: 'Sublime gracia del Señor', noteTip: 'Tono cálido de pecho' },
      { time: 6, text: 'Que a un infeliz salvó', noteTip: 'Modulación hacia voz mixta' },
      { time: 12, text: 'Fui ciego mas hoy veo yo', noteTip: 'Sostener sostenuto limpio' }
    ]
  }
];

export const INITIAL_QUESTS: DailyQuest[] = [
  {
    id: 'quest-1',
    title: 'Afina 50 notas',
    progress: 0,
    max: 50,
    completed: false,
    xpReward: 50,
    iconType: 'note'
  },
  {
    id: 'quest-2',
    title: 'Practica 10 minutos',
    progress: 0,
    max: 10,
    completed: false,
    xpReward: 80,
    iconType: 'clock'
  },
  {
    id: 'quest-3',
    title: 'Completa 2 lecciones',
    progress: 0,
    max: 2,
    completed: false,
    xpReward: 100,
    iconType: 'book'
  }
];

export interface TheoryQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const VOCAL_THEORY_QUESTIONS: TheoryQuestion[] = [
  {
    id: 1,
    question: '¿Cuál es la postura corporal correcta para cantar?',
    options: [
      'Estar lo más rígido posible con los hombros levantados.',
      'Flexionar el cuello hacia adelante y encorvar la espalda.',
      'Hombros y piernas a la misma anchura con cuerpo relajado, sin tensión.',
      'Mantener los brazos cruzados y las rodillas bloqueadas.'
    ],
    correctAnswer: 2,
    explanation: 'Tener los hombros y las piernas a la misma anchura con el cuerpo relajado ayuda a cantar de forma cómoda y sin tensiones.'
  },
  {
    id: 2,
    question: '¿Qué tipo de respiración es fundamental en la técnica vocal?',
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
    question: '¿Cuáles son las zonas más comunes donde acumulamos tensión perjudicial para afinar?',
    options: [
      'La mandíbula, el cuello, la lengua y los hombros.',
      'Las rodillas y los talones de los pies.',
      'Los dedos de las manos y las muñecas.',
      'La espalda baja y los omóplatos únicamente.'
    ],
    correctAnswer: 0,
    explanation: 'La mandíbula, el cuello, la lengua y los hombros son los principales acumuladores de tensión vocal.'
  },
  {
    id: 4,
    question: 'Para cantar frases largas sin sentir que te falta el aire, ¿cómo debes respirar?',
    options: [
      'Empujando todo el aire con fuerza de golpe al iniciar.',
      'Reteniendo el aire en el pecho sin dejarlo salir.',
      'Respirando muy rápido después de cada palabra.',
      'Regulando el flujo de aire gastando solo el necesario sin tensar la garganta.'
    ],
    correctAnswer: 3,
    explanation: 'Dosificar y regular el aire gastando solo lo necesario y sin tensar la garganta te permite sostener notas largas con comodidad.'
  },
  {
    id: 5,
    question: 'Si durante el calentamiento sientes dolor o tensión en la garganta, ¿qué debes hacer?',
    options: [
      'Continuar con más fuerza para calentar rápido.',
      'Detenerte, relajar y hacer ejercicios más suaves como sirenas de labio.',
      'Tomar agua con hielo de inmediato.',
      'Forzar notas agudas para abrir la laringe.'
    ],
    correctAnswer: 1,
    explanation: 'El dolor o tensión es señal de sobrecarga. Detenerse y reiniciar con ejercicios suaves protege tu salud vocal.'
  },
  {
    id: 6,
    question: '¿Dónde se ubican exactamente las cuerdas (pliegues) vocales?',
    options: [
      'En el paladar blando, cerca de la campanilla.',
      'En la laringe, detrás del cartílago tiroides.',
      'Dentro de la tráquea, antes de los pulmones.',
      'En la cavidad nasal.'
    ],
    correctAnswer: 1,
    explanation: 'Las cuerdas vocales están protegidas dentro de la laringe, ubicadas horizontalmente detrás del cartílago tiroides.'
  },
  {
    id: 7,
    question: '¿Qué cambio experimentan las cuerdas vocales al cantar notas agudas?',
    options: [
      'Se vuelven más cortas, gruesas y vibran lentamente.',
      'Se separan por completo para dejar salir aire.',
      'Se estiran, se vuelven más delgadas y vibran mucho más rápido.',
      'Se endurecen como hueso sin vibrar.'
    ],
    correctAnswer: 2,
    explanation: 'Al cantar notas agudas, las cuerdas se estiran, afinan su masa vibrante y vibran a mayor frecuencia.'
  },
  {
    id: 8,
    question: '¿En qué consiste el "apoyo vocal"?',
    options: [
      'En contraer la garganta con firmeza hacia arriba.',
      'En la coordinación del diafragma y la faja abdominal para regular la salida de aire.',
      'En empujar todo el aire de golpe desde el pecho.',
      'En cantar apoyando la espalda en una pared rígida.'
    ],
    correctAnswer: 1,
    explanation: 'El apoyo vocal es la regulación activa y coordinada de la presión del aire por medio de la musculatura abdominal y el diafragma.'
  }
];
