'use client';
import React from 'react';
import { ArrowLeft, RotateCw, RotateCcw, Play, Pause } from 'lucide-react';

interface VideoPlayerControlsProps {
  title: string;
  isPlaying: boolean;
  showControls: boolean;
  currentTime: number;
  duration: number;
  currentLoop: number;
  targetLoopCount: number;
  onTogglePlay: (e?: React.MouseEvent | React.TouchEvent) => void;
  onSeekBackward: (e: React.MouseEvent) => void;
  onSeekForward: (e: React.MouseEvent) => void;
  onSeekChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackClick: (e: React.MouseEvent) => void;
}

export const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  title,
  isPlaying,
  showControls,
  currentTime,
  duration,
  currentLoop,
  targetLoopCount,
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  onSeekChange,
  onBackClick
}) => {
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Top Header Bar */}
      <div
        className={`absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-30 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2.5 md:gap-3.5 pointer-events-auto">
          <button
            onClick={onBackClick}
            className="organic-shape w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-white cursor-pointer transition-all duration-300 press-effect hover:scale-105 shrink-0"
            style={{
              backgroundColor: '#ef4444',
              boxShadow: '0 4px 0 0 #b91c1c'
            }}
            title="Salir al mapa de la Academia"
          >
            <ArrowLeft className="w-5 h-5 md:w-7 md:h-7" strokeWidth={3} />
          </button>

          <div className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-lg max-w-[170px] sm:max-w-xs md:max-w-md">
            <span className="text-[9px] md:text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest block leading-none">
              Lección Actual
            </span>
            <h4 className="text-xs md:text-sm font-black text-white truncate drop-shadow-sm mt-0.5">
              {title}
            </h4>
          </div>
        </div>

        {targetLoopCount > 1 && (
          <div className="pointer-events-auto bg-indigo-600/90 backdrop-blur-md border border-indigo-300/40 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-lg flex items-center gap-1.5 text-white shrink-0">
            <RotateCw className="w-3.5 h-3.5 text-indigo-200" />
            <span className="text-[10px] md:text-xs font-black tracking-wide">
              Bucle {currentLoop}/{targetLoopCount}
            </span>
          </div>
        )}
      </div>

      {/* Karaoke Center Controls */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 ${
          showControls || !isPlaying
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-surface-container-high/30 dark:bg-slate-800/40 rounded-[2rem] p-4 md:p-8 flex items-center justify-center gap-6 md:gap-12 backdrop-blur-xs">
          <button
            onClick={onSeekBackward}
            className="organic-shape w-14 h-14 md:w-28 md:h-28 bg-surface-container-high dark:bg-slate-800 text-slate-700 dark:text-[#c0c1ff] flex items-center justify-center press-effect transition-all duration-300 shadow-[0_4px_0_0_#c7c4d7] md:shadow-[0_8px_0_0_#c7c4d7] dark:shadow-[0_4px_0_0_#1b2b3f] dark:md:shadow-[0_8px_0_0_#1b2b3f] cursor-pointer"
            title="Retroceder 10s"
          >
            <RotateCcw className="w-6 h-6 md:w-12 md:h-12 stroke-[2.5]" />
          </button>

          <button
            onClick={onTogglePlay}
            className="organic-shape w-20 h-20 md:w-40 md:h-40 bg-[#4648d4] text-white flex items-center justify-center press-effect transition-all duration-300 shadow-[0_7px_0_0_#282a9e] md:shadow-[0_12px_0_0_#282a9e] group cursor-pointer"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 md:w-16 md:h-16 fill-white group-active:scale-90 transition-transform" />
            ) : (
              <Play className="w-8 h-8 md:w-16 md:h-16 fill-white ml-1 md:ml-3 group-active:scale-90 transition-transform" />
            )}
          </button>

          <button
            onClick={onSeekForward}
            className="organic-shape w-14 h-14 md:w-28 md:h-28 bg-surface-container-high dark:bg-slate-800 text-slate-700 dark:text-[#c0c1ff] flex items-center justify-center press-effect transition-all duration-300 shadow-[0_4px_0_0_#c7c4d7] md:shadow-[0_8px_0_0_#c7c4d7] dark:shadow-[0_4px_0_0_#1b2b3f] dark:md:shadow-[0_8px_0_0_#1b2b3f] cursor-pointer"
            title="Adelantar 10s"
          >
            <RotateCw className="w-6 h-6 md:w-12 md:h-12 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Custom Bottom Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <span className="text-white text-[10px] md:text-xs font-bold font-mono w-8 md:w-10 drop-shadow-md">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={onSeekChange}
            className="flex-1 h-1.5 md:h-2 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 md:[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-3 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4648d4] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg cursor-pointer transition-all hover:[&::-webkit-slider-thumb]:scale-125"
          />
          <span className="text-white text-[10px] md:text-xs font-bold font-mono w-8 md:w-10 text-right drop-shadow-md">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </>
  );
};
