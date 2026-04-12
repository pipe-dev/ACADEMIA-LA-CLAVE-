import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Loader2 } from "lucide-react";
import { SocialShareCard, SocialShareCardProps } from "./social-share-card";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: Omit<SocialShareCardProps, 'innerRef' | 'className'>;
}

export function ShareDialog({ isOpen, onClose, cardData }: ShareDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Dynamically scale the huge 1080px card to fit in the modal
  useEffect(() => {
    if (!isOpen) return;

    let resizeObserver: ResizeObserver | null = null;
    let timeoutId: NodeJS.Timeout;

    const attachObserver = () => {
      if (!containerRef.current) {
         // Retry slightly later if not mounted yet
         timeoutId = setTimeout(attachObserver, 50);
         return;
      }
      
      const updateScale = (w: number) => {
          const h = window.innerHeight * 0.85 - 160; // Max allowed height roughly
          setScale(Math.min(w / 1080, Math.max(0.1, h / 1350)));
      };

      updateScale(containerRef.current.clientWidth);

      resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          updateScale(entries[0].contentRect.width);
        }
      });
      resizeObserver.observe(containerRef.current);
    };

    timeoutId = setTimeout(attachObserver, 10);

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isOpen]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      // Allow browser minimal time to paint any pending CSS
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution for the image output
        useCORS: true,
        backgroundColor: '#09090b',
        logging: false,
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      
      if (!blob) throw new Error("Could not generate image blob");

      const file = new File([blob], 'afinapp-logro.png', { type: 'image/png' });

      // Try Web Share API for Mobile devices
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'AfinApp 🎤',
          text: '¡Mira mi progreso en AfinApp! Domina tu voz.',
          files: [file]
        });
      } else {
        // Fallback: Direct Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'afinapp-logro.png';
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Imagen Guardada",
          description: "La tarjeta de tu logro ha sido descargada.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error generating share image:", error);
      toast({
        variant: "destructive",
        title: "Error al compartir",
        description: "Hubo un problema al generar tu tarjeta.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] rounded-2xl bg-card border-border/40 shadow-2xl p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex flex-col items-center">
        <DialogHeader className="text-center mb-2 w-full">
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground">Comparte tu Logro</DialogTitle>
        </DialogHeader>

        {/* Scaled Preview Container */}
        <div 
          ref={containerRef} 
          className="w-full relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          style={{ height: `${1350 * scale}px` }}
        >
          <div 
            className="absolute top-0"
            style={{ 
              left: `calc(50% - ${1080 * scale / 2}px)`,
              width: '1080px',
              height: '1350px',
              transform: `scale(${scale})`, 
              transformOrigin: 'top left' 
            }}
          >
            <SocialShareCard innerRef={cardRef} {...cardData} />
          </div>
        </div>

        <div className="w-full flex gap-3 mt-6">
          <Button 
            onClick={handleShare} 
            disabled={isGenerating}
            size="lg" 
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white border-0 shadow-lg shadow-orange-500/25"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando Píxeles...</>
            ) : (
              <><Share2 className="mr-2 h-5 w-5" /> Compartir</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
