# Musify Player — Figma Design File

- **File Name:** Musify Player
- **Figma File URL:** [https://www.figma.com/design/bnEkyVmLu5vDDo4GzkUh7M](https://www.figma.com/design/bnEkyVmLu5vDDo4GzkUh7M)
- **File Key:** `bnEkyVmLu5vDDo4GzkUh7M`
- **Team / Organization:** `team::1661658192856158141` (ISTAK AHAMED)
- **Session UUID:** `796d9dea-f7fa-4ae1-9bd7-163ce6095c38`
- **Design Specifications Followed:** `DESIGN.md` (Restrained graphite ramp, Crimson `#D92B38` accent, self-hosted Instrument Sans & Instrument Serif typography).

---

## 1. Ambition & Echo Music Benchmark Analysis

Echo Music (`github.com/EchoMusicApp/Echo-Music`) provides critical insights into why a music player feels truly "alive" rather than a static web interface with an audio player:
1. **Dynamic Syllable-Accurate Lyrics:** Continuous left-to-right fill progress on the active word, with resting dimming on surrounding lines and smooth line transitions.
2. **Artwork-Derived Low-Chroma Theming (Material You Style):** Surfaces stay dark ($L \approx 0.12 - 0.18$) and low-chroma (OKLCH chroma $< 0.04$) so the interface never turns into an over-saturated rainbow, while extracting the artwork hue for active player highlights (play button, seek fill, and sung lyric line).
3. **Continuous Kinetic State (The Wavy Scrubber):** A live sinusoidal wave ($A=2\text{px}, \lambda=24\text{px}$) while audio is streaming that settles into a flat line when paused. This provides immediate, non-verbal feedback on playback state.
4. **Shared Element Spatial Continuity:** Expanding from docked mini-player to full-stage now-playing sheet maintains seamless physical continuity.

---

## 2. Figma File Architecture & Pages

The Figma file is organized into 6 structured pages:

### Page 1: Tokens
- **Figma Variables (Collection: `Musify Tokens`):**
  - **Surfaces:** `--bg-stage` (`#0B0B0C`), `--bg-base` (`#141415`), `--bg-card` (`#19191B`), `--bg-raised` (`#232325`), `--hairline` (`rgba(237, 237, 237, 0.08)`).
  - **Text Roles:**
    - `--text-1`: `#EDEDED` (**12.4:1 AAA** on `#141415`)
    - `--text-2`: `#A1A1A6` (**6.6:1 AA** on `#141415`)
    - `--text-3`: `#85858B` (**4.8:1 AA** on `#141415`)
  - **Accents:**
    - `--accent`: `#D92B38` (**4.8:1** on dark / white text)
    - `--accent-ink`: `#FF5A64` (**6.5:1** on dark)
    - `--positive`: `#4CC38A` (**7.2:1**)
    - `--negative`: `#E5484D` (**4.9:1**)
  - **Spacing Scale:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.
  - **Concentric Radii:** $R_{inner} = R_{outer} - \text{padding}$ (`6px`, `10px`, `14px`, `20px`, `9999px`).
  - **Typography Styles:** Instrument Sans (Interface, 400 & 500, tabular numbers for timing) + Instrument Serif (Display 32–40px, regular, no italic).

### Page 2: Variant A "Quiet"
- Near-black graphite surfaces with single crimson red accent (`#D92B38`).
- One moment per screen that is genuinely rich (the album artwork and the active lyric line). Everything else quiet.
- Complete Desktop ($1440 \times 900$) and Mobile ($390 \times 844$) Now Playing screens.

### Page 3: Variant B "Artwork colour"
- Material You / Echo-style dark surfaces (chroma $< 0.04$ in OKLCH).
- Artwork hue replaces red in the active lyric word, seek fill, and play button.
- Exhibited across 3 distinct artworks:
  1. **Warm Palette (Amber / Terracotta):** Leon Bridges – *Texas Sun* (Accent: `#E28743`, Surfaces: `#0F0C0A`, `#181411`, `#201A15`).
  2. **Cool Palette (Cobalt / Cyan):** Kroma – *Solaris* (Accent: `#38A3D4`, Surfaces: `#090D12`, `#10161E`, `#151E28`).
  3. **Near-Monochrome (Slate Charcoal):** Burial – *Substratum* (Accent: `#9CAAB8`, Surfaces: `#0C0D0E`, `#141517`, `#1A1C1F`).

### Page 4: Components (Auto-Layout, 8 States Each)
- 6 core components authored with all 8 interaction states:
  1. `Default`
  2. `Hover`
  3. `Focus-Visible` (Instant 2px outline `--accent`)
  4. `Pressed` (`scale(0.97)` / compressed)
  5. `Disabled` (`opacity: 0.35`)
  6. `Loading` (Skeleton / hairline spinner)
  7. `Selected` (Filled active state)
  8. `Error` (Subtle semantic negative border / badge)
- **Components included:** Play button (52px), Icon button (44px hit-box), Seek bar (wavy & straight), Track row (56px), Chip / Filter pill, Output-device pill.

### Page 5: Screens
Rendered for Desktop ($1440 \times 900$) and Mobile ($390 \times 844$):
- **Now Playing:** Playing state (wavy seekbar) & Paused state (straight seekbar).
- **Now Playing with Lyrics Open:** 3 distinct moments of word-by-word highlight (word not yet sung at 40%, word being sung with progressive fill, word sung at 100%).
- **Mini Player Dock & Expand Transition:** 5 keyframes showing docked mini player, $25\%, 50\%, 75\%$ morph interpolation frames, and expanded state.
- **Track Change:** Outgoing and incoming artwork mid-crossfade (240ms).
- **Core Views:** Home, Search, Library, Empty State, Loading Skeleton (zero CLS), Offline Banner.

### Page 6: Motion Spec
Exhaustive specification table detailing:
- `Play / Pause Swap`: `transform: scale`, 140ms, `cubic-bezier(0.22, 1, 0.36, 1)`, tap / spacebar.
- `Seekbar Wave Vibration`: SVG path offset, 1200ms cycle, linear loop while playing.
- `Seekbar Pause Settle`: amplitude 2px $\to$ 0px, 180ms, `cubic-bezier(0.16, 1, 0.3, 1)`, pause event.
- `Active Lyric Word Sweep`: `clip-path / gradient`, syllable duration, linear, timecode sync.
- `Lyrics Line Scroll`: `transform: translateY`, 260ms, critically damped spring ($k=380, c=40, \zeta=1.0$), active line change.
- `Mini to Full Player Morph`: `height, radius, pos`, 320ms, `cubic-bezier(0.22, 1, 0.36, 1)`, swipe-up / tap mini player.
- `Artwork Track Crossfade`: `opacity, scale`, 240ms, `cubic-bezier(0.4, 0, 0.2, 1)`, track change.
- `Button Press Feedback`: `scale(0.97)`, 100ms, instantaneous release.
- `Focus-Visible Ring`: 2px outline, instant step, tab key navigation.

---

## 3. High-Resolution Screen Exports (`design/figma-exports/`)

All 49 screens have been exported at native viewport scale into `design/figma-exports/`:
- **Tokens & Components Spec:**
  - `page-1-tokens-spec.png`
  - `page-4-components-8-states.png`
  - `page-6-motion-spec-table.png`
- **Variant A "Quiet" (Desktop 1440×900):** 17 screens (`variant-a-desktop-*`)
- **Variant A "Quiet" (Mobile 390×844):** 17 screens (`variant-a-mobile-*`)
- **Variant B "Artwork colour" (Warm):** 4 screens (`variant-b-warm-*`)
- **Variant B "Artwork colour" (Cool):** 4 screens (`variant-b-cool-*`)
- **Variant B "Artwork colour" (Monochrome):** 4 screens (`variant-b-monochrome-*`)
