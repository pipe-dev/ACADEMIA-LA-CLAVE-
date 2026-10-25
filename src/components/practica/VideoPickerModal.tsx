import React, { useState } from 'react';
import { X, Music, Youtube } from 'lucide-react';
import { audioService } from '../../utils/audioService';
import { YtSearchVideo } from './pickBestYtMatch';

interface VideoPickerModalProps {
  isOpen: boolean;
  options: YtSearchVideo[];
  track: { artist: string; title: string } | null;
  zenMode?: boolean;
  onSelect: (video: YtSearchVideo) => void;
  onClose: () => void;
}

/**
 * Picker de versiones: al abrir una canción que YouTube aún no tiene
 * cacheada, muestra las 2 mejores opciones encontradas y el usuario elige
 * con cuál estudiar. La elección queda cacheada para abrir directo la
 * próxima vez.
 */
export const VideoPickerModal: React.FC<VideoPickerModalProps> = ({
  isOpen,
  options,
  track,
  zenMode = false,
  onSelect,
  onClose
}) => {
  // mqdefault falló → intentamos con la mini del resultado; si también
  // falla → icono.
  const [mqFailed, setMqFailed] = useState<Set<number>>(new Set());
  const [apiFailed, setApiFailed] = useState<Set<number>>(new Set());

  if (!isOpen || options.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`rounded-3xl p-5 max-w-sm w-full space-y-3 border shadow-2xl ${
          zenMode
            ? 'bg-[#1f2125] border-[#2e3138]'
            : 'bg-white dark:bg-[#102034] border-slate-200 dark:border-[#1b2b3f]'
        }`}
      >
        {/* Header con X de cerrar pastilla */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-black text-lg text-slate-800 dark:text-white">
              ¿Cuál es tu canción?
            </h3>
            {track && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {track.artist} — {track.title}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              audioService.playClickSound();
              onClose();
            }}
            aria-label="Cerrar"
            className={`w-11 h-11 rounded-full flex items-center justify-center border shrink-0 transition-colors active:scale-90 ${
              zenMode
                ? 'bg-[#26292f] border-[#2e3138] text-rose-400'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {options.map((video, index) => {
          const thumbSrc = apiFailed.has(index)
            ? null
            : mqFailed.has(index)
              ? video.thumbnail || null
              : `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;

          return (
            <button
              key={`${video.id}-${index}`}
              onClick={() => {
                audioService.playClickSound();
                onSelect(video);
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all active:scale-98 ${
                zenMode
                  ? 'bg-[#26292f] border-[#383c44] active:bg-[#2e3138]'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/60 active:bg-slate-100'
              }`}
            >
              <div className="w-16 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative shadow-xs flex items-center justify-center">
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                    onError={() =>
                      mqFailed.has(index)
                        ? setApiFailed((prev) => new Set(prev).add(index))
                        : setMqFailed((prev) => new Set(prev).add(index))
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Youtube className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold text-slate-800 dark:text-white line-clamp-2">
                  {video.title}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {video.channel || 'YouTube'}
                </p>
              </div>

              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                <Music
                  className={`w-4 h-4 ${
                    zenMode ? 'text-[#f5d56b]' : 'text-indigo-500'
                  }`}
                />
              </div>
            </button>
          );
        })}

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
          ¿Ninguna es la correcta? Vuelve a intentarlo más tarde
        </p>
      </div>
    </div>
  );
};

export default VideoPickerModal;
