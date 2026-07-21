"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Music, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

interface PracticaSearchProps {
  onTrackSelected: (title: string, videoId: string) => void;
}

function cleanTitle(title: string): string {
  let cleaned = title;
  // Remove text inside brackets and parentheses
  cleaned = cleaned.replace(/\[.*?\]/g, "");
  cleaned = cleaned.replace(/\(.*?\)/g, "");
  // Remove common keywords
  const keywords = ["video oficial", "oficial", "karaoke", "instrumental", "letra", "lyrics", "version", "pista", "con voz", "sin voz", "official", "audio"];
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    cleaned = cleaned.replace(regex, "");
  }
  // Replace multiple spaces or dashes
  cleaned = cleaned.replace(/[-|]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned.trim();
}

export function PracticaSearch({ onTrackSelected }: PracticaSearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  
  const searchYoutube = async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Error fetching videos");
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al buscar las pistas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchYoutube(query + " karaoke");
  };

  useEffect(() => {
    searchYoutube("karaoke éxitos en español");
  }, []);

  const handleSelect = (video: YoutubeVideo) => {
    const cleaned = cleanTitle(video.title);
    onTrackSelected(cleaned, video.id);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Catálogo de Práctica</h2>
        <p className="text-muted-foreground text-lg">
          Busca cualquier canción para practicar con el afinador en vivo.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. Rayando el Sol Maná..."
            className="pl-12 h-14 text-lg rounded-full bg-background/50 backdrop-blur-sm border-primary/30 focus-visible:ring-primary shadow-sm"
            disabled={isLoading}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()} 
          className="h-14 px-8 rounded-full text-lg shadow-lg"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Music className="h-5 w-5 mr-2" />}
          {isLoading ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-destructive/10 text-destructive rounded-xl text-center max-w-2xl mx-auto">
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {videos.map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col gap-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all p-3"
              onClick={() => handleSelect(video)}
            >
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
                <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <PlayCircle className="text-white h-12 w-12 drop-shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors" title={video.title}>
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{video.channel}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
