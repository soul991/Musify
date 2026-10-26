import React, { useState, useEffect, useRef, useMemo, UIEvent } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  keyExtractor?: (item: T, index: number) => string | number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  overscan = 4,
  keyExtractor,
  header,
  footer
}: VirtualListProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setViewportHeight(el.clientHeight || 600);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setViewportHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, viewportHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, localIdx) => {
      const actualIdx = startIndex + localIdx;
      const key = keyExtractor ? keyExtractor(item, actualIdx) : actualIdx;
      return {
        item,
        index: actualIdx,
        key,
        top: actualIdx * itemHeight
      };
    });
  }, [items, startIndex, endIndex, itemHeight, keyExtractor]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative no-scrollbar ${className}`}
    >
      {header}
      <div className="relative w-full" style={{ height: `${totalHeight}px` }}>
        {visibleItems.map(({ item, index, key, top }) => (
          <div
            key={key}
            className="absolute left-0 right-0 w-full"
            style={{
              top: `${top}px`,
              height: `${itemHeight}px`
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
