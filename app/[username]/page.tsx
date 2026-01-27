"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreatorProfileSection from '@/components/dashboard/sections/CreatorProfileSection';

export default function PublicCreatorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const postId = searchParams.get('post');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    const fetchCreator = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/creator/resolve/${encodeURIComponent(username)}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Creator not found');
        }
        const data = await response.json();
        if (!cancelled) {
          setCreatorId(data.creatorId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Creator not found');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCreator();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !creatorId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 text-center border-border max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-3">Creator Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'This creator doesn\'t exist or has been removed.'}
          </p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  return <CreatorProfileSection creatorId={creatorId} initialHighlightedPostId={postId} />;
}
