'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, DownloadCloud, CheckCircle2, User, Camera, ArrowRight, Mic } from 'lucide-react';
import { cacheAllContentLocally, registerServiceWorker } from '../utils/offlineSync';
import { SONGS_DATABASE } from '../data/academyData';
import { DEFAULT_VOCAL_AVATARS } from './friends/friendsTypes';
import { UserStats } from '../types';

export const VOCAL_TIPS = [
  { id: 1, title: 'Apoyo Diafragmático', text: 'Inhala inflando suavemente el abdomen y costillas inferiores, sin elevar los hombros, para lograr un flujo constante de aire.' },
  { id: 2, title: 'Hidratación Vocal Sistémica', text: 'Bebe agua a temperatura ambiente constantemente durante el día. Cuerdas vocales bien hidratadas vibran sin fricción ni cansancio.' },
  { id: 3, title: 'Trinos de Labios (Lip Trills)', text: 'Realiza vibración de labios antes de practicar agudos. Regula la presión subglótica y alivia la tensión muscular.' },
  { id: 4, title: 'Resonancia en la Máscara', text: 'Siente la vibración en pómulos y paladar duro. Esto amplifica tu tono de forma natural sin sobrecargar la garganta.' },
  { id: 5, title: 'Postura y Alineación Corporal', text: 'Mantén el pecho abierto y el mentón nivelado paralelo al suelo. Mantiene el tracto vocal libre y relajado.' },
  { id: 6, title: 'Ataque Vocal Suave', text: 'Evita golpear bruscamente las cuerdas vocales al iniciar frases con vocales. Imagina un suave suspiro antes de cantar.' },
  { id: 7, title: 'Inhalación de Vapor de Agua', text: 'Utiliza vaporizador personal o duchas de vapor para hidratación tópica directa de los pliegues vocales.' },
  { id: 8, title: 'Descanso e Higiene Vocal', text: 'Si sientes carraspeo o fatiga, toma pausas de silencio vocal de 15 minutos. Evita carraspear con fuerza.' }
];

export function getPersonalizedVocalTip(name: string): { title: string; text: string } {
  return {
    title: `Preparando tu voz, ${name}`,
    text: `${name}, recuerda que el aire es el combustible de tu voz. Antes de cantar cualquier nota, expande tus costillas inferiores, relaja la mandíbula y deja que tu respiración fluya sin tensión.`
  };
}

interface SplashScreenProps {
  onFinish: () => void;
  userStats?: UserStats;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
}

