'use client';

import { useState, useEffect } from 'react';
import { Star, Trophy, Flame, Music, ArrowLeft, Target, Drum, Brain, Zap, Award, Crown, Sparkles, Heart, Shield, Gem, Mic, Clock, TrendingUp, Headphones, Volume2, Eye, Ear, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useStreak } from '@/hooks/use-streak';
import { getVocalHistory, dbLoad, type VocalRecord } from '@/lib/db';
import { PushReminderCard } from '@/components/push-reminder-card';
import { lessons } from '@/lib/course-data';

type ChallengeDifficulty = 'Fácil' | 'Medio' | 'Difícil' | 'Maestro';
type ProgressState = Record<ChallengeDifficulty, Record<number, number>>;

const difficultySettings: Record<ChallengeDifficulty, { levelCount: number }> = {
  'Fácil': { levelCount: 12 },
  'Medio': { levelCount: 16 },
  'Difícil': { levelCount: 20 },
  'Maestro': { levelCount: 10 },
};

export type Achievement = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  check: (p: ProgressState, stats: Stats) => boolean;
};

export type Stats = {
  totalStars: number;
  totalCompleted: number;
  totalPerfect: number;
  totalLevels: number;
  maxStars: number;
  easyCompleted: number;
  easyStars: number;
  mediumCompleted: number;
  mediumStars: number;
  hardCompleted: number;
  hardStars: number;
};

export const achievements: Achievement[] = [
  // Primer paso
  { id: 'first_note', icon: <Mic className="w-5 h-5" />, title: 'Primera Nota', description: 'Completa tu primer nivel', check: (_, s) => s.totalCompleted >= 1 },
  { id: 'warming_up', icon: <Flame className="w-5 h-5" />, title: 'Calentando', description: 'Completa 3 niveles', check: (_, s) => s.totalCompleted >= 3 },
  { id: 'getting_started', icon: <TrendingUp className="w-5 h-5" />, title: 'En Camino', description: 'Completa 5 niveles', check: (_, s) => s.totalCompleted >= 5 },
  
  // Fácil
  { id: 'easy_half', icon: <Music className="w-5 h-5" />, title: 'Medio Camino Fácil', description: 'Completa 6 niveles en Fácil', check: (_, s) => s.easyCompleted >= 6 },
  { id: 'easy_master', icon: <Award className="w-5 h-5" />, title: 'Fácil Dominado', description: 'Completa todos los niveles Fácil', check: (_, s) => s.easyCompleted >= 12 },
  { id: 'easy_stars', icon: <Star className="w-5 h-5" />, title: 'Estrellas Fáciles', description: 'Consigue 24+ estrellas en Fácil', check: (_, s) => s.easyStars >= 24 },
  { id: 'easy_perfect', icon: <Sparkles className="w-5 h-5" />, title: 'Fácil Perfecto', description: '3 estrellas en todos los niveles Fácil', check: (_, s) => s.easyStars >= 36 },
  
  // Medio
  { id: 'medium_start', icon: <Headphones className="w-5 h-5" />, title: 'Oído Musical', description: 'Completa 5 niveles en Medio', check: (_, s) => s.mediumCompleted >= 5 },
  { id: 'medium_half', icon: <Brain className="w-5 h-5" />, title: 'Mente Musical', description: 'Completa 8 niveles en Medio', check: (_, s) => s.mediumCompleted >= 8 },
  { id: 'medium_master', icon: <Trophy className="w-5 h-5" />, title: 'Medio Dominado', description: 'Completa todos los niveles Medio', check: (_, s) => s.mediumCompleted >= 16 },
  { id: 'medium_perfect', icon: <Crown className="w-5 h-5" />, title: 'Rey del Medio', description: '3 estrellas en todos los de Medio', check: (_, s) => s.mediumStars >= 48 },
  
  // Difícil
  { id: 'hard_brave', icon: <Shield className="w-5 h-5" />, title: 'Valiente', description: 'Completa tu primer nivel Difícil', check: (_, s) => s.hardCompleted >= 1 },
  { id: 'hard_5', icon: <Drum className="w-5 h-5" />, title: 'Ritmo Fuerte', description: 'Completa 5 niveles en Difícil', check: (_, s) => s.hardCompleted >= 5 },
  { id: 'hard_10', icon: <Volume2 className="w-5 h-5" />, title: 'Voz Poderosa', description: 'Completa 10 niveles en Difícil', check: (_, s) => s.hardCompleted >= 10 },
  { id: 'hard_master', icon: <Gem className="w-5 h-5" />, title: 'Virtuoso', description: 'Completa todos los niveles Difícil', check: (_, s) => s.hardCompleted >= 20 },
  { id: 'hard_perfect', icon: <Zap className="w-5 h-5" />, title: 'Leyenda', description: '3 estrellas en todos los de Difícil', check: (_, s) => s.hardStars >= 60 },
  
  // Globales
  { id: 'star_10', icon: <Star className="w-5 h-5" />, title: '10 Estrellas', description: 'Acumula 10 estrellas en total', check: (_, s) => s.totalStars >= 10 },
  { id: 'star_50', icon: <Star className="w-5 h-5" />, title: '50 Estrellas', description: 'Acumula 50 estrellas en total', check: (_, s) => s.totalStars >= 50 },
  { id: 'star_100', icon: <Star className="w-5 h-5" />, title: 'Centenario', description: 'Acumula 100 estrellas en total', check: (_, s) => s.totalStars >= 100 },
  { id: 'perfectionist_5', icon: <Target className="w-5 h-5" />, title: 'Perfeccionista', description: 'Obtén 3⭐ en 5 niveles', check: (_, s) => s.totalPerfect >= 5 },
  { id: 'perfectionist_15', icon: <Eye className="w-5 h-5" />, title: 'Ojo de Águila', description: 'Obtén 3⭐ en 15 niveles', check: (_, s) => s.totalPerfect >= 15 },
  { id: 'half_way', icon: <Heart className="w-5 h-5" />, title: 'Mitad del Camino', description: 'Completa 24 niveles en total', check: (_, s) => s.totalCompleted >= 24 },
  { id: 'all_done', icon: <Crown className="w-5 h-5" />, title: 'Maestro Absoluto', description: 'Completa los 48 niveles', check: (_, s) => s.totalCompleted >= 48 },
];

