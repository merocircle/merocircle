'use client';

import { useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/supabase-auth-context';
import { PageLayout } from '@/components/common/PageLayout';

// Lazy load the notifications component
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth');
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
      <Suspense fallback={<NotificationsLoadingSkeleton />}>
        <NotificationsSection />
      </Suspense>
    </PageLayout>
  );
}
