'use client';
import React from 'react';
import { X, Smartphone, ExternalLink, Download, Sparkles } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface InstallPwaModalProps {
  onClose: () => void;
  onTriggerNativeInstall?: () => void;
  hasNativePrompt: boolean;
  isIOS: boolean;
  isInIframe: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  onClose,
  onTriggerNativeInstall,
  hasNativePrompt,
  isIOS,
  isInIframe
}) => {
  const handleOpenNewTab = () => {
    audioService.playClickSound();
    window.open(window.location.href, '_blank');
  };

  const handleClose = () => {
    audioService.playCloseSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer" onClick={handleClose}>
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] cursor-default" onClick={(e) => e.stopPropagation()}>
        
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/70 text-rose-500 dark:text-rose-400 shadow-xs cursor-pointer active:scale-90 transition-transform"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-14">
          <div className="w-12 h-12 bg-[#4648d4] text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-[#4648d4] dark:text-[#c0c1ff] uppercase tracking-wider block">
              Instalación Rápida
            </span>
            <h3 className="font-heading font-black text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
              Instalar La Clave
            </h3>
          </div>
        </div>

        {/* Widget Feature Highlight */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-3 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Incluye Widget PWA para Pantalla de Inicio</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
            Muestra tu racha actual y frases motivacionales diarias sobre canto de acceso rápido desde la pantalla de inicio.
          </p>
        </div>

        {/* Case 1: Native browser prompt is ready */}
        {hasNativePrompt && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Haz clic en el botón de abajo para instalar la app en la pantalla de inicio de tu dispositivo.
            </p>
            <button
              onClick={() => {
                if (onTriggerNativeInstall) onTriggerNativeInstall();
                onClose();
              }}
              className="w-full py-3 bg-[#4648d4] text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Ahora</span>
            </button>
          </div>
        )}

        {/* Case 2: Running inside iframe */}
        {!hasNativePrompt && isInIframe && (
          <div className="space-y-3">
            <div className="bg-[#eff4ff] dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-bold block mb-1">Paso para instalar:</span>
              Las vistas previas bloquean la instalación de 1 clic. Abre el enlace en una pestaña nueva para instalarla inmediatamente.
            </div>
            <button
              onClick={handleOpenNewTab}
              className="w-full py-3 bg-[#4648d4] text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en Pestaña Nueva para Instalar</span>
            </button>
          </div>
        )}

        {/* Case 3: iOS Safari */}
        {!hasNativePrompt && !isInIframe && isIOS && (
          <div className="space-y-3">
            <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-3">
              <div className="font-bold text-slate-900 dark:text-[#d3e4fe] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Instalación en iPhone / iPad (2 toques):</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Apple requiere hacer la instalación desde el menú oficial de Safari:
              </p>
              <div className="space-y-2 bg-white dark:bg-[#102034] p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#4648d4] text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <span>Toca el botón <strong>Compartir</strong> (cuadrado con flecha <span className="inline-block px-1 bg-slate-100 dark:bg-slate-800 rounded font-bold">⎋</span>) en la barra de Safari.</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-[#4648d4] text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <span>Selecciona <strong>"Agregar al inicio"</strong>.</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#4648d4] text-white font-black text-xs rounded-2xl cursor-pointer transition-colors"
            >
              ¡Entendido!
            </button>
          </div>
        )}

        {/* Case 4: Other browsers */}
        {!hasNativePrompt && !isInIframe && !isIOS && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Abre el menú de tu navegador (Chrome / Edge / Samsung Internet) y selecciona **"Instalar aplicación"** o **"Agregar a pantalla principal"**.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#4648d4] text-white font-black text-xs rounded-2xl cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
