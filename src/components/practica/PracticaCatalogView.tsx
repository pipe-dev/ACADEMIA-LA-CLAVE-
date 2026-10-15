import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Music2, Loader2, Play, LogOut } from 'lucide-react';
import { CatalogTrack } from './practicaTypes';

interface PracticaCatalogViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  displayedCatalog: CatalogTrack[];
  isLoadingCatalog: boolean;
  isSearching: boolean;
  onSelectTrack: (track: CatalogTrack) => void;
  zenMode?: boolean;
}

const CATEGORIES = [
  'Todos',
  'Del Momento',
  'Música Cristiana',
  'Pop & Baladas',
  'Urbano Latino',
  'Rock en Español',
  'Música Mexicana'
];

export const PracticaCatalogView: React.FC<PracticaCatalogViewProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  displayedCatalog,
  isLoadingCatalog,
  isSearching,
  onSelectTrack,
  zenMode = false
}) => {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      {/* Header del Catálogo */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`font-heading font-black text-2xl ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#2c2abc] dark:text-[#c0c1ff]'
            }`}
          >
            Karaoke & Práctica
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Canta con la letra en pantalla y mira si aciertas cada nota
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border border-[#2e3138]'
              : 'bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff]'
          }`}
        >
          <Music2 className="w-5 h-5" />
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          {isSearching ? (
            <Loader2
              className={`w-5 h-5 animate-spin ${
                zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4]'
              }`}
            />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar canción, artista o género..."
          className={`w-full bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] rounded-full py-3.5 pl-11 pr-10 text-sm font-medium text-slate-800 dark:text-[#d3e4fe] placeholder-slate-400 shadow-2xs focus:outline-none transition-colors ${
            zenMode ? 'focus:ring-2 focus:ring-[#e5b83b]' : 'focus:ring-2 focus:ring-[#4648d4]'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* Categorías de Filtro */}
      {!searchQuery && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? zenMode
                    ? 'bg-[#e5b83b] text-[#161719] shadow-sm scale-102 font-black border border-[#f5d56b]'
                    : 'bg-[#4648d4] text-white shadow-sm scale-102'
                  : zenMode
                  ? 'bg-[#1f2125] text-[#ded9cf] border border-[#2e3138] hover:bg-[#26292f]'
                  : 'bg-white dark:bg-[#102034] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#1b2b3f] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Canciones del Catálogo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>
              {searchQuery
                ? 'Resultados de Búsqueda'
                : selectedCategory === 'Todos'
                ? `Top 100 Éxitos (${displayedCatalog.length})`
                : selectedCategory === 'Del Momento'
                ? `Del Momento · 100 Éxitos (${displayedCatalog.length})`
                : selectedCategory === 'Música Cristiana'
                ? `Música Cristiana · Top 100 (${displayedCatalog.length})`
                : `${selectedCategory} (${displayedCatalog.length})`}
            </span>
            {!searchQuery && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    zenMode ? 'bg-[#e5b83b]' : 'bg-emerald-500'
                  }`}
                />
                En Vivo
              </span>
            )}
          </h3>
          {isLoadingCatalog && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium animate-pulse ${
                zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4]'
              }`}
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Actualizando...</span>
            </div>
          )}
        </div>

        {isLoadingCatalog && displayedCatalog.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Loader2
              className={`w-6 h-6 animate-spin mx-auto ${
                zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4]'
              }`}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Cargando catálogo musical...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedCatalog.map((track) => (
              <motion.button
                key={track.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTrack(track)}
                className="w-full bg-white dark:bg-[#102034] p-3 rounded-2xl border border-slate-100 dark:border-[#1b2b3f] shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3 text-left transition-all hover:border-indigo-200 dark:hover:border-indigo-900/60 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Carátula */}
                  <div className="w-13 h-13 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative shadow-xs">
                    {track.thumbnail && !failedImageIds.has(track.id) ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        onError={() =>
                          setFailedImageIds((prev) => new Set(prev).add(track.id))
                        }
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
                          zenMode ? 'grayscale contrast-110 brightness-90' : ''
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          zenMode
                            ? 'bg-[#1f2125] text-[#e5b83b]'
                            : 'bg-indigo-50 dark:bg-slate-800 text-indigo-400'
                        }`}
                      >
                        <Music2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info de Canción */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {track.rank && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                            zenMode
                              ? 'bg-[#26292f] text-[#f5d56b] border border-[#e5b83b]/30'
                              : track.rank === 1
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                              : track.rank === 2
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                              : track.rank === 3
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300'
                              : 'bg-indigo-50 dark:bg-[#0b1828] text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          #{track.rank}
                        </span>
                      )}
                      <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white truncate">
                        {track.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {track.artist}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-block text-[9px] font-bold px-2 py-0.2 rounded-full ${
                          zenMode
                            ? 'bg-[#26292f] text-[#f5d56b] border border-[#e5b83b]/20'
                            : track.category === 'Música Cristiana'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/50'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {track.category}
                      </span>
                      {track.genre && track.genre !== track.category && (
                        <span className="inline-block text-[9px] font-medium text-slate-400 truncate">
                          • {track.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de Play Táctil */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                    zenMode
                      ? 'bg-[#26292f] text-[#e5b83b] group-hover:bg-[#e5b83b] group-hover:text-[#161719]'
                      : 'bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff] group-hover:bg-[#4648d4] group-hover:text-white'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
