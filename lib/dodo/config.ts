/**
 * Dodo Payments Configuration
 * 
 * Dodo Payments provides subscription-based payment processing
 * with support for Visa/Mastercard through their API.
 * 
 * Documentation: https://docs.dodopayments.com
 */

import { logger } from '@/lib/logger';

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
// IMPORTANT: Prioritizes production domain over preview URLs to avoid SSO authentication issues
const getBaseUrl = (): string => {
  // First, check if explicitly set (highest priority - use this for production)
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
  
  // Use NEXT_PUBLIC_APP_URL if set (should be production domain)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In Vercel production, avoid preview URLs (they require SSO authentication)
  if (process.env.VERCEL_ENV === 'production') {
    // Only use VERCEL_URL if it's a production domain (no dashes in preview URLs)
    if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes('-')) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback to production domain
    return 'https://merocircle.app';
  }
  
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV === 'preview') {
    logger.warn('Using preview deployment URL for Dodo', 'DODO_CONFIG', {
      hint: 'Set DODO_PAYMENTS_RETURN_URL or NEXT_PUBLIC_APP_URL for production',
    });
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

export const dodoConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
  returnUrl: getBaseUrl(), // Base URL only (e.g., http://localhost:3000)
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test', // 'test' or 'production'
  apiUrl: getApiUrl(),
  testMode: process.env.DODO_PAYMENTS_ENVIRONMENT !== 'production',
};

if (!dodoConfig.apiKey && process.env.NODE_ENV === 'production') {
  logger.warn('DODO_PAYMENTS_API_KEY is not set', 'DODO_CONFIG');
}

if (!dodoConfig.webhookKey && process.env.NODE_ENV === 'production') {
  logger.warn('DODO_PAYMENTS_WEBHOOK_KEY is not set', 'DODO_CONFIG');
}

if (process.env.NODE_ENV === 'development') {
  (async () => {
    try {
      const { getExchangeRateInfo } = require('./exchange-rate');
      const exchangeInfo = await getExchangeRateInfo();
      logger.info('Dodo exchange rate loaded', 'DODO_CONFIG', {
        example: exchangeInfo.example,
        source: exchangeInfo.source,
        cached: exchangeInfo.cached,
      });
    } catch {
      logger.debug('Dodo exchange rate using default', 'DODO_CONFIG', { default: '100 NPR = 1 USD' });
    }
  })();
}
