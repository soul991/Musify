# Musify Design System & Theme Tokens

## Part 1 — Compact Token Summary

### Color Palette
- `--accent-color`: `#ED5564` (Coral Red primary / brand seed)
- `--accent-rgb`: `237, 85, 100`
- `--bg-primary`: `#0B0B0C` (Deep void dark background)
- `--bg-surface`: `rgba(22, 23, 27, 0.7)` (Translucent frosted glass surface)
- `--bg-card`: `rgba(255, 255, 255, 0.04)` (Glass card background)
- `--border-glass`: `rgba(255, 255, 255, 0.12)` (Refractive container boundary)
- `--border-glass-light`: `rgba(255, 255, 255, 0.2)` (Elevated highlight border)
- `--text-primary`: `#FFFFFF` (High emphasis 100% white)
- `--text-secondary`: `rgba(255, 255, 255, 0.65)` (Medium emphasis label)
- `--text-muted`: `rgba(255, 255, 255, 0.4)` (Low emphasis caption)

### Typography
- Font Family: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif`
- Display / Headlines: Bold & ExtraBold (`font-extrabold`, `font-black`), tight tracking (`tracking-tight`, `tracking-tighter`)
- Labels & Eyebrows: ExtraBold uppercase (`text-xs font-bold uppercase tracking-wider`)
- Timers & Durations: Monospace / Tabular numerals (`font-mono`, `text-xs`)

### Surface & Elevation (Liquid Glass)
- Panel Blur: `backdrop-filter: blur(40px) saturate(180%)`
- Pill Blur: `backdrop-filter: blur(30px) saturate(160%)`
- Card Blur: `backdrop-filter: blur(20px)`
- Border Radii: `rounded-full` (pills, buttons), `rounded-3xl` (28-32px dialogs & modal containers), `rounded-2xl` (16-24px cards), `rounded-xl` (12px album artwork thumbnails)

### Layout & Safe Areas
- Mobile viewport: `min-h-screen`, `pb-safe`, `pt-safe`
- Desktop sidebar: `w-64 border-r border-white/10 hidden md:flex`
- Mobile dock: `fixed inset-x-0 bottom-4 z-40`

---

## Part 2 — Raw Source Dumps

### `src/index.css`
```css
@import "tailwindcss";

:root {
  --accent-color: #ED5564;
  --accent-rgb: 237, 85, 100;
  --bg-primary: #0B0B0C;
  --bg-surface: rgba(22, 23, 27, 0.7);
  --bg-card: rgba(255, 255, 255, 0.04);
  --border-glass: rgba(255, 255, 255, 0.12);
  --border-glass-light: rgba(255, 255, 255, 0.2);
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.65);
  --text-muted: rgba(255, 255, 255, 0.4);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow-x: hidden;
  height: 100%;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  position: relative;
}

.pt-safe {
  padding-top: max(0.75rem, env(safe-area-inset-top, 0.75rem));
}
.pb-safe {
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom, 1.25rem));
}

.glass-panel {
  background: rgba(20, 20, 24, 0.65);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--border-glass);
  box-shadow: 
    0 20px 40px -15px rgba(0, 0, 0, 0.7),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
}

.glass-pill {
  background: rgba(30, 30, 36, 0.7);
  backdrop-filter: blur(30px) saturate(160%);
  -webkit-backdrop-filter: blur(30px) saturate(160%);
  border: 1px solid var(--border-glass);
  border-radius: 9999px;
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.5),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.2);
}

.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
}
```
