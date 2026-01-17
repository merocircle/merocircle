'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PaymentGatewaySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectGateway: (gateway: 'esewa' | 'khalti' | 'direct') => void;
  amount: number;
  tierLevel: number;
  creatorId: string;
  supporterId: string;
  supporterMessage?: string;
}

export function PaymentGatewaySelector({
  open,
  onClose,
  onSelectGateway,
  amount,
  tierLevel,
  creatorId,
  supporterId,
  supporterMessage,
}: PaymentGatewaySelectorProps) {
  const gateways = [
    {
      id: 'esewa' as const,
      name: 'eSewa',
      logoPath: '/esewa.jpg',
      available: true,
    },
    {
      id: 'khalti' as const,
      name: 'Khalti',
      logoPath: '/khalti.png',
      available: true,
    },
    {
      id: 'fonepay' as const,
      name: 'Fonepay',
      logoPath: '/fonepay.png',
      available: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Payment Method</DialogTitle>
          <DialogDescription className="text-sm">
            NPR {amount.toLocaleString()} • Tier {tierLevel}
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
                }`}
                onClick={() => !isComingSoon && onSelectGateway(gateway.id as 'esewa' | 'khalti')}
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
                  {/* Logo - Clickable */}
                  <div 
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isComingSoon) {
                        onSelectGateway(gateway.id as 'esewa' | 'khalti');
                      }
                    }}
                  >
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
                
                if (result.success) {
                  // Close modal first
                  onClose();
                  // Then trigger the callback to refresh data
                  // Use setTimeout to ensure modal closes before callback
                  setTimeout(() => {
                    onSelectGateway('direct');
                  }, 100);
                } else {
                  throw new Error(result.error || 'Payment failed');
                }
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
