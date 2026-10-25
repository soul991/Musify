import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUpDown, LayoutGrid, List, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SortOption<T = string> {
  id: T;
  label: string;
}

interface SortHeaderProps<T> {
  sortOptions: SortOption<T>[];
  activeSort: T;
  onSortChange: (sort: T) => void;
  sortDescending: boolean;
  onSortDescendingChange: (descending: boolean) => void;
  itemCountText?: string;
  viewType?: 'grid' | 'list';
  onViewTypeChange?: (viewType: 'grid' | 'list') => void;
  className?: string;
}

export function SortHeader<T extends string>({
  sortOptions,
  activeSort,
  onSortChange,
  sortDescending,
  onSortDescendingChange,
  itemCountText,
  viewType,
  onViewTypeChange,
  className = ''
}: SortHeaderProps<T>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = sortOptions.find((o) => o.id === activeSort) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-between py-2 px-1 text-sm select-none ${className}`}
    >
      {/* Material 3 Expressive Split Button Layout */}
      <div className="flex items-center rounded-2xl bg-white/[0.08] p-0.5 border border-white/10 shadow-sm backdrop-blur-md">
        {/* Leading Pill: Sort Type Selector */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="px-3.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-bold tracking-wide text-white/90 flex items-center gap-2 transition-all active:scale-95"
        >
          <span>{activeOption?.label}</span>
          <ChevronDown
            size={14}
            className={`text-white/50 transition-transform duration-200 ${
              menuOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        <div className="w-[1px] h-4 bg-white/15 my-auto" />

        {/* Trailing Pill: Ascending / Descending Toggle with 180° rotation */}
        <button
          onClick={() => onSortDescendingChange(!sortDescending)}
          title={sortDescending ? 'Order: Descending' : 'Order: Ascending'}
          className="p-1.5 px-2 rounded-xl hover:bg-white/10 text-white/80 transition-all active:scale-95 flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: sortDescending ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <ArrowUpDown size={14} />
          </motion.div>
        </button>
      </div>

      {/* Right side: Item Count and Layout View Toggle */}
      <div className="flex items-center gap-3">
        {itemCountText && (
          <span className="text-xs font-medium text-white/45 hidden sm:inline">
            {itemCountText}
          </span>
        )}

        {viewType && onViewTypeChange && (
          <button
            onClick={() => onViewTypeChange(viewType === 'grid' ? 'list' : 'grid')}
            title={viewType === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
            className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white/80 active:scale-95 transition-all shadow-sm"
          >
            {viewType === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        )}
      </div>

      {/* Sort Options Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 z-30 min-w-[190px] rounded-2xl bg-[#1C1D24]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 flex flex-col gap-0.5"
          >
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40">
              Sort by
            </div>
            {sortOptions.map((opt) => {
              const isSelected = opt.id === activeSort;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSortChange(opt.id);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
