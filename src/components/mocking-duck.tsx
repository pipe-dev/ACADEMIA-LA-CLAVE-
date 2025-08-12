
"use client";

import { cn } from "@/lib/utils";

export function MockingDuck({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-32 h-32", className)}>
      <style jsx>{`
        .duck-container {
          animation: head-shake 0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
          transform-origin: bottom center;
        }

        .tongue {
          animation: tongue-flick 0.8s ease-in-out both;
          transform-origin: 50% 0%;
        }

        @keyframes head-shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(5deg); }
        }

        @keyframes tongue-flick {
          0%, 20%, 40%, 100% { transform: scaleY(0); }
          30% { transform: scaleY(1); }
        }
      `}</style>
      <div className="duck-container absolute inset-0">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Sombra */}
          <ellipse cx="50" cy="95" rx="30" ry="5" fill="rgba(0,0,0,0.15)" />

          {/* Cuerpo */}
          <path
            d="M25,60 C10,90 40,110 50,90 C60,110 90,90 75,60"
            fill="#FFD700"
            stroke="#EDAA00"
            strokeWidth="3"
          />

          {/* Cabeza */}
          <circle cx="50" cy="40" r="25" fill="#FFD700" stroke="#EDAA00" strokeWidth="3" />

          {/* Ojos */}
          <circle cx="38" cy="38" r="5" fill="white" />
          <circle cx="38" cy="38" r="2.5" fill="black" />
          <circle cx="62" cy="38" r="5" fill="white" />
          <circle cx="62" cy="38" r="2.5" fill="black" />

          {/* Pico y Lengua */}
          <g transform="translate(0, 5)">
            <path
              d="M35,50 Q50,65 65,50 Q60,55 50,58 Q40,55 35,50 Z"
              fill="#FFA500"
              stroke="#D98C00"
              strokeWidth="2.5"
            />
            {/* Lengua */}
            <path
              d="M48 56 Q50 63 52 56 Z"
              fill="#FF4136"
              className="tongue"
            />
          </g>
          
          {/* Pelo */}
          <path
            d="M45,15 Q50,5 55,15 M48,13 Q50,8 52,13"
            fill="none"
            stroke="#EAA200"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
