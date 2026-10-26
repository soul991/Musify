import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Search,
  MoreVertical,
  History,
  Radio,
  Users,
  Sliders,
  Settings as SettingsIcon,
  ListPlus,
  Disc,
  Bookmark
} from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { Track } from '../types';
import { HeartBurstIcon } from '../components/player/HeartBurstIcon';
import { HomeFeedSkeleton } from '../components/common/SkeletonLoader';

export interface HomeProps {
  onSelectAlbum?: (id: string) => void;
  onSelectArtist?: (id: string) => void;
  onSelectPlaylist?: (id: string) => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenStats?: () => void;
  onOpenListenTogether?: () => void;
  onOpenEqualizer?: () => void;
}

interface HeroItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  query: string;
}

const HERO_SLIDES: HeroItem[] = [
  {
    id: 'khalasi-hero',
    title: 'KHALASI',
    subtitle: 'Achint x Aditya Gadhvi • Coke Studio Bharat',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    badge: 'COKE STUDIO BHARAT',
    query: 'Khalasi Coke Studio'
  },
  {
    id: 'starboy-hero',
    title: 'Starboy',
    subtitle: 'The Weeknd ft. Daft Punk • 2.8B Streams',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    badge: 'GLOBAL TOP 50',
    query: 'Starboy The Weeknd'
  },
  {
    id: 'fakira-hero',
    title: 'Fakira',
    subtitle: 'Sanam Puri, Vishal-Shekhar, Neeti Mohan',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    badge: 'SPOTLIGHT HIT',
    query: 'Fakira Sanam Puri'
  },
  {
    id: 'sahiba-hero',
    title: 'Sahiba',
    subtitle: 'Jasleen Royal, Stebin Ben, Vijay Deverakonda',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    badge: 'TRENDING ROMANCE',
    query: 'Sahiba Jasleen Royal'
  }
];

// InnerTube / Echo Music home chips matching ChipsRow.kt
const MOOD_CHIPS = [
  { label: 'Feel good', query: 'feel good upbeat hits' },
  { label: 'Romance', query: 'romantic hindi english songs' },
  { label: 'Relax', query: 'chill acoustic lo-fi relax' },
  { label: 'Party', query: 'dance party edm chartbusters' },
  { label: 'Energy', query: 'high energy workout motivational' },
  { label: 'Focus', query: 'deep focus study ambient instrumental' },
  { label: 'Workout', query: 'gym workout cardio beats' },
  { label: 'Nostalgia', query: '2000s 90s nostalgia super hits' },
  { label: 'Commute', query: 'road trip driving music chill' },
  { label: 'Late Night', query: 'late night acoustic soulful melodies' }
];

interface CommunityPlaylistData {
  id: string;
  title: string;
  author: string;
  thumbnails: string[];
  songs: Track[];
}

