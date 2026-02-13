'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { BalloonBurst } from '@/components/animations/BalloonBurst';

export const dynamic = 'force-dynamic';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [transaction, setTransaction] = useState<{
    id?: string;
    amount?: number;
    status?: string;
    created_at?: string;
  } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show animation when verified
  useEffect(() => {
    if (verified && !showAnimation) {
      setShowAnimation(true);
    }
  }, [verified, showAnimation]);

  const verifyPayment = async () => {
    try {
      // Get parameters from payment callback (eSewa, Khalti, Direct, or Dodo)
      let transaction_uuid = searchParams.get('transaction_uuid');
      let total_amount = searchParams.get('total_amount');
      let product_code = searchParams.get('product_code') || 'EPAYTEST';
      const gateway = searchParams.get('gateway'); // 'esewa', 'khalti', 'direct', or 'dodo'
      const creator_id = searchParams.get('creator_id');
      const ref_id = searchParams.get('refId');
      const subscription_id = searchParams.get('subscription_id');
      const transaction_id = searchParams.get('transaction_id');
      const pidx = searchParams.get('pidx');
      const amountParam = searchParams.get('amount'); // Khalti sends amount in paisa

      // eSewa redirects to success_url with response in Base64 "data" param (developer.esewa.com.np)
      const dataParam = searchParams.get('data');
      if (dataParam && typeof window !== 'undefined') {
        try {
          const decoded = JSON.parse(atob(dataParam)) as {
            status?: string;
            transaction_uuid?: string;
            total_amount?: number | string;
            product_code?: string;
          };
          if (decoded.status === 'COMPLETE' && decoded.transaction_uuid != null) {
            transaction_uuid = decoded.transaction_uuid;
            total_amount = String(decoded.total_amount ?? '');
            if (decoded.product_code) product_code = decoded.product_code;
          }
        } catch (e) {
          console.warn('[SUCCESS] Could not parse eSewa data param', e);
        }
      }

      console.log('[SUCCESS] Verifying payment:', {
        transaction_uuid,
        total_amount,
        product_code,
        gateway,
        creator_id,
        ref_id,
        subscription_id,
        transaction_id,
        pidx,
        amountParam,
      });

      if (gateway === 'dodo') {
        if (!subscription_id || !transaction_id) {
          console.error('[SUCCESS] Missing Dodo parameters');
          setIsVerifying(false);
          return;
        }

        const response = await fetch(
          `/api/payment/dodo/subscription/verify?subscription_id=${subscription_id}&transaction_id=${transaction_id}`
        );

        const result = await response.json();
        
        console.log('[SUCCESS] Dodo verification result:', result);

        if (result.success && result.status === 'active') {
          setVerified(true);
          setTransaction(result.subscription || { id: transaction_id, status: 'active' });
        } else {
          console.error('[SUCCESS] Dodo subscription verification failed:', result.error);
        }
        setIsVerifying(false);
        return;
      }

      // Khalti: server already verified in /api/payment/khalti/verify and redirected here with pidx, amount (paisa), gateway=khalti
      if (gateway === 'khalti' && pidx) {
        const amountNpr = amountParam ? Number(amountParam) / 100 : undefined;
        setVerified(true);
        setTransaction({
          id: transaction_id || pidx,
          amount: amountNpr,
          status: 'completed',
          created_at: new Date().toISOString(),
        });
        setIsVerifying(false);
        return;
      }

      // Handle other payment gateways (eSewa, Direct). Params may come from URL or eSewa's Base64 "data".
      if (!transaction_uuid || !total_amount) {
        console.error('[SUCCESS] Missing parameters (transaction_uuid/total_amount or eSewa data param)');
        setIsVerifying(false);
        return;
      }

      // For direct payments, they're already completed, so we can skip verification
      // and just set the transaction data directly
      if (gateway === 'direct') {
        setVerified(true);
        setTransaction({
          id: transaction_uuid,
          amount: parseFloat(total_amount),
          status: 'completed',
          created_at: new Date().toISOString(),
        });
        setIsVerifying(false);
        return;
      }

      // Verify payment with backend for eSewa and Khalti
      const response = await fetch(
        `/api/payment/verify?transaction_uuid=${transaction_uuid}&total_amount=${total_amount}&product_code=${product_code}`
      );

      const result = await response.json();
      
      console.log('[SUCCESS] Verification result:', result);

      if (result.success && result.status === 'completed') {
        setVerified(true);
        setTransaction(result.transaction);
      } else {
        console.error('[SUCCESS] Payment verification failed:', result.error);
      }
    } catch (error) {
      console.error('[SUCCESS] Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12">
                <div className="w-12 h-12 bg-primary animate-[morph_2s_ease-in-out_infinite] rounded-[6%]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your payment with eSewa...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const creatorId = searchParams.get('creator_id');

  // No valid callback params or verification failed – e.g. stuck on eSewa then opened our URL without params
  if (!verified && !isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Payment redirect issue
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn’t confirm your payment from this page. If you already paid via eSewa or Khalti, your support may still have gone through. Go back to the creator page or home to check.
          </p>
          <div className="space-y-3">
            {creatorId && (
              <Button asChild className="w-full" size="lg">
                <Link href={`/creator/${creatorId}`}>Back to creator</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleGoToCreator = () => {
    if (creatorId) {
      // Force refresh to bypass cache and fetch updated supporter status
      router.push(`/creator/${creatorId}?refresh=${Date.now()}`);
      // Also trigger a hard reload after navigation to ensure all caches are cleared
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
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Congratulations! 🎉
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                You have successfully supported this creator!
              </p>

              {transaction && (
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 mb-6">
                  <p className="text-green-100 text-sm mb-1">Amount Paid</p>
                  <p className="text-3xl font-bold">NPR {transaction.amount}</p>
                </div>
              )}

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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12">
                <div className="w-12 h-12 bg-primary animate-[morph_2s_ease-in-out_infinite] rounded-[6%]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Loading...
            </h2>
          </div>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
