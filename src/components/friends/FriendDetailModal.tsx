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
  Calendar 
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

  return (
    <AnimatePresence>
      <div 
        onClick={() => {
          audioService.playClickSound();
          onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl relative border overflow-hidden ${
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
          <div className="pt-4 text-center">
            <div className="relative inline-block mx-auto mb-2.5">
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

            <p className={`text-xs font-semibold mt-1 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'}`}>
              Nivel {friend.level} &bull; {friend.levelTitle}
            </p>
          </div>

          {/* Cuadricula de 3 Metricas Vocales */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className={`p-2.5 rounded-2xl text-center border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <Flame className={`w-4 h-4 mx-auto mb-1 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
              <span className="block font-black text-xs">{friend.streak} dias</span>
              <span className="text-[9px] text-slate-400 font-semibold">Racha</span>
            </div>

            <div className={`p-2.5 rounded-2xl text-center border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <Mic2 className={`w-4 h-4 mx-auto mb-1 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
              <span className="block font-black text-[11px] truncate">{friend.vocalRange.split(' ')[0]}</span>
              <span className="text-[9px] text-slate-400 font-semibold">Tesitura</span>
            </div>

            <div className={`p-2.5 rounded-2xl text-center border ${
              zenMode ? 'bg-[#22252a] border-[#2e3138]' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}>
              <Trophy className={`w-4 h-4 mx-auto mb-1 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
              <span className="block font-black text-xs">{friend.xpThisWeek}</span>
              <span className="text-[9px] text-slate-400 font-semibold">XP Semanal</span>
            </div>
          </div>

          {/* Seccion Cara a Cara (Head-to-Head) */}
          <div className={`mt-3.5 p-3 rounded-2xl border ${
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
          <div className="mt-4 space-y-2">
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
