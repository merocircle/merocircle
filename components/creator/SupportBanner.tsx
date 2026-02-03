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
          className="fixed bottom-0 left-0 right-0 z-40"
        >
          <div
            className={cn(
              'bg-background/95 backdrop-blur-md border-t border-border shadow-2xl',
              'cursor-pointer hover:bg-background/98 transition-colors'
            )}
            onClick={onJoinClick}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left side - Creator info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={creatorAvatar} alt={creatorName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white font-semibold">
                      {creatorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      Support {creatorName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="truncate">Unlock exclusive content and benefits</span>
                      {supporterCount > 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {supporterCount} supporters
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - CTA */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinClick();
                    }}
                    className="gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Join Now</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                  
                  <button
                    onClick={handleDismiss}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
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
