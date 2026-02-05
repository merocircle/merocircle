/**
 * Dodo Payments Configuration
 * 
 * Dodo Payments provides subscription-based payment processing
 * with support for Visa/Mastercard through their API.
 * 
 * Documentation: https://docs.dodopayments.com
 */

// Determine API URL based on environment
// According to Dodo Payments docs: https://docs.dodopayments.com/api-reference/introduction
// Test Mode: https://test.dodopayments.com
// Live Mode: https://live.dodopayments.com
const getApiUrl = (): string => {
  // If explicitly set, use it
  if (process.env.DODO_API_URL) {
    return process.env.DODO_API_URL;
  }
  
  // Use environment-based URLs
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT || 'test';
  if (environment === 'production') {
    return 'https://live.dodopayments.com';
  }
  // Test environment
  return 'https://test.dodopayments.com';
};

// Get base URL (matching the pattern from lib/config.ts)
// Handles both localhost (development) and Vercel (production)
const getBaseUrl = (): string => {
  if (process.env.DODO_PAYMENTS_RETURN_URL) {
    const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL;
    try {
      const url = new URL(returnUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `http://${url.host}`;
      }
      return `${url.protocol}//${url.host}`;
    } catch {
      const match = returnUrl.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        const baseUrl = match[1];
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
          return baseUrl.replace('https://', 'http://');
        }
        return baseUrl;
      }
    }
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  
  return 'http://localhost:3000';
};

export const dodoConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
  returnUrl: getBaseUrl(), // Base URL only (e.g., http://localhost:3000)
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test', // 'test' or 'production'
  apiUrl: getApiUrl(),
  testMode: process.env.DODO_PAYMENTS_ENVIRONMENT !== 'production',
};

// Validate configuration
if (!dodoConfig.apiKey && process.env.NODE_ENV === 'production') {
  console.warn('DODO_PAYMENTS_API_KEY is not set. Dodo Payments will not work.');
}

if (!dodoConfig.webhookKey && process.env.NODE_ENV === 'production') {
  console.warn('DODO_PAYMENTS_WEBHOOK_KEY is not set. Webhook verification will fail.');
}

// Log exchange rate info on startup (development only)
if (process.env.NODE_ENV === 'development') {
  // Async initialization - don't block startup
  (async () => {
    try {
      const { getExchangeRateInfo } = require('./exchange-rate');
      const exchangeInfo = await getExchangeRateInfo();
      console.log(`[Dodo Payments] Exchange Rate: ${exchangeInfo.example} (${exchangeInfo.source}${exchangeInfo.cached ? ', cached' : ''})`);
      console.log(`[Dodo Payments] Set DODO_PAYMENTS_EXCHANGE_RATE to override, or EXCHANGE_RATE_API_KEY for more API requests`);
    } catch (error) {
      console.log(`[Dodo Payments] Exchange Rate: Using default (100 NPR = 1 USD)`);
    }
  })();
}
