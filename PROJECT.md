# Project: Musify Design & Animation Overhaul

## Architecture
Musify is a web music player built with React 19, TypeScript 6, Vite 8, Tailwind CSS v4, and Framer Motion 14.
This overhaul introduces:
1. **Multi-Page Vite Architecture**:
   - `frontend/index.html`: Entry point for the new marketing and conversion landing page (`/`).
   - `frontend/app.html`: Dedicated entry point for the music player SPA (`/app`).
   - Vite middleware in `vite.config.ts` transparently rewriting `/app` and `/app/*` requests to `/app.html` during dev and preview.
   - Netlify `_redirects` and `netlify.toml` routing `/app` to `app.html` and `/*` to `index.html`.
2. **Design System & Motion Engine**:
   - Typography: Satoshi Variable (`frontend/public/fonts/` + Fontshare CDN fallback) for display/headings + Inter for body + tabular-nums for audio timers.
   - Surface Geometry: Stepped concentric radius math (Panel 28px -> Card 20px -> Tile/Pill 14-16px) with OLED true black (`#0A0A0A`) and Musify Calm Red (`#E5303D`).
   - Motion Engine: Strict separation between Spatial Springs (`springCinematic` k=200, `springReveal` k=380) and Effects Springs (`springEffects` k=1600, critically damped ζ=1.0 for borders and glows).
   - Directional Navigation Transitions: History depth tracking in `App.tsx` applying `forwardTransition` (slide up) and `backwardTransition` (slide down).
3. **Bespoke Figma Design System**:
   - Original design artifacts created directly in connected Figma file `unsaved-mvw3s0zx-b042q9kp` across 5 comprehensive artboards (Design System & Tokens, Landing Page, Home Page Redesign, Search Page Redesign, Explore Page Redesign).

---

## Feature Inventory
Every feature from the Survey phase is mapped to an assigned milestone.

