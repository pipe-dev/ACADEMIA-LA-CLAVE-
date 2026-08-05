'use client';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LessonNode } from '../types';
import { audioService } from '../utils/audioService';
import { X, CheckCircle2, Wind, Sparkles, Trophy, AlertTriangle } from 'lucide-react';

interface LessonModalProps {
  node: LessonNode;
  onClose: () => void;
  onCompleteNode: (nodeId: string, xpReward: number) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  node,
  onClose,
  onCompleteNode
}) => {
  const [step, setStep] = useState<'intro' | 'practice' | 'success'>('intro');
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Sostén' | 'Exhala'>('Inhala');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  useEffect(() => {
    audioService.playOpenSound();
  }, []);

  const handleAttemptClose = () => {
    if (step === 'success') {
      audioService.playCloseSound();
      onClose();
    } else {
      audioService.playClickSound();
      setShowExitConfirm(true);
    }
  };

  // Trigger confetti celebration & sound effects when reaching success step
  useEffect(() => {
    if (step === 'success') {
      audioService.playLessonCompleteSound();
      audioService.vibrate([30, 40, 30]);
      setTimeout(() => audioService.playXpGainSound(), 350);

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });

      const timeoutId = setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.6 }
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.6 }
        });
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [step]);

  // Breathing exercise loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'practice' && node.type === 'control') {
      interval = setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            if (breathPhase === 'Inhala') {
              setBreathPhase('Sostén');
              return 4;
            } else if (breathPhase === 'Sostén') {
              setBreathPhase('Exhala');
              return 6;
            } else {
              setStep('success');
              audioService.playFrequency(523.25, 0.6); // High C celebration
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, breathPhase, node.type]);

  const handleFinishQuiz = () => {
    if (selectedAnswer === 1) {
      audioService.playFrequency(440, 0.4);
      setStep('success');
    } else {
      audioService.playFrequency(180, 0.2);
      alert('Respuesta incorrecta. ¡Inténtalo de nuevo!');
    }
  };

  const handleClaimLesson = () => {
    audioService.playClickSound();
    onCompleteNode(node.id, node.xpReward);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer" onClick={handleAttemptClose}>
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative border border-slate-100 dark:border-[#1b2b3f] transition-colors cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleAttemptClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff] flex items-center justify-center">
            {node.type === 'control' ? <Wind className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-[#4648d4] dark:text-[#c0c1ff] uppercase tracking-wider">
              Lección Práctica
            </span>
            <h3 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
              {node.title}
            </h3>
          </div>
        </div>

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-[#c6c5d7] leading-relaxed bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {node.instructions || 'Sigue las instrucciones para dominar el control diafragmático y mejorar tu tono vocal.'}
            </p>

            <button
              onClick={() => {
                audioService.playClickSound();
                setStep('practice');
              }}
              className="w-full py-3.5 rounded-full tactile-btn-primary font-heading font-bold text-sm cursor-pointer shadow-md"
            >
              Comenzar Ejercicio
            </button>
          </div>
        )}

        {/* Step: Practice (Breathing or Quiz) */}
        {step === 'practice' && (
          <div className="space-y-5 text-center">
            {node.type === 'control' ? (
              <div className="py-6 space-y-4">
                {/* Breathing Circle Visualizer */}
                <div className={`w-32 h-32 mx-auto rounded-full bg-[#eff4ff] dark:bg-[#0b1828] border-4 border-[#4648d4] flex flex-col items-center justify-center transition-transform duration-1000 ${
                  breathPhase === 'Inhala' ? 'scale-125' : breathPhase === 'Sostén' ? 'scale-110' : 'scale-90'
                }`}>
                  <span className="font-heading font-extrabold text-2xl text-[#2c2abc] dark:text-[#c0c1ff]">
                    {breathPhase}
                  </span>
                  <span className="font-bold text-lg text-slate-600 dark:text-slate-300">
                    {breathTimer}s
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Mantén los hombros relajados y la presión de aire estable.
                </p>
              </div>
            ) : (
              /* Short Concept Quiz */
              <div className="space-y-3 text-left">
                <p className="text-xs font-bold text-slate-700 dark:text-[#d3e4fe]">
                  ¿Cuál es el músculo principal responsable de la respiración al cantar?
                </p>
                {[
                  { id: 0, text: 'A) Músculos intercostales superiores' },
                  { id: 1, text: 'B) El diafragma' },
                  { id: 2, text: 'C) Las cuerdas vocales' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedAnswer(opt.id)}
                    className={`w-full p-3 rounded-2xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      selectedAnswer === opt.id
                        ? 'border-[#4648d4] bg-indigo-50/80 dark:bg-slate-800 text-[#2c2abc] dark:text-[#c0c1ff]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-[#c6c5d7]'
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}

                <button
                  onClick={handleFinishQuiz}
                  disabled={selectedAnswer === null}
                  className={`w-full py-3.5 rounded-full font-heading font-bold text-sm mt-2 transition-all ${
                    selectedAnswer !== null ? 'tactile-btn-primary cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Verificar Respuesta
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-bold text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
                ¡Lección Completada!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Has demostrado excelente control de aire.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-4 py-2 rounded-full font-bold text-sm">
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>+{node.xpReward} XP Recompensados</span>
            </div>

            <button
              onClick={handleClaimLesson}
              className="w-full py-3.5 rounded-full tactile-btn-success font-heading font-bold text-sm cursor-pointer shadow-md"
            >
              Continuar
            </button>
          </div>
        )}
      </div>

      {/* Exit Confirmation Dialog Overlay */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl border border-red-100 dark:border-red-950 text-center animate-scaleIn cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-bold text-lg text-[#0b1c30] dark:text-[#d3e4fe]">
                ¿Salir de la lección?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Si abandonas ahora, perderás el progreso de esta lección o ejercicio en curso.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  audioService.playClickSound();
                  setShowExitConfirm(false);
                }}
                className="w-full py-3 rounded-full tactile-btn-primary font-heading font-bold text-xs cursor-pointer"
              >
                Continuar practicando
              </button>

              <button
                onClick={() => {
                  audioService.playCloseSound();
                  onClose();
                }}
                className="w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 font-heading font-bold text-xs transition-colors cursor-pointer"
              >
                Abandonar lección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonModal;