export const Home: React.FC<HomeProps> = ({
  onOpenSearch,
  onOpenHistory,
  onOpenStats,
  onOpenListenTogether,
  onOpenEqualizer,
  onOpenSettings
}) => {
  const { playTrack, currentTrack, isPlaying, addToQueue, playNextInQueue } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();
  const { colors } = useTheme();

  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [forgottenFavorites, setForgottenFavorites] = useState<Track[]>([]);
  const [communityPlaylists, setCommunityPlaylists] = useState<CommunityPlaylistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Dynamic time-of-day greeting (computed once on mount)
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Late night';
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuTrackId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Auto-advance hero carousel (5000ms matching delay(5000) in HomeScreen.kt HeroCarousel)
  useEffect(() => {
    if (isCarouselHovered) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarouselHovered]);

  // Load home sections matching Echo Music's HomeViewModel
  const loadDefaultFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [quickData, forgottenData, community1Data, community2Data] = await Promise.all([
        api.search('India biggest hits chartbusters 2026', 'songs').catch(() => ({ songs: [] })),
        api.search('hindi romantic unplugged super hits', 'songs').catch(() => ({ songs: [] })),
        api.search('Bollywood party remix chartbusters', 'songs').catch(() => ({ songs: [] })),
        api.search('Acoustic indie chill vibes hindi', 'songs').catch(() => ({ songs: [] }))
      ]);

      setQuickPicks(quickData.songs || []);
      setForgottenFavorites(forgottenData.songs || []);

      const p1Songs = community1Data.songs?.slice(0, 4) || [];
      const p2Songs = community2Data.songs?.slice(0, 4) || [];

      setCommunityPlaylists([
        {
          id: 'comm-1',
          title: 'Bollywood Party Anthem 2026',
          author: 'Echo Community Hub',
          thumbnails: p1Songs.map((s) => s.thumbnail).filter(Boolean),
          songs: p1Songs
        },
        {
          id: 'comm-2',
          title: 'Midnight Acoustic & Lofi Indie',
          author: 'Curated by Musify',
          thumbnails: p2Songs.map((s) => s.thumbnail).filter(Boolean),
          songs: p2Songs
        }
      ]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDefaultFeed();
  }, [loadDefaultFeed]);

  // Handle mood chip click: Toggle behavior matching toggleChip() in HomeViewModel.kt
  const handleMoodSelect = async (mood: (typeof MOOD_CHIPS)[0]) => {
    if (activeMood === mood.label) {
      setActiveMood(null);
      await loadDefaultFeed();
      return;
    }

    setActiveMood(mood.label);
    setLoading(true);
    try {
      const data = await api.search(mood.query, 'songs');
      setQuickPicks(data.songs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleHeroClick = async (slide: HeroItem) => {
    try {
      const res = await api.search(slide.query, 'songs');
      if (res.songs && res.songs.length > 0) {
        playTrack(res.songs[0], res.songs);
      }
    } catch {
      // ignore
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src.includes('maxresdefault.jpg')) {
      target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
    } else if (!target.src.endsWith('/icons/musify-icon.svg')) {
      target.src = '/icons/musify-icon.svg';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-36 text-white min-h-0 select-none">
      {/* =========================================================================
          1. FIGMA TOP BAR: Search Pill + Profile Avatar
          ========================================================================= */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onOpenSearch}
          className="flex-1 h-11 rounded-full bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.08] px-4.5 flex items-center gap-3 text-sm text-[#A7A7A7] transition-all cursor-pointer group text-left"
          title="Search songs, albums, artists"
          aria-label="Search songs, albums, artists"
        >
          <Search size={18} className="text-[#A7A7A7] group-hover:text-white transition-colors" />
          <span className="font-normal truncate">Search songs, albums, artists</span>
        </button>

        {/* Action icons shortcut (History, Listen Together, Settings) */}
        <div className="flex items-center gap-2">
          {onOpenListenTogether && (
            <button
              onClick={onOpenListenTogether}
              title="Listen Together Room"
              aria-label="Listen Together Room"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Users size={17} />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Settings"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <SettingsIcon size={17} />
            </button>
          )}

          {/* User Profile Avatar Pill matching Figma */}
          <div
            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E5303D] to-[#B8222E] flex items-center justify-center font-bold text-sm text-white shadow-md shadow-[#E5303D]/25 shrink-0"
            title="Musify Account"
          >
            M
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FIGMA GREETING
          ========================================================================= */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {greeting}
        </h1>
        <p className="text-sm text-[#A7A7A7] font-normal mt-1">
          Pick up where you left off
        </p>
      </div>

      {/* =========================================================================
          SKELETON SHIMMER LOADER (When initially loading)
          ========================================================================= */}
      {loading && quickPicks.length === 0 ? (
        <HomeFeedSkeleton />
      ) : (
        <>
          {/* =========================================================================
              3. MOOD FILTER CHIPS ROW (`ChipsRow.kt`)
              ========================================================================= */}
          <section className="mb-6 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 min-w-max px-0.5">
              {MOOD_CHIPS.map((mood) => {
                const isSelected = activeMood === mood.label;
                return (
                  <motion.button
                    key={mood.label}
                    onClick={() => handleMoodSelect(mood)}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                    className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border select-none ${
                      isSelected
                        ? 'text-white border-white/40 shadow-lg'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white border-white/10'
                    }`}
                    style={{
                      backgroundColor: isSelected ? colors.primary : undefined,
                      boxShadow: isSelected ? `0 4px 18px ${colors.primary}70` : undefined
                    }}
                  >
                    {mood.label}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* =========================================================================
              3. HERO CAROUSEL (`HorizontalCenteredHeroCarousel` in HomeScreen.kt)
              ========================================================================= */}
          <section
            className="relative mb-8 rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/15 h-[220px] sm:h-[300px] cursor-pointer group"
        onMouseEnter={() => setIsCarouselHovered(true)}
        onMouseLeave={() => setIsCarouselHovered(false)}
        onClick={() => handleHeroClick(HERO_SLIDES[heroIndex])}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={HERO_SLIDES[heroIndex].id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_SLIDES[heroIndex].image})` }}
          />
        </AnimatePresence>

        {/* 4-stop dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-40% to-transparent pointer-events-none" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end pointer-events-none">
          {HERO_SLIDES[heroIndex].badge && (
            <span
              className="self-start text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border border-white/20 text-white mb-2 shadow-sm"
              style={{ backgroundColor: `${colors.primary}90` }}
            >
              {HERO_SLIDES[heroIndex].badge}
            </span>
          )}
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
            {HERO_SLIDES[heroIndex].title}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 font-medium truncate drop-shadow mt-1 max-w-[85%]">
            {HERO_SLIDES[heroIndex].subtitle}
          </p>
        </div>

        {/* Floating 48px Play Button */}
        <div className="absolute right-5 bottom-5 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-transform duration-200">
          <Play size={20} className="fill-current ml-0.5" />
        </div>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. QUICK PICKS (4-Row Horizontal Grid with Equalizer Animation)
          ========================================================================= */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              START RADIO FROM A SONG
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Quick Picks
            </h2>
          </div>
          {quickPicks.length > 0 && (
            <button
              onClick={() => playTrack(quickPicks[0], quickPicks)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Play size={12} className="fill-current" /> Play all
            </button>
          )}
        </div>

        {/* 4-Row Horizontal Snap Grid */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
            {quickPicks.slice(0, 16).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, quickPicks)}
                  className={`w-[290px] sm:w-[320px] h-[64px] rounded-2xl flex items-center gap-3 px-2.5 cursor-pointer select-none transition-all duration-200 border ${
                    isCurrent
                      ? 'bg-white/[0.14] border-white/30 shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                  }`}
                >
                  {/* Thumbnail + Bouncing Equalizer Bars */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    ) : (
                      <Disc size={20} className="text-white/40" />
                    )}

                    {/* Active Equalizer Animation Overlay */}
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center gap-0.5">
                        <span className="w-1 bg-[#E5303D] rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-4" />
                        <span className="w-1 bg-[#E5303D] rounded-full animate-[bounce_0.8s_ease-in-out_0.2s_infinite] h-6" />
                        <span className="w-1 bg-[#E5303D] rounded-full animate-[bounce_0.5s_ease-in-out_0.4s_infinite] h-3" />
                      </div>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p
                      className={`text-sm font-bold truncate leading-tight ${
                        isCurrent ? 'text-[#E5303D]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-white/60 truncate font-medium leading-tight mt-0.5">
                      {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                    </p>
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track);
                    }}
                    aria-label={liked ? 'Unlike' : 'Like'}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <HeartBurstIcon isLiked={liked} size={16} />
                  </button>

                  {/* Context Menu Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id);
                    }}
                    aria-label="More options"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors relative"
                  >
                    <MoreVertical size={16} />

                    {/* Popup Context Menu */}
                    {activeMenuTrackId === track.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-9 w-44 rounded-2xl bg-[#1A1B23]/95 backdrop-blur-2xl border border-white/20 shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs text-white"
                      >
                        <button
                          onClick={async () => {
                            setActiveMenuTrackId(null);
                            try {
                              const related = await api.getRadio(track.id);
                              playTrack(track, related.length > 0 ? [track, ...related] : [track]);
                            } catch {
                              playTrack(track);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium"
                        >
                          <Radio size={14} /> Start radio
                        </button>
                        <button
                          onClick={() => {
                            playNextInQueue(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium"
                        >
                          <Play size={14} /> Play next
                        </button>
                        <button
                          onClick={() => {
                            addToQueue(track);
                            setActiveMenuTrackId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left font-medium"
                        >
                          <ListPlus size={14} /> Add to queue
                        </button>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. COMMUNITY PLAYLIST CARDS (`CommunityPlaylistCard` in HomeScreen.kt)
          ========================================================================= */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              CURATED STATIONS & MIXES
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              From the Community
            </h2>
          </div>
        </div>

        {/* Horizontal Carousel of 320x420dp Cards */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex items-center gap-5 min-w-max pb-2">
            {communityPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="w-[300px] sm:w-[320px] rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-4 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all hover:border-white/30"
              >
                {/* Top: 2x2 Collage Thumbnail & Title */}
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-[84px] h-[84px] rounded-2xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5 shrink-0 bg-white/10 border border-white/10 shadow-sm">
                    {playlist.thumbnails.slice(0, 4).map((thumb, i) => (
                      <img
                        key={i}
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold text-white leading-tight line-clamp-2">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-white/60 font-medium truncate mt-1">
                      {playlist.author}
                    </p>
                  </div>
                </div>

                {/* Middle: 3 Songs Preview */}
                <div className="flex flex-col gap-1.5 my-2">
                  {playlist.songs.slice(0, 3).map((song) => (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song, playlist.songs)}
                      className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors"
                    >
                      <img
                        src={song.thumbnail}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        onError={handleImageError}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate leading-tight">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-white/60 truncate font-medium mt-0.5">
                          {song.artists?.map((a) => a.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom: Play, Radio, Bookmark Actions */}
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => playTrack(playlist.songs[0], playlist.songs)}
                    className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                    title="Play Station"
                    aria-label="Play Station"
                  >
                    <Play size={18} className="fill-current ml-0.5" />
                  </button>

                  <button
                    onClick={async () => {
                      if (playlist.songs[0]) {
                        try {
                          const radio = await api.getRadio(playlist.songs[0].id);
                          playTrack(playlist.songs[0], radio.length > 0 ? [playlist.songs[0], ...radio] : playlist.songs);
                        } catch {
                          playTrack(playlist.songs[0], playlist.songs);
                        }
                      }
                    }}
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                    title="Start Radio"
                    aria-label="Start Radio"
                  >
                    <Radio size={18} />
                  </button>

                  <button
                    onClick={() => {
                      /* bookmark to user playlists */
                    }}
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                    title="Bookmark Playlist"
                    aria-label="Bookmark Playlist"
                  >
                    <Bookmark size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FORGOTTEN FAVORITES (4-Row Horizontal Grid)
          ========================================================================= */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              SONGS YOU USED TO PLAY ON REPEAT
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Forgotten Favorites
            </h2>
          </div>
          {forgottenFavorites.length > 0 && (
            <button
              onClick={() => playTrack(forgottenFavorites[0], forgottenFavorites)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Play size={12} className="fill-current" /> Play all
            </button>
          )}
        </div>

        {/* 4-Row Horizontal Snap Grid */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
            {forgottenFavorites.slice(0, 16).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, forgottenFavorites)}
                  className={`w-[290px] sm:w-[320px] h-[64px] rounded-2xl flex items-center gap-3 px-2.5 cursor-pointer select-none transition-all duration-200 border ${
                    isCurrent
                      ? 'bg-white/[0.14] border-white/30 shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    ) : (
                      <Disc size={20} className="text-white/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <p
                      className={`text-sm font-bold truncate leading-tight ${
                        isCurrent ? 'text-[#E5303D]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-white/60 truncate font-medium leading-tight mt-0.5">
                      {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <HeartBurstIcon isLiked={liked} size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
};
