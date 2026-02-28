import { logger } from '@/lib/logger';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_ENV === 'production') {
    if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes('-')) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'https://merocircle.app';
  }
  
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV === 'preview') {
    logger.warn('Using preview deployment URL', 'CONFIG', { hint: 'Set NEXT_PUBLIC_APP_URL for production' });
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // In local development, use localhost
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  
  // Production fallback
  return 'https://merocircle.app';
};

export const config = {
  app: {
    baseUrl: getBaseUrl(),
  },
  esewa: {
    merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    verificationUrl: process.env.ESEWA_VERIFICATION_URL || 'https://rc-epay.esewa.com.np/api/epay/transactions/status',
    testMode: process.env.ESEWA_TEST_MODE !== 'false',
  },
  dodo: {
    apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
    returnUrl: process.env.DODO_PAYMENTS_RETURN_URL || getBaseUrl(),
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test',
    testMode: process.env.DODO_PAYMENTS_ENVIRONMENT !== 'production',
  },
  upload: {
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    maxFileSize: 50 * 1024 * 1024, // 50MB - increased for high-resolution photos
  },
};

