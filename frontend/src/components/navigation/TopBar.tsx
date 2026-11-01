import React from 'react';
import { Search, Settings, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopBarProps {
  title?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  canGoBack,
  onGoBack,
  onOpenSearch,
  onOpenSettings
}) => {
  const { colors } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 pt-safe bg-[#0B0B0C]/70 backdrop-blur-2xl border-b border-white/10 select-none">
      <div className="flex items-center gap-3">
        {canGoBack && onGoBack ? (
          <button
            onClick={onGoBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors flex items-center justify-center border border-white/10"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md md:hidden"
              style={{ backgroundColor: colors.primary }}
            >
              <img src="/icons/musify-icon.svg" alt="Musify" className="w-5 h-5 invert" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              {title || 'Musify'}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors flex items-center justify-center border border-white/10 text-white/80 hover:text-white"
          title="Search"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors flex items-center justify-center border border-white/10 text-white/80 hover:text-white"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
