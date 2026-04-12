'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Mic, CheckCircle2, AlertTriangle, ArrowRight, Music, RefreshCw, Smartphone, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePitchDetection } from '@/hooks/use-pitch-detection';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PitchGauge } from './pitch-gauge';
import { useHaptic } from '@/hooks/use-haptic';
import { saveVocalRecord } from '@/lib/db';
import { ShareDialog } from './share-dialog';

type Phase = 'setup' | 'testingDown' | 'limitDownConfirm' | 'testingUp' | 'limitUpConfirm' | 'results' | 'coloratura';
type ResultType = 'tesitura' | 'extension' | 'passaggio' | 'fail';

const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

export function VocalRangeAssessor({ onClose }: { onClose: () => void }) {
  const { note, centsOff, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  const { toast } = useToast();
  const { tapSuccess, tapError, tapTriumph } = useHaptic();
  
  const [phase, setPhase] = useState<Phase>('setup');
  const [gender, setGender] = useState<'masculino' | 'femenino' | null>(null);
  
  const fullNotePool = useMemo(() => {
    const pool = [];
    for(let m = 24; m <= 96; m++) {
      pool.push({ 
        midi: m, 
        name: noteStrings[m%12], 
        octave: Math.floor(m/12)-1, 
        fullName: `${noteStrings[m%12]}${Math.floor(m/12)-1}`, 
        freq: 440 * Math.pow(2, (m-69)/12) 
      });
    }
    return pool;
  }, []);

  const [currentMidi, setCurrentMidi] = useState<number>(60);
  const [startMidi, setStartMidi] = useState<number>(60);
  const [results, setResults] = useState<Record<number, ResultType>>({});
  const [failures, setFailures] = useState(0);
  const [coloraturaResult, setColoraturaResult] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const inTuneSinceRef = useRef<number | null>(null);
  const wobblingSinceRef = useRef<number | null>(null);
  const noteSearchStartRef = useRef<number | null>(null);
  const varianceArrRef = useRef<number[]>([]);
  const savedRecordIdRef = useRef<number | null>(null);

  // Auto-save to IndexedDB when results phase is entered
  useEffect(() => {
    if (phase !== 'results') return;
    const vNotes = Object.keys(results).map(Number).filter(k => results[k] !== 'fail').sort((a,b) => a-b);
    if (vNotes.length === 0) return;
    const low = fullNotePool.find(n => n.midi === vNotes[0]);
    const high = fullNotePool.find(n => n.midi === vNotes[vNotes.length - 1]);
    const pass = vNotes.filter(k => results[k] === 'passaggio');
    saveVocalRecord({
      date: Date.now(),
      lowestMidi: low?.midi || 0,
      lowestName: low?.fullName || '',
      highestMidi: high?.midi || 0,
      highestName: high?.fullName || '',
      passaggi: pass,
      coloratura: null,
    }).then(id => { savedRecordIdRef.current = id; }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  
  const currentTarget = fullNotePool.find(n => n.midi === currentMidi);

  const playTone = useCallback((frequency: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime + 2.0);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3.0);
      osc.start();
      osc.stop(audioCtx.currentTime + 3.0);
    } catch (e) {
      console.warn("Failed to play tone", e);
    }
  }, []);

  const handleStartTest = () => {
    const stMidi = gender === 'femenino' ? 60 : 48; // C4 or C3
    setStartMidi(stMidi);
    setCurrentMidi(stMidi);
    setResults({});
    setFailures(0);
    setPhase('testingDown');
    inTuneSinceRef.current = null;
    wobblingSinceRef.current = null;
    varianceArrRef.current = [];
    noteSearchStartRef.current = Date.now();
    start();
  };
  
  // Auto play reference tone when note changes
  useEffect(() => {
    if ((phase === 'testingDown' || phase === 'testingUp') && currentTarget) {
      playTone(currentTarget.freq);
      noteSearchStartRef.current = Date.now();
      inTuneSinceRef.current = null;
      wobblingSinceRef.current = null;
    }
  }, [currentMidi, phase, currentTarget, playTone]);

  // The Evaluation Engine
  useEffect(() => {
    if (!isDetecting || (phase !== 'testingDown' && phase !== 'testingUp') || !currentTarget) return;

    let animationFrameId: number;

    const evaluate = () => {
      const isActiveTarget = note.name === currentTarget.name && note.octave === currentTarget.octave;
      const absCents = Math.abs(smoothedCentsOff);
      const now = Date.now();

      if (isActiveTarget && absCents < 40) {
        // Reset Search Timeout because they hit the note zone
        noteSearchStartRef.current = now;
        
        varianceArrRef.current.push(smoothedCentsOff);
        if (varianceArrRef.current.length > 30) varianceArrRef.current.shift();

        if (absCents <= 15) {
          if (inTuneSinceRef.current === null) inTuneSinceRef.current = now;
          if (now - inTuneSinceRef.current > 1500) {
            saveResult('tesitura');
            return;
          }
        } else {
          inTuneSinceRef.current = null;
          if (wobblingSinceRef.current === null) wobblingSinceRef.current = now;
          
          if (now - wobblingSinceRef.current > 2000) {
            const maxV = Math.max(...varianceArrRef.current);
            const minV = Math.min(...varianceArrRef.current);
            if ((maxV - minV) > 25) {
              saveResult('passaggio');
            } else {
              saveResult('extension');
            }
            return;
          }
        }
      } else {
        inTuneSinceRef.current = null;
        wobblingSinceRef.current = null;
        
        // Timeout Failure Logic
        if (noteSearchStartRef.current && now - noteSearchStartRef.current > 6000) {
          handleFailure();
          return;
        }
      }
      animationFrameId = requestAnimationFrame(evaluate);
    };

    animationFrameId = requestAnimationFrame(evaluate);
    return () => cancelAnimationFrame(animationFrameId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.name, note.octave, smoothedCentsOff, isDetecting, phase, currentTarget]);

  const saveResult = (type: ResultType) => {
    tapSuccess();
    setResults(prev => ({ ...prev, [currentMidi]: type }));
    setFailures(0); // reset failures on success
    
    if (phase === 'testingDown') {
      setCurrentMidi(prev => prev - 1);
    } else {
      setCurrentMidi(prev => prev + 1);
    }
  };

  const handleFailure = () => {
    tapError();
    const newFailures = failures + 1;
    setFailures(newFailures);
    setResults(prev => ({ ...prev, [currentMidi]: 'fail' }));
    
    if (newFailures >= 3) {
      if (phase === 'testingDown') setPhase('limitDownConfirm');
      else setPhase('limitUpConfirm');
    } else {
      // Advance to try the next note anyway or retry?
      // "Fallar 3 seguidas", so we just advance to the next note and register failure.
      if (phase === 'testingDown') setCurrentMidi(prev => prev - 1);
      else setCurrentMidi(prev => prev + 1);
    }
  };

  // Rendering
  if (phase === 'setup') {
    return (
      <div className="w-full h-full flex flex-col p-4 bg-background items-center justify-center overflow-hidden relative">
         <Button onClick={onClose} variant="ghost" className="absolute top-4 left-4 z-10">
           <ArrowLeft className="mr-2 h-4 w-4" /> Volver
         </Button>
         
         <h1 className="text-2xl sm:text-3xl font-black mb-2 text-center text-primary">Diagnóstico Vocal Clínico</h1>
         <p className="text-muted-foreground text-center mb-8 max-w-sm text-sm sm:text-base">
           Esta herramienta mapeará tu voz semitono a semitono y elaborará un reporte profesional. Recomendado para docentes.
         </p>
         
         <Card className="bg-card border border-primary/20 w-full max-w-xs shadow-2xl">
            <CardHeader>
                <CardTitle className="text-center">Selecciona tu tono biológico inicial</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button 
                  onClick={() => setGender('femenino')} 
                  variant={gender === 'femenino' ? 'default' : 'secondary'} 
                  size="lg" className="h-16"
                >
                  Voz Femenina (Comenzar en Do4)
                </Button>
                <Button 
                  onClick={() => setGender('masculino')} 
                  variant={gender === 'masculino' ? 'default' : 'secondary'} 
                  size="lg" className="h-16"
                >
                  Voz Masculina (Comenzar en Do3)
                </Button>
            </CardContent>
         </Card>

         {gender && (
            <Button 
                onClick={handleStartTest} 
                size="lg" 
                className="mt-8 w-full max-w-xs font-bold text-lg h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl animate-in slide-in-from-bottom-5"
            >
                Comenzar <ArrowRight className="ml-2 w-6 h-6"/>
            </Button>
         )}
      </div>
    );
  }

  const validNotes = Object.keys(results).map(Number).filter(k => results[k] !== 'fail').sort((a,b) => a-b);
  const lowest = validNotes[0] ? fullNotePool.find(n => n.midi === validNotes[0]) : null;
  const highest = validNotes[validNotes.length - 1] ? fullNotePool.find(n => n.midi === validNotes[validNotes.length - 1]) : null;
  
  const passaggi = validNotes.filter(k => results[k] === 'passaggio').map(k => fullNotePool.find(n => n.midi === k)?.fullName).join(', ');

  const getVocalClassification = () => {
     if (!highest) return coloraturaResult || 'Voz Estándar';
     
     let base = '';
     if (gender === 'masculino') {
        if (highest.midi >= 69) base = 'Tenor';
        else if (highest.midi >= 64) base = 'Barítono';
        else base = 'Bajo';
     } else {
        if (highest.midi >= 81) base = 'Soprano';
        else if (highest.midi >= 76) base = 'Mezzo';
        else base = 'Contralto';
     }

     if (!coloraturaResult) return base;
     
     let adj = coloraturaResult;
     if (gender === 'femenino') {
        if (adj === 'Ligero') adj = 'Ligera';
        else if (adj === 'Lírico') adj = 'Lírica';
        else if (adj === 'Dramático') adj = 'Dramática';
     }

     return `${base}\n${adj}`; // Newline to fit nicely in the massive text of the share card
  };

  const renderPiano = () => {
    const startK = (lowest?.midi || 48) - 4;
    const endK = (highest?.midi || 72) + 4;
    const keys = [];
    for(let i = startK; i <= endK; i++) {
      const isBlack = [1,3,6,8,10].includes(i%12);
      const res = (results[i] as string) || 'none';
      let bgColor = isBlack ? 'bg-zinc-800' : 'bg-white';
      if (res === 'tesitura') bgColor = 'bg-emerald-400 border-emerald-500';
      if (res === 'extension' || res === 'passaggio') bgColor = 'bg-yellow-400 border-yellow-500';
      if (res === 'fail') bgColor = isBlack ? 'bg-red-700 border-red-900' : 'bg-red-500 border-red-600';
      
      keys.push(
        <div key={i} className={cn("border border-zinc-300 rounded-b-md relative flex-shrink-0 shadow-sm", isBlack ? "w-6 h-16 sm:h-20 -mx-3 z-10" : "w-10 h-24 sm:h-32 z-0", bgColor)}>
           {res === 'passaggio' && <AlertTriangle className={cn("w-3 h-3 absolute left-1/2 -translate-x-1/2 text-orange-700", isBlack ? "bottom-1" : "bottom-2")} />}
           {(!isBlack && res !== 'none') && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-zinc-800/50">{noteStrings[i%12]}</span>}
        </div>
      );
    }
    return (
      <div className="w-full overflow-x-auto py-4 px-2 no-scrollbar">
        <div className="flex w-max mx-auto px-4">{keys}</div>
      </div>
    );
  };

  const handleColoraturaSelect = (value: string) => {
    setColoraturaResult(value);
    if (savedRecordIdRef.current != null) {
      const vNotes = Object.keys(results).map(Number).filter(k => results[k] !== 'fail').sort((a,b) => a-b);
      const low = fullNotePool.find(n => n.midi === vNotes[0]);
      const high = fullNotePool.find(n => n.midi === vNotes[vNotes.length - 1]);
      const pass = vNotes.filter(k => results[k] === 'passaggio');
      saveVocalRecord({
        id: savedRecordIdRef.current,
        date: Date.now(),
        lowestMidi: low?.midi || 0,
        lowestName: low?.fullName || '',
        highestMidi: high?.midi || 0,
        highestName: high?.fullName || '',
        passaggi: pass,
        coloratura: value,
      }).catch(console.error);
    }
  };

  const handleWhatsApp = () => {
     const text = `🎤 *Reporte Vocal de AfinApp*\nExtensión Detectada: ${lowest?.fullName} a ${highest?.fullName}\n⚠️ Passaggi inestables detectados en: ${passaggi || 'Ninguno'}.\n\nRequiero un Docente Vocal para reevaluar mi instrumento y Coloratura. ¿Me puedes dar información de tus clases?`;
     window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (phase === 'coloratura') {
    return (
      <div className="w-full h-full flex flex-col p-4 bg-background items-center justify-center relative">
         <Button onClick={() => setPhase('results')} variant="ghost" className="absolute top-4 left-4 z-10">
           <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Reporte
         </Button>

         <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center text-primary">Test de Coloratura</h2>
         {!coloraturaResult ? (
           <div className="w-full max-w-sm flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
             <p className="text-muted-foreground mb-4 text-center text-sm sm:text-base">
                Para definir tu subcategoría vocal (Coloratura) requerimos saber cómo se sintió la elasticidad del pliegue vocal en tu Límite Agudo ({highest?.fullName}).
             </p>
             <Card className="border-primary/30 shadow-xl bg-card/60">
               <CardHeader><CardTitle className="text-lg text-center leading-tight">¿Cómo sentiste el timbre y agilidad en los agudos?</CardTitle></CardHeader>
               <CardContent className="flex flex-col gap-3">
                 <Button onClick={() => { tapSuccess(); handleColoraturaSelect('Ligero'); }} variant="outline" className="h-auto p-4 flex flex-col items-start text-left">
                   <strong className="text-emerald-500 text-base">Muy ágil y brillante</strong>
                   <span className="text-xs text-muted-foreground">Fácil de mover, ligero como pluma</span>
                 </Button>
                 <Button onClick={() => { tapSuccess(); handleColoraturaSelect('Lírico'); }} variant="outline" className="h-auto p-4 flex flex-col items-start text-left">
                   <strong className="text-blue-500 text-base">Cálida y melodiosa</strong>
                   <span className="text-xs text-muted-foreground">Equilibrada, fuerte pero cuesta vibrarla rápido</span>
                 </Button>
                 <Button onClick={() => { tapSuccess(); handleColoraturaSelect('Dramático'); }} variant="outline" className="h-auto p-4 flex flex-col items-start text-left">
                   <strong className="text-purple-500 text-base">Oscura y muy potente</strong>
                   <span className="text-xs text-muted-foreground">Pesada, con mucho volumen, difícil de aligerar</span>
                 </Button>
               </CardContent>
             </Card>
           </div>
         ) : (
           <div className="text-center animate-in zoom-in duration-500 flex flex-col items-center">
             <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <Music className="w-10 h-10 text-primary" />
             </div>
             <p className="text-muted-foreground uppercase text-sm font-bold tracking-widest">Tu Clasificación Completa</p>
             <h3 className="text-4xl sm:text-5xl font-black text-foreground mt-2 mb-2 leading-none text-balance">
                Voz {coloraturaResult}
             </h3>
             <p className="text-primary font-bold text-lg mb-12">Rango: {lowest?.name} a {highest?.name}</p>
             
             <div className="flex gap-4 w-full justify-center max-w-xs mb-4">
                <Button onClick={() => setShowShareDialog(true)} variant="outline" className="flex-1 h-14 border-primary text-primary bg-primary/10 hover:bg-primary/20">
                   <Share2 className="w-5 h-5 mr-2" /> Compartir
                </Button>
             </div>

             <Button onClick={() => setPhase('results')} size="lg" className="w-full max-w-xs rounded-2xl h-14 text-lg font-bold shadow-lg">
                Volver al Reporte
             </Button>
             
             <ShareDialog 
                isOpen={showShareDialog} 
                onClose={() => setShowShareDialog(false)} 
                cardData={{ 
                  type: 'vocal_range', 
                  vocalRange: getVocalClassification()
                }} 
             />
           </div>
         )}
      </div>
    )
  }

  const displayCents = currentTarget && note.frequency
    ? smoothedCentsOff + 1200 * Math.log2(note.frequency / currentTarget.freq)
    : smoothedCentsOff;

  // Testing View
  if (phase === 'testingDown' || phase === 'testingUp') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-background p-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground mb-8">
            {phase === 'testingDown' ? 'Escaneando Graves' : 'Escaneando Agudos'}
        </h2>
        
        <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
           <div className="text-7xl sm:text-8xl font-black text-primary drop-shadow-md whitespace-nowrap">
             {currentTarget?.name}<span className="text-5xl sm:text-6xl opacity-70">{currentTarget?.octave}</span>
           </div>
           
           <PitchGauge centsOff={displayCents} isActive={isDetecting} size={220} />
           
           <div className="flex gap-3 mt-4">
             {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn("w-4 h-4 rounded-full transition-colors", i < failures ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-110" : "bg-card border-2 border-muted")} />
             ))}
           </div>
        </div>

        <p className="mt-12 text-center max-w-xs text-muted-foreground text-sm sm:text-base">
           Canta la nota. Ajusta tu voz con la aguja. Mide: Tesitura o Extensión.
        </p>

        <div className="flex flex-col items-center gap-4 mt-8 w-full max-w-xs">
          <Button onClick={() => playTone(currentTarget?.freq || 440)} variant="secondary" className="rounded-full h-16 w-16 p-0 shadow-lg">
             <RefreshCw className="w-6 h-6 text-foreground"/>
          </Button>

          <Button 
            onClick={() => {
              // Manually trigger the limit confirmation screen
              if (phase === 'testingDown') setPhase('limitDownConfirm');
              else setPhase('limitUpConfirm');
            }} 
            variant="outline" 
            className="w-full mt-2 h-14 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold rounded-2xl"
          >
             ✋ Llegué a mi límite
          </Button>
        </div>
      </div>
    );
  }
  
  if (phase === 'limitDownConfirm' || phase === 'limitUpConfirm') {
    return (
       <div className="w-full h-full flex flex-col items-center justify-center bg-background p-4 text-center">
         <AlertTriangle className="w-20 h-20 text-yellow-500 mb-6" />
         <h2 className="text-2xl font-black mb-4">¿Límite Alcanzado?</h2>
         <p className="text-muted-foreground mb-8 max-w-sm">
           Has fallado 3 notas consecutivas. Como profesor, ¿consideras que este es el límite físico de la voz o fue solo una desconcentración?
         </p>
         <div className="flex flex-col gap-4 w-full max-w-xs">
           <Button onClick={() => {
              setFailures(0);
              setPhase(phase === 'limitDownConfirm' ? 'testingDown' : 'testingUp');
           }} variant="secondary" size="lg" className="h-16 text-lg">
              Reintentar Nota
           </Button>
           <Button onClick={() => {
              tapTriumph();
              if (phase === 'limitDownConfirm') {
                 setFailures(0);
                 setCurrentMidi(startMidi + 1); // Switch to Up
                 setPhase('testingUp');
              } else {
                 stop();
                 setPhase('results');
              }
           }} size="lg" className="h-16 text-lg bg-primary hover:bg-primary/90">
              Confirmar como Límite Definitivo
           </Button>
         </div>
       </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col p-4 bg-background items-center overflow-y-auto relative pb-20">
      <Button onClick={onClose} variant="ghost" className="self-start mb-6">
         <ArrowLeft className="mr-2 h-4 w-4" /> Salir del Examen
      </Button>

      <h1 className="text-3xl font-black text-primary mb-2 text-center w-full">Reporte Clínico</h1>
      
      <Card className="w-full max-w-sm bg-card/60 mt-4 shadow-lg border-primary/30">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
             <div className="text-center">
               <p className="text-muted-foreground text-sm uppercase font-bold">Límite Grave</p>
               <p className="text-4xl font-black">{lowest?.fullName || '--'}</p>
             </div>
             <p className="text-4xl font-light text-muted-foreground/30">-</p>
             <div className="text-center">
               <p className="text-muted-foreground text-sm uppercase font-bold">Límite Agudo</p>
               <p className="text-4xl font-black">{highest?.fullName || '--'}</p>
             </div>
          </div>
          
          <div className="w-full p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <p className="text-sm font-bold text-yellow-500 mb-1 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Inestabilidad Detectada (Passaggi)</p>
            <p className="text-sm text-muted-foreground">
              {passaggi ? `Fluctuación crítica de frecuencia en: ${passaggi}.` : 'No se detectaron quiebres abruptos.'}
            </p>
            <p className="text-xs mt-2 italic text-muted-foreground opacity-80">⚠️ Pide a tu profesor que confirme o reevalúe estos puentes naturales de tu voz.</p>
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-sm mt-4 bg-card/40 rounded-xl border border-primary/20 overflow-hidden shadow-inner">
         <p className="text-center text-xs font-bold text-muted-foreground mt-3 uppercase tracking-wider">Mapa de Frecuencias</p>
         {renderPiano()}
      </div>

      <Card className="w-full max-w-sm mt-6 border-indigo-500/30 bg-indigo-500/5">
        <CardContent className="p-6 flex flex-col gap-4 text-center">
           <h3 className="font-bold text-lg">¿Aún no tienes profesor?</h3>
           <p className="text-sm text-muted-foreground leading-snug">Un pedagogo vocal debe corroborar los resultados técnicos y evaluar tu respiración.</p>
           <Button onClick={handleWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1faa51] text-white">
             <Smartphone className="w-5 h-5 mr-2" /> Agendar Clase por WhatsApp
           </Button>
        </CardContent>
      </Card>

      <Button onClick={() => setPhase('coloratura')} variant="secondary" className="w-full max-w-sm mt-6 h-16 border-2 border-primary/20">
         Descubrir mi Coloratura <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
}
