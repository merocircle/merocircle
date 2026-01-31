'use client';

import { Suspense, lazy, useEffect } from 'react';
import { PageLayout } from '@/components/common/PageLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { MinimumDelay } from '@/components/common/MinimumDelay';
import { motion } from 'framer-motion';

// Lazy load with prefetch support
const ExploreSection = lazy(() => import('@/components/dashboard/sections/ExploreSection'));

function ExploreLoadingSkeleton() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
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
    </motion.div>
  );
}

export default function HomePage() {
  // Track performance
  usePerformanceMonitor('/home');

  // Prefetch component for subsequent visits
  useEffect(() => {
    const timer = setTimeout(() => {
      import('@/components/dashboard/sections/ExploreSection');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <Suspense fallback={<ExploreLoadingSkeleton />}>
        <MinimumDelay
          isLoading={false}
          minimumDelay={200}
          fallback={<ExploreLoadingSkeleton />}
        >
          <PageTransition>
            <ExploreSection />
          </PageTransition>
        </MinimumDelay>
      </Suspense>
    </PageLayout>
  );
}