function MiniStars({ count, size = 'sm' }: { count: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-[2px]">
      {[1, 2, 3].map(s => (
        <Star key={s} className={cn(starSize, s <= count ? "text-accent fill-accent" : "text-muted-foreground/20 fill-muted-foreground/10")} />
      ))}
    </div>
  );
}

export function computeStats(progress: ProgressState): Stats {
  const getCount = (diff: ChallengeDifficulty) => Object.values(progress[diff] || {}).filter(s => s > 0).length;
  const getStars = (diff: ChallengeDifficulty) => Object.values(progress[diff] || {}).reduce((sum, s) => sum + s, 0);
  const getPerfect = (diff: ChallengeDifficulty) => Object.values(progress[diff] || {}).filter(s => s >= 3).length;
  const totalLevels = Object.values(difficultySettings).reduce((sum, s) => sum + s.levelCount, 0);
  return {
    totalStars: getStars('Fácil') + getStars('Medio') + getStars('Difícil'),
    totalCompleted: getCount('Fácil') + getCount('Medio') + getCount('Difícil'),
    totalPerfect: getPerfect('Fácil') + getPerfect('Medio') + getPerfect('Difícil'),
    totalLevels,
    maxStars: totalLevels * 3,
    easyCompleted: getCount('Fácil'),
    easyStars: getStars('Fácil'),
    mediumCompleted: getCount('Medio'),
    mediumStars: getStars('Medio'),
    hardCompleted: getCount('Difícil'),
    hardStars: getStars('Difícil'),
  };
}

