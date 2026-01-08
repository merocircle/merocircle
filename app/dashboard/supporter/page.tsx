"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';

export default function SupporterDashboard() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    </div>
  );
} 