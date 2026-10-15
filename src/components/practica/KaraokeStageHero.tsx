import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Music2, CheckCircle2, FileText } from 'lucide-react';
import { CatalogTrack, ComboTextItem } from './practicaTypes';
import { LyricLine } from '../../lib/fetch-lyrics';

interface KaraokeStageHeroProps {
  selectedTrack: CatalogTrack;
  stageImageFailed: boolean;
  onStageImageError: () => void;
  comboTexts: ComboTextItem[];
  parsedLyrics: LyricLine[];
  activeLyricIndex: number;
  plainLyrics?: string | null;
  fallbackLyric: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  autoplayBlocked: boolean;
  isDetecting: boolean;
  noteName?: string;
  noteOctave?: number;
  zenMode?: boolean;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const KaraokeStageHero: React.FC<KaraokeStageHeroProps> = ({
  selectedTrack,
  stageImageFailed,
  onStageImageError,
  comboTexts,
  parsedLyrics,
  activeLyricIndex,
  plainLyrics,
  fallbackLyric,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  autoplayBlocked,
  isDetecting,
  noteName,
  noteOctave,
  zenMode = false
}) => {
  return (
    <div className="relative bg-slate-950 rounded-3xl overflow-hidden shadow-xl min-h-[380px] sm:min-h-[440px] p-5 flex flex-col justify-between border border-slate-200/50 dark:border-slate-800/80">
      {/* Imagen de Fondo con Mayor Visibilidad de la Carátula */}
      {selectedTrack.thumbnail && !stageImageFailed ? (
        <img
          src={selectedTrack.thumbnail}
          alt={selectedTrack.title}
          onError={onStageImageError}
          className={`absolute inset-0 w-full h-full object-cover opacity-80 filter blur-[0.5px] scale-105 ${
            zenMode ? 'grayscale contrast-110 brightness-90' : ''
          }`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`absolute inset-0 ${
            zenMode
              ? 'bg-gradient-to-br from-[#1a1c20] via-[#141619] to-[#0f1012]'
              : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-[#102034]'
          }`}
        />
      )}

      {/* Overlay Suave para que se Aprecie la Carátula Manteniendo Legibles las Letras */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/50 pointer-events-none" />

      {/* Notificaciones Flotantes de Combo */}
      <div className="absolute top-3 right-3 z-30 pointer-events-none flex flex-col items-end gap-1.5">
        <AnimatePresence>
          {comboTexts.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1.05 }}
              exit={{ opacity: 0, y: -14, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="font-heading font-black text-xs text-amber-300 bg-black/80 backdrop-blur-md border border-amber-400/80 px-2.5 py-0.5 rounded-full shadow-lg"
            >
              {c.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── ZONA CENTRAL: LETRAS SINCRONIZADAS O LETRA ESTÁTICA ─── */}
      <div className="relative z-10 my-auto py-2 text-center flex flex-col items-center justify-center space-y-2 w-full">
        {parsedLyrics.length > 0 ? (
          <div className="w-full max-w-md mx-auto space-y-2 px-1">
            {/* Línea Anterior */}
            <p className="text-xs sm:text-sm text-white/50 italic line-clamp-1 transition-all drop-shadow-sm">
              {activeLyricIndex > 0 ? parsedLyrics[activeLyricIndex - 1]?.text : '...'}
            </p>

            {/* Línea Actual Resaltada */}
            <div className="py-0.5">
              <motion.h4
                key={activeLyricIndex}
                initial={{ scale: 0.94, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="font-heading font-black text-lg sm:text-xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-snug tracking-wide"
              >
                "{activeLyricIndex >= 0 ? parsedLyrics[activeLyricIndex]?.text : 'Prepárate para cantar...'}"
              </motion.h4>
            </div>

            {/* Línea Siguiente */}
            <p className="text-xs sm:text-sm text-white/50 italic line-clamp-1 transition-all drop-shadow-sm">
              {activeLyricIndex < parsedLyrics.length - 1 ? parsedLyrics[activeLyricIndex + 1]?.text : '—'}
            </p>
          </div>
        ) : plainLyrics ? (
          /* ─── MODO LETRA ESTÁTICA SCROLLEABLE ─── */
          <div className="w-full max-w-sm mx-auto flex flex-col items-center px-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-black/60 backdrop-blur-md border border-indigo-400/40 text-indigo-200 text-[11px] font-heading font-black tracking-wide shadow-sm">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Letra Completa</span>
              <span className="text-white/60 font-normal">• Sigue las notas en pantalla</span>
            </div>
            <div className="w-full max-h-36 sm:max-h-44 overflow-y-auto px-4 py-2.5 rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 shadow-inner text-center space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full select-text">
              <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed whitespace-pre-line">
                {plainLyrics}
              </p>
            </div>
          </div>
        ) : (
          /* ─── PISTA PURAMENTE INSTRUMENTAL O SIN LETRA ─── */
          <div className="py-2 space-y-1.5 px-3 max-w-xs mx-auto">
            <Music2 className="w-6 h-6 text-indigo-300 mx-auto animate-bounce" />
            <p className="text-xs sm:text-sm font-heading font-bold text-white drop-shadow-md">
              {fallbackLyric}
            </p>
            <p className="text-[10px] text-white/60">Pista instrumental — Sigue el ritmo y las notas</p>
          </div>
        )}
      </div>

      {/* Fila Inferior: Información del Tema y Botón de Play 3D */}
      <div className="relative z-10 flex items-end justify-between gap-3 pt-2">
        <div className="space-y-1 min-w-0 max-w-[72%]">
          <h3 className="font-heading font-black text-white text-base sm:text-lg leading-snug drop-shadow-md truncate">
            {selectedTrack.title}
          </h3>
          <p className="text-xs text-slate-300 font-medium truncate">
            {selectedTrack.artist}
          </p>
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-white font-bold border border-white/10">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            {isDetecting && noteName && (
              <span className="text-[10px] bg-emerald-500/90 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                {noteName}{noteOctave}
              </span>
            )}
          </div>
        </div>

        {/* Botón Circular 3D de Play/Pausa */}
        <div className="relative flex flex-col items-center">
          <button
            onClick={onTogglePlay}
            className="organic-shape w-14 h-14 bg-[#4648d4] text-white flex items-center justify-center press-effect transition-all cursor-pointer shadow-[0_5px_0_0_#282a9e] group border-2 border-white/30 shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white ml-0 group-active:scale-90 transition-transform" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5 group-active:scale-90 transition-transform" />
            )}
          </button>
          {autoplayBlocked && !isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute -top-7 right-0 whitespace-nowrap bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse pointer-events-none"
            >
              <span>▶ Tocar para iniciar</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