| # | Category | Feature | Description | Milestone | Source |
|---|----------|---------|-------------|-----------|--------|
| 1 | Architecture | Multi-Page Vite Setup | Dual-entry build separating landing page (`index.html`) from player SPA (`app.html`) | M3 | `musify-design-plan.md` §1 |
| 2 | Architecture | Netlify SPA Redirects | `_redirects` and `netlify.toml` configuring `/app` rewrite to `app.html` | M3 | `musify-design-plan.md` §1 |
| 3 | Landing Page | Ambient Hero Canvas | Radial gradient ambient glow orbs that fade in behind hero content | M3 | `musify-design-plan.md` §1 |
| 4 | Landing Page | Sticky Glass Nav | Fixed navbar with dynamic glass blur appearing upon scroll | M3 | `musify-design-plan.md` §1 |
| 5 | Landing Page | Kinetic Headline Typing | Letter-by-letter typographic animation of `"Music, Liquid."` in Satoshi | M3 | `musify-design-plan.md` §1 |
| 6 | Landing Page | 3D Floating Hero Showcase | Embedded product UI with 3D perspective tilt (`rotateX(-2deg) rotateY(3deg)`) and looping float | M3 | `musify-design-plan.md` §1 |
| 7 | Landing Page | Dual Conversion CTAs | Primary `#E5303D` button and secondary ghost CTA with spring pop entrance | M3 | `musify-design-plan.md` §1 |
| 8 | Landing Page | Bento Grid Micro-Interactions | 2×3 grid of glass feature cards, each with a bespoke hover/interaction state | M3 | `musify-design-plan.md` §1 |
| 9 | Landing Page | Parallax FullPlayer Showcase | Scroll-linked parallax showcase section with radial wash and sticky typography | M3 | `musify-design-plan.md` §1 |
| 10 | Landing Page | Horizontal Experience Strip | Micro-showcase carousel displaying Search, Explore, Equalizer, Listen Together | M3 | `musify-design-plan.md` §1 |
| 11 | Landing Page | Trust & Value Proposition Block | Explicit trust messaging: 100% free, no login, zero audio ads, open-source | M3 | `landing-page-cro-expert` |
| 12 | Home Page | "Now Trending" Marquee Hero | Full-width dynamic hero card replacing Unsplash carousel with live trending track art | M4 | `musify-design-plan.md` §2 |
| 13 | Home Page | Hero Auto-Rotation & Crossfade | Auto-cycling through top trending tracks every 5s with AnimatePresence | M4 | `musify-design-plan.md` §2 |
| 14 | Home Page | Time-Aware Greeting Header | Dynamic `"Good Morning / Afternoon / Evening, Listener"` with Search & Settings icons | M4 | `musify-design-plan.md` §2 |
| 15 | Home Page | Gradient Glass Mood Chips | Tactile glass pill buttons with emoji and mood label for instant playlist filtering | M4 | `musify-design-plan.md` §2 |
| 16 | Home Page | Section Scroll Choreography | Staggered entrance for Quick Picks, Recently Played, and Trending carousels | M4 | `musify-design-plan.md` §2 |
| 17 | Search Page | Expanding Glass Search Input | Search bar with focus-activated glow and border expansion using `springEffects` | M4 | `musify-design-plan.md` §3 |
| 18 | Search Page | Origin-Anchored Suggestions | Dropdown suggestions expanding downwards from the input anchor point | M4 | `musify-design-plan.md` §3 |
| 19 | Search Page | Empty State Discovery Grid | Discovery state showing Trending Searches, Recent Searches, and Browse Categories | M4 | `musify-design-plan.md` §3 |
| 20 | Search Page | Recent Searches Clear & Delete | History list with individual item removal (`✕`) and `"Clear All"` button | M4 | `musify-design-plan.md` §3 |
| 21 | Search Page | Categorized Filter Tabs | Filter bar allowing users to switch between All, Songs, Albums, Artists, Playlists | M4 | `musify-design-plan.md` §3 |
| 22 | Search Page | Featured "Top Result" Card | Prominent card for best matching song/artist with hover play button reveal | M4 | `musify-design-plan.md` §3 |
| 23 | Search Page | Categorized Search Results | Segmented result lists (Songs with timestamps, Artists with avatars, Albums) | M4 | `musify-design-plan.md` §3 |
| 24 | Explore Page | Atmospheric Featured Mood Hero | Large full-width card highlighting an editorial mood (e.g. `"Deep Focus"`) | M4 | `musify-design-plan.md` §4 |
| 25 | Explore Page | Moods & Genres 2-Column Grid | Two-column responsive grid of 100px height gradient mood cards with icons | M4 | `musify-design-plan.md` §4 |
| 26 | Explore Page | Mood-to-Results Layout Morph | Seamless shared element container transition between mood card and results header | M4 | `musify-design-plan.md` §4 |
| 27 | Explore Page | Trending Now Numbered List | Ranked list of top trending tracks displaying rank number (1, 2, 3...) | M4 | `musify-design-plan.md` §4 |
| 28 | Explore Page | New Releases Carousel | Horizontal scrolling carousel of newly released albums and singles | M4 | `musify-design-plan.md` §4 |
| 29 | Motion System | Spring Physics Engine | Calibrated spring tokens in `motion.ts` (`springCinematic`, `springReveal`, `springEffects`) | M2 | `musify-design-plan.md` §5 |
| 30 | Motion System | Directional Page Transitions | Navigation depth-aware transitions (`forwardTransition` slide up, `backwardTransition` slide down) | M2 | `musify-design-plan.md` §5 |
| 31 | Motion System | Hover Lift Micro-Interactions | Universal interactive card hover lift and tap scale feedback token (`hoverLift`) | M2 | `musify-design-plan.md` §5 |
| 32 | Typography | Satoshi Variable Font Integration | Loading and tokenizing Satoshi Variable font for display headings | M2 | `musify-design-plan.md` §6 |
| 33 | Typography | Hierarchical Type Scale | Standardized type tokens (Display XL, Display, Title, Section, Body, Caption, Timer) | M2 | `musify-design-plan.md` §6 |
| 34 | Typography | Tabular Numeric Timers | Monospace tabular numeral alignment for all song durations and track progress timers | M2 | `musify-design-plan.md` §6 |
| 35 | Accessibility | Reduced Motion Adaptation | Comprehensive reduced motion handling via `<MotionConfig reducedMotion="user">` | M2 | `musify-design-plan.md` §7 |
| 36 | Accessibility | WCAG AA/AAA Contrast Compliance | Strict contrast ratio adherence (Body 19.3:1 AAA, Muted 8.6:1 AAA, CTA 4.7:1 AA) | M2 | `musify-design-plan.md` §8 |
| 37 | Figma Design | Frame 1: Design System & Tokens | Complete token palette, typography scale, glass hierarchy, and motion token specs | M1 | `spec_miner_survey_2` |
| 38 | Figma Design | Frame 2: Landing Page Design | Full landing layout (Nav, Hero, 3D Preview, Bento Grid, Showcase, Experience, CTA) | M1 | `spec_miner_survey_2` |
| 39 | Figma Design | Frame 3: Home Page Redesign | Full home redesign layout (Sidebar, Greeting, Now Trending Hero, Mood Chips, Shelves) | M1 | `spec_miner_survey_2` |
| 40 | Figma Design | Frame 4: Search Page Redesign | Glass search focus, empty state grid, suggestions dropdown, Top Result card | M1 | `spec_miner_survey_2` |
| 41 | Figma Design | Frame 5: Explore Page Redesign | Atmospheric Featured Mood, 2-column mood grid, layout morph state, trending list | M1 | `spec_miner_survey_2` |
| 42 | Quality & Audit | Live Testing & Rubric Audits | Dev server execution, automated build/typecheck, 90+/100 audit against all 7 skills | M5 | `ORIGINAL_REQUEST.md` R2 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Figma Design Artifacts Creation | Construct 5 bespoke original frames in `unsaved-mvw3s0zx-b042q9kp` via Figma MCP tools (Design System, Landing, Home, Search, Explore) | none | DONE |
| M2 | Foundation: Motion Tokens & Typography System | Implement calibrated spring tokens in `motion.ts`, Satoshi font loading & type scale in `index.css`, tabular-nums, and directional page transitions in `App.tsx` | none | DONE |
| M3 | New Landing Page & Multi-Page Vite Setup | Implement multi-entry Vite build (`index.html` + `app.html`), Netlify routing, `Landing.tsx`, 6-section layout, letter-by-letter typing, 3D float, bento grid, parallax showcase, experience strip, dual CTAs | M2 | DONE |
| M5 | Live Web Page Testing, Audit & Critique Polish | Start Vite dev server, audit live implementation against all 7 evaluation skills (ui-ux-animation-critique, hallmark, apple-design, landing-page-cro-expert, ux-product-auditor, design-taste-frontend, theme-factory) to achieve 90+/100 score; verify 0 build/lint errors; forensic audit | M1, M3, M4 | DONE |

