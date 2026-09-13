'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { cacheAllContentLocally, registerServiceWorker } from '../utils/offlineSync';
import { SONGS_DATABASE } from '../data/academyData';

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

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Iniciando descarga PWA...');
  const [isFullyDownloaded, setIsFullyDownloaded] = useState(false);

  const [tip] = useState(() => {
    try {
      const saved = localStorage.getItem('laclave_daily_vocal_tip');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
        if (!isExpired && parsed.tip) {
          return parsed.tip;
        }
      }
    } catch {}
    const randomTip = VOCAL_TIPS[Math.floor(Math.random() * VOCAL_TIPS.length)];
    try {
      localStorage.setItem('laclave_daily_vocal_tip', JSON.stringify({ tip: randomTip, timestamp: Date.now() }));
    } catch {}
    return randomTip;
  });

  useEffect(() => {
    let isCancelled = false;

    const runFullPwaPreload = async () => {
      // Step 1: 0% -> 25% Service Worker & Cache Storage Registration
      setLoadingText('Registrando Service Worker & Caché PWA...');
      setProgress(15);
      registerServiceWorker();

      // Collect all image URLs from song database & app covers
      const songCovers = SONGS_DATABASE.map(s => s.coverUrl).filter(Boolean);
      const appStaticAssets = [
        '/',
        '/manifest.json',
        '/duck.png',
        '/trollface.png',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=192&q=80',
        ...songCovers
      ];

      // Send precache command to SW if active
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PRECACHE_FULL_APP',
          urls: appStaticAssets
        });
      }

      await new Promise(r => setTimeout(r, 400));
      if (isCancelled) return;

      // Step 2: 20% -> 50% Pre-load ALL app view bundles and lazy components
      setLoadingText('Cargando módulos y secciones de la aplicación...');
      setProgress(40);
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
          import('../components/RecoveryExamModal'),
          import('../components/UnitCelebrationModal'),
          import('../components/InstallPwaModal')
        ]);
      } catch (e) {
        console.warn('[SplashScreen] Carga previa de módulos:', e);
      }

      await new Promise(r => setTimeout(r, 300));
      if (isCancelled) return;

      // Step 3: 50% -> 80% Pre-download & Cache Content Locally in Cache Storage & LocalStorage
      setLoadingText('Descargando lecciones, canciones e imágenes...');
      setProgress(70);
      cacheAllContentLocally();

      try {
        if ('caches' in window) {
          const cache = await caches.open('laclave-v1-cache');
          await Promise.all(
            appStaticAssets.map(url =>
              cache.add(url).catch(() => {
                console.warn('[PWA Preload] Recurso omitido o ya cacheado:', url);
              })
            )
          );
        }
      } catch (e) {
        console.warn('[PWA Preload] Fallo menor en descarga de caché:', e);
      }

      await new Promise(r => setTimeout(r, 300));
      if (isCancelled) return;

      // Step 4: 80% -> 95% Warm up Audio Engine & AudioContext
      setLoadingText('Pre-cargando sintetizadores y motor de afinación...');
      setProgress(90);

      try {
        // Pre-warm Web Audio API context without playing sound or leaking context
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          if (tempCtx.state === 'suspended') {
            tempCtx.resume().catch(() => {});
          }
          setTimeout(() => {
            try { tempCtx.close(); } catch {}
          }, 500);
        }
      } catch {}

      await new Promise(r => setTimeout(r, 450));
      if (isCancelled) return;

      // Step 5: 100% Download complete
      setLoadingText('¡Todas las secciones descargadas! App 100% lista para usar sin conexión.');
      setProgress(100);
      setIsFullyDownloaded(true);

      await new Promise(r => setTimeout(r, 350));
      if (isCancelled) return;

      onFinish();
    };

    runFullPwaPreload();

    return () => {
      isCancelled = true;
    };
  }, [onFinish]);

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

      {/* Center - Consejo del Día Card */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-6 space-y-4 shadow-xl"
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
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};


