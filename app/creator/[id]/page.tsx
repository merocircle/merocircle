'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page now redirects to the dashboard with the creator loaded
// The actual creator profile is rendered in the unified dashboard as a view

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;

  useEffect(() => {
    if (creatorId) {
      // Redirect to dashboard with creator param
      router.replace(`/dashboard?creator=${creatorId}`);
    }
  }, [creatorId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading creator profile...</p>
      </div>
    </div>
  );
}
