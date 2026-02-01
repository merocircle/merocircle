'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/common/PageLayout';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnsubscribe = async () => {
    if (!token) {
      setError('Invalid unsubscribe link');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/supporter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-10 text-center max-w-md">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h2>
            <p className="text-muted-foreground mb-6">
              This unsubscribe link is invalid or has expired.
            </p>
            <Button onClick={() => router.push('/home')}>
              Go to Home
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (success) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-10 text-center max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Successfully Unsubscribed
              </h2>
              <p className="text-muted-foreground mb-6">
                You will no longer receive email notifications for new posts from this creator.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You can still access all content and features as a supporter. This only affects email notifications.
              </p>
              <Button onClick={() => router.push('/home')}>
                Go to Home
              </Button>
            </Card>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-10 text-center max-w-md">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Unsubscribe from Email Notifications
            </h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to stop receiving email notifications for new posts from this creator?
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You'll still have access to all content and features as a supporter.
            </p>

            {error && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/home')}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  'Unsubscribe'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
