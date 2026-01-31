/**
 * Utility functions for intelligent prefetching
 * Implements throttling, caching, and error handling
 */

type PrefetchFunction = () => void | Promise<void>;

// Cache to track when prefetch was last called
const prefetchTimestamps = new Map<string, number>();

/**
 * Throttle prefetch function to prevent excessive calls
 * @param key Unique identifier for this prefetch operation
 * @param fn Function to prefetch
 * @param delayMs Minimum time between calls (default: 2000ms)
 */
export function throttledPrefetch(
  key: string,
  fn: PrefetchFunction,
  delayMs: number = 2000
): () => void {
  return () => {
    const now = Date.now();
    const lastCall = prefetchTimestamps.get(key) || 0;
    
    // Only execute if enough time has passed
    if (now - lastCall >= delayMs) {
      prefetchTimestamps.set(key, now);
      
      try {
        const result = fn();
        
        // Handle async prefetch functions
        if (result instanceof Promise) {
          result.catch((error) => {
            console.warn(`Prefetch failed for ${key}:`, error);
            // Reset timestamp to allow retry
            prefetchTimestamps.delete(key);
          });
        }
      } catch (error) {
        console.warn(`Prefetch failed for ${key}:`, error);
        // Reset timestamp to allow retry
        prefetchTimestamps.delete(key);
      }
    }
  };
}

/**
 * Prefetch a component lazily
 * @param importFn Lazy import function
 */
export function prefetchComponent(importFn: () => Promise<any>): void {
  try {
    importFn().catch((error) => {
      console.warn('Component prefetch failed:', error);
    });
  } catch (error) {
    console.warn('Component prefetch failed:', error);
  }
}

/**
 * Check if browser is online and has good connection
 * Prevents prefetching on slow connections
 */
export function shouldPrefetch(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if online
  if (!navigator.onLine) return false;
  
  // Check connection quality if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    // Don't prefetch on slow connections
    if (connection?.effectiveType === 'slow-2g' || 
        connection?.effectiveType === '2g' ||
        connection?.saveData === true) {
      return false;
    }
  }
  
  return true;
}

/**
 * Debounce function for hover events
 * Waits for user to hover for a short time before prefetching
 */
export function debouncedPrefetch(
  fn: PrefetchFunction,
  delayMs: number = 50
): () => void {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (shouldPrefetch()) {
        fn();
      }
    }, delayMs);
  };
}
