# Musify Design System & Direction

Written from the rules of unslop, impeccable, design-taste-frontend, ui-ux-animation-critique and Hallmark. This specification replaces visual choices in earlier mockups.

---

## 1. Direction

- **Product.** Musify plays songs from YouTube Music in the browser, with synced lyrics and no ads, for people listening on a phone or a laptop, mostly in the evening.
- **Character.** Late-night, intimate, steady. (Not "clean", "modern", "sleek", "minimal" or "premium".)
- **World.** A listening room after dark: ink-black walls, one warm lamp, a record sleeve on the table. The room shows in the neutrals and the typography, never in glows.
- **Moments.** Two, and only two:
  1. The album artwork, large, with its own real colour;
  2. The active lyric line, set large in the display serif. Everything else is quiet.
- **Signature.** One detail, used everywhere it belongs and nowhere else: while the seek handle is dragged, the handle carries the time (tabular figures).

Red (`--accent`) covers a few percent of any screen: the play button, the seek fill, the liked heart, the active nav marker, one primary action. Not backgrounds. Not washes. Not glows.

---

## 2. Tokens

Declared once at `:root` and `@theme`; no colour or font literal anywhere else.

### Surfaces (Graphite Ramp, Dark Only)

| Token | Value | Use |
| :--- | :--- | :--- |
| `--bg-stage` | `#0B0B0C` | Now Playing stage, behind everything |
| `--bg-base` | `#141415` | App background |
| `--bg-card` | `#19191B` | Cards, panels |
| `--bg-raised` | `#232325` | Active row, input, hover |
| `--hairline` | `rgba(237, 237, 237, 0.08)` | Every border |

### Text Roles (Three Roles Only)

| Token | Value | Contrast on `--bg-base` | Use |
| :--- | :--- | :--- | :--- |
| `--text-1` | `#EDEDED` | > 12:1 (AAA) | Primary text, active line |
| `--text-2` | `#A1A1A6` | > 6.5:1 (AA) | Secondary text, artists, labels |
| `--text-3` | `#85858B` | ~ 5:1 (AA) | Muted meta and captions only |

### Accent Ramp

| Token | Value | Contrast | Use |
| :--- | :--- | :--- | :--- |
| `--accent` | `#D92B38` | 4.8:1 on dark / white text | Fills carrying white text (replaces non-AA `#E5303D`) |
| `--accent-ink` | `#FF5A64` | 6.5:1 on dark | Red used as small text or an icon on dark |
| `--accent-hover` | `#C42632` | — | Hover state for accent fills |
| `--positive` | `#4CC38A` | — | Semantic positive status |
| `--negative` | `#E5484D` | — | Semantic negative status |

### Banned Values Everywhere

- Pure `#000000` and `#FFFFFF` as surface or text
- Any purple, indigo, violet, fuchsia or cyan
- Any hue-to-hue gradient
- Any coloured `box-shadow` or `text-shadow`

### Spacing Scale

`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`, `80px`, `96px`. No `[13px]`-style one-offs.

### Radius (Nested, $R_{inner} = R_{outer} - \text{padding}$, never below 4px)

- Small button, tag, keycap: `4px` to `6px`
- Row, input, button: `8px` to `10px`
- Card: `12px` to `16px`
- Panel: `16px` to `20px`
- Not everything is a pill.

### Depth

- Surface steps plus a hairline. No resting shadows.
- Menus, dialogs and player sheet neutral shadow: `0 8px 24px rgba(0, 0, 0, 0.4)`
- Active row: `inset 0 1px 0 rgba(255, 255, 255, 0.08)`

---

## 3. Type

Self-hosted with npm: `@fontsource-variable/instrument-sans` and `@fontsource/instrument-serif`. Zero external CDN or Google/Fontshare font requests.

- **Interface:** Instrument Sans. Weights 400 and 500 only (600 for rare emphasis).
- **Display:** Instrument Serif, regular (no italic anywhere, no bold). Used only for:
  - Track title on Now Playing
  - Active and nearby lyric lines
  - Page titles above 28px
  - Landing headline
- **No Monospace Anywhere:** Times and counts use Instrument Sans with `font-variant-numeric: tabular-nums`.
- **Sizes:** 12 meta, 13–14 secondary, 14–15 body and nav, 16 buttons, 20–24 app page title, 32–36 track title, 32–40 lyric line, landing headline 56–72. Nothing under 12px. Body line-height 1.4–1.5.
- **Labels are sentence case:** No uppercase, no tracking, no small caps, no eyebrow above headings.
- **Letter Spacing:** 0 for anything under 16px. Display from 40px: `-0.02em`. Never negative on small text.
- Preserve browser zoom and user font size (`rem`, no fixed-px root).

---

## 4. Copy

