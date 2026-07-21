import { useState, useRef, useEffect } from 'react';

export function useVocalRemover(videoId: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const centerCancelGainRef = useRef<GainNode | null>(null);
  const originalGainRef = useRef<GainNode | null>(null);

  const initAudio = async () => {
    try {
      const instances = ["https://yewtu.be", "https://vid.puffyan.us", "https://invidious.flokinet.to"];
      let audioUrl = null;
      
      for (const instance of instances) {
        try {
          const res = await fetch(`${instance}/api/v1/videos/${videoId}`);
          if (res.ok) {
            const data = await res.json();
            const formats = data.adaptiveFormats || [];
            const audioFormats = formats.filter((f: any) => f.type?.startsWith('audio/'));
            if (audioFormats.length > 0) {
              audioFormats.sort((a: any, b: any) => parseInt(b.bitrate || '0') - parseInt(a.bitrate || '0'));
              audioUrl = audioFormats[0].url;
              break;
            }
          }
        } catch (e) { continue; }
      }

      if (!audioUrl) throw new Error("Could not fetch audio from proxies");

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = audioUrl;
      audioRef.current = audio;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      
      // Center cancellation routing
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      const inverter = ctx.createGain();
      inverter.gain.value = -1;

      source.connect(splitter);
      splitter.connect(inverter, 1); // Invert right channel
      
      // L + (-R) -> Center cancellation
      splitter.connect(merger, 0, 0); // L to L
      inverter.connect(merger, 0, 0); // -R to L
      splitter.connect(merger, 0, 1); // L to R (dual mono)
      inverter.connect(merger, 0, 1); // -R to R
      
      // Mix controls
      const originalGain = ctx.createGain();
      const centerCancelGain = ctx.createGain();
      
      originalGain.gain.value = 1; // Start with full vocals
      centerCancelGain.gain.value = 0;

      source.connect(originalGain);
      merger.connect(centerCancelGain);
      
      originalGain.connect(ctx.destination);
      centerCancelGain.connect(ctx.destination);
      
      originalGainRef.current = originalGain;
      centerCancelGainRef.current = centerCancelGain;

      audio.addEventListener('canplay', () => setIsReady(true));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      
      audio.load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audio load error');
    }
  };

  const setVocalVolume = (volume: number) => { // 0.0 to 1.0
    if (originalGainRef.current && centerCancelGainRef.current) {
      // Equal power crossfade for smooth volume transition
      originalGainRef.current.gain.value = Math.cos((1.0 - volume) * 0.5 * Math.PI);
      centerCancelGainRef.current.gain.value = Math.cos(volume * 0.5 * Math.PI);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  const setTime = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeAttribute('src');
      audioContextRef.current?.close();
    };
  }, []);

  return { initAudio, togglePlay, setVocalVolume, isPlaying, isReady, currentTime, error, setTime };
}
