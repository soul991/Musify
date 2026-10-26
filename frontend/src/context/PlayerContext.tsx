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
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
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
  autoplaySimilar: boolean;
  setAutoplaySimilar: (val: boolean) => void;
}

const getInitialPersistedPlayer = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('musify_persisted_player');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { extractColorsFromImage } = useTheme();
  const { addToHistory } = useLibrary();

  const [persistedState] = useState(getInitialPersistedPlayer);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => persistedState?.currentTrack || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(() => persistedState?.currentTime || 0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);

  const [queue, setQueue] = useState<Track[]>(() => (Array.isArray(persistedState?.queue) ? persistedState.queue : []));
  const [queueIndex, setQueueIndex] = useState<number>(() => (typeof persistedState?.queueIndex === 'number' ? persistedState.queueIndex : -1));

  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [remainingSleepSeconds, setRemainingSleepSeconds] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1);
  const [autoplaySimilar, setAutoplaySimilarState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('musify_autoplay_similar') !== 'false';
  });

  const setAutoplaySimilar = (val: boolean) => {
    setAutoplaySimilarState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('musify_autoplay_similar', String(val));
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const isCrossfadingRef = useRef<boolean>(false);
  const crossfadeTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const originalQueueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const queueRef = useRef<Track[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);
  const repeatModeRef = useRef<RepeatMode>('off');
  const prefetchedNextIdRef = useRef<string | null>(null);
  const volumeRef = useRef<number>(1);
  const errorTimeoutRef = useRef<any>(null);
  const skipTimeoutRef = useRef<any>(null);
  const fadeInTimerRef = useRef<any>(null);
  const handleTrackEndRef = useRef<() => void>(() => {});
  const triggerPlaybackErrorRef = useRef<(title: string) => void>(() => {});
  const prevTrackRef = useRef<() => void>(() => {});
  const nextTrackRef = useRef<() => void>(() => {});
  const extractColorsRef = useRef(extractColorsFromImage);
  const addToHistoryRef = useRef(addToHistory);

  const setPlaybackSpeed = (speed: number) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

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

  // Initialize primary and secondary audio elements for seamless gapless / crossfade
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    audioEqualizer.attachElement(audio);

    const secAudio = new Audio();
    secAudio.preload = 'auto';
    secAudio.crossOrigin = 'anonymous';
    secondaryAudioRef.current = secAudio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // 1. Skip Silence Detection (leading and trailing silence)
      const isSkipSilence = typeof window !== 'undefined' && localStorage.getItem('musify_skip_silence') === 'true';
      if (isSkipSilence && audio.duration && !isCrossfadingRef.current) {
        // Trailing silence: if in final 8 seconds and RMS is silent (< 0.003) for > 1s, advance to next track
        const timeLeft = audio.duration - audio.currentTime;
        if (timeLeft <= 8 && timeLeft > 0.5) {
          const rms = audioEqualizer.getInstantRms();
          if (rms >= 0 && rms < 0.003) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                nextTrackRef.current();
                silenceTimerRef.current = null;
              }, 1000);
            }
          } else if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
        // Leading silence: in the first 2 seconds, if RMS is near zero, bump forward
        if (audio.currentTime < 2) {
          const rms = audioEqualizer.getInstantRms();
          if (rms >= 0 && rms < 0.002) {
            audio.currentTime = Math.min(2.5, audio.currentTime + 0.4);
          }
        }
      }

      // 2. Real Crossfade Transition (simultaneous playback of outgoing and incoming audio)
      const isCrossfade = typeof window !== 'undefined' && localStorage.getItem('musify_crossfade_enabled') === 'true';
      const crossfadeSecs = typeof window !== 'undefined' ? Number(localStorage.getItem('musify_crossfade_secs')) || 4 : 4;
      if (isCrossfade && crossfadeSecs > 0 && audio.duration && audio.duration > crossfadeSecs * 2) {
        const timeLeft = audio.duration - audio.currentTime;
        if (timeLeft <= crossfadeSecs && timeLeft > 0 && !isCrossfadingRef.current) {
          const nextIdx = queueIndexRef.current + 1;
          const currentQ = queueRef.current;
          const nextItem = currentQ[nextIdx] || (repeatModeRef.current === 'all' ? currentQ[0] : null);
          if (nextItem && secondaryAudioRef.current) {
            isCrossfadingRef.current = true;
            const q = getEffectiveAudioQuality();
            const sec = secondaryAudioRef.current;
            sec.src = api.getStreamUrl(nextItem.id, q);
            sec.volume = 0;
            sec.currentTime = 0;
            sec.load();
            sec.play().then(() => {
              if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
              const startTime = Date.now();
              const fadeDuration = crossfadeSecs * 1000;
              const targetVol = volumeRef.current;

              crossfadeTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / fadeDuration);

                if (audioRef.current) {
                  audioRef.current.volume = Math.max(0, targetVol * (1 - progress));
                }
                sec.volume = Math.min(targetVol, targetVol * progress);

                if (progress >= 1) {
                  clearInterval(crossfadeTimerRef.current);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current.src = '';
                  }
                  // Swap primary and secondary audio elements
                  const temp = audioRef.current;
                  audioRef.current = sec;
                  secondaryAudioRef.current = temp;
                  isCrossfadingRef.current = false;

                  setCurrentTrack(nextItem);
                  setQueueIndex(nextIdx < currentQ.length ? nextIdx : 0);
                  extractColorsRef.current(nextItem.thumbnail);
                  addToHistoryRef.current(nextItem);
                  if (audioRef.current) {
                    audioRef.current.volume = targetVol;
                  }
                }
              }, 50);
            }).catch(() => {
              isCrossfadingRef.current = false;
            });
          }
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

      // Stream prefetch ~20s before track end into service worker / browser cache
      if (audio.duration && audio.duration - audio.currentTime <= 20) {
        const nextIdx = queueIndexRef.current + 1;
        const currentQ = queueRef.current;
        const nextItem = currentQ[nextIdx] || (repeatModeRef.current === 'all' ? currentQ[0] : null);
        if (nextItem && prefetchedNextIdRef.current !== nextItem.id) {
          prefetchedNextIdRef.current = nextItem.id;
          const q = getEffectiveAudioQuality();
          const nextUrl = api.getStreamUrl(nextItem.id, q);
          fetch(nextUrl, { method: 'GET', headers: { Range: 'bytes=0-32767' } }).catch(() => {});
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
      secAudio.pause();
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
      if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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
      } else if (autoplaySimilar && currentTrack) {
        api.getRadio(currentTrack.id).then((related) => {
          if (related.length > 0) {
            setQueue((prev) => [...prev, ...related]);
            originalQueueRef.current = [...originalQueueRef.current, ...related];
            playTrack(related[0], [...queue, ...related]);
          }
        }).catch(() => {});
        return;
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

  // Synchronize dynamic refs outside render to satisfy React 19 compiler rules
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    queueRef.current = queue;
    queueIndexRef.current = queueIndex;
    repeatModeRef.current = repeatMode;
    triggerPlaybackErrorRef.current = triggerPlaybackError;
    handleTrackEndRef.current = handleTrackEnd;
    nextTrackRef.current = nextTrack;
    prevTrackRef.current = prevTrack;
    extractColorsRef.current = extractColorsFromImage;
    addToHistoryRef.current = addToHistory;
  });

  // Attach restored track stream to audio element on initial mount
  useEffect(() => {
    if (persistedState?.currentTrack && audioRef.current) {
      const q = getEffectiveAudioQuality();
      audioRef.current.src = api.getStreamUrl(persistedState.currentTrack.id, q);
      audioRef.current.currentTime = persistedState.currentTime || 0;
      audioRef.current.load();
      if (Array.isArray(persistedState.queue)) {
        originalQueueRef.current = persistedState.queue;
      }
    }
  }, [persistedState]);

  // Persist player queue, current track, and seek point
  const timeBucket = Math.floor(currentTime / 5);
  useEffect(() => {
    if (!currentTrack) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'musify_persisted_player',
          JSON.stringify({
            currentTrack,
            queue,
            queueIndex,
            currentTime: audioRef.current?.currentTime ?? currentTime
          })
        );
      } catch {
        // ignore storage quota errors
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentTrack, queue, queueIndex, timeBucket, currentTime]);

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
        playbackSpeed,
        setPlaybackSpeed,
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
        setSleepTimer,
        autoplaySimilar,
        setAutoplaySimilar
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
