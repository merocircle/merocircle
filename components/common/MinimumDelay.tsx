'use client';

import { useState, useEffect, ReactNode } from 'react';

interface MinimumDelayProps {
  children: ReactNode;
  isLoading: boolean;
  minimumDelay?: number;
  fallback: ReactNode;
}

/**
 * Prevents skeleton flash by ensuring minimum display time
 * If content loads too fast, skeleton still shows for minimum time
 */
export function MinimumDelay({ 
  children, 
  isLoading, 
  minimumDelay = 300,
  fallback 
}: MinimumDelayProps) {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - startTime;
      const remaining = minimumDelay - elapsed;

      if (remaining > 0) {
        // Content loaded too fast, show skeleton for remaining time
        const timer = setTimeout(() => {
          setShowSkeleton(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        // Enough time has passed
        setShowSkeleton(false);
      }
    }
  }, [isLoading, startTime, minimumDelay]);

  if (showSkeleton || isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to ensure minimum loading time
 * Prevents jarring flashes when content loads instantly
 */
export function useMinimumDelay(isLoading: boolean, minimumDelay: number = 300): boolean {
  const [showLoading, setShowLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - startTime;
      const remaining = minimumDelay - elapsed;

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowLoading(false);
      }
    }
  }, [isLoading, startTime, minimumDelay]);

  return showLoading || isLoading;
}
