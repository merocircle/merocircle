'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';

/**
 * Placeholder for saved payment methods.
 * Saved methods (e.g. Dodo cards) can be listed here once the API is available.
 */
export default function PaymentMethods() {
  const [savedMethods] = useState<Array<{ id: string; label: string; last4?: string }>>([]);

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
        Payment Methods
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage saved payment methods for subscriptions and one-time support.
      </p>

      {savedMethods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 sm:p-8 text-center">
          <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-sm sm:text-base text-foreground">No saved payment methods</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Payment methods are stored securely with our payment provider. You can add one when you subscribe to a creator or make a payment.
          </p>
          <Button variant="outline" size="sm" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Add payment method
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {savedMethods.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-card"
            >
              <span className="font-medium">{m.label}</span>
              <Button variant="ghost" size="sm" className="text-destructive">
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
