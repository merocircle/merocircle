'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  
  // Get failure parameters from eSewa
  const pid = searchParams.get('pid'); // Product ID
  const refId = searchParams.get('refId'); // Reference ID from eSewa

  const retryPayment = () => {
    // Redirect back to the previous page or payment page
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Failure Header */}
          <Card className="p-8 text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Payment Failed
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Unfortunately, your payment could not be processed
            </p>

            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">eS</span>
                </div>
                <div>
                  <p className="font-semibold">eSewa Payment Failed</p>
                  <p className="text-red-100 text-sm">Transaction was not completed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Common Reasons */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Common Reasons for Payment Failure
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Insufficient Balance</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your eSewa account might not have enough balance to complete the transaction.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Incorrect Login</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Invalid eSewa ID, password, or MPIN entered during the payment process.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Network Issues</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Poor internet connection or technical issues during the payment process.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Transaction Cancelled</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You may have cancelled the transaction on the eSewa payment page.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* What to do next */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What you can do
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <RefreshCw className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Try Again</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Check your eSewa balance and try the payment again.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm">💳</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Use Different Payment Method</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Try using Khalti or bank transfer if available.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageCircle className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Contact Support</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    If the issue persists, reach out to our support team for assistance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Transaction Info (if available) */}
          {(pid || refId) && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Transaction Information
              </h2>
              
              <div className="space-y-3">
                {pid && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Product ID</span>
                    <span className="font-mono text-sm">{pid}</span>
                  </div>
                )}
                
                {refId && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Reference ID</span>
                    <span className="font-mono text-sm">{refId}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Failed At</span>
                  <span>{new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={retryPayment} className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <Link href="/support">
                <MessageCircle className="w-4 h-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>

          {/* eSewa Support */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">eSewa Support</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Phone: 01-5970002 | Email: support@esewa.com.np</p>
              <p>For issues related to eSewa login or balance, contact eSewa directly.</p>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Need help? <Link href="/support" className="text-blue-600 hover:underline">Contact CreatorsNepal support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  
  // Get failure parameters from eSewa
  const pid = searchParams.get('pid'); // Product ID
  const refId = searchParams.get('refId'); // Reference ID from eSewa

  const retryPayment = () => {
    // Redirect back to the previous page or payment page
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Failure Header */}
          <Card className="p-8 text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Payment Failed
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Unfortunately, your payment could not be processed
            </p>

            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">eS</span>
                </div>
                <div>
                  <p className="font-semibold">eSewa Payment Failed</p>
                  <p className="text-red-100 text-sm">Transaction was not completed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Common Reasons */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Common Reasons for Payment Failure
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Insufficient Balance</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your eSewa account might not have enough balance to complete the transaction.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Incorrect Login</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Invalid eSewa ID, password, or MPIN entered during the payment process.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Network Issues</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Poor internet connection or technical issues during the payment process.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Transaction Cancelled</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You may have cancelled the transaction on the eSewa payment page.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* What to do next */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What you can do
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <RefreshCw className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Try Again</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Check your eSewa balance and try the payment again.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm">💳</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Use Different Payment Method</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Try using Khalti or bank transfer if available.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageCircle className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Contact Support</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    If the issue persists, reach out to our support team for assistance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Transaction Info (if available) */}
          {(pid || refId) && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Transaction Information
              </h2>
              
              <div className="space-y-3">
                {pid && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Product ID</span>
                    <span className="font-mono text-sm">{pid}</span>
                  </div>
                )}
                
                {refId && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Reference ID</span>
                    <span className="font-mono text-sm">{refId}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Failed At</span>
                  <span>{new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={retryPayment} className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <Link href="/support">
                <MessageCircle className="w-4 h-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>

          {/* eSewa Support */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">eSewa Support</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Phone: 01-5970002 | Email: support@esewa.com.np</p>
              <p>For issues related to eSewa login or balance, contact eSewa directly.</p>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Need help? <Link href="/support" className="text-blue-600 hover:underline">Contact CreatorsNepal support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  
  // Get failure parameters from eSewa
  const pid = searchParams.get('pid'); // Product ID
  const refId = searchParams.get('refId'); // Reference ID from eSewa

  const retryPayment = () => {
    // Redirect back to the previous page or payment page
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Failure Header */}
          <Card className="p-8 text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Payment Failed
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Unfortunately, your payment could not be processed
            </p>

            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">eS</span>
                </div>
                <div>
                  <p className="font-semibold">eSewa Payment Failed</p>
                  <p className="text-red-100 text-sm">Transaction was not completed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Common Reasons */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Common Reasons for Payment Failure
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Insufficient Balance</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your eSewa account might not have enough balance to complete the transaction.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Incorrect Login</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Invalid eSewa ID, password, or MPIN entered during the payment process.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Network Issues</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Poor internet connection or technical issues during the payment process.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-red-600 text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Transaction Cancelled</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You may have cancelled the transaction on the eSewa payment page.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* What to do next */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What you can do
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <RefreshCw className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Try Again</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Check your eSewa balance and try the payment again.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm">💳</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Use Different Payment Method</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Try using Khalti or bank transfer if available.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageCircle className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Contact Support</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    If the issue persists, reach out to our support team for assistance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Transaction Info (if available) */}
          {(pid || refId) && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Transaction Information
              </h2>
              
              <div className="space-y-3">
                {pid && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Product ID</span>
                    <span className="font-mono text-sm">{pid}</span>
                  </div>
                )}
                
                {refId && (
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Reference ID</span>
                    <span className="font-mono text-sm">{refId}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Failed At</span>
                  <span>{new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={retryPayment} className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <Link href="/support">
                <MessageCircle className="w-4 h-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center space-x-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>

          {/* eSewa Support */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">eSewa Support</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Phone: 01-5970002 | Email: support@esewa.com.np</p>
              <p>For issues related to eSewa login or balance, contact eSewa directly.</p>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Need help? <Link href="/support" className="text-blue-600 hover:underline">Contact CreatorsNepal support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 