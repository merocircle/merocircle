'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/supabase-auth-context';

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

  useEffect(() => {
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to creator page after verification and auth check
  useEffect(() => {
    if (verified && !authLoading) {
      const creator_id = searchParams.get('creator_id');
      // Wait a bit for auth to initialize after redirect
      const timer = setTimeout(() => {
        if (creator_id) {
          // Redirect back to the creator page where payment was initiated
          router.push(`/creator/${creator_id}`);
        } else if (isAuthenticated) {
          // Fallback to dashboard if no creator_id
          router.push('/dashboard');
        } else {
          // If not authenticated, redirect to home page
          router.push('/');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verified, isAuthenticated, authLoading, router, searchParams]);

  const verifyPayment = async () => {
    try {
      // Get parameters from eSewa callback
      const transaction_uuid = searchParams.get('transaction_uuid');
      const total_amount = searchParams.get('total_amount');
      const product_code = searchParams.get('product_code') || 'EPAYTEST';
      const creator_id = searchParams.get('creator_id');
      const ref_id = searchParams.get('refId');

      console.log('[SUCCESS] Verifying payment:', {
        transaction_uuid,
        total_amount,
        product_code,
        creator_id,
        ref_id,
      });

      if (!transaction_uuid || !total_amount) {
        console.error('[SUCCESS] Missing parameters');
        setIsVerifying(false);
        return;
      }

      // Verify payment with backend
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {verified ? 'Payment Successful! 🎉' : 'Payment Received'}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Thank you for supporting a creator on CreatorsNepal
            </p>

            {transaction && (
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 mb-6">
                <p className="text-green-100 text-sm mb-1">Amount Paid</p>
                <p className="text-3xl font-bold">NPR {transaction.amount}</p>
              </div>
            )}

            <div className="space-y-3 mt-6">
              <Button 
                onClick={() => {
                  const creator_id = searchParams.get('creator_id');
                  if (creator_id) {
                    router.push(`/creator/${creator_id}`);
                  } else if (isAuthenticated) {
                    router.push('/dashboard');
                  } else {
                    router.push('/');
                  }
                }}
                className="w-full"
              >
                {searchParams.get('creator_id') ? 'Back to Creator Page' : (isAuthenticated ? 'Go to Dashboard' : 'Go to Home')}
              </Button>
              
              <Button variant="outline" asChild className="w-full">
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
