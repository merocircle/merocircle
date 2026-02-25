'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the heavy chat component
const StreamCommunitySection = lazy(() => import('@/components/dashboard/sections/StreamCommunitySection'));

function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full min-h-0">
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

  useEffect(() => {
    document.title = 'Messages — MeroCircle';
  }, []);

  // On mobile, lock body scroll so the whole chat box stays fixed — only the message list scrolls
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    if (!mql.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, []);

  return (
    <>
      {/* Mobile: fix the entire chat box to the viewport so it cannot scroll */}
      <div
        className={[
          'flex flex-col overflow-hidden',
          'fixed inset-x-0 top-0 z-0',
          'bottom-[calc(3.5rem+env(safe-area-inset-bottom))]',
          'md:relative md:inset-auto md:bottom-auto md:z-auto md:h-full md:min-h-0',
        ].join(' ')}
      >
        <div className="h-full min-h-0 flex flex-col overflow-hidden">
          <StreamCommunitySection channelId={channelId || undefined} />
        </div>
      </div>
    </>
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
