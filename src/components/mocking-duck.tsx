
"use client";

import { cn } from "@/lib/utils";

export function MockingDuck({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-48 h-48", className)}>
      <style jsx>{`
        .troll-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .troll {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 80%;
          animation: laughing-troll-animation 2s ease-in-out forwards;
        }

        .grass {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 35%;
          z-index: 10;
        }

        @keyframes laughing-troll-animation {
          0% {
            transform: translate(-50%, 100%);
          }
          10%,
          90% {
            transform: translate(-50%, 5%);
          }
          15%, 25%, 35%, 45%, 55%, 65%, 75%, 85% {
            transform: translate(-50%, 0%);
          }
          20%, 30%, 40%, 50%, 60%, 70%, 80% {
            transform: translate(-50%, 5%);
          }
          100% {
            transform: translate(-50%, 100%);
          }
        }
      `}</style>
      <div className="troll-container">
        <div className="troll">
           <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <g stroke="black" strokeWidth="4">
              {/* Face Outline */}
              <path d="M165,65 C185,80 185,120 160,150 C130,190 60,195 40,155 C20,115 20,70 50,40 C80,10 140,25 165,65 Z" strokeWidth="6" fill="#F0F0F0" />

              {/* Teeth Fill (Mouth Shadow first) */}
              <path d="M50,102 C60,140 130,140 145,102 L142,128 L132,133 L118,135 L105,136 L92,136 L80,135 L68,133 L55,128 Z" fill="#333333" stroke="none"/>
              {/* Teeth Fill (White teeth on top) */}
              <path d="M50,102 C60,140 130,140 145,102 L147,102 L135,102 L120,102 L105,102 L90,102 L75,102 L60,102 L48,103 Z" fill="white" stroke="none" />
              
              {/* Smile Outline */}
              <path d="M45,100 C60,145 130,145 150,100" strokeWidth="8" fill="none"/>
              
              {/* Teeth Lines */}
              <path d="M48,103 L55,128" />
              <path d="M60,102 L68,133" />
              <path d="M75,102 L80,135" />
              <path d="M90,102 L92,136" />
              <path d="M105,102 L105,136" />
              <path d="M120,102 L118,135" />
              <path d="M135,102 L132,133" />
              <path d="M147,102 L142,128" />

              {/* Left Eye */}
              <g fill="none">
                <path d="M50,50 C65,40 85,45 90,60" />
                <path d="M90,60 C80,75 60,75 50,60" />
                <path d="M50,60 C60,55 75,55 80,60" />
              </g>

              {/* Right Eye */}
              <g fill="none">
                <path d="M110,60 C120,45 145,45 155,65" />
                <path d="M155,65 C145,80 120,80 110,70" />
                <path d="M110,70 C120,68 135,68 145,70" />
              </g>
              
              {/* Nose */}
              <g fill="none">
                <path d="M100,80 C110,90 105,105 95,100" />
                <path d="M100,80 C90,90 95,105 105,100" />
                <path d="M98,101 L108,101" />
              </g>

              {/* Cheek Lines */}
              <g fill="none">
                <path d="M40,110 C30,115 25,125 40,130" />
                <path d="M155,105 C168,110 170,120 158,128" />
                <path d="M155,90 C165,92 168,98 160,102" />
              </g>
              
              {/* Chin Lines */}
              <g fill="none">
                <path d="M70,155 C85,165 110,165 125,155" />
                <path d="M80,148 L115,148" />
              </g>

              {/* Forehead Wrinkles */}
              <g fill="none">
                <path d="M60,35 C80,30 100,32 110,40" />
                <path d="M70,45 C85,42 100,45 105,50" />
              </g>
            </g>
          </svg>
        </div>
        <div className="grass">
          <svg
            viewBox="0 0 100 35"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
          >
            <path
              d="M0 35 V20 L5 25 V15 L10 20 V10 L15 22 V12 L20 25 V5 L25 20 L30 15 L35 25 L40 10 L45 28 L50 15 L55 30 L60 20 L65 25 L70 15 L75 30 L80 20 L85 28 L90 18 L95 25 L100 20 V35 H0Z"
              fill="#6A994E"
            />
             <path
              d="M0 35 V25 L3 28 V20 L8 25 V18 L12 24 V15 L18 28 V20 L22 26 V18 L28 29 L33 20 L38 30 L43 18 L48 32 L53 20 L58 33 L63 25 L68 29 L73 20 L78 33 L83 24 L88 30 L93 22 L98 28 V35 H0Z"
              fill="#A7C957"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
