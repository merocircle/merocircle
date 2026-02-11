// Determine base URL based on environment
const getBaseUrl = () => {
  // First, check if explicitly set (highest priority - use this for production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In Vercel production, prefer production domain over preview URLs
  // VERCEL_ENV can be: 'production', 'preview', or 'development'
  if (process.env.VERCEL_ENV === 'production') {
    // In production, try to use a production domain
    // If VERCEL_URL is a preview URL (contains project name), use fallback
    if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes('-')) {
      // VERCEL_URL without dashes is likely a production domain
      return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback to production domain
    return 'https://merocircle.app';
  }
  
  // For preview deployments, use VERCEL_URL (but this should not be used for payment redirects)
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV === 'preview') {
    // Only use preview URL if explicitly allowed (not recommended for production payments)
    console.warn('[Config] Using preview deployment URL - set NEXT_PUBLIC_APP_URL for production');
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

