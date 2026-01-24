'use client';

import { memo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscanCount?: number;
  className?: string;
}

/**
 * Virtualized list component using react-window
 * Only renders visible items for optimal performance with large lists
 *
 * @param items - Array of items to render
 * @param height - Height of the scrollable container
 * @param itemSize - Height of each item (default: 400px for posts)
 * @param renderItem - Function to render each item
 * @param overscanCount - Number of items to render outside visible area (default: 2)
 */
function VirtualizedListInner<T>({
  items,
  height,
  itemSize = 400,
  renderItem,
  overscanCount = 2,
  className,
}: VirtualizedListProps<T>) {
  const listRef = useRef<List>(null);

  // Reset scroll position when items change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={() => itemSize}
        width="100%"
        overscanCount={overscanCount}
      >
        {({ index, style }) => (
          <div style={style} key={`item-${index}`}>
            {renderItem(items[index], index)}
          </div>
        )}
      </List>
    </div>
  );
}

export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;
