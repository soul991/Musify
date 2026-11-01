import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Play,
  Search,
  MoreVertical,
  Radio,
  Users,
  Settings as SettingsIcon,
  ListPlus,
  Sparkles,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { Track, HomeFeedSection } from '../types';
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

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  track: Track;
}

// InnerTube / Echo Music home chips with emoji & gradient-backed glass pills
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
  { label: 'Late night', query: 'late night acoustic soulful melodies' }
];

// Fallback curated hits for hero carousel when backend is loading or cold
const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-thc0FnfgW9k',
    title: 'Khalasi',
    subtitle: 'Achint × Aditya Gadhvi • Coke Studio Bharat',
    image: 'https://i.ytimg.com/vi/thc0FnfgW9k/hqdefault.jpg',
    badge: 'Featured',
    track: {
      id: 'thc0FnfgW9k',
      title: 'Khalasi',
      artists: [{ name: 'Achint × Aditya Gadhvi' }],
      duration: 250,
      thumbnail: 'https://i.ytimg.com/vi/thc0FnfgW9k/hqdefault.jpg',
      type: 'song'
    }
  },
  {
    id: 'hero-34Na4j8AVgA',
    title: 'Starboy',
    subtitle: 'The Weeknd ft. Daft Punk • Global Top 50',
    image: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
    badge: 'Featured',
    track: {
      id: '34Na4j8AVgA',
      title: 'Starboy',
      artists: [{ name: 'The Weeknd' }],
      duration: 230,
      thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
      type: 'song'
    }
  },
  {
    id: 'hero-kJQP7kiw5Fk',
    title: 'Despacito',
    subtitle: 'Luis Fonsi ft. Daddy Yankee • Global Hits',
    image: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    badge: 'GLOBAL TOP 50',
    track: {
      id: 'kJQP7kiw5Fk',
      title: 'Despacito',
      artists: [{ name: 'Luis Fonsi ft. Daddy Yankee' }],
      duration: 228,
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      type: 'song'
    }
  }
];

// Helper to convert backend HomeFeedSection item into a standard Track
function itemToTrack(item: { id: string; title: string; subtitle?: string; thumbnail: string; type?: string }): Track {
  return {
    id: item.id,
    title: item.title || 'Unknown Title',
    artists: [{ name: item.subtitle || 'Unknown Artist' }],
    duration: 0,
    thumbnail: item.thumbnail,
    type: 'song'
  };
}

// Section scroll choreography animation variants
const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const headerVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 28 }
  }
};

