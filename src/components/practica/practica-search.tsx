"use client";

import { useState } from "react";
import { Search, Loader2, Music, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchLyrics, TrackLyrics } from "@/lib/fetch-lyrics";
import { searchYoutubeTop3, YoutubeSearchResult } from "@/lib/search-youtube";
import { motion, AnimatePresence } from "framer-motion";

interface PracticaSearchProps {
  onTrackSelected: (track: TrackLyrics, videoId: string) => void;
}

export function PracticaSearch({ onTrackSelected }: PracticaSearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for the Top 3 selection step
  const [pendingTrack, setPendingTrack] = useState<TrackLyrics | null>(null);
  const [youtubeOptions, setYoutubeOptions] = useState<YoutubeSearchResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setPendingTrack(null);
    setYoutubeOptions([]);

    try {
      const track = await fetchLyrics(query);
      if (!track) {
        setError("No encontramos letras sincronizadas para esta canción.");
        setIsLoading(false);
        return;
      }

      const ytQuery = `${track.artistName} ${track.trackName}`;
      const videos = await searchYoutubeTop3(ytQuery);

      if (videos.length === 0) {
        setError("No pudimos encontrar la pista instrumental en YouTube.");
        setIsLoading(false);
        return;
      }

      setPendingTrack(track);
      setYoutubeOptions(videos);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al conectar con los servicios. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectVideo = (videoId: string) => {
    if (pendingTrack) {
      onTrackSelected(pendingTrack, videoId);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Catálogo de Práctica</h2>
        <p className="text-muted-foreground">
          Busca cualquier canción para practicar con el afinador en vivo y letras sincronizadas.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
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
          {isLoading ? "Buscando..." : "Cantar"}
        </Button>
      </form>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-destructive/10 text-destructive rounded-xl text-center">
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {youtubeOptions.length > 0 && pendingTrack && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-border/50"
          >
            <h3 className="text-lg font-medium text-center">
              Selecciona la mejor pista instrumental para: <span className="text-primary font-bold">{pendingTrack.trackName}</span>
            </h3>
            
            <div className="grid gap-4">
              {youtubeOptions.map((video, idx) => (
                <button
                  key={video.id}
                  onClick={() => selectVideo(video.id)}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="relative w-32 h-20 shrink-0 rounded-xl overflow-hidden bg-muted">
                    <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full" />
                    {idx === 0 && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                        <CheckCircle2 className="text-primary h-8 w-8 drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h4>
                    {idx === 0 && (
                      <p className="text-xs text-primary font-medium mt-1 uppercase tracking-wider">
                        Mejor Coincidencia
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
