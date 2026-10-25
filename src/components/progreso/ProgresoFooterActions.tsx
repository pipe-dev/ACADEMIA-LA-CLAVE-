import React from 'react';
import { ShoppingBag, Settings } from 'lucide-react';
import { audioService } from '../../utils/audioService';

interface ProgresoFooterActionsProps {
  onOpenStore: () => void;
  onOpenSettings: () => void;
  zenMode?: boolean;
}

export const ProgresoFooterActions: React.FC<ProgresoFooterActionsProps> = ({
  onOpenStore,
  onOpenSettings,
  zenMode = false,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      <button
        onClick={() => {
          audioService.playClickSound();
          onOpenStore();
        }}
        className={`py-3.5 px-4 rounded-full border font-heading font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-2xs ${
          zenMode
            ? 'bg-[#1b1c1e] border-[#2e3138] text-[#f0ebe1] '
            : 'bg-white dark:bg-[#102034] border-slate-200 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe]  '
        }`}
      >
        <ShoppingBag className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4] dark:text-[#c0c1ff]'}`} />
        <span>Tienda</span>
      </button>

      <button
        onClick={() => {
          audioService.playClickSound();
          onOpenSettings();
        }}
        className={`py-3.5 px-4 rounded-full border font-heading font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-2xs ${
          zenMode
            ? 'bg-[#1b1c1e] border-[#2e3138] text-[#f0ebe1] '
            : 'bg-white dark:bg-[#102034] border-slate-200 dark:border-[#1b2b3f] text-[#0b1c30] dark:text-[#d3e4fe]  '
        }`}
      >
        <Settings className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4] dark:text-[#c0c1ff]'}`} />
        <span>Configuración</span>
      </button>
    </div>
  );
};
