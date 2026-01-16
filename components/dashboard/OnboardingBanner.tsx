"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Check, X, ExternalLink, Sparkles } from 'lucide-react';

interface OnboardingBannerProps {
  onDismiss: () => void;
  creatorId: string;
}

export function OnboardingBanner({ onDismiss, creatorId }: OnboardingBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    setIsDismissing(true);

    try {
      // Update onboarding status in database
      const response = await fetch(`/api/creator/${creatorId}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });

      if (!response.ok) {
        throw new Error('Failed to update onboarding status');
      }

      // Animate out
      setIsVisible(false);
      setTimeout(() => {
        onDismiss();
      }, 300);
    } catch (error) {
      console.error('Failed to dismiss onboarding banner:', error);
      setIsDismissing(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200 dark:bg-purple-800 rounded-full blur-3xl opacity-20 -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-200 dark:bg-pink-800 rounded-full blur-3xl opacity-20 -ml-20 -mb-20" />

            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Complete Your Onboarding
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Book a quick 30-minute call with our team to get the most out of Creators Nepal. We'll help you set up your profile, understand the platform, and answer any questions you have.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://calendly.com/shaswot-lamichhane-toolsforhumanity/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book a Call
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      onClick={handleDismiss}
                      disabled={isDismissing}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      {isDismissing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Already Done
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => setIsVisible(false)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close banner"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
