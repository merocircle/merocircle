"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { cn } from '@/lib/utils';
import { common, colors } from '@/lib/tailwind-utils';

export default function SupporterDashboard() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className={cn('min-h-screen', colors.bg.page)}>
      <Header />
      <div className={common.pageContainer}>
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    </div>
  );
} 