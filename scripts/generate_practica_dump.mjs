import fs from 'fs';
import path from 'path';

const FILES = [
  { path: 'src/components/PracticaView.tsx', cat: '1. UI y Escenario', desc: 'Orquestador principal con reset de fallback y initAudio previo a startPitchDetection' },
  { path: 'src/components/practica/PracticaCatalogView.tsx', cat: '1. UI y Escenario', desc: 'Catálogo de canciones con pestañas, carruseles de Apple Music y buscador' },
  { path: 'src/components/practica/KaraokeStageHero.tsx', cat: '1. UI y Escenario', desc: 'Escenario inmersivo con carátula flotante y letras karaoke de 3 líneas sincronizadas' },
  { path: 'src/components/practica/KaraokeControlsPanel.tsx', cat: '1. UI y Escenario', desc: 'Panel de controles flotante con sliders de volumen, voz original y micrófono' },
  { path: 'src/components/practica/polygraph-canvas.tsx', cat: '1. UI y Escenario', desc: 'Lienzo gráfico a 60 FPS con filtro anti-puntaje fantasma (dispersión < 0.85 semitonos)' },
  { path: 'src/components/practica/useKaraokeEngine.ts', cat: '2. Motores de Estado y Puntos', desc: 'Máquina de estados orquestadora con auto-recuperación de fallback cuando Web Audio está listo' },
  { path: 'src/components/practica/useKaraokeScoring.ts', cat: '2. Motores de Estado y Puntos', desc: 'Motor de evaluación de entonación, combos x1 a x4, racha y cálculo de 1 a 5 estrellas' },
  { path: 'src/hooks/use-vocal-remover.ts', cat: '3. Motor DSP y Afinación', desc: 'Motor DSP Linkwitz-Riley tri-banda con matriz Mid/Side diferencial (L=+Side, R=-Side), atenuación de sibilancia aguda al 20% (-14 dB) y crossover a 7.500 Hz' },
  { path: 'src/hooks/use-pitch-detection.ts', cat: '3. Motor DSP y Afinación', desc: 'Detector de afinación con punto dulce de Bleed Gate (preamp 2.6x, umbral 0.036-0.080, claridad 0.85) y apagado físico de hardware' },
  { path: 'src/utils/audioService.ts', cat: '3. Motor DSP y Afinación', desc: 'Arquitectura de doble motor Web Audio, sync de audioSession en auto con mic y playback sin mic, synthCompressor -0.5 dB y nivelación de volumen' },
  { path: 'src/utils/voicePlaybackService.ts', cat: '3. Motor DSP y Afinación', desc: 'Motor de reproducción de notas vocales reales con compensación en vivo vía subscribeMicActive, presence filter 1000 Hz (+4.5 dB), lowshelf 150 Hz (+3.0 dB) y limiter -0.2 dB' },
  { path: 'src/components/practica/KaraokeResultsModal.tsx', cat: '4. Modales de Usuario', desc: 'Modal de resultados finales, estrellas, XP ganado y audio playback de la grabación' },
  { path: 'src/components/practica/KaraokeExitConfirmModal.tsx', cat: '4. Modales de Usuario', desc: 'Modal de confirmación contra salidas accidentales de la canción en curso' },
  { path: 'src/components/practica/KaraokeLoadingOverlay.tsx', cat: '4. Modales de Usuario', desc: 'Pantalla de carga estilizada con barra de progreso y consejos vocales pedagógicos' },
  { path: 'src/components/practica/KaraokeNoLivesModal.tsx', cat: '4. Modales de Usuario', desc: 'Alerta y tienda de vidas cuando el alumno agota sus intentos' },
  { path: 'src/components/practica/VideoPickerModal.tsx', cat: '4. Modales de Usuario', desc: 'Selector de las 2 mejores versiones auditivas alternativas de YouTube' },
  { path: 'src/lib/fetch-lyrics.ts', cat: '5. Servicios y Algoritmos', desc: 'Cliente de sincronización de letras LRCLIB con caché en memoria v6' },
  { path: 'src/lib/fetch-top-tracks.ts', cat: '5. Servicios y Algoritmos', desc: 'Descarga y normalización de los 3 feeds RSS de Apple Music con caché en sessionStorage' },
  { path: 'src/components/practica/pickBestYtMatch.ts', cat: '5. Servicios y Algoritmos', desc: 'Heurística de selección léxica de las mejores versiones oficiales de YouTube' },
  { path: 'src/components/practica/songSearchRank.ts', cat: '5. Servicios y Algoritmos', desc: 'Algoritmo de clasificación y relevancia léxica de resultados de búsqueda' },
  { path: 'src/components/practica/getThumbUrl.ts', cat: '5. Servicios y Algoritmos', desc: 'Extractor y formateador de miniaturas de carátulas en alta resolución' },
  { path: 'src/components/practica/practicaTypes.ts', cat: '5. Servicios y Algoritmos', desc: 'Definición de tipos TypeScript para toda la suite de práctica y karaoke' },
  { path: 'src/app/api/yt-audio/route.ts', cat: '6. Endpoints Backend', desc: 'Extractor nativo puro JS multi-cliente (VisionOS, iOS, Android VR) con User-Agent sincronizado para erradicar 403 y falsos respaldos' },
  { path: 'src/app/api/lyrics/route.ts', cat: '6. Endpoints Backend', desc: 'Proxy backend de sincronización de letras LRCLIB y Genius' },
];

