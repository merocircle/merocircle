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
  /** Creator object containing vanity_username fallback */
  creator?: {
    id: string;
    vanity_username?: string | null;
  };
}

export function ShareModal({
  open,
  onClose,
  postId,
  postTitle,
  postContent,
  creatorSlug,
  creatorId,
  creator,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Copy vanity URL when possible: /creator/slug?post=id
  // Use creatorSlug first, then fallback to creator.vanity_username, then creatorId
  console.log('URL DEBUG:', { 
    creatorSlug, 
    creatorVanity: creator?.vanity_username, 
    creatorId,
    finalIdentifier: creatorSlug || creator?.vanity_username || creatorId 
  });
  const creatorIdentifier = creatorSlug || creator?.vanity_username || creatorId;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/creator/${creatorIdentifier}?post=${postId}`
    : '';

  const safeContent = postContent || '';
  const shareText = `${postTitle || ''}\n\n${safeContent.substring(0, 100)}${safeContent.length > 100 ? '...' : ''}`;

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
    const shareText = `Check out this post on Mero Circle: ${postTitle}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(postTitle);

    let shareLink = '';

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`;
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
      <DialogContent className="sm:max-w-md border-border/60 shadow-xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Share2 className="w-4 h-4 text-primary" />
            </div>
            Share this post
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Share with your friends and followers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Native Share Button */}
          {typeof window !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              size="default"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </Button>
          )}

          {/* Social Media Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Or share on</h3>
            <div className="flex gap-2 flex-wrap">
              {platforms.slice(0, 4).map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformShare(platform.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                      'transition-colors hover:opacity-80',
                      'border border-border/60 bg-muted/30 hover:bg-muted/50',
                      platform.color.replace('from-', 'text-').replace(' to-', '')
                    )}
                    title={platform.name}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{platform.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Copy link</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 bg-muted/50 border border-border/40 rounded-md text-sm font-mono break-all">
                {shareUrl}
              </div>
              <Button
                onClick={handleCopyLink}
                variant={copied ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'transition-colors',
                  copied && 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
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
