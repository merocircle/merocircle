/**
 * Dodo Payments TypeScript Types
 * 
 * Based on Dodo Payments API documentation
 * https://docs.dodopayments.com/developer-resources/api-reference
 */

export interface DodoCustomer {
  /** Customer email */
  email: string;
  /** Customer name */
  name: string;
}

export interface DodoBilling {
  /** Billing interval */
  interval: 'monthly' | 'yearly';
  /** Country code (ISO 3166-1 alpha-2, e.g., 'US' for United States) */
  country: string;
}

/** @deprecated Use checkout sessions instead */
export interface DodoSubscriptionParams {
  /** Customer object with email and name */
  customer: DodoCustomer;
  /** Product/Plan ID from Dodo */
  product_id: string;
  /** Quantity of the product (required) */
  quantity: number;
  /** Price amount in smallest currency unit (e.g., cents for USD, paisa for NPR) */
  amount: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Billing configuration (required) */
  billing: DodoBilling;
  /** Success redirect URL */
  success_url: string;
  /** Cancel redirect URL */
  cancel_url: string;
  /** Metadata for tracking - all values must be strings */
  metadata?: Record<string, string>;
}

export interface DodoCheckoutSessionRequest {
  /** Product cart - array of products to purchase */
  product_cart: Array<{
    product_id: string;
    quantity: number;
    addons?: Array<{
      addon_id: string;
      quantity: number;
    }>;
    amount?: number; // Only for pay_what_you_want products
  }>;
  /** Customer details (optional - can be collected during checkout) */
  customer?: {
    email: string;
    name?: string;
    phone_number?: string;
  };
  /** Return URL after payment success/failure */
  return_url?: string;
  /** Metadata for tracking - all values must be strings */
  metadata?: Record<string, string>;
  /** Subscription data (for subscription products) */
  subscription_data?: {
    trial_period_days?: number;
    on_demand?: {
      mandate_only: boolean;
      product_price?: number;
      product_currency?: string;
      product_description?: string;
      adaptive_currency_fees_inclusive?: boolean;
    };
  };
  /** Allowed payment method types */
  allowed_payment_method_types?: string[];
  /** Billing address */
  billing_address?: {
    country: string;
    city?: string;
    state?: string;
    street?: string;
    zipcode?: string;
  };
}

export interface DodoCheckoutSessionResponse {
  /** Checkout session ID */
  session_id: string;
  /** Checkout URL to redirect user to (null if payment_method_id is provided) */
  checkout_url: string | null;
}

export interface DodoSubscriptionResponse {
  /** Subscription ID from Dodo */
  subscription_id: string;
  /** Customer ID from Dodo */
  customer_id: string;
  /** Payment session URL to redirect user */
  payment_url: string;
  /** Subscription status */
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  /** Created timestamp */
  created_at: string;
}

export interface DodoWebhookEvent {
  /** Event type */
  type: 'subscription.created' | 'subscription.activated' | 'subscription.cancelled' | 'subscription.expired' | 'payment.succeeded' | 'payment.failed';
  /** Event data */
  data: {
    /** Subscription ID */
    subscription_id: string;
    /** Customer ID */
    customer_id: string;
    /** Payment amount */
    amount?: number;
    /** Currency */
    currency?: string;
    /** Subscription status */
    status?: string;
    /** Metadata passed during creation */
    metadata?: Record<string, string | number>;
  };
  /** Event timestamp */
  created_at: string;
}

export interface DodoSubscriptionDetails {
  /** Subscription ID */
  id: string;
  /** Customer ID */
  customer_id: string;
  /** Product ID */
  product_id: string;
  /** Subscription status */
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'past_due';
  /** Current period start */
  current_period_start: string;
  /** Current period end */
  current_period_end: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Billing interval */
  interval: 'monthly' | 'yearly';
  /** Metadata */
  metadata?: Record<string, string | number>;
  /** Created timestamp */
  created_at: string;
  /** Updated timestamp */
  updated_at: string;
}

export interface DodoCancelSubscriptionResponse {
  /** Subscription ID */
  subscription_id: string;
  /** New status */
  status: 'cancelled';
  /** Cancellation timestamp */
  cancelled_at: string;
}

export interface DodoProductParams {
  /** Product name */
  name: string;
  /** Product description */
  description?: string;
  /** Price configuration - must be recurring_price for subscriptions */
  price: {
    type: 'recurring_price';
    price: number; // Amount in smallest currency unit (e.g., cents for USD) - INTEGER, not object!
    currency: string; // Currency code (ISO 4217)
    discount: number; // Discount percentage (0-100)
    purchasing_power_parity: boolean; // PPP adjustments (currently not available)
    payment_frequency_count: number; // Number of units for payment frequency (e.g., 1 for monthly)
    payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year';
    subscription_period_count: number; // Number of units for subscription period
    subscription_period_interval: 'Day' | 'Week' | 'Month' | 'Year';
    tax_inclusive?: boolean; // Optional: if price is tax inclusive
    trial_period_days?: number; // Optional: trial period in days (0 = no trial)
  };
  /** Tax category (required by Dodo Payments) */
  tax_category: 'digital_products' | 'saas' | 'e_book' | 'edtech';
  /** Metadata for tracking */
  metadata?: Record<string, string>;
}

export interface DodoProductResponse {
  /** Product ID from Dodo */
  product_id: string;
  /** Product name */
  name: string;
  /** Product status */
  status: 'active' | 'inactive';
  /** Created timestamp */
  created_at: string;
}
