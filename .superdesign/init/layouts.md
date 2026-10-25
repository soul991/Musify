# Musify Layout Components

## TopBar
File: `src/components/navigation/TopBar.tsx`
Description: Sticky top application bar with brand mark, page title, search shortcut, and settings button.

```tsx
import React from 'react';
import { Search, Settings, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopBarProps {
  title?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  canGoBack,
  onGoBack,
  onOpenSearch,
  onOpenSettings
}) => {
  const { colors } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 pt-safe bg-[#0B0B0C]/70 backdrop-blur-2xl border-b border-white/10 select-none">
      <div className="flex items-center gap-3">
        {canGoBack && onGoBack ? (
          <button
            onClick={onGoBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/10"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md md:hidden"
              style={{ backgroundColor: colors.primary }}
            >
              <img src="/icons/musify-icon.svg" alt="Musify" className="w-5 h-5 invert" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              {title || 'Musify'}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/10 text-white/80 hover:text-white"
          title="Search"
        >
          <Search size={18} />
        </button>

        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/10 text-white/80 hover:text-white"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
```

---

## Sidebar (Desktop)
File: `src/components/navigation/Sidebar.tsx`
Description: Collapsible desktop sidebar with brand mark, search launcher, core tabs, and quick playlist shortcuts.

```tsx
import React from 'react';
import { Home, Compass, Flame, Library, Search, Settings, Heart, PlusCircle } from 'lucide-react';
import { NavTab } from './FloatingNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useLibrary } from '../../context/LibraryContext';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenSettings
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
    { id: 'home' as NavTab, label: 'Home', icon: <Home size={20} /> },
    { id: 'explore' as NavTab, label: 'Explore', icon: <Compass size={20} /> },
    { id: 'musicflow' as NavTab, label: 'Music Flow', icon: <Flame size={20} /> },
    { id: 'library' as NavTab, label: 'Library', icon: <Library size={20} /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen shrink-0 border-r border-white/10 p-5 bg-[#0e0e12]/80 backdrop-blur-2xl text-white select-none">
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <img src="/icons/musify-icon.svg" alt="Musify" className="w-6 h-6 invert" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Musify</h2>
          <span className="text-[10px] tracking-widest font-semibold uppercase text-white/40">Liquid Audio</span>
        </div>
      </div>

      <button
        onClick={onOpenSearch}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all mb-6 active:scale-98"
      >
        <Search size={18} />
        <span className="text-sm font-medium">Search songs, artists...</span>
      </button>

      <div className="flex flex-col gap-1 mb-8">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-semibold ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/15 font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span style={{ color: isActive ? colors.primary : undefined }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">My Music</span>
          <button
            onClick={handleCreatePlaylist}
            className="text-white/50 hover:text-white transition-colors"
            title="Create Playlist"
          >
            <PlusCircle size={16} />
          </button>
        </div>

        <button
          onClick={() => onTabChange('library')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0">
            <Heart size={14} className="fill-white text-white" />
          </div>
          <div className="truncate">
            <p className="truncate">Liked Songs</p>
            <p className="text-[10px] text-white/40">{likedSongs.length} tracks</p>
          </div>
        </button>

        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onTabChange('library')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all truncate"
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white/60">{pl.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="truncate">{pl.name}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
```