export const Home: React.FC<HomeProps> = ({
  onOpenSearch,
  onOpenListenTogether,
  onOpenSettings,
  onSelectArtist,
  onSelectAlbum,
  onSelectPlaylist
}) => {
  const { playTrack, currentTrack, isPlaying, addToQueue, playNextInQueue } = usePlayer();
  const { isLiked, toggleLike, history, likedSongs, playStats } = useLibrary();
  const { colors } = useTheme();

  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Data states
  const [backendSections, setBackendSections] = useState<HomeFeedSection[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [becauseListenedTracks, setBecauseListenedTracks] = useState<Track[]>([]);
  const [seedTrack, setSeedTrack] = useState<Track | null>(null);
  const [moodTracks, setMoodTracks] = useState<Track[] | null>(null);
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

  // 1. Load real /api/home feed instantly via stale-while-revalidate IndexedDB cache
  useEffect(() => {
    let isMounted = true;
    api.getHome()
      .then((sections) => {
        if (isMounted && Array.isArray(sections)) {
          setBackendSections(sections);
          setFeedLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setFeedLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Personal Section: "Because you listened to X" (Radio from last played or liked track)
  useEffect(() => {
    const candidate = history[0] || likedSongs[0];
    if (!candidate) {
      setBecauseListenedTracks([]);
      setSeedTrack(null);
      return;
    }
    setSeedTrack(candidate);
    let isMounted = true;
    api.getRadio(candidate.id)
      .then((tracks) => {
        if (isMounted && Array.isArray(tracks) && tracks.length > 0) {
          setBecauseListenedTracks(tracks);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [history, likedSongs]);

  // 3. Personal Section: "Forgotten favourites" (Liked songs not played in 30+ days)
  const forgottenFavorites = useMemo(() => {
    if (likedSongs.length === 0) return [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return likedSongs.filter((track) => {
      const stat = playStats[track.id];
      if (!stat) return true; // Never played yet since recorded
      return stat.lastPlayed < thirtyDaysAgo;
    }).slice(0, 16);
  }, [likedSongs, playStats]);

  // 4. Personal Section: "Jump back in" (Recent listening history)
  const jumpBackIn = useMemo(() => {
    // Unique tracks from recent history
    const seen = new Set<string>();
    const unique: Track[] = [];
    for (const t of history) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
      if (unique.length >= 16) break;
    }
    return unique;
  }, [history]);

  // 5. Personal Section: "Your Top Artists"
  const topArtists = useMemo(() => {
    const counts = new Map<string, { name: string; thumbnail: string; count: number }>();
    for (const t of history) {
      const name = t.artists?.[0]?.name;
      if (!name || name === 'Unknown Artist') continue;
      const existing = counts.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(name, { name, thumbnail: t.thumbnail, count: 1 });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [history]);

  // 6. Dynamic Hero Carousel: built from recent history or first real home feed section
  const heroSlides = useMemo<HeroSlide[]>(() => {
    // Priority 1: Top recent history / favorites
    const validHistory = jumpBackIn.filter(
      (t) => t.id && t.id.length === 11 && !t.id.startsWith('VL') && !t.id.startsWith('RD') && !t.id.startsWith('MPREb')
    );
    if (validHistory.length >= 2) {
      return validHistory.slice(0, 4).map((t, idx) => ({
        id: `hero-history-${t.id}`,
        title: t.title,
        subtitle: t.artists?.map((a) => a.name).join(', ') || 'Unknown Artist',
        image: t.thumbnail,
        badge: idx === 0 ? 'JUMP BACK IN' : 'RECENT FAVORITE',
        track: t
      }));
    }

    // Priority 2: Sections of backend home feed with playable song items
    for (const sec of backendSections) {
      if (!sec.items || sec.items.length < 2) continue;
      const playable = sec.items.filter(
        (item) => (!item.type || item.type === 'song') && item.id.length === 11 && !item.id.startsWith('VL') && !item.id.startsWith('RD')
      );
      if (playable.length >= 2) {
        return playable.slice(0, 4).map((item, idx) => ({
          id: `hero-feed-${item.id}-${idx}`,
          title: item.title,
          subtitle: item.subtitle || 'Trending on Musify',
          image: item.thumbnail || '/icons/musify-icon.svg',
          badge: 'Featured',
          track: itemToTrack(item)
        }));
      }
    }

    // Fallback: curated slides
    return FALLBACK_HERO_SLIDES;
  }, [jumpBackIn, backendSections]);

  // Auto-advance hero carousel (5000ms)
  useEffect(() => {
    if (isCarouselHovered || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarouselHovered, heroSlides.length]);

  // Handle hero carousel click: Direct instant playback with ZERO search!
  const handleHeroClick = (slide: HeroSlide) => {
    const allHeroTracks = heroSlides.map((s) => s.track);
    playTrack(slide.track, allHeroTracks);
  };

  // Handle mood chip select
  const handleMoodSelect = async (mood: (typeof MOOD_CHIPS)[0]) => {
    if (activeMood === mood.label) {
      setActiveMood(null);
      setMoodTracks(null);
      return;
    }

    setActiveMood(mood.label);
    try {
      const data = await api.search(mood.query, 'songs');
      setMoodTracks(data.songs || []);
    } catch {
      setMoodTracks([]);
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

  const activeHero = heroSlides[heroIndex] || heroSlides[0];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-36 text-white min-h-0 select-none">
      {/* 1. TOP BAR: Search Pill + Quick Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onOpenSearch}
          className="flex-1 h-11 rounded-full bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.08] px-4.5 flex items-center gap-3 text-sm text-[#A7A7A7] transition-colors cursor-pointer group text-left"
          title="Search songs, albums, artists"
          aria-label="Search songs, albums, artists"
        >
          <Search size={18} className="text-[#A7A7A7] group-hover:text-white transition-colors" />
          <span className="font-normal truncate">Search songs, albums, artists</span>
        </button>

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

          <div
            className="w-11 h-11 rounded-full bg-[var(--accent)] flex items-center justify-center font-medium text-sm text-white shrink-0"
            title="Musify Account"
          >
            M
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC GREETING */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {greeting}
        </h1>
        <p className="text-sm text-[#A7A7A7] font-normal mt-1">
          {history.length > 0 ? 'Pick up where you left off' : 'Explore music for every mood'}
        </p>
      </div>

      {/* 3. MOOD FILTER CHIPS ROW */}
      <section className="mb-6 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2.5 min-w-max px-0.5">
          {MOOD_CHIPS.map((mood) => {
            const isSelected = activeMood === mood.label;
            return (
              <motion.button
                key={mood.label}
                onClick={() => handleMoodSelect(mood)}
                whileHover={{}}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 800, damping: 28 }}
                className={`rounded-lg px-4 py-2 flex items-center gap-2 text-xs font-medium shrink-0 cursor-pointer select-none transition-colors border border-[var(--hairline)] ${
                  isSelected
                    ? 'text-white border-white/40 shadow-lg'
                    : 'hover:bg-white/[0.08] hover:border-white/20 text-white/80 hover:text-white border-white/10'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-raised)',
                  boxShadow: undefined
                }}
              >
                <span>{mood.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 4. DYNAMIC "NOW TRENDING" MARQUEE HERO CARD */}
      {activeHero && (
        <section
          className="relative mb-8"
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => handleHeroClick(activeHero)}
              className="relative h-[280px] md:h-[330px] rounded-[24px] overflow-hidden group cursor-pointer border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.65)] select-none"
            >
              {/* Background Art with Ken Burns subtle zoom */}
              <img
                src={activeHero.image}
                alt={activeHero.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={handleImageError}
              />

              {/* Blurred Artwork Bleed Layer */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-[60px] opacity-40 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${activeHero.image})` }}
              />

              {/* Multi-Stop Atmospheric Gradient Overlays for High Contrast Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />

              {/* Hero Content */}
              <div className="relative z-10 h-full p-6 md:p-8 flex items-end justify-between gap-6">
                <div className="max-w-[78%] sm:max-w-[65%] flex flex-col justify-end">
                  <motion.p
                    className="text-xs font-medium text-[var(--text-3)] mb-2 flex items-center gap-1.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Sparkles size={13} className="text-[var(--accent-ink)]" />
                    <span>{activeHero.badge || 'FEATURED NOW TRENDING'}</span>
                  </motion.p>
                  <motion.h2
                    className="text-[26px] sm:text-[34px] md:text-[38px] font-black tracking-tight leading-tight text-white line-clamp-2 font-display"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 420, damping: 28 }}
                  >
                    {activeHero.title}
                  </motion.h2>
                  <motion.p
                    className="text-sm sm:text-base text-white/70 mt-1 font-medium truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    {activeHero.subtitle}
                  </motion.p>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-3 mt-5">
                    <motion.button
                      whileHover={{}}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHeroClick(activeHero);
                      }}
                      className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_10px_25px_rgba(255,255,255,0.25)] transition-colors cursor-pointer"
                    >
                      <Play size={16} className="fill-current ml-0.5" />
                      <span>Play Now</span>
                    </motion.button>
                    {activeHero.track && (
                      <motion.button
                        whileHover={{}}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeHero.track) addToQueue(activeHero.track);
                        }}
                        className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer"
                        title="Add to queue"
                      >
                        <ListPlus size={15} />
                        <span className="hidden sm:inline">Add to Queue</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Right Album Art Display with subtle floating aura */}
                <div className="hidden sm:flex relative shrink-0 items-center justify-center pointer-events-none">
                  <div
                    className="absolute w-40 h-40 rounded-full blur-[35px] opacity-50"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-[#16161a]"
                  >
                    <img
                      src={activeHero.image || '/icons/musify-icon.svg'}
                      alt={activeHero.title}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Bottom Pagination Dots */}
              {heroSlides.length > 1 && (
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-20">
                  {heroSlides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        idx === heroIndex ? 'w-7 bg-white shadow-sm' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* 5. MOOD RESULTS (When a mood chip is active) */}
      {activeMood && moodTracks && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={sectionVariants}
          className="mb-10"
        >
          <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[var(--text-3)]">
                MOOD: {activeMood.toUpperCase()}
              </span>
              <h2 className="text-[20px] font-medium text-[var(--text-1)] leading-tight">
                Soundtrack for {activeMood}
              </h2>
            </div>
            {moodTracks.length > 0 && (
              <button
                onClick={() => playTrack(moodTracks[0], moodTracks)}
                className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
              >
                <Play size={12} className="fill-current" /> Play all
              </button>
            )}
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
              {moodTracks.slice(0, 16).map((track) => renderTrackRow(track, moodTracks))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 6. PERSONAL SECTION: JUMP BACK IN (Recent Listening History) */}
      {jumpBackIn.length > 0 && !activeMood && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={sectionVariants}
          className="mb-10"
        >
          <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[var(--text-3)] flex items-center gap-1.5"><Clock size={12} className="text-[var(--accent-ink)]" /> Recent history
              </span>
              <h2 className="text-[20px] font-medium text-[var(--text-1)] leading-tight">
                Jump Back In
              </h2>
            </div>
            <button
              onClick={() => playTrack(jumpBackIn[0], jumpBackIn)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
            >
              <Play size={12} className="fill-current" /> Play all
            </button>
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
              {jumpBackIn.slice(0, 16).map((track) => renderTrackRow(track, jumpBackIn))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 7. PERSONAL SECTION: BECAUSE YOU LISTENED TO X */}
      {seedTrack && becauseListenedTracks.length > 0 && !activeMood && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={sectionVariants}
          className="mb-10"
        >
          <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[var(--text-3)] flex items-center gap-1.5"><Sparkles size={12} className="text-[var(--accent-ink)]" /> Similar to your taste
              </span>
              <h2 className="text-[20px] font-medium text-[var(--text-1)] leading-tight">
                Because you listened to {seedTrack.title}
              </h2>
            </div>
            <button
              onClick={() => playTrack(becauseListenedTracks[0], becauseListenedTracks)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
            >
              <Play size={12} className="fill-current" /> Play radio
            </button>
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex items-center gap-4 min-w-max pb-2">
              {becauseListenedTracks.slice(0, 12).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <motion.div
                    key={track.id}
                    variants={cardVariants}
                    whileHover={{}}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => playTrack(track, becauseListenedTracks)}
                    className="w-[150px] sm:w-[170px] flex flex-col group cursor-pointer select-none"
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/10 mb-2.5 border border-white/10 shadow-lg group-hover:border-white/25 transition-colors">
                      <img
                        src={track.thumbnail || '/icons/musify-icon.svg'}
                        alt={track.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                          <Play size={18} className="fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[var(--accent-ink)]' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-white/60 truncate font-medium mt-0.5">
                      {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* 8. PERSONAL SECTION: YOUR TOP ARTISTS */}
      {topArtists.length > 0 && !activeMood && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={sectionVariants}
          className="mb-10"
        >
          <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[var(--text-3)] flex items-center gap-1.5"><UserIcon size={12} className="text-[var(--accent-ink)]" /> Your frequent rotation
              </span>
              <h2 className="text-[20px] font-medium text-[var(--text-1)] leading-tight">
                Your Top Artists
              </h2>
            </div>
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex items-center gap-5 min-w-max pb-2">
              {topArtists.map((artist) => (
                <motion.div
                  key={artist.name}
                  variants={cardVariants}
                  whileHover={{}}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectArtist?.(artist.name)}
                  className="flex flex-col items-center group cursor-pointer select-none w-24 sm:w-28 text-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white/10 border border-white/10 group-hover:border-white/30 transition-colors shadow-md mb-2">
                    <img
                      src={artist.thumbnail || '/icons/musify-icon.svg'}
                      alt={artist.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300"
                      onError={handleImageError}
                    />
                  </div>
                  <p className="text-xs font-bold text-white group-hover:text-[var(--accent-ink)] truncate w-full transition-colors">
                    {artist.name}
                  </p>
                  <span className="text-[10px] text-white/50 font-medium">Artist</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 9. PERSONAL SECTION: FORGOTTEN FAVORITES */}
      {forgottenFavorites.length > 0 && !activeMood && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={sectionVariants}
          className="mb-10"
        >
          <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[var(--text-3)]">
                SONGS YOU USED TO PLAY ON REPEAT
              </span>
              <h2 className="text-[20px] font-medium text-[var(--text-1)] leading-tight">
                Forgotten Favorites
              </h2>
            </div>
            <button
              onClick={() => playTrack(forgottenFavorites[0], forgottenFavorites)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
            >
              <Play size={12} className="fill-current" /> Play all
            </button>
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
              {forgottenFavorites.slice(0, 16).map((track) => renderTrackRow(track, forgottenFavorites))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 10. REAL BACKEND FEED SECTIONS (/api/home from Innertube) */}
      {feedLoading && backendSections.length === 0 ? (
        <div className="my-6">
          <HomeFeedSkeleton />
        </div>
      ) : (
        backendSections.map((sec, secIdx) => {
          if (!sec.items || sec.items.length === 0) return null;
          const sectionTracks = sec.items.map(itemToTrack);
          const playableTracks = sectionTracks.filter(
            (t) => t.id.length === 11 && !t.id.startsWith('VL') && !t.id.startsWith('RD') && !t.id.startsWith('MPREb')
          );

          return (
            <motion.section
              key={`${sec.title}-${secIdx}`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={sectionVariants}
              className="mb-10"
            >
              <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[20px] font-medium text-[var(--text-1)] leading-tight">
                    {sec.title}
                  </h2>
                </div>
                {playableTracks.length > 0 && (
                  <button
                    onClick={() => playTrack(playableTracks[0], playableTracks)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
                  >
                    <Play size={12} className="fill-current" /> Play all
                  </button>
                )}
              </motion.div>

              {/* Responsive Shelf: If 10+ items, show 4-row grid; if fewer, show horizontal card row */}
              {sec.items.length >= 8 ? (
                <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
                  <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
                    {sec.items.slice(0, 16).map((item) => {
                      const track = itemToTrack(item);
                      return renderTrackRow(track, playableTracks, item);
                    })}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
                  <div className="flex items-center gap-4 min-w-max pb-2">
                    {sec.items.map((item) => {
                      const track = itemToTrack(item);
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <motion.div
                          key={item.id}
                          variants={cardVariants}
                          whileHover={{}}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleFeedItemClick(item, track, playableTracks)}
                          className="w-[150px] sm:w-[170px] flex flex-col group cursor-pointer select-none"
                        >
                          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/10 mb-2.5 border border-white/10 shadow-lg group-hover:border-white/25 transition-colors">
                            <img
                              src={track.thumbnail || '/icons/musify-icon.svg'}
                              alt={track.title}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300"
                              onError={handleImageError}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                                <Play size={18} className="fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <p className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[var(--accent-ink)]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-white/60 truncate font-medium mt-0.5">
                            {track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.section>
          );
        })
      )}
    </div>
  );

  function handleFeedItemClick(
    item: { id: string; title: string; subtitle?: string; thumbnail: string; type?: string },
    track: Track,
    playableList: Track[]
  ) {
    const isPlaylist = item.type === 'playlist' || item.id.startsWith('VL') || item.id.startsWith('RD');
    const isAlbum = item.type === 'album' || item.id.startsWith('MPREb');
    const isArtist = item.type === 'artist';

    if (isPlaylist && onSelectPlaylist) {
      onSelectPlaylist(item.id.replace(/^VL/, ''));
      return;
    }
    if (isAlbum && onSelectAlbum) {
      onSelectAlbum(item.id);
      return;
    }
    if (isArtist && onSelectArtist) {
      onSelectArtist(item.id);
      return;
    }

    if (track.id.length === 11) {
      playTrack(track, playableList.length > 0 ? playableList : [track]);
    }
  }

  // Helper render for 64px track row in snap grid
  function renderTrackRow(
    track: Track,
    playableList: Track[],
    item?: { id: string; title: string; subtitle?: string; thumbnail: string; type?: string }
  ) {
    const isCurrent = currentTrack?.id === track.id;
    const liked = isLiked(track.id);

    return (
      <motion.div
        key={track.id}
        variants={cardVariants}
        whileHover={{}}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          if (item) {
            handleFeedItemClick(item, track, playableList);
          } else {
            playTrack(track, playableList);
          }
        }}
        className={`w-[290px] sm:w-[320px] h-[56px] min-h-[56px] rounded-xl flex items-center gap-3 px-3 cursor-pointer select-none transition-colors duration-150 border ${isCurrent ? 'bg-[var(--bg-raised)] border-[var(--hairline)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'border-transparent hover:bg-[var(--bg-raised)] active:scale-[0.98]'}`}
      >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
          <img
            src={track.thumbnail || '/icons/musify-icon.svg'}
            alt={track.title}
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={handleImageError}
          />

          {isCurrent && isPlaying && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center gap-0.5">
              <span className="w-1 bg-[var(--accent)] rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-4" />
              <span className="w-1 bg-[var(--accent)] rounded-full animate-[bounce_0.8s_ease-in-out_0.2s_infinite] h-6" />
              <span className="w-1 bg-[var(--accent)] rounded-full animate-[bounce_0.5s_ease-in-out_0.4s_infinite] h-3" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className={`text-sm font-bold truncate leading-tight ${isCurrent ? 'text-[var(--accent-ink)]' : 'text-white'}`}>
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
          aria-label={liked ? 'Unlike' : 'Like'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <HeartBurstIcon isLiked={liked} size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id);
          }}
          aria-label="More options"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors relative"
        >
          <MoreVertical size={16} />

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
      </motion.div>
    );
  }
};
