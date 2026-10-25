# Musify — Liquid Glass Web Music Player & iOS PWA

**Musify** is a high-fidelity, standalone full-stack web music player meticulously engineered to mirror the exact design language, animations, transitions, and features of the **Echo Music** Android app.

Built for personal desktop, macOS, and iOS Safari usage, Musify features a pure **Liquid Glassmorphic** aesthetic (Nothing OS 5.0 + Apple Music styling), dynamic ambient backdrop meshes, an animated wavy waveform seekbar, interactive synced karaoke lyrics, TikTok/Resso-style vertical Music Flow discovery, and native iOS PWA support.

---

## 🌟 Key Features & Echo Music Anatomy

### 1. Liquid Glass & Nothing OS 5.0 Aesthetic
- **Translucent Glass Surfaces**: Deep multi-stage backdrop filter blur (`backdrop-blur-2xl`, `saturate-180`), subtle white specular borders (`border-white/10`), and pure OLED black options.
- **Dynamic Blurred Ambient Mesh**: Live color extraction from current album art rendering multi-layered floating radial gradient orbs that react and breathe with playback.
- **Adaptive Accent Theming**: Dynamic color palettes (Coral, Rose, Violet, Cyan, Emerald, Amber, OLED Black) that update throughout buttons, badges, and sliders.

### 2. Apple Music & Android 13/14 Player Interactions
- **Animated Squiggly Waveform Seekbar**: Fluid sine-wave seekbar rendered on HTML5 canvas with amplitude scaling when playing and flattening when paused, fully draggable with zero audio glitching.
- **Expanding Mini Player Pill**: Floating frosted bottom bar with album thumbnail, track metadata, and quick play/pause controls that smoothly spring-expands into the Full Player modal.
- **Interactive Synced Karaoke Lyrics**: Timed real-time lyrics powered by LRCLIB and YouTube timed captions fallback. Features active-line scaling, luminous glow, auto-centering scrolling, and tap-to-seek functionality.
- **Music Flow (Vertical Discovery Feed)**: Full-bleed TikTok/Resso-inspired continuous vertical swipe discovery with double-tap heart animations and celebratory particle bursts (`canvas-confetti`).
- **Slide-up Queue Sheet**: Bottom drawer for inspecting and managing upcoming tracks in the session queue.

### 3. Native iOS PWA & Lock Screen Controls
- **Standalone Display Mode**: Configured with `display: standalone` in `manifest.json` and iOS `apple-mobile-web-app-capable` meta tags to completely eliminate Safari navigation bars.
- **Safe Area Insets**: Handled via `viewport-fit=cover` and CSS `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` for iPhone Dynamic Island and home indicator bars.
- **Web Media Session API**: Full lock screen, Control Center, and Apple Watch / Dynamic Island playback metadata, play/pause/skip triggers, and live seek position updates.
- **Custom Apple Touch Icons**: Pre-rendered high-res squircles with specular reflections for the iOS Home Screen.

### 4. Zero-CORS Streaming Backend Proxy
- **Direct YouTube & YouTube Music Integration**: Leverages `youtubei.js` with an automated cipher/n-sig evaluation bridge for deciphering GoogleVideo streaming streams.
- **HTTP 206 Partial Content Streaming**: Native byte-range streaming proxy (`/api/stream/:videoId`) allowing iOS Safari `<audio>` and desktop browsers to scrub and buffer chunks without memory bloat or CORS restrictions.

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Windows (One-Click)
Double-click `start-musify.bat` in the root folder, or run:
```powershell
.\start-musify.bat
```
This automatically boots both the backend server (`:3001`) and the web frontend (`:3000`) in dedicated console windows.

### macOS & Linux
Make the startup script executable and run:
```bash
chmod +x start-musify.sh
./start-musify.sh
```

### Manual CLI Start
If you prefer running commands manually in separate terminal tabs:

1. **Start the Backend**:
   ```bash
   cd backend
   npm run build
   npm start
   ```
   *Runs on `http://localhost:3001`*

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run preview
   # or for development mode:
   npm run dev
   ```
   *Runs on `http://localhost:3000`*

---

## 📱 How to Install and Use on iOS (iPhone / iPad)

