'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the heavy chat component
const StreamCommunitySection = lazy(() => import('@/components/dashboard/sections/StreamCommunitySection'));

function ChatLoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[100vh]">
      {/* Desktop sidebar skeleton */}
      <div className="hidden md:flex w-80 border-r border-border/50 p-4 space-y-4">
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
      {/* Mobile skeleton - single column */}
      <div className="md:hidden w-full p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
      {/* Desktop main content skeleton */}
      <div className="hidden md:flex flex-1 flex flex-col">
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
    </div>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channel');

  return (
    <div className="h-[calc(100vh-80px)] md:h-[100vh]">
      <StreamCommunitySection channelId={channelId || undefined} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <PageLayout>
      <Suspense fallback={<ChatLoadingSkeleton />}>
        <ChatPageContent />
      </Suspense>
    </PageLayout>
  );
}
