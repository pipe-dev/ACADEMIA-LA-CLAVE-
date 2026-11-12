'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { FastForward } from 'lucide-react';
import { LessonNode } from '../../types';
import { audioService } from '../../utils/audioService';
import { VideoPlayerControls } from './VideoPlayerControls';
import {
  nodeVideoPlaybackTimes,
  unlockOrientation,
  fireVideoConfetti,
  getTargetLoopCount,
  attemptAutoPlay
} from './videoPlaybackUtils';

export { unlockOrientation };

interface LessonVideoPlayerProps {
  node: LessonNode;
  step: string;
  quizResolved: boolean;
  userRequestedPlayRef: React.MutableRefObject<boolean>;
  onClose: () => void;
  onCompleteNode: (nodeId: string, xpReward: number) => void;
  onTransitionToQuiz: () => void;
  onTransitionToVocalDiagnostic: () => void;
}

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  node,
  step,
  quizResolved,
  userRequestedPlayRef,
  onClose,
  onCompleteNode,
  onTransitionToQuiz,
  onTransitionToVocalDiagnostic
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFastForwarding, setIsFastForwarding] = useState<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHolding2xRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [node1CompletedTriggered, setNode1CompletedTriggered] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [loopToastMsg, setLoopToastMsg] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const autoPlayFiredRef = useRef<boolean>(false);
  const autoPlayWatcherRef = useRef<NodeJS.Timeout | null>(null);

  const targetLoopCount = getTargetLoopCount(node);
  const [currentLoop, setCurrentLoop] = useState<number>(1);
  const currentLoopRef = useRef<number>(1);
  const loopTriggerLockRef = useRef<boolean>(false);
  const lastProgressTimeRef = useRef<number>(0);

  const handleLoopOrComplete = useCallback((isManual: boolean = false) => {
    if (loopTriggerLockRef.current && !isManual) return;
    loopTriggerLockRef.current = true;
    setTimeout(() => {
      loopTriggerLockRef.current = false;
    }, 2200);

    if (currentLoopRef.current < targetLoopCount) {
      const completedNum = currentLoopRef.current;
      const nextLoop = currentLoopRef.current + 1;
      currentLoopRef.current = nextLoop;
      setCurrentLoop(nextLoop);
      lastProgressTimeRef.current = 0;
      setIsPlaying(true);
      audioService.playSoftDing();
      audioService.vibrate([20, 30, 20]);
      fireVideoConfetti(confettiCanvasRef.current, 50);

      if (targetLoopCount > 1) {
        setLoopToastMsg(`BUCLE ${completedNum} DE ${targetLoopCount} COMPLETADO`);
        setTimeout(() => setLoopToastMsg(null), 2400);
      }

      if (playerRef.current) {
        try {
          playerRef.current.seekTo(0, true);
          playerRef.current.playVideo();
        } catch {}
      }
    } else {
      setIsPlaying(false);
      audioService.playLessonCompleteSound();
      audioService.vibrate([40, 60, 40, 100]);

      if (targetLoopCount > 1) {
        setLoopToastMsg(`¡${targetLoopCount} DE ${targetLoopCount} BUCLES COMPLETADOS! LECCIÓN DOMINADA`);
      }

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          fireVideoConfetti(confettiCanvasRef.current, 70);
          audioService.playXpGainSound();
        }, i * 280);
      }

      if (node.id === 'u1-node7' || node.title?.includes('Fisiología Vocal')) {
        userRequestedPlayRef.current = false;
        setTimeout(() => {
          unlockOrientation();
          onTransitionToVocalDiagnostic();
        }, 1200);
      } else if (node.id === 'u1-node1' || node.title?.includes('Introducción al Canto')) {
        userRequestedPlayRef.current = false;
        setTimeout(() => {
          unlockOrientation();
          if (!quizResolved) {
            onTransitionToQuiz();
          } else {
            onClose();
          }
        }, 1200);
      } else {
        userRequestedPlayRef.current = false;
        setTimeout(() => {
          unlockOrientation();
          onCompleteNode(node.id, node.xpReward);
          onClose();
        }, 2400);
      }
    }
  }, [targetLoopCount, node.id, node.title, node.xpReward, onCompleteNode, onTransitionToQuiz, onTransitionToVocalDiagnostic, onClose, quizResolved, userRequestedPlayRef]);

  const startFastForward = useCallback(() => {
    isHolding2xRef.current = true;
    setIsFastForwarding(true);
    setShowControls(false);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
    audioService.vibrate(22);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(2);
      } catch {}
    }
  }, []);

  const stopFastForward = useCallback(() => {
    if (isHolding2xRef.current) {
      isHolding2xRef.current = false;
      setIsFastForwarding(false);
      audioService.vibrate(10);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        try {
          playerRef.current.setPlaybackRate(1);
        } catch {}
      }
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const rect = videoContainerRef.current?.getBoundingClientRect();
    const isRightSide = rect ? (e.clientX - rect.left) >= rect.width * 0.42 : false;

    if (isRightSide && isPlaying) {
      longPressTimerRef.current = setTimeout(() => {
        startFastForward();
      }, 260);
    }
  }, [isPlaying, startFastForward]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartPosRef.current && !isHolding2xRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 25 || dy > 25) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isHolding2xRef.current) {
      stopFastForward();
      pointerStartPosRef.current = null;
      return;
    }

    if (pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      pointerStartPosRef.current = null;
      if (dx <= 25 && dy <= 25) {
        setShowControls(prev => {
          const next = !prev;
          if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
            hideControlsTimer.current = null;
          }
          if (next && isPlaying) {
            hideControlsTimer.current = setTimeout(() => {
              setShowControls(false);
            }, 3200);
          }
          return next;
        });
      }
    }
  }, [isPlaying, stopFastForward]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isHolding2xRef.current) {
      stopFastForward();
    }
    pointerStartPosRef.current = null;
  }, [stopFastForward]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        try { playerRef.current.setPlaybackRate(1); } catch {}
      }
    };
  }, []);

  const resetControlsTimeout = useCallback(() => {
    if (isHolding2xRef.current) return;
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3200);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  useEffect(() => {
    if (step !== 'video') {
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
      userRequestedPlayRef.current = false;
      return;
    }

    autoPlayFiredRef.current = false;
    let ticks = 0;

    autoPlayWatcherRef.current = setInterval(async () => {
      ticks++;
      if (ticks > 50 || autoPlayFiredRef.current) {
        if (autoPlayWatcherRef.current) {
          clearInterval(autoPlayWatcherRef.current);
          autoPlayWatcherRef.current = null;
        }
        return;
      }

      const player = playerRef.current;
      if (!player) return;

      try {
        const rawState = typeof player.getPlayerState === 'function' ? player.getPlayerState() : null;
        const state = typeof rawState?.then === 'function' ? await rawState : rawState;

        if (state === 1) {
          setIsPlaying(true);
          autoPlayFiredRef.current = true;
          if (autoPlayWatcherRef.current) {
            clearInterval(autoPlayWatcherRef.current);
            autoPlayWatcherRef.current = null;
          }
          return;
        }

        if (state === 5 || state === -1 || (state === 2 && !autoPlayFiredRef.current)) {
          attemptAutoPlay(player);
        }
      } catch (e) {}
    }, 100);

    return () => {
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
    };
  }, [step, userRequestedPlayRef]);

  // Sync Timer for Video Progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && step === 'video') {
      interval = setInterval(async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const rawTime = playerRef.current.getCurrentTime();
            const time = typeof rawTime?.then === 'function' ? await rawTime : rawTime;
            if (typeof time === 'number' && !isNaN(time)) {
              setCurrentTime(time);
              if (time > 0.5) {
                nodeVideoPlaybackTimes.set(node.id, time);
              }

              if (node.id === 'u1-node1' || node.title?.includes('Introducción al Canto')) {
                if (time >= 434 && !node1CompletedTriggered) {
                  setNode1CompletedTriggered(true);
                  audioService.playSoftDing();
                  fireVideoConfetti(confettiCanvasRef.current, 60);
                  onCompleteNode(node.id, node.xpReward);
                }
              }
            }

            if (typeof playerRef.current.getDuration === 'function') {
              const rawDur = playerRef.current.getDuration();
              const dur = typeof rawDur?.then === 'function' ? await rawDur : rawDur;
              if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                setDuration(dur);

                // Detección proactiva de fin o reinicio en videos con bucle o lecciones
                if (dur > 2) {
                  const reachedEnd = (time >= dur - 0.75);
                  const wrappedAround = (lastProgressTimeRef.current >= dur - 3.0 && time < 1.5 && time >= 0);
                  if (reachedEnd || wrappedAround) {
                    handleLoopOrComplete();
                  }
                }


              }
            }
            lastProgressTimeRef.current = time;
          } catch (e) {}
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, node1CompletedTriggered, currentLoop, targetLoopCount, node.id, node.title, node.xpReward, onCompleteNode]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    try {
      const iframe = event.target.getIframe?.();
      if (iframe) {
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      }
      event.target.unMute?.();
      event.target.setVolume?.(100);

      const savedTime = nodeVideoPlaybackTimes.get(node.id);
      if (typeof savedTime === 'number' && savedTime > 0.5) {
        event.target.seekTo?.(savedTime, true);
        setCurrentTime(savedTime);
      }
    } catch {}

    if (step === 'video' && userRequestedPlayRef.current) {
      attemptAutoPlay(event.target);
    }
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (step !== 'video') {
      if (event.data === 1) {
        try {
          event.target.pauseVideo?.();
          event.target.mute?.();
        } catch {}
      }
      setIsPlaying(false);
      return;
    }

    if (event.data === 1) {
      setIsPlaying(true);
      autoPlayFiredRef.current = true;
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
    } else if (event.data === 2) {
      setIsPlaying(false);
      if (!autoPlayFiredRef.current && step === 'video' && userRequestedPlayRef.current) {
        try {
          event.target.unMute?.();
          event.target.setVolume?.(100);
          event.target.playVideo?.();
        } catch {}
      }
    } else if (event.data === 5 || event.data === -1) {
      if (step === 'video' && userRequestedPlayRef.current) {
        attemptAutoPlay(event.target);
      }
    }

    if (event.data === 0) {
      handleLoopOrComplete();
    } else if (event.data === 2) {
      if (duration > 2 && currentTime >= duration - 1.5) {
        handleLoopOrComplete();
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    resetControlsTimeout();
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
        setIsPlaying(false);
      } else {
        try {
          playerRef.current.unMute?.();
          playerRef.current.setVolume?.(100);
        } catch {}
        playerRef.current.playVideo?.();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        await Promise.resolve(playerRef.current.seekTo(time, true));
      } catch {}
    }
  };

  const seekBackward = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.max(0, currentTime - 10);
      setCurrentTime(newTime);
      try {
        await Promise.resolve(playerRef.current.seekTo(newTime, true));
      } catch {}
    }
  };

  const seekForward = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.min(duration || currentTime + 10, currentTime + 10);
      setCurrentTime(newTime);
      try {
        await Promise.resolve(playerRef.current.seekTo(newTime, true));
      } catch {}
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playClickSound();
    unlockOrientation();
    userRequestedPlayRef.current = false;
    if (playerRef.current) {
      try {
        const t = playerRef.current.getCurrentTime?.();
        if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
          nodeVideoPlaybackTimes.set(node.id, t);
        }
        playerRef.current.pauseVideo?.();
        playerRef.current.mute?.();
        playerRef.current.stopVideo?.();
      } catch {}
    }
    setIsPlaying(false);
    if (node.id === 'u1-node1' && !quizResolved) {
      onTransitionToQuiz();
    } else {
      onClose();
    }
  };

  // Pause on non-video steps
  useEffect(() => {
    if (step !== 'video') {
      userRequestedPlayRef.current = false;
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
          playerRef.current.mute?.();
        } catch {}
      }
      setIsPlaying(false);
    }
  }, [step, node.id, userRequestedPlayRef]);

  // Pause on tab hidden and on unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
        } catch {}
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      userRequestedPlayRef.current = false;
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
          playerRef.current.stopVideo?.();
        } catch {}
      }
      setIsPlaying(false);
    };
  }, [node.id, userRequestedPlayRef]);

  if (!node.youtubeId) return null;

  return (
    <div
      className={
        step === 'video'
          ? 'fixed inset-0 z-50 w-full h-[100dvh] max-h-[100dvh] bg-black flex flex-col justify-center items-center overflow-hidden select-none animate-fadeIn'
          : 'fixed -left-[9999px] -top-[9999px] w-[320px] h-[240px] opacity-0 pointer-events-none overflow-hidden z-[-1]'
      }
    >
      <div
        ref={videoContainerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none"
      >
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <YouTube
            videoId={node.youtubeId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                disablekb: 1,
                fs: 0,
                playsinline: 1,
                enablejsapi: 1,
                iv_load_policy: 3
              }
            }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:object-cover"
          />
        </div>

        <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-35" />

        {/* Capa de detección de toque (toggle controles) y pulsación larga en el lado derecho (2x) */}
        <div
          className="absolute inset-0 z-10 cursor-pointer touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        {/* Insignia visual 2X RÁPIDO cuando se mantiene pulsado */}
        {isFastForwarding && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none flex items-center gap-2.5 bg-black/85 backdrop-blur-md border border-amber-400/80 px-6 py-2 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse">
            <FastForward className="w-5 h-5 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wider font-mono">
              2X RÁPIDO »
            </span>
          </div>
        )}

        {loopToastMsg && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0b1c30]/95 backdrop-blur-2xl border-2 border-[#4648d4] px-8 py-5 rounded-3xl shadow-[0px_16px_40px_rgba(70,72,212,0.6)] flex flex-col items-center justify-center text-center animate-scaleIn pointer-events-none select-none max-w-xs sm:max-w-md">
            <span className="text-[10px] sm:text-xs font-black text-indigo-300 uppercase tracking-widest block leading-tight">
              PROGRESO DE EJERCICIO
            </span>
            <h3 className="text-base sm:text-xl font-black text-white leading-tight mt-1 drop-shadow-md">
              {loopToastMsg}
            </h3>
          </div>
        )}

        <VideoPlayerControls
          title={node.title}
          isPlaying={isPlaying}
          showControls={showControls}
          currentTime={currentTime}
          duration={duration}
          currentLoop={currentLoop}
          targetLoopCount={targetLoopCount}
          onTogglePlay={togglePlay}
          onSeekBackward={seekBackward}
          onSeekForward={seekForward}
          onSeekChange={handleSeek}
          onBackClick={handleBackClick}
          onManualAdvanceLoop={() => handleLoopOrComplete(true)}
        />
      </div>
    </div>
  );
};
