'use client';

import { Suspense, lazy, useEffect } from 'react';
import { PageLayout } from '@/components/common/PageLayout';
import { PageTransition } from '@/components/common/PageTransition';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { MinimumDelay } from '@/components/common/MinimumDelay';
import { motion } from 'framer-motion';

// Lazy load with prefetch support
const NotificationsSection = lazy(() => import('@/components/dashboard/sections/NotificationsSection'));

function NotificationsLoadingSkeleton() {
  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
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
    </motion.div>
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
        <MinimumDelay
          isLoading={false}
          minimumDelay={200}
          fallback={<NotificationsLoadingSkeleton />}
        >
          <PageTransition>
            <NotificationsSection />
          </PageTransition>
        </MinimumDelay>
      </Suspense>
    </PageLayout>
  );
}
