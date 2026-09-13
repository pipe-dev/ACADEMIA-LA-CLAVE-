'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeMicActive, isMicActiveGlobal } from '../utils/micEvents';

interface YouTubeAmbientPlayerProps {
  isPlaying: boolean;
  onTogglePlay?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export const YouTubeAmbientPlayer: React.FC<YouTubeAmbientPlayerProps> = ({ isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVolumeRef = useRef<number>(50);
  const isDuckedByMicRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(isPlaying);

  const [hasActivated, setHasActivated] = useState<boolean>(isPlaying);

  useEffect(() => {
    if (isPlaying && !hasActivated) {
      setHasActivated(true);
    }
  }, [isPlaying, hasActivated]);

  // Keep isPlayingRef updated
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const clearFadeInterval = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const fadeOutAndPause = useCallback(() => {
    clearFadeInterval();
    if (!playerRef.current) return;

    fadeIntervalRef.current = setInterval(() => {
      currentVolumeRef.current = Math.max(0, currentVolumeRef.current - 4);
      try {
        playerRef.current?.setVolume?.(currentVolumeRef.current);
      } catch {
        // Ignore
      }

      if (currentVolumeRef.current <= 0) {
        clearFadeInterval();
        try {
          playerRef.current?.pauseVideo?.();
        } catch {
          // Ignore
        }
      }
    }, 25);
  }, []);

  const resumeAndFadeIn = useCallback(() => {
    clearFadeInterval();
    if (!playerRef.current) return;

    try {
      playerRef.current?.setVolume?.(0);
      currentVolumeRef.current = 0;
      playerRef.current?.playVideo?.();
    } catch {
      // Ignore
    }

    fadeIntervalRef.current = setInterval(() => {
      currentVolumeRef.current = Math.min(50, currentVolumeRef.current + 3);
      try {
        playerRef.current?.setVolume?.(currentVolumeRef.current);
      } catch {
        // Ignore
      }

      if (currentVolumeRef.current >= 50) {
        clearFadeInterval();
        try {
          playerRef.current?.setVolume?.(50);
        } catch {
          // Ignore
        }
        currentVolumeRef.current = 50;
      }
    }, 25);
  }, []);

  const videoId = 'UfcAVejslrU';

  useEffect(() => {
    if (!hasActivated) return;

    // Load YouTube Iframe API if not already present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        try {
          playerRef.current = new window.YT.Player('yt-ambient-audio-frame', {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
              autoplay: isPlaying && !isMicActiveGlobal() ? 1 : 0,
              loop: 1,
              playlist: videoId,
              controls: 0,
              showinfo: 0,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              vq: 'small' // Low quality 144p/240p audio priority
            },
            events: {
              onReady: (event: any) => {
                setPlayerReady(true);
                if (event.target.setPlaybackQuality) {
                  event.target.setPlaybackQuality('small');
                }
                if (event.target.setVolume) {
                  event.target.setVolume(50); // Default volume 50%
                }
                if (isPlaying) {
                  if (isMicActiveGlobal()) {
                    isDuckedByMicRef.current = true;
                    // Don't start video while mic is active
                  } else {
                    event.target.playVideo();
                  }
                }
              },
              onStateChange: (event: any) => {
                if (event.data === window.YT?.PlayerState?.ENDED && isPlayingRef.current && !isDuckedByMicRef.current) {
                  event.target.playVideo();
                }
              }
            }
          });
        } catch (e) {
          console.warn('YouTube Ambient Player init warning:', e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        initPlayer();
      };
    }

    return () => {
      clearFadeInterval();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [hasActivated]);

  // Subscribe to microphone active/inactive broadcaster
  useEffect(() => {
    const unsubscribe = subscribeMicActive((isMicActive) => {
      if (isMicActive) {
        // Microphone turned ON: smooth fade out ambient music to not disrupt pitch detection
        if (isPlayingRef.current) {
          isDuckedByMicRef.current = true;
          fadeOutAndPause();
        }
      } else {
        // Microphone turned OFF: resume ambient music with smooth fade in
        if (isDuckedByMicRef.current && isPlayingRef.current) {
          isDuckedByMicRef.current = false;
          resumeAndFadeIn();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fadeOutAndPause, resumeAndFadeIn]);

  // Sync playback state with isPlaying prop
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;

    if (isPlaying) {
      if (isMicActiveGlobal()) {
        isDuckedByMicRef.current = true;
      } else {
        isDuckedByMicRef.current = false;
        try {
          playerRef.current.setPlaybackQuality?.('small');
          currentVolumeRef.current = 50;
          playerRef.current.setVolume?.(50);
          playerRef.current.playVideo();
        } catch {
          // Ignore
        }
      }
    } else {
      clearFadeInterval();
      isDuckedByMicRef.current = false;
      try {
        playerRef.current.pauseVideo();
      } catch {
        // Ignore
      }
    }
  }, [isPlaying]);

  if (!hasActivated) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed top-[-9999px] left-[-9999px] w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden z-[-1000]"
      aria-hidden="true"
    >
      <div id="yt-ambient-audio-frame" />
      {/* Fallback iframe player for instant autoplay if YT API is loading and mic is not active */}
      {isPlaying && !playerReady && !isMicActiveGlobal() && (
        <iframe
          width="1"
          height="1"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&enablejsapi=1&vq=small&playsinline=1`}
          title="Música Zen YouTube Audio"
          allow="autoplay; encrypted-media"
          className="w-px h-px border-0 opacity-0"
        />
      )}
    </div>
  );
};

export default YouTubeAmbientPlayer;
