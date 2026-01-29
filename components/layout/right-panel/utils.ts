/**
 * Formats a count number to a human-readable string
 * Examples: 1000 -> "1.0K", 1000000 -> "1.0M"
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}
