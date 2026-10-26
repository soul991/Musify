import React, { useState, useEffect, Suspense, lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LibraryProvider, UserPlaylist, useLibrary } from './context/LibraryContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/navigation/Sidebar';
import { FloatingNavBar, NavTab } from './components/navigation/FloatingNavBar';
import { TopBar } from './components/navigation/TopBar';
import { DesktopDockPlayer } from './components/player/DesktopDockPlayer';
import { NowPlayingCompanion } from './components/player/NowPlayingCompanion';
import { FullPlayer } from './components/player/FullPlayer';
import { OfflineBanner } from './components/common/OfflineBanner';

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
    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#E5303D] animate-spin" />
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
  const { currentTrack, togglePlay, nextTrack, prevTrack, seek, currentTime, duration, volume, setVolume } = usePlayer();
  const { toggleLike } = useLibrary();

  const [viewHistory, setViewHistory] = useState<ViewMode[]>([{ type: 'tab', tab: 'home' }]);
  const [isCompanionOpen, setIsCompanionOpen] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (typeof window !== 'undefined' && !sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Global Keyboard Shortcuts (Space, ArrowRight/Left, M, L, /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) nextTrack();
        else seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) prevTrack();
        else seek(Math.max(0, currentTime - 5));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setVolume(volume > 0 ? 0 : 1);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (currentTrack) toggleLike(currentTrack);
      } else if (e.key === '/') {
        e.preventDefault();
        setViewHistory((prev) => [...prev, { type: 'search' }]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, currentTime, duration, volume, togglePlay, seek, nextTrack, prevTrack, setVolume, toggleLike]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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
    <div className="flex h-full w-full overflow-hidden bg-[#0A0A0A] p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 md:gap-4 relative text-white select-none transition-colors duration-700 min-h-0">
      {/* Ambient Blurred Crossfade Orbs (10-18% opacity) */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[140px] opacity-15 transition-all duration-700"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[620px] h-[620px] rounded-full blur-[160px] opacity-12 transition-all duration-700"
        style={{ backgroundColor: colors.secondary || '#B8222E' }}
      />

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

      {/* 2. Main Center Audio Canvas (glass-panel, 28px radius) */}
      <div className="flex-1 rounded-[28px] glass-panel overflow-hidden relative flex flex-col h-full min-h-0 z-10">
        {/* TopBar on Explore / Library tabs */}
        {currentView.type === 'tab' && (currentView.tab === 'explore' || currentView.tab === 'library') && (
          <TopBar
            title={getPageTitle()}
            canGoBack={false}
            onOpenSearch={() => pushView({ type: 'search' })}
            onOpenSettings={() => pushView({ type: 'settings' })}
          />
        )}

        <main className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          <Suspense fallback={<ViewLoader />}>
            {renderActiveView()}
          </Suspense>
        </main>

        {/* Desktop Persistent Audio Dock Bar at bottom of canvas */}
        <DesktopDockPlayer
          onOpenListenTogether={() => pushView({ type: 'listen_together' })}
          isCompanionOpen={isCompanionOpen}
          onToggleCompanion={() => setIsCompanionOpen(!isCompanionOpen)}
        />
      </div>

      {/* 3. Right Live Companion Stage (w-[400px], hidden xl:flex) */}
      {isCompanionOpen && (
        <NowPlayingCompanion
          onClose={() => setIsCompanionOpen(false)}
          className="hidden xl:flex"
        />
      )}

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

      {/* Real-time Network Connectivity Offline Banner */}
      <OfflineBanner />

      {/* PWA Standalone Install Prompt */}
      {showInstallPrompt && installPrompt && (
        <div className="fixed bottom-24 sm:bottom-6 left-6 z-[110] bg-[#1A1A1A]/95 border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-xl bg-[#E5303D] flex items-center justify-center font-black text-white text-xs">
            M
          </div>
          <div className="text-xs">
            <p className="font-bold text-white">Install Musify App</p>
            <p className="text-white/50 text-[10px]">Faster loading & offline playback</p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={async () => {
                if (installPrompt) {
                  installPrompt.prompt();
                  await installPrompt.userChoice;
                  setInstallPrompt(null);
                  setShowInstallPrompt(false);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[#E5303D] hover:bg-[#B8222E] text-white font-bold text-xs transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => {
                setShowInstallPrompt(false);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('pwa_prompt_dismissed', 'true');
                }
              }}
              className="p-1 text-white/40 hover:text-white"
              aria-label="Dismiss install prompt"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <LibraryProvider>
          <PlayerProvider>
            <MotionConfig reducedMotion="user">
              <MusifyMain />
            </MotionConfig>
          </PlayerProvider>
        </LibraryProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
