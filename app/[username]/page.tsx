"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/common/PageLayout';
import CreatorProfileSection from '@/components/dashboard/sections/CreatorProfileSection';
import { motion } from 'framer-motion';

function PublicCreatorContent() {
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
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Compact skeleton - no full screen spinner */}
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !creatorId) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-10 text-center border-border/50 shadow-xl max-w-md backdrop-blur-sm bg-background/95">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6"
              >
                <AlertCircle className="w-8 h-8 text-destructive" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-foreground mb-3"
              >
                Creator Not Found
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-8 leading-relaxed"
              >
                {error || 'This creator doesn\'t exist or may have been removed from the platform.'}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={() => router.push('/')}
                  size="lg"
                  className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        <CreatorProfileSection creatorId={creatorId} initialHighlightedPostId={postId} />
      </motion.div>
    </PageLayout>
  );
}

export default function PublicCreatorPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Compact, instant-loading skeleton */}
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    }>
      <PublicCreatorContent />
    </Suspense>
  );
}
