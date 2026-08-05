'use client';
import React, { useEffect, useRef, useState } from 'react';

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

  const videoId = 'UfcAVejslrU';

  useEffect(() => {
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
              autoplay: isPlaying ? 1 : 0,
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
                  event.target.playVideo();
                }
              },
              onStateChange: (event: any) => {
                if (event.data === window.YT?.PlayerState?.ENDED && isPlaying) {
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
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Sync playback state with isPlaying prop
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      if (isPlaying) {
        try {
          playerRef.current.setPlaybackQuality?.('small');
          playerRef.current.playVideo();
        } catch {
          // Ignore
        }
      } else {
        try {
          playerRef.current.pauseVideo();
        } catch {
          // Ignore
        }
      }
    }
  }, [isPlaying]);

  return (
    <div 
      ref={containerRef}
      className="fixed top-[-9999px] left-[-9999px] w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden z-[-1000]"
      aria-hidden="true"
    >
      <div id="yt-ambient-audio-frame" />
      {/* Fallback iframe player for instant autoplay if YT API is loading */}
      {isPlaying && !playerReady && (
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
