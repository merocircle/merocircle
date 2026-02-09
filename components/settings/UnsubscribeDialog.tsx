'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface UnsubscribeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (feedback?: string) => Promise<void>;
  subscription: {
    creatorName: string;
    tierName: string;
    amount: number;
    currency: string;
  };
}

export function UnsubscribeDialog({
  open,
  onClose,
  onConfirm,
  subscription,
}: UnsubscribeDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(feedback || undefined);
      setFeedback(''); // Reset feedback after successful unsubscribe
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (!isConfirming) {
      setFeedback('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <DialogTitle className="text-xl">Confirm Unsubscribe</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Are you sure you want to unsubscribe from <strong>{subscription.creatorName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subscription Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tier:</span>
              <span className="font-medium">{subscription.tierName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium">
                {subscription.currency} {subscription.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
              You will lose access to:
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 ml-4 list-disc">
              <li>Exclusive posts and content</li>
              <li>Community chat access</li>
              <li>Special perks from the creator</li>
            </ul>
          </div>

          {/* Optional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm">
              Reason for unsubscribing (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Help us improve by sharing why you're unsubscribing..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              disabled={isConfirming}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Unsubscribing...' : 'Yes, Unsubscribe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
