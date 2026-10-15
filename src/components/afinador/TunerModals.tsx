import React, { useRef } from 'react';
import { RotateCcw, Heart, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TunerRangeRequiredModal } from '../TunerRangeRequiredModal';
import { TunerLevelSelectModal } from '../TunerLevelSelectModal';
import { TunerWinModal } from '../TunerWinModal';
import { Difficulty, ProgressState } from '../../data/tunerLevelsData';
import { audioService } from '../../utils/audioService';

interface TunerModalsProps {
  isRangeRequiredModalOpen: boolean;
  onStartAssessment: () => void;
  onManualSelectRange: (data: {
    classification: string;
    noteMin: string;
    noteMax: string;
    minHz: number;
    maxHz: number;
    gender: 'masculino' | 'femenino';
  }) => void;

  isLevelSelectOpen: boolean;
  onCloseLevelSelect: () => void;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStartLevel: (diff: Difficulty, lvl: number) => void;
  levelProgress: ProgressState;
  userStreak: number;

  isWinModalOpen: boolean;
  currentLevel: number;
  winStars: number;
  winXp: number;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  onCloseWinModal: () => void;

  isLevelFailed: boolean;
  userLives: number;
  onRetryLevel: () => void;
  onExitLevelToLibre: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;

  showEasyWinVideo: boolean;
  onCloseEasyWinVideo: () => void;

  zenMode?: boolean;
}

export const TunerModals: React.FC<TunerModalsProps> = ({
  isRangeRequiredModalOpen,
  onStartAssessment,
  onManualSelectRange,
  isLevelSelectOpen,
  onCloseLevelSelect,
  selectedDifficulty,
  onSelectDifficulty,
  onStartLevel,
  levelProgress,
  userStreak,
  isWinModalOpen,
  currentLevel,
  winStars,
  winXp,
  onNextLevel,
  onReplayLevel,
  onCloseWinModal,
  isLevelFailed,
  userLives,
  onRetryLevel,
  onExitLevelToLibre,
  onOpenRecoveryExam,
  onOpenStore,
  showEasyWinVideo,
  onCloseEasyWinVideo,
  zenMode = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <>
      {/* ─── Mandatory Calibration Modal ─── */}
      <TunerRangeRequiredModal
        isOpen={isRangeRequiredModalOpen}
        onStartAssessment={onStartAssessment}
        onManualSelect={onManualSelectRange}
      />

      {/* ─── Level Selection Modal ─── */}
      <TunerLevelSelectModal
        isOpen={isLevelSelectOpen}
        onClose={onCloseLevelSelect}
        selectedDifficulty={selectedDifficulty}
        onSelectDifficulty={onSelectDifficulty}
        onStartLevel={onStartLevel}
        progress={levelProgress}
        userStreak={userStreak}
      />

      {/* ─── Level Win Celebration Modal ─── */}
      <TunerWinModal
        isOpen={isWinModalOpen}
        level={currentLevel}
        difficulty={selectedDifficulty}
        stars={winStars}
        xpEarned={winXp}
        onNextLevel={onNextLevel}
        onReplay={onReplayLevel}
        onClose={onCloseWinModal}
      />

      {/* ─── Level Defeat Modal (Tug-of-War reached 0) ─── */}
      {isLevelFailed && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`rounded-3xl p-6 max-w-sm w-full space-y-4 border shadow-2xl text-center ${
              zenMode
                ? 'bg-[#1f2125] border-[#2e3138]'
                : 'bg-white dark:bg-[#102034] border-rose-200 dark:border-rose-900/60'
            }`}
          >
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
              <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white">
                ¡Nivel Fracasado!
              </h3>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                -1 Vida descontada
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Has desafinado repetidamente la nota del reto y la barra de precisión llegó al límite.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {userLives > 0 ? (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    onRetryLevel();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reintentar Nivel</span>
                </button>
              ) : (
                <>
                  {onOpenRecoveryExam && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        onExitLevelToLibre();
                        onOpenRecoveryExam();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                      <span>Entrenar para ganar 1 vida (Gratis)</span>
                    </button>
                  )}
                  {onOpenStore && (
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        onExitLevelToLibre();
                        onOpenStore();
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs border active:scale-98 transition-all cursor-pointer ${
                        zenMode
                          ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Recargar en la Tienda
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  audioService.playClickSound();
                  onExitLevelToLibre();
                }}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Salir a Modo Libre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Easy Mode Win Video ─── */}
      {showEasyWinVideo && (
        <div className="fixed inset-0 bg-black z-99 flex flex-col items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-md aspect-square">
            <video
              ref={videoRef}
              src="/Duck Win.mp4"
              autoPlay
              muted={false}
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            size="lg"
            onClick={onCloseEasyWinVideo}
            className={`absolute bottom-16 z-80 h-20 px-8 text-xl sm:text-2xl font-black rounded-full transition-all ${
              zenMode
                ? 'bg-[#e5b83b] text-[#161719] shadow-[0_4px_0_0_#9a7212] hover:translate-y-1'
                : 'bg-[#4648d4] text-white shadow-[0_4px_0_0_rgba(30,30,120,1)] hover:translate-y-1 hover:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)]'
            }`}
          >
            Siguiente Reto <ArrowRight className="ml-2 w-8 h-8 sm:w-10 sm:h-10" />
          </Button>
        </div>
      )}
    </>
  );
};