const artifactPath = 'C:\\Users\\dani3\\.gemini\\antigravity\\brain\\0954bdc3-ff3c-4727-900a-4c213b99be48\\codigo_completo_seccion_practica_karaoke.md';

let totalLines = 0;
const processedFiles = FILES.map((f, idx) => {
  const content = fs.readFileSync(f.path, 'utf-8');
  const lines = content.split('\n').length;
  totalLines += lines;
  const ext = path.extname(f.path).replace('.', '');
  const lang = ext === 'tsx' || ext === 'ts' ? ext : ext === 'js' ? 'javascript' : ext;
  const anchor = f.path.replace(/\//g, '-').replace(/\./g, '-').toLowerCase();
  return {
    ...f,
    index: idx + 1,
    lines,
    lang,
    content,
    anchor
  };
});

let out = `# Código Fuente Completo: Módulo de Práctica y Karaoke (AfinApp v1.0.57)\n\n`;
out += `> **Versión**: v1.0.57  \n`;
out += `> **Fecha de Exportación**: Noviembre 2026  \n`;
out += `> **Entorno**: Google Antigravity & Next.js 16 (Turbopack) / Cloudflare Workers  \n`;
out += `> **Arquitectura de Audio**: Cancelación Vocal Linkwitz-Riley Tri-Banda (115 Hz - 7.500 Hz) con Matriz Mid/Side Diferencial Simétrica (L = +Side, R = -Side, V - V = 0), Atenuación Dinámica de Sibilancia Aguda (> 7.500 Hz) al 20% (-14 dB a voz 0%), Filtro Peaking Reverb a 1.800 Hz (-18 dB) y Desbloqueo Automático de Fallback de YouTube.\n\n`;
out += `---\n\n`;
out += `## Índice General de Archivos\n\n`;
out += `| N° | Categoría | Archivo | Líneas | Descripción |\n`;
out += `|---|---|---|---|---|\n`;

for (const f of processedFiles) {
  out += `| ${f.index} | ${f.cat} | [\`${f.path}\`](#${f.anchor}) | ${f.lines} | ${f.desc} |\n`;
}

out += `\n> **Total de Líneas de Código**: ${totalLines} líneas en ${processedFiles.length} archivos fuente sin omitir ninguna línea.\n\n`;
out += `---\n\n`;

for (const f of processedFiles) {
  out += `## ${f.index}. ${f.path}\n\n`;
  out += `**Categoría:** ${f.cat}  \n`;
  out += `**Propósito:** ${f.desc}  \n`;
  out += `**Líneas:** ${f.lines}  \n\n`;
  out += `\`\`\`${f.lang}\n`;
  out += f.content;
  if (!f.content.endsWith('\n')) out += '\n';
  out += `\`\`\`\n\n`;
  out += `---\n\n`;
}

fs.writeFileSync(artifactPath, out, 'utf-8');
console.log(`Successfully generated artifact with ${totalLines} lines across ${processedFiles.length} files at ${artifactPath}`);
