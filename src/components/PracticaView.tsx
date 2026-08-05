'use client';
import React, { useState, useEffect } from 'react';
import { Song, UserStats } from '../types';
import { SONGS_DATABASE } from '../data/academyData';
import { audioService } from '../utils/audioService';
import { 
  Search, Play, Pause, SkipBack, SkipForward, Volume2, Mic, MicOff, LogOut, Music2
} from 'lucide-react';

interface PracticaViewProps {
  userStats: UserStats;
  onUpdateQuestProgress?: (seconds: number) => void;
}

export const PracticaView: React.FC<PracticaViewProps> = ({ onUpdateQuestProgress }) => {
  const [searchQuery, setSearchQuery] = useState<string>('Christian Music');
  const [selectedSong, setSelectedSong] = useState<Song>(SONGS_DATABASE[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(1);
  const [volume, setVolume] = useState<number>(80);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [_playbackTime, setPlaybackTime] = useState<number>(5);

  // Filter songs based on search
  const filteredSongs = SONGS_DATABASE.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Simulate playback timer & karaoke lyrics progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentLyricIndex(prevIdx => {
          const lyricsCount = selectedSong.lyrics.length;
          return (prevIdx + 1) % lyricsCount;
        });

        if (onUpdateQuestProgress) {
          onUpdateQuestProgress(1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedSong.lyrics.length, onUpdateQuestProgress]);

  const togglePlay = () => {
    audioService.playClickSound();
    if (!isPlaying) {
      // Play background synth harmonic guide
      audioService.playFrequency(329.63, 0.5);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextSong = () => {
    audioService.playClickSound();
    const currentIdx = SONGS_DATABASE.findIndex(s => s.id === selectedSong.id);
    const nextIdx = (currentIdx + 1) % SONGS_DATABASE.length;
    setSelectedSong(SONGS_DATABASE[nextIdx]);
    setPlaybackTime(0);
    setCurrentLyricIndex(0);
  };

  const handlePrevSong = () => {
    audioService.playClickSound();
    const currentIdx = SONGS_DATABASE.findIndex(s => s.id === selectedSong.id);
    const prevIdx = (currentIdx - 1 + SONGS_DATABASE.length) % SONGS_DATABASE.length;
    setSelectedSong(SONGS_DATABASE[prevIdx]);
    setPlaybackTime(0);
    setCurrentLyricIndex(0);
  };

  const toggleMic = async () => {
    audioService.playClickSound();
    if (isMicEnabled) {
      audioService.stopMicrophone();
      setIsMicEnabled(false);
    } else {
      const ok = await audioService.startMicrophone(() => {});
      setIsMicEnabled(ok);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-4 animate-fadeIn">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar canción o género..."
          className="w-full bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] rounded-full py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 dark:text-[#d3e4fe] placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#4648d4] transition-colors"
        />
      </div>

      {/* Song Selection List if Search Query active */}
      {searchQuery && filteredSongs.length > 1 && (
        <div className="bg-white dark:bg-[#102034] rounded-2xl p-2 border border-slate-100 dark:border-[#1b2b3f] shadow-sm space-y-1 transition-colors">
          {filteredSongs.map(song => (
            <button
              key={song.id}
              onClick={() => {
                setSelectedSong(song);
                setPlaybackTime(0);
                setCurrentLyricIndex(0);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-colors ${
                selectedSong.id === song.id ? 'bg-[#eff4ff] dark:bg-slate-800 text-[#2c2abc] dark:text-[#c0c1ff]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-[#c6c5d7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
                <div>
                  <div className="font-bold">{song.title}</div>
                  <div className="text-[10px] text-slate-400">{song.artist}</div>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full text-indigo-700 dark:text-indigo-300">
                {song.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Song Header / Video Banner Card */}
      <div className="relative bg-gradient-to-r from-slate-400 to-slate-800 dark:from-slate-800 dark:to-slate-950 rounded-3xl overflow-hidden shadow-md h-48 flex items-end p-4 border border-slate-200/60 dark:border-slate-800">
        <img 
          src={selectedSong.coverUrl} 
          alt={selectedSong.title}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
          referrerPolicy="no-referrer"
        />

        <div className="relative z-10 space-y-1 max-w-[70%]">
          <h3 className="font-heading font-bold text-white text-base leading-snug drop-shadow-md">
            {selectedSong.title} - {selectedSong.artist}
          </h3>
          <p className="text-xs text-slate-200 font-medium">
            {selectedSong.category}
          </p>
        </div>

        {/* Play Circle Overlay Button on Banner */}
        <button
          onClick={togglePlay}
          className="organic-shape absolute right-4 bottom-4 z-20 w-16 h-16 bg-[#4648d4] text-white flex items-center justify-center press-effect transition-all cursor-pointer shadow-[0_6px_0_0_#282a9e] group border-2 border-white/30"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 fill-white ml-0 group-active:scale-90 transition-transform" />
          ) : (
            <Play className="w-7 h-7 fill-white ml-1 group-active:scale-90 transition-transform" />
          )}
        </button>
      </div>

      {/* Interactive Karaoke Lyrics Card */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-center space-y-3 min-h-[160px] flex flex-col justify-center transition-colors">
        {/* Previous Line */}
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          {selectedSong.lyrics[(currentLyricIndex - 1 + selectedSong.lyrics.length) % selectedSong.lyrics.length]?.text}
        </p>

        {/* Current Active Line */}
        <div className="space-y-1">
          <h4 className="font-heading font-bold text-base text-[#2c2abc] dark:text-[#c0c1ff] leading-snug tracking-wide">
            "{selectedSong.lyrics[currentLyricIndex]?.text}"
          </h4>
          {selectedSong.lyrics[currentLyricIndex]?.noteTip && (
            <span className="inline-block text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
              {selectedSong.lyrics[currentLyricIndex].noteTip}
            </span>
          )}
        </div>

        {/* Next Line */}
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          {selectedSong.lyrics[(currentLyricIndex + 1) % selectedSong.lyrics.length]?.text}
        </p>
      </div>

      {/* Audio Player Controls */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
        {/* Track Controls Container with Organic Shape Buttons */}
        <div className="bg-surface-container-high/30 dark:bg-slate-800/40 rounded-2xl p-4 flex items-center justify-center gap-6">
          <button 
            onClick={handlePrevSong}
            className="organic-shape w-12 h-12 bg-surface-container-high dark:bg-slate-800 text-slate-700 dark:text-[#c0c1ff] flex items-center justify-center press-effect transition-all duration-300 shadow-[0_4px_0_0_#c7c4d7] dark:shadow-[0_4px_0_0_#1b2b3f] cursor-pointer"
          >
            <SkipBack className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={togglePlay}
            className="organic-shape w-18 h-18 bg-[#4648d4] text-white flex items-center justify-center press-effect transition-all duration-300 shadow-[0_6px_0_0_#282a9e] group cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-white group-active:scale-90 transition-transform" />
            ) : (
              <Play className="w-8 h-8 fill-white ml-1 group-active:scale-90 transition-transform" />
            )}
          </button>

          <button 
            onClick={handleNextSong}
            className="organic-shape w-12 h-12 bg-surface-container-high dark:bg-slate-800 text-slate-700 dark:text-[#c0c1ff] flex items-center justify-center press-effect transition-all duration-300 shadow-[0_4px_0_0_#c7c4d7] dark:shadow-[0_4px_0_0_#1b2b3f] cursor-pointer"
          >
            <SkipForward className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Volume Slider Bar */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <Volume2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-[#4648d4] h-2 bg-indigo-100 dark:bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Microphone Toggle Pill */}
      <div className="bg-[#eff4ff] dark:bg-[#0b1828] rounded-2xl p-3 px-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          {isMicEnabled ? (
            <Mic className="w-5 h-5 text-[#2c2abc] dark:text-[#c0c1ff]" />
          ) : (
            <MicOff className="w-5 h-5 text-slate-400" />
          )}
          <span className="font-heading font-semibold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
            Micrófono
          </span>
        </div>

        {/* Switch Toggle */}
        <button
          onClick={toggleMic}
          className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
            isMicEnabled ? 'bg-[#4648d4] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
        </button>
      </div>

      {/* Exit Button */}
      <button
        onClick={() => {
          audioService.playClickSound();
          setIsPlaying(false);
          setPlaybackTime(0);
        }}
        className="w-full bg-[#eff4ff] dark:bg-[#0b1828] text-[#2c2abc] dark:text-[#c0c1ff] border border-slate-200 dark:border-slate-800 py-3.5 rounded-full font-heading font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Salir</span>
      </button>
    </div>
  );
};

export default PracticaView;
