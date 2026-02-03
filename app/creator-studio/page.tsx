'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { PageLayout } from '@/components/common/PageLayout';
import dynamic from 'next/dynamic';
import { SettingsSkeleton } from '@/components/dashboard/sections/LoadingSkeleton';

const CreatorStudioSection = dynamic(() => import('@/components/dashboard/sections/CreatorStudioSection'), {
  loading: () => <SettingsSkeleton />,
  ssr: false
});

function CreatorStudioContent() {
  const searchParams = useSearchParams();
  const { setHighlightedPostId } = useDashboardViewSafe();

  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId) {
      setHighlightedPostId(postId);
    }
  }, [searchParams, setHighlightedPostId]);

  return <CreatorStudioSection />;
}

export default function CreatorStudioPage() {
  const { isAuthenticated, loading: authLoading, isCreator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (!isCreator) {
      router.replace('/home');
    }
  }, [isAuthenticated, authLoading, isCreator, router]);

  if (authLoading) {
    return <PageLayout loading />;
  }

  if (!isAuthenticated || !isCreator) {
    return null;
  }

  return (
    <PageLayout>
      <Suspense fallback={<SettingsSkeleton />}>
        <CreatorStudioContent />
      </Suspense>
    </PageLayout>
  );
}
