'use client';

import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 10;

/**
 * Hook for infinite-scroll discover feed (posts from creators user doesn't support).
 * Loads in batches of 10 via the /api/dashboard/discover endpoint.
 */
export function useDiscoverFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;

    const nextPage = pageRef.current + 1;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/dashboard/discover?limit=${BATCH_SIZE}&page=${nextPage}`
      );

      if (!res.ok) {
        throw new Error('Failed to load discover posts');
      }

      const data = await res.json();
      const newPosts = data.posts || [];
      const newHasMore = data.has_more ?? newPosts.length === BATCH_SIZE;

      pageRef.current = nextPage;
      setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(newHasMore);
    } catch (err) {
      logger.error('Failed to load discover posts', 'USE_DISCOVER_FEED', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  return {
    posts,
    hasMore,
    isLoading,
    loadMore,
  };
}
