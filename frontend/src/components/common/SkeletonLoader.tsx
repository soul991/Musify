import React from 'react';
import { motion } from 'framer-motion';
import { Music, Disc, Search, ListMusic } from 'lucide-react';

interface SkeletonProps {
  className?: string;
}

export const SkeletonShimmer: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden bg-[var(--bg-card)] rounded-2xl ${className}`}>
      <div className="absolute inset-0 bg-[var(--bg-raised)] opacity-60" />
    </div>
  );
};

export const HomeFeedSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* Hero Carousel Skeleton */}
      <SkeletonShimmer className="h-[220px] sm:h-[300px] w-full rounded-[28px] border border-white/10" />

      {/* Mood Chips Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[...Array(6)].map((_, i) => (
          <SkeletonShimmer key={i} className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Quick Picks 4-Row Grid Skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonShimmer className="h-6 w-36 rounded-lg" />
        <div className="grid grid-rows-4 grid-flow-col gap-2 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-[290px] sm:w-[320px] h-[64px] rounded-2xl bg-white/[0.03] border border-white/5 p-2 flex items-center gap-3"
            >
              <SkeletonShimmer className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <SkeletonShimmer className="h-3.5 w-3/4 rounded" />
                <SkeletonShimmer className="h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TrackListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 p-2.5 flex items-center gap-3"
        >
          <SkeletonShimmer className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <SkeletonShimmer className="h-3.5 w-1/2 rounded" />
            <SkeletonShimmer className="h-2.5 w-1/3 rounded" />
          </div>
          <SkeletonShimmer className="w-10 h-3 rounded" />
        </div>
      ))}
    </div>
  );
};

export const CardsGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-3"
        >
          <SkeletonShimmer className="aspect-square w-full rounded-2xl" />
          <SkeletonShimmer className="h-3.5 w-3/4 rounded" />
          <SkeletonShimmer className="h-2.5 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'music' | 'disc' | 'search' | 'list';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'music',
  action
}) => {
  const IconComponent =
    icon === 'disc' ? Disc : icon === 'search' ? Search : icon === 'list' ? ListMusic : Music;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-sm mx-auto select-none"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--bg-raised)] border border-[var(--hairline)] flex items-center justify-center text-[var(--text-3)] mb-4">
        <IconComponent size={28} />
      </div>
      <h3 className="text-base font-bold text-white/90">{title}</h3>
      <p className="text-xs text-white/50 mt-1 max-w-[260px] leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-colors text-xs font-bold text-white border border-white/15"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
