import { useMemo } from 'react';

/**
 * Hook to determine if virtualization should be used
 * Virtualization improves performance for large lists but adds overhead for small lists
 *
 * @param itemCount - Number of items in the list
 * @param threshold - Minimum number of items before virtualization (default: 50)
 * @returns Whether virtualization should be enabled
 */
export function useVirtualization(itemCount: number, threshold: number = 50): boolean {
  return useMemo(() => {
    return itemCount >= threshold;
  }, [itemCount, threshold]);
}

/**
 * Hook to calculate estimated item height based on content type
 *
 * @param type - Type of content ('post', 'message', 'notification', etc.)
 * @returns Estimated height in pixels
 */
export function useEstimatedItemHeight(type: 'post' | 'message' | 'notification' | 'comment'): number {
  return useMemo(() => {
    switch (type) {
      case 'post':
        return 500; // Posts with images, polls, etc.
      case 'message':
        return 60; // Chat messages
      case 'notification':
        return 80; // Notification items
      case 'comment':
        return 100; // Comments
      default:
        return 100;
    }
  }, [type]);
}
