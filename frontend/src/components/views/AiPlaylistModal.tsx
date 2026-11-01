import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CloudRain, Sun, Moon, Zap, Coffee, Play, CheckCircle2, Music } from 'lucide-react';
import { api } from '../../services/api';
import { Track } from '../../types';
import { useLibrary, UserPlaylist } from '../../context/LibraryContext';
import { usePlayer } from '../../context/PlayerContext';

interface AiPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlist: UserPlaylist) => void;
}

interface PresetOption {
  label: string;
  icon: React.ReactNode;
  prompt: string;
  searchQuery: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    label: 'Rainy Day Chill',
    icon: <CloudRain size={16} className="text-[var(--text-2)]" />,
    prompt: 'Melancholic acoustic indie, cozy rain jazz, warm piano',
    searchQuery: 'lofi rainy day chill acoustic indie warm piano'
  },
  {
    label: 'Sunny Euphoria',
    icon: <Sun size={16} className="text-amber-400" />,
    prompt: 'Upbeat pop, vibrant summer anthems, cheerful dance',
    searchQuery: 'upbeat summer hits dance pop cheerful feel good'
  },
  {
    label: 'Late Night Drive',
    icon: <Moon size={16} className="text-[var(--text-2)]" />,
    prompt: 'Synthwave, smooth R&B, midnight electronic lounge',
    searchQuery: 'synthwave late night drive chill electronic r&b'
  },
  {
    label: 'High Energy Workout',
    icon: <Zap size={16} className="text-rose-400" />,
    prompt: 'Aggressive phonk, heavy bass, motivational cardio pump',
    searchQuery: 'workout phonk gym motivation aggressive bass edm'
  },
  {
    label: 'Coffeehouse Acoustic',
    icon: <Coffee size={16} className="text-orange-400" />,
    prompt: 'Gentle guitar, warm vocals, peaceful Sunday cafe',
    searchQuery: 'coffeehouse acoustic indie folk peaceful chill cafe'
  }
];

export const AiPlaylistModal: React.FC<AiPlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const { createPlaylistWithTracks } = useLibrary();
  const { playTrack } = usePlayer();

  const [prompt, setPrompt] = useState('');
  const [songCount, setSongCount] = useState(15);
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [statusText, setStatusText] = useState('');
  const [createdPlaylist, setCreatedPlaylist] = useState<UserPlaylist | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetOption) => {
    setPrompt(preset.prompt);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryPrompt = prompt.trim() || 'Late night chill vibes';

    setStatus('generating');
    setStatusText('Consulting Echo Taste Engine...');

    try {
      // Find matching preset for targeted YouTube Music query expansion
      const matchedPreset = PRESET_OPTIONS.find((p) => p.prompt === queryPrompt);
      const effectiveSearch = matchedPreset ? matchedPreset.searchQuery : `${queryPrompt} songs playlist`;

      setStatusText(`Curating ${songCount} harmonious tracks for "${queryPrompt.slice(0, 25)}"...`);

      const [searchRes1, searchRes2] = await Promise.all([
        api.search(effectiveSearch, 'songs').catch(() => ({ songs: [] })),
        api.search(`${queryPrompt} music hits`, 'songs').catch(() => ({ songs: [] }))
      ]);

      const combinedTracks: Track[] = [];
      const seenIds = new Set<string>();

      [...(searchRes1.songs || []), ...(searchRes2.songs || [])].forEach((track) => {
        if (!seenIds.has(track.id)) {
          seenIds.add(track.id);
          combinedTracks.push(track);
        }
      });

      if (combinedTracks.length === 0) {
        throw new Error('No songs could be curated for this prompt. Try a different mood.');
      }

      const selectedTracks = combinedTracks.slice(0, songCount);
      const playlistTitle = `Mood: ${queryPrompt.charAt(0).toUpperCase() + queryPrompt.slice(1, 28)}`;

      const newPl = createPlaylistWithTracks(playlistTitle, selectedTracks);
      setCreatedPlaylist(newPl);
      setStatus('done');
      setStatusText(`Created "${playlistTitle}" with ${selectedTracks.length} tracks!`);
    } catch (err: any) {
      setStatus('error');
      setStatusText(err.message || 'Generation failed.');
    }
  };

  const handlePlay = () => {
    if (createdPlaylist && createdPlaylist.tracks.length > 0) {
      playTrack(createdPlaylist.tracks[0], createdPlaylist.tracks);
      onClose();
      onPlaylistCreated?.(createdPlaylist);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-lg rounded-3xl bg-[#1A1A1A] border border-white/10 p-6 text-white shadow-2xl flex flex-col gap-5 select-none relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--accent)]" />
              <h3 className="text-lg font-black tracking-tight">Mood Playlists</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-white/60 -mt-2 leading-relaxed">
            Choose a mood, vibe, or search preset to curate a matched playlist.
          </p>

          {status !== 'done' ? (
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              {/* Prompt Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold tracking-normal text-white/50">
                  Custom Prompt or Mood
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Cyberpunk night drive through Tokyo in the rain, or 90s bollywood acoustic romance..."
                  rows={3}
                  disabled={status === 'generating'}
                  className="w-full p-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent)] text-xs sm:text-sm font-medium resize-none transition-colors"
                />
              </div>

              {/* Atmospheric Meteorological Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-normal text-white/50">
                  Quick Atmospheric Presets
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_OPTIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Songs */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold tracking-normal text-white/50">
                  Target Songs: {songCount}
                </span>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 20, 25].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSongCount(count)}
                      className={`w-9 h-8 rounded-xl text-xs font-bold transition-colors ${
                        songCount === count
                          ? 'bg-[var(--accent)] text-white shadow-md'
                          : 'bg-white/10 hover:bg-white/15 text-white/70'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generation Progress */}
              {status === 'generating' && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-[var(--accent)] rounded-full animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-white/80">{statusText}</span>
                </div>
              )}

              {status === 'error' && (
                <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                  {statusText}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'generating'}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[#B8222E] disabled:opacity-50 text-white font-black text-xs tracking-normal flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Generate Playlist</span>
                </button>
              </div>
            </form>
          ) : (
            /* Success Preview */
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white">
                <CheckCircle2 size={24} className="text-[var(--accent)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white">{createdPlaylist?.name}</p>
                  <p className="text-xs text-white/60 font-medium">
                    {createdPlaylist?.tracks.length} curated tracks ready to stream
                  </p>
                </div>
              </div>

              {/* Tracks Carousel preview */}
              <div className="max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-1.5 p-2 rounded-2xl bg-white/[0.04] border border-white/5">
                {createdPlaylist?.tracks.slice(0, 5).map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-3 p-1.5 text-xs text-white/80">
                    <span className="w-5 text-center text-white/40">{idx + 1}</span>
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{track.title}</p>
                      <p className="text-[10px] text-white/50 truncate">
                        {track.artists?.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (createdPlaylist) onPlaylistCreated?.(createdPlaylist);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                >
                  Save to Library
                </button>
                <button
                  type="button"
                  onClick={handlePlay}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[#B8222E] text-white font-black text-xs tracking-normal flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Play size={14} className="fill-current" />
                  <span>Play Mood Playlist</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
