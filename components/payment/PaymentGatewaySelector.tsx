'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Wallet, CreditCard, QrCode } from 'lucide-react';

interface PaymentGatewaySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectGateway: (gateway: 'esewa' | 'khalti') => void;
  amount: number;
  tierLevel: number;
}

export function PaymentGatewaySelector({
  open,
  onClose,
  onSelectGateway,
  amount,
  tierLevel,
}: PaymentGatewaySelectorProps) {
  const gateways = [
    {
      id: 'esewa' as const,
      name: 'eSewa',
      description: 'Pay with eSewa wallet',
      icon: Wallet,
      color: 'from-green-500 to-emerald-600',
      features: ['Quick payment', 'Secure', 'Instant confirmation'],
      available: true,
    },
    {
      id: 'khalti' as const,
      name: 'Khalti',
      description: 'Wallet, cards, e-banking & more',
      icon: Wallet,
      color: 'from-purple-500 to-purple-700',
      features: ['Digital wallet', 'Cards accepted', 'Bank transfer'],
      available: true,
    },
    {
      id: 'fonepay' as const,
      name: 'Fonepay',
      description: 'Bank transfer & QR code',
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      features: ['All major banks', 'QR code', 'Secure transfer'],
      available: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Select Payment Method</DialogTitle>
          <DialogDescription className="text-base">
            Choose your preferred payment gateway to complete your support
          </DialogDescription>
        </DialogHeader>

        {/* Amount Display */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Amount</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                NPR {amount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tier Level</p>
              <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                Tier {tierLevel}
              </p>
            </div>
          </div>
        </div>

        {/* Gateway Options - Horizontal Layout */}
        <div className="flex gap-4 pb-2">
          {gateways.map((gateway) => {
            const Icon = gateway.icon;
            const isComingSoon = !gateway.available;
            
            return (
              <Card
                key={gateway.id}
                className={`relative overflow-hidden flex-1 transition-all duration-300 border-2 ${
                  isComingSoon 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'cursor-pointer group hover:shadow-lg hover:border-purple-400'
                }`}
                onClick={() => !isComingSoon && onSelectGateway(gateway.id as 'esewa' | 'khalti')}
              >
                {/* Coming Soon Badge */}
                {isComingSoon && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      Coming Soon
                    </span>
                  </div>
                )}

                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gateway.color} ${isComingSoon ? 'opacity-3' : 'opacity-5 group-hover:opacity-10'} transition-opacity`} />
                
                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gateway.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {gateway.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {gateway.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {gateway.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Select Button */}
                  {isComingSoon ? (
                    <Button
                      disabled
                      className="w-full mt-4 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    >
                      Coming Soon
                    </Button>
                  ) : (
                    <Button
                      className={`w-full mt-4 bg-gradient-to-r ${gateway.color} text-white hover:opacity-90 transition-opacity`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGateway(gateway.id as 'esewa' | 'khalti');
                      }}
                    >
                      Pay with {gateway.name}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Secure Payment
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                All payments are encrypted and processed securely. Your payment information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
