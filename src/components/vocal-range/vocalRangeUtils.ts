import { VoiceClassification } from './vocalRangeTypes';

// Convert Hz to Musical Note name + Octave (e.g. 261.6 Hz -> C4 / Do4)
export function hzToNoteName(freq: number): { noteName: string; octave: number; fullName: string } {
  if (freq < 30) return { noteName: 'C', octave: 1, fullName: 'Do1' };
  
  const noteNamesEs = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const noteIdx = (midi % 12 + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNamesEs[noteIdx];
  
  return {
    noteName,
    octave,
    fullName: `${noteName}${octave}`
  };
}

// Determine Vocal Classification based on lowest and highest pitch in Hz and voice gender
export function classifyVoice(minHz: number, maxHz: number, gender: 'male' | 'female' = 'male'): VoiceClassification {
  if (gender === 'female') {
    // Canonical presets: Contralto (174-698 Hz), Mezzosoprano (220-880 Hz), Soprano (261-1046 Hz)
    if (minHz >= 240 || (maxHz >= 900 && minHz >= 195)) {
      return {
        classification: 'Soprano',
        description: 'Voz femenina brillante y aguda, con gran capacidad en el registro superior.',
        tips: [
          'Utiliza el apoyo abdominal constante para proyectar sobreagudos.',
          'Practica vocalizaciones ligadas sin tensionar el cuello.'
        ]
      };
    } else if (minHz <= 195 && maxHz < 800) {
      return {
        classification: 'Contralto',
        description: 'Voz femenina grave y profunda, de timbre oscuro, cálido y resonante.',
        tips: [
          'Aprovecha la sonoridad de tu registro de pecho.',
          'Mantén el diafragma relajado para dar cuerpo a las notas graves.'
        ]
      };
    } else {
      return {
        classification: 'Mezzosoprano',
        description: 'Voz femenina intermedia muy versátil, con graves cálidos y agudos expresivos.',
        tips: [
          'Desarrolla la voz mixta para transiciones suaves.',
          'Cuida la resonancia de pecho en pasajes medios.'
        ]
      };
    }
  } else {
    // Canonical presets: Bajo (82-330 Hz), Barítono (110-392 Hz), Tenor (130-523 Hz)
    if ((minHz <= 96 && maxHz <= 360) || (minHz < 90 && maxHz < 420)) {
      return {
        classification: 'Bajo',
        description: 'Voz masculina muy grave con graves profundos y resonantes en registro inferior.',
        tips: [
          'Mantén el diafragma relajado y profundo.',
          'Cuida la hidratación constante para proteger los pliegues vocales.'
        ]
      };
    } else if (minHz >= 120 || (maxHz >= 450 && minHz >= 105)) {
      return {
        classification: 'Tenor',
        description: 'Voz masculina aguda. Gran flexibilidad en tonos medios-altos y registro agudo.',
        tips: [
          'Mantén la mandíbula relajada en la zona de paso (Fa4 - Sol4).',
          'Usa el apoyo de aire para mantener agudos limpios.'
        ]
      };
    } else {
      return {
        classification: 'Barítono',
        description: 'La voz masculina más versátil. Equilibrio perfecto entre graves cálidos y medios potentes.',
        tips: [
          'Desarrolla la resonancia en la máscara para facilitar tonos medios sin fatiga.',
          'Evita empujar aire excesivo al buscar notas agudas.'
        ]
      };
    }
  }
}
