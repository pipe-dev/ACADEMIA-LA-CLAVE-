export type BreathingPhaseType = 'inhale' | 'hold_full' | 'exhale' | 'hold_empty';

export interface BreathingPhase {
  type: BreathingPhaseType;
  duration: number; // in seconds
  label: string;
  detail: string;
}

export interface BreathingTechnique {
  id: string;
  name: string;
  subtitle: string;
  category: 'Rehabilitación' | 'Control Vocal' | 'Relajación';
  description: string;
  instructions: string;
  phases: BreathingPhase[];
  targetCycles?: number;
}

export type BalloonColor = 'red' | 'blue' | 'purple' | 'emerald' | 'amber' | 'pink' | 'cyan';

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
    knotColor: 'bg-[#f59e0b]',
    bgCircle: 'bg-amber-400'
  }
];

export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'pursed-lips',
    name: 'Labios Fruncidos',
    subtitle: 'Rehabilitación Pulmonar y Presión Positiva',
    category: 'Rehabilitación',
    description: 'Inhala por la nariz y exhala por la boca con labios fruncidos como soplando suavemente una vela sin apagarla.',
    instructions: 'Genera presión de aire retrógrada para mantener abiertas las vías respiratorias y oxigenar al máximo.',
    targetCycles: 2,
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala por la nariz', detail: 'Siente cómo se expande tu abdomen' },
      { type: 'exhale', duration: 8, label: 'Exhala con labios fruncidos', detail: 'Sopla suavemente como hacia una vela' }
    ]
  },
  {
    id: 'siseo-15s',
    name: 'Ejercicio del Siseo ("S")',
    subtitle: 'Control de Apoyo y Aire Subglótico',
    category: 'Control Vocal',
    description: 'Emite un sonido de siseo "sssss..." constante y uniforme. Desarrolla resistencia en el diafragma.',
    instructions: 'Mantén el flujo de "S" lo más plano y parejo posible sin que tiemble.',
    targetCycles: 2,
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala diafragmático', detail: 'Aire profundo a la zona abdominal' },
      { type: 'exhale', duration: 15, label: 'Sisea "ssssssss..."', detail: 'Dosifica el aire de forma constante' }
    ]
  },
  {
    id: 'tech-478',
    name: 'Técnica 4-7-8 Adaptada',
    subtitle: 'Fortalecimiento Alveolar y Calma Vocal',
    category: 'Rehabilitación',
    description: 'Inhala en 4s, retén el aire 7s para intercambio de gases, y exhala con labios casi cerrados en 8s.',
    instructions: 'Obliga a los músculos espiratorios a trabajar con resistencia suave.',
    targetCycles: 3,
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala profundamente', detail: 'Aire por la nariz en 4 segundos' },
      { type: 'hold_full', duration: 7, label: 'Retén el aire', detail: 'Músculos relajados, alvéolos abiertos' },
      { type: 'exhale', duration: 8, label: 'Exhala con resistencia', detail: 'Labios en hendidura muy pequeña' }
    ]
  },
  {
    id: 'box-breathing',
    name: 'Respiración Cuadrada (4-4-4-4)',
    subtitle: 'Estabilidad Rítmica y Enfoque',
    category: 'Relajación',
    description: '4 tiempos iguales: Inhala, Retén, Exhala y Pausa al vacío. Equilibra el sistema nervioso.',
    instructions: 'Ritmo en 4 cuadrantes perfecto para antes de subir al escenario o cantar.',
    targetCycles: 4,
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala', detail: 'Expansión rítmica de 4s' },
      { type: 'hold_full', duration: 4, label: 'Retén con aire', detail: 'Pausa llena de 4s' },
      { type: 'exhale', duration: 4, label: 'Exhala', detail: 'Vaciado suave de 4s' },
      { type: 'hold_empty', duration: 4, label: 'Pausa sin aire', detail: 'Pausa vacía de 4s' }
    ]
  },
  {
    id: 'triangular',
    name: 'Respiración Triangular (3-6-6)',
    subtitle: 'Capacidad Pulmonar Progresiva',
    category: 'Rehabilitación',
    description: 'Inhalación rápida de 3s, retención sostenida de 6s y exhalación controlada de 6s.',
    instructions: 'Optimiza la elasticidad pulmonar y fortalece el diafragma.',
    targetCycles: 3,
    phases: [
      { type: 'inhale', duration: 3, label: 'Inhala en 3s', detail: 'Llenado diafragmático ágil' },
      { type: 'hold_full', duration: 6, label: 'Retén en 6s', detail: 'Mapeo de la presión interna' },
      { type: 'exhale', duration: 6, label: 'Exhala en 6s', detail: 'Desinflado uniforme' }
    ]
  },
  {
    id: 'anchorage-5510',
    name: 'Anclaje Vocal Avanzado (5-5-10)',
    subtitle: 'Resistencia Extrema para Cantantes',
    category: 'Control Vocal',
    description: '5s Inhala, 5s Retén, 10s Exhalación ultra-dosificada. Para fraseos largos sin fatiga.',
    instructions: 'Exhala manteniendo las costillas abiertas (anclaje intercostal).',
    targetCycles: 3,
    phases: [
      { type: 'inhale', duration: 5, label: 'Inhala en 5s', detail: 'Expansión intercostal profunda' },
      { type: 'hold_full', duration: 5, label: 'Retén en 5s', detail: 'Anclaje dorsal activo' },
      { type: 'exhale', duration: 10, label: 'Exhala en 10s', detail: 'Control de aire extremo' }
    ]
  }
];
