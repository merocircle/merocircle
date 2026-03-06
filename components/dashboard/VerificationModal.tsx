"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles, CheckCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId?: string;
}

export function VerificationModal({ isOpen, onClose, creatorId }: VerificationModalProps) {
  const handleBookCall = () => {
    // Open Calendly link in new tab
    window.open('https://calendly.com/shaswot-lamichhane-toolsforhumanity/30min', '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full p-0 overflow-hidden">
        <div className="p-6 sm:p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          </motion.div>

          <DialogHeader className="text-center mb-6">
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Almost There! 🎉
            </DialogTitle>
            <DialogDescription className="text-base sm:text-lg text-muted-foreground">
              Your creator profile has been set up successfully! There's just one final step to activate your account and start posting.
            </DialogDescription>
          </DialogHeader>

          {/* Final step info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 text-left"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Final Step: Account Verification
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schedule a quick 10-minute call with our team to complete your onboarding, verify your account, and get everything set up properly before you go live.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Button
              onClick={handleBookCall}
              className="w-full gap-2 text-sm sm:text-base"
              size="lg"
            >
              <Calendar className="w-4 h-4" />
              Book a Call
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full gap-2 text-sm sm:text-base"
              size="lg"
            >
              I'll Do This Later
            </Button>
          </motion.div>

          {/* Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground text-center mt-4"
          >
            You can always book this call later from your creator studio dashboard
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
