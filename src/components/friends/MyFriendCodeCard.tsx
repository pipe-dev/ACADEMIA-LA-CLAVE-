'use client';
import React from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface MyFriendCodeCardProps {
  myCode: string;
  zenMode?: boolean;
  onCopy: () => void;
  onShare: () => void;
  copied: boolean;
}

export const MyFriendCodeCard: React.FC<MyFriendCodeCardProps> = ({
  myCode,
  zenMode = false,
  onCopy,
  onShare,
  copied
}) => {
  return (
    <div className={`rounded-3xl p-5 shadow-md space-y-3 relative overflow-hidden transition-all ${
      zenMode
        ? 'bg-[#22252a] text-[#f0ebe1] border border-[#2e3138]'
        : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
    }`}>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
            zenMode ? 'text-[#e5b83b]' : 'text-purple-200'
          }`}>
            Tu Código de Cantante
          </span>
          <span className="font-heading font-extrabold text-2xl tracking-wider text-white">
            {myCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className={`p-2.5 rounded-2xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              zenMode
                ? 'bg-[#2e3138] text-[#e5b83b] hover:bg-[#383c44] border border-[#383c44]'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Copiar código"
          >
            {copied ? (
              <>
                <Check className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-300'}`} />
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
            onClick={onShare}
            className={`p-2.5 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs ${
              zenMode
                ? 'bg-[#2e3138] text-[#e5b83b] hover:bg-[#383c44] border border-[#383c44]'
                : 'bg-white text-indigo-900 hover:bg-slate-100'
            }`}
            title="Compartir código"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className={`text-[11px] font-medium leading-relaxed relative z-10 ${
        zenMode ? 'text-[#9ea3ae]' : 'text-purple-100/90'
      }`}>
        Comparte este código con tus compañeros de canto para que te agreguen y puedan ver sus posiciones en el ranking semanal.
      </p>
    </div>
  );
};
