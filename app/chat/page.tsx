'use client';

import { useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/supabase-auth-context';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the heavy chat component
const StreamCommunitySection = lazy(() => import('@/components/dashboard/sections/StreamCommunitySection'));

function ChatLoadingSkeleton() {
  return (
    <div className="flex h-screen">
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
    </div>
  );
}

export default function ChatPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <PageLayout loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageLayout>
      <Suspense fallback={<ChatLoadingSkeleton />}>
        <StreamCommunitySection />
      </Suspense>
    </PageLayout>
  );
}
