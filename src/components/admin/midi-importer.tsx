"use client";

import { useState, useCallback } from "react";
import { Midi } from "@tonejs/midi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Music, CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react";

const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

const midiToSpanishNote = (midi: number) => {
  const index = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${noteStrings[index]}${octave}`;
};

type MidiFileCard = {
  id: string;
  file: File;
  midiData: Midi | null;
  videoId: string;
  selectedTrackIndex: number | null;
  offset: number;
  status: "pending" | "uploading" | "success" | "error";
};

export function MidiImporter() {
  const [cards, setCards] = useState<MidiFileCard[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.mid') || f.name.endsWith('.midi'));
    
    if (files.length === 0) {
      toast({ title: "Formato inválido", description: "Solo se aceptan archivos .mid", variant: "destructive" });
      return;
    }

    const newCards: MidiFileCard[] = [];
    
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        
        newCards.push({
          id: Math.random().toString(36).substring(7),
          file,
          midiData: midi,
          videoId: "",
          selectedTrackIndex: null,
          offset: 0,
          status: "pending"
        });
      } catch (err) {
        toast({ title: `Error al leer ${file.name}`, description: "El archivo MIDI parece estar corrupto.", variant: "destructive" });
      }
    }

    setCards(prev => [...prev, ...newCards]);
  }, [toast]);

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const updateCard = (id: string, updates: Partial<MidiFileCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const uploadCard = async (card: MidiFileCard) => {
    if (!card.videoId || card.selectedTrackIndex === null || !card.midiData) return false;
    
    updateCard(card.id, { status: "uploading" });
    
    const track = card.midiData.tracks[card.selectedTrackIndex];
    if (!track || track.notes.length === 0) {
      updateCard(card.id, { status: "error" });
      return false;
    }

    // Mantener los tiempos originales intactos tal como lo pidió el usuario
    const formattedNotes = track.notes.map(n => ({
      time: n.time,
      note: midiToSpanishNote(n.midi)
    }));

    try {
      const res = await fetch('/api/karaoke-melody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: card.videoId, notes: formattedNotes })
      });
      
      // Guardar el offset de sincronización sin alterar las notas originales
      const resSync = await fetch('/api/karaoke-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: card.videoId, offset: card.offset || 0 })
      });
      
      if (res.ok && resSync.ok) {
        updateCard(card.id, { status: "success" });
        return true;
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      updateCard(card.id, { status: "error" });
      return false;
    }
  };

  const handleUploadAll = async () => {
    const readyCards = cards.filter(c => c.videoId && c.selectedTrackIndex !== null && c.status !== "success");
    if (readyCards.length === 0) {
      toast({ title: "Atención", description: "No hay archivos listos para subir. Asegúrate de poner el ID de YouTube y seleccionar una pista." });
      return;
    }

    setIsUploadingAll(true);
    let successCount = 0;
    
    for (const card of readyCards) {
      const ok = await uploadCard(card);
      if (ok) successCount++;
    }

    setIsUploadingAll(false);
    toast({ 
      title: "Subida Completada", 
      description: `Se guardaron ${successCount} de ${readyCards.length} canciones.` 
    });
  };

  return (
    <div className="space-y-8 pb-20">
      
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer"
      >
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
          <UploadCloud className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Arrastra tus archivos .mid aquí</h3>
        <p className="text-slate-400 max-w-md">Puedes soltar múltiples archivos al mismo tiempo. El sistema extraerá las pistas para que tú elijas cuál es la voz.</p>
      </div>

      {cards.length > 0 && (
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 sticky top-4 z-50 shadow-2xl">
          <div>
            <h4 className="text-xl font-bold text-white">Archivos Listos ({cards.length})</h4>
            <p className="text-sm text-slate-400">Configura cada tarjeta antes de subir.</p>
          </div>
          <Button 
            size="lg" 
            onClick={handleUploadAll} 
            disabled={isUploadingAll}
            className="bg-indigo-600 hover:bg-indigo-500 font-bold px-8 shadow-lg shadow-indigo-900/50"
          >
            {isUploadingAll ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UploadCloud className="w-5 h-5 mr-2" />}
            Subir Todas
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map(card => (
          <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col">
            <button 
              onClick={() => removeCard(card.id)}
              className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6 pr-8">
              <Music className="w-8 h-8 text-indigo-400 shrink-0" />
              <h5 className="text-lg font-bold text-white truncate" title={card.file.name}>{card.file.name}</h5>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <Label className="text-slate-400 mb-2 block">1. ID de YouTube de la Canción</Label>
                <Input 
                  placeholder="Ej: dQw4w9WgXcQ" 
                  value={card.videoId}
                  onChange={(e) => updateCard(card.id, { videoId: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-white font-mono"
                  disabled={card.status === "uploading" || card.status === "success"}
                />
              </div>

              <div>
                <Label className="text-slate-400 mb-3 block">2. Selecciona la Pista de la Voz</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {card.midiData?.tracks.map((track, i) => {
                    // Ignorar pistas vacías
                    if (track.notes.length === 0) return null;
                    
                    const isSelected = card.selectedTrackIndex === i;
                    
                    return (
                      <div 
                        key={i}
                        onClick={() => {
                          if (card.status !== "uploading" && card.status !== "success") {
                            updateCard(card.id, { selectedTrackIndex: i });
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-indigo-900/40 border-indigo-500 text-indigo-100' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm">Track {i}: {track.name || track.instrument.name || "Desconocido"}</p>
                          <p className="text-xs opacity-70">{track.notes.length} notas</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-slate-400 mb-2 block">3. Ajuste de Tiempo (Offset en Segundos)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number"
                    step="0.1"
                    value={card.offset}
                    onChange={(e) => updateCard(card.id, { offset: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-700 text-white font-mono w-32"
                    disabled={card.status === "uploading" || card.status === "success"}
                  />
                  <p className="text-xs text-slate-500">Ej: -2.5 para adelantar la voz, 1.5 para retrasarla.</p>
                </div>
              </div>
            </div>

            {/* Status Overlay */}
            {(card.status === "uploading" || card.status === "success" || card.status === "error") && (
              <div className={`absolute inset-0 z-10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center ${
                card.status === "success" ? "bg-emerald-950/80" : card.status === "error" ? "bg-red-950/80" : "bg-slate-950/80"
              }`}>
                {card.status === "uploading" && (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-indigo-200 font-bold">Subiendo...</p>
                  </div>
                )}
                {card.status === "success" && (
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-emerald-200 font-bold text-xl mb-2">¡Guardado!</p>
                    <p className="text-emerald-300/70 text-sm">La canción ya tiene notas.</p>
                  </div>
                )}
                {card.status === "error" && (
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-200 font-bold text-xl mb-2">Error</p>
                    <Button variant="outline" onClick={() => updateCard(card.id, { status: "pending" })} className="mt-4">
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}
