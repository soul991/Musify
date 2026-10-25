import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LibraryProvider, UserPlaylist } from './context/LibraryContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/navigation/Sidebar';
import { FloatingNavBar, NavTab } from './components/navigation/FloatingNavBar';
import { TopBar } from './components/navigation/TopBar';
import { FullPlayer } from './components/player/FullPlayer';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { Settings } from './pages/Settings';
import { MusicFlowView } from './components/musicflow/MusicFlowView';
import { AlbumView } from './pages/AlbumView';
import { ArtistView } from './pages/ArtistView';
import { PlaylistView } from './pages/PlaylistView';
import { StatsView } from './pages/StatsView';
import { HistoryView } from './pages/HistoryView';
import { EqualizerView } from './pages/EqualizerView';
import { ListenTogetherView } from './pages/ListenTogetherView';

type ViewMode =
  | { type: 'tab'; tab: NavTab }
  | { type: 'search' }
  | { type: 'settings' }
  | { type: 'stats' }
  | { type: 'history' }
  | { type: 'equalizer' }
  | { type: 'listen_together' }
  | { type: 'album'; id: string }
  | { type: 'artist'; id: string }
  | { type: 'playlist'; id?: string; customPlaylist?: UserPlaylist };

const MusifyMain: React.FC = () => {
  const { colors } = useTheme();
  const [viewHistory, setViewHistory] = useState<ViewMode[]>([{ type: 'tab', tab: 'home' }]);

  const currentView = viewHistory[viewHistory.length - 1];

  const pushView = (view: ViewMode) => {
    setViewHistory((prev) => [...prev, view]);
  };

  const popView = () => {
    if (viewHistory.length > 1) {
      setViewHistory((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setViewHistory([{ type: 'tab', tab }]);
  };

  const getPageTitle = (): string => {
    switch (currentView.type) {
      case 'tab':
        if (currentView.tab === 'home') return 'Musify';
        if (currentView.tab === 'explore') return 'Explore';
        if (currentView.tab === 'musicflow') return 'Music Flow';
        if (currentView.tab === 'library') return 'Library';
        return 'Musify';
      case 'search':
        return 'Search';
      case 'settings':
        return 'Settings';
      case 'stats':
        return 'Statistics';
      case 'history':
        return 'History';
      case 'equalizer':
        return 'Equalizer';
      case 'listen_together':
        return 'Listen Together';
      case 'album':
        return 'Album';
      case 'artist':
        return 'Artist';
      case 'playlist':
        return 'Playlist';
      default:
        return 'Musify';
    }
  };

  const renderActiveView = () => {
    switch (currentView.type) {
      case 'tab':
        if (currentView.tab === 'home') {
          return (
            <Home
              onSelectAlbum={(id) => pushView({ type: 'album', id })}
              onSelectArtist={(id) => pushView({ type: 'artist', id })}
              onSelectPlaylist={(id) => pushView({ type: 'playlist', id })}
              onOpenSearch={() => pushView({ type: 'search' })}
              onOpenSettings={() => pushView({ type: 'settings' })}
              onOpenHistory={() => pushView({ type: 'history' })}
              onOpenStats={() => pushView({ type: 'stats' })}
              onOpenEqualizer={() => pushView({ type: 'equalizer' })}
              onOpenListenTogether={() => pushView({ type: 'listen_together' })}
            />
          );
        }
        if (currentView.tab === 'explore') {
          return (
            <Explore
              onSelectAlbum={(id) => pushView({ type: 'album', id })}
              onSelectPlaylist={(id) => pushView({ type: 'playlist', id })}
            />
          );
        }
        if (currentView.tab === 'musicflow') {
          return (
            <MusicFlowView
              onSelectArtist={(id) => pushView({ type: 'artist', id })}
              onBackToHome={() => handleTabChange('home')}
            />
          );
        }
        if (currentView.tab === 'library') {
          return (
            <Library
              onSelectPlaylistDetails={(customPlaylist) =>
                pushView({ type: 'playlist', customPlaylist })
              }
            />
          );
        }
        return null;

      case 'search':
        return (
          <Search
            onBack={popView}
            onSelectAlbum={(id) => pushView({ type: 'album', id })}
            onSelectArtist={(id) => pushView({ type: 'artist', id })}
            onSelectPlaylist={(id) => pushView({ type: 'playlist', id })}
          />
        );

      case 'settings':
        return <Settings onClose={popView} />;

      case 'stats':
        return (
          <StatsView
            onBack={popView}
            onSelectArtist={(id) => pushView({ type: 'artist', id })}
          />
        );

      case 'history':
        return <HistoryView onBack={popView} />;

      case 'equalizer':
        return <EqualizerView onBack={popView} />;

      case 'listen_together':
        return <ListenTogetherView onBack={popView} />;

      case 'album':
        return <AlbumView albumId={currentView.id} onBack={popView} />;

      case 'artist':
        return (
          <ArtistView
            artistId={currentView.id}
            onBack={popView}
            onSelectAlbum={(id) => pushView({ type: 'album', id })}
          />
        );

      case 'playlist':
        return (
          <PlaylistView
            playlistId={currentView.id}
            customPlaylist={currentView.customPlaylist}
            onBack={popView}
          />
        );

      default:
        return null;
    }
  };

  const activeNavTab: NavTab = currentView.type === 'tab' ? currentView.tab : 'home';
  const canGoBack = viewHistory.length > 1;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-white transition-colors duration-700"
      style={{ background: colors.gradientBackground }}
    >
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeNavTab}
        onTabChange={handleTabChange}
        onOpenSearch={() => pushView({ type: 'search' })}
        onOpenSettings={() => pushView({ type: 'settings' })}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TopBar rendered on top-level tabs that don't have their own navigation header (Explore, Library) */}
        {currentView.type === 'tab' && (currentView.tab === 'explore' || currentView.tab === 'library') && (
          <TopBar
            title={getPageTitle()}
            canGoBack={false}
            onOpenSearch={() => pushView({ type: 'search' })}
            onOpenSettings={() => pushView({ type: 'settings' })}
          />
        )}

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderActiveView()}
        </main>

        {/* Floating Bottom Bar with Docked Accessory MiniPlayer (Echo Music AppFloatingNavBar.kt) */}
        <FloatingNavBar
          activeTab={activeNavTab}
          onTabChange={handleTabChange}
          onOpenSearch={() => pushView({ type: 'search' })}
          isSearchActive={currentView.type === 'search'}
          isHidden={
            (currentView.type === 'tab' && currentView.tab === 'musicflow') ||
            currentView.type === 'settings' ||
            currentView.type === 'stats'
          }
        />

        {/* Fullscreen Player Modal */}
        <FullPlayer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <PlayerProvider>
          <MusifyMain />
        </PlayerProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
