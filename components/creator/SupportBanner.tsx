'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportBannerProps {
  creatorName: string;
  creatorAvatar?: string;
  supporterCount: number;
  onJoinClick: () => void;
  show: boolean;
}

export function SupportBanner({
  creatorName,
  creatorAvatar,
  supporterCount,
  onJoinClick,
  show,
}: SupportBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissedUntil = localStorage.getItem(`support-banner-dismissed`);
    if (dismissedUntil) {
      const expiryTime = parseInt(dismissedUntil, 10);
      if (Date.now() < expiryTime) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(`support-banner-dismissed`);
      }
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    // Dismiss for 24 hours
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(`support-banner-dismissed`, expiryTime.toString());
  };

  const shouldShow = show && !isDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed left-0 right-0 z-40 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0"
        >
          <div
            className={cn(
              'bg-gradient-to-t from-background via-background/98 to-background/90 backdrop-blur-md border-t border-border shadow-2xl',
              'cursor-pointer transition-colors'
            )}
            onClick={onJoinClick}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Creator info */}
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/30 shadow-lg">
                    <AvatarImage src={creatorAvatar} alt={creatorName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white font-semibold text-lg">
                      {creatorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground truncate">
                      Join {creatorName}&apos;s Circle
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="truncate">Get exclusive content, chat, and a real connection</span>
                      {supporterCount > 0 && (
                        <>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5" />
                            {supporterCount} in the circle
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinClick();
                    }}
                    size="lg"
                    className="gap-2 rounded-full shadow-lg shadow-primary/25 px-8 h-12 text-base font-semibold flex-1 sm:flex-initial"
                  >
                    <Sparkles className="w-5 h-5" />
                    Join Circle
                  </Button>
                  
                  <button
                    onClick={handleDismiss}
                    className="p-2.5 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
