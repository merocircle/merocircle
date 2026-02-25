'use client';

import { Suspense, lazy, useEffect } from 'react';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the feed component for main engagement
const FeedSection = lazy(() => import('@/components/dashboard/sections/FeedSection'));

function FeedLoadingSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      {/* Filter tabs skeleton */}
      <div className="flex gap-2 pb-3 border-b border-border/30">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      {/* Post skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl p-4 space-y-3 border border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-full" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          </div>
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  useEffect(() => {
    document.title = 'Home — MeroCircle';
  }, []);

  return (
    <PageLayout>
      <Suspense fallback={<FeedLoadingSkeleton />}>
        <FeedSection />
      </Suspense>
    </PageLayout>
  );
}
