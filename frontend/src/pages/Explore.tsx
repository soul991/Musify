import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp, Music2, Sparkles, Play, Disc } from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { Track } from '../types';

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
    { title: 'Chill & Relax', color: 'from-blue-600 to-indigo-900', query: 'Chill music acoustic' },
    { title: 'Workout Energy', color: 'from-red-600 to-orange-800', query: 'Workout motivation music' },
    { title: 'Deep Focus', color: 'from-emerald-600 to-teal-900', query: 'Deep focus study ambient' },
    { title: 'Party & Dance', color: 'from-purple-600 to-pink-800', query: 'Party dance chartbusters' },
    { title: 'Acoustic & Indie', color: 'from-amber-600 to-yellow-800', query: 'Acoustic indie folk' },
    { title: 'Romance & Love', color: 'from-rose-600 to-pink-900', query: 'Romantic songs hindi english' },
    { title: 'Late Night Melodies', color: 'from-slate-700 to-cyan-900', query: 'Late night chill melodies' },
    { title: 'Nostalgia 2000s', color: 'from-indigo-900 to-slate-900', query: '2000s nostalgia super hits' }
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {moodsAndGenres.map((mood, idx) => (
            <div
              key={idx}
              onClick={() => handleMoodClick(mood.query)}
              className={`relative h-24 rounded-[24px] p-3.5 bg-gradient-to-br ${mood.color} cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/10`}
            >
              <span className="font-extrabold text-sm sm:text-base leading-tight drop-shadow-md">
                {mood.title}
              </span>
              <div className="flex justify-end">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} className="fill-white ml-0.5" />
                </div>
              </div>
            </div>
          ))}
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
              <TrendingUp size={22} className="text-[#ED5564]" />
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
                      idx < 3 ? 'text-[#ED5564]' : 'text-white/40'
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
                        isCurrent ? 'text-[#ED5564]' : 'text-white'
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
