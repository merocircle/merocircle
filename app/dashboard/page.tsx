'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/supabase-auth-context';
import { DashboardProvider } from '@/contexts/dashboard-context';
import { PageLayout } from '@/components/common/PageLayout';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <PageLayout loading>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardProvider>
      <PageLayout>
        <UnifiedDashboard />
      </PageLayout>
    </DashboardProvider>
  );
}
