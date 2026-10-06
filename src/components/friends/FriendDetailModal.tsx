'use client';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Swords, 
  Zap, 
  Flame, 
  Trophy, 
  Mic2, 
  Calendar,
  Activity,
  Target,
  BookOpen,
  Clock,
  Award
} from 'lucide-react';
import { FriendItem } from './friendsTypes';
import { audioService } from '../../utils/audioService';

interface FriendDetailModalProps {
  isOpen: boolean;
  friend: FriendItem | null;
  zenMode?: boolean;
  onClose: () => void;
  onOpenDuel: (friend: FriendItem) => void;
  onSendNudge: (friend: FriendItem) => void;
  hasNudgeSent?: boolean;
}

export const FriendDetailModal: React.FC<FriendDetailModalProps> = ({
  isOpen,
  friend,
  zenMode = false,
  onClose,
  onOpenDuel,
  onSendNudge,
  hasNudgeSent = false
}) => {
  if (!isOpen || !friend) return null;

  const duelsWon = friend.duelsWonAgainst ?? 0;
  const duelsLost = friend.duelsLostAgainst ?? 0;
  const totalDuels = duelsWon + duelsLost;

  const totalHistoricalXp = friend.totalXp ?? (friend.xpThisWeek * 3);
  const lessonsCount = friend.lessonsCompleted ?? Math.max(6, friend.level * 3);
  const practiceMins = friend.practiceMinutes ?? Math.max(45, friend.streak * 15);
  const stability = friend.stabilityScore ?? (88 + (friend.level % 10));
  const badgesEarned = friend.badgesCount ?? Math.min(50, Math.max(5, friend.level * 2 + 3));

  return (
    <AnimatePresence>
      <div 
        onClick={() => {
          audioService.playClickSound();
          onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl relative border overflow-hidden max-h-[92vh] overflow-y-auto ${
            zenMode
              ? 'bg-[#1b1c1e] border-[#2e3138] text-[#f0ebe1]'
              : 'bg-white dark:bg-[#0e1726] border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
        >
          {/* Header con titulo y boton de cerrar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Perfil de Cantante
            </span>
            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 active:scale-90 transition-transform cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ficha de Identidad Principal */}
          <div className="pt-3 text-center">
            <div className="relative inline-block mx-auto mb-2">
              <img
                src={friend.avatar}
                alt={friend.name}
                className={`w-20 h-20 rounded-full object-cover border-4 shadow-md ${
                  zenMode ? 'border-[#383c44] grayscale' : 'border-indigo-100 dark:border-indigo-900/60'
                }`}
              />
              <span
                className={`w-4 h-4 rounded-full border-2 absolute bottom-0 right-1 ${
                  friend.isOnline
                    ? zenMode ? 'bg-[#e5b83b] border-[#1b1c1e]' : 'bg-emerald-500 border-white dark:border-[#0e1726]'
                    : 'bg-slate-400 border-white dark:border-[#0e1726]'
                }`}
              />
            </div>

            <h3 className="font-heading font-black text-lg">
              {friend.name}
            </h3>

            <p className={`text-xs font-semibold mt-0.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'}`}>
              Nivel {friend.level} &bull; {friend.levelTitle}
            </p>

            {/* Rango vocal completo con su intervalo */}
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              zenMode
                ? 'bg-[#22252a] border-[#2e3138] text-[#e5b83b]'
                : 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300'
            }`}>
              <Mic2 className="w-3.5 h-3.5 shrink-0" />
              <span>{friend.vocalRange}</span>
            </div>
          </div>

          {/* Frase de Actividad Reciente Reubicada */}
          {friend.statusText && (
            <div className={`mt-3 p-2.5 rounded-2xl flex items-center gap-2.5 border text-left ${
              zenMode
                ? 'bg-[#22252a] border-[#2e3138] text-[#ded9cf]'
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 text-amber-950 dark:text-amber-200'
            }`}>
              <div className={`p-1.5 rounded-xl shrink-0 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
              }`}>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider font-bold block text-slate-400">
                  Actividad Reciente
                </span>
                <p className="text-xs font-semibold truncate italic">
                  &ldquo;{friend.statusText}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Parrilla de 4 Metricas Vocales y Rendimiento */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Racha */}
            <div className={`p-2.5 rounded-2xl border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                <Flame className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-bold">Racha</span>
              </div>
              <span className="block font-black text-xs">{friend.streak} dias</span>
              <span className="text-[9px] text-slate-400">Practicando diario</span>
            </div>

            {/* Precision / Estabilidad */}
            <div className={`p-2.5 rounded-2xl border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                <Target className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-bold">Precision</span>
              </div>
              <span className="block font-black text-xs">{stability}%</span>
              <span className="text-[9px] text-slate-400">Estabilidad vocal</span>
            </div>

            {/* Lecciones */}
            <div className={`p-2.5 rounded-2xl border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                <BookOpen className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-bold">Academia</span>
              </div>
              <span className="block font-black text-xs">{lessonsCount} lecciones</span>
              <span className="text-[9px] text-slate-400">Completadas</span>
            </div>

            {/* Tiempo Practicado */}
            <div className={`p-2.5 rounded-2xl border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                <Clock className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-cyan-500'}`} />
                <span className="text-[9px] uppercase tracking-wider font-bold">Tiempo</span>
              </div>
              <span className="block font-black text-xs">{practiceMins} min</span>
              <span className="text-[9px] text-slate-400">Canto y ejercicios</span>
            </div>
          </div>

          {/* Puntuacion Global: XP Semanal, XP Total e Insignias */}
          <div className={`mt-2.5 p-3 rounded-2xl border ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/40 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <Trophy className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">XP Acumulado</span>
              </div>
              <div className="text-right">
                <span className={`font-black text-xs block ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {friend.xpThisWeek.toLocaleString()} XP
                </span>
                <span className="text-[9px] text-slate-400">({totalHistoricalXp.toLocaleString()} total)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5">
              <div className="flex items-center gap-1.5">
                <Award className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-purple-500'}`} />
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Insignias</span>
              </div>
              <span className="font-bold text-xs">
                {badgesEarned} de 50 logradas
              </span>
            </div>
          </div>

          {/* Seccion Cara a Cara (Head-to-Head) */}
          <div className={`mt-2.5 p-3 rounded-2xl border ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138]'
              : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Historial Cara a Cara</span>
              <span className={zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'}>
                {totalDuels} {totalDuels === 1 ? 'Duelo' : 'Duelos'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span>Victorias Tuyas</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{duelsWon}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/40 dark:border-slate-800">
              <span>Victorias de {friend.name.split(' ')[0]}</span>
              <span className="font-black text-amber-600 dark:text-amber-400">{duelsLost}</span>
            </div>

            {friend.lastDuelNote && (
              <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Ultimo reto: <strong className="text-slate-600 dark:text-slate-300">{friend.lastDuelNote}</strong></span>
                <span>Puntaje: {friend.lastDuelScore}%</span>
              </div>
            )}
          </div>

          {/* Botones de Accion Tactiles */}
          <div className="mt-3.5 space-y-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onClose();
                onOpenDuel(friend);
              }}
              className={`w-full py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                zenMode
                  ? 'bg-[#e5b83b] text-[#161719]'
                  : 'bg-amber-500 text-white active:bg-amber-600'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Desafiar a Duelo en Vivo</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onSendNudge(friend)}
              disabled={hasNudgeSent}
              className={`w-full py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer ${
                hasNudgeSent
                  ? zenMode
                    ? 'bg-[#22252a] text-[#e5b83b] border-[#e5b83b]/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : zenMode
                    ? 'bg-[#26292f] text-[#ded9cf] border-[#383c44] active:bg-[#383c44]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 active:bg-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{hasNudgeSent ? 'Animo Enviado Hoy' : 'Enviar Animo'}</span>
            </motion.button>
          </div>

          {/* Fecha de amistad */}
          {friend.joinedDate && (
            <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Amigos desde {friend.joinedDate}</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
