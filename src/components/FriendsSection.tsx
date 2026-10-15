'use client';
import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audioService';
import { DueloRapidoModal } from './DueloRapidoModal';
import { 
  FriendItem, 
  FriendsSectionProps, 
  INITIAL_DEMO_FRIENDS, 
  DEMO_FRIEND_DIRECTORY 
} from './friends/friendsTypes';
import { MyFriendCodeCard } from './friends/MyFriendCodeCard';
import { AddFriendForm } from './friends/AddFriendForm';
import { FriendsRankingList } from './friends/FriendsRankingList';
import { FriendDetailModal } from './friends/FriendDetailModal';
import { friendsSyncService } from '../utils/friendsSyncService';

export type { FriendItem } from './friends/friendsTypes';

export const FriendsSection: React.FC<FriendsSectionProps> = ({ userXp, userLevel, zenMode = false }) => {
  // Generate or read persistent My Friend Code
  const [myCode] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('laclave_my_friend_code');
      if (stored) return stored;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newCode = `CLAVE-${randomNum}`;
      localStorage.setItem('laclave_my_friend_code', newCode);
      return newCode;
    } catch {
      return 'CLAVE-7782';
    }
  });

  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      const saved = localStorage.getItem('laclave_friends_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read friends list:', e);
    }
    return INITIAL_DEMO_FRIENDS;
  });

  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [nudgeSentIds, setNudgeSentIds] = useState<Record<string, boolean>>({});
  const [isDuelModalOpen, setIsDuelModalOpen] = useState<boolean>(false);
  const [selectedDuelOpponent, setSelectedDuelOpponent] = useState<FriendItem | null>(null);
  const [selectedFriendForDetail, setSelectedFriendForDetail] = useState<FriendItem | null>(null);

  // Background sync: perfil propio y clasificacion en Cloudflare D1
  useEffect(() => {
    friendsSyncService.syncMyProfile({
      code: myCode,
      name: 'Tú',
      level: userLevel,
      xpThisWeek: userXp
    });

    friendsSyncService.fetchFriendsRanking(friends).then((refreshed) => {
      if (refreshed && refreshed.length > 0) {
        setFriends(refreshed);
      }
    });
  }, [myCode, userLevel, userXp]);

  const handleOpenDuel = (friend?: FriendItem) => {
    audioService.playOpenSound();
    setSelectedDuelOpponent(friend || null);
    setIsDuelModalOpen(true);
  };

  const handleSelectFriend = (friend: FriendItem) => {
    audioService.playSoftDing();
    setSelectedFriendForDetail(friend);
  };

  // Save friends list when updated
  useEffect(() => {
    try {
      localStorage.setItem('laclave_friends_list', JSON.stringify(friends));
    } catch (e) {
      console.warn('Could not save friends:', e);
    }
  }, [friends]);

  const handleCopyCode = () => {
    audioService.playClickSound();
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareCode = () => {
    audioService.playClickSound();
    const shareText = `¡Agrégame en La Clave Vocal con mi Código de Cantante: ${myCode}! Practiquemos solfeo y afinación juntos.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mi Código de La Clave Vocal',
        text: shareText,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        setFeedbackMsg({ text: '¡Texto de invitación copiado al portapapeles!', type: 'success' });
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setFeedbackMsg({ text: '¡Texto de invitación copiado al portapapeles!', type: 'success' });
    }

    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAddFriendByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    audioService.playClickSound();

    const formattedCode = inputCode.trim().toUpperCase();

    if (!formattedCode) {
      setFeedbackMsg({ text: 'Escribe o pega un código de amigo válido.', type: 'error' });
      return;
    }

    if (formattedCode === myCode) {
      setFeedbackMsg({ text: '¡Este es tu propio código de cantante! Comparte este código con tus amigos.', type: 'info' });
      return;
    }

    const alreadyExists = friends.some(f => f.code === formattedCode);
    if (alreadyExists) {
      setFeedbackMsg({ text: 'Este cantante ya está en tu lista de amigos.', type: 'info' });
      return;
    }

    let friendToAdd: FriendItem;

    // 1. Intentar buscar en Cloudflare D1
    const searchRes = await friendsSyncService.searchFriendByCode(formattedCode);
    if (searchRes.found && searchRes.singer) {
      friendToAdd = searchRes.singer;
    } else if (DEMO_FRIEND_DIRECTORY[formattedCode]) {
      const demo = DEMO_FRIEND_DIRECTORY[formattedCode];
      friendToAdd = {
        ...demo,
        id: `friend_${Date.now()}`
      };
    } else {
      const sampleAvatars = [
        '/avatars/avatar-soprano.svg',
        '/avatars/avatar-tenor.svg',
        '/avatars/avatar-mezzosoprano.svg',
        '/avatars/avatar-baritono.svg',
        '/avatars/avatar-contralto.svg',
        '/avatars/avatar-bajo.svg',
        '/avatars/avatar-armonia.svg',
        '/avatars/avatar-acustico.svg',
      ];
      const sampleNames = ['Valentina Sol', 'Diego Vocal', 'Lucía Armonía', 'Gabriel Canto', 'Andrés Tenor'];
      const pickedName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const pickedAvatar = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];

      const randLevel = Math.floor(Math.random() * 6) + 2;
      const randXp = Math.floor(Math.random() * 800) + 500;
      friendToAdd = {
        id: `friend_${Date.now()}`,
        code: formattedCode,
        name: pickedName,
        avatar: pickedAvatar,
        level: randLevel,
        levelTitle: 'Cantante Entusiasmado',
        streak: Math.floor(Math.random() * 10) + 1,
        xpThisWeek: randXp,
        totalXp: randXp * 3 + Math.floor(Math.random() * 500),
        lessonsCompleted: randLevel * 4,
        practiceMinutes: Math.floor(Math.random() * 120) + 60,
        stabilityScore: Math.floor(Math.random() * 10) + 88,
        badgesCount: Math.floor(Math.random() * 10) + 5,
        vocalRange: 'Rango Vocal por Evaluar',
        statusText: 'Acepto tu solicitud de amistad',
        isOnline: true,
        duelsWonAgainst: 0,
        duelsLostAgainst: 0,
        joinedDate: 'Hoy'
      };
    }

    setFriends(prev => [friendToAdd, ...prev]);
    setInputCode('');
    audioService.playSoftDing();
    
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });

    setFeedbackMsg({ text: `¡Has agregado a ${friendToAdd.name} como amigo!`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSendNudge = (friend: FriendItem) => {
    audioService.playClickSound();
    audioService.playXpGainSound();
    setNudgeSentIds(prev => ({ ...prev, [friend.id]: true }));

    setFeedbackMsg({
      text: `¡Le enviaste un ánimo de canto a ${friend.name}!`,
      type: 'success'
    });

    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Title & Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-2xl ${
            zenMode
              ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
              : 'bg-indigo-50 dark:bg-indigo-950/70 text-[#4648d4] dark:text-[#c0c1ff]'
          }`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-heading font-extrabold text-base ${
              zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
            }`}>
              Amigos y Retos
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Conecta, compara progreso y desafía a otros cantantes
            </p>
          </div>
        </div>

        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
          zenMode
            ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
        }`}>
          {friends.length} {friends.length === 1 ? 'Amigo' : 'Amigos'}
        </span>
      </div>

      {/* My Friend Code Card */}
      <MyFriendCodeCard
        myCode={myCode}
        zenMode={zenMode}
        onCopy={handleCopyCode}
        onShare={handleShareCode}
        copied={copied}
      />

      {/* Add Friend By Code Input Form */}
      <AddFriendForm
        inputCode={inputCode}
        setInputCode={setInputCode}
        onSubmit={handleAddFriendByCode}
        feedbackMsg={feedbackMsg}
        zenMode={zenMode}
      />

      {/* Friends List & Weekly Ranking */}
      <FriendsRankingList
        friends={friends}
        userXp={userXp}
        userLevel={userLevel}
        nudgeSentIds={nudgeSentIds}
        zenMode={zenMode}
        onSelectFriend={handleSelectFriend}
        onOpenDuel={handleOpenDuel}
        onSendNudge={handleSendNudge}
      />

      {/* Friend Detail Modal */}
      <FriendDetailModal
        isOpen={Boolean(selectedFriendForDetail)}
        friend={selectedFriendForDetail}
        zenMode={zenMode}
        onClose={() => setSelectedFriendForDetail(null)}
        onOpenDuel={(friend) => {
          setSelectedFriendForDetail(null);
          handleOpenDuel(friend);
        }}
        onSendNudge={handleSendNudge}
        hasNudgeSent={Boolean(selectedFriendForDetail && nudgeSentIds[selectedFriendForDetail.id])}
      />

      {/* Duelo Rápido Modal */}
      <DueloRapidoModal
        isOpen={isDuelModalOpen}
        onClose={() => setIsDuelModalOpen(false)}
        opponent={selectedDuelOpponent}
      />
    </div>
  );
};

export default FriendsSection;
