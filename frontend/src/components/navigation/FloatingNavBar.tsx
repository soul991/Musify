import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, Flame, Library, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePlayer } from '../../context/PlayerContext';
import { FloatingMiniPlayer } from '../player/FloatingMiniPlayer';

export type NavTab = 'home' | 'explore' | 'musicflow' | 'library';

interface FloatingNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSearch?: () => void;
  isSearchActive?: boolean;
  className?: string;
  isHidden?: boolean;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'musicflow', label: 'Flow', icon: Flame },
  { id: 'library', label: 'Library', icon: Library }
];

/**
 * The iOS / Echo Music style floating navigation bar (`AppFloatingNavBar.kt`).
 * - Docks the now playing controls (`FloatingMiniPlayer`) directly above the tabs as an accessory pill.
 * - Collapses slightly on scroll down, restores immediately on scroll up.
 * - Standalone circular search destination tab.
 * - Elevated active pill indicator with spring physics and liquid glass refraction.
 */
export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  isSearchActive = false,
  className = '',
  isHidden = false
}) => {
  const { colors } = useTheme();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    setIsPlayerOpen,
    isPlayerOpen
  } = usePlayer();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll detection matching FloatingTabBarScrollConnection in Echo Music:
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > 120 && currentScrollY > lastScrollY + 12) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY - 12 || currentScrollY <= 60) {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // If in Music Flow or Full Player is open or explicitly hidden, hide completely
  if (isHidden || isPlayerOpen || activeTab === 'musicflow') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: isVisible ? 0 : 90,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ type: 'spring', damping: 26, stiffness: 350 }}
      style={{
        bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))'
      }}
      className={`fixed inset-x-0 flex flex-col items-center justify-end z-40 pointer-events-none ${className}`}
    >
      <div className="flex flex-col items-center gap-2.5 px-3 w-full max-w-fit">
        {/* Docked Accessory MiniPlayer (Above the tabs, matching expandedAccessory in AppFloatingNavBar.kt) */}
        <AnimatePresence>
          {currentTrack && (
            <motion.div
              key={currentTrack.id}
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              className="w-full flex justify-center pointer-events-auto"
            >
              <FloatingMiniPlayer
                track={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onTogglePlay={togglePlay}
                onNext={nextTrack}
                onPrev={prevTrack}
                onClick={() => setIsPlayerOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Tab Bar Pill & Standalone Search FAB */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Main Tab Group Pill Container (Echo Music Liquid Glass) */}
          <div className="relative h-[56px] rounded-full p-1.5 flex items-center bg-[#15161D]/85 backdrop-blur-3xl backdrop-saturate-[1.8] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(255,255,255,0.05)] select-none transition-all duration-300">
            {TABS.map((tab) => {
              const isActive = !isSearchActive && activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 450 }}
                  className={`relative h-full rounded-full flex items-center justify-center transition-colors duration-200 ${
                    isActive ? 'px-4 gap-2 text-white' : 'w-11 px-0 text-white/60 hover:text-white/90'
                  }`}
                  title={tab.label}
                >
                  {/* Active Elevated Pill Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeFloatingTabPill"
                      transition={{
                        type: 'spring',
                        damping: 26,
                        stiffness: 420
                      }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: colors.primary,
                        boxShadow: `0 4px 20px ${colors.primary}85, inset 0 1px 1px rgba(255,255,255,0.45)`
                      }}
                    />
                  )}

                  {/* Tab Icon */}
                  <span className="relative z-10 flex items-center justify-center">
                    <Icon size={20} className={isActive ? 'text-white drop-shadow' : 'text-current'} />
                  </span>

                  {/* Animated Text Label */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          damping: 24,
                          stiffness: 400
                        }}
                        className="relative z-10 text-xs font-bold tracking-tight whitespace-nowrap overflow-hidden leading-none drop-shadow-sm"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Standalone Circular Search FAB (Echo Music ExpandedStandaloneTab) */}
          {onOpenSearch && (
            <motion.button
              onClick={onOpenSearch}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', damping: 20, stiffness: 450 }}
              title="Search"
              aria-label="Search"
              style={
                isSearchActive
                  ? {
                      backgroundColor: colors.primary,
                      boxShadow: `0 4px 20px ${colors.primary}85, inset 0 1px 1px rgba(255,255,255,0.45)`
                    }
                  : undefined
              }
              className={`w-[56px] h-[56px] rounded-full flex items-center justify-center border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(255,255,255,0.05)] transition-all duration-200 group ${
                isSearchActive
                  ? 'text-white'
                  : 'bg-[#15161D]/85 backdrop-blur-3xl backdrop-saturate-[1.8] text-white/80 hover:text-white'
              }`}
            >
              <Search
                size={20}
                className={
                  isSearchActive
                    ? 'text-white drop-shadow'
                    : 'text-white/80 group-hover:text-white group-hover:scale-105 transition-transform'
                }
              />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
