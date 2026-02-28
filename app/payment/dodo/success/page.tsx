'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { BalloonBurst } from '@/components/animations/BalloonBurst';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

function DodoSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [subscription, setSubscription] = useState<{
    id?: string;
    status?: string;
  } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    verifySubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show animation when verified
  useEffect(() => {
    if (verified && !showAnimation) {
      setShowAnimation(true);
    }
  }, [verified, showAnimation]);

  const verifySubscription = async () => {
    try {
      const subscription_id = searchParams.get('subscription_id');
      const transaction_id = searchParams.get('transaction_id');

      logger.info('Verifying Dodo subscription', 'DODO_SUCCESS', { subscription_id, transaction_id });

      if (!subscription_id || !transaction_id) {
        logger.error('Missing Dodo parameters', 'DODO_SUCCESS');
        toast({ title: 'Verification failed', description: 'Missing parameters.', variant: 'destructive' });
        setIsVerifying(false);
        return;
      }

      const response = await fetch(
        `/api/payment/dodo/subscription/verify?subscription_id=${subscription_id}&transaction_id=${transaction_id}`
      );

      const result = await response.json();

      if (result.success && result.status === 'active') {
        setVerified(true);
        setSubscription(result.subscription);
      } else {
        logger.error('Subscription verification failed', 'DODO_SUCCESS', { error: result.error });
        toast({ title: 'Verification failed', description: result.error || 'Subscription could not be verified.', variant: 'destructive' });
      }
    } catch (error) {
      logger.error('Dodo verification error', 'DODO_SUCCESS', { error: error instanceof Error ? error.message : String(error) });
      toast({ title: 'Verification failed', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Verifying Subscription
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your subscription...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const creatorId = searchParams.get('creator_id');

  const handleGoToCreator = () => {
    if (creatorId) {
      router.push(`/creator/${creatorId}?refresh=${Date.now()}`);
      setTimeout(() => {
        router.refresh();
      }, 100);
    } else if (isAuthenticated) {
      router.push('/home');
    } else {
      router.push('/');
    }
  };

  const handleGoToChat = () => {
    router.push('/chat');
  };

  return (
    <>
      {showAnimation && <BalloonBurst />}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Subscription Activated! 🎉
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                Your monthly subscription is now active!
              </p>

              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-6 mb-6">
                <p className="text-blue-100 text-sm mb-1">Monthly Subscription</p>
                <p className="text-2xl font-bold">Recurring Payment Active</p>
                <p className="text-sm text-blue-100 mt-2">
                  You'll be charged automatically each month
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <Button 
                  onClick={handleGoToCreator}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5" />
                  {creatorId ? 'See Creator Page' : 'Go to Dashboard'}
                </Button>
                
                <Button 
                  onClick={handleGoToChat}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Open Chat
                </Button>
                
                <Button 
                  variant="ghost"
                  asChild 
                  className="w-full"
                >
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DodoSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Loading...
            </h2>
          </div>
        </Card>
      </div>
    }>
      <DodoSuccessContent />
    </Suspense>
  );
}
