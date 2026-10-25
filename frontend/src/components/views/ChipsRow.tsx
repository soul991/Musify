import React, { useRef } from 'react';

export interface ChipItem<T = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface ChipsRowProps<T> {
  chips: ChipItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  className?: string;
}

export function ChipsRow<T extends string | null>({
  chips,
  activeId,
  onSelect,
  className = ''
}: ChipsRowProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-1 ${className}`}
    >
      {chips.map((chip) => {
        const isActive = chip.id === activeId;
        return (
          <button
            key={String(chip.id)}
            onClick={() => onSelect(chip.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 select-none active:scale-95 ${
              isActive
                ? 'bg-white text-black shadow-lg shadow-white/10 font-black'
                : 'bg-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.14] border border-white/5'
            }`}
          >
            {chip.icon && <span className="shrink-0">{chip.icon}</span>}
            <span>{chip.label}</span>
            {chip.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-black/15 text-black' : 'bg-white/10 text-white/60'
                }`}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