To install Musify as a native-feeling app / widget on your iPhone or iPad:

1. **Connect to the Same Wi-Fi Network**:
   - Ensure your iPhone is on the same local Wi-Fi network as your host computer.
2. **Find Your Local Network IP**:
   - When the frontend starts, it displays your network address (e.g., `http://192.168.0.105:3000`).
   - *(You can also find it in PowerShell via `ipconfig` or terminal via `ifconfig`).*
3. **Open Safari on iOS**:
   - Navigate to `http://<YOUR_LOCAL_IP>:3000` in Safari.
4. **Add to Home Screen**:
   - Tap the **Share** button (the square icon with the upward arrow at the bottom of Safari).
   - Scroll down and tap **"Add to Home Screen"**.
   - Confirm the name **"Musify"** and tap **Add**.
5. **Launch Musify**:
   - Tap the new Musify icon on your home screen. It will open as a full-screen, standalone application without Safari browser toolbars, with notch padding, lock-screen media integration, and background audio playback.

---

## 📂 Project Architecture

```
Musify/
├── backend/                  # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── innertube.ts  # YouTube Music API & cipher decipher engine
│   │   │   ├── lyrics.ts     # LRCLIB & timed captions lyrics resolver
│   │   │   └── stream.ts     # HTTP 206 Partial Content byte-range proxy
│   │   └── index.ts          # Express API routes (/search, /song, /stream, /lyrics)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React 19 + TypeScript + Tailwind CSS v4 + Vite
│   ├── public/
│   │   ├── icons/            # Musify SVG & PNG icons (192x192, 512x512, Apple Touch)
│   │   ├── manifest.json     # PWA standalone manifest configuration
│   │   └── sw.js             # Service Worker for offline asset caching
│   ├── src/
│   │   ├── components/
│   │   │   ├── FullPlayer.tsx       # Liquid Glass full-screen player modal
│   │   │   ├── MiniPlayer.tsx       # Floating glass pill player
│   │   │   ├── SquigglySlider.tsx   # Canvas-based animated wavy seekbar
│   │   │   ├── SyncedLyricsView.tsx # Real-time karaoke lyrics view
│   │   │   ├── MusicFlowView.tsx    # Full-screen vertical swipe music discovery
│   │   │   ├── QueueSheet.tsx       # Slide-up interactive queue drawer
│   │   │   ├── FloatingNavBar.tsx   # iOS mobile floating navigation pill
│   │   │   └── Sidebar.tsx          # Desktop floating navigation sidebar
│   │   ├── context/
│   │   │   ├── PlayerContext.tsx    # Central audio playback & MediaSession controller
│   │   │   ├── LibraryContext.tsx   # Favorites, playlists, and playback history
│   │   │   └── ThemeContext.tsx     # Dynamic album palette extraction & OLED styling
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Quick picks, recommended tracks, charts
│   │   │   ├── Explore.tsx          # Moods, genres, top artists, new releases
│   │   │   ├── Search.tsx           # Instant search with suggestions & categories
│   │   │   ├── Library.tsx          # Liked songs, custom playlists, listening history
│   │   │   └── Settings.tsx         # Streaming quality, OLED mode, sleep timer
│   │   ├── App.tsx                  # Root layout & route switcher
│   │   └── main.tsx                 # App mount & global style initialization
│   ├── package.json
│   └── vite.config.ts
├── start-musify.bat          # Windows one-click launcher
├── start-musify.sh           # macOS / Linux one-click launcher
├── package.json              # Root workspace management
└── README.md                 # Complete documentation
```

---

## 🌐 Future Deployment to VPS / Cloud Server

When you provide server or VPS credentials:
1. Clone the repository onto your server.
2. Install dependencies via `npm run install:all` and build with `npm run build`.
3. Use **PM2** to run the backend and frontend preview services in the background:
   ```bash
   npm install -g pm2
   pm2 start backend/dist/index.js --name "musify-backend"
   pm2 start "npm run preview --prefix frontend" --name "musify-frontend"
   pm2 save
   ```
4. Point **Nginx** or **Caddy** with free automated SSL (Let's Encrypt) to proxy requests to port `3000` (frontend) and `/api` to port `3001` (backend) for HTTPS access worldwide.
