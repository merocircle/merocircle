/**
 * YouTube URL detection and embed utilities
 */

// Extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  // Match patterns:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Detect YouTube URLs in text content
export function detectYouTubeUrl(text: string): string | null {
  const urlPattern = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/gi;
  const matches = text.match(urlPattern);

  if (matches && matches.length > 0) {
    // Return the first YouTube URL found
    return matches[0];
  }

  return null;
}

// Get YouTube embed URL from video ID
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

// Extract video ID from text content
export function extractVideoIdFromContent(content: string): string | null {
  const url = detectYouTubeUrl(content);
  if (!url) return null;

  return extractYouTubeVideoId(url);
}
