# Musify Design System

## Product Overview
**Musify** is a premier, fluid, bug-free web music player and listening experience. It reimagines web audio streaming with a desktop-grade spatial layout, immersive fluid mesh background, interactive vinyl & waveform visualizers, real-time synchronized lyrics, squiggly tactile scrubber bars, and peer-to-peer "Listen Together" audio rooms.

---

## 1. Visual Foundation & Color Tokens

### Primary Palette
- **Background Deep Void**: `#0B0B0C` (Primary canvas background)
- **Brand Seed / Accent Color**: `#ED5564` (Vibrant Coral Red / Electric Ruby)
- **Accent Glow RGB**: `237, 85, 100` (`rgba(237, 85, 100, 0.4)`)
- **Surface Elevation**: `rgba(22, 23, 27, 0.7)` (Frosted translucent backdrop)
- **Glass Card Fill**: `rgba(255, 255, 255, 0.04)` (Hover: `rgba(255, 255, 255, 0.08)`)
- **Glass Border Refraction**: `rgba(255, 255, 255, 0.12)` (Highlight: `rgba(255, 255, 255, 0.22)`)

### Text Hierarchy
- **Text Primary**: `#FFFFFF` (100% white, titles, song headers, key metrics)
- **Text Secondary**: `rgba(255, 255, 255, 0.65)` (Artists, navigation items, subtitles)
- **Text Muted**: `rgba(255, 255, 255, 0.40)` (Track durations, timestamps, secondary metadata)

---

## 2. Typography
- **Primary Font Family**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif`
- **Headlines / Display**: `font-extrabold` / `font-black`, `tracking-tight` (-0.02em to -0.04em)
- **Section Headers**: 1.25rem - 1.5rem, `font-bold text-white`
- **Track Titles**: 0.95rem - 1.1rem, `font-semibold text-white truncate`
- **Artist Metadata**: 0.85rem, `text-white/60 font-medium truncate`
- **Timers & Numbers**: `font-mono tabular-nums text-xs text-white/50`

---

## 3. Surface & Liquid Glass Styling
- **Glass Panel**:
  - `background: rgba(20, 20, 24, 0.65)`
  - `backdrop-filter: blur(40px) saturate(180%)`
  - `border: 1px solid rgba(255, 255, 255, 0.12)`
  - `box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)`
- **Glass Pill**:
  - `background: rgba(255, 255, 255, 0.07)`
  - `backdrop-filter: blur(30px) saturate(160%)`
  - `border: 1px solid rgba(255, 255, 255, 0.14)`
  - `border-radius: 9999px`
- **Corner Radii**:
  - Small pills & actions: `rounded-full`
  - Cards & Track Rows: `rounded-2xl` (16px)
  - Album Art: `rounded-2xl` or `rounded-3xl` with dynamic ambient drop shadows
  - Floating Panels & Modals: `rounded-3xl` (28px - 32px)

---

## 4. Key Spatial Components & Layout Architecture
- **Desktop Navigation Stage**:
  - Left Sidebar (`w-64` or `w-72`): Glass panel with brand identity, Home, Explore, Library, Listen Together, Stats, Settings.
  - Center Dynamic Audio Canvas: Fluid ambient blurred mesh reflecting current track art, personalized greeting, trending carousels, recent playlists, and quick-access quick picks.
  - Bottom Persistent Audio Dock: Spans bottom screen with high-res artwork, tactile squiggly timeline, playback controls (flower play button), volume/eq controls, and expansion trigger for Full Player.
- **Full Player Audio Stage**:
  - 3-Pane or 2-Pane desktop layout: Left large spinning vinyl / 3D tilt artwork; Right synchronized interactive lyrics with karaoke-style line highlighting; Bottom tactile squiggly scrubber, heart burst favorite button, queue drawer, and ambient audio visualizer.
- **Listen Together Room**:
  - Live peer listener avatars with animated sound rings, dynamic sync status, real-time track broadcasts, interactive reaction emojis, and room code sharing.

---

## 5. Animation & Motion Patterns
- **Spring Physics**: Smooth damping (`stiffness: 300, damping: 25`) for modals, drawers, and buttons.
- **Squiggly Waveform Scrubber**: Procedurally modulated sine wave that vibrates while playing and smooths out when paused.
- **Flower Play Button**: Blooming geometric petal expansion animation upon click.
- **Heart Burst**: Multi-particle burst animation when adding tracks to favorites.
- **Ambient Canvas Blur**: Dynamic radial gradients tracking dominant colors of the active album cover.
