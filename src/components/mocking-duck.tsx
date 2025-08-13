
"use client";

import { cn } from "@/lib/utils";
import Image from 'next/image';

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
          width: 100%;
          height: 100%;
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
            {/* 
              Instructions for the user:
              1. Add your trollface.png image to the `public` folder.
              2. If your image is not a PNG or has a different name,
                 update the `src` attribute below. For example, if you have
                 `public/my-image.jpg`, change the src to `"/my-image.jpg"`.
            */}
           <Image 
            src="/trollface.png" 
            alt="Trollface" 
            width={150} 
            height={150}
            className="w-full h-full object-contain"
          />
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
