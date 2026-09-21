// src/components/unit3-rhythm/RhythmSphere3D.tsx
'use client';

import React from 'react';

interface RhythmSphere3DProps {
  type?: 'purple' | 'golden';
  className?: string;
}

export const RhythmSphere3D: React.FC<RhythmSphere3DProps> = ({
  type = 'purple',
  className = '',
}) => {
  const isGolden = type === 'golden';

  return (
    <div
      style={{
        transformOrigin: '50% 100%',
        willChange: 'transform',
        background: isGolden
          ? 'radial-gradient(circle at 45% 40%, #fffbeb 0%, #fef08a 20%, #eab308 45%, #ca8a04 70%, #713f12 90%, #451a03 100%)'
          : 'radial-gradient(circle at 45% 40%, #e0e7ff 0%, #a5b4fc 20%, #6366f1 45%, #4338ca 70%, #1e1b4b 90%, #0c0a2a 100%)',
        boxShadow: isGolden
          ? 'inset -8px -10px 22px rgba(69, 26, 3, 0.95), inset 5px 6px 14px rgba(255, 255, 255, 0.65), inset 0 -3px 8px rgba(254, 240, 138, 0.45), 0 16px 30px -4px rgba(245, 158, 11, 0.55)'
          : 'inset -8px -10px 22px rgba(10, 8, 38, 0.95), inset 5px 6px 14px rgba(255, 255, 255, 0.45), inset 0 -3px 8px rgba(165, 180, 252, 0.35), 0 16px 30px -4px rgba(15, 23, 42, 0.45)',
      }}
      className={`w-20 h-20 rounded-full relative z-20 cursor-default overflow-hidden border border-white/20 transform-gpu ${className}`}
    >
      {/* 3D Specular Highlight Bulb (Glass sheen) */}
      <div className="absolute top-2.5 left-4 w-6 h-3.5 rounded-full bg-gradient-to-b from-white/80 via-white/35 to-transparent blur-[0.6px] pointer-events-none transform -rotate-12" />
      <div className="absolute top-3 left-5.5 w-2 h-1.5 rounded-full bg-white/95 blur-[0.3px] pointer-events-none" />

      {/* Central 3D Volume Light Bloom */}
      <div className="absolute inset-2.5 rounded-full bg-gradient-to-tr from-transparent via-indigo-100/20 to-white/25 blur-[1.5px] pointer-events-none" />

      {/* Floor Ambient Bounce Light on bottom edge */}
      <div className="absolute bottom-1 left-3.5 right-3.5 h-2 rounded-full bg-indigo-200/25 blur-[1px] pointer-events-none" />
    </div>
  );
};
