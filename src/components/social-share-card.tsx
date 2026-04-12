import { Flame, Trophy, Mic2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShareCardType = 'level_complete' | 'vocal_range' | 'streak';

export interface SocialShareCardProps {
  type: ShareCardType;
  score?: number;
  streak?: number;
  vocalRange?: string;
  levelName?: string;
  className?: string;
  innerRef?: React.Ref<HTMLDivElement>;
}

export function SocialShareCard({ type, score, streak, vocalRange, levelName, className, innerRef }: SocialShareCardProps) {
  return (
    <div 
      ref={innerRef}
      className={cn(
        "relative w-[1080px] h-[1350px] overflow-hidden bg-[#0f172a] flex flex-col items-center justify-between p-16 text-white text-center font-sans tracking-tight",
        className
      )}
      style={{
         // Deep modern gradient directly applied for html2canvas to capture reliably
         background: "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #3b0764 100%)",
      }}
    >
       {/* Background decorative elements */}
       <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/30 blur-[140px] rounded-full pointer-events-none" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-500/20 blur-[180px] rounded-full pointer-events-none" />

       {/* Header */}
       <div className="flex flex-col items-center gap-[24px] mt-[48px] z-10">
         <div className="w-[112px] h-[112px] bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
            <Mic2 className="w-[56px] h-[56px] text-white" />
         </div>
         <h1 className="text-[48px] font-black tracking-tighter uppercase text-white/90">AfinApp</h1>
       </div>

       {/* Main Content */}
       <div className="flex flex-col items-center justify-center flex-grow w-full z-10 px-[32px]">
          {type === 'level_complete' && (
             <div className="flex flex-col items-center gap-[40px]">
                <Trophy className="w-[224px] h-[224px] text-yellow-400 drop-shadow-[0_0_60px_rgba(250,204,21,0.5)]" />
                <p className="text-[48px] font-medium text-white/80 tracking-wide uppercase">Nivel Completado</p>
                <p className="text-[72px] font-black text-white text-center">{levelName || 'Desafío Vocal'}</p>
                <div className="mt-[48px] relative flex flex-col items-center">
                   <div className="text-[200px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl">
                     {score?.toFixed(0)}%
                   </div>
                   <p className="text-[36px] text-yellow-400 font-bold tracking-[0.2em] uppercase mt-[24px]">Precisión Perfecta</p>
                </div>
             </div>
          )}

          {type === 'streak' && (
             <div className="flex flex-col items-center gap-[40px]">
                <Flame className="w-[256px] h-[256px] text-orange-500 drop-shadow-[0_0_80px_rgba(249,115,22,0.7)]" />
                <p className="text-[48px] font-medium text-white/80 tracking-wide uppercase">Racha Imparable</p>
                <div className="mt-[40px] relative flex flex-col items-center">
                   <div className="text-[250px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-red-600 drop-shadow-2xl">
                     {streak}
                   </div>
                   <p className="text-[48px] text-orange-300 font-bold tracking-[0.2em] uppercase mt-[40px]">{streak === 1 ? 'Día' : 'Días'} Seguidos</p>
                </div>
             </div>
          )}

          {type === 'vocal_range' && (
             <div className="flex flex-col items-center gap-[40px]">
                <Star className="w-[224px] h-[224px] text-purple-400 drop-shadow-[0_0_70px_rgba(192,132,252,0.5)]" />
                <p className="text-[48px] font-medium text-white/80 tracking-wide uppercase">Mi Voz es...</p>
                <div className="mt-[16px] relative flex flex-col items-center">
                   <div className="text-[110px] font-black leading-[1.1] text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 drop-shadow-2xl px-4">
                     {vocalRange}
                   </div>
                   <p className="text-[36px] text-purple-300 font-bold tracking-[0.2em] uppercase mt-[48px]">Clasificación Clínica</p>
                </div>
             </div>
          )}
       </div>

       {/* Footer */}
       <div className="mb-[64px] z-10 flex flex-col items-center">
          <p className="text-[36px] font-bold text-white">Domina Tu Voz</p>
          <p className="text-[28px] text-white/50 mt-[16px] tracking-wide">Únete a la disciplina vocal</p>
       </div>
    </div>
  );
}
