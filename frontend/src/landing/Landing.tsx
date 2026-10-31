import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Search,
  Compass,
  Sliders,
  Users,
  ArrowRight,
  ChevronDown,
  Check,
  Download,
  Smartphone,
  Layers,
  Mic2,
  Waves
} from 'lucide-react';
import './landing.css';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(1);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  // Monitor scroll for fixed glass nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Karaoke lyric progression simulator in Hero & Showcase
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveLyricIndex((prev) => (prev + 1) % 4);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const lyrics = [
    { time: '0:38', text: "I'm tryna put you in the worst mood, ah" },
    { time: '0:42', text: "P1 cleaner than your church shoes, ah" },
    { time: '0:46', text: "Milli point two just to hurt you, ah" },
    { time: '0:50', text: "All red Lamb' just to tease you, ah" }
  ];

  const headlineText = "Music, Liquid.";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-[#E5303D] selection:text-white font-body relative overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: GLASS NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(10, 10, 10, 0.82)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5303D] rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-[#E5303D] flex items-center justify-center shadow-lg shadow-[#E5303D]/25 transition-transform duration-200 group-hover:scale-105">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" fill="currentColor" />
                <circle cx="18" cy="16" r="3" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Musify
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  Liquid v2
                </span>
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors duration-150">Features</a>
            <a href="#showcase" className="hover:text-white transition-colors duration-150">Showcase</a>
            <a href="#experience" className="hover:text-white transition-colors duration-150">Experience</a>
            <a
              href="https://github.com/hyperistak/Musify"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors duration-150 flex items-center gap-1.5"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <a
              href="/app"
              className="cta-primary text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-[#E5303D]/30"
            >
              <span>Open App</span>
              <ArrowRight className="w-4 h-4 ml-0.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </motion.nav>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden flex flex-col items-center text-center">
        {/* Ambient Gradient Glows */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] -z-10 blur-[130px] opacity-25 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, #E5303D 0%, rgba(229, 48, 61, 0.4) 40%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-[500px] h-[350px] -z-10 blur-[100px] opacity-15 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, #7928CA 0%, transparent 70%)' }}
        />

        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-6 shadow-inner"
        >
          <span className="w-2 h-2 rounded-full bg-[#E5303D] animate-ping" />
          <span className="text-xs font-semibold tracking-wide text-white/90">
            Next-Gen Web Audio Experience
          </span>
        </motion.div>

        {/* Kinetic Headline: Letter-by-Letter Typing */}
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-[-0.04em] leading-[1.05] max-w-4xl mx-auto"
        >
          {headlineText.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          A high-performance web music player that feels like a native app. Instant gapless playback, synchronized karaoke lyrics, zero audio ads, and liquid glass aesthetics.
        </motion.p>

        {/* Dual Conversion CTAs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, type: 'spring', stiffness: 420, damping: 28 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <a href="/app" className="cta-primary w-full sm:w-auto text-base px-8 py-3.5">
            <span>Start Listening</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </a>
          <a href="#features" className="cta-secondary w-full sm:w-auto text-base px-7 py-3.5">
            <span>Explore Features</span>
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </a>
        </motion.div>

        {/* Trust & Reassurance Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-white/60"
        >
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#E5303D]" />
            100% Free
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#E5303D]" />
            No Sign-Up Required
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#E5303D]" />
            Zero Audio Ads
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#E5303D]" />
            Open Source
          </span>
        </motion.div>

        {/* 3D Floating Player Showcase */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.05, type: 'spring', stiffness: 220, damping: 26 }}
          className="mt-14 w-full max-w-[1020px] relative px-2"
          style={{ perspective: '1400px' }}
        >
          {/* Ambient Red Glow Bleed */}
          <div
            className="absolute inset-0 -z-10 blur-[90px] opacity-25 scale-105 pointer-events-none rounded-[36px]"
            style={{ background: 'radial-gradient(circle, #E5303D 0%, transparent 70%)' }}
          />

          {/* Interactive Player Mockup Frame */}
          <div
            className="rounded-[28px] border border-white/15 bg-gradient-to-b from-[#161616]/90 to-[#0F0F10]/95 backdrop-blur-3xl shadow-2xl shadow-black/80 overflow-hidden text-left transition-transform duration-500 hover:scale-[1.01]"
            style={{
              transform: 'rotateX(-1.5deg) rotateY(1.5deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Window Header */}
            <div className="h-11 px-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]/80" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/80" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]/80" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 font-mono">
                <span>musify.app</span>
                <span className="text-white/20">/</span>
                <span className="text-[#E5303D]/90">player</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-400">Live Studio</span>
              </div>
            </div>

            {/* Inner Player UI Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Album Art & Spinning Vinyl */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  {/* Vinyl Record */}
                  <div
                    className={`absolute inset-0 rounded-full bg-[#0D0D0E] border-4 border-[#1E1E22] shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-vinyl' : ''}`}
                    style={{
                      backgroundImage: 'radial-gradient(circle at center, transparent 35%, rgba(255,255,255,0.03) 36%, transparent 40%, rgba(255,255,255,0.03) 48%, transparent 52%, rgba(255,255,255,0.02) 65%, transparent 68%)'
                    }}
                  >
                    {/* Vinyl Center Hole */}
                    <div className="w-16 h-16 rounded-full bg-[#E5303D] border-2 border-white/20 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-[#0A0A0A]" />
                    </div>
                  </div>

                  {/* Album Cover Overlap */}
                  <div className="relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-[#1A1A1A] group">
                    <svg className="w-full h-full transition-transform duration-500 group-hover:scale-105" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="albumGlowHero" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#E5303D" stopOpacity="0.8" />
                          <stop offset="60%" stopColor="#801018" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.95" />
                        </radialGradient>
                        <linearGradient id="waveGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF6B7A" />
                          <stop offset="100%" stopColor="#E5303D" />
                        </linearGradient>
                      </defs>
                      <rect width="200" height="200" fill="#101012" />
                      <circle cx="100" cy="100" r="85" fill="url(#albumGlowHero)" />
                      <circle cx="100" cy="100" r="70" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                      <circle cx="100" cy="100" r="55" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                      <circle cx="100" cy="100" r="40" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                      <circle cx="100" cy="100" r="22" fill="#E5303D" fillOpacity="0.25" stroke="#E5303D" strokeWidth="1.5" />
                      <path d="M75 100 C 85 70, 115 130, 125 100" stroke="url(#waveGradHero)" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                        Lossless FLAC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Track Title and Artist */}
                <div className="mt-4 text-center">
                  <div className="font-display font-black text-xl tracking-tight text-white flex items-center justify-center gap-2">
                    Starboy
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className="text-white/40 hover:text-[#E5303D] transition-colors"
                      title="Like track"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#E5303D] text-[#E5303D]' : ''}`} />
                    </button>
                  </div>
                  <p className="text-sm text-white/60 font-medium">The Weeknd ft. Daft Punk</p>
                </div>
              </div>

              {/* Right Column: Synced Karaoke Lyrics & Live Waveform */}
              <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
                {/* Karaoke Lyrics Preview Box */}
                <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-5 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Mic2 className="w-3.5 h-3.5 text-[#E5303D]" />
                      Synced Karaoke Stream
                    </span>
                    <span className="text-emerald-400 font-mono">99.8% Sync</span>
                  </div>

                  <div className="space-y-3 font-display">
                    {lyrics.map((lyric, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveLyricIndex(idx)}
                          className={`transition-all duration-300 cursor-pointer flex items-baseline gap-3 rounded-lg px-2.5 py-1 ${
                            isActive
                              ? 'text-white text-base font-bold bg-white/[0.06] scale-[1.02]'
                              : 'text-white/35 text-sm hover:text-white/60'
                          }`}
                        >
                          <span className="text-[11px] font-mono opacity-50 shrink-0">{lyric.time}</span>
                          <span className={isActive ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' : ''}>
                            {lyric.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Audio Waveform */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono text-white/50">
                    <span className="tabular-nums">01:42</span>
                    <span className="text-[#E5303D] font-semibold text-[11px] uppercase tracking-wider">
                      {isPlaying ? 'Audio Spectrum Active' : 'Paused'}
                    </span>
                    <span className="tabular-nums">03:50</span>
                  </div>

                  {/* Waveform Bars */}
                  <div className="h-10 flex items-center gap-1 px-1 justify-between">
                    {[45, 60, 30, 80, 95, 70, 50, 85, 100, 65, 40, 75, 90, 55, 35, 70, 95, 60, 40, 80, 50, 70, 85, 60, 40, 90, 75, 30].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#E5303D] to-[#FF6B6B] rounded-full transition-all duration-150"
                        style={{
                          height: isPlaying ? `${Math.max(15, (h * ((i % 3) + 2)) % 100)}%` : '15%',
                          opacity: isPlaying ? 0.9 : 0.3
                        }}
                      />
                    ))}
                  </div>

                  {/* Playback Controls Row */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors" title="Shuffle">
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors" title="Previous">
                        <SkipBack className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Central Play/Pause Button */}
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-[#E5303D] hover:bg-[#ff3b49] text-white flex items-center justify-center shadow-lg shadow-[#E5303D]/40 transition-transform active:scale-95"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors" title="Next">
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors" title="Repeat">
                        <Repeat className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Banner Overlay Footer */}
            <div className="p-4 bg-gradient-to-r from-[#E5303D]/15 via-transparent to-[#E5303D]/15 border-t border-white/[0.08] flex items-center justify-between px-6">
              <span className="text-xs text-white/70 font-medium">
                Experience full gapless streaming, lyrics and audio DSP
              </span>
              <a
                href="/app"
                className="text-xs font-bold text-[#E5303D] hover:text-white flex items-center gap-1 transition-colors"
              >
                Launch Player <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: FEATURES BENTO GRID (2x3 desktop, stacked mobile)
      ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 px-6 max-w-7xl mx-auto w-full relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-[#E5303D] uppercase">
            Crafted For Sound
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white mt-3">
            Engineered like an instrument.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/60">
            Every surface, interaction, and spring curve is tuned for acoustic intimacy and effortless speed.
          </p>
        </div>

        {/* 2x3 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bento Card 1: Liquid Glass Design */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            onMouseEnter={() => setActiveBentoCard(1)}
            onMouseLeave={() => setActiveBentoCard(null)}
            className="glass-card p-7 rounded-[24px] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center mb-5 text-[#E5303D]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black text-white tracking-tight">
                Liquid Glass Design
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                Multi-layered translucent acrylic with real-time backdrop blur, noise grain to prevent color banding, and stepped concentric radius math.
              </p>
            </div>

            {/* Micro-Interaction Preview */}
            <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/80">28px Panel</span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/80">20px Card</span>
              </div>
              <span className="text-xs font-bold text-[#E5303D] group-hover:translate-x-1 transition-transform">
                Inspect Glass →
              </span>
            </div>

            {/* Specular Highlight Hover Sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </motion.div>

          {/* Bento Card 2: Synced Lyrics */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            onMouseEnter={() => setActiveBentoCard(2)}
            onMouseLeave={() => setActiveBentoCard(null)}
            className="glass-card p-7 rounded-[24px] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center mb-5 text-[#E5303D]">
                <Mic2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black text-white tracking-tight">
                Synchronized Karaoke
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                Word-by-word and line-by-line synced lyrics fetched in real-time. Jump to any lyric timestamp with a single tap.
              </p>
            </div>

            {/* Micro-Interaction Preview: Active line highlight */}
            <div className="mt-8 p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-1.5 font-display text-xs">
              <div className="text-white/40">"I said, ooh, I'm blinded by the lights"</div>
              <div className="text-white font-bold text-sm bg-white/[0.08] px-2 py-0.5 rounded text-[#E5303D] flex items-center justify-between">
                <span>"No, I can't sleep until I feel your touch"</span>
                <span className="text-[10px] text-white/50 font-mono">01:14</span>
              </div>
              <div className="text-white/40">"I said, ooh, I'm drowning in the night"</div>
            </div>
          </motion.div>

          {/* Bento Card 3: Music Flow */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            onMouseEnter={() => setActiveBentoCard(3)}
            onMouseLeave={() => setActiveBentoCard(null)}
            className="glass-card p-7 rounded-[24px] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center mb-5 text-[#E5303D]">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black text-white tracking-tight">
                Music Flow Feed
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                A vertical visual discovery stream. Swipe through curated clips, song recommendations, and trending viral hooks.
              </p>
            </div>

            {/* Micro-Interaction: Fanned-out 3-card stack */}
            <div className="mt-8 flex justify-center items-center h-20 relative">
              <div className="w-28 h-16 rounded-xl bg-purple-900/60 border border-white/10 absolute -rotate-6 group-hover:-rotate-12 transition-transform shadow-lg" />
              <div className="w-28 h-16 rounded-xl bg-indigo-900/60 border border-white/10 absolute rotate-6 group-hover:rotate-12 transition-transform shadow-lg" />
              <div className="w-32 h-18 rounded-xl bg-[#E5303D]/80 border border-white/20 relative z-10 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-white text-white" />
              </div>
            </div>
          </motion.div>

          {/* Bento Card 4: Listen Together */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            onMouseEnter={() => setActiveBentoCard(4)}
            onMouseLeave={() => setActiveBentoCard(null)}
            className="glass-card p-7 rounded-[24px] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center mb-5 text-[#E5303D]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black text-white tracking-tight">
                Listen Together
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                Host real-time synchronized listening rooms. Zero audio drift, live chat reactions, and shared queue controls.
              </p>
            </div>

            {/* Micro-Interaction: Two avatars pulsing with sound rings */}
            <div className="mt-8 flex items-center justify-center gap-6 py-2">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center font-bold text-sm">
                    JD
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#E5303D] animate-ring-pulse pointer-events-none" />
              </div>

              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5303D] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5303D] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5303D] animate-bounce [animation-delay:0.4s]" />
              </div>

              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#121214] flex items-center justify-center font-bold text-sm">
                    AL
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ring-pulse pointer-events-none [animation-delay:1.2s]" />
              </div>
            </div>
          </motion.div>

          {/* Bento Card 5: Wavy Seekbar */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            onMouseEnter={() => setActiveBentoCard(5)}
            onMouseLeave={() => setActiveBentoCard(null)}
            className="glass-card p-7 rounded-[24px] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center mb-5 text-[#E5303D]">
                <Waves className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black text-white tracking-tight">
                Kinetic Wavy Seekbar
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                An undulating SVG sine wave that dances while music plays, transitioning into a precision linear scrubber on touch or drag.
              </p>
            </div>

            {/* Micro-Interaction: Sine wave animation */}
            <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col justify-center gap-2">
              <svg className="w-full h-8 stroke-[#E5303D] fill-none stroke-[2.5]" viewBox="0 0 300 30">
                <path d="M 0 15 Q 25 5, 50 15 T 100 15 T 150 15 T 200 15 T 250 15 T 300 15">
                  <animate
                    attributeName="d"
                    dur="1.4s"
                    repeatCount="indefinite"
                    values="
                      M 0 15 Q 25 5, 50 15 T 100 15 T 150 15 T 200 15 T 250 15 T 300 15;
                      M 0 15 Q 25 25, 50 15 T 100 15 T 150 15 T 200 15 T 250 15 T 300 15;
                      M 0 15 Q 25 5, 50 15 T 100 15 T 150 15 T 200 15 T 250 15 T 300 15
                    "
                  />
                </path>
              </svg>
              <div className="flex justify-between text-[10px] font-mono text-white/50">
                <span>Dynamic Physics</span>
                <span className="text-[#E5303D]">44.1 kHz Sine</span>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 6: PWA Install */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            onMouseEnter={() => setActiveBentoCard(6)}
            onMouseLeave={() => setActiveBentoCard(null)}
            className="glass-card p-7 rounded-[24px] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 flex items-center justify-center mb-5 text-[#E5303D]">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black text-white tracking-tight">
                Instant PWA Install
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                Add to iOS, Android, or desktop in 1 tap. Complete offline cache, background media keys, and lock screen controls.
              </p>
            </div>

            {/* Micro-Interaction: PWA Install button simulator */}
            <div className="mt-8 flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#E5303D] flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Install Musify</span>
                  <span className="text-[10px] text-white/50">Standalone App</span>
                </div>
              </div>
              <button
                onClick={() => setPwaInstalled(!pwaInstalled)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  pwaInstalled ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {pwaInstalled ? 'Installed ✓' : 'Install'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: IMMERSIVE PLAYER SHOWCASE (Parallax Section)
      ───────────────────────────────────────────────────────────── */}
      <section id="showcase" className="relative py-28 md:py-36 overflow-hidden">
        {/* Ambient Gradient Wash */}
        <div
          className="absolute inset-0 -z-10 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #E5303D, transparent 75%)'
          }}
        />

        <div className="max-w-7xl mx-auto px-6">
          {/* Sticky Headline */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-[#E5303D] uppercase">
              Full Player Architecture
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white mt-3">
              Every detail, considered.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/65">
              From the vinyl groove light reflections to the 10-band DSP studio equalizer, Musify was built for listeners who appreciate craft.
            </p>
          </div>

          {/* Full Player Interactive Showcase Frame */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            className="rounded-[28px] border border-white/15 bg-[#121214]/90 backdrop-blur-2xl shadow-2xl p-6 sm:p-10 md:p-14 relative overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Turntable with Real-Time Groove Reflections */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                  {/* Turntable Platter */}
                  <div className="absolute inset-0 rounded-full bg-[#18181A] border-8 border-[#242428] shadow-2xl flex items-center justify-center">
                    {/* Vinyl Record with Grooves */}
                    <div
                      className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#0A0A0C] border-2 border-white/10 animate-spin-vinyl flex items-center justify-center relative overflow-hidden shadow-2xl"
                      style={{
                        backgroundImage: `
                          repeating-radial-gradient(
                            circle at center,
                            rgba(255,255,255,0.02) 0,
                            rgba(255,255,255,0.02) 2px,
                            transparent 3px,
                            transparent 6px
                          )
                        `
                      }}
                    >
                      {/* Center Artwork Label */}
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#E5303D] shadow-inner relative z-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="48" fill="#1c0709" stroke="#E5303D" strokeWidth="2" />
                          <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                          <circle cx="50" cy="50" r="14" fill="#E5303D" />
                          <circle cx="50" cy="50" r="4" fill="#0A0A0A" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    96kHz / 24-Bit Studio Master
                  </span>
                  <h3 className="font-display font-black text-2xl text-white mt-3">After Hours</h3>
                  <p className="text-sm text-white/60">The Weeknd — Deluxe Edition</p>
                </div>
              </div>

              {/* Right Column: Equalizer DSP & Karaoke Panel */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                {/* 10-Band Graphic Equalizer Preview */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#E5303D]" />
                      <span className="text-sm font-bold text-white">10-Band Studio Equalizer</span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/80">
                      Preset: Acoustic Depth
                    </span>
                  </div>

                  {/* EQ Sliders */}
                  <div className="grid grid-cols-10 gap-2 items-end h-32 pt-4 pb-2 border-b border-white/[0.06]">
                    {[
                      { band: '32', val: 65 },
                      { band: '64', val: 78 },
                      { band: '125', val: 55 },
                      { band: '250', val: 40 },
                      { band: '500', val: 45 },
                      { band: '1k', val: 60 },
                      { band: '2k', val: 72 },
                      { band: '4k', val: 84 },
                      { band: '8k', val: 68 },
                      { band: '16k', val: 50 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full bg-white/[0.06] rounded-full h-full flex items-end p-0.5 relative group cursor-pointer">
                          <div
                            className="w-full bg-[#E5303D] rounded-full transition-all duration-300 group-hover:bg-[#ff4d5a]"
                            style={{ height: `${item.val}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{item.band}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                    <span>Bass Boost (+4.2 dB)</span>
                    <span>Vocal Clarity (+2.8 dB)</span>
                    <span>Treble Air (+3.5 dB)</span>
                  </div>
                </div>

                {/* Real-Time Synced Lyrics Showcase */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E5303D] font-bold">
                    Direct Lyrics Engine
                  </span>
                  <div className="mt-3 space-y-2 font-display text-base sm:text-lg">
                    <p className="text-white/40">"I've been on my own for long enough"</p>
                    <p className="text-white font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#E5303D]" />
                      "Maybe you can show me how to love, maybe"
                    </p>
                    <p className="text-white/40">"I'm going through withdrawals"</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: EXPERIENCE STRIP (Horizontal Suite)
      ───────────────────────────────────────────────────────────── */}
      <section id="experience" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-[#E5303D] uppercase">
            The Musify Suite
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white mt-3">
            Designed for flow.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/60">
            Four core modules built from scratch to turn music search and discovery into a tactile joy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Search */}
          <div className="glass-card p-6 rounded-[22px] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition-all group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E5303D] mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-xl text-white">Instant Search</h4>
              <p className="mt-2 text-xs text-white/65 leading-relaxed">
                Zero-latency search with real-time suggestions, voice input recognition, and categorized top results.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap gap-1.5">
              {['Pop', 'Rock', 'EDM', 'Lo-fi'].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: Explore */}
          <div className="glass-card p-6 rounded-[22px] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition-all group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E5303D] mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-xl text-white">Explore Moods</h4>
              <p className="mt-2 text-xs text-white/65 leading-relaxed">
                Vibrant mood cards with shared layout morph transitions into full curated track lists and Billboard charts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
              <span className="text-[11px] font-mono text-white/60">Morph Transition Enabled</span>
            </div>
          </div>

          {/* Card 3: Equalizer */}
          <div className="glass-card p-6 rounded-[22px] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition-all group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E5303D] mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-xl text-white">Audio DSP</h4>
              <p className="mt-2 text-xs text-white/65 leading-relaxed">
                WebAudio parametric 10-band equalizer with presets for Bass Boost, Vocal, Acoustic, Club, and Electronic.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/60">
              <span>BiquadFilterNode</span>
              <span className="text-emerald-400">Zero Lag</span>
            </div>
          </div>

          {/* Card 4: Listen Together */}
          <div className="glass-card p-6 rounded-[22px] border border-white/[0.08] flex flex-col justify-between hover:border-white/20 transition-all group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#E5303D] mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-display font-black text-xl text-white">Social Sync</h4>
              <p className="mt-2 text-xs text-white/65 leading-relaxed">
                Invite friends via private room links. Simultaneous synchronized stream playback with live chat reactions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/60">
              <span>WebSockets / P2P</span>
              <span className="text-[#E5303D]">&lt; 15ms Drift</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: FINAL CTA & TRUST FOOTER
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 -z-10 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, #E5303D 0%, transparent 65%)'
          }}
        />

        {/* CTA Container Card */}
        <div className="max-w-4xl mx-auto rounded-[32px] border border-white/15 bg-gradient-to-b from-[#18181A]/90 to-[#101012]/95 backdrop-blur-3xl p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <span className="text-xs font-bold tracking-widest text-[#E5303D] uppercase">
            No Account Needed
          </span>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mt-3">
            Your music. Your way.
          </h2>

          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            No subscription fees. No ads interrupting your favorite songs. No registration barriers. Open Musify now and experience sound in liquid glass.
          </p>

          {/* Primary Action Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app"
              className="cta-primary text-base px-9 py-4 rounded-xl shadow-xl shadow-[#E5303D]/30 w-full sm:w-auto"
            >
              <span>Start Listening Now</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </a>
            <a
              href="https://github.com/hyperistak/Musify"
              target="_blank"
              rel="noreferrer"
              className="cta-secondary text-base px-7 py-4 rounded-xl w-full sm:w-auto"
            >
              <GithubIcon className="w-5 h-5" />
              <span>Star on GitHub</span>
            </a>
          </div>

          {/* 4 Primary Trust Signals for CRO Compliance */}
          <div className="mt-10 pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-white/70">
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-bold text-white">100% Free</span>
              <span className="text-[11px] text-white/45">No subscriptions</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-bold text-white">No Sign-Up Required</span>
              <span className="text-[11px] text-white/45">Zero account friction</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-bold text-white">Zero Audio Ads</span>
              <span className="text-[11px] text-white/45">Pure uninterrupted sound</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-bold text-white">Open Source</span>
              <span className="text-[11px] text-white/45">MIT Licensed code</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#080809] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#E5303D] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" fill="currentColor" />
                <circle cx="18" cy="16" r="3" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display font-bold text-sm text-white">Musify</span>
            <span className="text-white/30">•</span>
            <span>Liquid Glass Music Player</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="/app" className="hover:text-white transition-colors">Web Player</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a
              href="https://github.com/hyperistak/Musify"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>

          <p className="text-center md:text-right">
            Built with React 19, TypeScript & Vite. 100% Free & Open Source under MIT.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
