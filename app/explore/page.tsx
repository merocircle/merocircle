'use client';

import { Suspense, lazy, useEffect } from 'react';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the explore component
import ExploreSection from '@/components/dashboard/sections/ExploreSection';
// const ExploreSection = lazy(() => import('@/components/dashboard/sections/ExploreSection'));

function ExploreLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-muted rounded animate-pulse w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-muted rounded-xl animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  useEffect(() => {
    document.title = 'Explore — MeroCircle';
  }, []);

  return (
    <PageLayout>
      <Suspense fallback={<ExploreLoadingSkeleton />}>
        <ExploreSection />
      </Suspense>
    </PageLayout>
  );
}
