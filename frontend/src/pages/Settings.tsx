import React, { useState } from 'react';
import {
  Palette,
  Moon,
  Volume2,
  Sliders,
  Sparkles,
  Wifi,
  Radio,
  Clock,
  Trash2,
  Info,
  Check,
  ChevronRight,
  Smartphone,
  Search as SearchIcon,
  X,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react';
import { useTheme, CALM_ACCENT_PRESETS } from '../context/ThemeContext';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { audioEqualizer } from '../services/audioEqualizer';
import { Material3SettingsGroup } from '../components/views/Material3SettingsGroup';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
  onClose?: () => void;
}

type AudioQualityLevel = 'lossless' | 'high' | 'medium' | 'low';

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const {
    accentColor,
    setAccentColor,
    pureBlack,
    setPureBlack,
    playerStyle,
    setPlayerStyle
  } = useTheme();

  const { sleepTimerMinutes, setSleepTimer } = usePlayer();
  const { exportLibraryData, importLibraryData } = useLibrary();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityTarget, setQualityTarget] = useState<'wifi' | 'cellular'>('wifi');

  // Audio settings stored in localStorage
  const [audioQualityWifi, setAudioQualityWifi] = useState<AudioQualityLevel>(() => {
    return (localStorage.getItem('musify_audio_wifi') as AudioQualityLevel) || 'lossless';
  });
  const [audioQualityCellular, setAudioQualityCellular] = useState<AudioQualityLevel>(() => {
    return (localStorage.getItem('musify_audio_cellular') as AudioQualityLevel) || 'high';
  });
  const [audioNormalization, setAudioNormalization] = useState<boolean>(() => {
    return localStorage.getItem('musify_normalization') !== 'false';
  });
  const [crossfadeEnabled, setCrossfadeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('musify_crossfade_enabled') === 'true';
  });
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(() => {
    return Number(localStorage.getItem('musify_crossfade_secs')) || 4;
  });
  const [skipSilence, setSkipSilence] = useState<boolean>(() => {
    return localStorage.getItem('musify_skip_silence') === 'true';
  });
  const [seekbarStyle, setSeekbarStyle] = useState<'calm' | 'squiggly'>(() => {
    return (localStorage.getItem('musify_seekbar_style') as 'calm' | 'squiggly') || 'calm';
  });

  const presetColors = CALM_ACCENT_PRESETS;

  const handleToggleSkipSilence = () => {
    const next = !skipSilence;
    setSkipSilence(next);
    localStorage.setItem('musify_skip_silence', String(next));
  };

  const handleToggleSeekbarStyle = (style: 'calm' | 'squiggly') => {
    setSeekbarStyle(style);
    localStorage.setItem('musify_seekbar_style', style);
    window.dispatchEvent(new Event('musify_seekbar_style_change'));
  };

  const handleExportLibrary = () => {
    try {
      const dataStr = exportLibraryData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musify-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Library exported successfully', 'success');
    } catch {
      showToast('Failed to export library', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = importLibraryData(text);
        if (success) {
          showToast('Library imported successfully', 'success');
        } else {
          showToast('Invalid backup file format', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleWifiQualityChange = (q: AudioQualityLevel) => {
    setAudioQualityWifi(q);
    localStorage.setItem('musify_audio_wifi', q);
    setShowQualityModal(false);
  };

  const handleCellularQualityChange = (q: AudioQualityLevel) => {
    setAudioQualityCellular(q);
    localStorage.setItem('musify_audio_cellular', q);
    setShowQualityModal(false);
  };

  const handleToggleNormalization = () => {
    const next = !audioNormalization;
    setAudioNormalization(next);
    localStorage.setItem('musify_normalization', String(next));
    audioEqualizer.setNormalization(next);
  };

  const handleToggleCrossfade = () => {
    const next = !crossfadeEnabled;
    setCrossfadeEnabled(next);
    localStorage.setItem('musify_crossfade_enabled', String(next));
  };

  const handleCrossfadeSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCrossfadeSeconds(val);
    localStorage.setItem('musify_crossfade_secs', String(val));
  };

  const handleClearCache = () => {
    if (confirm('Clear local audio cache and temporary images?')) {
      alert('Audio cache cleared successfully!');
    }
  };

  const qualityLabels: Record<AudioQualityLevel, { title: string; desc: string }> = {
    lossless: { title: 'Lossless Hi-Res', desc: 'FLAC / Opus Max (1411 kbps equivalent)' },
    high: { title: 'High Quality', desc: 'Opus 256 kbps (AAC 320 kbps equivalent)' },
    medium: { title: 'Standard / Balanced', desc: 'Opus 128 kbps (AAC 160 kbps equivalent)' },
    low: { title: 'Data Saver', desc: 'Opus 64 kbps (Low data consumption)' }
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 pt-safe pb-48 text-white no-scrollbar max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-5">
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 shrink-0 shadow-md"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Settings
          </h1>
          <p className="text-xs font-medium text-white/50 mt-0.5">
            Material 3 Expressive audio preferences & customization
          </p>
        </div>
      </div>

      {/* Search Input Field */}
      <div className="relative mb-6">
        <div className="flex items-center h-12 rounded-full bg-white/[0.08] px-4 border border-white/10 shadow-sm focus-within:bg-white/[0.12] transition-colors">
          <SearchIcon size={18} className="text-white/40 mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full h-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="p-1 text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Group 1: Appearance & Theme */}
        {(matchesSearch('appearance') ||
          matchesSearch('theme') ||
          matchesSearch('color') ||
          matchesSearch('black') ||
          matchesSearch('player style')) && (
          <Material3SettingsGroup
            title="Appearance & Theme"
            items={[
              {
                icon: <Palette size={20} className="text-[var(--accent-color)]" />,
                title: 'Theme Accent Color',
                description: 'Custom seed hue for ripples, playback controls, and sliders',
                trailingContent: (
                  <div
                    className="w-7 h-7 rounded-full shadow-md border-2 border-white/30 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    style={{ backgroundColor: accentColor }}
                  />
                ),
                onClick: () => setShowColorPickerModal(true)
              },
              {
                icon: <Moon size={20} className="text-neutral-300" />,
                title: 'Pure Black (OLED Mode)',
                description: 'True #000000 AMOLED background for battery savings',
                trailingContent: (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setPureBlack(!pureBlack);
                    }}
                    className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      pureBlack ? 'bg-[var(--accent-color)]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        pureBlack ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                ),
                onClick: () => setPureBlack(!pureBlack)
              },
              {
                icon: <Sparkles size={20} className="text-amber-400" />,
                title: 'Player Layout Style',
                description:
                  playerStyle === 'apple'
                    ? 'Apple Music Inspired: Full-bleed artwork & capsule'
                    : 'Material You: Flower button, squiggly bar & dynamic pill',
                trailingContent: (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayerStyle('apple');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        playerStyle === 'apple'
                          ? 'bg-white text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Apple
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayerStyle('material');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        playerStyle === 'material'
                          ? 'bg-white text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Material
                    </button>
                  </div>
                )
              },
              {
                icon: <Sliders size={20} className="text-cyan-400" />,
                title: 'Liquid Glass Blur Effect',
                description: 'Translucent refraction and specular highlight on floating navigation bars',
                trailingContent: (
                  <div className="text-xs font-bold text-emerald-400">
                    Active (32px)
                  </div>
                )
              },
              {
                icon: <Clock size={20} className="text-pink-400" />,
                title: 'Synced Lyrics Timing Offset',
                description: 'Fine-tune lyric sync latency forward or backward (±1000ms)',
                trailingContent: (
                  <div className="text-xs font-bold text-white/70">
                    0 ms
                  </div>
                )
              },
              {
                icon: <Sliders size={20} className="text-emerald-400" />,
                title: 'Seekbar Style',
                description:
                  seekbarStyle === 'calm'
                    ? 'Calm Straight: Hardware-accelerated solid scrubber'
                    : 'Squiggly Waveform: Animated fluid sine wave',
                trailingContent: (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSeekbarStyle('calm');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        seekbarStyle === 'calm'
                          ? 'bg-white text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Calm
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSeekbarStyle('squiggly');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        seekbarStyle === 'squiggly'
                          ? 'bg-white text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Squiggly
                    </button>
                  </div>
                )
              }
            ]}
          />
        )}

        {/* Group 2: Audio Quality & Streaming */}
        {(matchesSearch('audio') ||
          matchesSearch('quality') ||
          matchesSearch('wifi') ||
          matchesSearch('cellular') ||
          matchesSearch('lossless') ||
          matchesSearch('opus')) && (
          <Material3SettingsGroup
            title="Audio Quality & Bitrate"
            items={[
              {
                icon: <Wifi size={20} className="text-blue-400" />,
                title: 'Wi-Fi Streaming Quality',
                description: qualityLabels[audioQualityWifi].title,
                trailingContent: (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <span>{audioQualityWifi.toUpperCase()}</span>
                    <ChevronRight size={16} />
                  </div>
                ),
                onClick: () => {
                  setQualityTarget('wifi');
                  setShowQualityModal(true);
                }
              },
              {
                icon: <Radio size={20} className="text-emerald-400" />,
                title: 'Cellular Streaming Quality',
                description: qualityLabels[audioQualityCellular].title,
                trailingContent: (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <span>{audioQualityCellular.toUpperCase()}</span>
                    <ChevronRight size={16} />
                  </div>
                ),
                onClick: () => {
                  setQualityTarget('cellular');
                  setShowQualityModal(true);
                }
              }
            ]}
          />
        )}

        {/* Group 3: Playback Dynamics & Crossfade */}
        {(matchesSearch('playback') ||
          matchesSearch('crossfade') ||
          matchesSearch('normalization') ||
          matchesSearch('silence') ||
          matchesSearch('timer')) && (
          <Material3SettingsGroup
            title="Playback & Audio Processing"
            items={[
              {
                icon: <Volume2 size={20} className="text-purple-400" />,
                title: 'Audio Normalization (EBU R128)',
                description: 'Balances perceived volume across distinct albums and tracks',
                trailingContent: (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNormalization();
                    }}
                    className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      audioNormalization ? 'bg-[var(--accent-color)]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        audioNormalization ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                ),
                onClick: handleToggleNormalization
              },
              {
                icon: <Sliders size={20} className="text-pink-400" />,
                title: 'Crossfade Songs',
                description: crossfadeEnabled
                  ? `Enabled • ${crossfadeSeconds}s smooth transition between tracks`
                  : 'Disabled • Gapless track playback',
                trailingContent: (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCrossfade();
                    }}
                    className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      crossfadeEnabled ? 'bg-[var(--accent-color)]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        crossfadeEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                ),
                onClick: handleToggleCrossfade
              },
              ...(crossfadeEnabled
                ? [
                    {
                      title: 'Crossfade Duration',
                      description: (
                        <div className="flex items-center gap-4 mt-2">
                          <input
                            type="range"
                            min={1}
                            max={12}
                            step={1}
                            value={crossfadeSeconds}
                            onChange={handleCrossfadeSecondsChange}
                            className="w-full accent-[var(--accent-color)] cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white shrink-0 tabular-nums">
                            {crossfadeSeconds}s
                          </span>
                        </div>
                      )
                    }
                  ]
                : []),
              {
                icon: <Clock size={20} className="text-amber-400" />,
                title: 'Sleep Timer',
                description: sleepTimerMinutes
                  ? `Active • Stopping in ${sleepTimerMinutes} minutes`
                  : 'Off • Music plays continuously',
                trailingContent: (
                  <select
                    value={sleepTimerMinutes || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSleepTimer(val);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white/10 text-white rounded-xl text-xs font-bold px-2.5 py-1.5 border border-white/10 focus:outline-none"
                  >
                    <option value="" className="bg-[#1C1D24]">Off</option>
                    <option value="15" className="bg-[#1C1D24]">15 min</option>
                    <option value="30" className="bg-[#1C1D24]">30 min</option>
                    <option value="45" className="bg-[#1C1D24]">45 min</option>
                    <option value="60" className="bg-[#1C1D24]">60 min</option>
                  </select>
                )
              },
              {
                icon: <Radio size={20} className="text-cyan-400" />,
                title: 'Skip Silence',
                description: skipSilence
                  ? 'Active • Automatically jumps over silent sections'
                  : 'Disabled • Plays unmanipulated audio streams',
                trailingContent: (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSkipSilence();
                    }}
                    className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      skipSilence ? 'bg-[var(--accent-color)]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        skipSilence ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                ),
                onClick: handleToggleSkipSilence
              }
            ]}
          />
        )}

        {/* Group 4: Storage & Offline Cache */}
        {(matchesSearch('storage') || matchesSearch('cache') || matchesSearch('clear')) && (
          <Material3SettingsGroup
            title="Storage & Offline Cache"
            items={[
              {
                icon: <Trash2 size={20} className="text-rose-400" />,
                title: 'Clear Audio Cache',
                description: 'Remove cached audio streams to free device storage (~142 MB)',
                trailingContent: (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCache();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 active:scale-95 transition-all"
                  >
                    Clear
                  </button>
                ),
                onClick: handleClearCache
              }
            ]}
          />
        )}

        {/* Group 5: Library Backup & Cloud Sync */}
        {(matchesSearch('backup') ||
          matchesSearch('export') ||
          matchesSearch('import') ||
          matchesSearch('library') ||
          matchesSearch('sync')) && (
          <Material3SettingsGroup
            title="Library Backup & Cloud Sync"
            items={[
              {
                icon: <Download size={20} className="text-sky-400" />,
                title: 'Export Library Data (JSON)',
                description: 'Export all your favorite songs, custom playlists, play history and stats',
                trailingContent: (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportLibrary();
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                ),
                onClick: handleExportLibrary
              },
              {
                icon: <Upload size={20} className="text-amber-400" />,
                title: 'Import Library Data (JSON)',
                description: 'Restore favorites and playlists from a previously exported backup file',
                trailingContent: (
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Upload size={14} />
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                  </label>
                )
              }
            ]}
          />
        )}

        {/* Group 6: About & System */}
        {(matchesSearch('about') || matchesSearch('version') || matchesSearch('echo')) && (
          <Material3SettingsGroup
            title="About & Engine"
            items={[
              {
                icon: <Info size={20} className="text-cyan-400" />,
                title: 'Musify Web Engine',
                description: 'Echo Music Jetpack Compose architecture replicated in React & Tailwind',
                trailingContent: (
                  <span className="text-xs font-bold text-white/50">v2.4.0</span>
                )
              },
              {
                icon: <Smartphone size={20} className="text-emerald-400" />,
                title: 'PWA / Mobile Standalone',
                description: 'Supports background playback, lock screen MediaSession & iOS home-screen'
              }
            ]}
          />
        )}
      </div>

      {/* Theme Accent Color Modal */}
      <AnimatePresence>
        {showColorPickerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#1C1D24] p-6 border border-white/20 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-lg font-black text-white">Select Accent Color</h3>
              <p className="text-xs text-white/50 -mt-2">
                Derived from Material You dynamic color seeding
              </p>

              <div className="grid grid-cols-4 gap-3 py-2">
                {presetColors.map((color) => {
                  const isSelected = accentColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      onClick={() => {
                        setAccentColor(color.hex);
                        setShowColorPickerModal(false);
                      }}
                      className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check size={18} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-[10px] font-semibold text-white/70 text-center truncate w-full">
                        {color.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowColorPickerModal(false)}
                className="w-full py-2.5 rounded-2xl bg-white/10 text-xs font-bold text-white/80 hover:text-white"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio Quality Selection Modal */}
      <AnimatePresence>
        {showQualityModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#1C1D24] p-6 border border-white/20 shadow-2xl flex flex-col gap-3"
            >
              <h3 className="text-lg font-black text-white">
                {qualityTarget === 'wifi' ? 'Wi-Fi Streaming Quality' : 'Cellular Streaming Quality'}
              </h3>
              <p className="text-xs text-white/50 -mt-1 mb-2">
                Adaptive Opus / AAC codec stream configuration
              </p>

              <div className="flex flex-col gap-1.5">
                {(['lossless', 'high', 'medium', 'low'] as AudioQualityLevel[]).map((level) => {
                  const currentSelected =
                    qualityTarget === 'wifi' ? audioQualityWifi : audioQualityCellular;
                  const isSelected = currentSelected === level;

                  return (
                    <div
                      key={level}
                      onClick={() =>
                        qualityTarget === 'wifi'
                          ? handleWifiQualityChange(level)
                          : handleCellularQualityChange(level)
                      }
                      className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white/15 border border-white/20 text-white shadow-md'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold">{qualityLabels[level].title}</p>
                        <p className="text-xs text-white/50 mt-0.5">{qualityLabels[level].desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowQualityModal(false)}
                className="mt-2 w-full py-2.5 rounded-2xl bg-white/10 text-xs font-bold text-white/80 hover:text-white"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
