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
      <ProfileSection />
    </PageLayout>
  );
}
