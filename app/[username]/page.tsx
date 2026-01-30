"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading creator profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !creatorId) {
    return (
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
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <CreatorProfileSection creatorId={creatorId} initialHighlightedPostId={postId} />
    </motion.div>
  );
}

export default function PublicCreatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading creator profile...</p>
        </motion.div>
      </div>
    }>
      <PublicCreatorContent />
    </Suspense>
  );
}
