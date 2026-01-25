'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/supabase-auth-context';
import { PageLayout } from '@/components/common/PageLayout';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';

export default function DashboardPage() {
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
      <UnifiedDashboard />
    </PageLayout>
  );
}
