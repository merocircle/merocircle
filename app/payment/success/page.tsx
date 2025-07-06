'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TransactionData {
  id: string;
  amount: number;
  creator_id: string;
  supporter_message?: string;
  completed_at: string;
  esewa_data: any;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // eSewa returns these parameters on success
  const oid = searchParams.get('oid'); // Transaction UUID
  const amt = searchParams.get('amt'); // Amount
  const refId = searchParams.get('refId'); // eSewa reference ID

  useEffect(() => {
    const verifyPayment = async () => {
      if (!oid || !amt) {
        setError('Missing payment parameters');
        setLoading(false);
        return;
      }

      try {
        // Verify payment with our backend
        const response = await fetch(
          `/api/payment/esewa?transaction_uuid=${oid}&total_amount=${amt}&product_code=EPAYTEST`
        );
        
        const result = await response.json();
        
        if (result.success && result.status === 'completed') {
          setTransaction(result.transaction);
        } else {
          setError('Payment verification failed. Please contact support.');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [oid, amt]);

  const sharePayment = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Payment Successful',
        text: `I just supported a creator on CreatorsNepal with NPR ${transaction?.amount}!`,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/support">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="p-8 text-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Payment Successful! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Thank you for supporting a creator on CreatorsNepal
            </p>

            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Amount Paid</p>
                  <p className="text-3xl font-bold">NPR {transaction?.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm mb-1">Payment Method</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">eS</span>
                    </div>
                    <span className="font-semibold">eSewa</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Transaction Details */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Transaction Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                <span className="font-mono text-sm">{transaction?.id}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">eSewa Reference</span>
                <span className="font-mono text-sm">{refId}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Payment Date</span>
                <span>{new Date(transaction?.completed_at || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>

              {transaction?.supporter_message && (
                <div className="py-2">
                  <span className="text-gray-600 dark:text-gray-400 block mb-2">Your Message</span>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-900 dark:text-gray-100 italic">
                      "{transaction.supporter_message}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* What happens next */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What happens next?
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Creator Notification</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    The creator will be notified about your support and message.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Instant Transfer</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your payment has been directly transferred to the creator's eSewa account.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Email Receipt</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You'll receive a detailed receipt via email within a few minutes.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={sharePayment} variant="outline" className="flex items-center justify-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <a href={`https://esewa.com.np/transaction/${refId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                <span>View on eSewa</span>
              </a>
            </Button>
            
            <Button asChild className="flex items-center justify-center space-x-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Having issues? <Link href="/support" className="text-blue-600 hover:underline">Contact our support team</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 