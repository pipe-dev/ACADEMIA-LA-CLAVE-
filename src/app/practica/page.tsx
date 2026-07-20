"use client";

import { useState } from "react";
import { PracticaSearch } from "@/components/practica/practica-search";
import { PracticaPlayer } from "@/components/practica/practica-player";
import { TrackLyrics } from "@/lib/fetch-lyrics";
import { motion, AnimatePresence } from "framer-motion";

export default function PracticaPage() {
  const [selectedTrack, setSelectedTrack] = useState<{track: TrackLyrics, videoId: string} | null>(null);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedTrack ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            className="flex-1 flex flex-col justify-center"
          >
            <PracticaSearch 
              onTrackSelected={(track, videoId) => setSelectedTrack({ track, videoId })} 
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
