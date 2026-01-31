'use client';

import { Suspense, lazy, useEffect } from 'react';
import { PageLayout } from '@/components/common/PageLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

// Lazy load with prefetch support
const NotificationsSection = lazy(() => import('@/components/dashboard/sections/NotificationsSection'));

function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border-b border-border/50">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  // Track performance
  usePerformanceMonitor('/notifications');

  // Prefetch component for subsequent visits
  useEffect(() => {
    const timer = setTimeout(() => {
      import('@/components/dashboard/sections/NotificationsSection');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <Suspense fallback={<NotificationsLoadingSkeleton />}>
        <PageTransition>
          <NotificationsSection />
        </PageTransition>
      </Suspense>
    </PageLayout>
  );
}
