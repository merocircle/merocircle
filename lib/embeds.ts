/**
 * Embed detection and URL utilities for YouTube, Instagram, TikTok, Twitter/X, Facebook, etc.
 */

export interface EmbedInfo {
  type: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'spotify';
  url: string;         // original URL
  embedUrl: string;    // iframe-safe embed URL
  id?: string;         // platform-specific ID
}

// ── YouTube ──
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\s#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

// ── Instagram ──
function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m?.[1] || null;
}

// ── TikTok ──
function extractTikTokUrl(url: string): string | null {
  const m = url.match(/(https?:\/\/(?:www\.)?tiktok\.com\/@[^/]+\/video\/\d+)/);
  if (m?.[1]) return m[1];
  // Also support short URLs
  const m2 = url.match(/(https?:\/\/(?:vm\.)?tiktok\.com\/[A-Za-z0-9]+)/);
  return m2?.[1] || null;
}

// ── Twitter / X ──
function extractTwitterId(url: string): string | null {
  const m = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return m?.[1] || null;
}

// ── Spotify ──
function extractSpotifyEmbed(url: string): string | null {
  // e.g. https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
  const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
  return null;
}

/**
 * Detect embeddable URLs in text content and return embed info for each.
 */
export function detectEmbeds(text: string | null | undefined): EmbedInfo[] {
  if (!text) return [];
  const results: EmbedInfo[] = [];
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const urls = text.match(urlRegex) || [];

  for (const url of urls) {
    // YouTube
    const ytId = extractYouTubeId(url);
    if (ytId) {
      results.push({ type: 'youtube', url, embedUrl: `https://www.youtube.com/embed/${ytId}`, id: ytId });
      continue;
    }

    // Instagram
    const igId = extractInstagramId(url);
    if (igId) {
      results.push({ type: 'instagram', url, embedUrl: `https://www.instagram.com/p/${igId}/embed`, id: igId });
      continue;
    }

    // TikTok
    const ttUrl = extractTikTokUrl(url);
    if (ttUrl) {
      results.push({ type: 'tiktok', url, embedUrl: `https://www.tiktok.com/embed/v2/${ttUrl.split('/video/')[1] || ''}`, id: ttUrl });
      continue;
    }

    // Twitter / X
    const twId = extractTwitterId(url);
    if (twId) {
      results.push({ type: 'twitter', url, embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${twId}`, id: twId });
      continue;
    }

    // Spotify
    const spEmbed = extractSpotifyEmbed(url);
    if (spEmbed) {
      results.push({ type: 'spotify', url, embedUrl: spEmbed });
      continue;
    }
  }

  return results;
}

/**
 * Remove embed URLs from text so they're not duplicated as plain links.
 */
export function removeEmbedUrls(text: string, embeds: EmbedInfo[]): string {
  let cleaned = text;
  for (const embed of embeds) {
    cleaned = cleaned.replace(embed.url, '');
  }
  return cleaned.trim();
}
