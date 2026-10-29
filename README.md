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
- **Same-Origin Streaming by Default**: Uses `/api` (`VITE_STREAM_URL`) for reliable same-origin streaming through reverse proxy with proper CORS and Range headers. An optional opt-in direct-stream bypass (`VITE_DIRECT_STREAM=true`) is available for advanced deployments.
- **In-Memory TTL Cache & Promise De-duplication**: De-duplicates concurrent upstream queries (`AsyncTtlCache`) for search (5m), suggestions (10m), home feed (10m), explore (15m), and radio queues (30m).
- **Persistent Crossfade & Gapless Playback**: Dual audio element event binding prevents severed event listeners after element swapping, ensuring `ended`, `timeupdate`, and autoplay continue flawlessly.
- **Smart Radio & Queue Expansion**: Automatically appends related songs via `getUpNext` when ≤ 3 songs remain in the queue, deduping against recent listening history.
- **Capped Failure Auto-Skip & Stalled Watchdog**: 12-second stalled timer and 3-second movement detection prevent silent failures. Capped consecutive skips (max 3), non-blocking actionable toasts, and first-track failure protection.

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
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins (always merges with `https://musify-live.netlify.app` and localhost defaults) | `https://musify-live.netlify.app,http://localhost:5173,http://localhost:3000` |
| `DEBUG_ENDPOINTS` | Enable `/api/debug/stream/:videoId` diagnostics endpoint | `false` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base endpoint for JSON API calls | `/api` |
| `VITE_STREAM_URL` | Stream URL base (same-origin `/api` in production) | `/api` (or `http://localhost:3001/api` in dev) |
| `VITE_DIRECT_STREAM` | Opt-in flag to enable direct cross-origin stream bypass (off by default) | `false` |
| `VITE_DIRECT_STREAM_URL` | Target origin when direct streaming is opted into | `https://musify-backend-50047147406.development.catalystappsail.in/api` |

---

## 🔍 Debugging Playback

If music fails to play or you experience issues on a deployed instance:

### 1. Reading Console Logs
Open DevTools (`F12` or `Cmd+Option+I` -> Console tab) to inspect player diagnostics:
- **`[STREAM]` logs**: Displays resolve time, upstream response latency, HTTP status code (200, 206), and requested byte ranges.
- **`[AUDIO ELEMENT ERROR]` logs**: Emitted when HTML5 Audio fails. Inspects:
  - `code`: The `MediaError` code (see reference table below).
  - `message`: Specific browser error description.
  - `streamUrl`: The full URL the browser attempted to load.
  - `readyState` & `networkState`: Internal state of the HTMLMediaElement.
- **`[PLAYBACK STALLED: 12S TIMEOUT]`**: The audio pipeline took longer than 12 seconds to begin playing. Check network connectivity or upstream stream availability.
- **`[PLAYBACK STALLED: NO MOVEMENT AFTER 3S]`**: `play()` resolved but audio `currentTime` remained at 0 for 3 seconds.

### 2. Audio Error Code (`audio.error.code`) Reference
| Code | Constant | Meaning | Action / Diagnosis |
|:---:|---|---|---|
| **1** | `MEDIA_ERR_ABORTED` | Fetching process was aborted by user or application. | Normal during fast track skips or manual pauses. |
| **2** | `MEDIA_ERR_NETWORK` | Network failure occurred while downloading audio. | Check connectivity, DNS, or cross-origin network blocks. |
| **3** | `MEDIA_ERR_DECODE` | Error decoding the audio media bitstream. | Format corruption or unsupported media container. |
| **4** | `MEDIA_ERR_SRC_NOT_SUPPORTED` | Source not supported, blocked by CORS, or rejected by server. | Verify backend stream URL validity and CORS headers (`Access-Control-Allow-Origin`). |

### 3. How to Unregister the Service Worker & Clear Stale Audio Caches
If a previous service worker or stale audio cache is causing audio to hang:

#### In Browser DevTools:
1. Open DevTools (`F12`).
2. Go to the **Application** tab (or **Storage** tab in Firefox/Safari).
3. Under **Application** -> **Service Workers**, locate the active worker and click **Unregister**.
4. Under **Storage** -> **Cache Storage**, right-click any old caches (`musify-audio-cache-*`, `musify-cache-*`) and click **Delete**.
5. Hard reload the page (`Ctrl+F5` or `Cmd+Shift+R`).

#### In Console (One-Liner):
Paste and run the following in DevTools Console to unregister all workers and purge caches immediately:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  for (const r of regs) r.unregister();
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload());
});
```

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
