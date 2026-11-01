import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const exportsDir = path.resolve(__dirname, 'figma-exports');
const tempDir = path.resolve(projectRoot, '.gemini/antigravity/scratch/screens_temp');

if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const chromeExe = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeProfile = path.resolve(projectRoot, '.gemini/antigravity/scratch/chrome-tmp');

const fontSans = `file:///${projectRoot.replace(/\\/g, '/')}/frontend/public/fonts/InstrumentSans-Variable.woff2`;
const fontSerif = `file:///${projectRoot.replace(/\\/g, '/')}/frontend/public/fonts/InstrumentSerif-Regular.woff2`;

const ICONS = {
  play: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
  pause: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`,
  skipBack: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>`,
  skipForward: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>`,
  shuffle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
  repeat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
  heartFilled: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`,
  heartOutline: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`,
  lyrics: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>`,
  queue: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  speaker: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
  volume: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  library: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"></path><path d="M12 6v14"></path><path d="M8 8v12"></path><path d="M4 4v16"></path></svg>`,
  compass: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
  more: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`,
  chevronDown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  wifiOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
  loader: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`,
  alertCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

function generateWavyPath(width, amplitude = 2, wavelength = 24) {
  let path = "M 0 0";
  const cycles = Math.ceil(width / wavelength);
  for (let i = 0; i < cycles; i++) {
    const x0 = i * wavelength;
    const x1 = x0 + wavelength / 2;
    const x2 = x0 + wavelength;
    path += ` C ${x0 + wavelength * 0.18} ${-amplitude * 1.3}, ${x0 + wavelength * 0.32} ${-amplitude * 1.3}, ${x1} 0`;
    path += ` C ${x1 + wavelength * 0.18} ${amplitude * 1.3}, ${x1 + wavelength * 0.32} ${amplitude * 1.3}, ${x2} 0`;
  }
  return path;
}

function getArtworkSvg(palette = 'quiet', size = 380) {
  if (palette === 'warm') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 380 380" style="border-radius: 16px; overflow: hidden; display: block; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
      <rect width="380" height="380" fill="#1C1410"/>
      <circle cx="190" cy="190" r="140" fill="#C86A2D"/>
      <circle cx="190" cy="190" r="95" fill="#E28743"/>
      <circle cx="190" cy="190" r="50" fill="#F4B066"/>
      <line x1="0" y1="190" x2="380" y2="190" stroke="#1C1410" stroke-width="1.5" stroke-dasharray="4 4"/>
      <rect x="0" y="240" width="380" height="140" fill="#140E0B" opacity="0.85"/>
      <path d="M 0 310 Q 95 280 190 310 T 380 310 L 380 380 L 0 380 Z" fill="#0D0907"/>
    </svg>`;
  } else if (palette === 'cool') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 380 380" style="border-radius: 16px; overflow: hidden; display: block; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
      <rect width="380" height="380" fill="#0E141B"/>
      <polygon points="190,40 330,290 50,290" fill="none" stroke="#2D6AC8" stroke-width="2"/>
      <polygon points="190,90 295,270 85,270" fill="none" stroke="#38A3D4" stroke-width="1.5"/>
      <polygon points="190,140 260,250 120,250" fill="#1A3B66" opacity="0.7"/>
      <circle cx="190" cy="190" r="16" fill="#6BD4FF"/>
      <line x1="190" y1="40" x2="190" y2="340" stroke="#38A3D4" stroke-width="1" stroke-dasharray="2 6"/>
    </svg>`;
  } else if (palette === 'monochrome') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 380 380" style="border-radius: 16px; overflow: hidden; display: block; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
      <rect width="380" height="380" fill="#141517"/>
      <line x1="40" y1="40" x2="340" y2="340" stroke="#4A4E54" stroke-width="2"/>
      <line x1="340" y1="40" x2="40" y2="340" stroke="#4A4E54" stroke-width="2"/>
      <circle cx="190" cy="190" r="100" fill="none" stroke="#8E9AA8" stroke-width="1.5"/>
      <rect x="130" y="130" width="120" height="120" fill="none" stroke="#E1E5EA" stroke-width="1"/>
      <circle cx="190" cy="190" r="4" fill="#E1E5EA"/>
    </svg>`;
  } else {
    // Quiet: deep graphite with crimson center disc
    return `<svg width="${size}" height="${size}" viewBox="0 0 380 380" style="border-radius: 16px; overflow: hidden; display: block; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
      <rect width="380" height="380" fill="#161618"/>
      <circle cx="190" cy="190" r="130" fill="#1C1C1F"/>
      <circle cx="190" cy="190" r="85" fill="#242428"/>
      <circle cx="190" cy="190" r="40" fill="#D92B38"/>
      <circle cx="190" cy="190" r="14" fill="#0B0B0C"/>
      <path d="M 190 20 L 190 360" stroke="rgba(237,237,237,0.06)" stroke-width="1"/>
      <path d="M 20 190 L 360 190" stroke="rgba(237,237,237,0.06)" stroke-width="1"/>
    </svg>`;
  }
}

// Return tokens and CSS based on variant
function getThemeCss(variant = 'quiet') {
  if (variant === 'warm') {
    return `
      --bg-stage: #0F0C0A;
      --bg-base: #181411;
      --bg-card: #201A15;
      --bg-raised: #2C231D;
      --hairline: rgba(240, 220, 200, 0.09);
      --text-1: #F2EAE4;
      --text-2: #B3A69C;
      --text-3: #8C8075;
      --accent: #E28743;
      --accent-ink: #F59F5A;
      --accent-hover: #C67234;
      --active-lyric: #E28743;
    `;
  } else if (variant === 'cool') {
    return `
      --bg-stage: #090D12;
      --bg-base: #10161E;
      --bg-card: #151E28;
      --bg-raised: #1C2735;
      --hairline: rgba(210, 230, 255, 0.09);
      --text-1: #E4EDF7;
      --text-2: #97A7BB;
      --text-3: #728194;
      --accent: #38A3D4;
      --accent-ink: #5DC2F2;
      --accent-hover: #2B89B4;
      --active-lyric: #38A3D4;
    `;
  } else if (variant === 'monochrome') {
    return `
      --bg-stage: #0C0D0E;
      --bg-base: #141517;
      --bg-card: #1A1C1F;
      --bg-raised: #232529;
      --hairline: rgba(230, 235, 240, 0.08);
      --text-1: #E8EAEF;
      --text-2: #9FA4AD;
      --text-3: #7B8088;
      --accent: #9CAAB8;
      --accent-ink: #B8C4D1;
      --accent-hover: #82909E;
      --active-lyric: #9CAAB8;
    `;
  } else {
    // Quiet
    return `
      --bg-stage: #0B0B0C;
      --bg-base: #141415;
      --bg-card: #19191B;
      --bg-raised: #232325;
      --hairline: rgba(237, 237, 237, 0.08);
      --text-1: #EDEDED;
      --text-2: #A1A1A6;
      --text-3: #85858B;
      --accent: #D92B38;
      --accent-ink: #FF5A64;
      --accent-hover: #C42632;
      --active-lyric: #EDEDED;
    `;
  }
}

function baseStyles(variant = 'quiet') {
  return `
    @font-face {
      font-family: 'Instrument Sans';
      src: url('${fontSans}') format('woff2');
      font-weight: 100 900;
      font-style: normal;
    }
    @font-face {
      font-family: 'Instrument Serif';
      src: url('${fontSerif}') format('woff2');
      font-weight: 400;
      font-style: normal;
    }
    :root {
      ${getThemeCss(variant)}
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 20px;
      --radius-full: 9999px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-stage);
      color: var(--text-1);
      font-family: 'Instrument Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }
    .serif { font-family: 'Instrument Serif', serif; }
    .tabular { font-variant-numeric: tabular-nums; }
    .hairline-border { border: 1px solid var(--hairline); }
    .icon-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      color: var(--text-2);
      cursor: pointer;
    }
    .pill {
      height: 32px;
      padding: 0 12px;
      border-radius: var(--radius-full);
      background: var(--bg-raised);
      border: 1px solid var(--hairline);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-2);
    }
  `;
}

// -------------------------------------------------------------
// DESKTOP BUILDER
// -------------------------------------------------------------
function buildDesktopHtml({
  title = "Now Playing",
  variant = 'quiet',
  isPlaying = true,
  lyricsMoment = 0, // 0: closed, 1: upcoming, 2: singing, 3: sung
  isPaused = false,
  crossfade = false,
  view = 'player', // 'player', 'home', 'search', 'library', 'empty', 'skeleton', 'offline'
  miniMorph = -1 // -1: none, 0: docked, 1: 25%, 2: 50%, 3: 75%, 4: 100%
}) {
  const isWavy = isPlaying && !isPaused;
  const seekWidth = 580;
  const progressRatio = 0.42;
  const filledWidth = Math.round(seekWidth * progressRatio);

  let seekPath = "";
  if (isWavy) {
    seekPath = generateWavyPath(seekWidth, 2, 24);
  } else {
    seekPath = `M 0 0 L ${seekWidth} 0`;
  }

  // Lyrics moments
  let lyricLineContent = "";
  if (lyricsMoment === 1) {
    // Word not yet sung
    lyricLineContent = `
      <div style="font-size: 36px; line-height: 46px; color: var(--text-3); opacity: 0.4;" class="serif">
        Where the midnight turns to silver
      </div>
      <div style="font-size: 13px; color: var(--text-3); margin-top: 4px; font-family: 'Instrument Sans';">
        [Moment 1: Word not yet sung (upcoming words at 40%)]
      </div>
    `;
  } else if (lyricsMoment === 2) {
    // Word being sung with partial fill
    lyricLineContent = `
      <div style="font-size: 36px; line-height: 46px;" class="serif">
        <span style="color: var(--text-1);">Where the </span>
        <span style="background: linear-gradient(to right, var(--accent) 65%, var(--text-3) 65%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">midnight</span>
        <span style="color: var(--text-3); opacity: 0.4;"> turns to silver</span>
      </div>
      <div style="font-size: 13px; color: var(--accent-ink); margin-top: 4px; font-family: 'Instrument Sans';">
        [Moment 2: Word being sung (active word sweeps left-to-right 65% in artwork/accent hue)]
      </div>
    `;
  } else if (lyricsMoment === 3) {
    // Word sung
    lyricLineContent = `
      <div style="font-size: 36px; line-height: 46px; color: var(--text-1);" class="serif">
        Where the midnight turns to silver
      </div>
      <div style="font-size: 13px; color: var(--text-2); margin-top: 4px; font-family: 'Instrument Sans';">
        [Moment 3: Word sung (full 100% opacity #EDEDED)]
      </div>
    `;
  }

  let centerContent = "";

  if (view === 'player') {
    centerContent = `
      <div style="display: flex; flex: 1; padding: 48px; gap: 56px; align-items: center; justify-content: center;">
        <!-- Left Artwork Column -->
        <div style="width: 380px; display: flex; flex-direction: column; gap: 20px;">
          <div style="position: relative; width: 380px; height: 380px;">
            ${crossfade ? `
              <!-- Outgoing Artwork -->
              <div style="position: absolute; inset: 0; opacity: 0.35; transform: scale(0.96); filter: grayscale(40%);">
                ${getArtworkSvg(variant, 380)}
              </div>
              <!-- Incoming Artwork Mid-crossfade -->
              <div style="position: absolute; inset: 0; opacity: 0.85; transform: scale(1.0);">
                ${getArtworkSvg(variant === 'quiet' ? 'cool' : 'warm', 380)}
              </div>
              <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.75); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: var(--text-1); font-family: 'Instrument Sans';">
                Crossfade 240ms (0.50)
              </div>
            ` : getArtworkSvg(variant, 380)}
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h1 style="font-size: 32px; font-weight: 400; line-height: 38px; color: var(--text-1);" class="serif">
                  ${crossfade ? "Blinding Lights" : (variant === 'warm' ? "Texas Sun" : (variant === 'cool' ? "Solaris" : (variant === 'monochrome' ? "Substratum" : "Starboy")))}
                </h1>
                <p style="font-size: 14px; color: var(--text-2); margin-top: 4px;">
                  ${variant === 'warm' ? "Leon Bridges, Khruangbin" : (variant === 'cool' ? "Kroma" : (variant === 'monochrome' ? "Burial" : "The Weeknd, Daft Punk"))}
                </p>
              </div>
              <div style="color: var(--accent); padding-top: 6px;">
                ${ICONS.heartFilled}
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              <span class="pill">${ICONS.speaker} 24-bit / 48kHz FLAC</span>
              <span class="pill">Contrast 12.4:1 (AAA)</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Synced Lyrics or Track Companion -->
        <div style="flex: 1; max-width: 560px; height: 420px; display: flex; flex-direction: column; justify-content: center; gap: 24px;">
          ${lyricsMoment > 0 ? `
            <div style="font-size: 13px; color: var(--text-3); text-transform: sentence; margin-bottom: 8px;">
              Synchronized lyrics (Instrument Serif, line at 1/3 top)
            </div>
            <div style="font-size: 26px; line-height: 34px; color: var(--text-1); opacity: 0.9;" class="serif">
              Looking for a light across the dark horizon
            </div>
            ${lyricLineContent}
            <div style="font-size: 26px; line-height: 34px; color: var(--text-3); opacity: 0.4;" class="serif">
              Never thought I'd find you in this crowded space
            </div>
            <div style="font-size: 26px; line-height: 34px; color: var(--text-3); opacity: 0.25;" class="serif">
              Echoes in the chamber of the sound
            </div>
          ` : `
            <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 500; color: var(--text-1);">Up next in queue</span>
                <span style="font-size: 12px; color: var(--text-3);">34 tracks remaining</span>
              </div>
              <!-- Track rows -->
              ${[
                { t: "After Hours", a: "The Weeknd", d: "6:01" },
                { t: "Midnight City", a: "M83", d: "4:03" },
                { t: "Nightcall", a: "Kavinsky", d: "4:19" }
              ].map((song, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: var(--radius-md); background: ${i === 0 ? 'var(--bg-raised)' : 'transparent'};">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 13px; color: var(--text-3);" class="tabular">0${i + 2}</span>
                    <div>
                      <div style="font-size: 14px; color: var(--text-1);">${song.t}</div>
                      <div style="font-size: 12px; color: var(--text-2);">${song.a}</div>
                    </div>
                  </div>
                  <span style="font-size: 12px; color: var(--text-3);" class="tabular">${song.d}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  } else if (view === 'home') {
    centerContent = `
      <div style="flex: 1; padding: 40px 48px; overflow: hidden; display: flex; flex-direction: column; gap: 32px;">
        <div>
          <h2 style="font-size: 28px; font-weight: 400; color: var(--text-1);" class="serif">Late night</h2>
          <p style="font-size: 14px; color: var(--text-2); margin-top: 4px;">A warm listening room after dark. Hand-picked selections.</p>
        </div>
        <div>
          <div style="font-size: 16px; font-weight: 500; color: var(--text-1); margin-bottom: 16px;">Quick picks</div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            ${[
              { t: "Texas Sun", a: "Leon Bridges", pal: "warm" },
              { t: "Solaris", a: "Kroma", pal: "cool" },
              { t: "Substratum", a: "Burial", pal: "monochrome" },
              { t: "Starboy", a: "The Weeknd", pal: "quiet" }
            ].map(item => `
              <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 14px; display: flex; flex-direction: column; gap: 12px;">
                ${getArtworkSvg(item.pal, 200)}
                <div>
                  <div style="font-size: 15px; font-weight: 500; color: var(--text-1);">${item.t}</div>
                  <div style="font-size: 13px; color: var(--text-2); margin-top: 2px;">${item.a}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (view === 'search') {
    centerContent = `
      <div style="flex: 1; padding: 40px 48px; display: flex; flex-direction: column; gap: 24px;">
        <div style="width: 100%; max-width: 580px; position: relative;">
          <input type="text" value="The Weeknd" readonly style="width: 100%; height: 44px; background: var(--bg-card); border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 0 44px 0 16px; font-size: 15px; color: var(--text-1); outline: none; font-family: 'Instrument Sans';" />
          <div style="position: absolute; right: 14px; top: 12px; color: var(--text-2);">${ICONS.search}</div>
        </div>
        <div style="display: flex; gap: 24px;">
          <!-- Top Result Spotlight Card -->
          <div style="width: 300px; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 16px;">
            <div style="font-size: 13px; color: var(--text-3);">Top result</div>
            ${getArtworkSvg(variant, 140)}
            <div>
              <div style="font-size: 20px; font-weight: 500; color: var(--text-1);">The Weeknd</div>
              <div style="font-size: 13px; color: var(--text-2); margin-top: 2px;">Artist &bull; 84.2M listeners</div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center;">
              ${ICONS.play}
            </div>
          </div>
          <!-- Songs List -->
          <div style="flex: 1; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 13px; color: var(--text-3); padding: 8px 12px;">Songs</div>
            ${[
              { t: "Blinding Lights", a: "After Hours", d: "3:20" },
              { t: "Starboy", a: "Starboy", d: "3:50" },
              { t: "Save Your Tears", a: "After Hours", d: "3:35" },
              { t: "Die For You", a: "Starboy", d: "4:20" }
            ].map((s, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-md); ${idx === 1 ? 'background: var(--bg-raised);' : ''}">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 13px; color: var(--text-3);" class="tabular">0${idx + 1}</span>
                  <div>
                    <div style="font-size: 14px; color: var(--text-1); font-weight: 500;">${s.t}</div>
                    <div style="font-size: 12px; color: var(--text-2);">${s.a}</div>
                  </div>
                </div>
                <span style="font-size: 12px; color: var(--text-3);" class="tabular">${s.d}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (view === 'library') {
    centerContent = `
      <div style="flex: 1; padding: 40px 48px; display: flex; flex-direction: column; gap: 24px;">
        <h2 style="font-size: 28px; font-weight: 400; color: var(--text-1);" class="serif">Your library</h2>
        <div style="display: flex; gap: 8px;">
          <span class="pill" style="background: var(--accent); color: #FFF; border: none;">Playlists</span>
          <span class="pill">Albums</span>
          <span class="pill">Artists</span>
          <span class="pill">Downloaded</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          ${[
            { t: "Late Night Vinyl", c: "48 tracks", pal: "quiet" },
            { t: "Desert Sessions", c: "32 tracks", pal: "warm" },
            { t: "Deep Focus Synth", c: "64 tracks", pal: "cool" },
            { t: "Minimal Techno", c: "29 tracks", pal: "monochrome" }
          ].map(p => `
            <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              ${getArtworkSvg(p.pal, 180)}
              <div>
                <div style="font-size: 15px; font-weight: 500; color: var(--text-1);">${p.t}</div>
                <div style="font-size: 12px; color: var(--text-3); margin-top: 2px;">${p.c}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (view === 'empty') {
    centerContent = `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 48px;">
        <div style="width: 80px; height: 80px; border-radius: var(--radius-full); background: var(--bg-card); border: 1px solid var(--hairline); display: flex; align-items: center; justify-content: center; color: var(--text-3);">
          ${ICONS.search}
        </div>
        <div style="font-size: 22px; color: var(--text-1);" class="serif">No tracks playing</div>
        <p style="font-size: 14px; color: var(--text-2); max-width: 320px; text-align: center;">
          Search for an artist, album, or playlist to begin listening in Musify.
        </p>
        <button style="margin-top: 8px; height: 38px; padding: 0 20px; border-radius: var(--radius-md); background: var(--accent); color: #FFF; border: none; font-size: 14px; font-weight: 500; cursor: pointer;">
          Explore music
        </button>
      </div>
    `;
  } else if (view === 'skeleton') {
    centerContent = `
      <div style="flex: 1; padding: 48px; display: flex; gap: 56px; align-items: center; justify-content: center;">
        <div style="width: 380px; height: 380px; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--hairline); opacity: 0.8;"></div>
        <div style="flex: 1; max-width: 560px; display: flex; flex-direction: column; gap: 20px;">
          <div style="width: 240px; height: 32px; background: var(--bg-card); border-radius: 6px;"></div>
          <div style="width: 140px; height: 18px; background: var(--bg-raised); border-radius: 4px;"></div>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
            <div style="width: 100%; height: 48px; background: var(--bg-card); border-radius: 8px;"></div>
            <div style="width: 85%; height: 48px; background: var(--bg-card); border-radius: 8px;"></div>
            <div style="width: 70%; height: 48px; background: var(--bg-card); border-radius: 8px;"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Morph overlay frames
  let morphLayer = "";
  if (miniMorph === 0) {
    // Docked
    morphLayer = `
      <div style="position: absolute; bottom: 16px; left: 260px; right: 24px; height: 64px; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 0 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${getArtworkSvg(variant, 44)}
          <div>
            <div style="font-size: 14px; font-weight: 500; color: var(--text-1);">Starboy</div>
            <div style="font-size: 12px; color: var(--text-2);">The Weeknd</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="color: var(--accent);">${ICONS.heartFilled}</div>
          <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center;">
            ${ICONS.pause}
          </div>
          <div style="color: var(--text-2);">${ICONS.skipForward}</div>
          <div style="color: var(--text-2);">${ICONS.chevronDown}</div>
        </div>
      </div>
    `;
  } else if (miniMorph === 1) {
    // 25% Morph
    morphLayer = `
      <div style="position: absolute; bottom: 0; left: 240px; right: 0; height: 260px; background: var(--bg-card); border-top: 1px solid var(--hairline); border-radius: 20px 20px 0 0; padding: 24px 48px; display: flex; gap: 32px; box-shadow: 0 -12px 32px rgba(0,0,0,0.6);">
        ${getArtworkSvg(variant, 120)}
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px;">
          <div style="font-size: 22px; color: var(--text-1);" class="serif">Starboy</div>
          <div style="font-size: 14px; color: var(--text-2);">The Weeknd &bull; 25% Expanded Morph</div>
          <div style="width: 100%; height: 2px; background: var(--hairline); position: relative;">
            <div style="width: 42%; height: 2px; background: var(--accent);"></div>
          </div>
        </div>
      </div>
    `;
  } else if (miniMorph === 2) {
    // 50% Morph
    morphLayer = `
      <div style="position: absolute; bottom: 0; left: 240px; right: 0; height: 500px; background: var(--bg-stage); border-top: 1px solid var(--hairline); border-radius: 24px 24px 0 0; padding: 40px; display: flex; gap: 48px; align-items: center; justify-content: center; box-shadow: 0 -16px 40px rgba(0,0,0,0.7);">
        ${getArtworkSvg(variant, 220)}
        <div style="max-width: 400px; display: flex; flex-direction: column; gap: 16px;">
          <div style="font-size: 28px; color: var(--text-1);" class="serif">Starboy</div>
          <div style="font-size: 14px; color: var(--text-2);">The Weeknd &bull; 50% Midpoint Keyframe</div>
          <div style="width: 100%; height: 4px; background: var(--hairline); position: relative; border-radius: 2px;">
            <div style="width: 42%; height: 4px; background: var(--accent); border-radius: 2px;"></div>
          </div>
        </div>
      </div>
    `;
  } else if (miniMorph === 3) {
    // 75% Morph
    morphLayer = `
      <div style="position: absolute; bottom: 0; left: 240px; right: 0; height: 720px; background: var(--bg-stage); border-top: 1px solid var(--hairline); border-radius: 28px 28px 0 0; padding: 48px; display: flex; gap: 48px; align-items: center; justify-content: center; box-shadow: 0 -24px 50px rgba(0,0,0,0.8);">
        ${getArtworkSvg(variant, 320)}
        <div style="max-width: 440px; display: flex; flex-direction: column; gap: 20px;">
          <div style="font-size: 32px; color: var(--text-1);" class="serif">Starboy</div>
          <div style="font-size: 14px; color: var(--text-2);">The Weeknd &bull; 75% Morph Frame</div>
          <div style="font-size: 22px; color: var(--text-3);" class="serif">Where the midnight turns to silver...</div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    ${baseStyles(variant)}
  </style>
</head>
<body style="width: 1440px; height: 900px; display: flex; flex-direction: column; position: relative;">

  <!-- Offline Banner if active -->
  ${view === 'offline' ? `
    <div style="height: 38px; background: var(--bg-card); border-bottom: 1px solid var(--hairline); display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 13px; color: var(--text-2);">
      <span style="color: var(--accent-ink);">${ICONS.wifiOff}</span>
      <span>Offline mode &mdash; streaming cached tracks from device</span>
      <span style="color: var(--accent); cursor: pointer; text-decoration: underline; margin-left: 8px;">Retry connection</span>
    </div>
  ` : ''}

  <!-- Main View Stage -->
  <div style="display: flex; flex: 1; min-height: 0;">
    <!-- Left Navigation Sidebar (240px) -->
    <div style="width: 240px; background: var(--bg-base); border-right: 1px solid var(--hairline); padding: 28px 16px; display: flex; flex-direction: column; gap: 24px;">
      <!-- Logo -->
      <div style="padding: 0 8px; display: flex; align-items: center; gap: 10px;">
        <div style="width: 14px; height: 14px; border-radius: 3px; background: var(--accent);"></div>
        <span style="font-size: 20px; font-weight: 400; color: var(--text-1);" class="serif">Musify</span>
      </div>

      <!-- Navigation group -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 12px; color: var(--text-3); padding: 0 8px 6px;">Menu</div>
        ${[
          { label: "Home", icon: ICONS.home, active: view === 'home' },
          { label: "Search", icon: ICONS.search, active: view === 'search' },
          { label: "Your library", icon: ICONS.library, active: view === 'library' },
          { label: "Now playing", icon: ICONS.lyrics, active: view === 'player' || view === 'offline' }
        ].map(n => `
          <div style="height: 36px; padding: 0 10px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: ${n.active ? '500' : '400'}; color: ${n.active ? 'var(--text-1)' : 'var(--text-2)'}; background: ${n.active ? 'var(--bg-raised)' : 'transparent'}; border: ${n.active ? '1px solid var(--hairline)' : '1px solid transparent'};">
            ${n.icon}
            <span>${n.label}</span>
          </div>
        `).join('')}
      </div>

      <!-- Playlists group -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 12px; color: var(--text-3); padding: 0 8px 6px;">Playlists</div>
        ${["Late Night Vinyl", "Desert Sessions", "Deep Focus Synth"].map(p => `
          <div style="height: 32px; padding: 0 10px; border-radius: var(--radius-sm); display: flex; align-items: center; font-size: 13px; color: var(--text-2);">
            ${p}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Center Canvas Content -->
    ${centerContent}
  </div>

  <!-- Persistent Dock Player (88px) -->
  <div style="height: 88px; background: var(--bg-card); border-top: 1px solid var(--hairline); display: flex; flex-direction: column; justify-content: center; padding: 0 32px; position: relative;">
    <!-- Top Scrubber Bar -->
    <div style="display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%;">
      <span style="font-size: 11px; color: var(--text-3);" class="tabular">1:48</span>
      <div style="width: ${seekWidth}px; height: 16px; display: flex; align-items: center; position: relative; cursor: pointer;">
        <svg width="${seekWidth}" height="16" viewBox="0 -8 ${seekWidth} 16" style="overflow: visible;">
          <!-- Background track -->
          <path d="${seekPath}" fill="none" stroke="rgba(237,237,237,0.14)" stroke-width="2" stroke-linecap="round"/>
          <!-- Filled progress track -->
          <path d="${seekPath}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="${filledWidth} ${seekWidth}"/>
          <!-- Scrubber thumb handle at filled point -->
          <circle cx="${filledWidth}" cy="0" r="5" fill="var(--accent)"/>
          <circle cx="${filledWidth}" cy="0" r="2" fill="#FFFFFF"/>
        </svg>
      </div>
      <span style="font-size: 11px; color: var(--text-3);" class="tabular">3:50</span>
    </div>

    <!-- Controls Row -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
      <!-- Left Track Info -->
      <div style="display: flex; align-items: center; gap: 12px; width: 220px;">
        ${getArtworkSvg(variant, 40)}
        <div style="overflow: hidden;">
          <div style="font-size: 13px; font-weight: 500; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${variant === 'warm' ? "Texas Sun" : (variant === 'cool' ? "Solaris" : (variant === 'monochrome' ? "Substratum" : "Starboy"))}
          </div>
          <div style="font-size: 12px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${variant === 'warm' ? "Leon Bridges" : (variant === 'cool' ? "Kroma" : (variant === 'monochrome' ? "Burial" : "The Weeknd"))}
          </div>
        </div>
        <div style="color: var(--accent); margin-left: 4px;">
          ${ICONS.heartFilled}
        </div>
      </div>

      <!-- Center Transport Buttons -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="icon-btn">${ICONS.shuffle}</div>
        <div class="icon-btn">${ICONS.skipBack}</div>
        <!-- 56px Primary Play/Pause Button -->
        <div style="width: 52px; height: 52px; border-radius: var(--radius-full); background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
          ${isPaused ? ICONS.play : ICONS.pause}
        </div>
        <div class="icon-btn">${ICONS.skipForward}</div>
        <div class="icon-btn">${ICONS.repeat}</div>
      </div>

      <!-- Right Utility Actions -->
      <div style="display: flex; align-items: center; gap: 12px; width: 220px; justify-content: flex-end;">
        <div class="icon-btn" style="color: ${lyricsMoment > 0 ? 'var(--accent)' : 'var(--text-2)'};">${ICONS.lyrics}</div>
        <div class="icon-btn">${ICONS.queue}</div>
        <div class="pill" style="font-size: 11px;">
          ${ICONS.speaker} <span>MacBook Pro</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Morph in-between keyframes if requested -->
  ${morphLayer}

</body>
</html>`;
}

// -------------------------------------------------------------
// MOBILE BUILDER (390 x 844)
// -------------------------------------------------------------
function buildMobileHtml({
  title = "Now Playing Mobile",
  variant = 'quiet',
  isPlaying = true,
  isPaused = false,
  lyricsMoment = 0,
  crossfade = false,
  view = 'player',
  miniMorph = -1
}) {
  const isWavy = isPlaying && !isPaused;
  const seekWidth = 340;
  const progressRatio = 0.42;
  const filledWidth = Math.round(seekWidth * progressRatio);

  let seekPath = "";
  if (isWavy) {
    seekPath = generateWavyPath(seekWidth, 2, 20);
  } else {
    seekPath = `M 0 0 L ${seekWidth} 0`;
  }

  let content = "";

  if (view === 'player') {
    content = `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 20px 0 10px;">
        <!-- Top Artwork Stage -->
        <div style="position: relative; width: 342px; height: 342px; margin: 0 auto;">
          ${crossfade ? `
            <div style="position: absolute; inset: 0; opacity: 0.35; transform: scale(0.96);">
              ${getArtworkSvg(variant, 342)}
            </div>
            <div style="position: absolute; inset: 0; opacity: 0.85; transform: scale(1.0);">
              ${getArtworkSvg(variant === 'quiet' ? 'cool' : 'warm', 342)}
            </div>
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 4px; font-size: 10px; color: var(--text-1);">
              Crossfade
            </div>
          ` : getArtworkSvg(variant, 342)}
        </div>

        <!-- Lyrics or Title Area -->
        ${lyricsMoment > 0 ? `
          <div style="padding: 12px 6px; display: flex; flex-direction: column; gap: 10px; height: 160px; justify-content: center;">
            <div style="font-size: 20px; line-height: 26px; color: var(--text-3); opacity: 0.4;" class="serif">
              Looking for a light across the dark
            </div>
            ${lyricsMoment === 1 ? `
              <div style="font-size: 28px; line-height: 34px; color: var(--text-3); opacity: 0.4;" class="serif">
                Where the midnight turns to silver
              </div>
            ` : (lyricsMoment === 2 ? `
              <div style="font-size: 28px; line-height: 34px;" class="serif">
                <span style="color: var(--text-1);">Where the </span>
                <span style="background: linear-gradient(to right, var(--accent) 65%, var(--text-3) 65%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">midnight</span>
                <span style="color: var(--text-3); opacity: 0.4;"> turns</span>
              </div>
            ` : `
              <div style="font-size: 28px; line-height: 34px; color: var(--text-1);" class="serif">
                Where the midnight turns to silver
              </div>
            `)}
            <div style="font-size: 20px; line-height: 26px; color: var(--text-3); opacity: 0.25;" class="serif">
              Echoes in the chamber of the sound
            </div>
          </div>
        ` : `
          <!-- Title & Artist -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 12px 6px 4px;">
            <div>
              <h1 style="font-size: 28px; font-weight: 400; line-height: 34px; color: var(--text-1);" class="serif">
                ${variant === 'warm' ? "Texas Sun" : (variant === 'cool' ? "Solaris" : (variant === 'monochrome' ? "Substratum" : "Starboy"))}
              </h1>
              <p style="font-size: 15px; color: var(--text-2); margin-top: 4px;">
                ${variant === 'warm' ? "Leon Bridges" : (variant === 'cool' ? "Kroma" : (variant === 'monochrome' ? "Burial" : "The Weeknd"))}
              </p>
            </div>
            <div style="color: var(--accent); padding-bottom: 4px;">
              ${ICONS.heartFilled}
            </div>
          </div>
        `}

        <!-- Seekbar -->
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 8px 0;">
          <div style="width: 100%; height: 20px; display: flex; align-items: center; position: relative;">
            <svg width="${seekWidth}" height="16" viewBox="0 -8 ${seekWidth} 16" style="overflow: visible;">
              <path d="${seekPath}" fill="none" stroke="rgba(237,237,237,0.15)" stroke-width="2" stroke-linecap="round"/>
              <path d="${seekPath}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-dasharray="${filledWidth} ${seekWidth}"/>
              <circle cx="${filledWidth}" cy="0" r="5" fill="var(--accent)"/>
            </svg>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-3);" class="tabular">
            <span>1:48</span>
            <span>3:50</span>
          </div>
        </div>

        <!-- Transport Buttons (Hit targets >= 44px) -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px;">
          <div class="icon-btn">${ICONS.shuffle}</div>
          <div class="icon-btn">${ICONS.skipBack}</div>
          <!-- 64px Mobile Play Button -->
          <div style="width: 60px; height: 60px; border-radius: var(--radius-full); background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
            ${isPaused ? ICONS.play : ICONS.pause}
          </div>
          <div class="icon-btn">${ICONS.skipForward}</div>
          <div class="icon-btn">${ICONS.repeat}</div>
        </div>

        <!-- Mobile Utility Row -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 6px 0;">
          <div class="pill" style="font-size: 12px;">
            ${ICONS.speaker} <span>AirPods Max</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <div class="icon-btn" style="color: ${lyricsMoment > 0 ? 'var(--accent)' : 'var(--text-2)'};">${ICONS.lyrics}</div>
            <div class="icon-btn">${ICONS.queue}</div>
          </div>
        </div>
      </div>
    `;
  } else if (view === 'home') {
    content = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 20px; overflow: hidden; padding-top: 10px;">
        <h2 style="font-size: 26px; color: var(--text-1);" class="serif">Late night</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 14px; font-weight: 500; color: var(--text-2);">Recent albums</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-md); padding: 10px;">
              ${getArtworkSvg(variant, 140)}
              <div style="font-size: 13px; font-weight: 500; color: var(--text-1); margin-top: 8px;">Texas Sun</div>
              <div style="font-size: 11px; color: var(--text-3);">Leon Bridges</div>
            </div>
            <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-md); padding: 10px;">
              ${getArtworkSvg(variant === 'quiet' ? 'cool' : 'quiet', 140)}
              <div style="font-size: 13px; font-weight: 500; color: var(--text-1); margin-top: 8px;">Starboy</div>
              <div style="font-size: 11px; color: var(--text-3);">The Weeknd</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (view === 'search') {
    content = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
        <div style="width: 100%; position: relative;">
          <input type="text" value="The Weeknd" readonly style="width: 100%; height: 44px; background: var(--bg-card); border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 0 40px 0 14px; font-size: 14px; color: var(--text-1); outline: none;" />
          <div style="position: absolute; right: 12px; top: 12px; color: var(--text-2);">${ICONS.search}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 12px; color: var(--text-3);">Top tracks</div>
          ${[
            { t: "Blinding Lights", d: "3:20" },
            { t: "Starboy", d: "3:50" },
            { t: "Save Your Tears", d: "3:35" }
          ].map(s => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-md);">
              <div style="font-size: 14px; color: var(--text-1);">${s.t}</div>
              <div style="font-size: 12px; color: var(--text-3);" class="tabular">${s.d}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (view === 'library') {
    content = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
        <h2 style="font-size: 26px; color: var(--text-1);" class="serif">Your library</h2>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${["Late Night Vinyl", "Desert Sessions", "Deep Focus Synth"].map(p => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-md);">
              ${getArtworkSvg(variant, 40)}
              <div>
                <div style="font-size: 14px; color: var(--text-1); font-weight: 500;">${p}</div>
                <div style="font-size: 11px; color: var(--text-3);">Playlist &bull; 48 songs</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (view === 'empty') {
    content = `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;">
        <div style="width: 64px; height: 64px; border-radius: var(--radius-full); background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: var(--text-3);">
          ${ICONS.search}
        </div>
        <div style="font-size: 20px; color: var(--text-1);" class="serif">No tracks playing</div>
        <p style="font-size: 13px; color: var(--text-2); text-align: center; max-width: 260px;">
          Search for an artist or album to start listening.
        </p>
      </div>
    `;
  } else if (view === 'skeleton') {
    content = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 20px; padding-top: 10px;">
        <div style="width: 342px; height: 342px; background: var(--bg-card); border-radius: 16px; margin: 0 auto;"></div>
        <div style="width: 220px; height: 26px; background: var(--bg-card); border-radius: 6px;"></div>
        <div style="width: 140px; height: 16px; background: var(--bg-raised); border-radius: 4px;"></div>
        <div style="width: 100%; height: 2px; background: var(--bg-card); margin-top: 16px;"></div>
      </div>
    `;
  }

  // Morph overlay for mobile
  let morphOverlay = "";
  if (miniMorph === 0) {
    // Docked mobile mini-player
    morphOverlay = `
      <div style="position: absolute; bottom: 20px; left: 16px; right: 16px; height: 60px; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 0 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${getArtworkSvg(variant, 40)}
          <div>
            <div style="font-size: 13px; font-weight: 500; color: var(--text-1);">Starboy</div>
            <div style="font-size: 11px; color: var(--text-2);">The Weeknd</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center;">
            ${ICONS.pause}
          </div>
          <div style="color: var(--text-2);">${ICONS.chevronDown}</div>
        </div>
      </div>
    `;
  } else if (miniMorph === 1) {
    morphOverlay = `
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 280px; background: var(--bg-card); border-top: 1px solid var(--hairline); border-radius: 20px 20px 0 0; padding: 20px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 -12px 32px rgba(0,0,0,0.7);">
        <div style="width: 36px; height: 4px; background: var(--text-3); opacity: 0.5; border-radius: 2px; margin: 0 auto;"></div>
        <div style="display: flex; gap: 16px; align-items: center;">
          ${getArtworkSvg(variant, 80)}
          <div>
            <div style="font-size: 20px; color: var(--text-1);" class="serif">Starboy</div>
            <div style="font-size: 13px; color: var(--text-2);">The Weeknd (25% Expand)</div>
          </div>
        </div>
      </div>
    `;
  } else if (miniMorph === 2) {
    morphOverlay = `
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 520px; background: var(--bg-stage); border-top: 1px solid var(--hairline); border-radius: 24px 24px 0 0; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 -16px 40px rgba(0,0,0,0.8);">
        <div style="width: 36px; height: 4px; background: var(--text-3); opacity: 0.5; border-radius: 2px; margin: 0 auto;"></div>
        <div style="margin: 0 auto;">${getArtworkSvg(variant, 200)}</div>
        <div style="text-align: center;">
          <div style="font-size: 24px; color: var(--text-1);" class="serif">Starboy</div>
          <div style="font-size: 13px; color: var(--text-2);">The Weeknd (50% Midpoint)</div>
        </div>
      </div>
    `;
  } else if (miniMorph === 3) {
    morphOverlay = `
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 720px; background: var(--bg-stage); border-top: 1px solid var(--hairline); border-radius: 28px 28px 0 0; padding: 24px; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 -20px 48px rgba(0,0,0,0.85);">
        <div style="width: 36px; height: 4px; background: var(--text-3); opacity: 0.5; border-radius: 2px; margin: 0 auto;"></div>
        <div style="margin: 0 auto;">${getArtworkSvg(variant, 280)}</div>
        <div>
          <div style="font-size: 26px; color: var(--text-1);" class="serif">Starboy</div>
          <div style="font-size: 14px; color: var(--text-2);">The Weeknd (75% Expand)</div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    ${baseStyles(variant)}
  </style>
</head>
<body style="width: 390px; height: 844px; display: flex; flex-direction: column; padding: 14px 24px 20px; position: relative;">

  <!-- Mobile Top Bar -->
  <div style="display: flex; justify-content: space-between; align-items: center; height: 32px; font-size: 12px; color: var(--text-2);">
    <span class="tabular" style="font-weight: 500;">9:41</span>
    <span style="font-size: 13px; color: var(--text-1);" class="serif">Musify</span>
    <span style="font-size: 11px;">5G &bull; 100%</span>
  </div>

  <!-- Offline banner if active -->
  ${view === 'offline' ? `
    <div style="margin-top: 8px; background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-sm); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
      <div style="display: flex; align-items: center; gap: 8px; color: var(--text-2);">
        <span style="color: var(--accent-ink);">${ICONS.wifiOff}</span>
        <span>Offline mode active</span>
      </div>
      <span style="color: var(--accent); font-weight: 500;">Retry</span>
    </div>
  ` : ''}

  ${content}
  ${morphOverlay}

</body>
</html>`;
}

// -------------------------------------------------------------
// TOKENS SPECIFICATION PAGE (1440 x 900)
// -------------------------------------------------------------
function buildTokensHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Musify Tokens Spec</title>
  <style>
    ${baseStyles('quiet')}
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--hairline); font-size: 13px; }
    th { color: var(--text-3); font-weight: 500; font-size: 12px; }
    .chip-color { width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
  </style>
</head>
<body style="width: 1440px; height: 900px; padding: 48px; background: #0B0B0C; overflow-y: auto;">
  <div style="margin-bottom: 32px;">
    <h1 style="font-size: 36px; color: var(--text-1);" class="serif">Musify Design Tokens</h1>
    <p style="font-size: 14px; color: var(--text-2); margin-top: 6px;">Graphite surface ramp, restrained crimson accent, self-hosted Instrument type, and WCAG AA contrast matrix.</p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
    <!-- Color Tokens Table -->
    <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 24px;">
      <h2 style="font-size: 20px; color: var(--text-1);" class="serif">Color Variables</h2>
      <table>
        <thead>
          <tr>
            <th>Swatch</th>
            <th>Token</th>
            <th>Hex / RGBA</th>
            <th>Contrast on #141415</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><div class="chip-color" style="background: #0B0B0C;"></div></td>
            <td><code>--bg-stage</code></td>
            <td>#0B0B0C</td>
            <td>Stage Base (Canvas)</td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #141415;"></div></td>
            <td><code>--bg-base</code></td>
            <td>#141415</td>
            <td>App Base Surface</td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #19191B;"></div></td>
            <td><code>--bg-card</code></td>
            <td>#19191B</td>
            <td>Container / Card</td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #232325;"></div></td>
            <td><code>--bg-raised</code></td>
            <td>#232325</td>
            <td>Active / Hover Fill</td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #EDEDED;"></div></td>
            <td><code>--text-1</code></td>
            <td>#EDEDED</td>
            <td><strong style="color: #4CC38A;">12.4:1 (AAA)</strong></td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #A1A1A6;"></div></td>
            <td><code>--text-2</code></td>
            <td>#A1A1A6</td>
            <td><strong style="color: #4CC38A;">6.6:1 (AA)</strong></td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #85858B;"></div></td>
            <td><code>--text-3</code></td>
            <td>#85858B</td>
            <td><strong style="color: #4CC38A;">4.8:1 (AA)</strong></td>
          </tr>
          <tr>
            <td><div class="chip-color" style="background: #D92B38;"></div></td>
            <td><code>--accent</code></td>
            <td>#D92B38</td>
            <td><strong style="color: #4CC38A;">4.8:1 on dark</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Spacing & Radii & Typography -->
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 24px;">
        <h2 style="font-size: 20px; color: var(--text-1);" class="serif">Concentric Radii & Spacing</h2>
        <p style="font-size: 13px; color: var(--text-3); margin: 6px 0 16px;">Mathematical nested rule: R_inner = R_outer - padding</p>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <span class="pill">radius-sm: 6px</span>
          <span class="pill">radius-md: 10px</span>
          <span class="pill">radius-lg: 14px</span>
          <span class="pill">radius-xl: 20px</span>
          <span class="pill">radius-full: 9999px</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; font-size: 12px; color: var(--text-3);" class="tabular">
          <span>Scale: 4px</span> &bull; <span>8px</span> &bull; <span>12px</span> &bull; <span>16px</span> &bull; <span>20px</span> &bull; <span>24px</span> &bull; <span>32px</span> &bull; <span>40px</span> &bull; <span>48px</span> &bull; <span>64px</span>
        </div>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 24px;">
        <h2 style="font-size: 20px; color: var(--text-1);" class="serif">Type System</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
          <div>
            <div style="font-size: 28px;" class="serif">Instrument Serif Display (32–40px)</div>
            <div style="font-size: 12px; color: var(--text-3);">Track titles, active lyric lines, landing hero. Zero italic.</div>
          </div>
          <div>
            <div style="font-size: 15px; font-weight: 500;">Instrument Sans Interface (13–16px)</div>
            <div style="font-size: 12px; color: var(--text-3);">Navigation, buttons, lists, tabular numerals for times (tabular-nums).</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// -------------------------------------------------------------
// COMPONENTS SPECIFICATION PAGE (1440 x 900)
// -------------------------------------------------------------
function buildComponentsHtml() {
  const states = ['Default', 'Hover', 'Focus-Visible', 'Pressed', 'Disabled', 'Loading', 'Selected', 'Error'];
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Musify Components & 8 States</title>
  <style>
    ${baseStyles('quiet')}
    .grid-row { display: grid; grid-template-columns: 140px repeat(8, 1fr); align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--hairline); }
    .col-header { font-size: 12px; color: var(--text-3); text-align: center; }
    .cell { display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body style="width: 1440px; height: 900px; padding: 40px; background: #0B0B0C; overflow-y: auto;">
  <div style="margin-bottom: 24px;">
    <h1 style="font-size: 32px; color: var(--text-1);" class="serif">Core Components & 8 Interaction States</h1>
    <p style="font-size: 13px; color: var(--text-2); margin-top: 4px;">Every component designed with auto-layout variants across Default, Hover, Focus-Visible, Pressed, Disabled, Loading, Selected, and Error.</p>
  </div>

  <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 20px 24px;">
    <!-- Headers -->
    <div class="grid-row" style="border-bottom: 2px solid var(--hairline);">
      <span style="font-size: 13px; font-weight: 500; color: var(--text-1);">Component</span>
      ${states.map(s => `<span class="col-header">${s}</span>`).join('')}
    </div>

    <!-- 1. Play Button (52px) -->
    <div class="grid-row">
      <span style="font-size: 13px; color: var(--text-2);">Play Button</span>
      <!-- Default -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center;">${ICONS.play}</div></div>
      <!-- Hover -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: #F0424E; color: #FFF; display: flex; align-items: center; justify-content: center;">${ICONS.play}</div></div>
      <!-- Focus-Visible -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center; outline: 2px solid #FFF; outline-offset: 2px;">${ICONS.play}</div></div>
      <!-- Pressed -->
      <div class="cell"><div style="width: 42px; height: 42px; border-radius: 9999px; background: #C42632; color: #FFF; display: flex; align-items: center; justify-content: center; transform: scale(0.96);">${ICONS.play}</div></div>
      <!-- Disabled -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: var(--bg-raised); color: var(--text-3); opacity: 0.4; display: flex; align-items: center; justify-content: center;">${ICONS.play}</div></div>
      <!-- Loading -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: var(--accent); color: #FFF; display: flex; align-items: center; justify-content: center;">${ICONS.loader}</div></div>
      <!-- Selected -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: #FFF; color: #000; display: flex; align-items: center; justify-content: center;">${ICONS.pause}</div></div>
      <!-- Error -->
      <div class="cell"><div style="width: 44px; height: 44px; border-radius: 9999px; background: #E5484D; color: #FFF; display: flex; align-items: center; justify-content: center;">${ICONS.alertCircle}</div></div>
    </div>

    <!-- 2. Icon Button -->
    <div class="grid-row">
      <span style="font-size: 13px; color: var(--text-2);">Icon Button</span>
      <!-- Default -->
      <div class="cell"><div class="icon-btn">${ICONS.skipForward}</div></div>
      <!-- Hover -->
      <div class="cell"><div class="icon-btn" style="background: var(--bg-raised); color: var(--text-1);">${ICONS.skipForward}</div></div>
      <!-- Focus-Visible -->
      <div class="cell"><div class="icon-btn" style="outline: 2px solid var(--accent);">${ICONS.skipForward}</div></div>
      <!-- Pressed -->
      <div class="cell"><div class="icon-btn" style="transform: scale(0.92); color: var(--text-1);">${ICONS.skipForward}</div></div>
      <!-- Disabled -->
      <div class="cell"><div class="icon-btn" style="opacity: 0.3;">${ICONS.skipForward}</div></div>
      <!-- Loading -->
      <div class="cell"><div class="icon-btn">${ICONS.loader}</div></div>
      <!-- Selected -->
      <div class="cell"><div class="icon-btn" style="color: var(--accent);">${ICONS.heartFilled}</div></div>
      <!-- Error -->
      <div class="cell"><div class="icon-btn" style="color: #E5484D;">${ICONS.alertCircle}</div></div>
    </div>

    <!-- 3. Seek Bar (Wavy & Straight) -->
    <div class="grid-row">
      <span style="font-size: 13px; color: var(--text-2);">Seek Bar</span>
      <!-- Default Playing -->
      <div class="cell"><svg width="80" height="12"><path d="M 0 6 Q 6 3 12 6 T 24 6 T 36 6 T 48 6 T 60 6 T 72 6 T 80 6" fill="none" stroke="var(--accent)" stroke-width="2"/></svg></div>
      <!-- Hover -->
      <div class="cell"><svg width="80" height="12"><path d="M 0 6 Q 6 3 12 6 T 24 6 T 36 6 T 48 6 T 60 6 T 72 6 T 80 6" fill="none" stroke="#F0424E" stroke-width="2.5"/><circle cx="48" cy="6" r="4" fill="#FFF"/></svg></div>
      <!-- Focus-Visible -->
      <div class="cell" style="outline: 1px dashed var(--accent);"><svg width="80" height="12"><path d="M 0 6 L 80 6" fill="none" stroke="var(--accent)" stroke-width="2"/><circle cx="48" cy="6" r="4" fill="#FFF"/></svg></div>
      <!-- Pressed (Drag Tooltip) -->
      <div class="cell"><div style="position: relative;"><svg width="80" height="12"><path d="M 0 6 Q 6 3 12 6 T 24 6 T 36 6 T 48 6 T 60 6 T 72 6 T 80 6" fill="none" stroke="var(--accent)" stroke-width="2.5"/><circle cx="48" cy="6" r="5" fill="#FFF"/></svg><span style="position: absolute; top: -16px; left: 34px; font-size: 10px; background: #000; padding: 1px 4px; border-radius: 3px;">2:34</span></div></div>
      <!-- Disabled -->
      <div class="cell"><svg width="80" height="12" style="opacity: 0.3;"><path d="M 0 6 L 80 6" fill="none" stroke="var(--text-3)" stroke-width="2"/></svg></div>
      <!-- Loading Skeleton -->
      <div class="cell"><div style="width: 80px; height: 4px; background: var(--bg-raised); border-radius: 2px;"></div></div>
      <!-- Selected -->
      <div class="cell"><svg width="80" height="12"><path d="M 0 6 L 80 6" fill="none" stroke="var(--accent)" stroke-width="3"/></svg></div>
      <!-- Error -->
      <div class="cell"><svg width="80" height="12"><path d="M 0 6 L 80 6" fill="none" stroke="#E5484D" stroke-width="2"/></svg></div>
    </div>

    <!-- 4. Track Row (56px) -->
    <div class="grid-row">
      <span style="font-size: 13px; color: var(--text-2);">Track Row</span>
      <div class="cell"><div style="font-size: 12px;">Track Row (Resting)</div></div>
      <div class="cell"><div style="font-size: 12px; background: var(--bg-raised); padding: 4px 8px; border-radius: 6px;">Hover Fill</div></div>
      <div class="cell"><div style="font-size: 12px; outline: 1px solid var(--accent); padding: 4px 8px; border-radius: 6px;">Focus</div></div>
      <div class="cell"><div style="font-size: 12px; transform: scale(0.98);">Pressed</div></div>
      <div class="cell"><div style="font-size: 12px; opacity: 0.3;">Disabled</div></div>
      <div class="cell"><div style="width: 70px; height: 16px; background: var(--bg-raised); border-radius: 4px;"></div></div>
      <div class="cell"><div style="font-size: 12px; color: var(--accent); font-weight: 500;">Active Playing</div></div>
      <div class="cell"><div style="font-size: 12px; color: #E5484D;">Unavailable</div></div>
    </div>

    <!-- 5. Chip / Filter Pill -->
    <div class="grid-row">
      <span style="font-size: 13px; color: var(--text-2);">Chip / Pill</span>
      <div class="cell"><span class="pill">Late night</span></div>
      <div class="cell"><span class="pill" style="border-color: rgba(255,255,255,0.2);">Late night</span></div>
      <div class="cell"><span class="pill" style="outline: 2px solid var(--accent);">Late night</span></div>
      <div class="cell"><span class="pill" style="transform: scale(0.96);">Late night</span></div>
      <div class="cell"><span class="pill" style="opacity: 0.35;">Late night</span></div>
      <div class="cell"><span class="pill" style="color: transparent;">...</span></div>
      <div class="cell"><span class="pill" style="background: var(--accent); color: #FFF; border: none;">Selected</span></div>
      <div class="cell"><span class="pill" style="border-color: #E5484D; color: #E5484D;">Error</span></div>
    </div>

    <!-- 6. Output Device Pill -->
    <div class="grid-row">
      <span style="font-size: 13px; color: var(--text-2);">Output Pill</span>
      <div class="cell"><span class="pill">${ICONS.speaker} MacBook</span></div>
      <div class="cell"><span class="pill" style="background: var(--bg-card);">${ICONS.speaker} MacBook</span></div>
      <div class="cell"><span class="pill" style="outline: 2px solid var(--accent);">${ICONS.speaker} MacBook</span></div>
      <div class="cell"><span class="pill" style="transform: scale(0.95);">${ICONS.speaker} MacBook</span></div>
      <div class="cell"><span class="pill" style="opacity: 0.3;">${ICONS.speaker} AirPlay</span></div>
      <div class="cell"><span class="pill">${ICONS.loader} Connecting</span></div>
      <div class="cell"><span class="pill" style="border-color: var(--accent); color: var(--text-1);">${ICONS.speaker} Connected</span></div>
      <div class="cell"><span class="pill" style="border-color: #E5484D; color: #E5484D;">Failed</span></div>
    </div>
  </div>
</body>
</html>`;
}

// -------------------------------------------------------------
// MOTION SPECIFICATION PAGE (1440 x 900)
// -------------------------------------------------------------
function buildMotionSpecHtml() {
  const specs = [
    { name: "Play / Pause Swap", prop: "transform: scale, opacity", from: "1.0, 1.0", to: "0.95 -> 1.0, 1.0", dur: "140ms", ease: "cubic-bezier(0.22, 1, 0.36, 1)", trig: "User tap / Spacebar" },
    { name: "Seekbar Wave Vibration", prop: "SVG path cycle (d)", from: "x = 0", to: "x = 24px (continuous loop)", dur: "1200ms", ease: "linear", trig: "Continuous while isPlaying" },
    { name: "Seekbar Pause Settle", prop: "amplitude (2px -> 0px)", from: "amplitude = 2px", to: "amplitude = 0px (flat)", dur: "180ms", ease: "cubic-bezier(0.16, 1, 0.3, 1)", trig: "Playback pause event" },
    { name: "Active Lyric Word Sweep", prop: "clip-path / gradient sweep", from: "0% fill", to: "100% fill", dur: "Syllable duration", ease: "linear", trig: "Audio timecode sync" },
    { name: "Lyrics Line Scroll", prop: "transform: translateY", from: "current y", to: "y - 48px (1/3 screen top)", dur: "260ms", ease: "Spring (k=380, c=40, ζ=1.0)", trig: "Active line change" },
    { name: "Mini to Full Player Morph", prop: "height, radius, pos", from: "64px dock, r=14px", to: "100% stage, r=0px", dur: "320ms", ease: "cubic-bezier(0.22, 1, 0.36, 1)", trig: "Swipe-up / Tap mini-player" },
    { name: "Artwork Track Crossfade", prop: "opacity, scale", from: "1.0, 1.0", to: "Out: 0, 0.96; In: 1, 1.0", dur: "240ms", ease: "cubic-bezier(0.4, 0, 0.2, 1)", trig: "Next / Previous track change" },
    { name: "Button Press Feedback", prop: "transform: scale", from: "1.0", to: "0.97", dur: "100ms", ease: "Instantaneous release", trig: "Pointer down / pointer up" },
    { name: "Focus-Visible Indicator", prop: "outline-color", from: "transparent", to: "--accent (2px solid)", dur: "Instant (0ms)", ease: "Step", trig: "Tab key keyboard focus" }
  ];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Musify Motion Specification</title>
  <style>
    ${baseStyles('quiet')}
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--hairline); font-size: 13px; }
    th { color: var(--text-3); font-weight: 500; font-size: 12px; }
  </style>
</head>
<body style="width: 1440px; height: 900px; padding: 48px; background: #0B0B0C; overflow-y: auto;">
  <div style="margin-bottom: 24px;">
    <h1 style="font-size: 36px; color: var(--text-1);" class="serif">Musify Motion Specification</h1>
    <p style="font-size: 14px; color: var(--text-2); margin-top: 6px;">
      Calibrated spring physics (zeta = 1.0 critically damped), 120Hz frame pacing, and zero decorative loops at rest.
    </p>
  </div>

  <div style="background: var(--bg-card); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 24px;">
    <table>
      <thead>
        <tr>
          <th>Transition Name</th>
          <th>Animated Property</th>
          <th>From Value</th>
          <th>To Value</th>
          <th>Duration</th>
          <th>Easing Function</th>
          <th>Interaction Trigger</th>
        </tr>
      </thead>
      <tbody>
        ${specs.map(s => `
          <tr>
            <td style="font-weight: 500; color: var(--text-1);">${s.name}</td>
            <td><code>${s.prop}</code></td>
            <td style="color: var(--text-3);">${s.from}</td>
            <td style="color: var(--accent-ink);">${s.to}</td>
            <td class="tabular">${s.dur}</td>
            <td><code style="font-size: 11px;">${s.ease}</code></td>
            <td style="color: var(--text-2);">${s.trig}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

// -------------------------------------------------------------
// BATCH EXECUTION RUNNER
// -------------------------------------------------------------
const RENDER_TASKS = [
  // Page 1: Tokens
  { name: "page-1-tokens-spec.png", html: buildTokensHtml(), w: 1440, h: 900 },

  // Page 4: Components
  { name: "page-4-components-8-states.png", html: buildComponentsHtml(), w: 1440, h: 900 },

  // Page 6: Motion Spec
  { name: "page-6-motion-spec-table.png", html: buildMotionSpecHtml(), w: 1440, h: 900 },

  // Variant A (Desktop 1440 x 900)
  { name: "variant-a-desktop-now-playing-playing.png", html: buildDesktopHtml({ title: "Variant A Playing", variant: 'quiet', isPlaying: true, isPaused: false }), w: 1440, h: 900 },
  { name: "variant-a-desktop-now-playing-paused.png", html: buildDesktopHtml({ title: "Variant A Paused", variant: 'quiet', isPlaying: false, isPaused: true }), w: 1440, h: 900 },
  { name: "variant-a-desktop-lyrics-moment-1-upcoming.png", html: buildDesktopHtml({ title: "Lyrics Moment 1", variant: 'quiet', lyricsMoment: 1 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-lyrics-moment-2-singing.png", html: buildDesktopHtml({ title: "Lyrics Moment 2", variant: 'quiet', lyricsMoment: 2 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-lyrics-moment-3-sung.png", html: buildDesktopHtml({ title: "Lyrics Moment 3", variant: 'quiet', lyricsMoment: 3 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-mini-player-docked.png", html: buildDesktopHtml({ title: "Mini Player Docked", variant: 'quiet', miniMorph: 0 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-mini-player-morph-1.png", html: buildDesktopHtml({ title: "Mini Player Morph 1", variant: 'quiet', miniMorph: 1 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-mini-player-morph-2.png", html: buildDesktopHtml({ title: "Mini Player Morph 2", variant: 'quiet', miniMorph: 2 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-mini-player-morph-3.png", html: buildDesktopHtml({ title: "Mini Player Morph 3", variant: 'quiet', miniMorph: 3 }), w: 1440, h: 900 },
  { name: "variant-a-desktop-mini-player-expanded.png", html: buildDesktopHtml({ title: "Mini Player Expanded", variant: 'quiet', view: 'player' }), w: 1440, h: 900 },
  { name: "variant-a-desktop-track-change-crossfade.png", html: buildDesktopHtml({ title: "Track Change Crossfade", variant: 'quiet', crossfade: true }), w: 1440, h: 900 },
  { name: "variant-a-desktop-home.png", html: buildDesktopHtml({ title: "Home Desktop", variant: 'quiet', view: 'home' }), w: 1440, h: 900 },
  { name: "variant-a-desktop-search.png", html: buildDesktopHtml({ title: "Search Desktop", variant: 'quiet', view: 'search' }), w: 1440, h: 900 },
  { name: "variant-a-desktop-library.png", html: buildDesktopHtml({ title: "Library Desktop", variant: 'quiet', view: 'library' }), w: 1440, h: 900 },
  { name: "variant-a-desktop-empty-state.png", html: buildDesktopHtml({ title: "Empty State Desktop", variant: 'quiet', view: 'empty' }), w: 1440, h: 900 },
  { name: "variant-a-desktop-loading-skeleton.png", html: buildDesktopHtml({ title: "Skeleton Desktop", variant: 'quiet', view: 'skeleton' }), w: 1440, h: 900 },
  { name: "variant-a-desktop-offline-banner.png", html: buildDesktopHtml({ title: "Offline Banner Desktop", variant: 'quiet', view: 'offline' }), w: 1440, h: 900 },

  // Variant A (Mobile 390 x 844)
  { name: "variant-a-mobile-now-playing-playing.png", html: buildMobileHtml({ title: "Variant A Mobile Playing", variant: 'quiet', isPlaying: true, isPaused: false }), w: 390, h: 844 },
  { name: "variant-a-mobile-now-playing-paused.png", html: buildMobileHtml({ title: "Variant A Mobile Paused", variant: 'quiet', isPlaying: false, isPaused: true }), w: 390, h: 844 },
  { name: "variant-a-mobile-lyrics-moment-1-upcoming.png", html: buildMobileHtml({ title: "Mobile Lyrics Moment 1", variant: 'quiet', lyricsMoment: 1 }), w: 390, h: 844 },
  { name: "variant-a-mobile-lyrics-moment-2-singing.png", html: buildMobileHtml({ title: "Mobile Lyrics Moment 2", variant: 'quiet', lyricsMoment: 2 }), w: 390, h: 844 },
  { name: "variant-a-mobile-lyrics-moment-3-sung.png", html: buildMobileHtml({ title: "Mobile Lyrics Moment 3", variant: 'quiet', lyricsMoment: 3 }), w: 390, h: 844 },
  { name: "variant-a-mobile-mini-player-docked.png", html: buildMobileHtml({ title: "Mobile Mini Player Docked", variant: 'quiet', miniMorph: 0 }), w: 390, h: 844 },
  { name: "variant-a-mobile-mini-player-morph-1.png", html: buildMobileHtml({ title: "Mobile Mini Player Morph 1", variant: 'quiet', miniMorph: 1 }), w: 390, h: 844 },
  { name: "variant-a-mobile-mini-player-morph-2.png", html: buildMobileHtml({ title: "Mobile Mini Player Morph 2", variant: 'quiet', miniMorph: 2 }), w: 390, h: 844 },
  { name: "variant-a-mobile-mini-player-morph-3.png", html: buildMobileHtml({ title: "Mobile Mini Player Morph 3", variant: 'quiet', miniMorph: 3 }), w: 390, h: 844 },
  { name: "variant-a-mobile-mini-player-expanded.png", html: buildMobileHtml({ title: "Mobile Mini Player Expanded", variant: 'quiet', view: 'player' }), w: 390, h: 844 },
  { name: "variant-a-mobile-track-change-crossfade.png", html: buildMobileHtml({ title: "Mobile Track Change Crossfade", variant: 'quiet', crossfade: true }), w: 390, h: 844 },
  { name: "variant-a-mobile-home.png", html: buildMobileHtml({ title: "Mobile Home", variant: 'quiet', view: 'home' }), w: 390, h: 844 },
  { name: "variant-a-mobile-search.png", html: buildMobileHtml({ title: "Mobile Search", variant: 'quiet', view: 'search' }), w: 390, h: 844 },
  { name: "variant-a-mobile-library.png", html: buildMobileHtml({ title: "Mobile Library", variant: 'quiet', view: 'library' }), w: 390, h: 844 },
  { name: "variant-a-mobile-empty-state.png", html: buildMobileHtml({ title: "Mobile Empty State", variant: 'quiet', view: 'empty' }), w: 390, h: 844 },
  { name: "variant-a-mobile-loading-skeleton.png", html: buildMobileHtml({ title: "Mobile Skeleton", variant: 'quiet', view: 'skeleton' }), w: 390, h: 844 },
  { name: "variant-a-mobile-offline-banner.png", html: buildMobileHtml({ title: "Mobile Offline Banner", variant: 'quiet', view: 'offline' }), w: 390, h: 844 },

  // Variant B Warm (Desktop & Mobile)
  { name: "variant-b-warm-desktop-now-playing-playing.png", html: buildDesktopHtml({ title: "Variant B Warm Playing", variant: 'warm', isPlaying: true, isPaused: false }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-now-playing-paused.png", html: buildDesktopHtml({ title: "Variant B Warm Paused", variant: 'warm', isPlaying: false, isPaused: true }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-lyrics-moment-1-upcoming.png", html: buildDesktopHtml({ title: "Variant B Warm Lyrics Moment 1", variant: 'warm', lyricsMoment: 1 }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-lyrics-singing.png", html: buildDesktopHtml({ title: "Variant B Warm Lyrics", variant: 'warm', lyricsMoment: 2 }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-lyrics-moment-3-sung.png", html: buildDesktopHtml({ title: "Variant B Warm Lyrics Moment 3", variant: 'warm', lyricsMoment: 3 }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-mini-player-docked.png", html: buildDesktopHtml({ title: "Variant B Warm Mini Docked", variant: 'warm', miniMorph: 0 }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-mini-player-expanded.png", html: buildDesktopHtml({ title: "Variant B Warm Mini Expanded", variant: 'warm', view: 'player' }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-track-change-crossfade.png", html: buildDesktopHtml({ title: "Variant B Warm Crossfade", variant: 'warm', crossfade: true }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-home.png", html: buildDesktopHtml({ title: "Variant B Warm Home", variant: 'warm', view: 'home' }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-search.png", html: buildDesktopHtml({ title: "Variant B Warm Search", variant: 'warm', view: 'search' }), w: 1440, h: 900 },
  { name: "variant-b-warm-desktop-library.png", html: buildDesktopHtml({ title: "Variant B Warm Library", variant: 'warm', view: 'library' }), w: 1440, h: 900 },

  { name: "variant-b-warm-mobile-now-playing-playing.png", html: buildMobileHtml({ title: "Variant B Warm Mobile", variant: 'warm', isPlaying: true, isPaused: false }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-now-playing-paused.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Paused", variant: 'warm', isPlaying: false, isPaused: true }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-lyrics-moment-1-upcoming.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Lyrics Moment 1", variant: 'warm', lyricsMoment: 1 }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-lyrics-singing.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Lyrics", variant: 'warm', lyricsMoment: 2 }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-lyrics-moment-3-sung.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Lyrics Moment 3", variant: 'warm', lyricsMoment: 3 }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-mini-player-docked.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Mini Docked", variant: 'warm', miniMorph: 0 }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-mini-player-expanded.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Mini Expanded", variant: 'warm', view: 'player' }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-track-change-crossfade.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Crossfade", variant: 'warm', crossfade: true }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-home.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Home", variant: 'warm', view: 'home' }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-search.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Search", variant: 'warm', view: 'search' }), w: 390, h: 844 },
  { name: "variant-b-warm-mobile-library.png", html: buildMobileHtml({ title: "Variant B Warm Mobile Library", variant: 'warm', view: 'library' }), w: 390, h: 844 },

  // Variant B Cool (Desktop & Mobile)
  { name: "variant-b-cool-desktop-now-playing-playing.png", html: buildDesktopHtml({ title: "Variant B Cool Playing", variant: 'cool', isPlaying: true, isPaused: false }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-now-playing-paused.png", html: buildDesktopHtml({ title: "Variant B Cool Paused", variant: 'cool', isPlaying: false, isPaused: true }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-lyrics-moment-1-upcoming.png", html: buildDesktopHtml({ title: "Variant B Cool Lyrics Moment 1", variant: 'cool', lyricsMoment: 1 }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-lyrics-singing.png", html: buildDesktopHtml({ title: "Variant B Cool Lyrics", variant: 'cool', lyricsMoment: 2 }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-lyrics-moment-3-sung.png", html: buildDesktopHtml({ title: "Variant B Cool Lyrics Moment 3", variant: 'cool', lyricsMoment: 3 }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-mini-player-docked.png", html: buildDesktopHtml({ title: "Variant B Cool Mini Docked", variant: 'cool', miniMorph: 0 }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-mini-player-expanded.png", html: buildDesktopHtml({ title: "Variant B Cool Mini Expanded", variant: 'cool', view: 'player' }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-track-change-crossfade.png", html: buildDesktopHtml({ title: "Variant B Cool Crossfade", variant: 'cool', crossfade: true }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-home.png", html: buildDesktopHtml({ title: "Variant B Cool Home", variant: 'cool', view: 'home' }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-search.png", html: buildDesktopHtml({ title: "Variant B Cool Search", variant: 'cool', view: 'search' }), w: 1440, h: 900 },
  { name: "variant-b-cool-desktop-library.png", html: buildDesktopHtml({ title: "Variant B Cool Library", variant: 'cool', view: 'library' }), w: 1440, h: 900 },

  { name: "variant-b-cool-mobile-now-playing-playing.png", html: buildMobileHtml({ title: "Variant B Cool Mobile", variant: 'cool', isPlaying: true, isPaused: false }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-now-playing-paused.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Paused", variant: 'cool', isPlaying: false, isPaused: true }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-lyrics-moment-1-upcoming.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Lyrics Moment 1", variant: 'cool', lyricsMoment: 1 }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-lyrics-singing.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Lyrics", variant: 'cool', lyricsMoment: 2 }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-lyrics-moment-3-sung.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Lyrics Moment 3", variant: 'cool', lyricsMoment: 3 }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-mini-player-docked.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Mini Docked", variant: 'cool', miniMorph: 0 }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-mini-player-expanded.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Mini Expanded", variant: 'cool', view: 'player' }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-track-change-crossfade.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Crossfade", variant: 'cool', crossfade: true }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-home.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Home", variant: 'cool', view: 'home' }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-search.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Search", variant: 'cool', view: 'search' }), w: 390, h: 844 },
  { name: "variant-b-cool-mobile-library.png", html: buildMobileHtml({ title: "Variant B Cool Mobile Library", variant: 'cool', view: 'library' }), w: 390, h: 844 },

  // Variant B Near-Monochrome (Desktop & Mobile)
  { name: "variant-b-monochrome-desktop-now-playing-playing.png", html: buildDesktopHtml({ title: "Variant B Monochrome Playing", variant: 'monochrome', isPlaying: true, isPaused: false }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-now-playing-paused.png", html: buildDesktopHtml({ title: "Variant B Monochrome Paused", variant: 'monochrome', isPlaying: false, isPaused: true }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-lyrics-moment-1-upcoming.png", html: buildDesktopHtml({ title: "Variant B Monochrome Lyrics Moment 1", variant: 'monochrome', lyricsMoment: 1 }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-lyrics-singing.png", html: buildDesktopHtml({ title: "Variant B Monochrome Lyrics", variant: 'monochrome', lyricsMoment: 2 }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-lyrics-moment-3-sung.png", html: buildDesktopHtml({ title: "Variant B Monochrome Lyrics Moment 3", variant: 'monochrome', lyricsMoment: 3 }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-mini-player-docked.png", html: buildDesktopHtml({ title: "Variant B Monochrome Mini Docked", variant: 'monochrome', miniMorph: 0 }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-mini-player-expanded.png", html: buildDesktopHtml({ title: "Variant B Monochrome Mini Expanded", variant: 'monochrome', view: 'player' }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-track-change-crossfade.png", html: buildDesktopHtml({ title: "Variant B Monochrome Crossfade", variant: 'monochrome', crossfade: true }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-home.png", html: buildDesktopHtml({ title: "Variant B Monochrome Home", variant: 'monochrome', view: 'home' }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-search.png", html: buildDesktopHtml({ title: "Variant B Monochrome Search", variant: 'monochrome', view: 'search' }), w: 1440, h: 900 },
  { name: "variant-b-monochrome-desktop-library.png", html: buildDesktopHtml({ title: "Variant B Monochrome Library", variant: 'monochrome', view: 'library' }), w: 1440, h: 900 },

  { name: "variant-b-monochrome-mobile-now-playing-playing.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile", variant: 'monochrome', isPlaying: true, isPaused: false }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-now-playing-paused.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Paused", variant: 'monochrome', isPlaying: false, isPaused: true }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-lyrics-moment-1-upcoming.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Lyrics Moment 1", variant: 'monochrome', lyricsMoment: 1 }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-lyrics-singing.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Lyrics", variant: 'monochrome', lyricsMoment: 2 }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-lyrics-moment-3-sung.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Lyrics Moment 3", variant: 'monochrome', lyricsMoment: 3 }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-mini-player-docked.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Mini Docked", variant: 'monochrome', miniMorph: 0 }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-mini-player-expanded.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Mini Expanded", variant: 'monochrome', view: 'player' }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-track-change-crossfade.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Crossfade", variant: 'monochrome', crossfade: true }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-home.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Home", variant: 'monochrome', view: 'home' }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-search.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Search", variant: 'monochrome', view: 'search' }), w: 390, h: 844 },
  { name: "variant-b-monochrome-mobile-library.png", html: buildMobileHtml({ title: "Variant B Monochrome Mobile Library", variant: 'monochrome', view: 'library' }), w: 390, h: 844 }
];

console.log(`Starting export of ${RENDER_TASKS.length} screens to ${exportsDir}...`);

let successCount = 0;
for (const task of RENDER_TASKS) {
  const tempHtmlPath = path.resolve(tempDir, `${task.name}.html`);
  const outPngPath = path.resolve(exportsDir, task.name);

  fs.writeFileSync(tempHtmlPath, task.html, 'utf8');
  const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;

  try {
    execFileSync(chromeExe, [
      '--headless=new',
      `--user-data-dir=${chromeProfile}`,
      `--screenshot=${outPngPath}`,
      `--window-size=${task.w},${task.h}`,
      '--hide-scrollbars',
      '--disable-gpu',
      fileUrl
    ], { stdio: 'ignore' });

    if (fs.existsSync(outPngPath)) {
      const stats = fs.statSync(outPngPath);
      console.log(`[PASS] ${task.name} (${task.w}x${task.h}, ${(stats.size / 1024).toFixed(1)} KB)`);
      successCount++;
    } else {
      console.error(`[FAIL] ${task.name} was not created`);
    }
  } catch (err) {
    console.error(`[ERROR] ${task.name}:`, err.message);
  }
}

console.log(`\nCompleted: ${successCount} / ${RENDER_TASKS.length} screens successfully rendered.`);
