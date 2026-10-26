import React, { useState, Suspense, lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LibraryProvider, UserPlaylist } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/navigation/Sidebar';
import { FloatingNavBar, NavTab } from './components/navigation/FloatingNavBar';
import { TopBar } from './components/navigation/TopBar';
import { DesktopDockPlayer } from './components/player/DesktopDockPlayer';
import { NowPlayingCompanion } from './components/player/NowPlayingCompanion';
import { FullPlayer } from './components/player/FullPlayer';

// Code-split page components with React.lazy
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Explore = lazy(() => import('./pages/Explore').then((m) => ({ default: m.Explore })));
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })));
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const MusicFlowView = lazy(() =>
  import('./components/musicflow/MusicFlowView').then((m) => ({ default: m.MusicFlowView }))
);
const AlbumView = lazy(() => import('./pages/AlbumView').then((m) => ({ default: m.AlbumView })));
const ArtistView = lazy(() => import('./pages/ArtistView').then((m) => ({ default: m.ArtistView })));
const PlaylistView = lazy(() => import('./pages/PlaylistView').then((m) => ({ default: m.PlaylistView })));
const StatsView = lazy(() => import('./pages/StatsView').then((m) => ({ default: m.StatsView })));
const HistoryView = lazy(() => import('./pages/HistoryView').then((m) => ({ default: m.HistoryView })));
const EqualizerView = lazy(() => import('./pages/EqualizerView').then((m) => ({ default: m.EqualizerView })));
const ListenTogetherView = lazy(() =>
  import('./pages/ListenTogetherView').then((m) => ({ default: m.ListenTogetherView }))
);

const ViewLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[var(--accent-color,#ED5564)] animate-spin" />
  </div>
);

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
  const [isCompanionOpen, setIsCompanionOpen] = useState(true);

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

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-white transition-colors duration-700"
      style={{ background: colors.gradientBackground }}
    >
      {/* 1. Left Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeNavTab}
        onTabChange={handleTabChange}
        onOpenSearch={() => pushView({ type: 'search' })}
        onOpenSettings={() => pushView({ type: 'settings' })}
        onOpenListenTogether={() => pushView({ type: 'listen_together' })}
        onOpenEqualizer={() => pushView({ type: 'equalizer' })}
        onOpenStats={() => pushView({ type: 'stats' })}
      />

      {/* 2. Main Center Audio Canvas & 3. Right Live Companion Stage */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TopBar on Explore / Library tabs */}
        {currentView.type === 'tab' && (currentView.tab === 'explore' || currentView.tab === 'library') && (
          <TopBar
            title={getPageTitle()}
            canGoBack={false}
            onOpenSearch={() => pushView({ type: 'search' })}
            onOpenSettings={() => pushView({ type: 'settings' })}
          />
        )}

        <div className="flex-1 flex flex-row h-full overflow-hidden relative">
          {/* Active View Container */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <Suspense fallback={<ViewLoader />}>
              {renderActiveView()}
            </Suspense>
          </main>

          {/* Right Live Companion Stage (3D Spinning Vinyl + Synchronized Karaoke Lyrics + Queue) */}
          {isCompanionOpen && (
            <NowPlayingCompanion
              onClose={() => setIsCompanionOpen(false)}
              className="hidden xl:flex"
            />
          )}
        </div>

        {/* Desktop Persistent Audio Dock Bar (Obsidian Liquid Glass Pill) */}
        <DesktopDockPlayer
          onOpenListenTogether={() => pushView({ type: 'listen_together' })}
          isCompanionOpen={isCompanionOpen}
          onToggleCompanion={() => setIsCompanionOpen(!isCompanionOpen)}
        />

        {/* Mobile Floating Bottom Bar with Docked MiniPlayer */}
        <FloatingNavBar
          className="md:hidden"
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
          <MotionConfig reducedMotion="user">
            <MusifyMain />
          </MotionConfig>
        </PlayerProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
