'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentFailurePage() {
  const retryPayment = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Payment Failed
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Your payment could not be processed. Please try again.
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Common reasons for payment failure:
              </p>
              <ul className="text-gray-600 dark:text-gray-400 text-sm mt-2 space-y-1 text-left">
                <li>• Insufficient balance in eSewa account</li>
                <li>• Payment cancelled by user</li>
                <li>• Session timeout (5 minutes)</li>
                <li>• Network connectivity issues</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button onClick={retryPayment} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
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
