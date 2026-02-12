'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  MessageCircle, 
  Twitter, 
  Link as LinkIcon, 
  Check,
  Share2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  postContent: string;
  /** Vanity slug for /creator/[slug]; when set, share URL uses /creator/slug?post=... */
  creatorSlug?: string;
  creatorId: string;
}

export function ShareModal({
  open,
  onClose,
  postId,
  postTitle,
  postContent,
  creatorSlug,
  creatorId,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Copy vanity URL when possible: /creator/slug?post=id
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/creator/${creatorSlug || creatorId}?post=${postId}`
    : '';

  const shareText = `${postTitle}\n\n${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handlePlatformShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(postTitle);

    let shareLink = '';

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedTitle}%0A%0A${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, copy link instead
        handleCopyLink();
        return;
      case 'youtube':
        // YouTube doesn't support direct sharing, copy link instead
        handleCopyLink();
        return;
      default:
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      onClose();
    }
  };

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: Twitter,
      color: 'from-sky-500 to-sky-600',
      hoverColor: 'hover:from-sky-600 hover:to-sky-700',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-pink-500 via-purple-500 to-orange-500',
      hoverColor: 'hover:from-pink-600 hover:via-purple-600 hover:to-orange-600',
      note: 'Copy link to share',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'from-red-600 to-red-700',
      hoverColor: 'hover:from-red-700 hover:to-red-800',
      note: 'Copy link to share',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary to-pink-500">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            Share Post
          </DialogTitle>
          <DialogDescription>
            Share this post with your friends and followers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Native Share Button */}
          {typeof window !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </Button>
          )}

          {/* Platform Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-3">Share on Social Media</h3>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <motion.button
                    key={platform.id}
                    onClick={() => handlePlatformShare(platform.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-5 rounded-xl',
                      'bg-gradient-to-br text-white transition-all',
                      'shadow-md hover:shadow-lg min-h-[100px]',
                      platform.color,
                      platform.hoverColor
                    )}
                  >
                    <Icon className="w-7 h-7" />
                    <span className="text-xs font-semibold">{platform.name}</span>
                    {platform.note && (
                      <span className="text-[10px] opacity-90 mt-1">{platform.note}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Copy Link</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-muted rounded-lg text-sm break-all">
                {shareUrl}
              </div>
              <Button
                onClick={handleCopyLink}
                variant={copied ? 'default' : 'outline'}
                size="default"
                className={cn(
                  'transition-all whitespace-nowrap',
                  copied && 'bg-green-500 hover:bg-green-600 text-white'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
