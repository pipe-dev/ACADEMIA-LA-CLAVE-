'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Lock, Check, Palette, Volume2, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useInventory, ALL_REWARDS, type RewardDefinition, type RewardCategory } from "@/hooks/use-inventory";
import { useStreak } from "@/hooks/use-streak";
import { useToast } from "@/hooks/use-toast";

const TABS: { id: RewardCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'theme', label: 'Temas', icon: <Palette className="w-4 h-4" /> },
  { id: 'sound', label: 'Sonidos', icon: <Volume2 className="w-4 h-4" /> },
  { id: 'aura', label: 'Auras', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'confetti', label: 'Extras', icon: <PartyPopper className="w-4 h-4" /> },
];

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryDialog({ isOpen, onClose }: InventoryDialogProps) {
  const { inventory, isUnlocked, equipReward, unequipReward } = useInventory();
  const streak = useStreak();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<RewardCategory | 'all'>('theme');

  const filteredRewards = ALL_REWARDS.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'confetti') return r.category === 'confetti' || r.category === 'badge';
    return r.category === activeTab;
  });

  const isEquipped = (reward: RewardDefinition) => {
    const cat = reward.category;
    if (cat === 'badge') return false;
    return (inventory.equipped as any)[cat] === reward.id;
  };

  const handleToggleEquip = (reward: RewardDefinition) => {
    if (!isUnlocked(reward.id)) return;
    if (isEquipped(reward)) {
      unequipReward(reward.category);
      toast({ variant: 'accent', title: `${reward.icon} ${reward.name} removido`, duration: 2000 });
    } else {
      equipReward(reward);
      toast({ variant: 'accent', title: `${reward.icon} ¡${reward.name} equipado!`, duration: 2000 });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] w-[95vw] rounded-2xl bg-card border-none shadow-2xl p-0 overflow-hidden [&>button]:hidden">
        <DialogHeader className="p-5 pb-3 relative bg-gradient-to-b from-primary/10 to-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-3 top-3 rounded-full w-8 h-8 opacity-70 hover:opacity-100 bg-background/50 hover:bg-background/80 z-50 text-foreground cursor-pointer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Cerrar</span>
          </Button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-2 text-3xl">
            🎒
          </div>
          <DialogTitle className="text-2xl font-black text-foreground text-center">Mi Armario</DialogTitle>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Racha actual: <span className="text-orange-500 font-bold">{streak} días</span> — Equipá tus premios
          </p>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Items */}
        <ScrollArea className="h-[55vh] sm:h-[380px] w-full px-4 pb-4">
          <div className="flex flex-col gap-3">
            {filteredRewards.map(reward => {
              const unlocked = isUnlocked(reward.id);
              const equipped = isEquipped(reward);
              const daysLeft = Math.max(0, reward.requiredDays - streak);

              return (
                <div
                  key={reward.id}
                  className={cn(
                    "rounded-2xl p-4 border-2 transition-all duration-300",
                    equipped
                      ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10"
                      : unlocked
                        ? "bg-card border-border/50 hover:border-primary/30"
                        : "bg-muted/20 border-transparent opacity-50 grayscale"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
                      equipped ? "bg-primary/20" : unlocked ? "bg-secondary" : "bg-muted/50"
                    )}>
                      {unlocked ? reward.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold text-sm leading-tight",
                          unlocked ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {reward.name}
                        </span>
                        {equipped && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Equipado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {unlocked ? reward.description : `Racha de ${reward.requiredDays} días (faltan ${daysLeft})`}
                      </p>
                    </div>

                    {/* Action */}
                    {unlocked && reward.category !== 'badge' && (
                      <Button
                        size="sm"
                        variant={equipped ? "destructive" : "default"}
                        className={cn(
                          "shrink-0 rounded-xl h-9 text-xs font-bold",
                          equipped ? "bg-destructive/80 hover:bg-destructive" : ""
                        )}
                        onClick={() => handleToggleEquip(reward)}
                      >
                        {equipped ? 'Quitar' : 'Equipar'}
                      </Button>
                    )}
                    {unlocked && reward.category === 'badge' && (
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-accent" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredRewards.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No hay items en esta categoría.</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
