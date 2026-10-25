import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, RepeatMode } from '../types';
import { api } from '../services/api';
import { useTheme } from './ThemeContext';
import { useLibrary } from './LibraryContext';
import { audioEqualizer } from '../services/audioEqualizer';

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalQueueRef = useRef<Track[]>([]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
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
    };
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      handleTrackEnd();
    };

    const onError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsLoading(false);
      setIsPlaying(false);
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
      prevTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack();
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

    const streamUrl = api.getStreamUrl(track.id);
    audioRef.current.src = streamUrl;
    audioRef.current.load();

    audioEqualizer.init(audioRef.current);
    audioEqualizer.ensureContextRunning();

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Autoplay prevented or interrupted:', err);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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

  const toggleShuffle = () => {
    if (!isShuffled) {
      // Shuffle queue while keeping current track first
      const current = currentTrack;
      const rest = queue.filter((t) => t.id !== current?.id);
      const shuffled = [...rest].sort(() => Math.random() - 0.5);
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
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
