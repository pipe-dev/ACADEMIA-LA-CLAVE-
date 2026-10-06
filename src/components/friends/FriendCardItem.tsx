'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Flame, CheckCircle2, Swords, Zap, Mic2 } from 'lucide-react';
import { FriendItem } from './friendsTypes';

interface FriendCardItemProps {
  friend: FriendItem;
  rank: number;
  hasNudge: boolean;
  zenMode?: boolean;
  onSelectFriend: (friend: FriendItem) => void;
  onOpenDuel: (friend: FriendItem) => void;
  onSendNudge: (friend: FriendItem) => void;
}

export const FriendCardItem: React.FC<FriendCardItemProps> = ({
  friend,
  rank,
  hasNudge,
  zenMode = false,
  onSelectFriend,
  onOpenDuel,
  onSendNudge
}) => {
  const vocalClassification = friend.vocalRange.includes('(')
    ? friend.vocalRange.split('(')[0].trim()
    : friend.vocalRange;

  return (
    <motion.div
      onClick={() => onSelectFriend(friend)}
      whileTap={{ scale: 0.98 }}
      className={`p-3.5 rounded-2xl border transition-colors space-y-2.5 shadow-2xs cursor-pointer select-none ${
        zenMode
          ? 'bg-[#22252a] border-[#2e3138] active:border-[#e5b83b]/60'
          : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200/70 dark:border-slate-800/80 active:border-indigo-400'
      }`}
    >
      {/* Fila 1: Puesto, Avatar, Nombre + Nivel + Racha (Izquierda) | XP Semanal (Derecha) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Puesto */}
          <span className={`w-4 text-center font-heading font-black text-xs shrink-0 ${
            rank === 1
              ? (zenMode ? 'text-[#e5b83b]' : 'text-amber-500')
              : 'text-slate-400'
          }`}>
            #{rank}
          </span>

          {/* Avatar circular */}
          <div className="relative shrink-0">
            <img
              src={friend.avatar}
              alt={friend.name}
              className={`w-9 h-9 rounded-full object-cover border-2 ${
                zenMode ? 'border-[#383c44] grayscale' : 'border-white dark:border-slate-700'
              }`}
            />
            {friend.isOnline && (
              <span className={`w-2.5 h-2.5 rounded-full border-2 absolute bottom-0 right-0 ${
                zenMode ? 'bg-[#e5b83b] border-[#22252a]' : 'bg-emerald-500 border-white dark:border-slate-900'
              }`} />
            )}
          </div>

          {/* Bloque Nombre y Codigo */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h5 className={`font-heading font-bold text-xs truncate max-w-[110px] sm:max-w-[160px] ${
                zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
              }`}>
                {friend.name}
              </h5>
              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                zenMode ? 'bg-[#2e3138] text-[#ded9cf]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {friend.code}
              </span>
            </div>

            {/* Nivel y Racha */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium mt-0.5">
              <span>Nivel {friend.level}</span>
              <span>&bull;</span>
              <span className={`flex items-center gap-0.5 font-bold ${
                zenMode ? 'text-[#e5b83b]' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <Flame className={`w-2.5 h-2.5 ${zenMode ? 'fill-[#e5b83b] text-[#e5b83b]' : 'fill-amber-500 text-amber-500'}`} />
                {friend.streak} d
              </span>
            </div>
          </div>
        </div>

        {/* Puntuacion Semanal a la derecha (sin rango debajo) */}
        <div className="text-right shrink-0">
          <span className={`font-heading font-black text-xs block ${
            zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-400'
          }`}>
            {friend.xpThisWeek.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Fila 2: Rango vocal a la izquierda | Botones tactiles Desafiar y Animar a la derecha */}
      <div className={`flex items-center justify-between pt-1.5 border-t text-[11px] ${
        zenMode ? 'border-[#2e3138]' : 'border-slate-200/60 dark:border-slate-800/60'
      }`}>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold truncate max-w-[130px] sm:max-w-[170px]">
          <Mic2 className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{vocalClassification}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Boton Desafiar */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDuel(friend);
            }}
            whileTap={{ scale: 0.94 }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-2xs cursor-pointer ${
              zenMode
                ? 'bg-[#e5b83b] text-[#161719]'
                : 'bg-amber-500 text-white active:bg-amber-600'
            }`}
          >
            <Swords className="w-3 h-3" />
            <span>Desafiar</span>
          </motion.button>

          {/* Boton Animar */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendNudge(friend);
            }}
            disabled={hasNudge}
            whileTap={!hasNudge ? { scale: 0.94 } : undefined}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
              hasNudge
                ? (zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300')
                : (zenMode
                    ? 'bg-[#2e3138] text-[#ded9cf] active:bg-[#383c44]'
                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 active:bg-indigo-100')
            }`}
          >
            {hasNudge ? (
              <>
                <CheckCircle2 className={`w-3 h-3 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                <span>Animado</span>
              </>
            ) : (
              <>
                <Zap className={`w-3 h-3 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
                <span>Animar</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
