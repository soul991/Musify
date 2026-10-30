# Musify Design Brief & Specification

## 1. Reference Architecture & Music Player Paradigms

To establish a distinctive, world-class music player experience rather than a generic website with audio, we benchmark against four industry benchmarks:

### Spotify Web Player
- **Layout & Structure**: Persistent left navigation sidebar, scrollable content canvas, and a fixed bottom playback dock that anchors the entire experience.
- **Now-Playing Feel**: Dedicated companion drawer or full-bleed modal with track details, lyrics, and queue.
- **Motion**: Subtle 150–250ms micro-interactions on button hover, gentle spring animations on play/pause icon swap (`scale: 1.05`), zero layout shift.
- **Color & Mood**: Ultra-dark neutral canvas (`#121212`), high-contrast white text (`#FFFFFF`), muted gray secondary text (`#B3B3B3`), with a single brand accent color.

### Apple Music Web
- **Layout & Structure**: Clean translucent glass surfaces with vibrant album artwork reflections.
- **Now-Playing Feel**: Expansive full-screen sheet with rich typography, synchronized real-time lyric scrolling with syllable-accurate highlighting.
- **Motion**: Fluid physical springs with damping ratio ~0.8; silky expansion transitions from mini player to full screen.
- **Color & Mood**: Depth achieved through blurred background backdrop filters (`backdrop-blur-2xl`) adapting to dominant artwork hues.

### YouTube Music
- **Layout & Structure**: Top search header, responsive horizontal carousels ("Quick picks", "Similar to your taste"), integrated queue and up-next exploration.
- **Now-Playing Feel**: Large centered square artwork with soft gradient wash.
- **Empty & Error States**: Non-blocking toast notifications with actionable "Retry", clean skeleton loaders mirroring content aspect ratios.

### Echo Music App (Android Reference)
- **Vibe**: Fluid liquid-glass aesthetic, dynamic color blooming around artwork, physical rotating vinyl view option, tactile haptics on transport controls.

---

## 2. Musify Screen Evaluation Across Viewports

### Desktop (1440 × 900)
- **Strengths**: Tri-pane layout (Navigation sidebar, content feed, right-hand companion panel for lyrics & queue) provides immediate visual context. Seekbar with live timestamps and volume controls are directly reachable.
- **Weaknesses**: Typography weights between track headings and metadata were slightly flat; audio output selection was previously static text; PWA install prompt was floating over content.

### Tablet (768 × 1024)
- **Strengths**: Responsive grid transitions smoothly from 4 columns to 2–3 columns; sidebar collapses gracefully into icons.
- **Weaknesses**: Bottom dock player requires clear spacing so touch targets remain at least 44px; lyrics drawer needs convenient swipe-to-dismiss.

### Mobile Phone (390 × 844)
- **Strengths**: Floating bottom mini-player anchors above bottom navigation tabs; one-tap expand to FullPlayer modal.
- **Weaknesses**: Safe-area insets (`env(safe-area-inset-bottom)`) must be strictly honored; full-player controls need comfortable spacing for one-handed thumb interaction.

---

## 3. Design Tokens & System Standards

### Color Tokens (OLED Dark & Restrained Crimson)
All components consume these unified CSS tokens:
- `--bg-canvas`: `#0A0A0A` (Deepest OLED background)
- `--bg-surface`: `#121214` (Cards, sidebar, and container panels)
- `--bg-elevated`: `#1A1A1E` (Hover states, dialogs, floating mini-player)
- `--border-subtle`: `rgba(255, 255, 255, 0.08)`
- `--border-focus`: `rgba(229, 48, 61, 0.6)`
- `--text-primary`: `#FFFFFF`
- `--text-secondary`: `#A1A1AA`
- `--text-tertiary`: `#71717A`
- `--accent-red`: `#E5303D` (Primary brand accent: play buttons, active progress, liked heart)
- `--accent-red-hover`: `#F0424E`
- `--accent-red-glow`: `rgba(229, 48, 61, 0.25)`

### Typography Scale
- **Display Heading**: 24px–32px / Bold (Outfit / Inter)
- **Section Heading**: 18px–20px / SemiBold (Inter)
- **Track Title**: 14px–16px / Medium
- **Artist & Album Metadata**: 12px–13px / Regular
- **Time & Micro Labels**: 11px–12px / Monospace tabular numbers (`font-variant-numeric: tabular-nums`)

### Radii & Elevation
- `--radius-sm`: `8px` (Buttons, chips, small badges)
- `--radius-md`: `12px` (Cards, input fields)
- `--radius-lg`: `16px` (Panels, mini-player, modal containers)
- `--radius-xl`: `24px` (Full-player artwork container)
- `--radius-full`: `9999px` (Transport controls, pills, avatar circles)
- `--shadow-dock`: `0 -8px 32px rgba(0, 0, 0, 0.75)`
- `--shadow-glow`: `0 20px 50px -10px var(--accent-red-glow)`

### Motion Tokens
- `--duration-instant`: `100ms`
- `--duration-fast`: `180ms` (Hover, press scale, toggle states)
- `--duration-normal`: `280ms` (Drawer slide, modal enter/exit)
- `--ease-spring`: `cubic-bezier(0.22, 1, 0.36, 1)` (Liquid fluid deceleration)
- `--ease-standard`: `cubic-bezier(0.4, 0.0, 0.2, 1)`

---

## 4. The 10 Invariable Design Rules

1. **Red Is Reserved**: Crimson Red (`#E5303D`) is strictly reserved for playback state (Play button), audio seek progression, and active favorites ("Liked"). Never use red for general borders, unselected navigation, or secondary text.
2. **Music Player Vibe First**: The current track must never feel distant. In every view, playback controls, track title, artist name, and live seek position remain visible and interactive.
3. **Artwork Is Sacred**: Album art must never be cropped incorrectly, stretched, or displayed broken. Every image must specify `onError` fallbacks and maintain a 1:1 aspect ratio.
4. **Touch Targets ≥ 44px**: Every interactive button, slider thumb, and navigation icon must provide a hit box of at least 44 × 44px on mobile and touch devices.
5. **No Layout Shifts (CLS < 0.05)**: Skeleton loaders and image placeholders must match the exact dimensions of loaded cards and tracks to guarantee zero content jumping.
6. **Hardware & Output Respect**: Audio output device selection, AirPlay, and Cast buttons must gracefully handle browser capabilities, showing clear explanatory states where unsupported.
7. **Accessible Contrast (WCAG AA)**: All text on surfaces must achieve a contrast ratio of at least 4.5:1. All interactive icons must have clear `aria-label` descriptors.
8. **Motion with Purpose**: Transitions must inform the user where elements came from (e.g., mini player expanding into full player via shared layoutId). No unnecessary distracting bounce.
9. **Respect Reduced Motion**: Every animation must respect `prefers-reduced-motion: reduce`, defaulting to instantaneous or simple opacity fades.
10. **Error Transparency & Resilience**: If an audio stream stalls or network drops, notify the user with a non-blocking toast offering a direct "Retry" action; never leave the player in an ambiguous stuck state.
