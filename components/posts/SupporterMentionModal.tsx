'use client';

import { useEffect, useState } from 'react';
import { Calendar, Heart, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SupporterProfile {
  display_name: string;
  photo_url: string | null;
  joined_at: string | null;
}

interface SupporterMentionModalProps {
  /** Display name stored in the mention token — used as the lookup key */
  displayName: string;
  /** Creator whose supporters list is searched */
  creatorId: string;
  open: boolean;
  onClose: () => void;
}

function formatJoinedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Small modal that appears when a viewer clicks on a @mention in a post.
 * Looks up the supporter by display name + creator — no user ID exposed.
 */
export function SupporterMentionModal({
  displayName,
  creatorId,
  open,
  onClose,
}: SupporterMentionModalProps) {
  const [profile, setProfile] = useState<SupporterProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !displayName || !creatorId) return;

    setLoading(true);
    setProfile(null);

    const params = new URLSearchParams({ displayName, creatorId });
    fetch(`/api/supporter-profile?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, displayName, creatorId]);

  const name = profile?.display_name || displayName;
  const photo = profile?.photo_url;
  const initial = name[0]?.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[300px] p-0 overflow-hidden rounded-2xl gap-0 border-border/60">
        {/* Gradient header band */}
        <div className="h-16 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-pink-500/20" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-muted transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5 text-foreground/70" />
        </button>

        {/* Content */}
        <div className="relative px-5 pb-5">
          {/* Avatar — overlaps the gradient band */}
          <div className="absolute -top-8 left-5">
            <div className="w-16 h-16 rounded-full border-[3px] border-background overflow-hidden bg-muted shadow-md">
              {loading ? (
                <div className="w-full h-full animate-pulse bg-muted" />
              ) : photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-foreground text-xl font-bold">
                  {initial}
                </div>
              )}
            </div>
          </div>

          {/* Text info */}
          <div className="pt-10">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-5 w-36 bg-muted rounded-md" />
                <div className="h-3.5 w-24 bg-muted rounded-md" />
                <div className="h-3.5 w-44 bg-muted rounded-md" />
              </div>
            ) : (
              <>
                <h3 className="text-base font-semibold text-foreground leading-tight">{name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                  <span className="text-xs font-medium text-pink-500">Supporter</span>
                </div>
                {profile?.joined_at && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Joined {formatJoinedDate(profile.joined_at)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
