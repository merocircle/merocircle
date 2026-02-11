'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { CheckCircle, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { BalloonBurst } from '@/components/animations/BalloonBurst';
interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  onViewPosts: () => void;
  onViewChat: () => void;
  transactionUuid: string;
  totalAmount: number;
  gateway?: string;
  creatorName?: string;
}

export const PaymentSuccessModal = ({
  open,
  onClose,
  onViewPosts,
  onViewChat,
  transactionUuid,
  totalAmount,
  gateway = 'direct',
  creatorName = "",
}: PaymentSuccessModalProps) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [transaction, setTransaction] = useState<{ id?: string; amount?: number; status?: string; created_at?: string } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // For direct payments, mark as verified immediately
        setVerified(true);
        setTransaction({
          id: transactionUuid,
          amount: totalAmount,
          status: 'completed',
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[SUCCESS] Verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    if (open) {
      verifyPayment();
    }
  }, [open, transactionUuid, totalAmount]);

  useEffect(() => {
    if (verified && !showAnimation) {
      setShowAnimation(true);
    }
  }, [verified, showAnimation]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {isVerifying ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-16 h-16 bg-primary animate-[morph_2s_ease-in-out_infinite] rounded-[6%]" />
          </div>
        ) : (
          <>
            {showAnimation && <BalloonBurst />}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
              <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                </div>

                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Congratulations! 🎉
                  </DialogTitle>
                  <DialogDescription className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                    You have successfully supported <span className="font-semibold">{creatorName}</span>!
                  </DialogDescription>
                </DialogHeader>

                {transaction && (
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 mb-6">
                    <p className="text-green-100 text-sm mb-1">Amount Paid via {gateway}</p>
                    <p className="text-3xl font-bold">NPR {transaction.amount}</p>
                  </div>
                )}

                <div className="space-y-3 mt-6">
                  <Button 
                    onClick={onViewPosts}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    View Posts by {creatorName}
                  </Button>
                  
                  <Button 
                    onClick={onViewChat}
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Open Chat
                  </Button>
              </div>

              </Card>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
