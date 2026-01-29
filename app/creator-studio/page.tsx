'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/supabase-auth-context';
import { PageLayout } from '@/components/common/PageLayout';
import dynamic from 'next/dynamic';
import { SettingsSkeleton } from '@/components/dashboard/sections/LoadingSkeleton';

const CreatorStudioSection = dynamic(() => import('@/components/dashboard/sections/CreatorStudioSection'), {
  loading: () => <SettingsSkeleton />,
  ssr: false
});

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
      <CreatorStudioSection />
    </PageLayout>
  );
}
