// src/components/unit2-celebration/AcousticResonanceBar.tsx
'use client';

import React from 'react';

interface AcousticResonanceBarProps {
  progress: number;
}

export const AcousticResonanceBar: React.FC<AcousticResonanceBarProps> = ({
  progress,
}) => {
  return (
    <div className="w-full max-w-sm flex flex-col items-center mb-6 px-2">
      <svg
        viewBox="0 0 320 24"
        className="w-full h-5 sm:h-6 overflow-visible filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        <defs>
          <linearGradient id="barFluidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="35%" stopColor="#06b6d4" />
            <stop offset="85%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient id="barSheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          <filter id="barGlow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="beadGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="tubeInteriorClip">
            <rect x="2" y="2" width="316" height="20" rx="10" ry="10" />
          </clipPath>
        </defs>

        {/* Outer Tube Chamber Background */}
        <rect
          x="1"
          y="1"
          width="318"
          height="22"
          rx="11"
          ry="11"
          fill="#071322"
          stroke="#22d3ee"
          strokeWidth="1.2"
          strokeOpacity="0.45"
        />

        {/* Fluid Liquid Column */}
        {progress > 0 && (
          <g clipPath="url(#tubeInteriorClip)">
            <rect
              x="2"
              y="2"
              width={Math.max(0, (progress / 100) * 316)}
              height="20"
              fill="url(#barFluidGrad)"
              filter="url(#barGlow)"
            />
            {/* Top glass reflection / specular sheen */}
            <rect
              x="2"
              y="2"
              width={Math.max(0, (progress / 100) * 316)}
              height="10"
              fill="url(#barSheenGrad)"
            />
            {/* Leading edge energetic bead */}
            {progress < 100 && (
              <circle
                cx={Math.max(10, (progress / 100) * 316)}
                cy="12"
                r="6"
                fill="#ffffff"
                filter="url(#beadGlow)"
              />
            )}
          </g>
        )}

        {/* Outer Glass Highlight / Glaze */}
        <rect
          x="4"
          y="3"
          width="312"
          height="8"
          rx="4"
          ry="4"
          fill="url(#barSheenGrad)"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
