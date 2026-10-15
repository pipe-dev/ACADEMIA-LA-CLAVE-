'use client';
import React, { useState, useEffect } from 'react';
import { audioService } from '../../utils/audioService';

interface AcademiaWelcomeBannerProps {
  userName: string;
  streak: number;
  activeVocalRange: string | null;
  savedRangeData: any;
  zenMode?: boolean;
}

export const AcademiaWelcomeBanner: React.FC<AcademiaWelcomeBannerProps> = ({
  userName,
  streak,
  activeVocalRange,
  savedRangeData,
  zenMode = false
}) => {
  const [currentMsgIndex, setCurrentMsgIndex] = useState<number>(0);

  const subtextMessages = [
    {
      id: 'streak',
      text: (
        <>
          Tu racha de <strong className="font-semibold text-slate-800 dark:text-[#d3e4fe]">{streak} días</strong> está inspirando a otros. ¡Sigue así!
        </>
      )
    },
    ...(activeVocalRange
      ? [
          {
            id: 'range',
            text: (
              <>
                Tu rango actual es de <strong className="font-semibold text-[#4648d4] dark:text-[#c0c1ff]">{activeVocalRange}</strong> {savedRangeData ? `(${savedRangeData.noteMin} - ${savedRangeData.noteMax})` : ''}.
              </>
            )
          },
          {
            id: 'exercises',
            text: (
              <>
                Los ejercicios sugeridos están ajustados a la frecuencia de tu rango (<strong className="font-semibold text-emerald-600 dark:text-emerald-400">{activeVocalRange}</strong>).
              </>
            )
          }
        ]
      : [])
  ];

  useEffect(() => {
    if (subtextMessages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % subtextMessages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [subtextMessages.length]);

  const handleNextMessage = () => {
    if (subtextMessages.length <= 1) return;
    audioService.playClickSound();
    setCurrentMsgIndex((prev) => (prev + 1) % subtextMessages.length);
  };

  return (
    <section id="tour-academia-welcome" className="mb-2">
      <div
        onClick={handleNextMessage}
        className={`backdrop-blur-2xl p-5 sm:p-6 rounded-3xl relative overflow-hidden transition-all cursor-pointer active:scale-[0.98] select-none h-[112px] flex flex-col justify-center group ${
          zenMode
            ? 'bg-[#1f2125] border border-[#2e3138] shadow-[0px_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-[#ffffff] dark:bg-[#102034] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.05)] border border-white/80 dark:border-white/10 hover:shadow-[0px_12px_40px_0px_rgba(70,72,212,0.15)]'
        }`}
      >
        {!zenMode && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        )}

        <div className="relative z-10 space-y-1 max-w-[85%]">
          <h2
            className={`font-heading font-black text-lg sm:text-xl shrink-0 ${
              zenMode
                ? 'text-[#f0ebe1]'
                : 'bg-gradient-to-r from-[#4648d4] to-indigo-400 dark:from-indigo-300 dark:to-[#c0c1ff] bg-clip-text text-transparent'
            }`}
          >
            ¡Hola, {userName}!
          </h2>
          <div className="h-10 flex items-center overflow-hidden">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#a0b0c8] transition-opacity duration-300">
              {subtextMessages[currentMsgIndex]?.text}
            </p>
          </div>
        </div>

        {subtextMessages.length > 1 && (
          <div className="absolute right-4 bottom-4 flex gap-1 z-10">
            {subtextMessages.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentMsgIndex
                    ? 'bg-[#4648d4] dark:bg-[#818cf8] w-3'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
