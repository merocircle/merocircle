/**
 * Email Service Configuration
 * Central configuration for all email-related settings
 */

export const EMAIL_CONFIG = {
  // Sender information
  from: {
    name: 'MeroCircle',
    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'hello@merocircle.app',
  },

  // SMTP settings
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },

  // App URLs
  urls: {
    app: process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app',
    help: `${process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app'}/help`,
    settings: `${process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app'}/settings`,
  },

  // Batch sending settings
  batch: {
    size: 10, // Number of emails to send in parallel
    delay: 100, // Delay between batches (ms)
    maxRetries: 3, // Maximum retry attempts
  },

  // Rate limiting (per minute)
  rateLimit: {
    perMinute: 100,
  },

  // Email categories
  categories: {
    notification: 'notification',
    transactional: 'transactional',
    marketing: 'marketing',
  },
} as const;

// Email subject lines
export const EMAIL_SUBJECTS = {
  postNotification: (creatorName: string) => `${creatorName} shared an update`,
  pollNotification: (creatorName: string) => `${creatorName} wants your input`,
  welcome: (userName: string) => `Welcome to MeroCircle, ${userName}`,
  paymentSuccess: (creatorName: string) => `Payment confirmed - Supporting ${creatorName}`,
  paymentFailed: () => 'Payment issue - Action required',
} as const;

// Helper function to get full URL
export function getFullUrl(path: string): string {
  const baseUrl = EMAIL_CONFIG.urls.app;
  return path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Helper function to get creator profile URL
export function getCreatorProfileUrl(creatorUsername: string): string {
  return getFullUrl(`/${creatorUsername}`);
}
