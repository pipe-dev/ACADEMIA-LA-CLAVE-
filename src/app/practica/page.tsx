"use client";

import { useState } from "react";
import { PracticaSearch } from "@/components/practica/practica-search";
import { PracticaPlayer } from "@/components/practica/practica-player";
import { TrackLyrics, fetchLyrics } from "@/lib/fetch-lyrics";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function PracticaPage() {
  const [selectedTrack, setSelectedTrack] = useState<{track: TrackLyrics, videoId: string} | null>(null);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  const handleTrackSelected = async (title: string, videoId: string) => {
    setIsFetchingLyrics(true);
    let track = await fetchLyrics(title);
    if (!track) {
      // Fallback si no hay lyrics
      track = {
        id: 0,
        trackName: title,
        artistName: "Desconocido",
        albumName: "",
        duration: 0,
        instrumental: true,
        plainLyrics: null,
        syncedLyrics: null,
        parsedLyrics: []
      };
    }
    setSelectedTrack({ track, videoId });
    setIsFetchingLyrics(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        {isFetchingLyrics ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 flex-col gap-4"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium animate-pulse">Preparando pista...</p>
          </motion.div>
        ) : !selectedTrack ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            className="flex-1 flex flex-col justify-center"
          >
            <PracticaSearch 
              onTrackSelected={handleTrackSelected} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <PracticaPlayer
              track={selectedTrack.track}
              videoId={selectedTrack.videoId}
              onClose={() => setSelectedTrack(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
