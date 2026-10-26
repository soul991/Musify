import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, RepeatMode } from '../types';
import { api } from '../services/api';
import { useTheme } from './ThemeContext';
import { useLibrary } from './LibraryContext';
import { audioEqualizer } from '../services/audioEqualizer';
import { fisherYatesShuffle } from '../utils/shuffle';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Track[];
  queueIndex: number;
  isPlayerOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  sleepTimerMinutes: number | null;
  remainingSleepSeconds: number | null;
  playbackError: string | null;
  setIsPlayerOpen: (open: boolean) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  clearQueue: () => void;
  reorderQueue: (newQueue: Track[]) => void;
  setSleepTimer: (minutes: number | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { extractColorsFromImage } = useTheme();
  const { addToHistory } = useLibrary();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);

  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [remainingSleepSeconds, setRemainingSleepSeconds] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalQueueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;
  const volumeRef = useRef<number>(1);
  const errorTimeoutRef = useRef<any>(null);
  const skipTimeoutRef = useRef<any>(null);
  const fadeInTimerRef = useRef<any>(null);
  const handleTrackEndRef = useRef<() => void>(() => {});
  const triggerPlaybackErrorRef = useRef<(title: string) => void>(() => {});
  const prevTrackRef = useRef<() => void>(() => {});
  const nextTrackRef = useRef<() => void>(() => {});

  // Determine current network audio quality
  const getEffectiveAudioQuality = (): string => {
    if (typeof window === 'undefined') return 'lossless';
    const isCellular =
      (navigator as any).connection?.type === 'cellular' ||
      (navigator as any).connection?.effectiveType === '2g' ||
      (navigator as any).connection?.effectiveType === '3g';
    if (isCellular) {
      return localStorage.getItem('musify_audio_cellular') || 'high';
    }
    return localStorage.getItem('musify_audio_wifi') || 'lossless';
  };

  const triggerPlaybackError = (trackTitle: string) => {
    setIsLoading(false);
    setIsPlaying(false);
    setPlaybackError(`Unable to play "${trackTitle}". Skipping to next track...`);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);

    errorTimeoutRef.current = setTimeout(() => {
      setPlaybackError(null);
    }, 4000);

    skipTimeoutRef.current = setTimeout(() => {
      nextTrackRef.current();
    }, 1200);
  };
  triggerPlaybackErrorRef.current = triggerPlaybackError;

  // Resume Web Audio AudioContext on user interaction & visibility change
  useEffect(() => {
    const handleInteraction = () => {
      audioEqualizer.ensureContextRunning();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        audioEqualizer.ensureContextRunning();
        if (isPlaying && audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isPlaying]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    audioEqualizer.attachElement(audio);

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Handle Crossfade smooth volume fade-out near track end
      const isCrossfade = typeof window !== 'undefined' && localStorage.getItem('musify_crossfade_enabled') === 'true';
      const crossfadeSecs = typeof window !== 'undefined' ? Number(localStorage.getItem('musify_crossfade_secs')) || 4 : 4;
      if (isCrossfade && audio.duration && audio.duration > crossfadeSecs * 2) {
        const timeLeft = audio.duration - audio.currentTime;
        if (timeLeft <= crossfadeSecs && timeLeft > 0) {
          const factor = Math.max(0, timeLeft / crossfadeSecs);
          audio.volume = Math.max(0, Math.min(volumeRef.current, volumeRef.current * factor));
        }
      }

      // Update MediaSession position state
      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && audio.duration) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
          });
        } catch {
          // ignore
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setPlaybackError(null);
    };
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      handleTrackEndRef.current();
    };

    const onError = (e: any) => {
      console.warn('Audio playback error:', e);
      if (currentTrackRef.current) {
        triggerPlaybackErrorRef.current(currentTrackRef.current.title);
      } else {
        setIsLoading(false);
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      if (fadeInTimerRef.current) clearInterval(fadeInTimerRef.current);
    };
  }, []);

  // Sleep timer countdown effect
  useEffect(() => {
    if (!remainingSleepSeconds || remainingSleepSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSleepSeconds((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          audioRef.current?.pause();
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSleepSeconds]);

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    setRemainingSleepSeconds(minutes ? minutes * 60 : null);
  };

  // Setup Web Media Session API (iOS lock-screen & Dynamic Island)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    const artistName = currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';
    const artworkUrl = currentTrack.thumbnail || '';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: artistName,
      album: currentTrack.album?.name || 'Musify',
      artwork: [
        { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevTrackRef.current();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrackRef.current();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        const skip = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skip);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        const skip = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + skip);
      }
    });
  }, [currentTrack]);

  const handleTrackEnd = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      nextTrack();
    }
  };
  handleTrackEndRef.current = handleTrackEnd;

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (!audioRef.current) return;

    setCurrentTrack(track);
    setIsLoading(true);
    setCurrentTime(0);
    extractColorsFromImage(track.thumbnail);
    addToHistory(track);

    if (newQueue) {
      setQueue(newQueue);
      originalQueueRef.current = newQueue;
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else if (queue.length === 0) {
      setQueue([track]);
      originalQueueRef.current = [track];
      setQueueIndex(0);
      // Auto-fetch related radio tracks in the background
      api.getRadio(track.id).then((related) => {
        if (related.length > 0) {
          setQueue((prev) => [...prev, ...related]);
          originalQueueRef.current = [...originalQueueRef.current, ...related];
        }
      });
    }

    const quality = getEffectiveAudioQuality();
    const streamUrl = api.getStreamUrl(track.id, quality);
    audioRef.current.src = streamUrl;

    const isCrossfade = typeof window !== 'undefined' && localStorage.getItem('musify_crossfade_enabled') === 'true';
    const crossfadeSecs = typeof window !== 'undefined' ? Number(localStorage.getItem('musify_crossfade_secs')) || 4 : 4;

    if (isCrossfade) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = volumeRef.current;
    }

    audioRef.current.load();

    // If EQ is enabled, wire into Web Audio; otherwise leave native for iOS PWA background play
    if (audioEqualizer.getEnabled()) {
      audioEqualizer.init(audioRef.current);
      audioEqualizer.ensureContextRunning();
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setPlaybackError(null);

      // Smooth fade-in if crossfade is enabled
      if (isCrossfade && audioRef.current) {
        if (fadeInTimerRef.current) clearInterval(fadeInTimerRef.current);
        let step = 0;
        const totalSteps = 15;
        const targetVol = volumeRef.current;
        const intervalMs = (Math.min(crossfadeSecs, 2) * 1000) / totalSteps;
        fadeInTimerRef.current = setInterval(() => {
          step++;
          if (!audioRef.current) {
            clearInterval(fadeInTimerRef.current);
            return;
          }
          audioRef.current.volume = Math.min(targetVol, (targetVol * step) / totalSteps);
          if (step >= totalSteps) {
            clearInterval(fadeInTimerRef.current);
            audioRef.current.volume = targetVol;
          }
        }, intervalMs);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Autoplay error:', err);
        triggerPlaybackError(track.title);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioEqualizer.ensureContextRunning();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPlaybackError(null);
      }).catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('Playback error on togglePlay:', err);
          triggerPlaybackError(currentTrack.title);
        }
      });
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (val: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(1, val));
    volumeRef.current = clamped;
    audioRef.current.volume = clamped;
    setVolumeState(clamped);
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return; // End of queue
      }
    }
    setQueueIndex(nextIdx);
    const nextItem = queue[nextIdx];
    if (nextItem) {
      playTrack(nextItem, queue);
    }
  };
  nextTrackRef.current = nextTrack;

  const prevTrack = () => {
    if (!audioRef.current) return;
    // If more than 3 seconds in, restart the song
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') {
        prevIdx = queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }
    setQueueIndex(prevIdx);
    const prevItem = queue[prevIdx];
    if (prevItem) {
      playTrack(prevItem, queue);
    }
  };
  prevTrackRef.current = prevTrack;

  const toggleShuffle = () => {
    if (!isShuffled) {
      // Shuffle queue while keeping current track first with unbiased Fisher-Yates shuffle
      const current = currentTrack;
      const rest = queue.filter((t) => t.id !== current?.id);
      const shuffled = fisherYatesShuffle(rest);
      const newQueue = current ? [current, ...shuffled] : shuffled;
      setQueue(newQueue);
      setQueueIndex(0);
      setIsShuffled(true);
    } else {
      // Restore original queue order
      setQueue(originalQueueRef.current);
      const idx = originalQueueRef.current.findIndex((t) => t.id === currentTrack?.id);
      setQueueIndex(idx !== -1 ? idx : 0);
      setIsShuffled(false);
    }
  };

  const toggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    originalQueueRef.current = [...originalQueueRef.current, track];
  };

  const playNextInQueue = (track: Track) => {
    setQueue((prev) => {
      const nextIdx = queueIndex + 1;
      const newQ = [...prev];
      newQ.splice(nextIdx, 0, track);
      return newQ;
    });
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      originalQueueRef.current = [currentTrack];
      setQueueIndex(0);
    } else {
      setQueue([]);
      originalQueueRef.current = [];
      setQueueIndex(-1);
    }
  };

  const reorderQueue = (newQueue: Track[]) => {
    setQueue(newQueue);
    const idx = newQueue.findIndex((t) => t.id === currentTrack?.id);
    setQueueIndex(idx !== -1 ? idx : 0);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        repeatMode,
        isShuffled,
        queue,
        queueIndex,
        isPlayerOpen,
        isLyricsOpen,
        isQueueOpen,
        sleepTimerMinutes,
        remainingSleepSeconds,
        playbackError,
        setIsPlayerOpen,
        setIsLyricsOpen,
        setIsQueueOpen,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        nextTrack,
        prevTrack,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        playNextInQueue,
        clearQueue,
        reorderQueue,
        setSleepTimer
      }}
    >
      {playbackError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-rose-600/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition-all border border-rose-400/30">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{playbackError}</span>
        </div>
      )}
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
