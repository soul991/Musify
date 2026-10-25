# Musify Application Route & View Mapping

Musify utilizes a single-page view-stack navigation architecture managed by `App.tsx` (`currentView`, `pushView`, `popView`) ensuring responsive, fluid mobile-app style transitions across desktop and mobile.

## Top-Level Navigation Tabs

| Tab ID | Component | Layout Used | Description |
| :--- | :--- | :--- | :--- |
| `home` | `src/pages/Home.tsx` | `FloatingNavBar` (mobile), `Sidebar` (desktop) | Dynamic time-of-day greeting, 5 header actions, 10 mood chips, 5-slide hero carousel, 4-row Quick Picks & Forgotten Favorites grids, Community Playlists. |
| `explore` | `src/pages/Explore.tsx` | `TopBar` + `FloatingNavBar` / `Sidebar` | 8 Moods & Genres Bento tiles, Billboard Trending Charts with #1-#20 rank badges, New Album Releases carousel. |
| `musicflow` | `src/components/musicflow/MusicFlowView.tsx` | Fullscreen immersive (nav hidden) | TikTok/Reels vertical swipe discovery feed, 2-line live synced lyrics, center play glyph, right action rail, bottom continuous scrubber. |
| `library` | `src/pages/Library.tsx` | `TopBar` + `FloatingNavBar` / `Sidebar` | Filter chips (All, Playlists, Favorites, Offline), Recently Added sort, 4 quick access cards, Playlists list, dynamically elevated FAB (`bottom-44`). |

## Sub-Views (Stack Navigation)

| View Type | Component | Navigation Affordance | Description |
| :--- | :--- | :--- | :--- |
| `search` | `src/pages/Search.tsx` | Fullscreen with Search Input & Voice Recognition | Search suggestions, instant query results, filtered tabs (All, Songs, Albums, Artists, Playlists). |
| `settings` | `src/pages/Settings.tsx` | Top Back Arrow (Nav bar hidden) | Theme accent picker, pure black AMOLED switch, player layout toggle, liquid glass blur, lyrics timing offset, audio bitrate preferences. |
| `history` | `src/pages/HistoryView.tsx` | Top Back Arrow | Chronological listening timeline with relative timestamps, batch play-all queue, clear history action. |
| `stats` | `src/pages/StatsView.tsx` | Top Back Arrow (Nav bar hidden) | Total listening hours, unique songs/artists counts, period filter chips (1W..All Time), Top Songs and Artists leaderboards. |
| `equalizer` | `src/pages/EqualizerView.tsx` | Top Back Arrow | 5-band Web Audio API biquad filter graphic EQ, 9 audio genre presets, bass boost dial. |
| `listen_together` | `src/pages/ListenTogetherView.tsx` | Top Back Arrow | 6-char room code generation, custom nickname, multi-tab `BroadcastChannel` real-time audio sync. |
| `album` | `src/pages/AlbumView.tsx` | Parallax Header + Back Arrow | High-res album artwork hero, artist link, full track list with duration and play count. |
| `artist` | `src/pages/ArtistView.tsx` | Parallax Header + Back Arrow | Artist banner, subscriber count, Top Tracks list, Albums discography, related artists. |
| `playlist` | `src/pages/PlaylistView.tsx` | Parallax Header + Back Arrow | Custom playlist banner, track list, reorder/delete, share action. |
