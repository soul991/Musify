# Musify Extractable Components Catalog

## Layout Components

### FloatingNavBar
- Source: `src/components/navigation/FloatingNavBar.tsx`
- Category: layout
- Description: Floating liquid glass bottom navigation pill with docked accessory MiniPlayer above tabs and standalone circular search button.
- Extractable props: `activeTab` (NavTab, default: "home"), `isSearchActive` (boolean, default: false), `isHidden` (boolean, default: false)
- Hardcoded: Tab icons (Home, Explore, Flow, Library), Search icon, glass background styles, spring animations.

### TopBar
- Source: `src/components/navigation/TopBar.tsx`
- Category: layout
- Description: Sticky top app bar with app logo icon, dynamic page title, back button, search button, and settings gear.
- Extractable props: `title` (string), `canGoBack` (boolean, default: false), `onBack` (function), `onOpenSearch` (function), `onOpenSettings` (function)
- Hardcoded: Musify SVG icon, layout padding, button icons.

### FullPlayer
- Source: `src/components/player/FullPlayer.tsx`
- Category: layout
- Description: Fullscreen modal music player featuring fluid album cover / vinyl turntable toggle, squiggly playback slider, flower play button, output picker, and bottom sheets for synced lyrics and queue.
- Extractable props: None (reads directly from `usePlayer()` and `useTheme()`)
- Hardcoded: LP record vinyl artwork, metallic tonearm geometry, action icons (lyrics, queue, like, shuffle, repeat).

---

## Basic Components

### FloatingMiniPlayer
- Source: `src/components/player/FloatingMiniPlayer.tsx`
- Category: basic
- Description: Compact floating pill player with circular 48px progress ring, album artwork, marquee title, like button, and play/pause/skip controls.
- Extractable props: `track` (Track), `isPlaying` (boolean), `currentTime` (number), `duration` (number), `onTogglePlay` (function), `onNext` (function), `onPrev` (function), `onClick` (function)
- Hardcoded: Circular SVG progress math, glass backdrop styling, layout constraints.

### SquigglySlider
- Source: `src/components/player/SquigglySlider.tsx`
- Category: basic
- Description: Android 13/14 / Nothing OS inspired animated wavy sine-wave playback scrubber with draggable grab thumb.
- Extractable props: `value` (number), `max` (number), `onChange` (function), `isPlaying` (boolean), `accentColor` (string)
- Hardcoded: SVG path generation for sine wave curves, animation CSS.

### FlowerPlayButton
- Source: `src/components/player/FlowerPlayButton.tsx`
- Category: basic
- Description: Scalloped 12-petal flower play/pause button inspired by Android Material 3 Expressive and Echo Music.
- Extractable props: `isPlaying` (boolean), `onClick` (function), `size` (number, default: 80)
- Hardcoded: 12-petal SVG path math, spring scale transition on click.

### ChipsRow
- Source: `src/components/views/ChipsRow.tsx`
- Category: basic
- Description: Horizontally scrollable row of tactile filter chips with active accent background and subtle border.
- Extractable props: `chips` (ChipItem[]), `selectedChip` (string), `onSelectChip` (function)
- Hardcoded: Scroll container padding, pill radius, transition curves.

### TrackRow
- Source: `src/components/views/TrackRow.tsx`
- Category: basic
- Description: Versatile track list item with thumbnail, title, artist, duration, active playing indicator, and 3-dot context menu.
- Extractable props: `track` (Track), `isCurrent` (boolean), `isPlaying` (boolean), `index` (number), `onPlay` (function), `onMenu` (function)
- Hardcoded: Equalizer bounce animation bars, like heart icon, layout spacing.