---

## Interface Contracts

### Vite Multi-Page ↔ SPA Entry
- `frontend/index.html`: Contains `<div id="landing-root"></div>`, imports `/src/landing/main-landing.tsx`.
- `frontend/app.html`: Contains `<div id="root"></div>`, imports `/src/main.tsx`.
- `frontend/vite.config.ts`:
  - `build.rollupOptions.input = { main: resolve(__dirname, 'app.html'), landing: resolve(__dirname, 'index.html') }`
  - Vite dev/preview server plugin intercepts `req.url.startsWith('/app')` and rewrites to `/app.html`.

### Motion System ↔ UI Components
- `frontend/src/utils/motion.ts` exports:
  - `springCinematic: Transition` (stiffness: 200, damping: 26, mass: 1.2)
  - `springReveal: Transition` (stiffness: 380, damping: 28, mass: 0.9)
  - `springEffects: Transition` (stiffness: 1600, damping: 80, critically damped $\zeta = 1.0$)
  - `staggerFast: Variants` (staggerChildren: 0.03, delayChildren: 0.02)
  - `staggerSection: Variants` (staggerChildren: 0.08, delayChildren: 0.15)
  - `parallaxConfig: SpringOptions` (stiffness: 120, damping: 30, restDelta: 0.001)
  - `hoverLift: { whileHover, whileTap }` (y: -3px, scale: 0.97)
  - `forwardTransition: Variants` (initial y: 16, animate y: 0, exit y: -8)
  - `backwardTransition: Variants` (initial y: -16, animate y: 0, exit y: 16)

### Typography Tokens ↔ CSS Classes
- `--font-display: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif`
- `--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- `.font-display`: `font-family: var(--font-display);`
- `.font-body`: `font-family: var(--font-body);`
- `.tabular-nums`: `font-variant-numeric: tabular-nums;`

---

## Code Layout

```
frontend/
├── index.html                           [NEW Landing page entry]
├── app.html                             [SPA entry, renamed from index.html]
├── vite.config.ts                       [Updated multi-page inputs & dev rewrite plugin]
├── public/
│   ├── _redirects                       [Updated with /app -> app.html rewrite]
│   ├── manifest.json                    [Updated start_url: /app]
│   ├── sw.js                            [Updated cache with app.html]
│   └── fonts/                           [Satoshi Variable font files]
└── src/
    ├── index.css                        [Typography ladder, Satoshi @font-face, tokens]
    ├── App.tsx                          [Directional navigation transitions]
    ├── utils/
    │   └── motion.ts                    [Calibrated spring tokens & variants]
    ├── landing/                         [NEW Landing module]
    │   ├── Landing.tsx                  [Full 6-section landing component]
    │   ├── landing.css                  [Landing-specific styles with window scroll]
    │   └── main-landing.tsx             [Landing React 19 entry point]
    └── pages/
        ├── Home.tsx                     [Now Trending hero card, Ken Burns, mood chips]
        ├── Search.tsx                   [Spring focus glow, empty state grid, top result]
        └── Explore.tsx                  [Featured mood hero card, layout morph transition]
```
