// src/components/unit2-celebration/CrystalWineGlassSvg.tsx
'use client';

import React, { useMemo } from 'react';

interface CrystalWineGlassSvgProps {
  progress: number;
  surfaceAngle: number;
  isJiggling?: boolean;
}

// Calculates the smooth, curved specular highlight path matching the original glass contour
// u = -1: exact left highlight; u = 0: center vertical line; u = +1: exact right highlight
const getGlarePath = (u: number) => {
  const x0 = 100 + 36 * u;
  const x1 = 100 + 40 * u;
  const x2 = 100 + 43 * u;
  const x3 = 100 + 24 * u;
  const x4 = 100 + 5 * u;
  return `M ${x0.toFixed(1)},40 C ${x1.toFixed(1)},80 ${x2.toFixed(1)},125 ${x3.toFixed(1)},155 C ${((x3 + x4) / 2).toFixed(1)},168 ${x4.toFixed(1)},175 ${x4.toFixed(1)},182`;
};

export const CrystalWineGlassSvg: React.FC<CrystalWineGlassSvgProps> = ({
  progress,
  surfaceAngle,
  isJiggling = false,
}) => {
  const {
    frontWeight,
    backWeight,
    mouthFrontOpacity,
    mouthBackOpacity,
    mouthFrontWidth,
    mouthBackWidth,
    footFrontOpacity,
    footBackOpacity,
    footFrontWidth,
    footBackWidth,
    whitePath,
    grayPath,
    stemX,
  } = useMemo(() => {
    const rad = (surfaceAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const fw = (1 + cosA) / 2;
    const bw = 1 - fw;

    const mfOp = 0.22 + 0.63 * fw;
    const mbOp = 0.22 + 0.63 * bw;
    const mfW = 1.2 + 0.5 * fw;
    const mbW = 1.2 + 0.5 * bw;

    const ffOp = 0.22 + 0.63 * fw;
    const fbOp = 0.22 + 0.63 * bw;
    const ffW = 1.2 + 0.6 * fw;
    const fbW = 1.2 + 0.6 * bw;

    const uW = -cosA;
    const uG = cosA;

    return {
      frontWeight: fw,
      backWeight: bw,
      mouthFrontOpacity: mfOp,
      mouthBackOpacity: mbOp,
      mouthFrontWidth: mfW,
      mouthBackWidth: mbW,
      footFrontOpacity: ffOp,
      footBackOpacity: fbOp,
      footFrontWidth: ffW,
      footBackWidth: fbW,
      whitePath: getGlarePath(uW),
      grayPath: getGlarePath(uG),
      stemX: 100 + 2.0 * uG,
    };
  }, [surfaceAngle]);

  return (
    <svg
      viewBox="0 0 200 300"
      className={`w-48 h-72 sm:w-56 sm:h-80 drop-shadow-[0_20px_45px_rgba(2,132,199,0.30)] transition-transform duration-75 select-none ${
        isJiggling ? 'animate-wiggle' : ''
      }`}
      style={{
        transform: `scale(${1 + (progress / 100) * 0.05}) rotate(${(Math.sin(progress * 0.8) * (progress / 100) * 4).toFixed(2)}deg)`,
        filter:
          progress > 50
            ? `drop-shadow(0 0 ${(progress * 0.3).toFixed(1)}px rgba(56, 189, 248, 0.75))`
            : undefined,
      }}
    >
      <defs>
        <clipPath id="bowlInteriorClip">
          <path d="M 58,32 C 54,80 50,135 74,168 C 86,183 95,188 97,192 L 103,192 C 105,188 114,183 126,168 C 150,135 146,80 142,32 A 42 8.5 0 0 1 58 32 Z" />
        </clipPath>

        <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="12%" stopColor="#bae6fd" stopOpacity="0.22" />
          <stop offset="28%" stopColor="#38bdf8" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="72%" stopColor="#38bdf8" stopOpacity="0.08" />
          <stop offset="88%" stopColor="#bae6fd" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.40" />
        </linearGradient>

        <linearGradient id="primaryLeftGlare" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#e0f2fe" stopOpacity="0.65" />
          <stop offset="90%" stopColor="#38bdf8" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id="softAmbientGlare" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.50" />
          <stop offset="35%" stopColor="#7dd3fc" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#bae6fd" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id="rightEdgeGlare" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#bae6fd" stopOpacity="0.55" />
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id="stemShader" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="20%" stopColor="#bae6fd" stopOpacity="0.30" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.50" />
        </linearGradient>

        <linearGradient id="baseBevelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="18%" stopColor="#e0f2fe" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.12" />
          <stop offset="82%" stopColor="#e0f2fe" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.65" />
        </linearGradient>

        <radialGradient id="solidCrystalCore" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#0284c7" stopOpacity="0.16" />
          <stop offset="75%" stopColor="#0b172a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
        </radialGradient>

        <filter id="crackGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g>
        {/* OPTICAL BACKGROUND REFRACTION */}
        <g clipPath="url(#bowlInteriorClip)">
          <rect x="40" y="20" width="120" height="180" fill="#0b1828" opacity="0.94" />
          <rect x="40" y="20" width="120" height="180" fill="url(#glassBodyGrad)" opacity="0.40" />

          {/* Refracted Background Grid */}
          <g className="animate-refraction-angle-shift" filter="url(#silkyRefraction)">
            <g stroke="#1b2b3f" strokeWidth="1" opacity="0.80">
              <path d="M 52,60 C 48,95 54,135 72,165" fill="none" />
              <path d="M 76,32 C 66,75 64,125 84,175" fill="none" />
              <path d="M 100,32 L 100,185" fill="none" strokeWidth="1.1" />
              <path d="M 124,32 C 134,75 136,125 116,175" fill="none" />
              <path d="M 148,60 C 152,95 146,135 128,165" fill="none" />
            </g>
            <g stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.8" opacity="0.55">
              <path d="M 76,32 C 66,75 64,125 84,175" fill="none" />
              <path d="M 124,32 C 134,75 136,125 116,175" fill="none" />
            </g>

            <g stroke="#1b2b3f" strokeWidth="1" opacity="0.80">
              <path d="M 57,56 Q 100,66 143,56" fill="none" />
              <path d="M 53,80 Q 100,94 147,80" fill="none" />
              <path d="M 53,104 Q 100,122 147,104" fill="none" strokeWidth="1.1" />
              <path d="M 56,128 Q 100,148 144,128" fill="none" />
              <path d="M 65,152 Q 100,170 135,152" fill="none" />
            </g>
            <g stroke="rgba(56, 189, 248, 0.20)" strokeWidth="0.8" opacity="0.55">
              <path d="M 53,80 Q 100,94 147,80" fill="none" />
              <path d="M 53,104 Q 100,122 147,104" fill="none" />
              <path d="M 56,128 Q 100,148 144,128" fill="none" />
            </g>
          </g>
        </g>

        {/* Solid Crystal Meniscus */}
        <path
          d="M 74,152 C 85,168 93,178 97,192 L 103,192 C 107,178 115,168 126,152 C 114,160 105,163 100,163 C 95,163 86,160 74,152 Z"
          fill="url(#solidCrystalCore)"
          stroke="none"
          filter="url(#subtleBlur)"
        />

        {/* Internal Resonance Liquid / Sound Aura */}
        <g clipPath="url(#bowlInteriorClip)">
          <path
            d="M 62,95 C 60,135 75,165 97,184 L 103,184 C 125,165 140,135 138,95 C 125,100 110,102 100,102 C 90,102 75,100 62,95 Z"
            fill="url(#glassBodyGrad)"
            className="transition-all duration-150"
            filter="url(#subtleBlur)"
            style={{
              opacity: Math.min(0.8, 0.1 + (progress / 100) * 0.7),
              transform: `scale(${1 + (progress / 100) * 0.04})`,
              transformOrigin: '100px 184px',
            }}
          />
        </g>

        {/* Main Crystal Bowl Outer Volume */}
        <path
          d="M 58,32 C 54,80 50,135 74,168 C 86,183 95,188 97,192 L 103,192 C 105,188 114,183 126,168 C 150,135 146,80 142,32 A 42 8.5 0 0 1 58 32 Z"
          fill="url(#glassBodyGrad)"
        />

        {/* Soft Refractive Edge Glow */}
        <path
          d="M 58,32 C 54,80 50,135 74,168 C 86,183 95,188 97,192 L 103,192 C 105,188 114,183 126,168 C 150,135 146,80 142,32"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.2"
          filter="url(#subtleBlur)"
        />

        {/* Top Rim (La Boca) */}
        <ellipse
          cx="100"
          cy="32"
          rx="42"
          ry="8.5"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        <path
          d="M 58,32 A 42 8.5 0 0 1 142 32"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity={backWeight}
        />
        <path
          d="M 58,32 A 42 8.5 0 0 1 142 32"
          fill="none"
          stroke={`rgba(255,255,255,${mouthBackOpacity.toFixed(2)})`}
          strokeWidth={mouthBackWidth.toFixed(2)}
          strokeLinecap="round"
          filter={backWeight < 0.3 ? 'url(#subtleBlur)' : undefined}
        />

        <path
          d="M 58,32 A 42 8.5 0 0 0 142 32"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity={frontWeight}
        />
        <path
          d="M 58,32 A 42 8.5 0 0 0 142 32"
          fill="none"
          stroke={`rgba(255,255,255,${mouthFrontOpacity.toFixed(2)})`}
          strokeWidth={mouthFrontWidth.toFixed(2)}
          strokeLinecap="round"
          filter={frontWeight < 0.3 ? 'url(#subtleBlur)' : undefined}
        />

        {/* Dynamic Specular Caustic Glare */}
        <g clipPath="url(#bowlInteriorClip)">
          <path
            d={whitePath}
            fill="none"
            stroke="url(#softAmbientGlare)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity={0.4}
            filter="url(#diffuseGlow)"
          />
          <path
            d={whitePath}
            fill="none"
            stroke="url(#primaryLeftGlare)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity={0.8}
            filter="url(#subtleBlur)"
          />
          <path
            d={whitePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={0.75}
          />
        </g>

        {/* Opposite Side Soft Rim Ambient Refraction */}
        <g clipPath="url(#bowlInteriorClip)">
          <path
            d={grayPath}
            fill="none"
            stroke="url(#rightEdgeGlare)"
            strokeWidth="2.2"
            strokeLinecap="round"
            filter="url(#subtleBlur)"
            opacity={0.85}
          />
        </g>

        {/* Fluted Crystal Stem */}
        <path
          d="M 94,188 C 96,192 97,196 97,202 L 97,252 C 97,258 92,264 84,270 L 116,270 C 108,264 103,258 103,252 L 103,202 C 103,196 104,192 106,188 Z"
          fill="url(#stemShader)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.8"
        />
        <line
          x1={stemX.toFixed(1)}
          y1="192"
          x2={stemX.toFixed(1)}
          y2="260"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#subtleBlur)"
        />

        {/* Beveled Crystal Foot Base */}
        <ellipse
          cx="100"
          cy="274"
          rx="48"
          ry="10.5"
          fill="url(#baseBevelGrad)"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="1.0"
        />
        <ellipse
          cx="100"
          cy="271"
          rx="38"
          ry="7.5"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
          filter="url(#subtleBlur)"
        />

        <path
          d="M 57,274 A 47 10.3 0 0 1 143 274"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity={backWeight}
        />
        <path
          d="M 57,274 A 47 10.3 0 0 1 143 274"
          fill="none"
          stroke={`rgba(255,255,255,${footBackOpacity.toFixed(2)})`}
          strokeWidth={footBackWidth.toFixed(2)}
          strokeLinecap="round"
        />

        <path
          d="M 56,275 A 48 10.5 0 0 0 144 275"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity={frontWeight}
        />
        <path
          d="M 57,275 A 47 10.3 0 0 0 143 275"
          fill="none"
          stroke={`rgba(255,255,255,${footFrontOpacity.toFixed(2)})`}
          strokeWidth={footFrontWidth.toFixed(2)}
          strokeLinecap="round"
        />

        {/* PROGRESSIVE FRACTURE CRACKS */}
        <g clipPath="url(#bowlInteriorClip)">
          {progress >= 30 && (
            <g filter="url(#crackGlow)" className="animate-fadeIn">
              <path
                d="M 100,105 L 95,118 L 103,132 L 97,146 M 95,118 L 84,124 L 76,134"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 100,105 L 95,118 L 103,132 L 97,146 M 95,118 L 84,124 L 76,134"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {progress >= 60 && (
            <g filter="url(#crackGlow)" className="animate-fadeIn">
              <path
                d="M 103,132 L 115,138 L 124,130 L 132,142 M 115,138 L 112,154 L 104,166"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 103,132 L 115,138 L 124,130 L 132,142 M 115,138 L 112,154 L 104,166"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 95,82 L 100,105 L 108,90 L 116,74"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {progress >= 85 && (
            <g filter="url(#crackGlow)">
              <path
                d="M 76,134 L 70,146 L 76,158 M 100,42 L 96,62 L 86,76 M 134,44 L 128,66 L 122,78 L 128,98"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 76,134 L 70,146 L 76,158 M 100,42 L 96,62 L 86,76 M 134,44 L 128,66 L 122,78 L 128,98"
                fill="none"
                stroke="#e0f2fe"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="103" cy="132" r="3.5" fill="#ffffff" className="animate-ping" />
              <circle cx="95" cy="118" r="3" fill="#38bdf8" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};
