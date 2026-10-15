'use client';

import React, { useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

export interface OrangeBlobProps {
  cursorPos?: { x: number; y: number }; // Coordenadas normalizadas entre -1 y 1
  isEmailFocused?: boolean;
  isPasswordFocused?: boolean;
  showPassword?: boolean;
  textLength?: number;
  className?: string;
}

export const OrangeBlob: React.FC<OrangeBlobProps> = ({
  cursorPos = { x: 0, y: 0 },
  isEmailFocused = false,
  isPasswordFocused = false,
  showPassword = false,
  textLength = 0,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSquished, setIsSquished] = useState(false);

  // Ciclo de parpadeo ocasional
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isPasswordFocused) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 140);
      }
    }, 4500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [isPasswordFocused]);

  // Resortes suaves para las coordenadas de la cara
  const springConfig = { stiffness: 180, damping: 20 };
  const faceX = useSpring(0, springConfig);
  const faceY = useSpring(0, springConfig);
  const bodyTilt = useSpring(0, springConfig);

  useEffect(() => {
    if (isPasswordFocused) {
      if (showPassword) {
        // Modo espia (asomandose con curiosidad)
        faceX.set(10);
        faceY.set(-2);
        bodyTilt.set(3);
      } else {
        // Modo timido (ocultandose hacia abajo)
        faceX.set(-4);
        faceY.set(10);
        bodyTilt.set(-2);
      }
    } else if (isEmailFocused) {
      // Mirando hacia el campo de texto y desplazandose con el texto
      const clampedLen = Math.min(textLength, 28);
      const textOffset = (clampedLen / 28) * 14;
      faceX.set(12 + textOffset);
      faceY.set(-6);
      bodyTilt.set(4);
    } else {
      // Siguiendo el cursor del usuario
      faceX.set(cursorPos.x * 14);
      faceY.set(cursorPos.y * 9);
      bodyTilt.set(cursorPos.x * 5);
    }
  }, [cursorPos, isEmailFocused, isPasswordFocused, showPassword, textLength, faceX, faceY, bodyTilt]);

  const handleTap = () => {
    setIsSquished(true);
    setTimeout(() => setIsSquished(false), 300);
  };

  // Determinacion de estados visuales
  const isHiding = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  // Variantes de animacion del cuerpo
  let bodyScaleY = 1;
  let bodyScaleX = 1;
  let bodyY = 0;

  if (isSquished) {
    bodyScaleY = 0.72;
    bodyScaleX = 1.22;
    bodyY = 14;
  } else if (isHiding) {
    bodyScaleY = 0.68;
    bodyScaleX = 1.18;
    bodyY = 16;
  } else if (isPeeking) {
    bodyScaleY = 0.88;
    bodyScaleX = 1.06;
    bodyY = 6;
  } else if (isEmailFocused) {
    bodyScaleY = 1.05;
    bodyScaleX = 0.98;
    bodyY = -2;
  }

  return (
    <motion.div
      onClick={handleTap}
      animate={{
        scaleY: bodyScaleY,
        scaleX: bodyScaleX,
        y: bodyY,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={`relative select-none cursor-pointer ${className}`}
      style={{ width: 190, height: 125 }}
    >
      <svg
        viewBox="0 0 200 130"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(249,115,22,0.3)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Degradado calido suave del domo */}
          <linearGradient id="orangeDomeGrad" x1="100" y1="10" x2="100" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9a52" />
            <stop offset="35%" stopColor="#ff7826" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Sombra de contacto inferior */}
          <linearGradient id="domeShadow" x1="100" y1="105" x2="100" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0.4" />
          </linearGradient>

          {/* Brillo sutil superior */}
          <radialGradient id="topHighlight" cx="100" cy="30" r="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sombra de suelo */}
        <ellipse cx="100" cy="124" rx="88" ry="6" fill="#000000" fillOpacity="0.14" />

        {/* Cuerpo principal del domo organico */}
        <path
          d="M 12 118 C 12 50, 48 14, 100 14 C 152 14, 188 50, 188 118 C 188 123, 182 125, 174 125 L 26 125 C 18 125, 12 123, 12 118 Z"
          fill="url(#orangeDomeGrad)"
        />

        {/* Capa de sombra inferior para profundidad volumetrica */}
        <path
          d="M 12 118 C 12 90, 30 110, 100 110 C 170 110, 188 90, 188 118 C 188 123, 182 125, 174 125 L 26 125 C 18 125, 12 123, 12 118 Z"
          fill="url(#domeShadow)"
        />

        {/* Iluminacion cenital */}
        <path
          d="M 24 100 C 24 55, 52 22, 100 22 C 148 22, 176 55, 176 100 C 140 40, 60 40, 24 100 Z"
          fill="url(#topHighlight)"
        />

        {/* Rasgos faciales con soporte de movimiento dinamico */}
        <motion.g style={{ x: faceX, y: faceY }}>
          {/* Sonrojo en mejillas (activo en modo contraseña) */}
          <motion.ellipse
            cx="64"
            cy="76"
            rx="7"
            ry="4.5"
            fill="#dc2626"
            animate={{ opacity: isHiding ? 0.45 : isPeeking ? 0.3 : 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.ellipse
            cx="136"
            cy="76"
            rx="7"
            ry="4.5"
            fill="#dc2626"
            animate={{ opacity: isHiding ? 0.45 : isPeeking ? 0.3 : 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Ojo Izquierdo */}
          {isHiding || isBlinking ? (
            // Ojo cerrado timido / parpadeo
            <path
              d="M 77 71 Q 83 67 89 71"
              stroke="#1e293b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            // Ojo abierto normal
            <circle cx="83" cy="70" r="3.2" fill="#0f172a" />
          )}

          {/* Ojo Derecho */}
          {isHiding || isBlinking ? (
            // Ojo cerrado timido / parpadeo
            <path
              d="M 111 71 Q 117 67 123 71"
              stroke="#1e293b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          ) : isPeeking ? (
            // En modo peek abre el ojo derecho con un brillo
            <g>
              <circle cx="117" cy="70" r="3.6" fill="#0f172a" />
              <circle cx="118.5" cy="68.8" r="1.1" fill="#ffffff" />
            </g>
          ) : (
            // Ojo abierto normal
            <circle cx="117" cy="70" r="3.2" fill="#0f172a" />
          )}

          {/* Boca / Nariz diminuta en el centro */}
          {isHiding ? (
            <ellipse cx="100" cy="77" rx="1.6" ry="1.2" fill="#0f172a" />
          ) : (
            <circle cx="100" cy="75" r="2.2" fill="#0f172a" />
          )}
        </motion.g>
      </svg>
    </motion.div>
  );
};