type SplashPhase = 'loading_to_85' | 'name_input' | 'tip_after_name' | 'avatar_input' | 'completed';

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  userStats,
  onUpdateStats,
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Iniciando descarga PWA...');
  const [isFullyDownloaded, setIsFullyDownloaded] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>('loading_to_85');

  const initialName = userStats?.name || (() => {
    try {
      const s = localStorage.getItem('laclave_user_stats_v6');
      if (s) return JSON.parse(s).name || 'Alex';
    } catch {}
    return 'Alex';
  })();

  const initialAvatar = userStats?.avatarUrl || (() => {
    try {
      const s = localStorage.getItem('laclave_user_stats_v6');
      if (s) return JSON.parse(s).avatarUrl || DEFAULT_VOCAL_AVATARS[0].url;
    } catch {}
    return DEFAULT_VOCAL_AVATARS[0].url;
  })();

  const [userName, setUserName] = useState<string>(initialName);
  const [nameInput, setNameInput] = useState<string>(initialName);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(initialAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tip] = useState(() => {
    try {
      const saved = localStorage.getItem('laclave_daily_vocal_tip');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
        if (!isExpired && parsed.tip) return parsed.tip;
      }
    } catch {}
    const randomTip = VOCAL_TIPS[Math.floor(Math.random() * VOCAL_TIPS.length)];
    try {
      localStorage.setItem('laclave_daily_vocal_tip', JSON.stringify({ tip: randomTip, timestamp: Date.now() }));
    } catch {}
    return randomTip;
  });

  const [personalizedTip, setPersonalizedTip] = useState<{ title: string; text: string }>({
    title: `Preparando tu voz, ${initialName}`,
    text: `${initialName}, recuerda que el aire es el combustible de tu voz. Antes de emitir cualquier nota, expande tus costillas inferiores y relaja tu mandíbula.`
  });

  // Background preload execution
  useEffect(() => {
    let isCancelled = false;
    const runFullPwaPreload = async () => {
      registerServiceWorker();

      const songCovers = SONGS_DATABASE.map((s) => s.coverUrl).filter(Boolean);
      const appStaticAssets = [
        '/',
        '/manifest.json',
        '/icons/icon-192.png',
        '/icons/Logo_afinapp.png',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=192&q=80',
        ...songCovers,
      ];

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PRECACHE_FULL_APP',
          urls: appStaticAssets,
        });
      }

      cacheAllContentLocally();

      try {
        await Promise.allSettled([
          import('../components/AfinadorView'),
          import('../components/PracticaView'),
          import('../components/ProgresoView'),
          import('../components/StreakFlameView'),
          import('../components/LessonModal'),
          import('../components/VoiceEvalModal'),
          import('../components/VocalRangeModal'),
          import('../components/StoreModal'),
          import('../components/SettingsModal'),
        ]);
      } catch {}

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          if (tempCtx.state === 'suspended') tempCtx.resume().catch(() => {});
          setTimeout(() => {
            try { tempCtx.close(); } catch {}
          }, 450);
        }
      } catch {}
    };

    runFullPwaPreload();
    return () => { isCancelled = true; };
  }, []);

  // Timer 1: 0% -> 85% ticking 1 by 1
  useEffect(() => {
    if (phase !== 'loading_to_85') return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(timer);
          setPhase('name_input');
          setLoadingText('Personalización de perfil (85%)...');
          return 85;
        }
        const next = prev + 1;
        if (next < 25) {
          setLoadingText(`Registrando Service Worker & Caché PWA... (${next}%)`);
        } else if (next < 55) {
          setLoadingText(`Cargando módulos y secciones de la aplicación... (${next}%)`);
        } else {
          setLoadingText(`Descargando lecciones, canciones e imágenes... (${next}%)`);
        }
        return next;
      });
    }, 28);

    return () => clearInterval(timer);
  }, [phase]);

  // Timer 2: 86% -> 99% ticking 1 by 1 after name is confirmed
  useEffect(() => {
    if (phase !== 'tip_after_name') return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          clearInterval(timer);
          setPhase('avatar_input');
          setLoadingText('Personaliza tu foto de perfil (99%)...');
          return 99;
        }
        const next = prev + 1;
        setLoadingText(`Preparando entorno para ${userName}... (${next}%)`);
        return next;
      });
    }, 32);

    return () => clearInterval(timer);
  }, [phase, userName]);

  const saveToStorage = (updatedName: string, updatedAvatar?: string) => {
    try {
      const saved = localStorage.getItem('laclave_user_stats_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (updatedName) parsed.name = updatedName;
        if (updatedAvatar) parsed.avatarUrl = updatedAvatar;
        localStorage.setItem('laclave_user_stats_v6', JSON.stringify(parsed));
      }
    } catch {}
  };

  const handleConfirmName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || userName || 'Vocalista';
    setUserName(finalName);
    setPersonalizedTip(getPersonalizedVocalTip(finalName));
    if (onUpdateStats) onUpdateStats({ name: finalName });
    saveToStorage(finalName);
    setPhase('tip_after_name');
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) setSelectedAvatar(res);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAvatar = () => {
    if (onUpdateStats) onUpdateStats({ avatarUrl: selectedAvatar, name: userName });
    saveToStorage(userName, selectedAvatar);
    setPhase('completed');
    setProgress(100);
    setLoadingText('¡Todas las secciones descargadas! App 100% lista para usar sin conexión.');
    setIsFullyDownloaded(true);
    setTimeout(() => {
      onFinish();
    }, 450);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-teal-700 via-emerald-700 to-green-700 text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Top Banner - PWA Offline Download Badge */}
      <div className="w-full max-w-md pt-2 flex justify-center items-center z-10">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-400/30 text-emerald-200 text-xs font-bold shadow-sm">
          {isFullyDownloaded ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
          ) : (
            <DownloadCloud className="w-4 h-4 text-amber-300 animate-pulse" />
          )}
          <span>{isFullyDownloaded ? 'PWA Descargada 100% Offline' : 'Descargando App en Segundo Plano'}</span>
        </div>
      </div>

      {/* Center - Interactive Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md py-4">
        <AnimatePresence mode="wait">
          {phase === 'loading_to_85' && (
            <motion.div
              key="tip-initial"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Lightbulb className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                    CONSEJO DEL DÍA
                  </span>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                    {tip.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-emerald-100/90 leading-relaxed font-normal">
                "{tip.text}"
              </p>
            </motion.div>
          )}

          {phase === 'name_input' && (
            <motion.div
              key="name-step"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <User className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                    REGISTRO DE ALUMNO
                  </span>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                    ¿CÓMO QUIERES LLAMARTE?
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Escribe tu nombre o apodo para personalizar tus entrenamientos y lecciones de canto.
              </p>

              <form onSubmit={handleConfirmName} className="space-y-3 pt-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Tu nombre o apodo..."
                  maxLength={30}
                  autoFocus
                  className="w-full bg-emerald-950/60 border border-emerald-400/40 focus:border-emerald-300 rounded-xl px-4 py-2.5 text-white placeholder-emerald-200/40 font-bold text-center text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/40 shadow-inner transition-all"
                />

                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl font-bold bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-emerald-950 text-xs sm:text-sm tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {phase === 'tip_after_name' && (
            <motion.div
              key="tip-personalized"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Mic className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                    CONSEJO PERSONALIZADO
                  </span>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                    {personalizedTip.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-emerald-100/90 leading-relaxed font-normal">
                "{personalizedTip.text}"
              </p>
            </motion.div>
          )}

          {(phase === 'avatar_input' || phase === 'completed') && (
            <motion.div
              key="avatar-step"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Camera className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                    FOTO DE PERFIL
                  </span>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                    ELIGE TU FOTO DE PERFIL
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                {userName}, sube tu foto o escoge uno de los avatares para tu cuenta.
              </p>

              <div className="flex flex-col items-center gap-2 py-1">
                <div className="relative">
                  <img
                    src={selectedAvatar}
                    alt={userName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 shadow transition-all cursor-pointer"
                    title="Subir foto desde dispositivo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-emerald-200 hover:text-white underline cursor-pointer"
                >
                  Subir foto desde tu dispositivo
                </button>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider block text-center">
                  O elige un avatar vocal:
                </span>
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {DEFAULT_VOCAL_AVATARS.slice(0, 5).map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`p-0.5 rounded-full transition-all cursor-pointer ${
                        selectedAvatar === av.url
                          ? 'ring-2 ring-emerald-300 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={av.name}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAvatar}
                className="w-full py-3 px-5 rounded-xl font-bold bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-emerald-950 text-xs sm:text-sm tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar e Ingresar</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="w-full max-w-md space-y-2.5 pb-4 sm:pb-8 z-10">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-100 px-1">
          <span className="truncate pr-2">{loadingText}</span>
          <span className="font-mono text-emerald-200 font-bold shrink-0">{progress}%</span>
        </div>

        <div className="w-full h-2.5 bg-emerald-950/60 rounded-full overflow-hidden p-0.5 border border-emerald-500/30 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full shadow-sm"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
