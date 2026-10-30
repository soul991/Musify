import React from 'react';
import { motion } from 'framer-motion';

interface AutoPlaylistButtonProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: string;
  onClick: () => void;
  className?: string;
}

export const AutoPlaylistButton: React.FC<AutoPlaylistButtonProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  onClick,
  className = ''
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`min-h-[72px] rounded-2xl bg-white/[0.07] hover:bg-white/[0.11] active:bg-white/[0.14] border border-white/10 p-3.5 flex items-center gap-3.5 text-left transition-colors duration-200 shadow-sm group select-none ${className}`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/5 transition-transform group-hover:scale-105"
        style={{
          backgroundColor: iconColor ? `${iconColor}22` : 'rgba(255, 255, 255, 0.1)',
          color: iconColor || '#ffffff'
        }}
      >
        {icon}
      </div>

      <div className="flex flex-col flex-1 min-w-0 pr-1">
        <span className="text-sm font-bold text-white/95 leading-tight group-hover:text-white truncate">
          {title}
        </span>
        {subtitle && (
          <span className="text-[11px] font-medium text-white/50 mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </motion.button>
  );
};
