import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, ArrowRight, Check } from 'lucide-react';
import './landing.css';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-1)] flex flex-col font-body antialiased">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-200"
        style={{
          background: scrolled ? 'rgba(20, 20, 21, 0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--hairline)' : '1px solid transparent'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2.5 text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--text-1)]">
              <Music className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <span className="font-sans font-medium text-lg tracking-tight">Musify</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--text-2)]">
            <a href="#features" className="hover:text-[var(--text-1)] transition-colors">Features</a>
            <a href="#lyrics" className="hover:text-[var(--text-1)] transition-colors">Lyrics</a>
            <a
              href="https://github.com/hyperistak/Musify"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text-1)] transition-colors flex items-center gap-1.5"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/app"
              className="cta-primary text-sm min-h-[48px] px-5 py-2.5 rounded-xl"
            >
              <span>Open App</span>
              <ArrowRight className="w-4 h-4 ml-0.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: HERO SECTION (Single Screen at 1280x800)
      ───────────────────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col"
      >
        <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 max-w-6xl mx-auto w-full">
          <div className="max-w-2xl text-left">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-normal leading-[1.05] tracking-[-0.02em] text-[var(--text-1)]">
              Ad-free music with synced lyrics
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[var(--text-2)] font-normal leading-relaxed">
              Musify plays songs from YouTube Music in the browser with synced lyrics and no ads.
            </p>
            <div className="mt-6 flex flex-row items-center gap-4">
              <a
                href="/app"
                className="cta-primary min-h-[48px] px-8 py-3.5 text-base"
              >
                <span>Open App</span>
                <ArrowRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
              </a>
              <a
                href="https://github.com/hyperistak/Musify"
                target="_blank"
                rel="noreferrer"
                className="cta-secondary min-h-[48px] px-7 py-3.5 text-base"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

          {/* Real Product Screenshot */}
          <div className="mt-12 w-full rounded-[var(--radius-panel)] border border-[var(--hairline)] overflow-hidden bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <img
              src="/screenshots/app-main.png"
              alt="Musify web player interface"
              className="w-full h-auto block"
              loading="eager"
            />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: THREE SHORT FEATURE SECTIONS WITH REAL SCREENSHOTS
        ───────────────────────────────────────────────────────────── */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full space-y-24">
          {/* Feature 1: Synced Lyrics */}
          <div id="lyrics" className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 rounded-[var(--radius-card)] border border-[var(--hairline)] overflow-hidden bg-[var(--bg-card)]">
              <img
                src="/screenshots/app-stage.png"
                alt="Musify synchronized lyrics stage"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
            <div className="order-1 md:order-2 space-y-3">
              <h2 className="font-display text-32px md:text-36px font-normal text-[var(--text-1)] leading-tight">
                Synced lyrics
              </h2>
              <p className="text-base text-[var(--text-2)] leading-relaxed">
                Follow along line by line as the track plays.
              </p>
              <p className="text-base text-[var(--text-2)] leading-relaxed">
                Click any lyric line in the display serif to seek directly to that moment.
              </p>
            </div>
          </div>

          {/* Feature 2: Curated Flows & Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-3">
              <h2 className="font-display text-32px md:text-36px font-normal text-[var(--text-1)] leading-tight">
                Curated flows
              </h2>
              <p className="text-base text-[var(--text-2)] leading-relaxed">
                Stream millions of songs and custom flows without audio advertising.
              </p>
              <p className="text-base text-[var(--text-2)] leading-relaxed">
                Explore mood collections and community charts without signing into an account.
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--hairline)] overflow-hidden bg-[var(--bg-card)]">
              <img
                src="/screenshots/app-main.png"
                alt="Musify catalog and search view"
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
          </div>

          {/* Feature 3: Every Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 flex justify-center">
              <div className="w-full max-w-[320px] rounded-[var(--radius-card)] border border-[var(--hairline)] overflow-hidden bg-[var(--bg-card)]">
                <img
                  src="/screenshots/app-mobile.png"
                  alt="Musify mobile interface"
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-3">
              <h2 className="font-display text-32px md:text-36px font-normal text-[var(--text-1)] leading-tight">
                Every device
              </h2>
              <p className="text-base text-[var(--text-2)] leading-relaxed">
                A responsive listening experience crafted for laptops and phones.
              </p>
              <p className="text-base text-[var(--text-2)] leading-relaxed">
                Install as a progressive web app for offline caching and lock-screen controls.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: TRUST SIGNALS & CONVERSION
        ───────────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 max-w-6xl mx-auto w-full border-t border-[var(--hairline)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="p-4 rounded-[var(--radius-row)] bg-[var(--bg-card)] border border-[var(--hairline)]">
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                <Check className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                100% Free
              </span>
              <p className="mt-1 text-xs text-[var(--text-3)]">No subscriptions</p>
            </div>
            <div className="p-4 rounded-[var(--radius-row)] bg-[var(--bg-card)] border border-[var(--hairline)]">
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                <Check className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                No Sign-Up Required
              </span>
              <p className="mt-1 text-xs text-[var(--text-3)]">Direct listening</p>
            </div>
            <div className="p-4 rounded-[var(--radius-row)] bg-[var(--bg-card)] border border-[var(--hairline)]">
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                <Check className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                Zero Audio Ads
              </span>
              <p className="mt-1 text-xs text-[var(--text-3)]">Continuous playback</p>
            </div>
            <div className="p-4 rounded-[var(--radius-row)] bg-[var(--bg-card)] border border-[var(--hairline)]">
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                <Check className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                Open Source
              </span>
              <p className="mt-1 text-xs text-[var(--text-3)]">Under MIT license</p>
            </div>
          </div>
        </section>
      </motion.main>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--hairline)] bg-[var(--bg-stage)] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--text-3)]">
          <div className="flex items-center gap-3">
            <span className="font-sans font-medium text-sm text-[var(--text-1)]">Musify</span>
            <span>Ad-free music player with synced lyrics</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/app" className="hover:text-[var(--text-1)] transition-colors">Web player</a>
            <a href="#features" className="hover:text-[var(--text-1)] transition-colors">Features</a>
            <a
              href="https://github.com/hyperistak/Musify"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text-1)] transition-colors flex items-center gap-1"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
