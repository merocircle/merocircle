'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PaymentSuccessModal } from './PaymentSuccessModal';

interface PaymentGatewaySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectGateway: (gateway: 'esewa' | 'khalti' | 'dodo' | 'direct') => void;
  amount: number;
  tierLevel: number;
  creatorId: string;
  creatorName: string;
  supporterId: string;
  supporterMessage?: string;
  onPaymentSuccess?: (tierLevel: number, navigateToTab?: 'posts' | 'chat') => void;
}

export function PaymentGatewaySelector({
  open,
  onClose,
  onSelectGateway,
  amount,
  tierLevel,
  creatorId,
  creatorName,
  supporterId,
  supporterMessage,
  onPaymentSuccess,
}: PaymentGatewaySelectorProps) {
  const gateways = [
    {
      id: 'esewa' as const,
      name: 'eSewa',
      logoPath: '/esewa.png',
      available: true,
    },
    {
      id: 'khalti' as const,
      name: 'Khalti',
      logoPath: '/khalti.png',
      available: true,
    },
    {
      id: 'dodo' as const,
      name: 'Visa/Mastercard',
      logoPath: '/dodo.png',
      available: true,
      isSubscription: true,
    },
    {
      id: 'fonepay' as const,
      name: 'Fonepay',
      logoPath: '/fonepay.png',
      available: false,
      description: 'Coming soon',
    },
  ];

  const [paymentSuccess, setPaymentSuccess] = useState<{
    transactionUuid: string;
    totalAmount: number;
    gateway: string;
  } | null>(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Payment Method</DialogTitle>
          <DialogDescription className="text-sm">
            NPR {amount.toLocaleString()} • Tier {tierLevel}
            <br />
            <span className="text-xs text-muted-foreground">Choose one-time payment or monthly subscription</span>
          </DialogDescription>
        </DialogHeader>

        {/* Gateway Options - Compact Vertical Layout */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {gateways.map((gateway) => {
            const isComingSoon = !gateway.available;
            
            return (
              <Card
                key={gateway.id}
                className={`relative overflow-hidden w-full transition-all duration-200 border ${
                  isComingSoon 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:shadow-md hover:border-purple-400 active:scale-[0.98]'
                } ${(gateway as any).isSubscription ? 'border-blue-500/50' : ''}`}
                onClick={() => !isComingSoon && onSelectGateway(gateway.id as 'esewa' | 'khalti' | 'dodo')}
              >
                {/* Coming Soon Badge */}
                {isComingSoon && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="relative p-3 flex items-center justify-between">
                  {/* Logo and Info */}
                  <div 
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isComingSoon) {
                        onSelectGateway(gateway.id as 'esewa' | 'khalti' | 'dodo');
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="relative h-12 w-auto flex items-center">
                        <Image
                          src={gateway.logoPath}
                          alt={gateway.name}
                          width={140}
                          height={48}
                          className="object-contain max-h-12"
                          unoptimized
                        />
                      </div>
                      {(gateway as any).description && (
                        <span className="text-xs text-muted-foreground mt-1">{(gateway as any).description}</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  {!isComingSoon && (
                    <div className="text-gray-400 ml-2">
                      →
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Direct Payment Button */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                console.log("supporter message", supporterMessage);

                const response = await fetch('/api/payment/direct', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount,
                    creatorId,
                    supporterId,
                    supporterMessage: supporterMessage || '',
                    tier_level: tierLevel,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || 'Direct payment failed');
                }

                const result = await response.json();
                
                // if (result.success && result.transaction) {
                //   // Close modal first
                //   onClose();
                //   // Redirect to payment success page with transaction details
                //   const transactionUuid = result.transaction.transaction_uuid;
                //   const totalAmount = result.transaction.amount;
                  
                //   // Use window.location to ensure full page navigation (creatorId is from props)
                //   window.location.href = `/payment/success?transaction_uuid=${transactionUuid}&total_amount=${totalAmount}&product_code=DIRECT&creator_id=${creatorId}&gateway=direct`;
                // } else {
                //   throw new Error(result.error || 'Payment failed');
                // }

                if (result.success && result.transaction) {
                  setPaymentSuccess({
                    transactionUuid: result.transaction.transaction_uuid,
                    totalAmount: result.transaction.amount,
                    gateway: 'direct',
                  });
                } else throw new Error(result.error || 'Direct payment failed');
              } catch (error) {
                console.error('Direct payment error:', error);
                alert(error instanceof Error ? error.message : 'Failed to register support. Please try again.');
              }
            }}
          >
            Skip Payment Gateway & Register Support
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            This will register your support without going through a payment gateway
          </p>
          {paymentSuccess && (
            <PaymentSuccessModal
              open={!!paymentSuccess}
              onClose={() => {
                setPaymentSuccess(null);
                if (onPaymentSuccess && paymentSuccess) {
                  onPaymentSuccess(tierLevel);
                }
                onClose();
              }}
              onViewPosts={() => {
                if (onPaymentSuccess && paymentSuccess) {
                  onPaymentSuccess(tierLevel, 'posts');
                }
                setPaymentSuccess(null);
                onClose();
              }}
              onViewChat={() => {
                if (onPaymentSuccess && paymentSuccess) {
                  onPaymentSuccess(tierLevel, 'chat');
                }
                setPaymentSuccess(null);
                onClose();
              }}
              transactionUuid={paymentSuccess.transactionUuid}
              totalAmount={paymentSuccess.totalAmount}
              gateway={paymentSuccess.gateway}
              creatorName={creatorName || ''}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
