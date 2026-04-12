'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDialog({ isOpen, onClose }: UserProfileDialogProps) {
  const { profile, saveProfile, avatars } = useProfile();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  useEffect(() => {
    if (isOpen && profile) {
      setName(profile.displayName);
      setSelectedAvatar(profile.avatarId);
    }
  }, [isOpen, profile]);

  const handleSave = async () => {
    await saveProfile(name, selectedAvatar);
    toast({
      variant: "accent",
      title: "¡Perfil guardado!",
      description: `${avatars[selectedAvatar]} ${name || 'Cantante'}`,
      duration: 2000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-2xl bg-card border-border/40 shadow-2xl p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black text-foreground">Mi Perfil</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4">
          {/* Avatar Picker */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center text-5xl shadow-lg">
              {avatars[selectedAvatar]}
            </div>
            <Label className="text-sm text-muted-foreground font-medium">Elige tu avatar</Label>
            <div className="grid grid-cols-6 gap-2 w-full">
              {avatars.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={cn(
                    "w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-200 border-2",
                    i === selectedAvatar
                      ? "border-primary bg-primary/20 scale-110 shadow-lg shadow-primary/20"
                      : "border-transparent bg-secondary/50 hover:bg-secondary hover:scale-105"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName" className="text-sm font-medium">Tu nombre artístico</Label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cantante"
              maxLength={20}
              className="h-12 text-lg rounded-xl border-primary/20 focus:border-primary"
            />
          </div>

          {/* Save */}
          <Button onClick={handleSave} size="lg" className="w-full h-14 text-lg font-bold rounded-xl">
            Guardar Perfil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
