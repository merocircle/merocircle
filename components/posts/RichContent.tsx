'use client';

import { useMemo, useState } from 'react';
import { detectEmbeds, removeEmbedUrls, type EmbedInfo } from '@/lib/embeds';
import { ExternalLink, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichContentProps {
  content: string | null | undefined;
  className?: string;
  truncateLength?: number;
  onClickExpand?: () => void;
  /** When true, render embeddable URLs as clickable links instead of iframes (e.g. when post has images) */
  linksOnly?: boolean;
}

/**
 * Renders text with:
 *  - Clickable hyperlinks (any URL)
 *  - Inline embeds for YouTube, Instagram, TikTok, Twitter, Spotify
 *  - linksOnly mode: shows embeddable URLs as styled links instead of iframes
 */
export function RichContent({ content, className, truncateLength = 280, onClickExpand, linksOnly = false }: RichContentProps) {
  const [showFull, setShowFull] = useState(false);

  const embeds = useMemo(() => detectEmbeds(content), [content]);
  const cleanedContent = useMemo(() => {
    if (!content) return '';
    return removeEmbedUrls(content, embeds);
  }, [content, embeds]);

  const shouldTruncate = cleanedContent.length > truncateLength && !showFull;
  const displayText = shouldTruncate
    ? cleanedContent.slice(0, truncateLength)
    : cleanedContent;

  if (!content) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Text with clickable links */}
      {displayText && (
        <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px] break-words overflow-wrap-anywhere">
          <LinkifyText text={displayText} />
          {shouldTruncate && (
            <>
              <span className="text-muted-foreground">...</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClickExpand) {
                    onClickExpand();
                  } else {
                    setShowFull(true);
                  }
                }}
                className="text-primary font-medium hover:underline ml-1 inline-flex items-center gap-0.5"
              >
                Show more
              </button>
            </>
          )}
          {showFull && cleanedContent.length > truncateLength && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowFull(false); }}
              className="text-primary font-medium hover:underline ml-1 inline-flex items-center gap-0.5"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Inline embeds or link cards */}
      {embeds.length > 0 && (
        <div className="space-y-2">
          {embeds.map((embed, idx) =>
            linksOnly ? (
              <EmbedLinkCard key={`${embed.type}-${idx}`} embed={embed} />
            ) : (
              <EmbedRenderer key={`${embed.type}-${idx}`} embed={embed} />
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Turns plain-text URLs into clickable <a> links. Preserves other text as-is.
 */
function LinkifyText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (urlRegex.test(part)) {
          // Reset lastIndex since we used global flag
          urlRegex.lastIndex = 0;
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline inline-flex items-center gap-0.5 break-all"
            >
              {truncateUrl(part)}
              <ExternalLink className="w-3 h-3 flex-shrink-0 inline" />
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function truncateUrl(url: string) {
  try {
    const u = new URL(url);
    const display = u.hostname + (u.pathname.length > 30 ? u.pathname.slice(0, 30) + '...' : u.pathname);
    return display.replace(/\/$/, '');
  } catch {
    return url.length > 60 ? url.slice(0, 57) + '...' : url;
  }
}

/**
 * Renders a platform-specific embed iframe.
 */
function EmbedRenderer({ embed }: { embed: EmbedInfo }) {
  const [loaded, setLoaded] = useState(false);
  const [showEmbed, setShowEmbed] = useState(embed.type === 'youtube'); // auto-show YouTube

  if (embed.type === 'youtube') {
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`${embed.embedUrl}?rel=0&modestbranding=1`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-lg"
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse rounded-lg">
              <Play className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (embed.type === 'instagram') {
    return (
      <div className="rounded-lg overflow-hidden border border-border/50">
        {!showEmbed ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowEmbed(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">IG</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Instagram Post</p>
              <p className="text-xs text-muted-foreground truncate">{embed.url}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ) : (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEmbed(false); }}
              className="w-full flex items-center justify-between px-4 py-2 bg-card border-b border-border/30 text-xs text-muted-foreground hover:bg-muted/50"
            >
              <span>Instagram Embed</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <iframe
              src={embed.embedUrl}
              title="Instagram post"
              className="w-full border-0"
              style={{ minHeight: 480 }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        )}
      </div>
    );
  }

  if (embed.type === 'tiktok') {
    return (
      <div className="rounded-lg overflow-hidden border border-border/50">
        {!showEmbed ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowEmbed(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">TT</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">TikTok Video</p>
              <p className="text-xs text-muted-foreground truncate">{embed.url}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ) : (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEmbed(false); }}
              className="w-full flex items-center justify-between px-4 py-2 bg-card border-b border-border/30 text-xs text-muted-foreground hover:bg-muted/50"
            >
              <span>TikTok Embed</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <iframe
              src={embed.embedUrl}
              title="TikTok video"
              className="w-full border-0"
              style={{ minHeight: 600 }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        )}
      </div>
    );
  }

  if (embed.type === 'twitter') {
    return (
      <div className="rounded-lg overflow-hidden border border-border/50">
        {!showEmbed ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowEmbed(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">X</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Post on X</p>
              <p className="text-xs text-muted-foreground truncate">{embed.url}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ) : (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEmbed(false); }}
              className="w-full flex items-center justify-between px-4 py-2 bg-card border-b border-border/30 text-xs text-muted-foreground hover:bg-muted/50"
            >
              <span>X/Twitter Embed</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <iframe
              src={embed.embedUrl}
              title="Tweet"
              className="w-full border-0"
              style={{ minHeight: 300 }}
              loading="lazy"
            />
          </div>
        )}
      </div>
    );
  }

  if (embed.type === 'spotify') {
    return (
      <div className="rounded-lg overflow-hidden">
        <iframe
          src={embed.embedUrl}
          title="Spotify"
          className="w-full rounded-lg"
          style={{ height: 152 }}
          allow="encrypted-media"
          loading="lazy"
        />
      </div>
    );
  }

  return null;
}

/**
 * Renders an embed as a compact clickable link card (used when post has images).
 */
function EmbedLinkCard({ embed }: { embed: EmbedInfo }) {
  const platformConfig: Record<string, { label: string; bg: string; icon: string }> = {
    youtube: { label: 'YouTube', bg: 'bg-red-500', icon: '▶' },
    instagram: { label: 'Instagram', bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', icon: 'IG' },
    tiktok: { label: 'TikTok', bg: 'bg-black', icon: 'TT' },
    twitter: { label: 'X / Twitter', bg: 'bg-black', icon: '𝕏' },
    spotify: { label: 'Spotify', bg: 'bg-green-600', icon: '♫' },
  };

  const config = platformConfig[embed.type] || { label: embed.type, bg: 'bg-muted', icon: '🔗' };

  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors group"
    >
      <div className={cn('w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-white text-xs font-bold', config.bg)}>
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{config.label}</p>
        <p className="text-xs text-muted-foreground truncate">{truncateUrl(embed.url)}</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
    </a>
  );
}