export function ProgressDashboard({ vocalRangeKey, onClose }: { vocalRangeKey: string; onClose: () => void }) {
  const [progress, setProgress] = useState<ProgressState>({ 'Fácil': {}, 'Medio': {}, 'Difícil': {}, 'Maestro': {} });

  const [academyProgress, setAcademyProgress] = useState<Record<number, boolean[]>>({});

  useEffect(() => {
    dbLoad<Record<number, boolean[]>>('afinapp_completed_exercises').then(saved => {
      if (saved) setAcademyProgress(saved);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    dbLoad<Record<string, Record<string, number | boolean>>>(vocalRangeKey).then(parsed => {
      if (parsed && parsed['Fácil'] && parsed['Medio'] && parsed['Difícil']) {
        const migrated: ProgressState = { 'Fácil': {}, 'Medio': {}, 'Difícil': {}, 'Maestro': {} };
        for (const diff of ['Fácil', 'Medio', 'Difícil', 'Maestro'] as ChallengeDifficulty[]) {
          for (const [level, value] of Object.entries(parsed[diff] || {})) {
            migrated[diff][Number(level)] = typeof value === 'boolean' ? (value ? 1 : 0) : (value as number);
          }
        }
        setProgress(migrated);
      }
    }).catch(console.error);
  }, [vocalRangeKey]);

  const streak = useStreak();
  const [vocalHistory, setVocalHistory] = useState<VocalRecord[]>([]);

  useEffect(() => {
    getVocalHistory().then(records => setVocalHistory(records.sort((a,b) => a.date - b.date))).catch(console.error);
  }, []);

  const handleShare = async () => {
    const text = `🎵 ¡Llevo una racha de ${streak} días en AfinApp! He conseguido ${stats.totalStars} estrellas y superado ${stats.totalCompleted} niveles. ¿Puedes afinar mejor que yo? 🎤✨`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AfinApp - Entrenador Vocal',
          text: text,
          url: window.location.origin,
        });
      } catch (e) {
        console.log('Cancelado o error:', e);
      }
    } else {
      navigator.clipboard.writeText(text + " " + window.location.origin);
      alert("¡Copiado al portapapeles! Ya puedes pegarlo en tus redes.");
    }
  };

  const stats = computeStats(progress);
  const { totalLevels, maxStars } = stats;

  const overallProgress = Math.round((stats.totalStars / maxStars) * 100);
  const unlockedAchievements = achievements.filter(a => a.check(progress, stats));

  const diffConfigs: { key: ChallengeDifficulty; label: string; color: string; dotColor: string; completed: number; stars: number }[] = [
    { key: 'Fácil', label: 'Fácil', color: 'from-yellow-400/20 to-amber-600/10', dotColor: 'bg-yellow-400', completed: stats.easyCompleted, stars: stats.easyStars },
    { key: 'Medio', label: 'Medio', color: 'from-blue-400/20 to-blue-600/10', dotColor: 'bg-blue-500', completed: stats.mediumCompleted, stars: stats.mediumStars },
    { key: 'Difícil', label: 'Difícil', color: 'from-red-400/20 to-red-600/10', dotColor: 'bg-red-500', completed: stats.hardCompleted, stars: stats.hardStars },
  ];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-full h-[100dvh] overflow-y-auto">
      {/* Header */}
      <header className="flex-shrink-0 p-3 sm:p-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center">
          <Button onClick={onClose} variant="ghost" className="text-sm h-auto p-1 sm:p-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex-grow text-center pr-10">Mi Progreso</h1>
        </div>
      </header>

      <div className="px-3 sm:px-4 pb-6 space-y-3">
        {/* Hero Stats */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/20 p-4 sm:p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl sm:text-4xl font-black text-accent">{stats.totalStars}</span>
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">estrellas</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-foreground">{stats.totalCompleted}</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">de {totalLevels} niveles</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-primary">{stats.totalPerfect}</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">perfectos ⚡</p>
            </div>
          </div>

          <div className="mt-3">
            <Progress value={overallProgress} className="h-2" />
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1">{overallProgress}% completado</p>
          </div>
        </div>

        {/* Academy Course Card */}
        {(() => {
          let completedExercisesCount = 0;
          let fullyCompletedClassesCount = 0;
          
          Object.values(academyProgress).forEach(arr => {
            const completedCount = arr.filter(Boolean).length;
            completedExercisesCount += completedCount;
            if (completedCount === 3) {
              fullyCompletedClassesCount += 1;
            }
          });

          const totalCourseExercises = lessons.reduce((sum, l) => sum + l.exercises.length, 0);
          const academyPct = totalCourseExercises > 0
            ? Math.round((completedExercisesCount / totalCourseExercises) * 100)
            : 0;
          return (
            <Card className="overflow-hidden bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border border-purple-500/20 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <span className="font-bold text-sm">Academia de Canto (Curso)</span>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  {completedExercisesCount}/{totalCourseExercises} Ejercicios
                </span>
              </div>
              <Progress value={academyPct} className="h-1.5 mb-1.5" />
              <div className="flex justify-between items-center text-[9px] text-muted-foreground font-medium px-0.5">
                <span>{fullyCompletedClassesCount}/{lessons.length} Clases completadas</span>
                <span>{academyPct}% de ejercicios</span>
              </div>
            </Card>
          );
        })()}

        {/* Per-Difficulty Cards */}
        {diffConfigs.map(({ key, label, color, dotColor, completed, stars }) => {
          const levels = difficultySettings[key].levelCount;
          return (
            <Card key={key} className={cn("overflow-hidden bg-gradient-to-r border-0", color)}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", dotColor)} />
                    <span className="font-bold text-sm sm:text-base">{label}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">{completed}/{levels} · {stars}⭐</span>
                </div>
                
                {/* Level Grid with Stars */}
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: levels }, (_, i) => i + 1).map(level => {
                    const levelStars = progress[key]?.[level] || 0;
                    return (
                      <div
                        key={level}
                        className={cn(
                          "flex flex-col items-center justify-center py-1.5 rounded-lg text-center transition-all",
                          levelStars > 0
                            ? "bg-background/60 shadow-sm"
                            : "bg-background/20"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-bold leading-none",
                          levelStars > 0 ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                          {level}
                        </span>
                        <div className="mt-0.5">
                          {levelStars > 0 ? (
                            <MiniStars count={levelStars} />
                          ) : (
                            <div className="flex gap-[2px]">
                              {[1,2,3].map(s => <div key={s} className="w-2.5 h-2.5 rounded-full bg-muted-foreground/10" />)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Push Reminder */}
        <PushReminderCard />

        {/* Vocal History Timeline */}
        {vocalHistory.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Evolución Vocal
              </h2>
              <span className="text-xs sm:text-sm text-muted-foreground font-bold">{vocalHistory.length} tests</span>
            </div>
            <Card className="overflow-hidden bg-gradient-to-r from-emerald-400/10 to-emerald-600/5 border-0">
              <CardContent className="p-3 sm:p-4">
                {/* SVG Range Bar Chart */}
                <div className="w-full overflow-x-auto no-scrollbar">
                  <div className="flex items-end gap-2" style={{ minWidth: Math.max(vocalHistory.length * 52, 200) }}>
                    {vocalHistory.map((rec, idx) => {
                      const range = rec.highestMidi - rec.lowestMidi;
                      const maxRange = 40;
                      const pct = Math.min((range / maxRange) * 100, 100);
                      const dateStr = new Date(rec.date).toLocaleDateString('es', { day: 'numeric', month: 'short' });
                      return (
                        <div key={rec.id || idx} className="flex flex-col items-center flex-shrink-0" style={{ width: 44 }}>
                          <span className="text-[9px] font-bold text-emerald-600 mb-1">{range}st</span>
                          <div className="w-6 rounded-t-md bg-emerald-500/80 transition-all" style={{ height: `${Math.max(pct * 0.8, 8)}px` }} />
                          <span className="text-[7px] text-muted-foreground mt-1 leading-none text-center">{dateStr}</span>
                          {rec.coloratura && <span className="text-[7px] text-primary font-bold">{rec.coloratura}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Latest vs First comparison */}
                {vocalHistory.length >= 2 && (() => {
                  const first = vocalHistory[0];
                  const last = vocalHistory[vocalHistory.length - 1];
                  const firstRange = first.highestMidi - first.lowestMidi;
                  const lastRange = last.highestMidi - last.lowestMidi;
                  const diff = lastRange - firstRange;
                  return (
                    <div className="mt-3 p-3 bg-background/60 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">Tu primera vez: <strong>{first.lowestName} — {first.highestName}</strong></p>
                      <p className="text-xs text-muted-foreground">Ahora: <strong>{last.lowestName} — {last.highestName}</strong></p>
                      <p className={cn("text-sm font-black mt-1", diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                        {diff > 0 ? `+${diff} semitonos 🚀` : diff < 0 ? `${diff} semitonos` : 'Sin cambio'}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievements */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-black text-base sm:text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" /> Logros
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground font-bold">{unlockedAchievements.length}/{achievements.length}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {achievements.map(a => {
              const unlocked = unlockedAchievements.includes(a);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl transition-all",
                    unlocked
                      ? "bg-accent/10 border border-accent/30 shadow-sm"
                      : "bg-muted/20 border border-transparent opacity-40"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center mb-1.5",
                    unlocked ? "bg-accent/20 text-accent" : "bg-muted/50 text-muted-foreground"
                  )}>
                    {a.icon}
                  </div>
                  <p className={cn("font-bold text-[10px] sm:text-xs leading-tight", unlocked ? "text-foreground" : "text-muted-foreground")}>
                    {a.title}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                    {a.description}
                  </p>
                  {unlocked && (
                    <div className="mt-1">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
