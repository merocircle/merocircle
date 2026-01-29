'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { slugifyDisplayName } from '@/lib/utils';

// Legacy route: redirect to the public creator page by username slug

function CreatorProfileContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = params.id as string;
  const postId = searchParams.get('post');

  useEffect(() => {
    if (creatorId) {
      const redirectToPublicPage = async () => {
        try {
          const response = await fetch(`/api/creator/${creatorId}`);
          if (!response.ok) throw new Error('Creator not found');
          const data = await response.json();
          const displayName = data.creatorDetails?.display_name || '';
          const slug = slugifyDisplayName(displayName);
          if (slug) {
            // Preserve the post query parameter if present
            const redirectUrl = postId ? `/${slug}?post=${postId}` : `/${slug}`;
            router.replace(redirectUrl);
            return;
          }
        } catch {
          // fall through
        }
        router.replace('/home');
      };

      redirectToPublicPage();
    }
  }, [creatorId, router, postId]);

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

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CreatorProfileContent />
    </Suspense>
  );
}
