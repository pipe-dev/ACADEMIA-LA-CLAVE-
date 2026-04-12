import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Lock, Flame, Gift, Crown, Star, Sparkles, Zap, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const MILESTONES = [
  { days: 7, title: "1 Semana", reward: "Estrella de Bronce", icon: Star },
  { days: 15, title: "Mitad de Mes", reward: "Sonido de Victoria Épico", icon: Sparkles },
  { days: 30, title: "1 Mes", reward: "Skin: Tema Zafiro", icon: Gift },
  { days: 60, title: "2 Meses", reward: "Nivel de Dificultad Maestro", icon: Rocket },
  { days: 90, title: "3 Meses", reward: "Skin: Piano de Oro", icon: Star },
  { days: 120, title: "4 Meses", reward: "Partículas de Confeti Deluxe", icon: Sparkles },
  { days: 180, title: "6 Meses", reward: "Corona de Rubí", icon: Crown },
  { days: 240, title: "8 Meses", reward: "Skin: Tema Galaxia", icon: Gift },
  { days: 300, title: "10 Meses", reward: "Título Especial: Maestro Afinador", icon: Star },
  { days: 337, title: "11 Meses (Sem. 1)", reward: "Aura de Fuego", icon: Flame },
  { days: 344, title: "11 Meses (Sem. 2)", reward: "Aura de Rayo", icon: Zap },
  { days: 351, title: "11 Meses (Sem. 3)", reward: "Aura Cósmica", icon: Sparkles },
  { days: 358, title: "11 Meses (Sem. 4)", reward: "Estela Divina", icon: Star },
  { days: 365, title: "1 Año (Mes 12)", reward: "Pase VIP Vitalicio 👑", icon: Crown },
];

export function StreakRewards({ isOpen, onClose, currentStreak, onOpenInventory }: { isOpen: boolean; onClose: () => void; currentStreak: number; onOpenInventory?: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the current milestone
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      setTimeout(() => {
        const activeNode = document.getElementById('current-milestone');
        if (activeNode && scrollRef.current) {
          activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen]);

  const nextMilestone = MILESTONES.find(m => currentStreak < m.days);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-2xl bg-card border-none shadow-2xl p-0 overflow-hidden [&>button]:hidden">
        <DialogHeader className="p-6 pb-2 text-center relative z-20 bg-gradient-to-b from-orange-500/20 to-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 rounded-full w-8 h-8 opacity-70 hover:opacity-100 bg-background/50 hover:bg-background/80 z-50 text-foreground cursor-pointer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Cerrar</span>
          </Button>
          
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">Camino de Racha</DialogTitle>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Tu racha actual:{' '}
            <span className="text-orange-500 font-bold text-lg">{currentStreak} {currentStreak === 1 ? 'día' : 'días'}</span> 🔥
          </p>
          {nextMilestone && (
            <p className="text-xs text-muted-foreground mt-1">
              Próximo premio en {nextMilestone.days - currentStreak} días
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="h-[60vh] sm:h-[400px] w-full px-6 pb-6" ref={scrollRef}>
          <div className="relative py-4 pl-4 border-l-2 border-muted/50 ml-4 space-y-8">
            {MILESTONES.map((milestone, index) => {
              const isUnlocked = currentStreak >= milestone.days;
              const isNext = nextMilestone?.days === milestone.days;
              const Icon = milestone.icon;

              return (
                <div 
                  key={milestone.days} 
                  id={isNext ? 'current-milestone' : undefined}
                  className={cn(
                    "relative pl-6 transition-all duration-500",
                    !isUnlocked && !isNext ? "opacity-40 grayscale" : ""
                  )}
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute -left-[1.65rem] top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 shadow-sm",
                    isUnlocked 
                      ? "bg-orange-500 border-orange-500/30" 
                      : (isNext ? "bg-card border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-card border-muted-foreground/30")
                  )}>
                    {isUnlocked && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {!isUnlocked && !isNext && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {isNext && <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />}
                  </div>

                  {/* Content Card */}
                  <div className={cn(
                    "rounded-xl p-4 border",
                    isUnlocked 
                      ? "bg-orange-500/10 border-orange-500/30" 
                      : (isNext ? "bg-card border-border/50 shadow-md" : "bg-muted/30 border-transparent")
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-black uppercase tracking-wider",
                        isUnlocked ? "text-orange-500" : "text-muted-foreground"
                      )}>
                        {milestone.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {milestone.days} días
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isUnlocked ? "bg-orange-500 text-white" : "bg-background text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "font-bold text-sm sm:text-base leading-tight",
                        isUnlocked ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {milestone.reward}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Open Inventory Button */}
          {currentStreak >= 7 && onOpenInventory && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                className="rounded-xl border-primary/30 text-primary font-bold hover:bg-primary/10"
                onClick={() => { onClose(); setTimeout(() => onOpenInventory(), 150); }}
              >
                🎒 Ver Mi Armario
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
