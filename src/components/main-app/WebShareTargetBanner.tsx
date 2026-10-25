import React from 'react';
import { Share2, X } from 'lucide-react';
import { SharedContent } from '../../utils/pwaFeatures';

interface WebShareTargetBannerProps {
  sharedData: SharedContent | null;
  onDismiss: () => void;
}

export const WebShareTargetBanner: React.FC<WebShareTargetBannerProps> = ({
  sharedData,
  onDismiss,
}) => {
  if (!sharedData) return null;

  return (
    <div className="mx-4 mt-2 max-w-lg sm:mx-auto bg-gradient-to-r from-indigo-900 to-[#102034] text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-start gap-3 animate-fadeIn">
      <div className="p-2 bg-indigo-600 rounded-xl shrink-0">
        <Share2 className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
          Recibido vía Web Share Target
        </div>
        <h4 className="text-xs font-bold truncate text-white mt-0.5">
          {sharedData.title || sharedData.text || 'Elemento compartido desde otra App'}
        </h4>
        {sharedData.url && (
          <p className="text-[11px] text-indigo-200 truncate mt-0.5">{sharedData.url}</p>
        )}
        <p className="text-[10px] text-slate-300 mt-1">
          ¡Importado a La Clave! Ya puedes usarlo en tus ejercicios.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-100 border border-rose-300/60 text-rose-500 active:scale-90 transition-transform shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
