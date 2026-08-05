'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import { DueloRapidoModal } from './DueloRapidoModal';
import { 
  Users, UserPlus, Copy, Check, Share2, Flame, Sparkles, Trophy, Zap, Search, CheckCircle2, Swords
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface FriendItem {
  id: string;
  code: string;
  name: string;
  avatar: string;
  level: number;
  levelTitle: string;
  streak: number;
  xpThisWeek: number;
  vocalRange: string;
  statusText: string;
  isOnline: boolean;
  lastNudgeSent?: boolean;
}

// Pre-populated initial friends list for instant engagement & testing
const INITIAL_DEMO_FRIENDS: FriendItem[] = [
  {
    id: 'f1',
    code: 'VOCAL-9821',
    name: 'Camila Ríos',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    level: 5,
    levelTitle: 'Soprano Aficionada',
    streak: 8,
    xpThisWeek: 1240,
    vocalRange: 'Soprano (Do4 - Do6)',
    statusText: '¡Afinó 12 notas hoy!',
    isOnline: true
  },
  {
    id: 'f2',
    code: 'CANTO-4102',
    name: 'Mateo Fernández',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    level: 4,
    levelTitle: 'Tenor Lírico',
    streak: 5,
    xpThisWeek: 980,
    vocalRange: 'Tenor (La2 - Sol4)',
    statusText: 'Practicando apoyo diafragmático',
    isOnline: false
  },
  {
    id: 'f3',
    code: 'SOLFEO-8830',
    name: 'Sofía Mendoza',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    level: 6,
    levelTitle: 'Mezzosoprano Vocal',
    streak: 12,
    xpThisWeek: 1450,
    vocalRange: 'Mezzosoprano (La2 - La5)',
    statusText: '¡En racha de 12 días sin fallar!',
    isOnline: true
  }
];

// Demo directory of discoverable friends by code
const DEMO_FRIEND_DIRECTORY: Record<string, Omit<FriendItem, 'id'>> = {
  'VOCAL-2026': {
    code: 'VOCAL-2026',
    name: 'Lucas Barítono',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    level: 3,
    levelTitle: 'Barítono Resonante',
    streak: 4,
    xpThisWeek: 720,
    vocalRange: 'Barítono (Mi2 - Mi4)',
    statusText: 'Listo para dueto de afinación',
    isOnline: true
  },
  'CANTO-9941': {
    code: 'CANTO-9941',
    name: 'Elena Canto',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    level: 7,
    levelTitle: 'Maestra de Solfeo',
    streak: 15,
    xpThisWeek: 1890,
    vocalRange: 'Contralto (Fa3 - Fa5)',
    statusText: '¡Superó la lección de escalas!',
    isOnline: false
  }
};

interface FriendsSectionProps {
  userXp: number;
  userLevel: number;
}

export const FriendsSection: React.FC<FriendsSectionProps> = ({ userXp, userLevel }) => {
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

  const handleOpenDuel = (friend?: FriendItem) => {
    audioService.playOpenSound();
    setSelectedDuelOpponent(friend || null);
    setIsDuelModalOpen(true);
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

  const handleAddFriendByCode = (e: React.FormEvent) => {
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

    // Check if already added
    const alreadyExists = friends.some(f => f.code === formattedCode);
    if (alreadyExists) {
      setFeedbackMsg({ text: 'Este cantante ya está en tu lista de amigos.', type: 'info' });
      return;
    }

    // Check directory or generate a customized mock friend
    let friendToAdd: FriendItem;

    if (DEMO_FRIEND_DIRECTORY[formattedCode]) {
      const demo = DEMO_FRIEND_DIRECTORY[formattedCode];
      friendToAdd = {
        ...demo,
        id: `friend_${Date.now()}`
      };
    } else {
      // Create dynamically generated friend based on code
      const codeSuffix = formattedCode.replace(/[^0-9]/g, '').slice(0, 3) || '555';
      const sampleNames = ['Valentina Sol', 'Diego Vocal', 'Lucía Armonía', 'Gabriel Canto', 'Andrés Tenor'];
      const pickedName = sampleNames[Math.floor(Math.random() * sampleNames.length)];

      friendToAdd = {
        id: `friend_${Date.now()}`,
        code: formattedCode,
        name: pickedName,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + (parseInt(codeSuffix) * 1000)}?w=150&auto=format&fit=crop&q=80`,
        level: Math.floor(Math.random() * 6) + 2,
        levelTitle: 'Cantante Entusiasmado',
        streak: Math.floor(Math.random() * 10) + 1,
        xpThisWeek: Math.floor(Math.random() * 800) + 500,
        vocalRange: 'Rango Vocal por Evaluar',
        statusText: '¡Aceptó tu solicitud de amistad!',
        isOnline: true
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

  // Sort friends by XP this week
  const sortedFriends = [...friends].sort((a, b) => b.xpThisWeek - a.xpThisWeek);

  return (
    <div className="space-y-4 pt-2">
      {/* Title & Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-[#4648d4] dark:text-[#c0c1ff]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#0b1c30] dark:text-[#d3e4fe]">
              Amigos y Retos
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Conecta, compara progreso y desafía a otros cantantes
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full">
          {friends.length} {friends.length === 1 ? 'Amigo' : 'Amigos'}
        </span>
      </div>

      {/* MY FRIEND CODE CARD */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-5 shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200 block">
              Tu Código de Cantante
            </span>
            <span className="font-heading font-extrabold text-2xl tracking-wider text-white">
              {myCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Copiar código"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareCode}
              className="p-2.5 rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="Compartir código"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-purple-100/90 font-medium leading-relaxed relative z-10">
          Comparte este código con tus compañeros de canto para que te agreguen y puedan ver sus posiciones en el ranking semanal.
        </p>
      </div>

      {/* ADD FRIEND BY CODE INPUT FORM */}
      <form onSubmit={handleAddFriendByCode} className="bg-white dark:bg-[#102034] rounded-3xl p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-xs space-y-3 transition-colors">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Agregar Amigo por Código
        </label>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Ej: CANTO-9941 o VOCAL-2026"
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 text-xs text-[#0b1c30] dark:text-[#d3e4fe] placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 uppercase font-mono tracking-wide"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 rounded-2xl bg-[#4648d4] hover:bg-indigo-600 text-white font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Dynamic Feedback Banner */}
        {feedbackMsg && (
          <div className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[10px] text-slate-400 font-semibold">
            Códigos de demostración:
          </span>
          <button
            type="button"
            onClick={() => setInputCode('VOCAL-2026')}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 cursor-pointer"
          >
            VOCAL-2026
          </button>
          <span className="text-slate-300 text-[10px]">|</span>
          <button
            type="button"
            onClick={() => setInputCode('CANTO-9941')}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 cursor-pointer"
          >
            CANTO-9941
          </button>
        </div>
      </form>

      {/* FRIENDS LIST & WEEKLY RANKING */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
              Tabla de Amigos de Cantar
            </h4>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            XP Esta Semana
          </span>
        </div>

        {/* User's Own Standing Banner */}
        <div className="bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 p-3 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
              TÚ
            </div>
            <div>
              <span className="font-heading font-extrabold text-indigo-950 dark:text-indigo-100 block">
                Tu Puntuación
              </span>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">
                Nivel {userLevel}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="font-heading font-extrabold text-sm text-indigo-600 dark:text-indigo-300 block">
              {userXp.toLocaleString()} XP
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Esta semana
            </span>
          </div>
        </div>

        {/* Friends Cards */}
        {sortedFriends.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Aún no tienes amigos agregados
            </p>
            <p className="text-[11px] text-slate-400">
              Ingresa el código de un compañero arriba para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFriends.map((friend, idx) => {
              const hasNudge = nudgeSentIds[friend.id];

              return (
                <motion.div
                  key={friend.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Position Badge */}
                      <span className={`w-5 text-center font-heading font-extrabold text-xs ${
                        idx === 0 ? 'text-amber-500 font-black scale-110' : idx === 1 ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        #{idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-xs"
                        />
                        {friend.isOnline && (
                          <span className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full absolute bottom-0 right-0" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-heading font-extrabold text-xs text-[#0b1c30] dark:text-[#d3e4fe] truncate">
                            {friend.name}
                          </h5>
                          <span className="text-[9px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full">
                            {friend.code}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                          <span>Nivel {friend.level}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500 animate-pulse" />
                            {friend.streak} días
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* XP Right Column */}
                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-xs text-indigo-600 dark:text-indigo-400 block">
                        {friend.xpThisWeek.toLocaleString()} XP
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        {friend.vocalRange}
                      </span>
                    </div>
                  </div>

                  {/* Status & Nudge Action Footer */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate italic max-w-[140px]">
                      {friend.statusText}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <motion.button
                        onClick={() => handleOpenDuel(friend)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <Swords className="w-3 h-3" />
                        <span>Retar Duelo</span>
                      </motion.button>

                      <motion.button
                        onClick={() => handleSendNudge(friend)}
                        disabled={hasNudge}
                        whileHover={!hasNudge ? { scale: 1.05 } : undefined}
                        whileTap={!hasNudge ? { scale: 0.92 } : undefined}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          hasNudge
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80'
                        }`}
                      >
                        {hasNudge ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>¡Ánimo!</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>Ánimo</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

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
