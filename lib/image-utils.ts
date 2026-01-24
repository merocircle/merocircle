/**
 * Image optimization utilities
 * Provides blur placeholders and shimmer effects for better perceived performance
 */

/**
 * Generates a simple blur data URL for Next.js Image placeholder
 * This is a base64-encoded 10x10 gray gradient that serves as a blur placeholder
 *
 * @returns Base64 data URL for blur placeholder
 */
export function getBlurDataURL(): string {
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAbEAADAAMBAQAAAAAAAAAAAAAAAQIDERIhE//EABUBAQEAAAAAAAAAAAAAAAAAAAME/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/AJUAO5AAAH//2Q==';
}

/**
 * Generates a shimmer effect SVG for loading state
 * Creates an animated gradient that moves from left to right
 *
 * @param width - Width of the shimmer
 * @param height - Height of the shimmer
 * @returns Base64 data URL with shimmer effect
 */
export function getShimmerDataURL(width: number = 700, height: number = 475): string {
  const shimmer = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%" />
          <stop stop-color="#edeef1" offset="20%" />
          <stop stop-color="#f6f7f8" offset="40%" />
          <stop stop-color="#f6f7f8" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#f6f7f8" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`;
}

/**
 * Optimized sizes attribute for responsive images
 * Tells the browser which image size to load based on viewport
 */
export const imageSizes = {
  avatar: '(max-width: 96px) 100vw, 96px',
  thumbnail: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 384px',
  post: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 672px',
  cover: '(max-width: 768px) 100vw, 100vw',
  full: '100vw',
};

/**
 * Priority loading strategy
 * Determines which images should load with priority
 */
export function shouldPrioritizeImage(index: number, isFold: boolean = false): boolean {
  // Prioritize first 2 images or images above the fold
  return index < 2 || isFold;
}
