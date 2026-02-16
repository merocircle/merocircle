'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PageLayout } from '@/components/common/PageLayout';
import dynamic from 'next/dynamic';
import { FeedSkeleton } from '@/components/dashboard/sections/LoadingSkeleton';

const ProfileSection = dynamic(() => import('@/components/dashboard/sections/ProfileSection'), {
  loading: () => <FeedSkeleton />,
  ssr: false
});

export default function ProfilePage() {
  const { isAuthenticated, loading: authLoading, isCreator, creatorProfile, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    // For creators, redirect to their public creator page (with vanity URL)
    if (!authLoading && isAuthenticated && isCreator && user?.id) {
      const slug = creatorProfile?.vanity_username || user.id;
      router.replace(`/creator/${slug}`);
    }
  }, [isAuthenticated, authLoading, isCreator, creatorProfile?.vanity_username, user?.id, router]);

  if (authLoading) {
    return <PageLayout loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Creators will be redirected; show loading until redirect completes
  if (isCreator) {
    return (
      <PageLayout>
        <FeedSkeleton />
      </PageLayout>
    );
  }

  // Non-creators (supporters) get the simpler profile view
  return (
    <PageLayout>
      <ProfileSection />
    </PageLayout>
  );
}
