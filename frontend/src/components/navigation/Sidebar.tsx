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
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--accent)]"
        >
          <img src="/icons/musify-icon.svg" alt="Musify" className="w-6 h-6 invert" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight leading-none">Musify</h2>
          <span className="text-xs text-[var(--text-3)] block mt-0.5">Music player</span>
        </div>
      </div>

      {/* Quick Search Action */}
      <button
        onClick={onOpenSearch}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white/60 hover:text-white transition-colors mb-4 active:scale-[0.98]"
      >
        <Search size={16} />
        <span className="text-xs font-semibold">Search</span>
      </button>

      {/* Core Navigation Links */}
      <div className="flex flex-col gap-1 mb-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-colors duration-200 text-sm font-semibold group ${
                isActive
                  ? 'bg-[var(--bg-raised)] text-[var(--text-1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-[var(--hairline)] font-medium'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-raised)]'
              }`}
            >
              <span
                className="transition-colors duration-200"
                style={{ color: isActive ? 'var(--accent)' : undefined }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>

              
            </button>
          );
        })}

        {/* Listen Together Shortcut */}
        {onOpenListenTogether && (
          <button
            onClick={onOpenListenTogether}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-white/60 hover:text-white hover:bg-[var(--bg-raised)] transition-colors duration-200 text-sm font-medium group"
            title="Listen Together - Cross-device sync"
          >
            <span className="text-white/60 group-hover:text-white shrink-0">
              <Users size={18} />
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span>Listen Together</span>
              <span className="text-[10px] text-[var(--text-3)] font-normal">Live room</span>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
          </button>
        )}
      </div>

      {/* Playlists & Collections */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-[var(--text-3)]">My music</span>
          <button
            onClick={handleCreatePlaylist}
            className="text-white/50 hover:text-white transition-colors p-1"
            title="Create Playlist"
            aria-label="Create Playlist"
          >
            <PlusCircle size={15} />
          </button>
        </div>

        {/* Liked songs Shortcut */}
        <button
          onClick={() => onTabChange('library')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-raised)] border border-[var(--hairline)] flex items-center justify-center shrink-0">
            <Heart size={13} className="fill-[var(--accent)] text-[var(--accent)]" />
          </div>
          <div className="truncate">
            <p className="truncate text-xs font-bold">Liked songs</p>
            <p className="text-[10px] text-[var(--text-3)]">{likedSongs.length} tracks</p>
          </div>
        </button>

        {/* Custom Playlists */}
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onTabChange('library')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors truncate"
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
          >
            <Sliders size={16} />
            <span>Equalizer</span>
          </button>
        )}

        {onOpenStats && (
          <button
            onClick={onOpenStats}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
          >
            <BarChart2 size={16} />
            <span>Listening stats</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
