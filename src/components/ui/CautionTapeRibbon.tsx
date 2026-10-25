import React from 'react';
import { Lock } from 'lucide-react';

interface CautionTapeRibbonProps {
  text?: string;
  angle?: string;
  className?: string;
  badgeClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CautionTapeRibbon: React.FC<CautionTapeRibbonProps> = ({
  text = 'Disponible Pronto',
  angle = '-rotate-[12deg]',
  className = '',
  badgeClassName = '',
  size = 'md'
}) => {
  const sizeStyles = {
    sm: {
      ribbon: 'py-1',
      badge: 'text-[10px] sm:text-[11px] px-3 py-0.5',
      icon: 'w-3 h-3',
      stripeWidth: '8px'
    },
    md: {
      ribbon: 'py-1.5 sm:py-2',
      badge: 'text-xs sm:text-sm px-4 sm:px-6 py-1',
      icon: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
      stripeWidth: '10px'
    },
    lg: {
      ribbon: 'py-2.5 sm:py-3',
      badge: 'text-sm sm:text-base px-6 sm:px-8 py-1.5',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
      stripeWidth: '12px'
    }
  }[size];

  return (
    <div
      className={`absolute w-[160%] flex items-center justify-center shadow-2xl z-30 pointer-events-none select-none ${angle} ${sizeStyles.ribbon} ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, #0a0a0a 0px, #0a0a0a ${sizeStyles.stripeWidth}, #facc15 ${sizeStyles.stripeWidth}, #facc15 calc(${sizeStyles.stripeWidth} * 2))`
      }}
    >
      <span
        className={`bg-black/95 text-yellow-300 font-black uppercase tracking-widest rounded-sm shadow-xl flex items-center gap-1.5 sm:gap-2 border border-yellow-400/50 ${sizeStyles.badge} ${badgeClassName}`}
      >
        <Lock className={sizeStyles.icon} />
        <span>{text}</span>
      </span>
    </div>
  );
};

export default CautionTapeRibbon;
