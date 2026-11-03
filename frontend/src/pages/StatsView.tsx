import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Disc, Users, Trophy, Play, Sparkles } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { Track } from '../types';

interface StatsViewProps {
  onBack: () => void;
  onSelectArtist?: (artistId: string) => void;
}

type StatPeriod = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

const PERIODS: { id: StatPeriod; label: string }[] = [
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
  { id: 'all', label: 'All Time' }
];

export const StatsView: React.FC<StatsViewProps> = ({ onBack, onSelectArtist }) => {
  const { playStats } = useLibrary();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<StatPeriod>('all');

  // Filter stats by period
  const statsList = useMemo(() => {
    const now = Date.now();
    const periodCutoffs: Record<StatPeriod, number> = {
      '1w': now - 7 * 24 * 60 * 60 * 1000,
      '1m': now - 30 * 24 * 60 * 60 * 1000,
      '3m': now - 90 * 24 * 60 * 60 * 1000,
      '6m': now - 180 * 24 * 60 * 60 * 1000,
      '1y': now - 365 * 24 * 60 * 60 * 1000,
      all: 0
    };

    const cutoff = periodCutoffs[selectedPeriod];
    return Object.values(playStats).filter((s) => s.lastPlayed >= cutoff);
  }, [playStats, selectedPeriod]);

  // Ranked most played songs
  const topSongs = useMemo(() => {
    return [...statsList].sort((a, b) => b.count - a.count);
  }, [statsList]);

  // Aggregate artist stats
  const topArtists = useMemo(() => {
    const artistCounts: Record<string, { name: string; count: number }> = {};
    statsList.forEach((stat) => {
      stat.track.artists?.forEach((a) => {
        if (!artistCounts[a.name]) {
          artistCounts[a.name] = { name: a.name, count: 0 };
        }
        artistCounts[a.name].count += stat.count;
      });
    });
    return Object.values(artistCounts).sort((a, b) => b.count - a.count);
  }, [statsList]);

  // Aggregate metrics
  const totalPlays = statsList.reduce((acc, curr) => acc + curr.count, 0);
  const totalMinutes = Math.round(totalPlays * 3.5); // Average 3.5 mins per play
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const uniqueSongs = statsList.length;
  const uniqueArtists = topArtists.length;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pt-safe pb-48 text-white no-scrollbar select-none">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-colors text-white border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="text-xs font-bold text-white/50 tracking-normal">
            ANALYTICS & ACTIVITY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Listening Statistics
          </h1>
        </div>
      </div>

      {/* Period Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-6 py-1">
        {PERIODS.map((p) => {
          const isSelected = selectedPeriod === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold  transition-colors border whitespace-nowrap ${
                isSelected
                  ? 'text-white border-white/40 shadow-lg'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 border-white/10'
              }`}
              style={{
                backgroundColor: isSelected ? colors.primary : undefined,
                boxShadow: isSelected ? `0 4px 18px ${colors.primary}70` : undefined
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {/* Total Time */}
        <div className="p-4 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/15 flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
            style={{ backgroundColor: `${colors.primary}30` }}
          >
            <Clock size={24} style={{ color: colors.primary }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/60">Total Play Time</p>
            <p className="text-xl font-black text-white">
              {hours > 0 ? `${hours}h ` : ''}
              {minutes}m
            </p>
          </div>
        </div>

        {/* Unique Songs */}
        <div className="p-4 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/15 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-inner">
            <Disc size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/60">Unique Songs</p>
            <p className="text-xl font-black text-white">{uniqueSongs} tracks</p>
          </div>
        </div>

        {/* Unique Artists */}
        <div className="p-4 rounded-3xl bg-white/[0.05] backdrop-blur-2xl border border-white/15 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-raised)] border border-[var(--hairline)] flex items-center justify-center shadow-inner">
            <Users size={24} className="text-[var(--text-2)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/60">Unique Artists</p>
            <p className="text-xl font-black text-white">{uniqueArtists} artists</p>
          </div>
        </div>
      </div>

      {/* Top Songs Leaderboard */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-amber-400" />
          <h2 className="text-lg sm:text-xl font-extrabold text-white">Most Played Songs</h2>
        </div>

        {topSongs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/[0.03] border border-white/10 text-white/50 text-sm font-semibold">
            No playback activity recorded yet for this period. Start listening to tracks!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {topSongs.slice(0, 20).map((stat, index) => {
              const isCurrent = currentTrack?.id === stat.track.id;
              const isTop3 = index < 3;

              return (
                <div
                  key={stat.track.id}
                  onClick={() => playTrack(stat.track, topSongs.map((s) => s.track))}
                  className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer select-none transition-colors border ${
                    isCurrent
                      ? 'bg-white/[0.14] border-white/30'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-7 text-center font-black text-sm shrink-0 ${
                      index === 0
                        ? 'text-amber-400 text-base'
                        : index === 1
                        ? 'text-slate-300'
                        : index === 2
                        ? 'text-amber-600'
                        : 'text-white/40'
                    }`}
                  >
                    #{index + 1}
                  </div>

                  {/* Artwork */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10">
                    <img
                      src={stat.track.thumbnail || '/icons/musify-icon.svg'}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p
                      className={`text-sm font-bold truncate ${
                        isCurrent ? 'text-[var(--accent)]' : 'text-white'
                      }`}
                    >
                      {stat.track.title}
                    </p>
                    <p className="text-xs text-white/60 truncate font-medium mt-0.5">
                      {stat.track.artists?.map((a) => a.name).join(', ') || 'Unknown'}
                    </p>
                  </div>

                  {/* Play Count Badge */}
                  <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/80 shrink-0">
                    {stat.count} {stat.count === 1 ? 'play' : 'plays'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Top Artists Leaderboard */}
      {topArtists.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-extrabold text-white mb-4">Top Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topArtists.slice(0, 8).map((artist, idx) => (
              <div
                key={artist.name}
                className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center text-center hover:bg-white/[0.08] transition-colors"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg text-white mb-2 shadow-inner"
                  style={{ backgroundColor: `${colors.primary}40` }}
                >
                  {artist.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-bold text-white truncate max-w-full leading-tight">
                  {artist.name}
                </p>
                <p className="text-xs text-white/50 font-medium mt-1">
                  {artist.count} {artist.count === 1 ? 'play' : 'plays'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
