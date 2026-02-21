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
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden">
        {isVerifying ? (
          <div className="flex items-center justify-center p-4 sm:p-8">
            <div className="w-16 h-16 bg-primary animate-[morph_2s_ease-in-out_infinite] rounded-[6%]" />
          </div>
        ) : (
          <>
            {showAnimation && <BalloonBurst />}
            <div className="p-4 sm:p-8 text-center">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  </div>
                </div>

                <DialogHeader className="text-center">
                  <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 sm:mb-4 text-center">
                    Congratulations! 🎉
                  </DialogTitle>
                  <DialogDescription className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 text-center">
                    You have successfully supported <span className="font-semibold text-foreground">{creatorName}</span>!
                  </DialogDescription>
                </DialogHeader>

                {transaction && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <p className="text-primary text-xs sm:text-sm mb-1 font-medium">Amount Paid via {gateway}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">NPR {transaction.amount}</p>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                  <Button 
                    onClick={onViewPosts}
                    className="w-full gap-2 text-sm sm:text-base"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    View Posts by {creatorName}
                  </Button>
                  
                  <Button 
                    onClick={onViewChat}
                    variant="outline"
                    className="w-full gap-2 text-sm sm:text-base"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Open Chat
                  </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
