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
  const { likedSongs, playlists, createPlaylist } = useLibrary();

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  // First group per Section 6: Home, Explore, Music flow, Library, Listen together
  const primaryNavItems = [
    { id: 'home' as NavTab, label: 'Home', icon: <Home size={18} strokeWidth={1.5} />, action: () => onTabChange('home') },
    { id: 'explore' as NavTab, label: 'Explore', icon: <Compass size={18} strokeWidth={1.5} />, action: () => onTabChange('explore') },
    { id: 'musicflow' as NavTab, label: 'Music flow', icon: <Flame size={18} strokeWidth={1.5} />, action: () => onTabChange('musicflow') },
    { id: 'library' as NavTab, label: 'Library', icon: <Library size={18} strokeWidth={1.5} />, action: () => onTabChange('library') },
    ...(onOpenListenTogether ? [{ id: 'listen_together' as const, label: 'Listen together', icon: <Users size={18} strokeWidth={1.5} />, action: onOpenListenTogether }] : [])
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-full shrink-0 rounded-2xl bg-[var(--bg-card)] border border-[var(--hairline)] p-3 text-[var(--text-1)] select-none z-20 overflow-hidden min-h-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--accent)]">
          <img src="/icons/musify-icon.svg" alt="Musify" className="w-5 h-5 invert" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-medium tracking-tight leading-none text-[var(--text-1)]">Musify</h2>
          <span className="text-xs text-[var(--text-3)] block mt-0.5">Music player</span>
        </div>
      </div>

      {/* Quick Search Action */}
      <button
        onClick={onOpenSearch}
        className="w-full h-[36px] flex items-center gap-2.5 px-3 rounded-lg bg-[var(--bg-raised)] hover:bg-[#2c2c2f] border border-[var(--hairline)] text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors mb-3 active:scale-[0.98]"
      >
        <Search size={16} strokeWidth={1.5} />
        <span className="text-xs font-medium">Search</span>
      </button>

      {/* First group: rows 36px high, gap 2 (gap-[2px]) per Section 6 */}
      <nav className="flex flex-col gap-[2px]">
        {primaryNavItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`h-[36px] flex items-center gap-2.5 px-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-[var(--bg-raised)] text-[var(--text-1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-[var(--hairline)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-raised)]'
              }`}
            >
              <span className="text-[var(--text-2)] shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Section label: 24 above and 8 below per Section 6 (mt-6 mb-2) */}
      <div className="mt-6 mb-2 flex items-center justify-between px-3">
        <span className="text-xs font-medium text-[var(--text-3)]">Playlists</span>
        <button
          onClick={handleCreatePlaylist}
          className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors p-1"
          title="Create playlist"
          aria-label="Create playlist"
        >
          <PlusCircle size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Playlists List */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-[2px]">
        {/* Liked songs row: 36px high */}
        <button
          onClick={() => onTabChange('library')}
          className="h-[36px] flex items-center gap-2.5 px-3 rounded-lg text-left text-sm font-medium text-[var(--text-2)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)] transition-colors"
        >
          <Heart size={16} strokeWidth={1.5} className="fill-[var(--accent)] text-[var(--accent)] shrink-0" />
          <span className="truncate text-xs">Liked songs</span>
          <span className="ml-auto text-xs text-[var(--text-3)] tabular-nums">{likedSongs.length}</span>
        </button>

        {/* Custom Playlists: 36px high */}
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onTabChange('library')}
            className="h-[36px] flex items-center gap-2.5 px-3 rounded-lg text-left text-sm font-medium text-[var(--text-2)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)] transition-colors truncate"
          >
            <span className="truncate text-xs">{pl.name}</span>
          </button>
        ))}
      </div>

      {/* Bottom links: rows 36px high, gap 2 */}
      <div className="pt-3 mt-auto border-t border-[var(--hairline)] flex flex-col gap-[2px]">
        {onOpenEqualizer && (
          <button
            onClick={onOpenEqualizer}
            className="h-[36px] flex items-center gap-2.5 px-3 rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-raised)] transition-colors text-xs font-medium"
          >
            <Sliders size={16} strokeWidth={1.5} />
            <span>Equalizer</span>
          </button>
        )}

        {onOpenStats && (
          <button
            onClick={onOpenStats}
            className="h-[36px] flex items-center gap-2.5 px-3 rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-raised)] transition-colors text-xs font-medium"
          >
            <BarChart2 size={16} strokeWidth={1.5} />
            <span>Listening stats</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="h-[36px] flex items-center gap-2.5 px-3 rounded-lg text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-raised)] transition-colors text-xs font-medium"
        >
          <Settings size={16} strokeWidth={1.5} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
