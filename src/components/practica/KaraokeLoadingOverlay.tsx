import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface KaraokeLoadingOverlayProps {
  isLoadingTrack: boolean;
  loadingStatusMsg: string;
  loadingTipIndex: number;
  loadingTips: string[];
}

export const KaraokeLoadingOverlay: React.FC<KaraokeLoadingOverlayProps> = ({
  isLoadingTrack,
  loadingStatusMsg,
  loadingTipIndex,
  loadingTips
}) => {
  return (
    <AnimatePresence>
      {isLoadingTrack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-[#102034] rounded-3xl p-6 sm:p-7 max-w-xs sm:max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center relative overflow-hidden"
          >
            {/* Resplandores decorativos de fondo */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Spinner animado */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shadow-xs">
                <Loader2 className="w-7 h-7 text-[#4648d4] dark:text-[#c0c1ff] animate-spin" />
              </div>
            </div>

            {/* Título & Estado Técnico */}
            <div className="space-y-1 w-full text-center">
              <h4 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                Preparando Escenario
              </h4>
              {loadingStatusMsg && (
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>{loadingStatusMsg}</span>
                </p>
              )}
            </div>

            {/* Burbuja con los textos rotativos con animación fluida */}
            <div className="w-full bg-slate-50 dark:bg-[#0b1828] rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800/80 min-h-[78px] flex items-center justify-center shadow-2xs">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingTipIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs font-heading font-medium text-slate-700 dark:text-slate-200 leading-relaxed text-center"
                >
                  "{loadingTips[loadingTipIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Indicador de progreso de puntos */}
            <div className="flex items-center justify-center gap-1 pt-0.5">
              {loadingTips.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === loadingTipIndex
                      ? 'w-4 bg-[#4648d4] dark:bg-[#818cf8]'
                      : 'w-1 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
