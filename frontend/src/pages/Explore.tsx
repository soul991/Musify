import React, { useEffect, useState } from 'react';
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
  Moon
} from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { Track } from '../types';
import { TrackListSkeleton } from '../components/common/SkeletonLoader';

interface ExploreProps {
  onSelectAlbum?: (id: string) => void;
  onSelectPlaylist?: (id: string) => void;
}

export const Explore: React.FC<ExploreProps> = ({ onSelectAlbum, onSelectPlaylist }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { colors } = useTheme();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const moodsAndGenres = [
    { title: 'Chill & Relax', color: 'from-sky-500/90 via-blue-600/80 to-indigo-950', icon: Coffee, query: 'Chill music acoustic' },
    { title: 'Workout Energy', color: 'from-rose-500/90 via-red-600/80 to-amber-950', icon: Zap, query: 'Workout motivation music' },
    { title: 'Deep Focus', color: 'from-emerald-500/90 via-teal-600/80 to-slate-950', icon: Sparkles, query: 'Deep focus study ambient' },
    { title: 'Party & Dance', color: 'from-fuchsia-500/90 via-purple-600/80 to-pink-950', icon: PartyPopper, query: 'Party dance chartbusters' },
    { title: 'Acoustic & Indie', color: 'from-amber-500/90 via-orange-600/80 to-amber-950', icon: Guitar, query: 'Acoustic indie folk' },
    { title: 'Romance & Love', color: 'from-pink-500/90 via-rose-600/80 to-purple-950', icon: Heart, query: 'Romantic songs hindi english' },
    { title: 'Late Night Melodies', color: 'from-indigo-600/90 via-slate-800/80 to-blue-950', icon: Moon, query: 'Late night chill melodies' },
    { title: 'Nostalgia 2000s', color: 'from-violet-600/90 via-purple-900/80 to-slate-950', icon: Disc, query: '2000s nostalgia super hits' }
  ];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.search('India Top 50 Trending Hits', 'songs').catch(() => ({ songs: [] })),
      api.search('Latest new album releases 2026', 'songs').catch(() => ({ songs: [] }))
    ])
      .then(([trendData, releaseData]) => {
        setTrendingTracks(trendData.songs?.slice(0, 20) || []);
        setNewReleases(releaseData.songs?.slice(0, 10) || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMoodClick = (query: string) => {
    setLoading(true);
    api.search(query, 'songs').then((data) => {
      if (data && data.songs) {
        setTrendingTracks(data.songs.slice(0, 20));
      }
      setLoading(false);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-3 pb-48 text-white no-scrollbar select-none">
      {/* Moods & Genres Grid */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
          MOODS & GENRES
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {moodsAndGenres.map((mood, idx) => {
            const Icon = mood.icon;
            return (
              <div
                key={idx}
                onClick={() => handleMoodClick(mood.query)}
                className={`relative h-24 rounded-[24px] p-3.5 bg-gradient-to-br ${mood.color} cursor-pointer shadow-[0_8px_20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] border border-white/15 hover:border-white/30`}
              >
                {/* Top Glass Highlight Reflection */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Ambient Watermark Icon */}
                <Icon
                  size={60}
                  strokeWidth={1.5}
                  className="absolute -right-2 -bottom-2 text-white/[0.12] group-hover:text-white/[0.22] group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 pointer-events-none"
                />

                <span className="font-black text-sm sm:text-base leading-snug drop-shadow-md text-white z-10">
                  {mood.title}
                </span>

                <div className="flex justify-end z-10">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <Play size={13} className="fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trending Charts: 4-Row Horizontal Grid (`LazyHorizontalGrid`) */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              OFFICIAL BILLBOARD CHARTS
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <TrendingUp size={22} className="text-[#E5303D]" />
              <span>Trending Charts</span>
            </h2>
          </div>
          {trendingTracks.length > 0 && (
            <button
              onClick={() => playTrack(trendingTracks[0], trendingTracks)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Play size={12} className="fill-current" /> Play all
            </button>
          )}
        </div>

        {/* 4-Row Horizontal Snap Grid */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="grid grid-rows-4 grid-flow-col gap-2 min-w-max pb-2">
            {trendingTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, trendingTracks)}
                  className={`w-[290px] sm:w-[320px] h-[64px] rounded-2xl flex items-center gap-3 px-2.5 cursor-pointer select-none transition-all duration-200 border ${
                    isCurrent
                      ? 'bg-white/[0.14] border-white/30 shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                  }`}
                >
                  {/* Rank Number */}
                  <span
                    className={`w-6 text-center text-xs font-black ${
                      idx < 3 ? 'text-[#E5303D]' : 'text-white/40'
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
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                        }}
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
                        isCurrent ? 'text-[#E5303D]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-white/60 truncate font-medium mt-0.5">
                      {track.artists?.map((a) => a.name).join(', ') || 'Unknown'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* New Releases Section */}
      {newReleases.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                FRESH OFF THE PRESS
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                New Releases
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex items-center gap-4 min-w-max pb-2">
              {newReleases.map((release) => (
                <div
                  key={release.id}
                  onClick={() => playTrack(release, newReleases)}
                  className="w-[140px] sm:w-[160px] flex flex-col gap-2 cursor-pointer group"
                >
                  <div className="w-full aspect-square rounded-[22px] overflow-hidden bg-white/10 border border-white/10 relative shadow-md group-hover:border-white/30 transition-all">
                    <img
                      src={release.thumbnail}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
