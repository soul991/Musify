# Musify Page Dependency Trees

## / (Home)
Entry: `src/pages/Home.tsx`
Dependencies:
- `src/components/navigation/TopBar.tsx`
- `src/components/navigation/FloatingNavBar.tsx`
  - `src/components/player/FloatingMiniPlayer.tsx`
- `src/components/player/FullPlayer.tsx`
  - `src/components/player/SquigglySlider.tsx`
  - `src/components/player/FlowerPlayButton.tsx`
  - `src/components/player/HeartBurstIcon.tsx`
  - `src/components/player/PlayerSyncedLyricsView.tsx`
  - `src/components/lyrics/SyncedLyricsView.tsx`
  - `src/components/player/QueueSheet.tsx`
- `src/components/views/ChipsRow.tsx`
- `src/context/PlayerContext.tsx`
- `src/context/ThemeContext.tsx`
- `src/context/LibraryContext.tsx`

## /explore (Explore & Charts)
Entry: `src/pages/Explore.tsx`
Dependencies:
- `src/components/navigation/TopBar.tsx`
- `src/components/navigation/FloatingNavBar.tsx`
- `src/context/PlayerContext.tsx`
- `src/context/ThemeContext.tsx`
- `src/services/api.ts`

## /musicflow (Music Flow Immersive Feed)
Entry: `src/components/musicflow/MusicFlowView.tsx`
Dependencies:
- `src/components/lyrics/SyncedLyricsView.tsx`
- `src/components/player/HeartBurstIcon.tsx`
- `src/context/PlayerContext.tsx`
- `src/context/ThemeContext.tsx`
- `src/context/LibraryContext.tsx`

## /library (User Archive & Playlists)
Entry: `src/pages/Library.tsx`
Dependencies:
- `src/components/navigation/TopBar.tsx`
- `src/components/navigation/FloatingNavBar.tsx`
- `src/components/views/AiPlaylistModal.tsx`
- `src/components/views/SpotifyImportModal.tsx`
- `src/components/views/TrackRow.tsx`
- `src/context/LibraryContext.tsx`
- `src/context/PlayerContext.tsx`

## /settings (Audio & Appearance Settings)
Entry: `src/pages/Settings.tsx`
Dependencies:
- `src/components/views/Material3SettingsGroup.tsx`
- `src/context/ThemeContext.tsx`
- `src/context/PlayerContext.tsx`

## /listen-together (Party Room & Sync)
Entry: `src/pages/ListenTogetherView.tsx`
Dependencies:
- `src/context/PlayerContext.tsx`
- `src/context/ThemeContext.tsx`
