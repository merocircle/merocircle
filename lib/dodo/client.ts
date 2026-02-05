/**
 * Dodo Payments API Client
 * 
 * Wrapper around Dodo Payments REST API for subscription management
 * Documentation: https://docs.dodopayments.com/developer-resources/api-reference
 */

import { logger } from '@/lib/logger';
import { dodoConfig } from './config';
import type {
  DodoSubscriptionParams,
  DodoSubscriptionResponse,
  DodoSubscriptionDetails,
  DodoCancelSubscriptionResponse,
  DodoProductParams,
  DodoProductResponse,
  DodoCheckoutSessionRequest,
  DodoCheckoutSessionResponse,
} from './types';

class DodoPaymentsClient {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = dodoConfig.apiKey;
    this.apiUrl = dodoConfig.apiUrl;
  }

  /**
   * Create a checkout session (recommended - replaces deprecated createSubscription)
   * This is the unified endpoint for all billing requirements including subscriptions
   */
  async createCheckoutSession(
    params: DodoCheckoutSessionRequest
  ): Promise<DodoCheckoutSessionResponse> {
    const url = `${this.apiUrl}/checkouts`;
    
    // Validate API key
    if (!this.apiKey || this.apiKey.trim() === '') {
      const error = new Error('DODO_PAYMENTS_API_KEY is not set or is empty');
      logger.error('Dodo API key missing', 'DODO_CLIENT', {
        error: error.message,
        apiUrl: url,
      });
      throw error;
    }

    try {
      logger.info('Creating Dodo checkout session', 'DODO_CLIENT', {
        url,
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey.length,
        productCount: params.product_cart.length,
        customerEmail: params.customer?.email,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
      });

      // Log response details
      logger.info('Dodo API response received', 'DODO_CLIENT', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          logger.warn('Failed to parse error response', 'DODO_CLIENT', {
            parseError: parseError instanceof Error ? parseError.message : 'Unknown',
          });
        }
        
        const errorMessage = errorData.message || errorData.error || `Dodo API error: ${response.status} ${response.statusText}`;
        logger.error('Dodo API returned error', 'DODO_CLIENT', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      logger.info('Dodo checkout session created', 'DODO_CLIENT', {
        sessionId: data.session_id,
        hasCheckoutUrl: !!data.checkout_url,
      });

      return data;
    } catch (error) {
      // Enhanced error logging
      const errorDetails: any = {
        error: error instanceof Error ? error.message : 'Unknown',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        url,
        hasApiKey: !!this.apiKey,
      };

      // Add more details for network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorDetails.networkError = true;
        errorDetails.cause = (error as any).cause?.message || 'Network request failed';
        errorDetails.suggestion = 'Check API URL, network connectivity, and SSL certificates';
      }

      logger.error('Failed to create Dodo checkout session', 'DODO_CLIENT', errorDetails);
      throw error;
    }
  }

  /**
   * Get checkout session status
   */
  async getCheckoutSession(sessionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiUrl}/checkouts/${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Dodo API error: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get Dodo checkout session', 'DODO_CLIENT', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Create a subscription and get payment URL
   * @deprecated Use createCheckoutSession instead
   */
  async createSubscription(
    params: DodoSubscriptionParams
  ): Promise<DodoSubscriptionResponse> {
    const url = `${this.apiUrl}/subscriptions`;
    
    // Validate API key
    if (!this.apiKey || this.apiKey.trim() === '') {
      const error = new Error('DODO_PAYMENTS_API_KEY is not set or is empty');
      logger.error('Dodo API key missing', 'DODO_CLIENT', {
        error: error.message,
        apiUrl: url,
      });
      throw error;
    }

    try {
      logger.info('Creating Dodo subscription', 'DODO_CLIENT', {
        url,
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey.length,
        customerEmail: params.customer.email,
        amount: params.amount,
        currency: params.currency,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
      });

      // Log response details
      logger.info('Dodo API response received', 'DODO_CLIENT', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          logger.warn('Failed to parse error response', 'DODO_CLIENT', {
            parseError: parseError instanceof Error ? parseError.message : 'Unknown',
          });
        }
        
        const errorMessage = errorData.message || errorData.error || `Dodo API error: ${response.status} ${response.statusText}`;
        logger.error('Dodo API returned error', 'DODO_CLIENT', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      logger.info('Dodo subscription created', 'DODO_CLIENT', {
        subscriptionId: data.subscription_id,
        customerId: data.customer_id,
        paymentUrl: data.payment_url,
      });

      return data;
    } catch (error) {
      // Enhanced error logging
      const errorDetails: any = {
        error: error instanceof Error ? error.message : 'Unknown',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        url,
        hasApiKey: !!this.apiKey,
      };

      // Add more details for network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorDetails.networkError = true;
        errorDetails.cause = (error as any).cause?.message || 'Network request failed';
        errorDetails.suggestion = 'Check API URL, network connectivity, and SSL certificates';
      }

      logger.error('Failed to create Dodo subscription', 'DODO_CLIENT', errorDetails);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    subscriptionId: string
  ): Promise<DodoSubscriptionDetails> {
    try {
      const response = await fetch(
        `${this.apiUrl}/subscriptions/${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Dodo API error: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get Dodo subscription', 'DODO_CLIENT', {
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<DodoCancelSubscriptionResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Dodo API error: ${response.status}`
        );
      }

      const data = await response.json();
      
      logger.info('Dodo subscription cancelled', 'DODO_CLIENT', {
        subscriptionId,
      });

      return data;
    } catch (error) {
      logger.error('Failed to cancel Dodo subscription', 'DODO_CLIENT', {
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Create a product in Dodo Payments
   * Products must exist before creating subscriptions
   */
  async createProduct(
    params: DodoProductParams
  ): Promise<DodoProductResponse> {
    const url = `${this.apiUrl}/products`;
    
    // Validate API key
    if (!this.apiKey || this.apiKey.trim() === '') {
      const error = new Error('DODO_PAYMENTS_API_KEY is not set or is empty');
      logger.error('Dodo API key missing', 'DODO_CLIENT', {
        error: error.message,
        apiUrl: url,
      });
      throw error;
    }

    try {
      logger.info('Creating Dodo product', 'DODO_CLIENT', {
        url,
        productName: params.name,
        amount: params.price.price,
        currency: params.price.currency,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          // Ignore parse errors
        }
        
        const errorMessage = errorData.message || errorData.error || `Dodo API error: ${response.status} ${response.statusText}`;
        logger.error('Dodo API returned error', 'DODO_CLIENT', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      logger.info('Dodo product created', 'DODO_CLIENT', {
        productId: data.product_id,
        productName: data.name,
      });

      return data;
    } catch (error) {
      logger.error('Failed to create Dodo product', 'DODO_CLIENT', {
        error: error instanceof Error ? error.message : 'Unknown',
        url,
      });
      throw error;
    }
  }

  /**
   * Get a product by ID
   */
  async getProduct(productId: string): Promise<DodoProductResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/products/${productId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          // Ignore parse errors
        }
        
        const errorMessage = errorData.message || errorData.error || `Dodo API error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        // Add status code to error for easier checking
        (error as any).status = response.status;
        (error as any).statusCode = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get Dodo product', 'DODO_CLIENT', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown',
        status: (error as any)?.status || (error as any)?.statusCode,
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', dodoConfig.webhookKey)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Failed to verify Dodo webhook signature', 'DODO_CLIENT', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }
}

// Export singleton instance
export const dodoClient = new DodoPaymentsClient();
