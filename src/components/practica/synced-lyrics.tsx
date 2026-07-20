"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LyricLine } from "@/lib/fetch-lyrics";

interface SyncedLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export function SyncedLyrics({ lyrics, currentTime }: SyncedLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find the index of the currently active lyric line
  const activeIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  // Auto-scroll to keep active line centered
  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeIndex]);

  if (lyrics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
        Letras no disponibles para esta pista.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto hide-scrollbar px-6 py-32 space-y-8 text-center scroll-smooth relative z-10 mask-image-vertical"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)"
      }}
    >
      {lyrics.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;

        return (
          <motion.div
            key={idx}
            initial={false}
            animate={{
              opacity: isActive ? 1 : isPast ? 0.3 : 0.5,
              scale: isActive ? 1.1 : 1,
              color: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground))"
            }}
            transition={{ duration: 0.3 }}
            className={`text-3xl md:text-5xl font-bold tracking-tight transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]' : ''}`}
          >
            {line.text}
          </motion.div>
        );
      })}
    </div>
  );
}
