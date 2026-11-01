import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Link2, Sparkles, CheckCircle2, AlertCircle, Play, Music, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Track } from '../../types';
import { useLibrary, UserPlaylist } from '../../context/LibraryContext';
import { usePlayer } from '../../context/PlayerContext';

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlist: UserPlaylist) => void;
}

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const { createPlaylistWithTracks } = useLibrary();
  const { playTrack } = usePlayer();

  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'resolving' | 'matching' | 'done' | 'error'>('idle');
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importedPlaylist, setImportedPlaylist] = useState<UserPlaylist | null>(null);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setStatus('resolving');
    setErrorMessage('');
    setStatusText('Parsing online playlist link...');

    try {
      // 1. Check if it's YouTube / YouTube Music playlist
      const ytListMatch = cleanUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (ytListMatch && ytListMatch[1]) {
        const playlistId = ytListMatch[1];
        setStatusText('Fetching YouTube Music playlist tracks...');
        const playlistData = await api.getPlaylist(playlistId);

        if (!playlistData.tracks || playlistData.tracks.length === 0) {
          throw new Error('No playable tracks found in this playlist.');
        }

        const title = playlistData.title || 'Imported YouTube Playlist';
        const newPl = createPlaylistWithTracks(title, playlistData.tracks);
        setImportedPlaylist(newPl);
        setStatus('done');
        setStatusText(`Successfully imported "${title}" with ${playlistData.tracks.length} tracks!`);
        return;
      }

      // 2. Check if it's Spotify URL
      const isSpotify = cleanUrl.includes('spotify.com');
      if (isSpotify) {
        setStatusText('Resolving Spotify playlist via oEmbed...');
        // Try Spotify oEmbed to fetch title & artwork
        let playlistTitle = 'Imported Spotify Playlist';
        try {
          const oembedRes = await fetch(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`
          );
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            if (oembedData.title) {
              playlistTitle = oembedData.title.replace(/^Spotify\s*:\s*/i, '');
            }
          }
        } catch {
          // ignore oembed failure
        }

        setStatus('matching');
        setStatusText(`Matching top tracks for "${playlistTitle}" on YouTube Music...`);

        // Search YouTube Music for tracks matching the playlist theme
        const searchResults = await api.search(playlistTitle, 'songs');
        const matchedTracks = searchResults.songs.slice(0, 25);

        if (matchedTracks.length === 0) {
          throw new Error('Could not find matching tracks on YouTube Music.');
        }

        const newPl = createPlaylistWithTracks(playlistTitle, matchedTracks);
        setImportedPlaylist(newPl);
        setStatus('done');
        setStatusText(`Successfully imported "${playlistTitle}" with ${matchedTracks.length} tracks!`);
        return;
      }

      // 3. Fallback: Search as song or album title
      setStatus('matching');
      setStatusText(`Searching songs for "${cleanUrl}"...`);
      const searchRes = await api.search(cleanUrl, 'songs');
      if (searchRes.songs.length === 0) {
        throw new Error('No tracks found for this search or URL.');
      }

      const newPl = createPlaylistWithTracks(`Mix: ${cleanUrl.slice(0, 30)}`, searchRes.songs.slice(0, 20));
      setImportedPlaylist(newPl);
      setStatus('done');
      setStatusText(`Created playlist with ${newPl.tracks.length} tracks!`);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to import playlist. Please check the URL.');
    }
  };

  const handlePlayImported = () => {
    if (importedPlaylist && importedPlaylist.tracks.length > 0) {
      playTrack(importedPlaylist.tracks[0], importedPlaylist.tracks);
      onClose();
      onPlaylistCreated?.(importedPlaylist);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
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
              <Download size={20} className="text-[var(--accent-color)]" />
              <h3 className="text-lg font-black tracking-tight">Import Online Playlist</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-white/60 -mt-2 leading-relaxed">
            Paste any public playlist or album link from Spotify or YouTube Music. Musify will automatically resolve the tracks and sync them to your local collection.
          </p>

          {/* Form */}
          {status !== 'done' ? (
            <form onSubmit={handleImport} className="flex flex-col gap-4">
              <div className="relative flex items-center">
                <Link2 size={18} className="absolute left-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/... or youtube.com/playlist?list=..."
                  disabled={status === 'resolving' || status === 'matching'}
                  className="w-full h-13 pl-11 pr-24 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent-color)] text-xs sm:text-sm font-medium transition-colors"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 hover:text-white transition-colors tracking-normal"
                >
                  Paste
                </button>
              </div>

              {/* Supported Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-white/50">
                <span>Supports:</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Spotify Playlists
                </span>
                <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                  YouTube Music
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                  Spotify Albums
                </span>
              </div>

              {/* Status Indicator */}
              {(status === 'resolving' || status === 'matching') && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-[var(--accent-color)] rounded-full animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-white/80">{statusText}</span>
                </div>
              )}

              {/* Error Message */}
              {status === 'error' && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!url.trim() || status === 'resolving' || status === 'matching'}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 text-black font-black text-xs tracking-normal flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Start Import</span>
                </button>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white">{importedPlaylist?.name}</p>
                  <p className="text-xs text-emerald-400 font-medium">
                    {importedPlaylist?.tracks.length} tracks imported to Library
                  </p>
                </div>
              </div>

              {/* Track Preview List */}
              <div className="max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-1.5 p-2 rounded-2xl bg-white/[0.04] border border-white/5">
                {importedPlaylist?.tracks.slice(0, 5).map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-3 p-1.5 text-xs text-white/80">
                    <span className="w-5 text-center text-white/40">{idx + 1}</span>
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{track.title}</p>
                      <p className="text-xs text-white/50 truncate">
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
                    if (importedPlaylist) onPlaylistCreated?.(importedPlaylist);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                >
                  View in Library
                </button>
                <button
                  type="button"
                  onClick={handlePlayImported}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-color)] hover:brightness-110 text-white font-black text-xs tracking-normal flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Play size={14} className="fill-current" />
                  <span>Play Playlist</span>
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