- Page title names context, not a greeting: "Home" or time of day without comma ("Late night"). No "Welcome", no exclamation marks, no emoji, no trailing period.
- Short labels: "Search", not "Search songs, albums, artists".
- Delete every "Liquid". Product is Musify. Description: "Ad-free music player with synced lyrics."
- Honest landing claims only: "No ads" and "Open source". Remove unmeasured metrics.

---

## 5. Icons

- Lucide only, 18px (16px in dense rows), stroke 1.5, colour = `--text-2` or `--text-3`. Fixed 8–10px gap to label. One icon box width per list.
- Replace every emoji and glyph used as an icon. Mood chips become plain text chips (`--bg-raised`, 8px radius, hairline), no icons needed.

---

## 6. Screens

### Now Playing (Desktop, 1440x900)
Stage `--bg-stage`. Left: artwork at least 380px square, 16px radius, one neutral shadow. Title (Instrument Serif 32–36), artist (`--text-2`), like heart (accent). Right: lyrics column in Instrument Serif; active line `--text-1` at 36px, neighbours `--text-3` at 28px, rest fade by opacity; tap/click to seek. Bottom: seek bar (4px track `--bg-raised`, fill `--accent`, 12px handle carrying time while dragging), transport: previous, play (56px, `--accent`, white icon, no glow), next; quiet icon buttons for queue, devices, sleep timer. No waveforms, ring, ambient glow, or blurred-art background.

### Now Playing (Mobile, 390x844)
Stacked order: artwork (full width minus 24px margins), title, artist, seek, transport, lyrics opened by swipe-up/button. Touch targets $\ge 44\text{px}$. Safe areas respected.

### App Shell
Sidebar 240px (rows 36px high, gap 2, section label 24 above, 8 below). First group: Home, Explore, Music flow, Library, Listen together. Active row: `--bg-raised` plus top highlight, no red pill, no coloured dot. Companion panel empty state keeps frame and states action ("Search for a song").

### Cards & Lists
Track rows 56px. Section headers plain text (20px, 500) with "See all" quiet link. No hover scale: hover = `--bg-raised` fill change, press = `scale(0.98)`. Skeletons flat `--bg-card` to `--bg-raised`.

### Explore
Mood cards flat `--bg-card` tiles, title Instrument Sans 500, no gradients or icons above headings. Remove indigo/violet/fuchsia/pink gradients.

### Landing (`/`)
Hero fits one screen at 1280x800: headline (Instrument Serif 56–72), one sentence, primary and secondary CTA, real screenshot of `/app`. Three short sections with real screenshots. Max 250 words.

---

## 7. Motion

- Animate `transform` and `opacity` only. Never width, height, top, left, margins, large blurs.
- Replace `transition-all` with targeted `transition-colors`, `transition-opacity`, `transition-transform`.
- CSS easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Durations: 120ms feedback, 200ms enter, 320ms sheet/page.
- Springs for spatial moves only: stiffness 380, damping 40, mass 1 ($\zeta \approx 1$, no wobble).
- Press feedback: `scale(0.97)` in 100ms. No hover scale on cards.
- Max one entrance on load (200ms fade and 8px rise).
- Zero infinite loops running at rest (`animate-ping`, `animate-pulse`, `animate-bounce`, vinyl spin, ring pulse).
- `prefers-reduced-motion: reduce`: zero infinite animations, no springs/entrance, 100ms opacity change for state transitions.

---

## 8. Target Metrics (Zero Counts)

| Metric | Target |
| :--- | :--- |
| `transition-property: all` elements | 0 |
| Infinite animations running at rest | 0 |
| Infinite animations under reduced motion | 0 |
| Emoji or glyph used as icon | 0 |
| Uppercase or tracked labels & eyebrows | 0 |
| Non-neutral gradient fills | 0 |
| Purple / indigo / violet / fuchsia / cyan classes | 0 |
| Coloured glows or shadows | 0 |
| Text under 12px | 0 |
| Contrast failures (< 4.5:1) | 0 |
| Mobile controls under 44px hit area | 0 |
| External / deprecated font requests (Inter, Satoshi, Outfit, Google/Fontshare) | 0 |
| Word "Liquid" in UI, manifest, `<title>`, meta | 0 |
| Hand-drawn browser mockup on landing | 0 |

---

## 9. Implementation Phases

1. **Tokens and type.** `DESIGN.md`, tokens at `:root` / `@theme`, Instrument Sans and Serif self-hosted, all font links removed, accent fix. No layout changes.
2. **Sweep.** Emoji and glyph icons, gradients, glows, purple family, uppercase labels, "Liquid", `transition-all`, hover scale. Behaviour unchanged.
3. **Motion.** Loops removed, reduced-motion fixed, easing and durations unified, springs retuned.
4. **Now Playing, desktop and mobile**, per section 6.
5. **App shell and Home/Explore/Search**, per section 6.
6. **Landing**, per section 6.
