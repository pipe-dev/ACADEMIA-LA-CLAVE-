'use client';
import React from 'react';
import { Trophy, Users } from 'lucide-react';
import { FriendItem } from './friendsTypes';
import { FriendCardItem } from './FriendCardItem';

interface FriendsRankingListProps {
  friends: FriendItem[];
  userXp: number;
  userLevel: number;
  nudgeSentIds: Record<string, boolean>;
  zenMode?: boolean;
  onSelectFriend: (friend: FriendItem) => void;
  onOpenDuel: (friend: FriendItem) => void;
  onSendNudge: (friend: FriendItem) => void;
}

export const FriendsRankingList: React.FC<FriendsRankingListProps> = ({
  friends,
  userXp,
  userLevel,
  nudgeSentIds,
  zenMode = false,
  onSelectFriend,
  onOpenDuel,
  onSendNudge
}) => {
  // Sort friends by XP this week
  const sortedFriends = [...friends].sort((a, b) => b.xpThisWeek - a.xpThisWeek);

  return (
    <div className={`rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors ${
      zenMode
        ? 'bg-[#1b1c1e] border border-[#2e3138]'
        : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-amber-500'}`} />
          <h4 className={`font-heading font-bold text-sm ${
            zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
          }`}>
            Tabla de Amigos de Cantar
          </h4>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          XP Esta Semana
        </span>
      </div>

      {/* User's Own Standing Banner */}
      <div className={`p-3 rounded-2xl flex items-center justify-between text-xs border ${
        zenMode
          ? 'bg-[#22252a] border border-[#e5b83b]/40 text-[#f0ebe1]'
          : 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full font-extrabold flex items-center justify-center text-xs ${
            zenMode ? 'bg-[#e5b83b] text-[#161719]' : 'bg-indigo-600 text-white'
          }`}>
            TU
          </div>
          <div>
            <span className={`font-heading font-extrabold block ${
              zenMode ? 'text-[#f0ebe1]' : 'text-indigo-950 dark:text-indigo-100'
            }`}>
              Tu Puntuacion
            </span>
            <span className={`text-[10px] font-semibold ${
              zenMode ? 'text-[#e5b83b]' : 'text-indigo-700 dark:text-indigo-300'
            }`}>
              Nivel {userLevel}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`font-heading font-extrabold text-sm block ${
            zenMode ? 'text-[#e5b83b]' : 'text-indigo-600 dark:text-indigo-300'
          }`}>
            {userXp.toLocaleString()} XP
          </span>
          <span className="text-[10px] text-slate-400">
            Esta semana
          </span>
        </div>
      </div>

      {/* Friends Cards */}
      {sortedFriends.length === 0 ? (
        <div className={`p-6 text-center border border-dashed rounded-2xl space-y-1 ${
          zenMode ? 'border-[#2e3138] bg-[#161719]' : 'border-slate-200 dark:border-slate-800'
        }`}>
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className={`text-xs font-bold ${zenMode ? 'text-[#9ea3ae]' : 'text-slate-500 dark:text-slate-400'}`}>
            Aun no tienes amigos agregados
          </p>
          <p className="text-[11px] text-slate-400">
            Ingresa el codigo de un companero arriba para comenzar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFriends.map((friend, idx) => (
            <FriendCardItem
              key={friend.id}
              friend={friend}
              rank={idx + 1}
              hasNudge={Boolean(nudgeSentIds[friend.id])}
              zenMode={zenMode}
              onSelectFriend={onSelectFriend}
              onOpenDuel={onOpenDuel}
              onSendNudge={onSendNudge}
            />
          ))}
        </div>
      )}
    </div>
  );
};
