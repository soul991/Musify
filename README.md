# Musify — Liquid Glass Web Music Player & iOS PWA

**Musify** is a high-fidelity, standalone full-stack web music player meticulously engineered to mirror the exact design language, animations, transitions, and features of the **Echo Music** Android app.

Built for personal desktop, macOS, and iOS Safari usage, Musify features a pure **Liquid Glassmorphic** aesthetic (Nothing OS 5.0 + Apple Music styling), dynamic ambient backdrop meshes, an animated wavy waveform seekbar, interactive synced karaoke lyrics, TikTok/Resso-style vertical Music Flow discovery, and native iOS PWA support.

---

## 🌟 Key Features & Echo Music Anatomy

### 1. Liquid Glass & Nothing OS 5.0 Aesthetic
- **Translucent Glass Surfaces**: Deep multi-stage backdrop filter blur (`backdrop-blur-2xl`, `saturate-180`), subtle white specular borders (`border-white/10`), and pure OLED black options.
- **Dynamic Blurred Ambient Mesh**: Live color extraction from current album art rendering multi-layered floating radial gradient orbs that react and breathe with playback.
- **Adaptive Accent Theming**: Dynamic color palettes (Coral, Rose, Violet, Cyan, Emerald, Amber, OLED Black) that update throughout buttons, badges, and sliders.

### 2. High-Performance Audio Engine & Autoplay
- **Direct Stream Bypass**: Direct audio streaming from Catalyst backend (`VITE_STREAM_URL`), eliminating Netlify reverse-proxy double hops and buffering latency.
- **In-Memory TTL Cache & Promise De-duplication**: De-duplicates concurrent upstream queries (`AsyncTtlCache`) for search (5m), suggestions (10m), home feed (10m), explore (15m), and radio queues (30m).
- **Persistent Crossfade & Gapless Playback**: Dual audio element event binding prevents severed event listeners after element swapping, ensuring `ended`, `timeupdate`, and autoplay continue flawlessly.
- **Smart Radio & Queue Expansion**: Automatically appends related songs via `getUpNext` when ≤ 3 songs remain in the queue, deduping against recent listening history.
- **Capped Failure Auto-Skip**: Limits consecutive error auto-skips to 3, provides non-blocking toast notifications with manual Retry capability, and ignores transient 429/5xx status codes.

### 3. Native iOS PWA & Lock Screen Controls
- **Standalone Display Mode**: Configured with `display: standalone` in `manifest.json` and iOS `apple-mobile-web-app-capable` meta tags to completely eliminate Safari navigation bars.
- **Safe Area Insets**: Handled via `viewport-fit=cover` and CSS `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` for iPhone Dynamic Island and home indicator bars.
- **Web Media Session API**: Full lock screen, Control Center, and Apple Watch / Dynamic Island playback metadata, play/pause/skip triggers, and live seek position updates.
- **Custom Apple Touch Icons**: Pre-rendered high-res squircles with specular reflections for the iOS Home Screen.

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Local HTTP port for the Express backend | `3001` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `https://musify-live.netlify.app,http://localhost:5173,http://localhost:3000` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base endpoint for JSON API calls | `/api` |
| `VITE_STREAM_URL` | Direct origin for audio streaming (bypasses proxy) | `https://musify-backend-50047147406.development.catalystappsail.in/api` |

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

## ⌨️ Keyboard Shortcuts
- `Space`: Play / Pause toggle
- `←` / `→`: Seek backward / forward 5 seconds
- `J` / `L`: Previous / Next track
- `M`: Mute / Unmute audio
- `/`: Focus search input
- `?`: Toggle keyboard shortcuts cheatsheet
