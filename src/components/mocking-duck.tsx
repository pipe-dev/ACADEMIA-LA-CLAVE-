
"use client";

import { cn } from "@/lib/utils";

export function MockingDuck({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-48 h-48", className)}>
      <style jsx>{`
        .dog-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .dog {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 70%;
          animation: laughing-dog-animation 2s ease-in-out forwards;
        }

        .grass {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 35%;
          z-index: 10;
        }

        @keyframes laughing-dog-animation {
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
      <div className="dog-container">
        <div className="dog">
          <svg
            viewBox="0 0 80 80"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            shapeRendering="crispEdges"
          >
            {/* Body */}
            <path d="M20 50 H60 V75 H20 Z" fill="#8C5432" />
            <path d="M28 50 H36 V58 H28 Z" fill="#5A341E" />

            {/* Head */}
            <path d="M25 25 H55 V55 H25 Z" fill="#8C5432" />
            {/* Snout */}
            <path
              d="M30 40 H50 V52 H30 Z M32 38 H48 V40 H32 Z M35 52 H45 V55 H35 Z"
              fill="white"
            />
            <path
              d="M30 40 H32 V52 H30 Z M48 40 H50 V52 H48 Z M32 40 H35 V42 H32Z M45 40 H48 V42 H45 Z M32 50 H35 V52 H32 Z M45 50 H48 V52 H45 Z"
              fill="#E0E0E0"
            />
            {/* Nose */}
            <path d="M38 43 H42 V46 H38 Z" fill="black" />

            {/* Eyes */}
            <path
              d="M32 32 H38 V38 H32 Z M42 32 H48 V38 H42 Z"
              fill="white"
            />
            <path d="M34 34 H36 V36 H34 Z M44 34 H46 V36 H44 Z" fill="black" />
             <path d="M31 29 H39 V32 H31 Z M41 29 H49 V32 H41 Z" fill="#8C5432"/>


            {/* Ears */}
            <path d="M15 22 H25 V40 H15 Z" fill="black" />
            <path d="M55 22 H65 V40 H55 Z" fill="black" />
             <path d="M53 20 H57 V22 H53 Z" fill="black" />
             <path d="M23 20 H27 V22 H23 Z" fill="black" />
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
