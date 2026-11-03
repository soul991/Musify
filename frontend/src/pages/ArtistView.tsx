import React, { useEffect, useState } from 'react';
import { Radio, Shuffle, Share2, Users, Disc, ChevronDown, ChevronUp, Check, Plus } from 'lucide-react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { Artist, Track } from '../types';
import { ParallaxHeader } from '../components/views/ParallaxHeader';
import { TrackRow } from '../components/views/TrackRow';
import { fisherYatesShuffle } from '../utils/shuffle';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackListSkeleton, CardsGridSkeleton } from '../components/common/SkeletonLoader';

interface ArtistViewProps {
  artistId: string;
  onBack: () => void;
  onSelectAlbum?: (id: string) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artistId,
  onBack,
  onSelectAlbum
}) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { colors } = useTheme();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'albums' | 'singles'>('top');

  useEffect(() => {
    setLoading(true);
    api.getArtist(artistId)
      .then((data) => {
        setArtist(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-hidden space-y-6">
        <TrackListSkeleton count={6} />
        <CardsGridSkeleton count={4} />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex-1 p-8 text-center text-white/50 flex flex-col items-center justify-center gap-3">
        <p className="text-base font-bold">Artist not found</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isCurrentArtistPlaying = artist.topSongs.some((t) => t.id === currentTrack?.id);

  const handlePlayTopSongs = () => {
    if (artist.topSongs.length > 0) {
      playTrack(artist.topSongs[0], artist.topSongs);
    }
  };

  const handleShuffleTopSongs = () => {
    if (artist.topSongs.length > 0) {
      const shuffled = fisherYatesShuffle(artist.topSongs);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artist.name,
        text: `Listen to ${artist.name} on Musify`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Artist link copied to clipboard!');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-56 text-white no-scrollbar w-full">
      {/* Parallax Header */}
      <ParallaxHeader
        type="artist"
        title={artist.name}
        thumbnail={artist.thumbnail}
        isPlaying={isPlaying}
        isCurrentItemPlaying={isCurrentArtistPlaying}
        onPlayClick={handlePlayTopSongs}
        onShuffleClick={handleShuffleTopSongs}
        onBack={onBack}
      >
        {/* Metric Badges (Subscribers & Listeners) */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-2">
          {artist.subscribers && (
            <div className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 shadow-sm">
              <Users size={13} className="text-[var(--accent-color)]" />
              <span>{artist.subscribers} fans</span>
            </div>
          )}

          <div className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 shadow-sm">
            <Disc size={13} className="text-emerald-400" />
            <span>Verified Artist</span>
          </div>
        </div>

        {/* Material 3 Expressive Action Buttons (Follow + Connected Row) */}
        <div className="flex flex-col gap-2.5 mt-5 max-w-sm mx-auto w-full">
          {/* Follow / Subscribe ToggleButton */}
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`w-full h-11 rounded-full font-bold text-xs  tracking-normal flex items-center justify-center gap-2 transition-colors shadow-md active:scale-98 ${
              isFollowing
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {isFollowing ? (
              <>
                <Check size={16} strokeWidth={3} />
                <span>Following</span>
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={3} />
                <span>Follow</span>
              </>
            )}
          </button>

          {/* Connected Button Row (Radio, Shuffle, Share) */}
          <div className="flex items-center rounded-2xl bg-white/[0.08] p-1 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                if (artist.topSongs[0]) {
                  api.getRadio(artist.topSongs[0].id).then((radioTracks) => {
                    if (radioTracks.length > 0) playTrack(radioTracks[0], radioTracks);
                  });
                }
              }}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Radio size={14} />
              <span>Radio</span>
            </button>

            <div className="w-[1px] h-4 bg-white/15" />

            <button
              onClick={handleShuffleTopSongs}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Shuffle size={14} />
              <span>Shuffle</span>
            </button>

            <div className="w-[1px] h-4 bg-white/15" />

            <button
              onClick={handleShare}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </ParallaxHeader>

      {/* Main Artist Content Body */}
      <div className="px-4 sm:px-8 max-w-4xl mx-auto flex flex-col gap-8">
        {/* About Artist Biography (Expandable) */}
        {artist.description && (
          <div className="p-5 rounded-3xl bg-white/[0.05] border border-white/10">
            <h3 className="text-sm font-black tracking-normal text-white/60 mb-2">
              About
            </h3>
            <p
              className={`text-xs sm:text-sm text-white/80 leading-relaxed font-medium ${
                showFullBio ? '' : 'line-clamp-3'
              }`}
            >
              {artist.description}
            </p>
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className="mt-2 text-xs font-bold text-[var(--accent-color)] hover:underline flex items-center gap-1"
            >
              <span>{showFullBio ? 'Show less' : 'Read more'}</span>
              {showFullBio ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}

        {/* Section Tabs: Popular Songs | Albums | Singles */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('top')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold  tracking-normal transition-colors ${
              activeTab === 'top'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Popular Songs
          </button>

          {artist.albums.length > 0 && (
            <button
              onClick={() => setActiveTab('albums')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold  tracking-normal transition-colors ${
                activeTab === 'albums'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Albums ({artist.albums.length})
            </button>
          )}

          {artist.singles?.length > 0 && (
            <button
              onClick={() => setActiveTab('singles')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold  tracking-normal transition-colors ${
                activeTab === 'singles'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Singles & EPs ({artist.singles.length})
            </button>
          )}
        </div>

        {/* Popular Songs Section */}
        {activeTab === 'top' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3 py-1 text-xs font-extrabold tracking-normal text-white/40">
              <span># Title</span>
              <span>Time</span>
            </div>
            {artist.topSongs.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                playlistContext={artist.topSongs}
                showIndex={true}
                showThumbnail={true}
              />
            ))}
          </div>
        )}

        {/* Albums Discography Grid */}
        {(activeTab === 'albums' || (activeTab === 'top' && artist.albums.length > 0)) && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-lg font-black tracking-tight text-white/95">Albums</h3>
              {artist.albums.length > 4 && activeTab === 'top' && (
                <button
                  onClick={() => setActiveTab('albums')}
                  className="text-xs font-bold text-[var(--accent-color)] hover:underline"
                >
                  See all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(activeTab === 'top' ? artist.albums.slice(0, 4) : artist.albums).map((album) => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum?.(album.id)}
                  className="p-3.5 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 cursor-pointer flex flex-col gap-3 group transition-colors"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white/10 shadow-md">
                    <img
                      src={album.thumbnail || '/icons/musify-icon.svg'}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                      }}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white/90 truncate group-hover:text-[var(--accent-color)]">
                      {album.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate mt-0.5">{album.year || 'Album'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Singles Discography Grid */}
        {(activeTab === 'singles' || (activeTab === 'top' && artist.singles?.length > 0)) && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-lg font-black tracking-tight text-white/95">Singles & EPs</h3>
              {artist.singles?.length > 4 && activeTab === 'top' && (
                <button
                  onClick={() => setActiveTab('singles')}
                  className="text-xs font-bold text-[var(--accent-color)] hover:underline"
                >
                  See all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(activeTab === 'top' ? artist.singles.slice(0, 4) : artist.singles).map((single) => (
                <div
                  key={single.id}
                  onClick={() => onSelectAlbum?.(single.id)}
                  className="p-3.5 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 cursor-pointer flex flex-col gap-3 group transition-colors"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white/10 shadow-md">
                    <img
                      src={single.thumbnail || '/icons/musify-icon.svg'}
                      alt={single.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                      }}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white/90 truncate group-hover:text-[var(--accent-color)]">
                      {single.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate mt-0.5">{single.year || 'Single'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
