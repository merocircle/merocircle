'use client';

import { Suspense, lazy, useEffect } from 'react';
import { PageLayout } from '@/components/common/PageLayout';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { MinimumDelay } from '@/components/common/MinimumDelay';
import { motion } from 'framer-motion';

// Lazy load with prefetch support
const StreamCommunitySection = lazy(() => import('@/components/dashboard/sections/StreamCommunitySection'));

function ChatLoadingSkeleton() {
  return (
    <motion.div
      className="flex h-[calc(100vh-80px)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-80 border-r border-border/50 p-4 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-border/50 px-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-24" />
                <div className="h-10 bg-muted rounded animate-pulse w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  // Track performance
  usePerformanceMonitor('/chat');

  // Prefetch component for subsequent visits
  useEffect(() => {
    const timer = setTimeout(() => {
      import('@/components/dashboard/sections/StreamCommunitySection');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <Suspense fallback={<ChatLoadingSkeleton />}>
        <MinimumDelay
          isLoading={false}
          minimumDelay={200}
          fallback={<ChatLoadingSkeleton />}
        >
          <div className="h-[calc(100vh-80px)]">
            <StreamCommunitySection />
          </div>
        </MinimumDelay>
      </Suspense>
    </PageLayout>
  );
}
