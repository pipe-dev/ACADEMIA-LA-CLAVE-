import React from 'react';
import { motion } from 'motion/react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Mic,
  RotateCcw,
  Target,
  Zap,
  Music2,
  Swords
} from 'lucide-react';
import { audioService } from '../../utils/audioService';
import { TunerSubView } from './afinadorTypes';

interface TunerToolsAccordionProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectTool: (tool: TunerSubView) => void;
  zenMode?: boolean;
}

export const TunerToolsAccordion: React.FC<TunerToolsAccordionProps> = ({
  isOpen,
  onToggleOpen,
  onSelectTool,
  zenMode = false
}) => {
  const handleOpenTool = (tool: TunerSubView) => {
    audioService.playOpenSound();
    onSelectTool(tool);
  };

  return (
    <div id="tour-tuner-apparatus" className="space-y-4 pt-1">
      <button
        onClick={() => {
          audioService.playClickSound();
          onToggleOpen();
        }}
        className={`w-full py-4 px-5 rounded-3xl border shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer min-h-[56px] ${
          zenMode
            ? 'bg-[#1f2125] border-[#2e3138]'
            : 'bg-white dark:bg-[#102034] border-slate-200/80 dark:border-[#1b2b3f]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl shadow-inner ${
              zenMode
                ? 'bg-[#26292f] text-[#e5b83b] border border-[#383c44]'
                : 'bg-indigo-50 dark:bg-indigo-950/70 text-[#4648d4] dark:text-[#c0c1ff]'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3
                className={`font-heading font-bold text-sm ${
                  zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                }`}
              >
                Aparatos y Programas de Práctica
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/30'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                6 Herramientas
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Test vocal, escalas, respiración, duelos y diagnóstico
            </p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Collapsible Tools Grid */}
      <div className={`space-y-5 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tool 1: Tesitura Vocal */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool('tesitura')}
            className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-md'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-purple-200'
                }`}
              >
                TEST VOCAL
              </span>
              <h4 className="text-base font-heading font-black">Rango vocal en vivo</h4>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-purple-100/90'
                }`}
              >
                Encuentra tu nota más baja y más aguda
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
          </motion.button>

          {/* Tool 2: Ejercicios de Respiración */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool('respiracion')}
            className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white shadow-md'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-indigo-200'
                }`}
              >
                Control Diafragmático
              </span>
              <h4 className="text-base font-heading font-black">Ejercicios de Respiración</h4>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-emerald-100/90'
                }`}
              >
                Visualizador diafragmático 4-4-4
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
            </div>
          </motion.button>

          {/* Tool 3: Desafío de Estabilidad 10s */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool('estabilidad')}
            className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white shadow-md'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-cyan-200'
                }`}
              >
                Desafío de Retención
              </span>
              <h4 className="text-base font-heading font-black">Desafío de Estabilidad (10s)</h4>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-fuchsia-100/90'
                }`}
              >
                Retén la nota fija y multiplica tu XP
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}
            >
              <Target className="w-5 h-5" />
            </div>
          </motion.button>

          {/* Tool 4: Evaluación Inteligente */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool('evaluacion')}
            className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 text-white shadow-md'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-emerald-200'
                }`}
              >
                Diagnóstico IA
              </span>
              <h4 className="text-base font-heading font-black">Evaluación de Precisión</h4>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-indigo-100/90'
                }`}
              >
                Puntuación y reseña técnica de tu tono
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
          </motion.button>

          {/* Tool 5: Escalas Rápidas */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool('escalas')}
            className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-fuchsia-200'
                }`}
              >
                Solfeo y Audición
              </span>
              <h4 className="text-base font-heading font-black">Escalas Rápidas Vocales</h4>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-cyan-100/90'
                }`}
              >
                Referencia auditiva para solfeo
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}
            >
              <Music2 className="w-5 h-5" />
            </div>
          </motion.button>

          {/* Tool 6: Duelo Rapido Vocal */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool('duelo')}
            className={`p-4 rounded-3xl text-left flex items-center justify-between cursor-pointer transition-all ${
              zenMode
                ? 'bg-[#22252a] border border-[#2e3138] text-[#f0ebe1] shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-md'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-amber-200'
                }`}
              >
                Competencia Vocal y Ritmo
              </span>
              <h4 className="text-base font-heading font-black">Duelo Rapido</h4>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  zenMode ? 'text-[#9ea3ae]' : 'text-amber-100/90'
                }`}
              >
                Desafia a un amigo en vivo, sombra o pasa el celular
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ml-3 ${
                zenMode ? 'bg-[#2e3138] text-[#e5b83b]' : 'bg-white/20 backdrop-blur-md text-white'
              }`}
            >
              <Swords className="w-5 h-5" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
