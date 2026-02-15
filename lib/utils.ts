import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ne-NP', {
    style: 'currency',
    currency: 'NPR',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ne-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function slugifyDisplayName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Returns a valid image URL or undefined.
 * Prevents broken images by filtering out null, empty, and invalid URLs.
 */
export function getValidAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url || url.trim() === '') return undefined;
  // Filter out obviously broken placeholder paths
  if (url === '/undefined' || url === '/null' || url === 'null' || url === 'undefined') return undefined;
  return url;
}
 
