import React from 'react';
import {
  Home,
  Compass,
  Flame,
  Library,
  Search,
  Settings,
  Heart,
  PlusCircle,
  Users,
  Sliders,
  BarChart2
} from 'lucide-react';
import { NavTab } from './FloatingNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useLibrary } from '../../context/LibraryContext';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenListenTogether?: () => void;
  onOpenEqualizer?: () => void;
  onOpenStats?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenSettings,
  onOpenListenTogether,
  onOpenEqualizer,
  onOpenStats
}) => {
  const { colors } = useTheme();
  const { likedSongs, playlists, createPlaylist } = useLibrary();

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: <Home size={19} /> },
    { id: 'explore' as NavTab, label: 'Explore', icon: <Compass size={19} /> },
    { id: 'musicflow' as NavTab, label: 'Music Flow', icon: <Flame size={19} /> },
    { id: 'library' as NavTab, label: 'Library', icon: <Library size={19} /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-full shrink-0 rounded-[28px] glass-panel p-4 text-white select-none z-20 overflow-hidden min-h-0">
      {/* Brand Logo & Identity */}
      <div className="flex items-center gap-3 px-2 py-2 mb-4">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-[#E5303D]/25 shrink-0 bg-[#E5303D]"
        >
          <img src="/icons/musify-icon.svg" alt="Musify" className="w-6 h-6 invert" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight leading-none">Musify</h2>
          <span className="text-[10px] tracking-widest font-bold uppercase text-white/40 block mt-1">
            Liquid Audio
          </span>
        </div>
      </div>

      {/* Quick Search Action */}
      <button
        onClick={onOpenSearch}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white/60 hover:text-white transition-all mb-4 active:scale-98"
      >
        <Search size={16} />
        <span className="text-xs font-semibold">Search tracks...</span>
      </button>

      {/* Core Navigation Links */}
      <div className="flex flex-col gap-1 mb-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all duration-200 text-sm font-semibold group ${
                isActive
                  ? 'bg-white/[0.12] text-white shadow-sm border border-white/15 font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span
                className="transition-colors duration-200"
                style={{ color: isActive ? '#E5303D' : undefined }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>

              {/* Glowing Ruby Active Beacon */}
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-4 rounded-full shadow-[0_0_8px_#E5303D] bg-[#E5303D]"
                />
              )}
            </button>
          );
        })}

        {/* Listen Together Shortcut */}
        {onOpenListenTogether && (
          <button
            onClick={onOpenListenTogether}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200 text-sm font-semibold group"
            title="Listen Together - Cross-device sync"
          >
            <span className="text-white/60 group-hover:text-white shrink-0">
              <Users size={18} />
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span>Listen Together</span>
              <span className="text-[10px] text-amber-400 font-bold">Live Room</span>
            </div>
            <span className="ml-auto flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5303D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5303D]"></span>
            </span>
          </button>
        )}
      </div>

      {/* Playlists & Collections */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">My Music</span>
          <button
            onClick={handleCreatePlaylist}
            className="text-white/50 hover:text-white transition-colors p-1"
            title="Create Playlist"
            aria-label="Create Playlist"
          >
            <PlusCircle size={15} />
          </button>
        </div>

        {/* Liked Songs Shortcut */}
        <button
          onClick={() => onTabChange('library')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0 shadow-sm">
            <Heart size={13} className="fill-white text-white" />
          </div>
          <div className="truncate">
            <p className="truncate text-xs font-bold">Liked Songs</p>
            <p className="text-[10px] text-white/40">{likedSongs.length} tracks</p>
          </div>
        </button>

        {/* Custom Playlists */}
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onTabChange('library')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all truncate"
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white/60">{pl.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="truncate text-xs">{pl.name}</span>
          </button>
        ))}
      </div>

      {/* Audio Tools & Settings Bottom Links */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-1">
        {onOpenEqualizer && (
          <button
            onClick={onOpenEqualizer}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
          >
            <Sliders size={16} />
            <span>Equalizer</span>
          </button>
        )}

        {onOpenStats && (
          <button
            onClick={onOpenStats}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
          >
            <BarChart2 size={16} />
            <span>Listening Stats</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
