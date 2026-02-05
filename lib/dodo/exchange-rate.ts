/**
 * Exchange Rate Utilities for Dodo Payments
 * 
 * Converts NPR (Nepalese Rupees) to USD for Dodo Payments API
 * Dodo Payments requires USD, but our database stores amounts in NPR
 * 
 * Uses ExchangeRate-API (https://www.exchangerate-api.com/) for real-time rates
 * Free tier: 1,500 requests/month (no API key required)
 * Alternative: exchangerate.host (completely free, unlimited)
 */

import { logger } from '@/lib/logger';

// Cache for exchange rate (to avoid hitting API limits)
let exchangeRateCache: {
  rate: number;
  timestamp: number;
} | null = null;

// Cache duration: 1 hour (3600000 ms)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Fetch NPR to USD exchange rate from external API
 * 
 * Uses exchangerate.host (free, unlimited) or ExchangeRate-API (with key)
 * Fallback to default rate if API fails
 * 
 * @returns Exchange rate (NPR per USD, e.g., 100 means 100 NPR = 1 USD)
 */
async function fetchExchangeRate(): Promise<number> {
  // Check cache first
  if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    logger.info('Using cached exchange rate', 'DODO_EXCHANGE', {
      rate: exchangeRateCache.rate,
      cached: true,
    });
    return exchangeRateCache.rate;
  }

  const envRate = process.env.DODO_PAYMENTS_EXCHANGE_RATE;
  if (envRate) {
    const rate = parseFloat(envRate);
    if (!isNaN(rate) && rate > 0) {
      logger.info('Using custom exchange rate from environment', 'DODO_EXCHANGE', { rate });
      exchangeRateCache = { rate, timestamp: Date.now() };
      return rate;
    }
    logger.warn('Invalid exchange rate in environment, fetching from API', 'DODO_EXCHANGE', {
      provided: envRate,
    });
  }

  try {
    // ExchangeRate-API v4 - free tier, no API key needed
    const apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    
    logger.info('Fetching exchange rate from API', 'DODO_EXCHANGE', {
      apiUrl: 'ExchangeRate-API (free)',
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const rate = data.rates?.NPR;
    
    if (!rate || isNaN(rate) || rate <= 0) {
      throw new Error('Invalid rate received from API');
    }

    // Cache the rate
    exchangeRateCache = { rate, timestamp: Date.now() };

    logger.info('Exchange rate fetched successfully', 'DODO_EXCHANGE', {
      rate: rate.toFixed(2),
      source: 'API (ExchangeRate-API)',
      nprPerUsd: rate.toFixed(2),
      date: data.date || 'unknown',
    });

    return rate;
  } catch (error) {
    logger.warn('Failed to fetch exchange rate from API, using default', 'DODO_EXCHANGE', {
      error: error instanceof Error ? error.message : 'Unknown',
      fallback: 'default rate (100 NPR = 1 USD)',
    });

    // Fallback to default rate: 100 NPR = 1 USD
    const defaultRate = 100;
    exchangeRateCache = { rate: defaultRate, timestamp: Date.now() };
    return defaultRate;
  }
}

/**
 * Get NPR to USD exchange rate
 * 
 * Fetches from external API with caching
 * Falls back to default if API fails
 * 
 * @returns Exchange rate (NPR per USD, e.g., 100 means 100 NPR = 1 USD)
 */
export async function getExchangeRate(): Promise<number> {
  return await fetchExchangeRate();
}

/**
 * Get NPR to USD exchange rate (synchronous version with cached/default rate)
 * 
 * Use this for synchronous operations where async is not possible
 * Returns cached rate or default if not cached
 * 
 * @returns Exchange rate (NPR per USD)
 */
export function getExchangeRateSync(): number {
  // Return cached rate if available
  if (exchangeRateCache) {
    return exchangeRateCache.rate;
  }

  // Check environment variable
  const envRate = process.env.DODO_PAYMENTS_EXCHANGE_RATE;
  if (envRate) {
    const rate = parseFloat(envRate);
    if (!isNaN(rate) && rate > 0) {
      return rate;
    }
  }

  // Default fallback
  return 100;
}

/**
 * Convert NPR amount to USD (async - uses API)
 * 
 * @param nprAmount Amount in Nepalese Rupees
 * @returns Amount in USD (rounded to 2 decimal places)
 */
export async function convertNprToUsd(nprAmount: number): Promise<number> {
  const exchangeRate = await getExchangeRate();
  const usdAmount = nprAmount / exchangeRate;
  
  // Round to 2 decimal places
  return Math.round(usdAmount * 100) / 100;
}

/**
 * Convert NPR amount to USD (synchronous - uses cached/default rate)
 * 
 * @param nprAmount Amount in Nepalese Rupees
 * @returns Amount in USD (rounded to 2 decimal places)
 */
export function convertNprToUsdSync(nprAmount: number): number {
  const exchangeRate = getExchangeRateSync();
  const usdAmount = nprAmount / exchangeRate;
  
  // Round to 2 decimal places
  return Math.round(usdAmount * 100) / 100;
}

/**
 * Convert USD amount to NPR
 * 
 * @param usdAmount Amount in USD
 * @returns Amount in Nepalese Rupees (rounded to 2 decimal places)
 */
export async function convertUsdToNpr(usdAmount: number): Promise<number> {
  const exchangeRate = await getExchangeRate();
  const nprAmount = usdAmount * exchangeRate;
  
  // Round to 2 decimal places
  return Math.round(nprAmount * 100) / 100;
}

/**
 * Convert NPR amount to USD cents (for Dodo Payments API) - async
 * 
 * Dodo Payments requires amounts in the smallest currency unit (cents for USD)
 * 
 * @param nprAmount Amount in Nepalese Rupees
 * @returns Amount in USD cents (integer)
 */
export async function convertNprToUsdCents(nprAmount: number): Promise<number> {
  const usdAmount = await convertNprToUsd(nprAmount);
  // Convert to cents and round to integer
  return Math.round(usdAmount * 100);
}

/**
 * Convert NPR amount to USD cents (synchronous - uses cached/default rate)
 * 
 * @param nprAmount Amount in Nepalese Rupees
 * @returns Amount in USD cents (integer)
 */
export function convertNprToUsdCentsSync(nprAmount: number): number {
  const usdAmount = convertNprToUsdSync(nprAmount);
  // Convert to cents and round to integer
  return Math.round(usdAmount * 100);
}

/**
 * Get exchange rate information for logging
 */
export async function getExchangeRateInfo(): Promise<{
  rate: number;
  source: 'api' | 'environment' | 'cache' | 'default';
  example: string;
  cached: boolean;
}> {
  const rate = await getExchangeRate();
  let source: 'api' | 'environment' | 'cache' | 'default' = 'default';
  let cached = false;

  if (process.env.DODO_PAYMENTS_EXCHANGE_RATE) {
    source = 'environment';
  } else if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    source = 'cache';
    cached = true;
  } else {
    source = 'api';
  }

  const example = `NPR ${rate.toFixed(2)} = USD 1.00`;
  
  return { rate, source, example, cached };
}
