import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  TrendingUp,
  Play,
  Disc,
  Coffee,
  Zap,
  Sparkles,
  PartyPopper,
  Guitar,
  Heart,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { TrackListSkeleton } from '../components/common/SkeletonLoader';

interface ExploreProps {
  onSelectAlbum?: (id: string) => void;
  onSelectPlaylist?: (id: string) => void;
}

interface MoodItem {
  title: string;
  color?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  query: string;
}

const moodsAndGenres: MoodItem[] = [
  { title: 'Chill & Relax', icon: Coffee, query: 'Chill music acoustic' },
  { title: 'Workout Energy', icon: Zap, query: 'Workout motivation music' },
  { title: 'Deep Focus', icon: Sparkles, query: 'Deep focus study ambient' },
  { title: 'Party & Dance', icon: PartyPopper, query: 'Party dance chartbusters' },
  { title: 'Acoustic & Indie', icon: Guitar, query: 'Acoustic indie folk' },
  { title: 'Romance & Love', icon: Heart, query: 'Romantic songs hindi english' },
  { title: 'Late Night Melodies', icon: Moon, query: 'Late night chill melodies' },
  { title: 'Nostalgia 2000s', icon: Disc, query: '2000s nostalgia super hits' }
];

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

export const Explore: React.FC<ExploreProps> = () => {
  const { playTrack, currentTrack } = usePlayer();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [activeMood, setActiveMood] = useState<MoodItem | null>(null);
  const [moodTracks, setMoodTracks] = useState<Track[]>([]);
  const [moodLoading, setMoodLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.search('India Top 50 Trending Hits', 'songs').catch(() => ({ songs: [] })),
      api.search('Latest new album releases 2026', 'songs').catch(() => ({ songs: [] }))
    ])
      .then(([trendData, releaseData]) => {
        setTrendingTracks(trendData.songs?.slice(0, 20) || []);
        setNewReleases(releaseData.songs?.slice(0, 10) || []);
      })
      .catch(() => {});
  }, []);

  const handleMoodClick = (mood: MoodItem, autoPlay = false) => {
    setActiveMood(mood);
    setMoodLoading(true);
    api.search(mood.query, 'songs')
      .then((data) => {
        const songs = data?.songs?.slice(0, 20) || [];
        setMoodTracks(songs);
        if (autoPlay && songs.length > 0) {
          playTrack(songs[0], songs);
        }
      })
      .catch(() => {
        setMoodTracks([]);
      })
      .finally(() => {
        setMoodLoading(false);
      });
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pt-safe pb-56 text-white no-scrollbar select-none max-w-6xl mx-auto w-full">
      {/* 1. Featured mood HERO CARD (musify-design-plan.md §4) */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative mb-10 rounded-[28px] overflow-hidden p-6 sm:p-8 bg-[var(--bg-card)] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-pointer group select-none"
        onClick={() => {
          const deepFocus = moodsAndGenres.find((m) => m.title === 'Deep Focus') || moodsAndGenres[2];
          handleMoodClick(deepFocus);
        }}
      >
        {/* Subtle Watermark Icon in background */}
        <Sparkles
          size={200}
          strokeWidth={1}
          className="absolute -right-8 -bottom-8 text-white/[0.08] group-hover:text-white/[0.14] transition-opacity duration-200 pointer-events-none"
        />

        {/* Top Glass highlight shine */}
        

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-raised)] border border-[var(--hairline)] text-[var(--text-3)] text-xs font-medium mb-3">
            <Sparkles size={11} className="text-amber-300" />
            <span>Featured mood</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display leading-tight mb-2">
            Deep Focus
          </h1>

          <p className="text-sm sm:text-base text-white/80 font-medium mb-6 leading-relaxed max-w-md drop-shadow">
            Ambient soundscapes and organic acoustic textures calibrated for intense flow state and deep work.
          </p>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{}}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                const deepFocus = moodsAndGenres.find((m) => m.title === 'Deep Focus') || moodsAndGenres[2];
                handleMoodClick(deepFocus, true);
              }}
              className="px-6 py-3 rounded-full bg-white text-black font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-black/40 hover:bg-white/95 transition-colors cursor-pointer"
            >
              <Play size={16} className="fill-current ml-0.5" />
              <span>Play This Mood</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* 2. MOODS & GENRES OR MORPHED RESULTS VIEW */}
      {!activeMood ? (
        <section className="mb-10">
          <h2 className="text-xs font-medium text-[var(--text-3)] mb-3">Moods and genres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {moodsAndGenres.map((mood) => {
              const Icon = mood.icon;
              return (
                <motion.div
                  key={mood.title}
                  layoutId={`mood-${mood.title}`}
                  whileHover={{}}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleMoodClick(mood)}
                  className="relative h-[80px] rounded-xl p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-raised)] cursor-pointer overflow-hidden flex items-center justify-between group border border-[var(--hairline)] transition-colors duration-150 active:scale-[0.98]"
                >
                  {/* Top Glass Highlight Reflection */}
                  

                  {/* Ambient Watermark Icon */}
                  

                  <span className="font-sans font-medium text-sm sm:text-base leading-snug text-[var(--text-1)] z-10">
                    {mood.title}
                  </span>

                  <div className="flex justify-end z-10">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <Play size={13} className="fill-white ml-0.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mb-10">
          <motion.div
            layoutId={`mood-${activeMood.title}`}
            className="rounded-2xl bg-[var(--bg-card)] p-5 mb-6 border border-[var(--hairline)]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveMood(null);
                    setMoodTracks([]);
                  }}
                  className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
                  title="Back to all moods"
                  aria-label="Back to all moods"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <span className="text-[10px] font-bold text-white/70 tracking-normal block">
                    Active mood
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                    {activeMood.title}
                  </h2>
                </div>
              </div>
              {moodTracks.length > 0 && (
                <button
                  onClick={() => playTrack(moodTracks[0], moodTracks)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full border border-white/20 transition-colors cursor-pointer shadow-md"
                >
                  <Play size={13} className="fill-current" /> Play all
                </button>
              )}
            </div>
          </motion.div>

          {moodLoading ? (
            <div className="py-4">
              <TrackListSkeleton count={6} />
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
              <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
                {moodTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <motion.div
                      key={track.id}
                      variants={cardVariants}
                      whileHover={{}}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => playTrack(track, moodTracks)}
                      className={`w-[290px] sm:w-[320px] h-[64px] rounded-2xl flex items-center gap-3 px-2.5 cursor-pointer select-none transition-colors duration-200 border ${
                        isCurrent
                          ? 'bg-white/[0.14] border-white/30 shadow-md'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                      }`}
                    >
                      <span className="w-6 text-center text-xs font-black text-white/40">
                        #{idx + 1}
                      </span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
                        <img
                          src={track.thumbnail || '/icons/musify-icon.svg'}
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`text-sm font-bold truncate leading-tight ${isCurrent ? 'text-[var(--accent)]' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-white/60 truncate font-medium mt-0.5">
                          {track.artists?.map((a) => a.name).join(', ') || 'Unknown'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. TRENDING CHARTS: 4-Row Horizontal Grid with Staggered Scroll Reveal */}
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
              OFFICIAL BILLBOARD CHARTS
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 font-display">
              <TrendingUp size={22} className="text-[var(--accent)]" />
              <span>Trending Charts</span>
            </h2>
          </div>
          {trendingTracks.length > 0 && (
            <button
              onClick={() => playTrack(trendingTracks[0], trendingTracks)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
            >
              <Play size={12} className="fill-current" /> Play all
            </button>
          )}
        </motion.div>

        {/* 4-Row Horizontal Snap Grid */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
            {trendingTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <motion.div
                  key={track.id}
                  variants={cardVariants}
                  whileHover={{}}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => playTrack(track, trendingTracks)}
                  className={`w-[290px] sm:w-[320px] h-[64px] rounded-2xl flex items-center gap-3 px-2.5 cursor-pointer select-none transition-colors duration-200 border ${
                    isCurrent
                      ? 'bg-white/[0.14] border-white/30 shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                  }`}
                >
                  {/* Rank Number */}
                  <span
                    className={`w-6 text-center text-xs font-black ${
                      idx < 3 ? 'text-[var(--accent)]' : 'text-white/40'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Disc size={20} className="text-white/40" />
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p
                      className={`text-sm font-bold truncate leading-tight ${
                        isCurrent ? 'text-[var(--accent)]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-white/60 truncate font-medium mt-0.5">
                      {track.artists?.map((a) => a.name).join(', ') || 'Unknown'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* 4. NEW RELEASES SECTION */}
      {newReleases.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={sectionVariants}
          className="mb-10"
        >
          <motion.div variants={headerVariants} className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-[var(--text-3)]">Fresh off the press</span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                New Releases
              </h2>
            </div>
          </motion.div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex items-center gap-4 min-w-max pb-2">
              {newReleases.map((release) => (
                <motion.div
                  key={release.id}
                  variants={cardVariants}
                  whileHover={{}}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => playTrack(release, newReleases)}
                  className="w-[140px] sm:w-[160px] flex flex-col gap-2 cursor-pointer group select-none"
                >
                  <div className="w-full aspect-square rounded-[22px] overflow-hidden bg-white/10 border border-white/10 relative shadow-md group-hover:border-white/30 transition-colors">
                    <img
                      src={release.thumbnail}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play size={16} className="fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white truncate leading-tight mt-1">
                    {release.title}
                  </p>
                  <p className="text-[11px] text-white/60 font-medium truncate">
                    {release.artists?.map((a) => a.name).join(', ')}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};
