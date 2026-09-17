'use client';

import React, { useState } from 'react';
import { Unit2CelebrationModal } from '../../../components/Unit2CelebrationModal';

export default function Unit2SandboxPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1828] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none z-0" />

      <div className="z-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">Sandbox: Cinemática Unidad 2</h1>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono mb-6">
          Motor Vectorial SVG v3.0 (Anti-Cache)
        </span>
        
        <p className="text-slate-600 dark:text-slate-400 max-w-md text-center mb-8 bg-white/80 dark:bg-[#0b1828]/80 p-4 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-800">
          Prueba la cinemática de la copa de cristal sin necesidad de completar la unidad. 
          Requiere permisos de micrófono.
        </p>

        <button 
          onClick={() => setIsOpen(true)}
          className="px-8 py-4 bg-[#4648d4] hover:bg-[#383aba] rounded-full text-white font-bold text-lg shadow-[0_4px_0_#1e1e78] hover:shadow-[0_2px_0_#1e1e78] hover:translate-y-[2px] transition-all"
        >
          Abrir Cinemática de Copa
        </button>
      </div>

      <Unit2CelebrationModal 
        isOpen={isOpen} 
        onContinue={() => {
          console.log("Continuar presionado");
          setIsOpen(false);
        }} 
      />
    </div>
  );
}
