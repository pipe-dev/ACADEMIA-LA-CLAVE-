import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap, Heart, Headphones, RotateCcw } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface KaraokeResultsModalProps {
  isFinished: boolean;
  trackTitle?: string;
  earnedStars: number;
  score: number;
  maxCombo: number;
  isCourtesySongActive: boolean;
  userLives: number;
  audioBlobUrl: string | null;
  onPlayRecording: () => void;
  onReplaySong: () => void;
  onExitToCatalog: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export const KaraokeResultsModal: React.FC<KaraokeResultsModalProps> = ({
  isFinished,
  trackTitle,
  earnedStars,
  score,
  maxCombo,
  isCourtesySongActive,
  userLives,
  audioBlobUrl,
  onPlayRecording,
  onReplaySong,
  onExitToCatalog,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  return (
    <AnimatePresence>
      {isFinished && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-black text-2xl text-slate-900 dark:text-white">
                ¡Gran Interpretación!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Has completado{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {trackTitle}
                </strong>
              </p>
            </div>

            {/* Estrellas Obtenidas */}
            <div className="flex justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-7 h-7 ${
                    starIdx <= earnedStars
                      ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md'
                      : 'text-slate-300 dark:text-slate-700'
                  } transition-all`}
                />
              ))}
            </div>

            {/* Puntuación y Mejor Racha */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#eff4ff] dark:bg-[#0b1828] rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Puntaje Total
                </span>
                <p className="text-xl sm:text-2xl font-heading font-black text-[#2c2abc] dark:text-[#c0c1ff]">
                  {score.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Mejor Racha
                </span>
                <p className="text-xl sm:text-2xl font-heading font-black text-amber-600 dark:text-amber-400">
                  {maxCombo}
                </p>
              </div>
            </div>

            {/* Resultado en Vidas */}
            {isCourtesySongActive ? (
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold text-center">
                <span>Canción de cortesía finalizada (No otorga vidas)</span>
              </div>
            ) : earnedStars <= 2 ? (
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>Desempeño bajo: -1 Vida</span>
              </div>
            ) : earnedStars === 5 ? (
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                <span>¡5 Estrellas de excelencia! +1 Vida ganada</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold text-center">
                <span>Buen intento • Vidas protegidas</span>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-2 pt-2">
              {audioBlobUrl && (
                <button
                  onClick={onPlayRecording}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Escuchar mi Grabación</span>
                </button>
              )}

              {userLives > 0 ? (
                <button
                  onClick={onReplaySong}
                  className="w-full py-3 rounded-xl bg-[#4648d4] text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_0_#282a9e] active:scale-98 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Cantar de Nuevo</span>
                </button>
              ) : (
                <>
                  {onOpenRecoveryExam && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        onExitToCatalog();
                        onOpenRecoveryExam();
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                    >
                      <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                      <span>Entrenar para ganar 1 vida (Gratis)</span>
                    </button>
                  )}
                  {onOpenStore && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        onExitToCatalog();
                        onOpenStore();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-heading font-bold text-xs cursor-pointer transition-colors"
                    >
                      Recargar en la Tienda
                    </button>
                  )}
                </>
              )}

              <button
                onClick={onExitToCatalog}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-heading font-bold text-xs cursor-pointer transition-colors"
              >
                Elegir Otra Canción
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
