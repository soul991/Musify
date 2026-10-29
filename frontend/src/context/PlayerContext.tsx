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
  retryPlayback: () => void;
  prefetchTrack: (videoId: string) => void;
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

  // Audio elements & crossfade/gapless state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
  const isCrossfadingRef = useRef<boolean>(false);
  const crossfadeTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Performance & prefetch refs
  const hasPrefetchedNextHalfwayRef = useRef<boolean>(false);
  const isFetchingRadioRef = useRef<boolean>(false);
  const radioFetchedTrackIdsRef = useRef<Set<string>>(new Set());
  const playedHistoryIdsRef = useRef<string[]>([]);
  const consecutiveFailuresRef = useRef<number>(0);
  const directStreamFailedRef = useRef<Set<string>>(new Set());
  const playStartTimeRef = useRef<number>(0);
  const hasPlayedSuccessfullyInSessionRef = useRef<boolean>(false);
  const stalledTimerRef = useRef<any>(null);
  const movementCheckTimerRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(false);

  const mapAudioErrorCode = (code?: number): string => {
    switch (code) {
      case 1:
        return 'Playback aborted';
      case 2:
        return 'network error'; // code 2 = network
      case 3:
        return 'decode error'; // code 3 = decode
      case 4:
        return 'unsupported/blocked source'; // code 4 = unsupported/blocked source
      default:
        return 'playback failed';
    }
  };

  // Queue & state sync refs
  const originalQueueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const queueRef = useRef<Track[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);
  const repeatModeRef = useRef<RepeatMode>('off');
  const autoplaySimilarRef = useRef<boolean>(autoplaySimilar);
  const volumeRef = useRef<number>(1);
  const errorTimeoutRef = useRef<any>(null);
  const skipTimeoutRef = useRef<any>(null);
  const fadeInTimerRef = useRef<any>(null);

  // Callback refs to break circular dependencies
  const handleTrackEndRef = useRef<() => void>(() => {});
  const triggerPlaybackErrorRef = useRef<(track: Track, reason?: string, isStalled?: boolean) => void>(() => {});
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

  const prefetchTrack = (videoId: string) => {
    if (videoId) {
      api.prefetchStream(videoId);
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

  // Safe error handling with 3-consecutive-failure cap, proxy fallback & no silent fails
  const handlePlaybackFailure = (track: Track, reason = 'playback failed', isStalled = false) => {
    setIsLoading(false);
    setIsPlaying(false);

    if (stalledTimerRef.current) {
      clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = null;
    }
    if (movementCheckTimerRef.current) {
      clearTimeout(movementCheckTimerRef.current);
      movementCheckTimerRef.current = null;
    }

    // 1. Direct stream failure fallback: try Netlify proxy route once before giving up
    if (!isStalled && !directStreamFailedRef.current.has(track.id) && audioRef.current) {
      directStreamFailedRef.current.add(track.id);
      console.warn(`[STREAM] Direct stream failed for "${track.title}" (${reason}). Falling back to proxy route /api/stream...`);
      const proxyUrl = api.getStreamUrl(track.id, getEffectiveAudioQuality(), true);
      audioRef.current.src = proxyUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPlaybackError(null);
        consecutiveFailuresRef.current = 0;
      }).catch((err) => {
        if (err?.name !== 'AbortError') {
          triggerConsecutiveFailure(track, reason, isStalled);
        }
      });
      return;
    }

    triggerConsecutiveFailure(track, reason, isStalled);
  };

  const triggerConsecutiveFailure = (track: Track, reason = 'playback failed', isStalled = false) => {
    // Don't auto-skip through the queue on a stalled or failed first track.
    // Auto-skip only when a track fails after playing was working earlier in the session.
    if (!hasPlayedSuccessfullyInSessionRef.current) {
      console.warn(`[PLAYBACK] First track failed or stalled ("${track.title}"): ${reason}. Auto-skip suppressed.`);
      setPlaybackError(isStalled ? 'Song is taking too long. Tap Retry.' : `Failed to play "${track.title}" (${reason}). Tap Retry.`);
      return;
    }

    consecutiveFailuresRef.current += 1;
    console.warn(`[PLAYBACK] Failure count: ${consecutiveFailuresRef.current} for track: "${track.title}" (${reason})`);

    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);

    // If reached 3 consecutive errors, do NOT auto-skip further; display retry toast with exact failure reason
    if (consecutiveFailuresRef.current >= 3) {
      setPlaybackError(`Playback stopped after 3 errors: ${reason}. Tap Retry.`);
      return;
    }

    if (isStalled) {
      setPlaybackError('Song is taking too long. Skipping to next track...');
    } else {
      setPlaybackError(`Unable to play "${track.title}" (${reason}). Skipping to next track...`);
    }

    errorTimeoutRef.current = setTimeout(() => {
      setPlaybackError(null);
    }, 4500);

    skipTimeoutRef.current = setTimeout(() => {
      nextTrackRef.current();
    }, 1200);
  };

  const retryPlayback = () => {
    consecutiveFailuresRef.current = 0;
    setPlaybackError(null);
    if (currentTrackRef.current) {
      playTrack(currentTrackRef.current, queueRef.current);
    }
  };

  // Resume Web Audio AudioContext on user interaction & visibility change
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

  // Initialize primary and secondary audio elements and attach event listeners to BOTH elements
  // This permanently eliminates the crossfade listener disconnection bug (Root cause #7)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    audioEqualizer.attachElement(audio);

    const secAudio = new Audio();
    const isCrossfadeInitial = typeof window !== 'undefined' && localStorage.getItem('musify_crossfade_enabled') === 'true';
    secAudio.preload = isCrossfadeInitial ? 'auto' : 'metadata';
    secAudio.crossOrigin = 'anonymous';
    secondaryAudioRef.current = secAudio;

    const onTimeUpdate = (e: Event) => {
      const activeEl = e.target as HTMLAudioElement;
      if (activeEl !== audioRef.current) return;

      setCurrentTime(activeEl.currentTime);
      if (activeEl.currentTime > 0 && movementCheckTimerRef.current) {
        clearTimeout(movementCheckTimerRef.current);
        movementCheckTimerRef.current = null;
      }

      // Skip Silence Detection
      const isSkipSilence = typeof window !== 'undefined' && localStorage.getItem('musify_skip_silence') === 'true';
      if (isSkipSilence && activeEl.duration && !isCrossfadingRef.current) {
        const timeLeft = activeEl.duration - activeEl.currentTime;
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
        if (activeEl.currentTime < 2) {
          const rms = audioEqualizer.getInstantRms();
          if (rms >= 0 && rms < 0.002) {
            activeEl.currentTime = Math.min(2.5, activeEl.currentTime + 0.4);
          }
        }
      }

      // 50% Track Playback: Preload and ranged-fetch next track's first 256 KB
      if (!hasPrefetchedNextHalfwayRef.current && activeEl.duration && activeEl.currentTime >= activeEl.duration * 0.5) {
        hasPrefetchedNextHalfwayRef.current = true;
        const nextIdx = queueIndexRef.current + 1;
        const currentQ = queueRef.current;
        const nextItem = currentQ[nextIdx] || (repeatModeRef.current === 'all' ? currentQ[0] : null);
        if (nextItem) {
          const q = getEffectiveAudioQuality();
          const nextUrl = api.getStreamUrl(nextItem.id, q);
          // Ranged prefetch of first 256 KB
          fetch(nextUrl, { method: 'GET', headers: { Range: 'bytes=0-262143' } }).catch(() => {});
          // Preload into secondary audio element for seamless gapless transition
          if (secondaryAudioRef.current) {
            const isCrossfade = typeof window !== 'undefined' && localStorage.getItem('musify_crossfade_enabled') === 'true';
            secondaryAudioRef.current.preload = isCrossfade ? 'auto' : 'metadata';
            secondaryAudioRef.current.src = nextUrl;
            secondaryAudioRef.current.load();
          }
        }
      }

      // Background Autoplay Queue Expansion: when 3 or fewer tracks remaining, fetch more radio tracks
      const remainingTracks = queueRef.current.length - queueIndexRef.current;
      const currentTrackId = currentTrackRef.current?.id;
      if (
        remainingTracks <= 3 &&
        autoplaySimilarRef.current &&
        !isFetchingRadioRef.current &&
        currentTrackId &&
        !radioFetchedTrackIdsRef.current.has(currentTrackId)
      ) {
        radioFetchedTrackIdsRef.current.add(currentTrackId);
        isFetchingRadioRef.current = true;
        api.getRadio(currentTrackId)
          .then(async (related) => {
            isFetchingRadioRef.current = false;
            const existingIds = new Set([
              ...queueRef.current.map((t) => t.id),
              ...playedHistoryIdsRef.current
            ]);
            let fresh = (related || []).filter((t) => !existingIds.has(t.id));

            // Fallback: if getRadio returned no fresh tracks, fall back to related search
            if (fresh.length === 0 && currentTrackRef.current) {
              try {
                const artist = currentTrackRef.current.artists?.[0]?.name;
                const query = artist && artist !== 'Unknown Artist'
                  ? `${artist} songs`
                  : `${currentTrackRef.current.title} songs`;
                const searchRes = await api.search(query, 'songs');
                const searchSongs = searchRes.songs || [];
                fresh = searchSongs.filter((t) => !existingIds.has(t.id));
              } catch (searchErr) {
                console.warn('[PlayerContext] Fallback related search failed:', searchErr);
              }
            }

            if (fresh.length > 0) {
              setQueue((prev) => [...prev, ...fresh]);
              originalQueueRef.current = [...originalQueueRef.current, ...fresh];
            }
          })
          .catch(() => {
            isFetchingRadioRef.current = false;
          });
      }

      // Crossfade Transition
      const isCrossfade = typeof window !== 'undefined' && localStorage.getItem('musify_crossfade_enabled') === 'true';
      const crossfadeSecs = typeof window !== 'undefined' ? Number(localStorage.getItem('musify_crossfade_secs')) || 4 : 4;
      if (isCrossfade && crossfadeSecs > 0 && activeEl.duration && activeEl.duration > crossfadeSecs * 2) {
        const timeLeft = activeEl.duration - activeEl.currentTime;
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
                  // Swap primary and secondary audio elements.
                  // Since event listeners are bound to BOTH elements, listeners continue to work seamlessly!
                  const temp = audioRef.current;
                  audioRef.current = sec;
                  secondaryAudioRef.current = temp;
                  isCrossfadingRef.current = false;

                  setCurrentTrack(nextItem);
                  setQueueIndex(nextIdx < currentQ.length ? nextIdx : 0);
                  extractColorsRef.current(nextItem.thumbnail);
                  addToHistoryRef.current(nextItem);
                  hasPrefetchedNextHalfwayRef.current = false;
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
      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && activeEl.duration) {
        try {
          navigator.mediaSession.setPositionState({
            duration: activeEl.duration,
            playbackRate: activeEl.playbackRate,
            position: activeEl.currentTime
          });
        } catch {}
      }
    };

    const onLoadedMetadata = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      if (target === audioRef.current) {
        setDuration(target.duration || 0);
        setIsLoading(false);
      }
    };

    const onWaiting = (e: Event) => {
      if (e.target === audioRef.current) {
        setIsLoading(true);
      }
    };

    const onPlaying = (e: Event) => {
      if (e.target === audioRef.current) {
        if (stalledTimerRef.current) {
          clearTimeout(stalledTimerRef.current);
          stalledTimerRef.current = null;
        }
        if (movementCheckTimerRef.current) {
          clearTimeout(movementCheckTimerRef.current);
          movementCheckTimerRef.current = null;
        }
        hasPlayedSuccessfullyInSessionRef.current = true;
        setIsPlaying(true);
        setIsLoading(false);
        setPlaybackError(null);
        consecutiveFailuresRef.current = 0;
        if (playStartTimeRef.current > 0) {
          const latency = Math.round(performance.now() - playStartTimeRef.current);
          console.log(`[PERF] Audio playing latency: ${latency}ms for track: "${currentTrackRef.current?.title || 'Unknown'}"`);
          playStartTimeRef.current = 0;
        }
      }
    };

    const onPause = (e: Event) => {
      if (e.target === audioRef.current) {
        setIsPlaying(false);
      }
    };

    const onEnded = (e: Event) => {
      if (e.target === audioRef.current) {
        handleTrackEndRef.current();
      }
    };

    const onError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      if (target === audioRef.current) {
        if (stalledTimerRef.current) {
          clearTimeout(stalledTimerRef.current);
          stalledTimerRef.current = null;
        }
        if (movementCheckTimerRef.current) {
          clearTimeout(movementCheckTimerRef.current);
          movementCheckTimerRef.current = null;
        }

        const err = target.error;
        const mappedReason = mapAudioErrorCode(err?.code);
        console.error('[AUDIO ELEMENT ERROR]', {
          code: err?.code,
          message: err?.message,
          mappedReason,
          streamUrl: target.src,
          readyState: target.readyState,
          networkState: target.networkState
        });

        if (currentTrackRef.current) {
          triggerPlaybackErrorRef.current(currentTrackRef.current, mappedReason);
        } else {
          setIsLoading(false);
          setIsPlaying(false);
          setPlaybackError(`Playback error: ${mappedReason}`);
        }
      }
    };

    // Attach identical event listeners to both primary and secondary audio elements
    const bindEvents = (el: HTMLAudioElement) => {
      el.addEventListener('timeupdate', onTimeUpdate);
      el.addEventListener('loadedmetadata', onLoadedMetadata);
      el.addEventListener('waiting', onWaiting);
      el.addEventListener('playing', onPlaying);
      el.addEventListener('pause', onPause);
      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);
    };

    const unbindEvents = (el: HTMLAudioElement) => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };

    bindEvents(audio);
    bindEvents(secAudio);

    return () => {
      audio.pause();
      secAudio.pause();
      unbindEvents(audio);
      unbindEvents(secAudio);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      if (fadeInTimerRef.current) clearInterval(fadeInTimerRef.current);
      if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
      if (movementCheckTimerRef.current) clearTimeout(movementCheckTimerRef.current);
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

    playStartTimeRef.current = performance.now();
    hasPrefetchedNextHalfwayRef.current = false;

    // Reset stalled and movement check timers
    if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
    if (movementCheckTimerRef.current) clearTimeout(movementCheckTimerRef.current);

    // 12-second stalled timer in playTrack (Requirement 4)
    stalledTimerRef.current = setTimeout(() => {
      const el = audioRef.current;
      if (el && !isPlayingRef.current) {
        setIsLoading(false);
        setIsPlaying(false);
        console.error('[PLAYBACK STALLED: 12S TIMEOUT]', {
          streamUrl: el.src,
          readyState: el.readyState,
          networkState: el.networkState,
          errorCode: el.error?.code,
          errorMessage: el.error?.message
        });
        handlePlaybackFailure(track, 'Song is taking too long. Tap Retry.', true);
      }
    }, 12000);

    // 1. Show metadata in the immediate tick with zero delay
    setCurrentTrack(track);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setPlaybackError(null);

    // 2. Fix Queue Handling (Root cause #6):
    // If newQueue is passed, adopt it. If no queue is passed, replace queue with [track]
    // and fetch radio recommendations in background to append, keeping current index correct.
    let targetQueue: Track[];
    if (newQueue && newQueue.length > 0) {
      radioFetchedTrackIdsRef.current.clear();
      targetQueue = newQueue;
      setQueue(newQueue);
      originalQueueRef.current = newQueue;
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      targetQueue = [track];
      setQueue([track]);
      originalQueueRef.current = [track];
      setQueueIndex(0);

      // Auto-fetch related radio tracks in the background, deduping against last 50 played tracks
      radioFetchedTrackIdsRef.current.add(track.id);
      api.getRadio(track.id).then((related) => {
        if (related.length > 0) {
          const existingIds = new Set([track.id, ...playedHistoryIdsRef.current]);
          const fresh = related.filter((t) => !existingIds.has(t.id));
          if (fresh.length > 0) {
            setQueue((prev) => [...prev, ...fresh]);
            originalQueueRef.current = [...originalQueueRef.current, ...fresh];
          }
        }
      }).catch(() => {});
    }

    // 3. Start audio stream resolution and playback in the immediate tick
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

    if (audioEqualizer.getEnabled() || audioEqualizer.getNormalization()) {
      audioEqualizer.init(audioRef.current);
      audioEqualizer.ensureContextRunning();
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setPlaybackError(null);
      consecutiveFailuresRef.current = 0;

      // If play() resolves but currentTime hasn't moved after 3s, treat it as stalled too
      if (movementCheckTimerRef.current) clearTimeout(movementCheckTimerRef.current);
      movementCheckTimerRef.current = setTimeout(() => {
        const el = audioRef.current;
        if (el && !el.paused && el.currentTime === 0) {
          setIsLoading(false);
          setIsPlaying(false);
          console.error('[PLAYBACK STALLED: NO MOVEMENT AFTER 3S]', {
            streamUrl: el.src,
            readyState: el.readyState,
            networkState: el.networkState,
            errorCode: el.error?.code,
            errorMessage: el.error?.message
          });
          handlePlaybackFailure(track, 'Song is taking too long. Tap Retry.', true);
        }
      }, 3000);

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
      if (err?.name === 'NotAllowedError') {
        // Browser autoplay policy: leave track paused with clear button to tap
        setIsPlaying(false);
        setIsLoading(false);
        setPlaybackError('Tap Play to start listening');
      } else if (err?.name !== 'AbortError') {
        console.warn('Playback error:', err);
        handlePlaybackFailure(track, err?.message || 'Playback failed');
      } else {
        setIsPlaying(false);
      }
    }

    // 4. Run non-blocking background tasks after audio starts
    setTimeout(() => {
      extractColorsFromImage(track.thumbnail);
      addToHistory(track);

      // Track last 50 played track IDs for deduplication
      playedHistoryIdsRef.current = [
        track.id,
        ...playedHistoryIdsRef.current.filter((id) => id !== track.id)
      ].slice(0, 50);

      // Prefetch the next 2 queue items immediately
      const curIdx = targetQueue.findIndex((t) => t.id === track.id);
      const next1 = targetQueue[curIdx + 1];
      const next2 = targetQueue[curIdx + 2];
      if (next1) api.prefetchStream(next1.id);
      if (next2) api.prefetchStream(next2.id);
    }, 0);
  };

  const togglePlay = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioEqualizer.ensureContextRunning();
      playStartTimeRef.current = performance.now();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPlaybackError(null);
      }).catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('Playback error on togglePlay:', err);
          handlePlaybackFailure(currentTrack);
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
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else if (autoplaySimilar && currentTrack) {
        // Queue finished: fetch more radio items and seamlessly keep playing
        api.getRadio(currentTrack.id).then((related) => {
          if (related.length > 0) {
            const existingIds = new Set([
              ...queue.map((t) => t.id),
              ...playedHistoryIdsRef.current
            ]);
            const fresh = related.filter((t) => !existingIds.has(t.id));
            const toAppend = fresh.length > 0 ? fresh : related;
            const updatedQueue = [...queue, ...toAppend];
            setQueue(updatedQueue);
            originalQueueRef.current = [...originalQueueRef.current, ...toAppend];
            setQueueIndex(queue.length);
            playTrack(toAppend[0], updatedQueue);
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
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
    if (!audioRef.current) return;
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
      const current = currentTrack;
      const rest = queue.filter((t) => t.id !== current?.id);
      const shuffled = fisherYatesShuffle(rest);
      const newQueue = current ? [current, ...shuffled] : shuffled;
      setQueue(newQueue);
      setQueueIndex(0);
      setIsShuffled(true);
    } else {
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
    // Warm intent
    api.prefetchStream(track.id);
  };

  const playNextInQueue = (track: Track) => {
    setQueue((prev) => {
      const nextIdx = queueIndex + 1;
      const newQ = [...prev];
      newQ.splice(nextIdx, 0, track);
      return newQ;
    });
    // Warm intent
    api.prefetchStream(track.id);
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

  // Synchronize dynamic refs
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    queueRef.current = queue;
    queueIndexRef.current = queueIndex;
    repeatModeRef.current = repeatMode;
    autoplaySimilarRef.current = autoplaySimilar;
    triggerPlaybackErrorRef.current = handlePlaybackFailure;
    handleTrackEndRef.current = handleTrackEnd;
    nextTrackRef.current = nextTrack;
    prevTrackRef.current = prevTrack;
    volumeRef.current = volume;
  });

  // Persist playback state to localStorage safely
  useEffect(() => {
    if (!currentTrack) return;
    try {
      localStorage.setItem(
        'musify_persisted_player',
        JSON.stringify({
          currentTrack,
          currentTime,
          queue,
          queueIndex
        })
      );
    } catch {}
  }, [currentTrack, currentTime, queue, queueIndex]);

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
        setAutoplaySimilar,
        retryPlayback,
        prefetchTrack
      }}
    >
      {playbackError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#141416]/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all border border-[#E5303D]/40 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#E5303D] animate-ping shrink-0" />
          <span className="max-w-[240px] sm:max-w-md truncate">{playbackError}</span>
          <button
            onClick={retryPlayback}
            className="px-2.5 py-1 rounded-lg bg-[#E5303D] hover:bg-[#d02834] text-white font-bold transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
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
