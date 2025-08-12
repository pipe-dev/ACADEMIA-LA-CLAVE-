
"use client";

import { cn } from "@/lib/utils";

export function MockingDuck({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-32 h-32", className)}>
      <style jsx>{`
        .duck-container {
          animation: head-shake 0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955) 0.2s both;
          transform-origin: bottom center;
        }

        .tongue {
          animation: tongue-flick 0.8s ease-in-out 0.4s both;
          transform-origin: 50% 0%;
        }

        .eye-left, .eye-right {
          animation: eye-squint 0.8s ease-in-out both;
        }

        @keyframes head-shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) rotate(-8deg); }
          20%, 40%, 60%, 80% { transform: translateX(5px) rotate(8deg); }
        }
        
        @keyframes tongue-flick {
          0%, 20%, 80%, 100% { transform: scaleY(0); }
          30%, 70% { transform: scaleY(1.2); }
        }

        @keyframes eye-squint {
           0%, 100% { transform: scaleY(1); }
           50% { transform: scaleY(0.2); }
        }
      `}</style>
      <div className="duck-container absolute inset-0">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Sombra */}
          <ellipse cx="50" cy="95" rx="35" ry="6" fill="rgba(0,0,0,0.15)" />

          {/* Cuerpo */}
          <path
            d="M20,65 C5,95 40,115 50,90 C60,115 95,95 80,65"
            fill="#FFD700"
            stroke="#EAA200"
            strokeWidth="3.5"
          />

          {/* Cabeza */}
          <circle cx="50" cy="45" r="30" fill="#FFD700" stroke="#EAA200" strokeWidth="3.5" />

          {/* Ojos - Troll Face */}
           <g className="eye-left" style={{ transformOrigin: "35px 42px" }}>
            <path d="M25 42 C 30 35, 40 35, 45 42" stroke="black" strokeWidth="3" fill="none" />
            <circle cx="35" cy="42" r="3" fill="black" />
          </g>
           <g className="eye-right" style={{ transformOrigin: "65px 42px" }}>
            <path d="M55 42 C 60 35, 70 35, 75 42" stroke="black" strokeWidth="3" fill="none" />
            <circle cx="65" cy="42" r="3" fill="black" />
          </g>

          {/* Pico y Lengua - Troll Smirk */}
          <g transform="translate(0, 8)">
             <path
              d="M30,55 Q50,70 70,55 C 65,65 55,68 50,65 C 45,68 35,65 30,55 Z"
              fill="#FFA500"
              stroke="#D98C00"
              strokeWidth="3"
            />
            {/* Lengua */}
            <path
              d="M48 63 Q50 72 52 63 Z"
              fill="#FF4136"
              stroke="black"
              strokeWidth="1"
              className="tongue"
            />
          </g>
          
          {/* Pelo */}
          <path
            d="M45,15 Q50,5 55,15 M48,13 Q50,8 52,13"
            fill="none"
            stroke="#EAA200"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
