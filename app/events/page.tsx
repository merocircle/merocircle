'use client';

import { Suspense, lazy } from 'react';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the events component
const EventsSection = lazy(() => import('@/components/events/EventsSection'));

function EventsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Featured section skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 space-y-4 border border-border/40">
              <div className="h-32 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Following section skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 space-y-4 border border-border/40">
              <div className="h-32 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Popular section skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 space-y-4 border border-border/40">
              <div className="h-32 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <PageLayout>
      <Suspense fallback={<EventsLoadingSkeleton />}>
        <EventsSection />
      </Suspense>
    </PageLayout>
  );
}
