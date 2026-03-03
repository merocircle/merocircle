'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PageLayout } from '@/components/common/PageLayout';
import SettingsSection from '@/components/dashboard/sections/SettingsSection';

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Settings — MeroCircle';
  }, []);

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
      <SettingsSection />
    </PageLayout>
  );
}
