"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface CatalogTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface PracticaSearchProps {
  onTrackSelected: (title: string, videoId: string) => void;
}

const RECOMMENDED_TRACKS: CatalogTrack[] = [
  { id: "r1", title: "La Incondicional", artist: "Luis Miguel", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/27/56/16/275616ef-8e2f-4b5c-7c6f-87bbe5b81314/mzi.vdosoaak.jpg/600x600bb.jpg" },
  { id: "r2", title: "Rayando el Sol", artist: "Maná", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b2/27/d8/b227d8b8-21c2-79f4-18ef-4e90f281f965/s06.gqkqqnvt.jpg/600x600bb.jpg" },
  { id: "r3", title: "Mientes Tan Bien", artist: "Sin Bandera", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/52/05/bc/5205bc20-2e70-7e86-cbaf-2796191a9644/mzi.fkqxcawi.jpg/600x600bb.jpg" },
  { id: "r4", title: "Bulería", artist: "David Bisbal", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/23/53/c6/2353c6df-0385-a214-8412-f4e81bac595a/00602547824585.rgb.jpg/600x600bb.jpg" },
  { id: "r5", title: "En Cambio No", artist: "Laura Pausini", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/a1/4d/cf/a14dcf3c-0bfb-146b-3afd-b8c965d06af5/mzi.sdhqplhz.jpg/600x600bb.jpg" },
  { id: "r6", title: "Sálvame", artist: "RBD", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/bf/be/1a/bfbe1a54-27f9-7609-6572-c7feec96094d/20UMGIM74536.rgb.jpg/600x600bb.jpg" },
  { id: "r7", title: "Héroe", artist: "Enrique Iglesias", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3c/9c/03/3c9c03b1-e67f-f78d-7c8a-a8344b603679/06UMGIM39481.rgb.jpg/600x600bb.jpg" },
  { id: "r8", title: "Noviembre Sin Ti", artist: "Reik", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/fd/22/aa/fd22aa0f-42cb-c4ce-3140-1318e134c3ee/mzi.uahtvkpr.jpg/600x600bb.jpg" },
  { id: "r9", title: "El Triste", artist: "José José", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/27/a3/52/27a352ab-94f4-5f40-302a-063a56cf9e24/884977464606.jpg/600x600bb.jpg" },
  { id: "r10", title: "Corazón Partío", artist: "Alejandro Sanz", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/ca/ed/05/caed05f6-4bc5-5cd1-86ab-d1ebbeccffcb/825646199859.jpg/600x600bb.jpg" },
  { id: "r11", title: "Creo en Ti", artist: "Reik", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/af/6c/4aaf6cce-22bc-a270-f131-ab7709ec4ba1/886443196924.jpg/600x600bb.jpg" },
  { id: "r12", title: "A Puro Dolor", artist: "Son By Four", thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music/83/87/4a/mzi.qjymohzf.jpg/600x600bb.jpg" },
  { id: "r13", title: "Mi Historia Entre Tus Dedos", artist: "Gianluca Grignani", thumbnail: "" },
  { id: "r14", title: "Mariposa Traicionera", artist: "Maná", thumbnail: "" },
  { id: "r15", title: "Lamento Boliviano", artist: "Enanitos Verdes", thumbnail: "" },
  { id: "r16", title: "De Música Ligera", artist: "Soda Stereo", thumbnail: "" },
  { id: "r17", title: "Tu Cárcel", artist: "Los Bukis", thumbnail: "" },
  { id: "r18", title: "Hasta Que Te Conocí", artist: "Juan Gabriel", thumbnail: "" },
  { id: "r19", title: "Así Fue", artist: "Juan Gabriel", thumbnail: "" },
  { id: "r20", title: "Afuera", artist: "Caifanes", thumbnail: "" },
  { id: "r21", title: "Oye Mi Amor", artist: "Maná", thumbnail: "" },
  { id: "r22", title: "Color Esperanza", artist: "Diego Torres", thumbnail: "" },
  { id: "r23", title: "Amor Eterno", artist: "Rocío Dúrcal", thumbnail: "" },
  { id: "r24", title: "El Rey", artist: "Vicente Fernández", thumbnail: "" },
  { id: "r25", title: "Culpable O No", artist: "Luis Miguel", thumbnail: "" },
  { id: "r26", title: "Vivir Mi Vida", artist: "Marc Anthony", thumbnail: "" },
  { id: "r27", title: "Bésame Mucho", artist: "Consuelo Velázquez", thumbnail: "" },
  { id: "r28", title: "Me Dediqué A Perderte", artist: "Alejandro Fernández", thumbnail: "" },
  { id: "r29", title: "Ahora Quién", artist: "Marc Anthony", thumbnail: "" },
  { id: "r30", title: "No Me Doy Por Vencido", artist: "Luis Fonsi", thumbnail: "" },
  { id: "r31", title: "La Camisa Negra", artist: "Juanes", thumbnail: "" },
  { id: "r32", title: "A Dios Le Pido", artist: "Juanes", thumbnail: "" },
  { id: "r33", title: "Mientes", artist: "Camila", thumbnail: "" },
  { id: "r34", title: "Todo Cambió", artist: "Camila", thumbnail: "" },
  { id: "r35", title: "Kilómetros", artist: "Sin Bandera", thumbnail: "" },
  { id: "r36", title: "Entra En Mi Vida", artist: "Sin Bandera", thumbnail: "" },
  { id: "r37", title: "Suavemente", artist: "Elvis Crespo", thumbnail: "" },
  { id: "r38", title: "Despacito", artist: "Luis Fonsi", thumbnail: "" },
  { id: "r39", title: "Burbujas De Amor", artist: "Juan Luis Guerra", thumbnail: "" },
  { id: "r40", title: "Ojalá Que Llueva Café", artist: "Juan Luis Guerra", thumbnail: "" },
  { id: "r41", title: "Bachata Rosa", artist: "Juan Luis Guerra", thumbnail: "" },
  { id: "r42", title: "El Sol No Regresa", artist: "La Quinta Estación", thumbnail: "" },
  { id: "r43", title: "Me Muero", artist: "La Quinta Estación", thumbnail: "" },
  { id: "r44", title: "Rosas", artist: "La Oreja de Van Gogh", thumbnail: "" },
  { id: "r45", title: "Jueves", artist: "La Oreja de Van Gogh", thumbnail: "" },
  { id: "r46", title: "Sin Miedo A Nada", artist: "Alex Ubago", thumbnail: "" },
  { id: "r47", title: "Aunque No Te Pueda Ver", artist: "Alex Ubago", thumbnail: "" },
  { id: "r48", title: "Bendita Tu Luz", artist: "Maná", thumbnail: "" },
  { id: "r49", title: "Labios Compartidos", artist: "Maná", thumbnail: "" },
  { id: "r50", title: "Por Mujeres Como Tú", artist: "Pepe Aguilar", thumbnail: "" }
];


export function PracticaSearch({ onTrackSelected }: PracticaSearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [displayRecommendations, setDisplayRecommendations] = useState<CatalogTrack[]>([]);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  useEffect(() => {
    const shuffled = [...RECOMMENDED_TRACKS].sort(() => 0.5 - Math.random());
    setDisplayRecommendations(shuffled.slice(0, 8));
  }, []);
  
  const searchItunes = async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/itunes-search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Error fetching tracks");
      const data = await res.json();
      setTracks(data);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al buscar las pistas.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChristianCatalog = async () => {
    setIsLoading(true);
    setError(null);
    setQuery("Catálogo Cristiano");
    
    const christianArtists = [
      "Jesus Adrian Romero", "Marcela Gandara", "Tercer Cielo", 
      "Alex Campos", "Lilly Goodman", "Miel San Marcos", 
      "Grupo Barak", "Redimi2", "Marcos Witt", 
      "Christine D'Clario", "Julio Melgar", "Elevation Worship Español", 
      "Hillsong en Español", "Bethel Music en Español", "Bethel en Español",
      "Marco Barrientos", "Danilo Montero"
    ];

    try {
      // Elegir 3 artistas aleatorios para dar variedad en cada click
      const shuffledArtists = [...christianArtists].sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const responses = await Promise.all(
        shuffledArtists.map(artist => fetch(`/api/itunes-search?q=${encodeURIComponent(artist)}`))
      );
      
      let allTracks: CatalogTrack[] = [];
      for (const res of responses) {
        if (res.ok) {
          const data: CatalogTrack[] = await res.json();
          // Tomar las top 4 canciones más populares de cada uno de esos 3 artistas
          allTracks = [...allTracks, ...data.slice(0, 4)];
        }
      }
      
      // Mezclarlas para que no salgan agrupadas por artista
      const shuffledTracks = allTracks.sort(() => 0.5 - Math.random());
      setTracks(shuffledTracks);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al cargar el catálogo cristiano.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchItunes(query);
  };

  const handleSelect = async (track: CatalogTrack) => {
    if (loadingTrackId) return; // Prevent double clicks
    
    setLoadingTrackId(track.id);
    setError(null);
    
    try {
      // Buscar en YouTube de forma silenciosa. "audio" nos da versiones oficiales o "Topic" channels
      const ytQuery = `${track.artist} ${track.title} audio`;
      const cacheKey = `yt_search_${ytQuery}`;
      
      if (typeof window !== 'undefined') {
        const cachedVideoId = localStorage.getItem(cacheKey);
        if (cachedVideoId) {
          const fullTitle = `${track.artist} - ${track.title}`;
          onTrackSelected(fullTitle, cachedVideoId);
          return;
        }
      }

      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(ytQuery)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const videoId = data[0].id;
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, videoId);
          }
          const fullTitle = `${track.artist} - ${track.title}`;
          onTrackSelected(fullTitle, videoId);
          return;
        }
      }
      
      setError(`No pudimos encontrar el audio de "${track.title}".`);
    } catch (err) {
      console.error("Error linking to YouTube:", err);
      setError("Hubo un error conectando con el motor de audio.");
    } finally {
      setLoadingTrackId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Catálogo de Práctica</h2>
        <p className="text-muted-foreground text-lg opacity-60">
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
            className="pl-12 h-14 text-lg rounded-full bg-background/50 backdrop-blur-sm border-primary/30 focus-visible:ring-primary shadow-sm placeholder:opacity-60"
            disabled={isLoading || loadingTrackId !== null}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim() || loadingTrackId !== null} 
          className="h-14 px-8 rounded-full text-lg shadow-lg"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isLoading ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {/* Filtros Rápidos */}
      <div className="flex justify-center max-w-2xl mx-auto -mt-2">
        <Button
          type="button"
          onClick={fetchChristianCatalog}
          disabled={isLoading || loadingTrackId !== null}
          className="bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse transition-all duration-300 rounded-full px-6 h-10 font-medium"
          style={{ animationDuration: '3s' }}
        >
          Música cristiana
        </Button>
      </div>


      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-destructive/10 text-destructive rounded-xl text-center max-w-2xl mx-auto">
          {error}
        </motion.div>
      )}

      {!isLoading && !error && tracks.length === 0 && query.trim() !== "" && (
        <div className="p-8 text-center text-muted-foreground bg-card/30 rounded-2xl border border-border/50 max-w-md mx-auto">
          No se encontraron canciones. Intenta con otra búsqueda.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="region" aria-label="Resultados de búsqueda">
        <AnimatePresence>
          {(tracks.length > 0 ? tracks : (query.trim() === "" ? displayRecommendations : [])).map((track, i) => (
            <motion.div
              key={`${track.id}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role="button"
              tabIndex={0}
              aria-label={`Seleccionar canción: ${track.title}`}
              className={`group relative flex flex-col gap-3 rounded-2xl bg-card border border-border/50 overflow-hidden cursor-pointer shadow-sm transition-all p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${loadingTrackId === track.id ? 'opacity-70 pointer-events-none' : ''}`}
              onClick={() => handleSelect(track)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(track);
                }
              }}
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt={track.title} className="object-cover w-full h-full transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <PlayCircle className="h-12 w-12 text-white/20" />
                  </div>
                )}
                
                <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center backdrop-blur-[2px] ${loadingTrackId === track.id ? 'opacity-100' : 'opacity-0'}`}>
                  {loadingTrackId === track.id ? (
                    <Loader2 className="text-white h-12 w-12 drop-shadow-lg animate-spin" />
                  ) : (
                    <PlayCircle className="text-white h-12 w-12 drop-shadow-lg" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 px-1 mt-1 pb-1 text-center">
                <h3 className="font-bold line-clamp-1 text-base transition-colors" title={track.title}>
                  {track.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{track.artist}</p>
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
