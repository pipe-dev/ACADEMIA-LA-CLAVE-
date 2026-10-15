'use client';
import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
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
  const [isVideoFadingOut, setIsVideoFadingOut] = useState<boolean>(false);
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

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (step === 'video') {
      setIsVideoFadingOut(false);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'video' && !userRequestedPlayRef.current) {
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
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

                if (dur - (typeof time === 'number' ? time : 0) <= 3.2 && !isVideoFadingOut) {
                  if (currentLoop >= targetLoopCount) {
                    setIsVideoFadingOut(true);
                  }
                }
              }
            }
          } catch (e) {}
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, node1CompletedTriggered, isVideoFadingOut, currentLoop, targetLoopCount, node.id, node.title, node.xpReward, onCompleteNode]);

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

    if (step === 'video' || userRequestedPlayRef.current) {
      attemptAutoPlay(event.target);
    }
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) {
      setIsPlaying(true);
      autoPlayFiredRef.current = true;
      if (autoPlayWatcherRef.current) {
        clearInterval(autoPlayWatcherRef.current);
        autoPlayWatcherRef.current = null;
      }
    } else if (event.data === 2) {
      setIsPlaying(false);
      if (!autoPlayFiredRef.current && (step === 'video' || userRequestedPlayRef.current)) {
        try {
          event.target.unMute?.();
          event.target.setVolume?.(100);
          event.target.playVideo?.();
        } catch {}
      }
    } else if (event.data === 5 || event.data === -1) {
      if (step === 'video' || userRequestedPlayRef.current) {
        attemptAutoPlay(event.target);
      }
    }

    if (event.data === 0) {
      if (currentLoop < targetLoopCount) {
        const completedNum = currentLoop;
        const nextLoop = currentLoop + 1;
        setCurrentLoop(nextLoop);
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
          setTimeout(() => {
            unlockOrientation();
            onTransitionToVocalDiagnostic();
          }, 1200);
        } else if (node.id === 'u1-node1' || node.title?.includes('Introducción al Canto')) {
          setTimeout(() => {
            unlockOrientation();
            if (!quizResolved) {
              onTransitionToQuiz();
            } else {
              onClose();
            }
          }, 1200);
        } else {
          setTimeout(() => {
            unlockOrientation();
            onCompleteNode(node.id, node.xpReward);
            onClose();
          }, 2400);
        }
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
    if (node.id === 'u1-node1' && !quizResolved) {
      onTransitionToQuiz();
    } else {
      onClose();
    }
  };

  // Pause on non-video steps
  useEffect(() => {
    if (step !== 'video') {
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.();
          if (typeof t === 'number' && !isNaN(t) && t > 0.5) {
            nodeVideoPlaybackTimes.set(node.id, t);
          }
          playerRef.current.pauseVideo?.();
        } catch {}
      }
      setIsPlaying(false);
    }
  }, [step, node.id]);

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
          ? 'fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col justify-center items-center overflow-hidden select-none animate-fadeIn'
          : 'fixed -left-[9999px] -top-[9999px] w-[320px] h-[240px] opacity-0 pointer-events-none overflow-hidden z-[-1]'
      }
    >
      <div
        ref={videoContainerRef}
        onMouseMove={resetControlsTimeout}
        onTouchStart={resetControlsTimeout}
        onClick={resetControlsTimeout}
        className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none transition-all duration-[3000ms] ease-out ${
          isVideoFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
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

        <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />

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
        />
      </div>
    </div>
  );
};
