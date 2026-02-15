'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

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
      available: false,
      description: 'Coming soon',
    },
    {
      id: 'khalti' as const,
      name: 'Khalti',
      logoPath: '/khalti.png',
      available: false,
      description: 'Coming soon',
    },
    {
      id: 'dodo' as const,
      name: 'Visa/Mastercard',
      logoPath: '/dodo.png',
      available: false,
      description: 'Coming soon',
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
      </DialogContent>
    </Dialog>
  );
}
