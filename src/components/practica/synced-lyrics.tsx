"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LyricLine } from "@/lib/fetch-lyrics";

interface SyncedLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export function SyncedLyrics({ lyrics, currentTime }: SyncedLyricsProps) {
  const activeIndex = useMemo(() => {
    return lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
  }, [lyrics, currentTime]);

  if (lyrics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full w-full text-muted-foreground">
        Letras no disponibles para esta pista.
      </div>
    );
  }

  // Filtrar estrictamente para tener 3 líneas: la anterior, la actual y la siguiente
  const visibleLines = lyrics
    .map((line, idx) => ({ ...line, originalIndex: idx }))
    .filter(line => {
      // Si no hay línea activa, mostramos las primeras 3
      if (activeIndex === -1) return line.originalIndex < 3;
      return Math.abs(line.originalIndex - activeIndex) <= 1;
    });

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full h-full relative z-10 px-6 overflow-hidden mask-image-vertical"
         style={{
           maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
           WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)"
         }}>
      <div className="w-full max-w-2xl flex flex-col items-center justify-center relative">
        <AnimatePresence mode="sync">
          {visibleLines.map((line) => {
            const isActive = line.originalIndex === activeIndex;

            return (
              <motion.div
                key={line.time.toString() + line.text}
                layout
                initial={{ opacity: 0, y: 20, height: 0, scale: 0.95 }}
                animate={{
                  opacity: isActive ? 1 : 0.3,
                  y: 0,
                  height: "auto",
                  scale: isActive ? 1.05 : 1
                }}
                exit={{ opacity: 0, y: -20, height: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight origin-center py-3 text-center w-full overflow-hidden ${isActive ? 'text-white drop-shadow-md' : 'text-white/80'}`}
              >
                {line.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
